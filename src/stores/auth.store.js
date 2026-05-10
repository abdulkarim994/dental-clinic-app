import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, logout, getSession, onAuthStateChange } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const uid = ref(null)
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')

  async function doLogin(email, password) {
    loading.value = true
    error.value = ''
    try {
      const data = await login(email, password)
      user.value = data.user
      uid.value = data.user?.id || null
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function doRegister(email, password) {
    loading.value = true
    error.value = ''
    try {
      const data = await register(email, password)
      return data
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function doLogout() {
    await logout()
    user.value = null
    uid.value = null
  }

  async function checkSession() {
    const session = await getSession()
    if (session?.user) {
      user.value = session.user
      uid.value = session.user.id
    }
    return session
  }

  function initAuthListener(onLogin, onLogout) {
    return onAuthStateChange((event, session) => {
      if (session?.user) {
        if (uid.value === session.user.id) return
        user.value = session.user
        uid.value = session.user.id
        onLogin?.(session)
      } else {
        user.value = null
        uid.value = null
        onLogout?.()
      }
    })
  }

  return {
    user,
    uid,
    loading,
    error,
    isLoggedIn,
    userEmail,
    doLogin,
    doRegister,
    doLogout,
    checkSession,
    initAuthListener,
  }
})
