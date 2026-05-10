<template>
  <div class="space-y-4">
    <!-- Year Selector -->
    <div class="flex items-center justify-between mb-2">
      <h2 class="sec-h">أرباح الطبيب</h2>
      <select v-model="selectedYear" class="inp text-xs" style="width:auto;padding:6px 12px;border-radius:12px">
        <option v-for="y in years" :key="y">{{ y }}</option>
      </select>
    </div>

    <!-- 6-Month Chart -->
    <div class="glass p-4 rounded-2xl">
      <p class="text-[9px] opacity-35 text-center mb-2">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
        مقارنة آخر 6 أشهر
      </p>
      <div class="mth-chart">
        <div v-for="(bar, i) in chartBars" :key="i" style="flex:1;display:flex;flex-direction:column;align-items:center;cursor:pointer" @click="goArchiveMonth(bar.month)" :title="bar.tip">
          <div :style="{ width: '100%', height: bar.pct + '%', background: bar.isCurrent ? 'linear-gradient(to top,rgba(234,179,8,.85),rgba(234,179,8,.4))' : 'linear-gradient(to top,rgba(59,130,246,.5),rgba(59,130,246,.2))', borderRadius: '5px 5px 0 0', minHeight: '4px', transition: 'height .5s cubic-bezier(.34,1.56,.64,1)' }"></div>
          <div class="mth-lbl">{{ bar.label }}</div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="glass p-5 space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="stat-card p-4 text-center">
          <p class="text-[9px] opacity-45 mb-1">💵 إجمالي الكاش</p>
          <p class="text-lg font-black text-green-400"><span class="n">{{ n(yearCash) }}</span></p>
          <p class="text-[9px] opacity-35">{{ cur }}</p>
        </div>
        <div class="stat-card p-4 text-center">
          <p class="text-[9px] opacity-45 mb-1">🏦 إجمالي التحويل</p>
          <p class="text-lg font-black text-blue-400"><span class="n">{{ n(yearXfer) }}</span></p>
          <p class="text-[9px] opacity-35">{{ cur }}</p>
        </div>
      </div>
      <div class="stat-card p-4 space-y-2">
        <div class="text-center">
          <p class="text-[9px] opacity-45 mb-1">🦷 نسبة الطبيب — تركيبات ({{ cur }})</p>
          <p class="text-lg font-black text-yellow-400"><span class="n">{{ n(yearProsDoc) }}</span> {{ cur }}</p>
        </div>
        <div v-if="yearProsDoc > 0" class="border-t border-white/10 pt-2 grid grid-cols-2 gap-2 text-center">
          <div><p class="text-[9px] opacity-40">💵 كاش</p><p class="text-sm font-bold text-green-300"><span class="n">{{ n(yearProsCash) }}</span></p></div>
          <div><p class="text-[9px] opacity-40">🏦 تحويل</p><p class="text-sm font-bold text-blue-300"><span class="n">{{ n(yearProsXfer) }}</span></p></div>
        </div>
      </div>
      <div class="border-t border-white/10 pt-4 text-center">
        <p class="text-xs opacity-35 mb-2">إجمالي سنة <span class="n">{{ selectedYear }}</span></p>
        <p class="text-3xl font-black" style="color:var(--gold)"><span class="n">{{ n(yearGrand) }}</span></p>
        <p class="opacity-40 text-sm mt-1">{{ cur }}</p>
      </div>
    </div>

    <!-- Monthly Breakdown -->
    <div class="space-y-2">
      <span class="sec-h">التفاصيل الشهرية</span>
      <template v-for="(row, i) in monthRows" :key="i">
        <div v-if="row.total > 0" class="glass-sm p-3 flex justify-between items-center row-card clickable" style="border-radius:12px" @click="goArchiveMonth(row.month)">
          <div class="flex items-center gap-2">
            <span class="text-xs opacity-60">{{ row.name }}</span>
            <span class="text-[9px] opacity-30">← للتفاصيل</span>
          </div>
          <span class="text-xs font-bold" style="color:var(--gold)"><span class="n">{{ n(row.total) }}</span> {{ cur }}</span>
        </div>
      </template>
      <p v-if="!monthRows.some(r => r.total > 0)" class="text-xs opacity-30 text-center py-4">لا توجد بيانات لهذه السنة</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { sum, isProsDebtPay, prosDocEarnings, n } from '@/utils/helpers'

const router = useRouter()
const app = useAppStore()
const cur = computed(() => app.currency)

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

const years = computed(() => {
  const ys = new Set([
    ...app.records.map(r => r.date?.substring(0, 4)),
    ...app.prosthetics.map(p => p.date?.substring(0, 4)),
    String(new Date().getFullYear()),
  ])
  return [...ys].filter(Boolean).sort().reverse()
})

const selectedYear = ref(String(new Date().getFullYear()))

function yrRecs() { return app.records.filter(r => r.date?.startsWith(selectedYear.value) && !r.isDebt && !r.isPros && r.payment !== 'دين' && !isProsDebtPay(r, app.debts)) }
function yrPros() { return app.prosthetics.filter(p => p.date?.startsWith(selectedYear.value)) }
function yrPdPays() { return app.records.filter(r => r.date?.startsWith(selectedYear.value) && isProsDebtPay(r, app.debts)) }

const yearCash = computed(() => sum(yrRecs().filter(r => r.payment === 'كاش'), 'amount'))
const yearXfer = computed(() => sum(yrRecs().filter(r => r.payment !== 'كاش'), 'amount'))
const prosEarnings = computed(() => prosDocEarnings(yrPros(), yrPdPays()))
const yearProsDoc = computed(() => prosEarnings.value.pDoc)
const yearProsCash = computed(() => prosEarnings.value.pCash)
const yearProsXfer = computed(() => prosEarnings.value.pXfer)
const yearGrand = computed(() => yearCash.value + yearXfer.value + yearProsDoc.value)

function getMonthTotal(m) {
  const mr = app.records.filter(r => r.date?.startsWith(m) && !r.isDebt && !r.isPros && r.payment !== 'دين' && !isProsDebtPay(r, app.debts))
  const mp = app.prosthetics.filter(p => p.date?.startsWith(m))
  const mpp = app.records.filter(r => r.date?.startsWith(m) && isProsDebtPay(r, app.debts))
  return sum(mr, 'amount') + prosDocEarnings(mp, mpp).pDoc
}

const monthRows = computed(() => {
  return AR_MONTHS.map((mn, i) => {
    const m = `${selectedYear.value}-${String(i + 1).padStart(2, '0')}`
    return { name: mn, month: m, total: getMonthTotal(m) }
  })
})

const chartBars = computed(() => {
  const today = new Date()
  const curMo = today.toISOString().substring(0, 7)
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const lbl = AR_MONTHS[d.getMonth()].substring(0, 3)
    months.push({ month: m, label: lbl })
  }
  const vals = months.map(x => getMonthTotal(x.month))
  const maxV = Math.max(...vals, 1)
  return months.map((x, i) => ({
    ...x,
    pct: vals[i] ? Math.max(8, Math.round(vals[i] / maxV * 100)) : 4,
    isCurrent: x.month === curMo,
    tip: vals[i] ? (n(vals[i]) + ' ' + cur.value) : 'لا بيانات',
  }))
})

function goArchiveMonth(m) {
  app.selectedMonth = m
  app.activeTab = 'archive'
  router.push({ name: 'archive' })
}
</script>
