/**
 * Sync Service — handles data synchronization between local and Supabase
 * Phase 2: Uses normalized tables instead of JSON blobs
 */
import { SB } from './supabase.service'
import {
  fetchAllRecords, fetchAllProsthetics, fetchAllDebts,
  fetchAllAppointments, fetchConfig, saveConfig,
  upsertRecord, upsertProsthetic, upsertDebt, upsertAppointment
} from './database.service'

/**
 * Extract month (YYYY-MM) from date string
 */
export function monthOf(d) {
  return (d || '').substring(0, 7)
}

/**
 * Save all dirty data to Supabase normalized tables
 */
export async function saveToSupabase(userId, {
  records, prosthetics, debts, appointments, cfg,
  dirtyRecords, dirtyProsthetics, dirtyDebts, dirtyAppointments, cfgDirty,
  showOl = false, onProgress
}) {
  if (!userId) return false

  const hasDirty = (dirtyRecords && dirtyRecords.size > 0) ||
    (dirtyProsthetics && dirtyProsthetics.size > 0) ||
    (dirtyDebts && dirtyDebts.size > 0) ||
    (dirtyAppointments && dirtyAppointments.size > 0) ||
    cfgDirty

  if (!showOl && !hasDirty) return true

  try {
    if (onProgress) onProgress(0)
    const ops = []

    if (showOl) {
      // Full sync — upsert everything
      for (const r of records) {
        ops.push(upsertRecord({ ...r, user_id: userId }))
      }
      for (const p of prosthetics) {
        ops.push(upsertProsthetic({ ...p, user_id: userId }))
      }
      if (onProgress) onProgress(30)
      for (const d of debts) {
        ops.push(upsertDebt({ ...d, user_id: userId }))
      }
      for (const a of appointments) {
        ops.push(upsertAppointment({ ...a, user_id: userId }))
      }
      ops.push(saveConfig(userId, cfg))
    } else {
      // Incremental sync — only dirty items
      if (dirtyRecords) {
        for (const id of dirtyRecords) {
          const rec = records.find(r => r.id === id)
          if (rec) ops.push(upsertRecord({ ...rec, user_id: userId }))
        }
      }
      if (dirtyProsthetics) {
        for (const id of dirtyProsthetics) {
          const pro = prosthetics.find(p => p.id === id)
          if (pro) ops.push(upsertProsthetic({ ...pro, user_id: userId }))
        }
      }
      if (onProgress) onProgress(30)
      if (dirtyDebts) {
        for (const id of dirtyDebts) {
          const debt = debts.find(d => d.id === id)
          if (debt) ops.push(upsertDebt({ ...debt, user_id: userId }))
        }
      }
      if (dirtyAppointments) {
        for (const id of dirtyAppointments) {
          const appt = appointments.find(a => a.id === id)
          if (appt) ops.push(upsertAppointment({ ...appt, user_id: userId }))
        }
      }
      if (cfgDirty) ops.push(saveConfig(userId, cfg))
    }

    if (onProgress) onProgress(60)

    // Execute in batches of 20 to avoid overwhelming the API
    for (let i = 0; i < ops.length; i += 20) {
      await Promise.all(ops.slice(i, i + 20))
    }

    if (onProgress) onProgress(100)
    return true
  } catch (e) {
    console.error('[SB] save:', e)
    return false
  }
}

/**
 * Load all data from Supabase normalized tables
 */
export async function loadFromSupabase(userId, { cfg, onProgress }) {
  if (!userId) return null

  try {
    if (onProgress) onProgress(20)

    const [cfgData, allRecords, allProsthetics] = await Promise.all([
      fetchConfig(userId),
      fetchAllRecords(userId),
      fetchAllProsthetics(userId)
    ])

    const mergedCfg = cfgData ? { ...cfg, ...cfgData } : cfg

    if (onProgress) onProgress(50)

    const [allDebts, allAppointments] = await Promise.all([
      fetchAllDebts(userId),
      fetchAllAppointments(userId)
    ])

    if (onProgress) onProgress(90)

    return {
      cfg: mergedCfg,
      records: allRecords,
      prosthetics: allProsthetics,
      debts: allDebts,
      appointments: allAppointments
    }
  } catch (e) {
    console.error('[SB] load:', e)
    return null
  }
}

/**
 * Setup Supabase Realtime subscriptions for all normalized tables
 */
export function setupRealtime(userId, onChange) {
  if (!userId) return null

  const tables = ['records', 'prosthetics', 'debts', 'debt_payments', 'appointments', 'user_config']
  const channels = []

  for (const table of tables) {
    const channel = SB.channel(`${table}_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: 'user_id=eq.' + userId
      }, payload => {
        onChange({ ...payload, table })
      })
      .subscribe(status => {
        if (status !== 'SUBSCRIBED') console.warn(`[RT:${table}]`, status)
      })
    channels.push(channel)
  }

  return channels
}

/**
 * Remove realtime channels
 */
export function clearRealtime(channels) {
  if (channels && Array.isArray(channels)) {
    channels.forEach(ch => SB.removeChannel(ch))
  } else if (channels) {
    SB.removeChannel(channels)
  }
}
