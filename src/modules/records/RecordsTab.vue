<template>
  <div class="space-y-2">
    <!-- Search -->
    <div class="mb-4 relative">
      <input type="text" v-model="searchQuery" class="inp" placeholder=" بحث ذكي بالاسم..." autocomplete="off">
    </div>

    <!-- Filter Bar -->
    <div class="rec-filter-bar">
      <button v-for="f in filters" :key="f.key" class="rec-filter-btn" :class="{ 'rf-on': recFilter === f.key }" @click="recFilter = f.key">{{ f.label }}</button>
    </div>

    <!-- Records List -->
    <div v-if="!filteredRecords.length" class="text-center py-16 opacity-25">
      <svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto;display:block;color:var(--gold)"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
      <p class="text-sm font-bold mt-3">{{ emptyLabel }}</p>
    </div>

    <!-- Grouped by clinic when not searching -->
    <template v-if="!searchQuery.trim() && clinicGroups.length">
      <div v-for="group in clinicGroups" :key="group.clinic" class="glass overflow-hidden rounded-2xl">
        <button class="w-full p-4 flex justify-between items-center text-right" @click="toggleClinic(group.key)">
          <div class="flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gold);flex-shrink:0"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11h6v10"/></svg>
            <div>
              <p class="text-xs font-bold" style="color:var(--gold-l)">{{ group.clinic }}</p>
              <p class="text-[9px] opacity-35">{{ group.items.length }} سجل</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-left text-[9px] opacity-50">
              <span class="text-green-400">💵 {{ n(group.cash) }}</span>
              <span class="text-blue-400 mr-2">🏦 {{ n(group.xfer) }}</span>
            </div>
            <span class="acc-arr text-xs opacity-40" :class="{ open: openClinics.has(group.key) }">▼</span>
          </div>
        </button>
        <div class="acc-body" :class="openClinics.has(group.key) ? 'acc-open' : 'acc-closed'" :style="{ maxHeight: openClinics.has(group.key) ? (group.items.length * 90 + 40) + 'px' : '0px' }">
          <div class="px-3 pb-3 space-y-1.5">
            <RecordRow v-for="r in group.items" :key="r.id + r._s" :record="r" :debts="debts" :currency="cur" @edit="editRec" @delete="delRec" @go-debts="goDebts" @open-payment="openPayPopup" />
          </div>
        </div>
      </div>
    </template>

    <!-- Flat list when searching -->
    <template v-else-if="searchQuery.trim()">
      <RecordRow v-for="r in filteredRecords" :key="r.id + r._s" :record="r" :debts="debts" :currency="cur" @edit="editRec" @delete="delRec" @go-debts="goDebts" @open-payment="openPayPopup" />
    </template>

    <!-- Global Debt Payment Popup -->
    <DebtPayPopup :visible="showPayPopup" :debtId="payPopupDebtId" @close="showPayPopup = false" @updated="showPayPopup = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { fuzzyMatch, fuzzyScore } from '@/utils/search'
import { sortByNewest, sum, isProsDebtPay, n, recDateFilter } from '@/utils/helpers'
import { markMonthDirty, markDebtsDirty } from '@/services/sync.service'
import RecordRow from './components/RecordRow.vue'
import DebtPayPopup from '@/components/DebtPayPopup.vue'

const router = useRouter()
const app = useAppStore()
const auth = useAuthStore()
const { toast } = useToast()

const searchQuery = ref('')
const recFilter = ref('month')
const openClinics = ref(new Set())
const showPayPopup = ref(false)
const payPopupDebtId = ref(null)

function openPayPopup(debtId) {
  payPopupDebtId.value = debtId
  showPayPopup.value = true
}

const filters = [
  { key: 'month', label: 'هذا الشهر' },
  { key: 'week', label: 'هذا الأسبوع' },
  { key: 'today', label: 'اليوم' },
  { key: 'all', label: 'الكل' },
]

const cur = computed(() => app.currency)
const debts = computed(() => app.debts)
const month = computed(() => app.selectedMonth)

