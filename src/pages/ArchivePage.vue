<template>
  <div class="max-w-lg mx-auto px-4 mt-4 space-y-4 tab-in">
    <div class="sec-h mb-3">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1.5"/><path d="M10 12h4"/></svg>
      أرشيف الأشهر السابقة
    </div>

    <!-- Search -->
    <div class="relative">
      <input type="text" v-model="search" class="inp text-xs" placeholder="بحث في الأرشيف...">
    </div>

    <!-- Month list -->
    <div v-if="sortedMonths.length === 0" class="text-center py-12 opacity-25">
      <div class="text-4xl mb-2">📁</div>
      <p class="text-xs">لا توجد بيانات مؤرشفة</p>
    </div>

    <div v-for="m in sortedMonths" :key="m" class="row-card p-3 clickable" @click="$emit('loadMonth', m)">
      <div class="flex justify-between items-center">
        <div>
          <span class="text-sm font-bold" style="color:var(--gold-l)">{{ formatMonth(m) }}</span>
          <span class="text-[9px] opacity-35 mr-2">{{ getMonthRecordCount(m) }} سجل</span>
        </div>
        <div class="text-left">
          <span class="n text-sm font-bold" style="color:var(--gold)">{{ n(getMonthTotal(m)) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecordsStore } from '../stores/records.store'
import { useUiStore } from '../stores/ui.store'
import { n, sum } from '../utils/helpers'

const recordsStore = useRecordsStore()
const ui = useUiStore()

defineEmits(['loadMonth'])

const search = ref('')

const sortedMonths = computed(() => {
  const months = [...recordsStore.knownMonths]
  return months.sort().reverse()
})

function formatMonth(m) {
  try {
    const d = new Date(m + '-01')
    return d.toLocaleDateString('ar-LY', { year: 'numeric', month: 'long' })
  } catch { return m }
}

function getMonthRecordCount(m) {
  return recordsStore.getRecordsByMonth(m).length + recordsStore.getProstheticsByMonth(m).length
}

function getMonthTotal(m) {
  return sum(recordsStore.getRecordsByMonth(m), 'amount') + sum(recordsStore.getProstheticsByMonth(m), 'amount')
}
</script>
