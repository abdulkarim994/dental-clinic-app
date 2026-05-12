import { supabase } from './supabase.service'
import { cacheSaveAll, cacheGetAll } from './cache.service'
import { queries, queryWrite, queryRead, abortAllRequests as abortSBQueries, invalidateCache } from './supabase-query.service'

const _dirtyMonths = new Set()
let _debtsDirty = false
let _apptsDirty = false
const _knownMonths = new Set()
const _loadedMonths = new Set()

// ── Concurrent sync guard ──
let _saveLock = false
let _loadLock = false

export function markMonthDirty(dateStr) {
  const month = monthOf(dateStr)
  if (month) _dirtyMonths.add(month)
}

export function markDebtsDirty() {
  _debtsDirty = true
}

export function markApptsDirty() {
  _apptsDirty = true
}

export function monthOf(d) {
  return (d || '').substring(0, 7)
}

export function getKnownMonths() {
  return _knownMonths
}

export function getLoadedMonths() {
  return _loadedMonths
}

export function buildMonthDoc(month, records, prosthetics) {
  return {
    records: records.filter(r => monthOf(r.date) === month),
    prosthetics: prosthetics.filter(p => monthOf(p.date) === month),
    _ts: Date.now(),
  }
}

export function mergeMonthData(month, data, records, prosthetics) {
  if (!data) return { records, prosthetics }
  const newRecords = records.filter(r => monthOf(r.date) !== month)
  const newProsthetics = prosthetics.filter(p => monthOf(p.date) !== month)
  if (data.records) newRecords.push(...data.records)
  if (data.prosthetics) newProsthetics.push(...data.prosthetics)
  return { records: newRecords, prosthetics: newProsthetics }
}

function mergeByMod(existingItems, newItems) {
  if (!Array.isArray(existingItems) || !Array.isArray(newItems)) {
    return newItems || existingItems || []
  }
  const map = new Map()
  for (const item of existingItems) {
    if (item.id) map.set(item.id, item)
  }
  for (const item of newItems) {
    if (!item.id) continue
    const existing = map.get(item.id)
    if (!existing || (item._mod || 0) >= (existing._mod || 0)) {
      map.set(item.id, item)
    }
  }
  return [...map.values()]
}

async function conflictSafeUpsert(uid, dataType, dataKey, newData) {
  const existing = await queryRead(uid, dataType, dataKey, { skipCache: true })
  if (existing && existing._ts && newData._ts && existing._ts > newData._ts) {
    const merged = { ...newData }
    if (Array.isArray(existing.records) && Array.isArray(newData.records)) {
      merged.records = mergeByMod(existing.records, newData.records)
    }
    if (Array.isArray(existing.prosthetics) && Array.isArray(newData.prosthetics)) {
      merged.prosthetics = mergeByMod(existing.prosthetics, newData.prosthetics)
    }
    return queryWrite(uid, dataType, dataKey, { ...merged, _ts: Date.now() })
  }
  return queryWrite(uid, dataType, dataKey, { ...newData, _ts: Date.now() })
}

export async function saveToSupabase(uid, { records, prosthetics, debts, config, appointments }, showOl = false) {
  // Prevent concurrent saves from racing
  if (_saveLock) {
    console.warn('[Sync] Save already in progress, skipping')
    return false
  }
  _saveLock = true

  try {
    const ops = []
    const monthsToSave = showOl
      ? [...new Set([...records.map(r => monthOf(r.date)), ...prosthetics.map(p => monthOf(p.date))])].filter(Boolean)
      : [..._dirtyMonths]

    // Skip save if nothing is dirty and not a forced full sync
    if (!showOl && !monthsToSave.length && !_debtsDirty && !_apptsDirty) {
      return true
    }

    const allKnown = [...new Set([..._knownMonths, ...monthsToSave])].filter(Boolean).sort()
    ops.push(queries.saveIndex(uid, { months: allKnown }))

    for (const m of monthsToSave) {
      const doc = buildMonthDoc(m, records, prosthetics)
      ops.push(conflictSafeUpsert(uid, 'month', m, doc))
      _knownMonths.add(m)
    }

    const savedDebts = showOl || _debtsDirty
    if (savedDebts) {
      ops.push(queries.saveDebts(uid, debts))
    }

    const savedAppts = showOl || _apptsDirty
    if (savedAppts) {
      ops.push(queries.saveAppointments(uid, appointments))
    }

    ops.push(queries.saveConfig(uid, config))

    await Promise.all(ops)

    // Clear dirty flags only after successful save
    if (savedDebts) _debtsDirty = false
    if (savedAppts) _apptsDirty = false
    for (const m of monthsToSave) {
      _dirtyMonths.delete(m)
    }

    return true
  } catch (e) {
    console.error('[Sync] save error:', e)
    return false
  } finally {
    _saveLock = false
  }
}

