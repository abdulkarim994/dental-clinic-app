import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qajgqatflmiiwqznxfha.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhamdxYXRmbG1paXdxem54ZmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDQ0NTYsImV4cCI6MjA5MzgyMDQ1Nn0.fJuwU3aHdzOBzJj1osH0aaJ59QIlb2RxeGRaCSnaAus'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

let _sbToken = ''

export function getSbToken() {
  return _sbToken
}

export function setSbToken(token) {
  _sbToken = token
}

const _pendingRequests = new Map()
const MAX_RETRIES = 3
const RETRY_DELAY = 1000
const REQUEST_TIMEOUT = 15000

async function withRetry(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), REQUEST_TIMEOUT)),
      ])
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, RETRY_DELAY * (i + 1)))
    }
  }
}

function dedupeKey(type, key) {
  return `${type}:${key}`
}

export async function sbUpsert(uid, dataType, dataKey, data) {
  if (!uid) return
  const { error } = await withRetry(() =>
    supabase.from('user_data').upsert(
      { user_id: uid, data_type: dataType, data_key: dataKey || '', data },
      { onConflict: 'user_id,data_type,data_key' },
    ),
  )
  if (error) console.error('[SB] upsert:', error)
}

export async function sbGet(uid, dataType, dataKey) {
  if (!uid) return null
  const dk = dedupeKey(dataType, dataKey || '')
  if (_pendingRequests.has(dk)) return _pendingRequests.get(dk)

  const promise = withRetry(async () => {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', uid)
      .eq('data_type', dataType)
      .eq('data_key', dataKey || '')
      .maybeSingle()
    if (error) {
      console.error('[SB] get:', error)
      return null
    }
    return data?.data || null
  }).finally(() => {
    _pendingRequests.delete(dk)
  })

  _pendingRequests.set(dk, promise)
  return promise
}

export async function sbDelete(uid, dataType, dataKey) {
  if (!uid) return
  const { error } = await withRetry(() =>
    supabase
      .from('user_data')
      .delete()
      .eq('user_id', uid)
      .eq('data_type', dataType)
      .eq('data_key', dataKey || ''),
  )
  if (error) console.error('[SB] delete:', error)
}
