<template>
  <div class="max-w-lg mx-auto px-4 mt-4 space-y-4 tab-in">
    <div class="sec-h mb-3">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9h20v11a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"/><path d="M22 9V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2"/></svg>
      خزينة {{ monthLabel }}
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-3 gap-2">
      <div class="stat-card p-3 text-center" @click="showDetail('income')">
        <div class="today-val n">{{ n(stats.income) }}</div>
        <div class="text-[9px] opacity-40 mt-1">الإيرادات</div>
      </div>
      <div class="stat-card p-3 text-center" @click="showDetail('prosthetics')">
        <div class="today-val n" style="color:var(--blue)">{{ n(stats.prosthetics) }}</div>
        <div class="text-[9px] opacity-40 mt-1">التركيبات</div>
      </div>
      <div class="stat-card p-3 text-center">
        <div class="today-val n" style="color:var(--green)">{{ n(stats.total) }}</div>
        <div class="text-[9px] opacity-40 mt-1">الإجمالي</div>
      </div>
    </div>

    <!-- By clinic -->
    <div v-for="cli in configStore.clinics" :key="cli" class="glass-sm p-3">
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs font-bold" style="color:var(--gold-l)">{{ cli }}</span>
        <span class="n text-xs font-bold" style="color:var(--gold)">{{ n(getClinicTotal(cli)) }}</span>
      </div>
      <div class="flex gap-2 text-[10px]">
        <span class="opacity-40">كشوفات: <span class="n">{{ getClinicCount(cli, 'r') }}</span></span>
        <span class="opacity-40">تركيبات: <span class="n">{{ getClinicCount(cli, 'p') }}</span></span>
      </div>
    </div>

    <!-- By payment -->
    <div class="glass p-4">
      <h3 class="sec-h mb-3">طرق الدفع</h3>
      <div v-for="pay in configStore.payments" :key="pay" class="flex justify-between items-center py-2 border-b border-white/5">
        <span class="text-xs">{{ pay }}</span>
        <span class="n text-xs font-bold" style="color:var(--gold)">{{ n(getPaymentTotal(pay)) }}</span>
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

const monthRecords = computed(() => recordsStore.getRecordsByMonth(ui.selectedMonth))
const monthProsthetics = computed(() => recordsStore.getProstheticsByMonth(ui.selectedMonth))

const stats = computed(() => {
  const income = sum(monthRecords.value, 'amount')
  const prosthetics = sum(monthProsthetics.value, 'amount')
  return { income, prosthetics, total: income + prosthetics }
})

function getClinicTotal(cli) {
  const recs = monthRecords.value.filter(r => r.clinic === cli)
  const pros = monthProsthetics.value.filter(p => p.clinic === cli)
  return sum(recs, 'amount') + sum(pros, 'amount')
}

function getClinicCount(cli, type) {
  if (type === 'r') return monthRecords.value.filter(r => r.clinic === cli).length
  return monthProsthetics.value.filter(p => p.clinic === cli).length
}

function getPaymentTotal(pay) {
  const recs = monthRecords.value.filter(r => r.payment === pay)
  const pros = monthProsthetics.value.filter(p => p.payment === pay)
  return sum(recs, 'amount') + sum(pros, 'amount')
}

function showDetail(type) {
  /* TODO: implement detail view */
}
</script>
