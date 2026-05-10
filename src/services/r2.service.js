/**
 * Cloudflare R2 Service — handles X-ray image uploads and retrieval
 */
const R2_WORKER = 'https://dental-xray-worker.dental-clinic-app.workers.dev'

/**
 * Build authenticated R2 URL for an image
 */
export function r2Url(key, token) {
  return R2_WORKER + '/image/' + encodeURIComponent(key) + '?token=' + encodeURIComponent(token)
}

/**
 * Upload an image to R2
 */
export async function uploadImage(key, file, token) {
  const url = R2_WORKER + '/upload'
  const formData = new FormData()
  formData.append('file', file)
  formData.append('key', key)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }
  return response.json()
}

/**
 * Delete an image from R2
 */
export async function deleteImage(key, token) {
  const url = R2_WORKER + '/delete'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key })
  })

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`)
  }
  return response.json()
}
