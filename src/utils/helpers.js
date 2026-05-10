/**
 * Shared utility helpers
 */

/**
 * Format number with locale formatting
 */
export function n(v) {
  if (v == null || isNaN(Number(v))) return '0'
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * Sum an array of objects by key
 */
export function sum(arr, k) {
  return arr.reduce((s, x) => s + (Number(x[k]) || 0), 0)
}

/**
 * Delay utility
 */
export function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Check if a service is prosthetic type
 */
export function isProsthetic(s) {
  return /(تركيب|بروتيز|جسر|طقم|crown|prosth)/i.test(s) || s === 'تركيبات'
}

/**
 * Generate empty state HTML
 */
export function emptyHtml(ico, txt) {
  return `<div class="text-center py-12 opacity-25"><div class="text-4xl mb-2">${ico}</div><p class="text-xs">${txt}</p></div>`
}

/**
 * Generate unique ID
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

/**
 * Get month string from Date or ISO string
 */
export function getMonthStr(d) {
  if (typeof d === 'string') return d.substring(0, 7)
  return d.toISOString().substring(0, 7)
}

/**
 * Format date for display (Arabic)
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ar-LY', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function todayStr() {
  return new Date().toISOString().substring(0, 10)
}

/**
 * Get current month as YYYY-MM
 */
export function currentMonth() {
  return new Date().toISOString().substring(0, 7)
}

/**
 * Debounce function
 */
export function debounce(fn, wait = 300) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}
