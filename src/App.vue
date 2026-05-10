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
      try {
        await Promise.race([
          appStore.syncLoad(authStore.uid),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000)),
        ])
      } catch {
        // fallback to cache
      }
      appStore.saveToCache(authStore.uid)
      router.push({ name: 'add' })
    },
    () => {
      appStore.resetState()
      router.push({ name: 'login' })
    },
  )

  const session = await authStore.checkSession()
  if (!session) {
    router.push({ name: 'login' })
  }
})
</script>
