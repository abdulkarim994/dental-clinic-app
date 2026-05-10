import { sbUpsert, sbGet, supabase } from './supabase.service'
import { cacheSaveAll, cacheGetAll } from './cache.service'

const _dirtyMonths = new Set()
let _debtsDirty = false
let _apptsDirty = false
const _knownMonths = new Set()

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

export async function saveToSupabase(uid, { records, prosthetics, debts, config, appointments }, showOl = false) {
  const ops = []
  const monthsToSave = showOl
    ? [...new Set([...records.map(r => monthOf(r.date)), ...prosthetics.map(p => monthOf(p.date))])].filter(Boolean)
    : [..._dirtyMonths]

  const allKnown = [...new Set([..._knownMonths, ...monthsToSave])].filter(Boolean).sort()
  ops.push(sbUpsert(uid, 'index', '', { months: allKnown }))

  for (const m of monthsToSave) {
    ops.push(sbUpsert(uid, 'month', m, buildMonthDoc(m, records, prosthetics)))
    _knownMonths.add(m)
  }

  if (showOl || _debtsDirty) {
    ops.push(sbUpsert(uid, 'debts', '', debts))
    _debtsDirty = false
  }

  if (showOl || _apptsDirty) {
    ops.push(sbUpsert(uid, 'appointments', '', appointments))
    _apptsDirty = false
  }

  ops.push(sbUpsert(uid, 'config', '', config))
  _dirtyMonths.clear()

  try {
    await Promise.all(ops)
    return true
  } catch (e) {
    console.error('[Sync] save error:', e)
    return false
  }
}

export async function loadFromSupabase(uid) {
  const results = {
    records: [],
    prosthetics: [],
    debts: [],
    config: null,
    appointments: [],
  }

  try {
    const [index, debtsData, apptsData, cfgData] = await Promise.all([
      sbGet(uid, 'index', ''),
      sbGet(uid, 'debts', ''),
      sbGet(uid, 'appointments', ''),
      sbGet(uid, 'config', ''),
    ])

    if (debtsData) results.debts = debtsData
    if (apptsData) results.appointments = apptsData
    if (cfgData) results.config = cfgData

    const months = index?.months || []
    months.forEach(m => _knownMonths.add(m))

    const monthOps = months.map(m => sbGet(uid, 'month', m))
    const monthResults = await Promise.all(monthOps)

    monthResults.forEach(data => {
      if (data) {
        if (data.records) results.records.push(...data.records)
        if (data.prosthetics) results.prosthetics.push(...data.prosthetics)
      }
    })
  } catch (e) {
    console.error('[Sync] load error:', e)
  }

  return results
}

export function setupRealtimeSubscriptions(uid, onUpdate) {
  const unsubs = []

  const channel = supabase
    .channel('user_data_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_data',
        filter: `user_id=eq.${uid}`,
      },
      (payload) => {
        onUpdate(payload)
      },
    )
    .subscribe()

  unsubs.push(() => supabase.removeChannel(channel))
  return unsubs
}

export function clearRealtimeSubscriptions(unsubs) {
  unsubs.forEach(fn => fn())
}
