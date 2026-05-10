/**
 * Database Service — normalized table operations with pagination
 * Replaces the old JSON-blob user_data approach
 */
import { SB } from './supabase.service'

const PAGE_SIZE = 50

// ── RECORDS ──────────────────────────────────────────────────

export async function fetchRecords(userId, { month, page = 0, dateFrom, dateTo } = {}) {
  let q = SB.from('records')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (month) {
    const start = month + '-01'
    const y = parseInt(month.substring(0, 4))
    const m = parseInt(month.substring(5, 7))
    const endDate = new Date(y, m, 0)
    const end = month + '-' + String(endDate.getDate()).padStart(2, '0')
    q = q.gte('date', start).lte('date', end)
  }
  if (dateFrom) q = q.gte('date', dateFrom)
  if (dateTo) q = q.lte('date', dateTo)

  q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data, error, count } = await q
  if (error) { console.error('[DB] fetchRecords:', error); return { data: [], count: 0 } }
  return { data: data || [], count: count || 0 }
}

export async function fetchAllRecords(userId) {
  const all = []
  let page = 0
  while (true) {
    const { data } = await SB.from('records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < 1000) break
    page++
  }
  return all
}

export async function upsertRecord(record) {
  const { error } = await SB.from('records').upsert(record, { onConflict: 'id' })
  if (error) console.error('[DB] upsertRecord:', error)
  return !error
}

export async function deleteRecord(id) {
  const { error } = await SB.from('records').delete().eq('id', id)
  if (error) console.error('[DB] deleteRecord:', error)
  return !error
}

// ── PROSTHETICS ──────────────────────────────────────────────

export async function fetchProsthetics(userId, { month, page = 0, dateFrom, dateTo } = {}) {
  let q = SB.from('prosthetics')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (month) {
    const start = month + '-01'
    const y = parseInt(month.substring(0, 4))
    const m = parseInt(month.substring(5, 7))
    const endDate = new Date(y, m, 0)
    const end = month + '-' + String(endDate.getDate()).padStart(2, '0')
    q = q.gte('date', start).lte('date', end)
  }
  if (dateFrom) q = q.gte('date', dateFrom)
  if (dateTo) q = q.lte('date', dateTo)

  q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data, error, count } = await q
  if (error) { console.error('[DB] fetchProsthetics:', error); return { data: [], count: 0 } }
  return { data: data || [], count: count || 0 }
}

export async function fetchAllProsthetics(userId) {
  const all = []
  let page = 0
  while (true) {
    const { data } = await SB.from('prosthetics')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < 1000) break
    page++
  }
  return all
}

export async function upsertProsthetic(prosthetic) {
  const { error } = await SB.from('prosthetics').upsert(prosthetic, { onConflict: 'id' })
  if (error) console.error('[DB] upsertProsthetic:', error)
  return !error
}

export async function deleteProsthetic(id) {
  const { error } = await SB.from('prosthetics').delete().eq('id', id)
  if (error) console.error('[DB] deleteProsthetic:', error)
  return !error
}

// ── DEBTS ────────────────────────────────────────────────────

export async function fetchDebts(userId, { settled, page = 0 } = {}) {
  let q = SB.from('debts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (settled !== undefined) q = q.eq('settled', settled)

  q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data, error, count } = await q
  if (error) { console.error('[DB] fetchDebts:', error); return { data: [], count: 0 } }
  return { data: data || [], count: count || 0 }
}

