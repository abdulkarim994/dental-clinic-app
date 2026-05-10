<template>
  <router-view />
  <ToastNotification />
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useTheme } from '@/composables/useTheme'
import { restoreSessionFromSecureStorage } from '@/services/auth.service'
import { enableAuthGuard } from '@/router'
import ToastNotification from '@/components/ToastNotification.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { initTheme } = useTheme()

onMounted(async () => {
  initTheme()

  authStore.initAuthListener(
    async (session) => {
      appStore.loadFromCache(authStore.uid)
      router.push({ name: 'add' })
      try {
        await Promise.race([
          appStore.syncLoad(authStore.uid),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000)),
        ])
        appStore.saveToCache(authStore.uid)
      } catch {
        // fallback to cache — already loaded above
      }
    },
    () => {
      appStore.resetState()
      router.push({ name: 'login' })
    },
  )

  // Try Supabase session first, then fall back to encrypted secure storage
  let session = await authStore.checkSession()
  if (!session) {
    session = await restoreSessionFromSecureStorage()
    if (session?.user) {
      authStore.user = session.user
      authStore.uid = session.user.id
      appStore.loadFromCache(session.user.id)
      enableAuthGuard()
      router.push({ name: 'add' })
      return
    }
    enableAuthGuard()
    router.push({ name: 'login' })
  } else {
    enableAuthGuard()
  }
})
</script>
