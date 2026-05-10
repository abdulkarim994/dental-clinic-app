/**
 * Auth Store — manages user authentication state
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SB } from '../services/supabase.service'
import * as authService from '../services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userId = ref(null)
  const sbToken = ref('')
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!userId.value)
  const userEmail = computed(() => user.value?.email || '')

  async function login(email, password) {
    loading.value = true
    error.value = ''
    try {
      await authService.login(email, password)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function register(email, password) {
    loading.value = true
    error.value = ''
    try {
      await authService.register(email, password)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await authService.logout()
    user.value = null
    userId.value = null
    sbToken.value = ''
  }

  function setUser(u, token) {
    user.value = u
    userId.value = u?.id || null
    sbToken.value = token || ''
  }

  function updateToken(token) {
    sbToken.value = token
  }

  async function refreshSession() {
    try {
      const session = await authService.getSession()
      if (session) {
        sbToken.value = session.access_token
      }
      return session
    } catch (e) {
      console.error('[VIS]', e)
      return null
    }
  }

  return {
    user, userId, sbToken, loading, error,
    isLoggedIn, userEmail,
    login, register, logout, setUser, updateToken, refreshSession
  }
})
