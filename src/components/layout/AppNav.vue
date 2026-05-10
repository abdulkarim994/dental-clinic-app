<template>
  <nav class="nav-wrap sticky top-[57px] z-40">
    <div class="max-w-lg mx-auto flex">
      <button v-for="tab in tabs" :key="tab.id"
        class="tab-b" :class="{ on: activeTab === tab.id }"
        @click="$emit('tabChange', tab.id)">
        <span v-html="tabIcons[tab.id]"></span>
        <span v-if="tab.id === 'debts'" class="relative" style="display:block;width:28px;height:28px;margin:0 auto 3px">
          <span v-if="debtCount > 0" class="d-pulse absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-white font-black flex items-center justify-center" style="font-size:8px;padding:0 3px;line-height:16px">{{ debtCount }}</span>
        </span>
        {{ tab.label }}
      </button>
    </div>
  </nav>
</template>

<script setup>
import { TABS } from '../../utils/defaults'

defineProps({
  activeTab: { type: String, default: 'add' },
  debtCount: { type: Number, default: 0 }
})

defineEmits(['tabChange'])

const tabs = TABS

const tabIcons = {
  add: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 8v8M8 12h8"/></svg>`,
  records: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
  treasury: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9h20v11a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"/><path d="M22 9V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2"/><circle cx="17" cy="14.5" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  archive: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1.5"/><path d="M10 12h4"/></svg>`,
  debts: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M7 15h4"/></svg>`,
  profits: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/><path d="M2 20h20"/></svg>`,
  patients: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a7 7 0 0114 0v2"/><path d="M16 11l2 2 4-4" stroke-width="2"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="8" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/></svg>`
}
</script>
