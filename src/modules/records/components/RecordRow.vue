<template>
  <div class="row-card p-3 flex justify-between items-start gap-2">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
        <p class="text-xs font-bold">{{ record.name || '' }}</p>
        <span v-if="debtBadgeText" :class="debtBadgeClass" class="badge-click" style="cursor:pointer" @click.stop="goDebt" :title="debtTooltip">{{ debtBadgeText }}</span>
        <span v-if="isDebtPay" class="b-paid-debt badge-click" style="cursor:pointer" @click.stop="goDebt">{{ record.debtPaymentType === 'full' ? '✅ سداد كلي' : '💰 دفعة جزئية' }}</span>
        <span v-if="record._s === 'p'" class="b-pros">تركيبات</span>
      </div>
      <p class="text-[9px] opacity-35">{{ record.date || '' }} | {{ record.service || '' }}</p>
      <!-- Debt inline info when clicked -->
      <div v-if="showDebtInfo && linkedDebt" class="mt-2 glass-sm p-2 rounded-lg space-y-1 text-[10px]" @click.stop>
        <div class="flex justify-between"><span class="opacity-50">الإجمالي:</span><span class="n font-bold">{{ n(Number(linkedDebt.totalAmount || linkedDebt.total || 0)) }} {{ currency }}</span></div>
        <div class="flex justify-between"><span class="opacity-50">المدفوع:</span><span class="n font-bold text-green-400">{{ n(Number(linkedDebt.paidAmount || 0)) }} {{ currency }}</span></div>
        <div class="flex justify-between"><span class="opacity-50">المتبقي:</span><span class="n font-bold text-red-400">{{ n(Number(linkedDebt.remaining || 0)) }} {{ currency }}</span></div>
        <div class="flex justify-between"><span class="opacity-50">الحالة:</span><span :class="linkedDebt.status === 'paid' ? 'text-green-400' : 'text-red-400'">{{ linkedDebt.status === 'paid' ? 'مسدد' : linkedDebt.status === 'partial' ? 'جزئي' : 'غير مسدد' }}</span></div>
        <div v-if="linkedDebt.installments?.length" class="border-t border-white/10 pt-1 mt-1">
          <p class="opacity-40 mb-0.5">الدفعات ({{ linkedDebt.installments.length }}):</p>
          <div v-for="(inst, i) in linkedDebt.installments" :key="i" class="flex justify-between opacity-60">
            <span>{{ inst.date }}</span><span class="n">{{ n(inst.amount) }} {{ currency }}</span>
          </div>
        </div>
        <button @click.stop="$emit('goDebts')" class="btn-o w-full py-1.5 text-[9px] mt-1">الذهاب لصفحة الديون ↗</button>
      </div>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0">
      <div class="text-left">
        <p class="text-xs font-bold" :class="payColor"><span class="n">{{ n(record.amount) }}</span> <span class="text-[9px] opacity-40">{{ currency }}</span></p>
        <p class="text-[9px] opacity-30">{{ record.payment || '' }}</p>
      </div>
      <button @click.stop="$emit('edit', record.id, record._s)" class="ic-btn ic-edit">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button @click.stop="$emit('delete', record.id, record._s)" class="ic-btn ic-del">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  record: { type: Object, required: true },
  debts: { type: Array, default: () => [] },
  currency: { type: String, default: 'د.ل' },
})

const emit = defineEmits(['edit', 'delete', 'goDebts', 'openPayment'])

function n(v) { return formatNumber(v) }

const showDebtInfo = ref(false)
const isDebtPay = computed(() => props.record.isDebtPayment && props.record.debtId)

const linkedDebt = computed(() => {
  if (isDebtPay.value) return props.debts.find(d => d.id === props.record.debtId)
  if (props.record.isDebt) return props.debts.find(d => d.recordId === props.record.id || d.prostheticId === props.record.id)
  return null
})

function goDebt() {
  if (linkedDebt.value) {
    emit('openPayment', linkedDebt.value.id)
  } else {
    showDebtInfo.value = !showDebtInfo.value
  }
}

const payColor = computed(() => {
  if (props.record.payment === 'كاش') return 'text-green-400'
  if (props.record.payment === 'دين') return 'text-red-400'
  return 'text-blue-400'
})

const debtBadgeText = computed(() => {
  if (!props.record.isDebt) return ''
  return linkedDebt.value?.status === 'paid' ? '✓ مسدد' : 'دين'
})

const debtBadgeClass = computed(() => {
  if (!props.record.isDebt) return ''
  return linkedDebt.value?.status === 'paid' ? 'b-debt-settled' : 'b-debt'
})

const debtTooltip = computed(() => {
  if (!linkedDebt.value) return ''
  return `اضغط لعرض تفاصيل الدين — المتبقي: ${n(linkedDebt.value.remaining || 0)} ${props.currency}`
})
</script>
