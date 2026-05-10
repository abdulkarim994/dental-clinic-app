<template>
  <div class="pb-28">
    <!-- HEADER -->
    <header class="nav-wrap sticky top-0 z-50 px-4 py-3">
      <div class="max-w-lg mx-auto flex justify-between items-center gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <button class="glass-sm w-12 h-12 flex items-center justify-center flex-shrink-0" title="الإعدادات" @click="openSettings">
            <IconSettings />
          </button>
          <div class="min-w-0">
            <h1 class="text-base font-black truncate leading-none" style="color:var(--gold)">{{ centerName }}</h1>
            <p class="text-[9px] opacity-35 mt-0.5 truncate">{{ userEmail }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button class="glass-sm w-12 h-12 flex items-center justify-center" title="مزامنة" @click="manualSync">
            <IconSync :spinning="isSyncing" />
          </button>
          <input
            type="month"
            :value="selectedMonth"
            class="inp"
            style="width:auto;padding:8px 12px;font-size:12px;border-radius:12px"
            @change="onMonthChange"
          >
        </div>
      </div>
    </header>

    <!-- NAV TABS -->
    <nav class="nav-wrap sticky top-[57px] z-40">
      <div class="max-w-lg mx-auto flex">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-b"
          :class="{ on: activeTab === tab.id }"
          @click="goTab(tab.id)"
        >
          <span class="relative" style="display:block;margin:0 auto 3px">
            <component :is="tab.icon" />
            <span
              v-if="tab.id === 'debts' && debtBadge > 0"
              class="d-pulse absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-white font-black flex items-center justify-center"
              style="font-size:8px;padding:0 3px;line-height:16px"
            >{{ debtBadge }}</span>
          </span>
          {{ tab.label }}
        </button>
      </div>
    </nav>

    <!-- TAB CONTENT -->
    <div class="max-w-lg mx-auto px-4 mt-4">
      <router-view v-slot="{ Component }">
        <keep-alive :max="5">
          <component :is="Component" class="tab-in" />
        </keep-alive>
      </router-view>
    </div>
  </div>

  <SyncOverlay />
  <SettingsModal :visible="showSettings" @close="showSettings = false" />

  <!-- Appointment Notification Overlay -->
  <Teleport to="body">
    <div v-if="apptNotifVisible" class="appt-notif-ol" @click.self="apptNotifVisible = false">
      <div class="appt-notif-box">
        <div class="an-header">
          <div class="an-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            المواعيد القادمة
          </div>
          <button class="an-close" @click="apptNotifVisible = false">✕</button>
        </div>
        <div v-if="todayAppts.length" class="an-section">
          <div class="an-section-title">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            مواعيد اليوم ({{ todayAppts.length }})
          </div>
          <div v-for="a in todayAppts" :key="a.id" class="an-card">
            <div><div class="an-name">{{ a.name || '—' }}</div><div class="an-svc">{{ a.service || '' }}</div></div>
            <div class="an-time">{{ a.time ? formatTime12h(a.time) : '—' }}</div>
          </div>
        </div>
        <div v-if="tmrwAppts.length" class="an-section">
          <div class="an-section-title">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#3b82f6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            مواعيد الغد ({{ tmrwAppts.length }})
          </div>
          <div v-for="a in tmrwAppts" :key="a.id" class="an-card">
            <div><div class="an-name">{{ a.name || '—' }}</div><div class="an-svc">{{ a.service || '' }}</div></div>
            <div class="an-time">{{ a.time ? formatTime12h(a.time) : '—' }}</div>
          </div>
        </div>
        <div class="an-footer"><button @click="apptNotifVisible = false">حسناً</button></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isOnline, onOnlineStatusChange, processQueue } from '@/services/offline-queue'
import { ensureMonthLoaded, loadAllMonths, mergeMonthData, setupRealtimeSubscriptions, clearRealtimeSubscriptions } from '@/services/sync.service'
import { setAuthErrorHandler, clearPendingRequests } from '@/services/supabase.service'
import { cleanupOrphanedThumbnails, getAllActiveXrayKeys } from '@/services/image-pipeline.service'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import IconSettings from '@/components/icons/IconSettings.vue'
import IconSync from '@/components/icons/IconSync.vue'
import IconAdd from '@/components/icons/IconAdd.vue'
import IconRecords from '@/components/icons/IconRecords.vue'
import IconTreasury from '@/components/icons/IconTreasury.vue'
import IconArchive from '@/components/icons/IconArchive.vue'
import IconDebts from '@/components/icons/IconDebts.vue'
import IconProfits from '@/components/icons/IconProfits.vue'
import IconPatients from '@/components/icons/IconPatients.vue'
import IconCalendar from '@/components/icons/IconCalendar.vue'
import { defineAsyncComponent } from 'vue'
import SyncOverlay from '@/components/SyncOverlay.vue'

const SettingsModal = defineAsyncComponent(() => import('@/components/SettingsModal.vue'))

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()
const { toast } = useToast()
const { initTheme } = useTheme()

