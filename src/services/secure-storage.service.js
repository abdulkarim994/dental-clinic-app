/**
 * Secure Storage Service
 * Uses Web Crypto API (AES-GCM) for encrypting sensitive data at rest.
 * Falls back to base64 encoding if Web Crypto is unavailable.
 * Zero external dependencies.
 */

const SECURE_PREFIX = '_ds_'
const CRYPTO_KEY_NAME = '_ds_ck'

let _cryptoKey = null
let _cryptoReady = false

// ── Key derivation ──

async function getDerivedKey() {
  if (_cryptoKey) return _cryptoKey
  if (!globalThis.crypto?.subtle) return null

  try {
    const stored = localStorage.getItem(CRYPTO_KEY_NAME)
    if (stored) {
      const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0))
      _cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
    } else {
      _cryptoKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
      const exported = await crypto.subtle.exportKey('raw', _cryptoKey)
      localStorage.setItem(CRYPTO_KEY_NAME, btoa(String.fromCharCode(...new Uint8Array(exported))))
    }
    _cryptoReady = true
    return _cryptoKey
  } catch {
    return null
  }
}

// Initialize key on load
getDerivedKey().catch(() => {})

// ── AES-GCM encrypt/decrypt ──

async function aesEncrypt(plaintext) {
  const key = await getDerivedKey()
  if (!key) return null
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

async function aesDecrypt(encryptedB64) {
  const key = await getDerivedKey()
  if (!key) return null
  const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

// ── Fallback (base64) ──

function b64Encode(value) {
  try {
    return btoa(encodeURIComponent(JSON.stringify(value)))
  } catch {
    return null
  }
}

function b64Decode(encoded) {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)))
  } catch {
    return null
  }
}

// ── Public API ──

export async function secureSet(key, value) {
  try {
    const json = JSON.stringify(value)
    let stored = null
    if (_cryptoReady) {
      stored = await aesEncrypt(json)
      if (stored) stored = 'E:' + stored
    }
    if (!stored) {
      stored = 'B:' + b64Encode(value)
    }
    localStorage.setItem(SECURE_PREFIX + key, stored)
  } catch (e) {
    console.warn('[SecureStorage] set failed:', e)
  }
}

export async function secureGet(key) {
  try {
    const raw = localStorage.getItem(SECURE_PREFIX + key)
    if (!raw) return null
    if (raw.startsWith('E:')) {
      const decrypted = await aesDecrypt(raw.slice(2))
      return decrypted ? JSON.parse(decrypted) : null
    }
    if (raw.startsWith('B:')) {
      return b64Decode(raw.slice(2))
    }
    return b64Decode(raw)
  } catch {
    return null
  }
}

export function secureRemove(key) {
  try {
    localStorage.removeItem(SECURE_PREFIX + key)
  } catch { /* ignore */ }
}

export function secureClearAll() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(SECURE_PREFIX)) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
  } catch { /* ignore */ }
}

export async function secureSetSession(session) {
  if (!session) return
  await secureSet('session', {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user_id: session.user?.id,
  })
}

export async function secureGetSession() {
  return secureGet('session')
}

export function secureClearSession() {
  secureRemove('session')
}
