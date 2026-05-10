/**
 * Supabase Service — centralized Supabase client & data operations
 * Handles connection, upsert, get, and realtime subscriptions
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qajgqatflmiiwqznxfha.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhamdxYXRmbG1paXdxem54ZmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDQ0NTYsImV4cCI6MjA5MzgyMDQ1Nn0.fJuwU3aHdzOBzJj1osH0aaJ59QIlb2RxeGRaCSnaAus'

export const SB = createClient(SUPABASE_URL, SUPABASE_KEY)

/**
 * Upsert data to user_data table
 */
export async function sbUpsert(userId, dataType, dataKey, data) {
  if (!userId) return
  const { error } = await SB.from('user_data').upsert(
    { user_id: userId, data_type: dataType, data_key: dataKey || '', data },
    { onConflict: 'user_id,data_type,data_key' }
  )
  if (error) console.error('[SB] upsert:', error)
}

/**
 * Get data from user_data table
 */
export async function sbGet(userId, dataType, dataKey) {
  if (!userId) return null
  const { data, error } = await SB.from('user_data')
    .select('data')
    .eq('user_id', userId)
    .eq('data_type', dataType)
    .eq('data_key', dataKey || '')
    .maybeSingle()
  if (error) { console.error('[SB] get:', error); return null }
  return data?.data || null
}

/**
 * Translate Supabase auth error messages to Arabic
 */
export function sbAuthErr(msg) {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'البريد أو كلمة المرور غير صحيحة'
  if (m.includes('email not confirmed')) return 'البريد لم يتم تأكيده بعد'
  if (m.includes('user not found')) return 'البريد غير مسجّل'
  if (m.includes('invalid email')) return 'صيغة البريد غير صحيحة'
  if (m.includes('rate limit') || m.includes('too many')) return 'محاولات كثيرة، حاول لاحقاً'
  if (m.includes('already registered') || m.includes('already been registered')) return 'البريد مسجّل مسبقاً'
  if (m.includes('password')) return 'كلمة المرور ضعيفة (6 أحرف+)'
  if (m.includes('signup is disabled')) return 'التسجيل معطّل حالياً'
  return msg
}