const tabs = [
  { id: 'add', label: 'إضافة', icon: IconAdd },
  { id: 'records', label: 'السجل', icon: IconRecords },
  { id: 'treasury', label: 'الخزينة', icon: IconTreasury },
  { id: 'archive', label: 'الأرشيف', icon: IconArchive },
  { id: 'debts', label: 'الديون', icon: IconDebts },
  { id: 'profits', label: 'الأرباح', icon: IconProfits },
  { id: 'patients', label: 'المرضى', icon: IconPatients },
  { id: 'calendar', label: 'المواعيد', icon: IconCalendar },
]

const activeTab = computed(() => route.name || 'add')
const selectedMonth = computed(() => appStore.selectedMonth)
const centerName = computed(() => appStore.centerName)
const userEmail = computed(() => authStore.userEmail)
const isSyncing = computed(() => appStore.syncing)

const debtBadge = computed(() => {
  return appStore.debts.filter(d => d.status !== 'paid').length
})

function goTab(id) {
  appStore.activeTab = id
  router.push({ name: id })
}

async function onMonthChange(e) {
  const month = e.target.value
  appStore.selectedMonth = month
  const data = await ensureMonthLoaded(authStore.uid, month)
  if (data) {
    const merged = mergeMonthData(month, data, appStore.records, appStore.prosthetics)
    appStore.records = merged.records
    appStore.prosthetics = merged.prosthetics
    appStore.saveToCache(authStore.uid)
  }
}

async function manualSync() {
  try {
    const ok = await appStore.syncSave(authStore.uid, false)
    await appStore.syncLoad(authStore.uid)
    appStore.saveToCache(authStore.uid)
    if (!ok) toast('⚠ تحقق من الاتصال')
    else toast('تمت المزامنة')
  } catch {
    toast('فشلت المزامنة')
  }
}

const showSettings = ref(false)
function openSettings() {
  showSettings.value = true
}

let syncTimer = null
const online = ref(isOnline())
let unsubOnline = null
let realtimeUnsubs = []

/* ── Appointment Notification ── */
const apptNotifVisible = ref(false)
const todayAppts = ref([])
const tmrwAppts = ref([])

function formatTime12h(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'م' : 'ص'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function showApptNotification() {
  if (appStore.config.apptNotif === false) return
  const today = new Date().toISOString().substring(0, 10)
  const tmrw = new Date(Date.now() + 86400000).toISOString().substring(0, 10)
  const tAppts = (appStore.appointments || []).filter(a => a.date === today && a.status !== 'cancelled').sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  const mAppts = (appStore.appointments || []).filter(a => a.date === tmrw && a.status !== 'cancelled').sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  if (!tAppts.length && !mAppts.length) return
  todayAppts.value = tAppts
  tmrwAppts.value = mAppts
  apptNotifVisible.value = true
}

/* ── Android Back Button Handler ── */
function handlePopState() {
  if (showSettings.value) { showSettings.value = false; return }
  if (apptNotifVisible.value) { apptNotifVisible.value = false; return }
  const currentTab = route.name || 'add'
  if (currentTab !== 'add') {
    appStore.activeTab = 'add'
    router.push({ name: 'add' })
  }
  history.pushState({ tab: 'add' }, '')
}

onMounted(() => {
  initTheme()
  if (appStore.config.autoSync) {
    syncTimer = setInterval(
      () => appStore.syncSave(authStore.uid, false),
      (appStore.config.syncMin || 30) * 60 * 1000,
    )
  }
  unsubOnline = onOnlineStatusChange((status) => {
    online.value = status
    if (status) {
      toast('عاد الاتصال — جاري المزامنة...')
      processQueue(async () => {
        await appStore.syncSave(authStore.uid, false)
      })
    } else {
      toast('الوضع غير متصل — العمل محلياً')
    }
  })
  setTimeout(() => showApptNotification(), 800)
  window.addEventListener('popstate', handlePopState)
  history.pushState({ tab: 'add' }, '')
  realtimeUnsubs = setupRealtimeSubscriptions(authStore.uid, () => {
    appStore.syncLoad(authStore.uid, false)
  })
  // Token refresh is now managed centrally by auth.service.js (scheduleTokenRefresh)
  // — no manual setInterval needed here

  // Clean up orphaned xray thumbnails from localStorage (runs once on mount)
  try {
    const activeKeys = getAllActiveXrayKeys(appStore.config.patientXrays)
    cleanupOrphanedThumbnails(activeKeys)
  } catch { /* non-critical */ }
  setAuthErrorHandler(() => {
    toast('انتهت الجلسة — يرجى تسجيل الدخول مجدداً')
    authStore.doLogout().catch(() => {})
    router.push({ name: 'login' })
  })
})

onUnmounted(() => {
  clearInterval(syncTimer)
  syncTimer = null
  unsubOnline?.()
  unsubOnline = null
  window.removeEventListener('popstate', handlePopState)
  clearRealtimeSubscriptions(realtimeUnsubs)
  realtimeUnsubs = []
  setAuthErrorHandler(null)
  clearPendingRequests()
})
</script>
