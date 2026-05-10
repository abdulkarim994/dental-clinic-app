import { r2Url, uploadImage, deleteImage, compressImage, createThumbnail } from './r2.service'

const _imageCache = new Map()
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
  const url = r2Url(key)
  _imageCache.set(key, url)
  evictOldest()
  return url
}

export async function uploadXrayImage(file, patientName, uid) {
  const compressed = await compressImage(file, 1600, 0.85)
  const key = `xray/${uid}/${patientName}/${Date.now()}_${file.name}`
  await uploadImage(compressed, key)
  return key
}

export async function uploadThumbnailImage(file, patientName, uid) {
  const thumb = await createThumbnail(file)
  const key = `thumb/${uid}/${patientName}/${Date.now()}_${file.name}`
  await uploadImage(thumb, key)
  return key
}

export async function deleteXrayImage(key) {
  _imageCache.delete(key)
  await deleteImage(key)
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
