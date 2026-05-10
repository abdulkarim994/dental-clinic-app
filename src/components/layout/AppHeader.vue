<template>
  <header class="nav-wrap sticky top-0 z-50 px-4 py-3">
    <div class="max-w-lg mx-auto flex justify-between items-center gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <button @click="$emit('openSettings')" class="glass-sm w-12 h-12 flex items-center justify-center flex-shrink-0" title="الإعدادات">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gold)"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
        <div class="min-w-0">
          <h1 class="text-base font-black truncate leading-none" style="color:var(--gold)">{{ centerName }}</h1>
          <p class="text-[9px] opacity-35 mt-0.5 truncate">{{ userEmail }}</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <button @click="$emit('sync')" class="glass-sm w-12 h-12 flex items-center justify-center" title="مزامنة">
          <span v-html="syncIconHtml" :style="syncing ? 'animation:rot 1s linear infinite' : ''"></span>
        </button>
        <input type="month" class="viewFilter" :value="selectedMonth" @change="$emit('monthChange', $event.target.value)"
          style="background:var(--gold-g);color:#fff;font-weight:800;padding:9px 18px;border-radius:50px;border:none;font-family:-apple-system,'Cairo',sans-serif;font-size:calc(14px * var(--fs));cursor:pointer;box-shadow:0 4px 12px rgba(59,130,246,.3)">
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { ICONS } from '../../utils/icons'

const props = defineProps({
  centerName: { type: String, default: 'طب الأسنان الرقمي' },
  userEmail: { type: String, default: '' },
  selectedMonth: { type: String, default: '' },
  syncing: { type: Boolean, default: false },
  syncStatus: { type: String, default: 'idle' }
})

defineEmits(['openSettings', 'sync', 'monthChange'])

const syncIconHtml = computed(() => {
  if (props.syncStatus === 'ok') return ICONS.syncOk
  if (props.syncStatus === 'error') return ICONS.syncErr
  return ICONS.sync
})
</script>
