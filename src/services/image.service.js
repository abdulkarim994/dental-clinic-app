import { r2Url, fetchImageSecure, uploadImage, deleteImage, compressImage, createThumbnail } from './r2.service'
import { saveThumbnailToIDB, getThumbnailFromIDB, removeThumbnailFromIDB } from './image-pipeline.service'
import { saveXrayFallback, getXrayFallback, removeXrayFallback } from './sqlite.service'

const _imageCache = new Map()
const _thumbPromises = new Map() // Async thumbnail resolution cache
const MAX_CACHE_SIZE = 100

function evictOldest() {
  if (_imageCache.size <= MAX_CACHE_SIZE) return
  const oldest = _imageCache.keys().next().value
  _imageCache.delete(oldest)
}

export function getCachedImageUrl(key) {
  return _imageCache.get(key)
}

export function getImageUrl(key) {
  if (_imageCache.has(key)) return _imageCache.get(key)
  const localData = getLocalXrayData(key)
  if (localData) {
    _imageCache.set(key, localData)
    evictOldest()
    return localData
  }
  // Return immediate URL for sync rendering, then upgrade to secure blob in background
  const url = r2Url(key)
  _imageCache.set(key, url)
  evictOldest()
  // Async upgrade: check IndexedDB, then fetch secure blob
  getLocalXrayDataAsync(key).then(idbData => {
    if (idbData) {
      _imageCache.set(key, idbData)
      return
    }
    return fetchImageSecure(key).then(blobUrl => {
      if (blobUrl && blobUrl !== url) {
        // Revoke old blob URL if we're replacing one
        if (url.startsWith('blob:')) _revokeTrackedBlob(url)
        _imageCache.set(key, blobUrl)
        _trackBlob(blobUrl)
      }
    })
  }).catch(() => {})
  return url
}

function fileToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function saveLocalXrayData(key, dataUrl) {
  try {
    await saveXrayFallback(key, dataUrl)
  } catch {
    // Last resort: try localStorage (may fail on quota)
    try { localStorage.setItem(`dental_xray_${key}`, dataUrl) } catch { /* ignore */ }
  }
}

function getLocalXrayData(key) {
  // Sync check: localStorage only (for backward compatibility)
  try {
    return localStorage.getItem(`dental_xray_${key}`) || null
  } catch {
    return null
  }
}

async function getLocalXrayDataAsync(key) {
  // Check localStorage first, then IndexedDB
  const lsData = getLocalXrayData(key)
  if (lsData) return lsData
  try {
    return await getXrayFallback(key)
  } catch {
    return null
  }
}

async function removeLocalXrayData(key) {
  try { await removeXrayFallback(key) } catch { /* ignore */ }
  try { localStorage.removeItem(`dental_xray_${key}`) } catch { /* ignore */ }
}

function saveThumbnailData(key, dataUrl) {
  // Save to IndexedDB (larger capacity) with localStorage fallback
  saveThumbnailToIDB(key, dataUrl).catch(() => {
    try {
      localStorage.setItem(`dental_xray_thumb_${key}`, dataUrl)
    } catch {
      console.warn('[Image] Cannot save thumbnail')
    }
  })
}

function getThumbnailData(key) {
  // Synchronous check: localStorage first (for backward compatibility)
  try {
    return localStorage.getItem(`dental_xray_thumb_${key}`) || null
  } catch {
    return null
  }
}

/**
 * Async thumbnail resolver — checks IndexedDB if localStorage miss.
 * Returns a promise. Components should use this for progressive loading.
 */
export async function getThumbnailAsync(key) {
  // Check in-flight resolution
  if (_thumbPromises.has(key)) return _thumbPromises.get(key)

  const promise = (async () => {
    // 1. Memory cache
    const cached = _imageCache.get(`thumb:${key}`)
    if (cached) return cached

    // 2. localStorage (sync, fast)
    const lsData = getThumbnailData(key)
    if (lsData) {
      _imageCache.set(`thumb:${key}`, lsData)
      return lsData
    }

    // 3. IndexedDB (async, larger capacity)
    const idbData = await getThumbnailFromIDB(key)
    if (idbData) {
      _imageCache.set(`thumb:${key}`, idbData)
      evictOldest()
      return idbData
    }

    // 4. Fallback to full image URL
    return null
  })().finally(() => {
    _thumbPromises.delete(key)
  })

  _thumbPromises.set(key, promise)
  return promise
}

