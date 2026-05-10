const PREFIX = 'dental_'

function key(uid, type) {
  return `${PREFIX}${uid}_${type}`
}

export function cacheGet(uid, type) {
  try {
    const raw = localStorage.getItem(key(uid, type))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function cacheSet(uid, type, data) {
  try {
    localStorage.setItem(key(uid, type), JSON.stringify(data))
  } catch (e) {
    console.warn('[Cache] Storage full or unavailable:', e)
  }
}

export function cacheClear(uid) {
  const prefix = `${PREFIX}${uid}_`
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(prefix)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

export function cacheGetAll(uid) {
  return {
    records: cacheGet(uid, 'rec') || [],
    prosthetics: cacheGet(uid, 'pro') || [],
    debts: cacheGet(uid, 'dbt') || [],
    config: cacheGet(uid, 'cfg'),
    appointments: cacheGet(uid, 'appt') || [],
  }
}

export function cacheSaveAll(uid, { records, prosthetics, debts, config, appointments }) {
  if (records) cacheSet(uid, 'rec', records)
  if (prosthetics) cacheSet(uid, 'pro', prosthetics)
  if (debts) cacheSet(uid, 'dbt', debts)
  if (config) cacheSet(uid, 'cfg', config)
  if (appointments) cacheSet(uid, 'appt', appointments)
}
