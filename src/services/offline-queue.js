const QUEUE_KEY = 'dental_sync_queue'

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

export function addToQueue(action) {
  const queue = getQueue()
  queue.push({ ...action, ts: Date.now(), retries: 0 })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export function removeFromQueue(ts) {
  const queue = getQueue().filter(q => q.ts !== ts)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function isOnline() {
  return navigator.onLine !== false
}

let _listeners = []
export function onOnlineStatusChange(cb) {
  const onOnline = () => cb(true)
  const onOffline = () => cb(false)
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  _listeners.push({ onOnline, onOffline })
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

export async function processQueue(syncFn) {
  if (!isOnline()) return false
  const queue = getQueue()
  if (!queue.length) return true
  let allOk = true
  for (const item of queue) {
    try {
      await syncFn(item)
      removeFromQueue(item.ts)
    } catch {
      item.retries = (item.retries || 0) + 1
      if (item.retries > 5) removeFromQueue(item.ts)
      allOk = false
    }
  }
  return allOk
}
