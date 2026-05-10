import { supabase, setSbToken } from './supabase.service'

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

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(translateAuthError(error.message))
  if (data.session) setSbToken(data.session.access_token)
  return data
}

export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(translateAuthError(error.message))
  return data
}

export async function logout() {
  await supabase.auth.signOut()
  setSbToken('')
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) setSbToken(session.access_token)
  return session
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session) setSbToken(session.access_token)
    callback(event, session)
  })
}
