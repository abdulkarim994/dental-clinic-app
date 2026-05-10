import { getSbToken } from './supabase.service'

const R2_WORKER = import.meta.env.VITE_R2_WORKER || 'https://dental-xray-worker.dental-clinic-app.workers.dev'

export function r2Url(key) {
  return `${R2_WORKER}/image/${encodeURIComponent(key)}?token=${encodeURIComponent(getSbToken())}`
}

export async function uploadImage(file, key) {
  const token = getSbToken()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('key', key)

  const res = await fetch(`${R2_WORKER}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return await res.json()
}

export async function deleteImage(key) {
  const token = getSbToken()
  const res = await fetch(`${R2_WORKER}/delete/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
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
