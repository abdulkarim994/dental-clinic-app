const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch])
}

export function sanitizeInput(val) {
  if (typeof val !== 'string') return val
  return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

export function sanitizeRecord(record) {
  if (!record || typeof record !== 'object') return record
  const sanitized = { ...record }
  const textFields = ['name', 'notes', 'diagnosis', 'service', 'clinic', 'phone']
  for (const f of textFields) {
    if (typeof sanitized[f] === 'string') {
      sanitized[f] = sanitizeInput(sanitized[f])
    }
  }
  if (typeof sanitized.amount === 'string') {
    sanitized.amount = Number(sanitized.amount) || 0
  }
  return sanitized
}

export function sanitizeDebt(debt) {
  if (!debt || typeof debt !== 'object') return debt
  const sanitized = { ...debt }
  const textFields = ['name', 'notes', 'service', 'phone']
  for (const f of textFields) {
    if (typeof sanitized[f] === 'string') {
      sanitized[f] = sanitizeInput(sanitized[f])
    }
  }
  for (const numField of ['totalAmount', 'total', 'paidAmount', 'remaining']) {
    if (numField in sanitized && typeof sanitized[numField] === 'string') {
      sanitized[numField] = Number(sanitized[numField]) || 0
    }
  }
  return sanitized
}

export function sanitizeAppointment(appt) {
  if (!appt || typeof appt !== 'object') return appt
  const sanitized = { ...appt }
  const textFields = ['name', 'notes', 'service', 'phone']
  for (const f of textFields) {
    if (typeof sanitized[f] === 'string') {
      sanitized[f] = sanitizeInput(sanitized[f])
    }
  }
  if (sanitized.date && typeof sanitized.date === 'string') {
    sanitized.date = sanitized.date.replace(/[^0-9\-]/g, '').substring(0, 10)
  }
  if (sanitized.time && typeof sanitized.time === 'string') {
    sanitized.time = sanitized.time.replace(/[^0-9:]/g, '').substring(0, 5)
  }
  return sanitized
}

export function validatePhone(phone) {
  if (!phone) return true
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^[+]?\d{6,15}$/.test(cleaned)
}

export function validateAmount(amount) {
  const num = Number(amount)
  return !isNaN(num) && num >= 0 && num < 1e9
}

export function validateRecords(data) {
  if (!Array.isArray(data)) return []
  return data.filter(r => r && r.id && r.date && r.name)
}

export function validateDebts(data) {
  if (!Array.isArray(data)) return []
  return data.filter(d => d && d.id && d.name)
}

export function validateAppointments(data) {
  if (!Array.isArray(data)) return []
  return data.filter(a => a && a.id && a.date)
}

export function validateConfig(config) {
  if (!config || typeof config !== 'object') return null
  const clean = { ...config }
  if (clean.centerName && typeof clean.centerName === 'string') {
    clean.centerName = sanitizeInput(clean.centerName)
  }
  if (clean.syncMin !== undefined) {
    clean.syncMin = Math.max(1, Math.min(Number(clean.syncMin) || 30, 1440))
  }
  return clean
}
