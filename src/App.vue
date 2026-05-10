<template>
  <div id="dental-app" dir="rtl">
    <!-- Login Screen -->
    <LoginPage v-if="!authStore.isLoggedIn" />

    <!-- Main App -->
    <div v-else class="mainApp">
      <!-- Header -->
      <AppHeader
        :center-name="configStore.centerName"
        :user-email="authStore.userEmail"
        :selected-month="ui.selectedMonth"
        :syncing="syncing"
        :sync-status="syncStatus"
        @open-settings="ui.settingsOpen = true"
        @sync="handleSync"
        @month-change="onMonthChange"
      />

      <!-- Navigation -->
      <AppNav
        :active-tab="ui.activeTab"
        :debt-count="debtsStore.debtCount"
        @tab-change="handleTabChange"
      />

      <!-- Tab Content -->
      <main class="pb-6">
        <component :is="currentTabComponent" v-bind="currentTabProps" v-on="currentTabEvents" />
      </main>
    </div>

    <!-- Overlays -->
    <SyncOverlay />
    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, shallowRef, markRaw } from 'vue'
import { useAuthStore } from './stores/auth.store'
import { useConfigStore } from './stores/config.store'
import { useRecordsStore } from './stores/records.store'
import { useDebtsStore } from './stores/debts.store'
import { useAppointmentsStore } from './stores/appointments.store'
import { useUiStore } from './stores/ui.store'
import { useSync } from './composables/useSync'
import { useToast } from './composables/useToast'
import { onAuthStateChange } from './services/auth.service'
import { sbGet } from './services/supabase.service'
import { loadFromSupabase } from './services/sync.service'
import { DEFAULT_CONFIG } from './utils/defaults'

import { defineAsyncComponent } from 'vue'
import LoginPage from './pages/LoginPage.vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppNav from './components/layout/AppNav.vue'
import SyncOverlay from './components/shared/SyncOverlay.vue'
import ToastNotification from './components/shared/ToastNotification.vue'

const AddPage = defineAsyncComponent(() => import('./pages/AddPage.vue'))
const RecordsPage = defineAsyncComponent(() => import('./pages/RecordsPage.vue'))
const TreasuryPage = defineAsyncComponent(() => import('./pages/TreasuryPage.vue'))
const ArchivePage = defineAsyncComponent(() => import('./pages/ArchivePage.vue'))
const DebtsPage = defineAsyncComponent(() => import('./pages/DebtsPage.vue'))
const ProfitsPage = defineAsyncComponent(() => import('./pages/ProfitsPage.vue'))
const PatientsPage = defineAsyncComponent(() => import('./pages/PatientsPage.vue'))
const CalendarPage = defineAsyncComponent(() => import('./pages/CalendarPage.vue'))

const authStore = useAuthStore()
const configStore = useConfigStore()
const recordsStore = useRecordsStore()
const debtsStore = useDebtsStore()
const apptsStore = useAppointmentsStore()
const ui = useUiStore()
const { localSave, localLoad, save, load, manualSync, startAutoSync, stopAutoSync, startRealtime, stopRealtime } = useSync()
const { toast } = useToast()

const syncing = ref(false)
const syncStatus = ref('idle')
let authUnsub = null

const pageComponents = {
  add: markRaw(AddPage),
  records: markRaw(RecordsPage),
  treasury: markRaw(TreasuryPage),
  archive: markRaw(ArchivePage),
  debts: markRaw(DebtsPage),
  profits: markRaw(ProfitsPage),
  patients: markRaw(PatientsPage),
  calendar: markRaw(CalendarPage)
}

const currentTabComponent = computed(() => pageComponents[ui.activeTab] || pageComponents.add)
const currentTabProps = computed(() => ({}))
const currentTabEvents = computed(() => ({}))

function handleTabChange(tab) {
  ui.setTab(tab)
}

function onMonthChange(val) {
  ui.setMonth(val)
}

async function handleSync() {
  syncing.value = true
  syncStatus.value = 'idle'
  try {
    const ok = await manualSync()
    syncStatus.value = ok ? 'ok' : 'error'
    setTimeout(() => { syncStatus.value = 'idle' }, 2000)
  } catch (e) {
    syncStatus.value = 'error'
    setTimeout(() => { syncStatus.value = 'idle' }, 2000)
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  ui.initTheme()

  authUnsub = onAuthStateChange(async (event, session) => {
    if (session && session.user) {
      const user = session.user
      if (authStore.userId === user.id) {
        authStore.updateToken(session.access_token)
        return
      }

      authStore.setUser(user, session.access_token)
      localLoad()

      try {
        ui.showSync('تحميل البيانات...', 0)
        await Promise.race([
          load(true),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))
        ])
      } catch (e) {
        console.warn('[App] initial load:', e)
      } finally {
        ui.hideSync()
      }

      startRealtime()
      startAutoSync()
    } else {
      authStore.setUser(null, '')
      stopAutoSync()
      stopRealtime()
    }
  })
})

onUnmounted(() => {
  if (authUnsub) authUnsub.data?.subscription?.unsubscribe()
  stopAutoSync()
  stopRealtime()
})
</script>