function removeThumbnailData(key) {
  // Remove from both stores
  removeThumbnailFromIDB(key).catch(() => {})
  try {
    localStorage.removeItem(`dental_xray_thumb_${key}`)
  } catch { /* ignore */ }
}

// ── Blob URL tracking (memory leak prevention) ──

const _trackedBlobs = new Set()

function _trackBlob(url) {
  if (url && url.startsWith('blob:')) _trackedBlobs.add(url)
}

function _revokeTrackedBlob(url) {
  if (_trackedBlobs.has(url)) {
    try { URL.revokeObjectURL(url) } catch { /* ignore */ }
    _trackedBlobs.delete(url)
  }
}

export function revokeAllImageBlobs() {
  for (const url of _trackedBlobs) {
    try { URL.revokeObjectURL(url) } catch { /* ignore */ }
  }
  _trackedBlobs.clear()
}

export function getTrackedBlobCount() {
  return _trackedBlobs.size
}

export function getThumbnailUrl(key) {
  // Check memory cache first
  const memCached = _imageCache.get(`thumb:${key}`)
  if (memCached) return memCached

  // Synchronous check: localStorage
  const thumbData = getThumbnailData(key)
  if (thumbData) {
    _imageCache.set(`thumb:${key}`, thumbData)
    return thumbData
  }

  // Fallback to R2 URL (full image) — async path handled by getThumbnailAsync
  return getImageUrl(key)
}

export async function uploadXrayImage(file, patientName, uid) {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('الصورة أكبر من 5MB')
  }
  const key = `xray/${uid}/${patientName}/${Date.now()}_${file.name}`

  // Smart compression: skip if result would be larger
  let compressed
  try {
    compressed = await compressImage(file, 1200, 0.75)
    if (compressed && compressed.size >= file.size) {
      compressed = file // Original is smaller, use it
    }
  } catch {
    compressed = file
  }

  // Generate thumbnail and save to IndexedDB + localStorage
  try {
    const thumbBlob = await createThumbnail(file, 150)
    if (thumbBlob) {
      const thumbDataUrl = await fileToDataUrl(thumbBlob)
      saveThumbnailData(key, thumbDataUrl)
      _imageCache.set(`thumb:${key}`, thumbDataUrl)
    }
  } catch (err) {
    console.warn('[Image] Thumbnail creation failed:', err.message)
  }

  try {
    const result = await uploadImage(compressed, key, patientName, file.name)
    if (result.success && result.key) {
      return result.key
    }
  } catch (err) {
    console.warn('[Image] R2 upload failed, using localStorage fallback:', err.message)
  }

  const dataUrl = await fileToDataUrl(compressed)
  saveLocalXrayData(key, dataUrl)
  _imageCache.set(key, dataUrl)
  return key
}

/**
 * Load an image securely via Authorization header instead of token-in-URL.
 * Returns a blob URL. Falls back to r2Url if the secure fetch fails.
 * Use this for sensitive image contexts where URL leakage is a concern.
 */
export async function getImageSecure(key) {
  if (_imageCache.has(`secure:${key}`)) return _imageCache.get(`secure:${key}`)
  const localData = await getLocalXrayDataAsync(key)
  if (localData) return localData
  const blobUrl = await fetchImageSecure(key)
  if (blobUrl) {
    _imageCache.set(`secure:${key}`, blobUrl)
    _trackBlob(blobUrl)
    evictOldest()
  }
  return blobUrl || getImageUrl(key)
}

export async function deleteXrayImage(key) {
  // Revoke any tracked blob URLs for this key
  const cachedUrl = _imageCache.get(key)
  if (cachedUrl) _revokeTrackedBlob(cachedUrl)
  const secureUrl = _imageCache.get(`secure:${key}`)
  if (secureUrl) _revokeTrackedBlob(secureUrl)

  _imageCache.delete(key)
  _imageCache.delete(`secure:${key}`)
  _imageCache.delete(`thumb:${key}`)
  await removeLocalXrayData(key)
  removeThumbnailData(key)
  try {
    await deleteImage(key)
  } catch {
    // R2 delete failed silently — local already removed
  }
}

export function getPatientPhotoFromStorage(name) {
  try {
    return localStorage.getItem(`dental_photo_${name}`) || null
  } catch {
    return null
  }
}

export function savePatientPhotoToStorage(name, dataUrl) {
  try {
    localStorage.setItem(`dental_photo_${name}`, dataUrl)
  } catch {
    console.warn('[Image] Cannot save patient photo to storage')
  }
}
