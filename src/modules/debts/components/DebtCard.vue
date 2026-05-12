<template>
  <div class="glass p-4 space-y-3 rounded-2xl" :style="{ borderColor: isPaid ? 'rgba(45,212,160,.15)' : 'rgba(255,68,85,.15)' }">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap mb-1">
          <p class="text-sm font-black cursor-pointer" style="color:var(--gold)" @click="$emit('go-patient', debt.name)">{{ debt.name || '' }}</p>
          <span :class="statusClass">{{ statusText }}</span>
          <span v-if="debt.type === 'prosthetic'" class="b-pros">تركيبات</span>
        </div>
        <p class="text-[9px] opacity-35">{{ debt.date || '' }} | {{ debt.clinic || '' }}</p>
      </div>
      <div class="flex items-center gap-1.5">
        <button @click="$emit('edit', debt.id)" class="ic-btn ic-edit" title="تعديل">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button @click="$emit('delete', debt.id)" class="ic-btn ic-del" title="حذف">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>

    <!-- Amount Info -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div><p class="text-[9px] opacity-40">الإجمالي</p><p class="text-xs font-bold text-yellow-400"><span class="n">{{ n(totalAmt) }}</span></p></div>
      <div><p class="text-[9px] opacity-40">المدفوع</p><p class="text-xs font-bold text-green-400"><span class="n">{{ n(debt.paidAmount || 0) }}</span></p></div>
      <div><p class="text-[9px] opacity-40">المتبقي</p><p class="text-xs font-bold text-red-400"><span class="n">{{ n(debt.remaining || 0) }}</span></p></div>
    </div>

    <!-- Progress Bar -->
    <div>
      <div class="w-full h-2 rounded-full overflow-hidden" style="background:rgba(255,255,255,.1)">
        <div class="h-full rounded-full transition-all" :style="{ width: pct + '%', background: isPaid ? 'var(--green)' : 'var(--gold)' }"></div>
      </div>
      <p class="text-[9px] opacity-35 mt-1 text-center"><span class="n">{{ pct }}%</span> مسدد</p>
    </div>

    <!-- Phone + WhatsApp -->
    <div v-if="debt.phone" class="flex items-center justify-between">
      <a :href="'tel:' + debt.phone" class="text-blue-400 text-xs hover:underline"><span class="n">{{ debt.phone }}</span></a>
      <a v-if="waPhone" :href="waLink" target="_blank" class="whatsapp-btn" style="padding:3px 10px;font-size:9px">واتساب</a>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 pt-1" v-if="!isPaid">
      <button @click="$emit('pay', debt.id)" class="btn-g flex-1 py-2.5 text-xs font-bold">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8"/></svg>
        تسجيل دفعة
      </button>
      <button @click="$emit('view-payments', debt.id)" class="btn-o px-3 py-2.5 text-xs">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
        الدفعات
      </button>
    </div>
    <div v-else class="flex gap-2 pt-1">
      <button @click="$emit('view-payments', debt.id)" class="btn-o w-full py-2.5 text-xs">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
        عرض سجل الدفعات
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  debt: { type: Object, required: true },
  currency: { type: String, default: 'د.ل' },
  doctorPct: { type: Number, default: 50 },
})

defineEmits(['pay', 'edit', 'delete', 'view-payments', 'go-patient'])

function n(v) { return formatNumber(v) }

const totalAmt = computed(() => Number(props.debt.totalAmount || props.debt.total || 0))
const isPaid = computed(() => props.debt.status === 'paid')

const pct = computed(() => {
  const total = totalAmt.value
  return total > 0 ? Math.min(100, Math.round(((Number(props.debt.paidAmount) || 0) / total) * 100)) : 0
})

const statusText = computed(() => {
  if (isPaid.value) return 'مسدد'
  if (props.debt.status === 'partial') return 'جزئي'
  return 'غير مسدد'
})

const statusClass = computed(() => {
  if (isPaid.value) return 'b-debt-settled'
  if (props.debt.status === 'partial') return 'b-partial'
  return 'b-unpaid'
})

const waPhone = computed(() => {
  const p = (props.debt.phone || '').replace(/[^0-9]/g, '')
  return p || ''
})

const waLink = computed(() => {
  const msg = encodeURIComponent(`السلام عليكم ${props.debt.name || ''}, تذكير بموعد سداد الدين المتبقي: ${n(props.debt.remaining || 0)} ${props.currency}`)
  return `https://wa.me/${waPhone.value}?text=${msg}`
})
</script>
