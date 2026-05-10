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

export function validatePhone(phone) {
  if (!phone) return true
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^[+]?\d{6,15}$/.test(cleaned)
}

export function validateAmount(amount) {
  const num = Number(amount)
  return !isNaN(num) && num >= 0 && num < 1e9
}
