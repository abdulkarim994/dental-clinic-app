/**
 * Sync Service — handles data synchronization between local and Supabase
 * Manages month-based document structure, dirty tracking, and realtime
 */
import { SB, sbUpsert, sbGet } from './supabase.service'

/**
 * Build month document from records arrays
 */
export function buildMonthDoc(records, prosthetics, month) {
  return {
    records: records.filter(r => monthOf(r.date) === month),
    prosthetics: prosthetics.filter(p => monthOf(p.date) === month),
    _mod: Date.now()
  }
}

/**
 * Extract month (YYYY-MM) from date string
 */
export function monthOf(d) {
  return (d || '').substring(0, 7)
}

/**
 * Save data to Supabase — saves only dirty months for efficiency
 */
export async function saveToSupabase(userId, { records, prosthetics, debts, appointments, cfg, dirtyMonths, knownMonths, debtsDirty, apptsDirty, showOl = false, onProgress }) {
  if (!userId) return false
  if (!showOl && dirtyMonths.size === 0 && !debtsDirty && !apptsDirty) return true

  try {
    if (onProgress) onProgress(0)
    const ops = []

    const monthsToSave = showOl
      ? [...new Set([
          ...records.map(r => monthOf(r.date)),
          ...prosthetics.map(p => monthOf(p.date))
        ])].filter(Boolean)
      : [...dirtyMonths].filter(Boolean)

    monthsToSave.forEach(m => {
      ops.push(sbUpsert(userId, 'months', m, buildMonthDoc(records, prosthetics, m)))
      knownMonths.add(m)
    })

    const allKnown = [...new Set([...knownMonths, ...monthsToSave])].filter(Boolean).sort()
    ops.push(sbUpsert(userId, 'months_idx', '', { months: allKnown, _mod: Date.now() }))

    if (onProgress) onProgress(50)

    if (showOl || debtsDirty) {
      ops.push(sbUpsert(userId, 'debts', '', { debts, _mod: Date.now() }))
    }
    if (showOl || apptsDirty) {
      ops.push(sbUpsert(userId, 'appointments', '', { items: appointments, _mod: Date.now() }))
    }
    ops.push(sbUpsert(userId, 'config', '', cfg))

    if (onProgress) onProgress(80)
    await Promise.all(ops)
    if (onProgress) onProgress(100)
    return true
  } catch (e) {
    console.error('[SB] save:', e)
    return false
  }
}

/**
 * Load data from Supabase
 */
export async function loadFromSupabase(userId, { records, prosthetics, cfg, knownMonths, onProgress }) {
  if (!userId) return null

  try {
    if (onProgress) onProgress(20)

    const cfgData = await sbGet(userId, 'config', '')
    const mergedCfg = cfgData ? { ...cfg, ...cfgData } : cfg

    if (onProgress) onProgress(35)

    const debtsData = await sbGet(userId, 'debts', '')
    const debts = debtsData ? (debtsData.debts || []) : []

    const apptData = await sbGet(userId, 'appointments', '')
    const appointments = apptData ? (apptData.items || []) : []

    if (onProgress) onProgress(50)

    const curMonth = new Date().toISOString().substring(0, 7)
    const curData = await sbGet(userId, 'months', curMonth)

    let mergedRecords = [...records]
    let mergedProsthetics = [...prosthetics]

    if (curData) {
      mergedRecords = mergedRecords.filter(r => monthOf(r.date) !== curMonth)
      mergedProsthetics = mergedProsthetics.filter(p => monthOf(p.date) !== curMonth)
      mergedRecords.push(...(curData.records || []))
      mergedProsthetics.push(...(curData.prosthetics || []))
    }

    const idxData = await sbGet(userId, 'months_idx', '')
    const newKnownMonths = new Set(knownMonths)
    if (idxData) {
      const idxMonths = idxData.months || []
      idxMonths.forEach(m => {
        if (m !== curMonth && !newKnownMonths.has(m)) newKnownMonths.add(m)
      })
    }

    if (onProgress) onProgress(90)

    return {
      cfg: mergedCfg,
      debts,
      appointments,
      records: mergedRecords,
      prosthetics: mergedProsthetics,
      knownMonths: newKnownMonths
    }
  } catch (e) {
    console.error('[SB] load:', e)
    return null
  }
}

/**
 * Setup Supabase Realtime subscription for user data changes
 */
export function setupRealtime(userId, onChange) {
  if (!userId) return null

  const channel = SB.channel('user_data_' + userId)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_data',
      filter: 'user_id=eq.' + userId
    }, payload => {
      onChange(payload)
    })
    .subscribe(status => {
      if (status !== 'SUBSCRIBED') console.warn('[RT]', status)
    })

  return channel
}

/**
 * Remove a realtime channel
 */
export function clearRealtime(channel) {
  if (channel) {
    SB.removeChannel(channel)
  }
}
