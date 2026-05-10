/**
 * Cache Service — localStorage persistence layer
 * Handles saving/loading app state to localStorage
 */

function cacheKey(userId, type) {
  return `dental_${userId}_${type}`
}

/**
 * Save all app state to localStorage
 */
export function cacheSave(userId, { records, prosthetics, debts, cfg, appointments }) {
  try {
    localStorage.setItem(cacheKey(userId, 'rec'), JSON.stringify(records))
    localStorage.setItem(cacheKey(userId, 'pro'), JSON.stringify(prosthetics))
    localStorage.setItem(cacheKey(userId, 'dbt'), JSON.stringify(debts))
    localStorage.setItem(cacheKey(userId, 'cfg'), JSON.stringify(cfg))
    localStorage.setItem(cacheKey(userId, 'appt'), JSON.stringify(appointments))
  } catch (e) {
    console.error('LS save:', e)
  }
}

/**
 * Load app state from localStorage
 */
export function cacheLoad(userId, defaultCfg) {
  try {
    const r = localStorage.getItem(cacheKey(userId, 'rec'))
    const p = localStorage.getItem(cacheKey(userId, 'pro'))
    const d = localStorage.getItem(cacheKey(userId, 'dbt'))
    const c = localStorage.getItem(cacheKey(userId, 'cfg'))
    const a = localStorage.getItem(cacheKey(userId, 'appt'))

    return {
      records: r ? (JSON.parse(r) || []) : [],
      prosthetics: p ? (JSON.parse(p) || []) : [],
      debts: d ? (JSON.parse(d) || []) : [],
      cfg: c ? { ...defaultCfg, ...JSON.parse(c) } : { ...defaultCfg },
      appointments: a ? (JSON.parse(a) || []) : []
    }
  } catch (e) {
    console.error('LS load:', e)
    return { records: [], prosthetics: [], debts: [], cfg: { ...defaultCfg }, appointments: [] }
  }
}

/**
 * Get/set fast mode flag
 */
export function getFastMode() {
  return localStorage.getItem('dental_fastMode') === '1'
}

export function setFastMode(enabled) {
  localStorage.setItem('dental_fastMode', enabled ? '1' : '0')
}

/**
 * Get/set theme preference
 */
export function getTheme() {
  return localStorage.getItem('dental_theme') || 'dark'
}

export function setTheme(theme) {
  localStorage.setItem('dental_theme', theme)
}

/**
 * Get/set font size preference
 */
export function getFontSize() {
  return localStorage.getItem('dental_fontSize') || 'fs-medium'
}

export function setFontSize(cls) {
  localStorage.setItem('dental_fontSize', cls)
}

/**
 * Save/load login credentials (remember me)
 */
export function saveCredentials(email, password) {
  localStorage.setItem('dental_rem_email', email)
  localStorage.setItem('dental_rem_pass', password)
}

export function loadCredentials() {
  return {
    email: localStorage.getItem('dental_rem_email') || '',
    password: localStorage.getItem('dental_rem_pass') || ''
  }
}

export function clearCredentials() {
  localStorage.removeItem('dental_rem_email')
  localStorage.removeItem('dental_rem_pass')
}
