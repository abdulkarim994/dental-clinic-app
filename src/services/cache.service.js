import { cachePatients, getCachedPatients, cacheAppointments, getCachedAppointments, cacheDebts, getCachedDebts, initDB } from './sqlite.service'
import { cacheSupabaseData } from './background-sync.service'

const PREFIX = 'dental_'
let _idbReady = false

export async function initCache() {
  _idbReady = await initDB()
}

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
    const k = key(uid, type)
    localStorage.setItem(k, JSON.stringify(data))
    localStorage.setItem(`${k}_ts`, String(Date.now()))
  } catch (e) {
    console.warn('[Cache] Storage full or unavailable:', e)
  }
}

export function getAge(uid, type) {
  try {
    const ts = localStorage.getItem(`${key(uid, type)}_ts`)
    return ts ? Date.now() - Number(ts) : Infinity
  } catch {
    return Infinity
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
  // Only cache config in localStorage (small). Large arrays use IndexedDB + repos.
  if (config) cacheSet(uid, 'cfg', config)
  // Cache record/debt counts for quick offline display without full deserialization
  if (records) cacheSet(uid, 'rec_count', records.length)
  if (debts) cacheSet(uid, 'dbt_count', debts.length)

  if (_idbReady) {
    const patientMap = new Map()
    const allRecs = [...(records || []), ...(prosthetics || [])]
    for (const r of allRecs) {
      if (!r.name) continue
      const existing = patientMap.get(r.name) || { id: r.name, name: r.name, records: [], lastVisit: null }
      existing.records.push(r.id)
      if (!existing.lastVisit || r.date > existing.lastVisit) existing.lastVisit = r.date
      patientMap.set(r.name, existing)
    }
    cachePatients([...patientMap.values()]).catch(() => {})
    if (appointments) cacheAppointments(appointments).catch(() => {})
    if (debts) cacheDebts(debts).catch(() => {})
  }

  // Also populate the new repository layer (non-blocking, safe to fail)
  cacheSupabaseData({ records, prosthetics, appointments }).catch(() => {})
}

export async function getCachedPatientsFromDB() {
  if (!_idbReady) return []
  try {
    return await getCachedPatients()
  } catch {
    return []
  }
}

export async function getCachedAppointmentsFromDB() {
  if (!_idbReady) return []
  try {
    return await getCachedAppointments()
  } catch {
    return []
  }
}

export async function getCachedDebtsFromDB() {
  if (!_idbReady) return []
  try {
    return await getCachedDebts()
  } catch {
    return []
  }
}

// ── Patient Photo Storage ──
// Lightweight localStorage helpers. Kept here (not in image.service) to avoid
// pulling the 206KB image-services chunk into the store startup path.

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
    console.warn('[Cache] Cannot save patient photo to storage')
  }
}
