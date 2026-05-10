/**
 * Utilities Index — Phase 6
 *
 * Central re-export of all shared utilities.
 * Prefer importing from '@/utils' over individual files.
 */

// Formatting
export { formatNumber, getCurrentMonth, getCurrentDate, isProsthetic } from './format'

// Search
export { normAr, fuzzyMatch, fuzzyScore, levenshtein } from './search'

// Sanitization & Validation
export {
  escapeHtml,
  sanitizeInput,
  sanitizeRecord,
  sanitizeDebt,
  sanitizeAppointment,
  validatePhone,
  validateAmount,
  validateRecords,
  validateDebts,
  validateAppointments,
  validateConfig,
} from './sanitize'

// Helpers
export { sortByNewest, sum, isProsDebtPay, prosDocEarnings, recDateFilter, n } from './helpers'

// Timing
export { debounce } from './debounce'
