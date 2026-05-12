import { supabase, setSbToken } from './supabase.service'
import { secureSetSession, secureGetSession, secureClearSession } from './secure-storage.service'

// ── Refresh token lifecycle ──

const REFRESH_MARGIN_MS = 5 * 60 * 1000 // Refresh 5 minutes before expiry
let _refreshTimer = null

function scheduleTokenRefresh(session) {
  clearScheduledRefresh()
  if (!session?.expires_at) return
  const expiresMs = session.expires_at * 1000
  const refreshAt = expiresMs - REFRESH_MARGIN_MS - Date.now()
  if (refreshAt <= 0) {
    refreshSession().catch(() => {})
    return
  }
  _refreshTimer = setTimeout(() => refreshSession().catch(() => {}), Math.min(refreshAt, 2147483647))
}

function clearScheduledRefresh() {
  if (_refreshTimer) { clearTimeout(_refreshTimer); _refreshTimer = null }
}

async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    if (data?.session) {
      setSbToken(data.session.access_token)
      secureSetSession(data.session)
      scheduleTokenRefresh(data.session)
      return data.session
    }
  } catch {
    // Refresh failed — session may be expired
  }
  return null
}

// ── Error translation ──

export function translateAuthError(msg) {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'البريد أو كلمة المرور غير صحيحة'
  if (m.includes('email not confirmed')) return 'البريد لم يتم تأكيده بعد'
  if (m.includes('user not found')) return 'البريد غير مسجّل'
  if (m.includes('invalid email')) return 'صيغة البريد غير صحيحة'
  if (m.includes('rate limit') || m.includes('too many')) return 'محاولات كثيرة، حاول لاحقاً'
  if (m.includes('already registered') || m.includes('already been registered')) return 'البريد مسجّل مسبقاً'
  if (m.includes('password')) return 'كلمة المرور ضعيفة (6 أحرف+)'
  return msg
}

// ── Auth operations ──

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(translateAuthError(error.message))
  if (data.session) {
    setSbToken(data.session.access_token)
    secureSetSession(data.session)
    scheduleTokenRefresh(data.session)
  }
  return data
}

export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(translateAuthError(error.message))
  return data
}

export async function logout() {
  clearScheduledRefresh()
  secureClearSession()
  await supabase.auth.signOut()
  setSbToken('')
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    setSbToken(session.access_token)
    secureSetSession(session)
    scheduleTokenRefresh(session)
    return session
  }
  return null
}

/**
 * Attempt to restore session from encrypted secure storage.
 * Used as crash recovery when Supabase's own session is lost.
 */
export async function restoreSessionFromSecureStorage() {
  const stored = await secureGetSession()
  if (!stored?.refresh_token) return null
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: stored.access_token,
      refresh_token: stored.refresh_token,
    })
    if (error) throw error
    if (data?.session) {
      setSbToken(data.session.access_token)
      secureSetSession(data.session)
      scheduleTokenRefresh(data.session)
      return data.session
    }
  } catch {
    secureClearSession()
  }
  return null
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      setSbToken(session.access_token)
      secureSetSession(session)
      scheduleTokenRefresh(session)
    } else {
      clearScheduledRefresh()
    }
    callback(event, session)
  })
}
