import { uploadXrayImage, deleteXrayImage, getImageUrl, getThumbnailUrl } from '@/services/image.service'

export async function uploadXray(file, patientName, uid) {
  return uploadXrayImage(file, patientName, uid)
}

export async function deleteXray(key) {
  return deleteXrayImage(key)
}

export function getXrayUrl(key) {
  return getImageUrl(key)
}

export function getXrayThumbnail(key) {
  return getThumbnailUrl(key)
}