function getCurrentAndPreviousMonth() {
  const now = new Date()
  const cur = now.toISOString().substring(0, 7)
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7)
  return [cur, prev]
}

async function batchFetchMonths(uid, months, batchSize = 5) {
  const results = []
  for (let i = 0; i < months.length; i += batchSize) {
    const batch = months.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(m => queries.getMonth(uid, m)))
    results.push(...batchResults)
    batch.forEach(m => _loadedMonths.add(m))
  }
  return results
}

export async function loadFromSupabase(uid) {
  // Prevent concurrent loads from racing
  if (_loadLock) {
    console.warn('[Sync] Load already in progress, skipping')
    return { records: [], prosthetics: [], debts: [], config: null, appointments: [] }
  }
  _loadLock = true

  const results = {
    records: [],
    prosthetics: [],
    debts: [],
    config: null,
    appointments: [],
  }

  try {
    const [index, debtsData, apptsData, cfgData] = await Promise.all([
      queries.getIndex(uid),
      queries.getDebts(uid),
      queries.getAppointments(uid),
      queries.getConfig(uid),
    ])

    if (debtsData) results.debts = debtsData
    if (apptsData) results.appointments = apptsData
    if (cfgData) results.config = cfgData

    const months = index?.months || []
    months.forEach(m => _knownMonths.add(m))

    const [curMonth, prevMonth] = getCurrentAndPreviousMonth()
    const initialMonths = months.filter(m => m === curMonth || m === prevMonth)
    const monthResults = await batchFetchMonths(uid, initialMonths)

    monthResults.forEach(data => {
      if (data) {
        if (data.records) results.records.push(...data.records)
        if (data.prosthetics) results.prosthetics.push(...data.prosthetics)
      }
    })
  } catch (e) {
    console.error('[Sync] load error:', e)
  } finally {
    _loadLock = false
  }

  return results
}

export async function ensureMonthLoaded(uid, month) {
  if (_loadedMonths.has(month)) return null
  try {
    const data = await queries.getMonth(uid, month)
    _loadedMonths.add(month)
    return data
  } catch (e) {
    console.error('[Sync] lazy load month error:', e)
    return null
  }
}

export async function loadAllMonths(uid) {
  const results = { records: [], prosthetics: [] }
  const months = [..._knownMonths].filter(m => !_loadedMonths.has(m))
  if (!months.length) return results

  const monthResults = await batchFetchMonths(uid, months)
  monthResults.forEach(data => {
    if (data) {
      if (data.records) results.records.push(...data.records)
      if (data.prosthetics) results.prosthetics.push(...data.prosthetics)
    }
  })
  return results
}

let _activeChannel = null

export function setupRealtimeSubscriptions(uid, onUpdate) {
  // Prevent duplicate subscriptions — clean up existing channel first
  if (_activeChannel) {
    supabase.removeChannel(_activeChannel)
    _activeChannel = null
  }

  const unsubs = []
  let debounceTimer = null
  const DEBOUNCE_MS = 5000
  let _pendingPayloads = []

  function debouncedUpdate(payload) {
    if (payload?.new?.data_type) {
      _pendingPayloads.push(payload.new.data_type)
      // Invalidate query cache for changed types so next read fetches fresh
      invalidateCache(payload.new.data_type, payload?.new?.data_key || null)
    }

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      const changedTypes = [...new Set(_pendingPayloads)]
      _pendingPayloads = []
      onUpdate({ changedTypes })
    }, DEBOUNCE_MS)
  }

  const channel = supabase
    .channel(`user_data_${uid}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_data',
        filter: `user_id=eq.${uid}`,
      },
      debouncedUpdate,
    )
    .subscribe()

  _activeChannel = channel

  unsubs.push(() => {
    clearTimeout(debounceTimer)
    _pendingPayloads = []
    if (_activeChannel === channel) {
      supabase.removeChannel(channel)
      _activeChannel = null
    }
  })
  return unsubs
}

export function clearRealtimeSubscriptions(unsubs) {
  unsubs.forEach(fn => fn())
}
