<template>
  <div class="max-w-lg mx-auto px-4 mt-4 space-y-4 tab-in">
    <div class="sec-h mb-3">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/><path d="M2 20h20"/></svg>
      أرباح {{ monthLabel }}
    </div>

    <!-- Summary stats -->
    <div class="grid grid-cols-2 gap-2">
      <div class="stat-card p-3 text-center">
        <div class="today-val n" style="color:var(--green)">{{ n(stats.doctorProfit) }}</div>
        <div class="text-[9px] opacity-40 mt-1">ربح الطبيب ({{ configStore.doctorPct }}%)</div>
      </div>
      <div class="stat-card p-3 text-center">
        <div class="today-val n" style="color:var(--blue)">{{ n(stats.clinicProfit) }}</div>
        <div class="text-[9px] opacity-40 mt-1">ربح العيادة ({{ configStore.clinicPct }}%)</div>
      </div>
    </div>

    <div class="glass p-4 space-y-3">
      <div class="flex justify-between text-xs"><span class="opacity-50">إجمالي الكشوفات:</span><span class="n font-bold">{{ n(stats.recordsTotal) }}</span></div>
      <div class="flex justify-between text-xs"><span class="opacity-50">إجمالي التركيبات:</span><span class="n font-bold">{{ n(stats.prosTotal) }}</span></div>
      <div class="flex justify-between text-xs"><span class="opacity-50">تكاليف المعمل:</span><span class="n font-bold" style="color:var(--red)">{{ n(stats.labCost) }}</span></div>
      <div class="flex justify-between text-xs"><span class="opacity-50">صافي التركيبات:</span><span class="n font-bold" style="color:var(--green)">{{ n(stats.prosNet) }}</span></div>
      <div class="flex justify-between text-xs border-t border-white/10 pt-2"><span class="opacity-70 font-bold">الإجمالي الصافي:</span><span class="n font-black" style="color:var(--gold)">{{ n(stats.netTotal) }}</span></div>
    </div>

    <!-- Monthly chart -->
    <div class="glass p-4">
      <h3 class="sec-h mb-3">مقارنة شهرية</h3>
      <div class="mth-chart">
        <div v-for="(m, i) in chartData" :key="i" class="flex-1 flex flex-direction-column items-center">
          <div :style="{ height: m.h + 'px', background: 'var(--gold-g)', borderRadius: '4px 4px 0 0', width: '100%', minWidth: '8px' }"></div>
          <div class="mth-lbl">{{ m.label }}</div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button @click="$emit('print')" class="btn-o flex-1 py-2.5 text-xs">طباعة</button>
      <button @click="$emit('exportXL')" class="btn-o flex-1 py-2.5 text-xs">Excel</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRecordsStore } from '../stores/records.store'
import { useConfigStore } from '../stores/config.store'
import { useUiStore } from '../stores/ui.store'
import { n, sum } from '../utils/helpers'

const recordsStore = useRecordsStore()
const configStore = useConfigStore()
const ui = useUiStore()

defineEmits(['print', 'exportXL'])

const monthLabel = computed(() => {
  try {
    const d = new Date(ui.selectedMonth + '-01')
    return d.toLocaleDateString('ar-LY', { year: 'numeric', month: 'long' })
  } catch { return ui.selectedMonth }
})

const stats = computed(() => {
  const recs = recordsStore.getRecordsByMonth(ui.selectedMonth)
  const pros = recordsStore.getProstheticsByMonth(ui.selectedMonth)
  const recordsTotal = sum(recs, 'amount')
  const prosTotal = sum(pros, 'amount')
  const labCost = sum(pros, 'labCost')
  const prosNet = prosTotal - labCost
  const netTotal = recordsTotal + prosNet
  const docPct = configStore.doctorPct / 100
  return {
    recordsTotal,
    prosTotal,
    labCost,
    prosNet,
    netTotal,
    doctorProfit: netTotal * docPct,
    clinicProfit: netTotal * (1 - docPct)
  }
})

const chartData = computed(() => {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.toISOString().substring(0, 7)
    const recs = recordsStore.getRecordsByMonth(m)
    const pros = recordsStore.getProstheticsByMonth(m)
    const total = sum(recs, 'amount') + sum(pros, 'amount') - sum(pros, 'labCost')
    months.push({ label: d.toLocaleDateString('ar-LY', { month: 'short' }), total })
  }
  const max = Math.max(...months.map(m => m.total), 1)
  return months.map(m => ({ ...m, h: Math.max(2, (m.total / max) * 56) }))
})
</script>
