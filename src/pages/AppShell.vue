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
        <keep-alive>
          <component :is="Component" class="tab-in" />
        </keep-alive>
      </router-view>
    </div>
  </div>

  <SyncOverlay />
  <ToastNotification />
  <SettingsModal :visible="showSettings" @close="showSettings = false" />
  <AppointmentNotification />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isOnline, onOnlineStatusChange, processQueue } from '@/services/offline-queue'
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
import SyncOverlay from '@/components/SyncOverlay.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import AppointmentNotification from '@/components/AppointmentNotification.vue'

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

function onMonthChange(e) {
  appStore.selectedMonth = e.target.value
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
})

onUnmounted(() => {
  clearInterval(syncTimer)
  unsubOnline?.()
})
</script>
