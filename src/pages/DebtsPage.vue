<template>
  <div class="max-w-lg mx-auto px-4 mt-4 space-y-4 tab-in">
    <!-- Search -->
    <div class="mb-4 relative">
      <input type="text" v-model="search" class="inp" placeholder="ابحث باسم المريض..." autocomplete="off">
    </div>

    <!-- Debts list -->
    <div>
      <div v-if="filteredDebts.length === 0" class="text-center py-16 opacity-25">
        <div class="mb-3 flex justify-center"><svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="color:var(--green)"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
        <p class="text-sm font-bold">لا توجد ديون مسجلة</p>
      </div>
      <div class="space-y-3">
      <div v-for="d in filteredDebts" :key="d.id" class="row-card p-3">
        <div class="flex justify-between items-start gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-sm pat-name-link" @click="$emit('goToPatient', d.name)">{{ d.name }}</span>
              <span class="b-debt">دين</span>
            </div>
            <p class="text-[10px] opacity-45">{{ d.service || '' }} · {{ d.date }}</p>
            <p v-if="d.note" class="text-[9px] opacity-30 mt-1">{{ d.note }}</p>
            <p v-if="d.phone" class="text-[9px] opacity-30">
              <a :href="'https://wa.me/' + d.phone.replace(/[^0-9]/g, '')" target="_blank" class="whatsapp-btn mt-1">
                <span v-html="waIcon"></span> تواصل
              </a>
            </p>
          </div>
          <div class="text-left flex-shrink-0">
            <div class="n font-bold text-sm" style="color:var(--red)">{{ n(d.amount) }}</div>
            <div v-if="getTotalPaid(d) > 0" class="text-[9px] opacity-40">مدفوع: <span class="n text-green-400">{{ n(getTotalPaid(d)) }}</span></div>
            <div class="text-[9px] opacity-35">المتبقي: <span class="n font-bold">{{ n(getRemaining(d)) }}</span></div>
          </div>
        </div>
        <!-- Payments history -->
        <div v-if="d.payments && d.payments.length" class="mt-2 space-y-1">
          <div v-for="p in d.payments" :key="p.id" class="flex justify-between text-[9px] py-1 border-t border-white/5">
            <span class="opacity-45">{{ p.date || '' }}</span>
            <span class="n font-bold text-green-400">{{ n(p.amount) }}</span>
          </div>
        </div>
        <div class="flex gap-1.5 mt-2 justify-end">
          <button @click="$emit('payDebt', d.id)" class="btn-o px-3 py-1.5 text-[10px]">تسديد جزئي</button>
          <button @click="$emit('settleDebt', d.id)" class="btn-o px-3 py-1.5 text-[10px]" style="color:var(--green)">تسديد كامل</button>
          <button @click="$emit('editDebt', d.id)" class="ic-btn ic-edit">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button @click="$emit('deleteDebt', d.id)" class="ic-btn ic-del">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDebtsStore } from '../stores/debts.store'
import { n } from '../utils/helpers'
import { ICONS } from '../utils/icons'

const debtsStore = useDebtsStore()

defineEmits(['addDebt', 'payDebt', 'settleDebt', 'editDebt', 'deleteDebt', 'goToPatient'])

const search = ref('')

const waIcon = ICONS.whatsapp

const filteredDebts = computed(() => {
  const q = search.value.trim().toLowerCase()
  const all = debtsStore.activeDebts
  if (!q) return all
  return all.filter(d => (d.name || '').toLowerCase().includes(q))
})

function getTotalPaid(d) {
  return (d.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
}

function getRemaining(d) {
  return Math.max(0, (Number(d.amount) || 0) - getTotalPaid(d))
}
</script>
