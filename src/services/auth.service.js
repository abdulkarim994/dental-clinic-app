/**
 * Auth Service — handles login, register, logout, session management
 */
import { SB, sbAuthErr } from './supabase.service'

/**
 * Sign in with email/password
 */
export async function login(email, password) {
  const { data, error } = await SB.auth.signInWithPassword({ email, password })
  if (error) throw new Error(sbAuthErr(error.message))
  return data
}

/**
 * Register new user
 */
export async function register(email, password) {
  const { data, error } = await SB.auth.signUp({ email, password })
  if (error) throw new Error(sbAuthErr(error.message))
  return data
}

/**
 * Sign out
 */
export async function logout() {
  await SB.auth.signOut()
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session } } = await SB.auth.getSession()
  return session
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback) {
  return SB.auth.onAuthStateChange(callback)
}