const filteredRecords = computed(() => {
  const q = searchQuery.value.trim()
  const recsFlt = q
    ? app.records.filter(r => !r.isPros && fuzzyMatch(q, r.name || ''))
    : app.records.filter(r => recDateFilter(r, recFilter.value, month.value) && !r.isPros)
  const prosFlt = q
    ? app.prosthetics.filter(p => fuzzyMatch(q, p.name || ''))
    : app.prosthetics.filter(p => recDateFilter(p, recFilter.value, month.value))
  const all = sortByNewest([
    ...recsFlt.map(r => ({ ...r, _s: 'r' })),
    ...prosFlt.map(p => ({ ...p, _s: 'p', service: 'تركيبات', amount: p.doctorShare })),
  ])
  if (q) {
    all.sort((a, b) => fuzzyScore(q, a.name || '') - fuzzyScore(q, b.name || ''))
  }
  return all
})

const clinicGroups = computed(() => {
  const all = filteredRecords.value
  const clinics = [...new Set(all.map(r => r.clinic || '—'))]
  return clinics.map(cli => {
    const items = all.filter(r => (r.clinic || '—') === cli)
    const cash = items.filter(r => r.payment === 'كاش').reduce((s, r) => s + (+r.amount || 0), 0)
    const xfer = items.filter(r => r.payment !== 'كاش' && r.payment !== 'دين').reduce((s, r) => s + (+r.amount || 0), 0)
    const key = 'rec-' + cli.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')
    return { clinic: cli, key, items, cash, xfer }
  })
})

const emptyLabel = computed(() => {
  if (searchQuery.value.trim()) return 'لا توجد نتائج للبحث'
  const labels = { month: 'لا توجد سجلات في هذا الشهر', week: 'لا توجد سجلات هذا الأسبوع', today: 'لا توجد سجلات اليوم', all: 'لا توجد سجلات' }
  return labels[recFilter.value] || labels.month
})

function toggleClinic(key) {
  if (openClinics.value.has(key)) openClinics.value.delete(key)
  else openClinics.value.add(key)
  openClinics.value = new Set(openClinics.value) // trigger reactivity
}

function goDebts() {
  app.activeTab = 'debts'
  router.push({ name: 'debts' })
}

function editRec(id, type) {
  app.activeTab = 'add'
  router.push({ name: 'add', query: { edit: id, type } })
}

function delRec(id, type) {
  if (!confirm('حذف السجل نهائياً؟')) return
  if (type === 'p') {
    const p = app.prosthetics.find(x => x.id === id)
    markMonthDirty(p?.date)
    if (p?.isDebt) {
      app.debts = app.debts.filter(d => d.prostheticId !== id)
      markDebtsDirty()
    }
    app.prosthetics = app.prosthetics.filter(x => x.id !== id)
  } else {
    const r = app.records.find(x => x.id === id)
    markMonthDirty(r?.date)
    if (r?.isDebtPayment && r.debtId) {
      const dIdx = app.debts.findIndex(d => d.id === r.debtId)
      if (dIdx >= 0) {
        const debt = app.debts[dIdx]
        const revertAmt = Number(r.amount) || 0
        debt.paidAmount = Math.max(0, (Number(debt.paidAmount) || 0) - revertAmt)
        const totalDebtAmt = Number(debt.totalAmount || debt.total || 0) || 0
        debt.remaining = Math.max(0, totalDebtAmt - (Number(debt.paidAmount) || 0))
        if (debt.remaining > 0.01) debt.status = debt.paidAmount > 0.01 ? 'partial' : 'unpaid'
        if (debt.type === 'prosthetic' && revertAmt > 0) {
          debt.doctorEarned = Math.max(0, (Number(debt.doctorEarned) || 0) - revertAmt)
        }
        if (debt.installments?.length) {
          const instIdx = debt.installments.findIndex(ins => ins.date === r.date && (Number(ins.amount) || 0) === revertAmt)
          if (instIdx >= 0) debt.installments.splice(instIdx, 1)
        }
        debt._mod = Date.now()
        app.debts[dIdx] = debt
        markDebtsDirty()
      }
    }
    if (r?.isDebt) {
      app.debts = app.debts.filter(d => d.recordId !== id)
      markDebtsDirty()
    }
    app.records = app.records.filter(x => x.id !== id)
  }
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تم الحذف وتحديث الأرصدة')
}
</script>
