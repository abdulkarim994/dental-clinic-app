import { getSbToken } from './supabase.service'
import { supabase } from './supabase.service'

const R2_WORKER = import.meta.env.VITE_R2_WORKER || 'https://dental-xray-worker.dental-clinic-app.workers.dev'

async function refreshToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || getSbToken()
  } catch {
    return getSbToken()
  }
}

export function r2Url(key) {
  return `${R2_WORKER}/image/${encodeURIComponent(key)}?token=${encodeURIComponent(getSbToken())}`
}

/**
 * Fetch an image using Authorization header (more secure than URL token).
 * Returns a blob URL suitable for <img src>. Falls back to direct URL.
 */
export async function fetchImageSecure(key) {
  try {
    const token = await refreshToken()
    const res = await fetch(`${R2_WORKER}/image/${encodeURIComponent(key)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch {
    return r2Url(key)
  }
}

export async function uploadImage(file, key, patientName, fileName) {
  const token = await refreshToken()

  const res = await fetch(`${R2_WORKER}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': file.type || 'image/jpeg',
      'X-Patient-Name': encodeURIComponent(patientName || ''),
      'X-File-Name': encodeURIComponent(fileName || ''),
    },
    body: file,
  })

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return await res.json()
}

export async function deleteImage(key) {
  const token = await refreshToken()
  const res = await fetch(`${R2_WORKER}/image/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}

export async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    img.src = url
  })
}

export function createThumbnail(file, size = 150) {
  return compressImage(file, size, 0.6)
}