export async function fetchAllDebts(userId) {
  const all = []
  let page = 0
  while (true) {
    const { data } = await SB.from('debts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < 1000) break
    page++
  }
  return all
}

export async function upsertDebt(debt) {
  const { error } = await SB.from('debts').upsert(debt, { onConflict: 'id' })
  if (error) console.error('[DB] upsertDebt:', error)
  return !error
}

export async function deleteDebt(id) {
  const { error } = await SB.from('debts').delete().eq('id', id)
  if (error) console.error('[DB] deleteDebt:', error)
  return !error
}

// ── DEBT PAYMENTS ────────────────────────────────────────────

export async function fetchDebtPayments(userId, debtId) {
  const { data, error } = await SB.from('debt_payments')
    .select('*')
    .eq('user_id', userId)
    .eq('debt_id', debtId)
    .order('date', { ascending: true })
  if (error) { console.error('[DB] fetchDebtPayments:', error); return [] }
  return data || []
}

export async function upsertDebtPayment(payment) {
  const { error } = await SB.from('debt_payments').upsert(payment, { onConflict: 'id' })
  if (error) console.error('[DB] upsertDebtPayment:', error)
  return !error
}

export async function deleteDebtPayment(id) {
  const { error } = await SB.from('debt_payments').delete().eq('id', id)
  if (error) console.error('[DB] deleteDebtPayment:', error)
  return !error
}

// ── APPOINTMENTS ─────────────────────────────────────────────

export async function fetchAppointments(userId, { month, date, page = 0 } = {}) {
  let q = SB.from('appointments')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (date) q = q.eq('date', date)
  if (month) {
    const start = month + '-01'
    const y = parseInt(month.substring(0, 4))
    const m = parseInt(month.substring(5, 7))
    const endDate = new Date(y, m, 0)
    const end = month + '-' + String(endDate.getDate()).padStart(2, '0')
    q = q.gte('date', start).lte('date', end)
  }

  q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data, error, count } = await q
  if (error) { console.error('[DB] fetchAppointments:', error); return { data: [], count: 0 } }
  return { data: data || [], count: count || 0 }
}

export async function fetchAllAppointments(userId) {
  const all = []
  let page = 0
  while (true) {
    const { data } = await SB.from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < 1000) break
    page++
  }
  return all
}

export async function upsertAppointment(appointment) {
  const { error } = await SB.from('appointments').upsert(appointment, { onConflict: 'id' })
  if (error) console.error('[DB] upsertAppointment:', error)
  return !error
}

export async function deleteAppointment(id) {
  const { error } = await SB.from('appointments').delete().eq('id', id)
  if (error) console.error('[DB] deleteAppointment:', error)
  return !error
}

// ── USER CONFIG ──────────────────────────────────────────────

export async function fetchConfig(userId) {
  const { data, error } = await SB.from('user_config')
    .select('config')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) { console.error('[DB] fetchConfig:', error); return null }
  return data?.config || null
}

export async function saveConfig(userId, config) {
  const { error } = await SB.from('user_config')
    .upsert({ user_id: userId, config, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) console.error('[DB] saveConfig:', error)
  return !error
}

// ── XRAY IMAGES ──────────────────────────────────────────────

export async function fetchXrayImages(userId, patientName) {
  let q = SB.from('xray_images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (patientName) q = q.eq('patient_name', patientName)

  const { data, error } = await q
  if (error) { console.error('[DB] fetchXrayImages:', error); return [] }
  return data || []
}

export async function insertXrayImage(image) {
  const { error } = await SB.from('xray_images').insert(image)
  if (error) console.error('[DB] insertXrayImage:', error)
  return !error
}

export async function deleteXrayImage(id) {
  const { error } = await SB.from('xray_images').delete().eq('id', id)
  if (error) console.error('[DB] deleteXrayImage:', error)
  return !error
}

// ── PATIENT SEARCH (across tables) ───────────────────────────

export async function searchPatients(userId, query, limit = 20) {
  const pattern = `%${query}%`

  const [recs, pros] = await Promise.all([
    SB.from('records').select('name').eq('user_id', userId).ilike('name', pattern).limit(limit),
    SB.from('prosthetics').select('name').eq('user_id', userId).ilike('name', pattern).limit(limit)
  ])

  const names = new Set()
  ;(recs.data || []).forEach(r => names.add(r.name))
  ;(pros.data || []).forEach(p => names.add(p.name))
  return [...names].sort()
}

export async function getUniquePatientNames(userId) {
  const [recs, pros] = await Promise.all([
    SB.from('records').select('name').eq('user_id', userId),
    SB.from('prosthetics').select('name').eq('user_id', userId)
  ])

  const names = new Set()
  ;(recs.data || []).forEach(r => names.add(r.name))
  ;(pros.data || []).forEach(p => names.add(p.name))
  return [...names].sort()
}

export async function getPatientRecords(userId, patientName) {
  const [recs, pros] = await Promise.all([
    SB.from('records').select('*').eq('user_id', userId).eq('name', patientName).order('date', { ascending: false }),
    SB.from('prosthetics').select('*').eq('user_id', userId).eq('name', patientName).order('date', { ascending: false })
  ])

  return [
    ...(recs.data || []).map(r => ({ ...r, _t: 'r' })),
    ...(pros.data || []).map(p => ({ ...p, _t: 'p' }))
  ].sort((a, b) => (a.date > b.date ? -1 : 1))
}
