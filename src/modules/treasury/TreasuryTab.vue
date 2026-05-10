<template>
  <div>
    <!-- Main View -->
    <div v-if="!detailView" class="space-y-5">
      <div v-for="cli in clinics" :key="cli" class="space-y-2">
        <span class="sec-h">{{ cli }}</span>
        <div class="grid grid-cols-3 gap-2">
          <div class="stat-card p-3 text-center cursor-pointer" @click="showDetail('cash', cli)">
            <p class="text-[9px] opacity-45 mb-1"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="12" cy="15" r="2"/></svg> كاش</p>
            <p class="text-sm font-bold text-green-400"><span class="n">{{ n(getClinicCash(cli)) }}</span></p>
            <p class="text-[9px] opacity-30">{{ cur }}</p>
          </div>
          <div class="stat-card p-3 text-center cursor-pointer" @click="showDetail('xfer', cli)">
            <p class="text-[9px] opacity-45 mb-1"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 9h18"/><path d="M8 15h4"/></svg> تحويل</p>
            <p class="text-sm font-bold text-blue-400"><span class="n">{{ n(getClinicXfer(cli)) }}</span></p>
            <p class="text-[9px] opacity-30">{{ cur }}</p>
          </div>
          <div class="stat-card p-3 text-center cursor-pointer" @click="showDetail('pros', cli)">
            <p class="text-[9px] opacity-45 mb-1"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><path d="M12 2C8.5 2 7 4.5 7 7c0 3 1.5 6 2 9 .3 2 .7 4 1 5h4c.3-1 .7-3 1-5 .5-3 2-6 2-9 0-2.5-1.5-5-5-5z"/></svg> تركيبات</p>
            <p class="text-sm font-bold text-yellow-400"><span class="n">{{ n(getClinicProsDoc(cli)) }}</span></p>
            <p class="text-[9px] opacity-30">{{ cur }}</p>
          </div>
        </div>
        <!-- Pending Debts for clinic -->
        <div v-if="getClinicDebtRem(cli) > 0" class="stat-card p-3 flex justify-between items-center cursor-pointer" style="border-color:rgba(255,68,85,.2);background:rgba(255,68,85,.05)" @click="goDebts">
          <div class="flex items-center gap-2">
            <span style="color:var(--red)"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></span>
            <div>
              <p class="text-[9px] opacity-60 font-bold" style="color:var(--red)">ديون معلقة ({{ getClinicDebts(cli).length }})</p>
              <p class="text-[8px] opacity-40">لم تُضف للإيرادات بعد</p>
            </div>
          </div>
          <span class="text-sm font-black text-red-400"><span class="n">{{ n(getClinicDebtRem(cli)) }}</span> <span class="text-[9px] opacity-50">{{ cur }}</span></span>
        </div>
      </div>

      <!-- Grand Total -->
      <div class="glass p-4 mt-2">
        <div class="flex justify-between items-center mb-3">
          <p class="text-xs opacity-50 font-bold">إجمالي <span class="n">{{ month }}</span></p>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center mb-3">
          <div><p class="text-[9px] opacity-40">كاش (مدفوع)</p><p class="text-sm font-bold text-green-400"><span class="n">{{ n(totalCash) }}</span></p></div>
          <div><p class="text-[9px] opacity-40">تحويل (مدفوع)</p><p class="text-sm font-bold text-blue-400"><span class="n">{{ n(totalXfer) }}</span></p></div>
          <div><p class="text-[9px] opacity-40">تركيبات ({{ cur }})</p><p class="text-sm font-bold text-yellow-400"><span class="n">{{ n(totalProsDoc) }}</span></p></div>
        </div>
        <div class="border-t border-white/10 pt-3 text-center">
          <p class="text-[9px] opacity-35 mb-1">الدخل الفعلي (المحصّل)</p>
          <p class="text-2xl font-black" style="color:var(--gold)"><span class="n">{{ n(grandTotal) }}</span> {{ cur }}</p>
        </div>
        <div v-if="totalDebtRem > 0" class="border-t border-red-500/20 pt-3 mt-3 text-center cursor-pointer" @click="goDebts">
          <p class="text-[9px] opacity-45 mb-1 text-red-400 font-bold">⚠ رصيد الديون المعلقة (غير محصّل)</p>
          <p class="text-lg font-black text-red-400"><span class="n">{{ n(totalDebtRem) }}</span> {{ cur }}</p>
          <p class="text-[8px] opacity-30 mt-1">لا تُضاف للإيرادات حتى يتم التحصيل — اضغط لعرض الديون</p>
        </div>
      </div>
    </div>

    <!-- Detail View -->
    <div v-else>
      <div class="flex items-center gap-3 mb-4">
        <button @click="detailView = null" class="btn-o px-3 py-1.5 text-xs">← رجوع</button>
        <h3 class="font-bold text-sm flex-1" style="color:var(--gold)">{{ detailTitle }}</h3>
        <button @click="printDetail" class="btn-o px-3 py-1.5 text-xs">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> طباعة
        </button>
      </div>
      <div class="space-y-2">
        <div v-for="r in detailItems" :key="r.id" class="row-card p-3 flex justify-between items-center">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold">{{ r.name || '' }}</p>
            <p class="text-[9px] opacity-35">{{ r.date || '' }} | {{ r.service || r.clinic || '' }}</p>
          </div>
          <p class="text-xs font-bold text-green-400"><span class="n">{{ n(r.amount || r.doctorShare || 0) }}</span> {{ cur }}</p>
        </div>
        <div v-if="!detailItems.length" class="text-center py-8 opacity-30 text-sm">لا توجد بيانات</div>
      </div>
      <div class="glass p-3 mt-3 text-center">
        <p class="text-xs opacity-50 mb-1">الإجمالي</p>
        <p class="text-lg font-black" style="color:var(--gold)"><span class="n">{{ n(detailTotal) }}</span> {{ cur }}</p>
      </div>
    </div>

    <!-- Print Overlay -->
    <PrintOverlay :visible="showPrint" :title="printTitle" :html="printHtml" @close="showPrint = false" />
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { sum, isProsDebtPay, prosDocEarnings, sortByNewest, n } from '@/utils/helpers'

const PrintOverlay = defineAsyncComponent(() => import('@/components/PrintOverlay.vue'))

const router = useRouter()
const app = useAppStore()

const detailView = ref(null)
const detailCli = ref('')
const showPrint = ref(false)
const printTitle = ref('')
const printHtml = ref('')

const cur = computed(() => app.currency)
const month = computed(() => app.selectedMonth)
const clinics = computed(() => app.clinics)

function moRecs() {
  return app.records.filter(r => r.date?.startsWith(month.value) && !r.isDebt && !r.isPros && r.payment !== 'دين' && !isProsDebtPay(r, app.debts))
}
function moPros() { return app.prosthetics.filter(p => p.date?.startsWith(month.value)) }
function moPdPays() { return app.records.filter(r => r.date?.startsWith(month.value) && isProsDebtPay(r, app.debts)) }
function moDebts() { return app.debts.filter(d => (d.date || '').startsWith(month.value) && d.status !== 'paid') }

function getClinicCash(cli) { return sum(moRecs().filter(r => r.clinic === cli && r.payment === 'كاش'), 'amount') }
function getClinicXfer(cli) { return sum(moRecs().filter(r => r.clinic === cli && r.payment !== 'كاش'), 'amount') }
function getClinicProsDoc(cli) {
  const cp = moPros().filter(p => p.clinic === cli)
  const pd = moPdPays().filter(r => r.clinic === cli)
  return prosDocEarnings(cp, pd).pDoc
}
function getClinicDebts(cli) { return moDebts().filter(d => d.clinic === cli) }
function getClinicDebtRem(cli) { return getClinicDebts(cli).reduce((s, d) => s + (Number(d.remaining) || 0), 0) }

const totalCash = computed(() => sum(moRecs().filter(r => r.payment === 'كاش'), 'amount'))
const totalXfer = computed(() => sum(moRecs().filter(r => r.payment !== 'كاش'), 'amount'))
const totalProsDoc = computed(() => prosDocEarnings(moPros(), moPdPays()).pDoc)
const grandTotal = computed(() => totalCash.value + totalXfer.value + totalProsDoc.value)
const totalDebtRem = computed(() => moDebts().reduce((s, d) => s + (Number(d.remaining) || 0), 0))

function goDebts() {
  app.activeTab = 'debts'
  router.push({ name: 'debts' })
}

// Detail view
const detailTitle = computed(() => {
  if (!detailView.value) return ''
  const labels = { cash: 'كاش', xfer: 'تحويل', pros: 'تركيبات' }
  return `${detailCli.value} — ${labels[detailView.value] || ''}`
})

const detailItems = computed(() => {
  if (!detailView.value) return []
  const cli = detailCli.value
  const recs = moRecs().filter(r => r.clinic === cli)
  const pros = moPros().filter(p => p.clinic === cli)
  const pdPays = moPdPays().filter(r => r.clinic === cli)
  if (detailView.value === 'cash') return sortByNewest(recs.filter(r => r.payment === 'كاش'))
  if (detailView.value === 'xfer') return sortByNewest(recs.filter(r => r.payment !== 'كاش'))
  // pros: show all prosthetics
  return sortByNewest([...pros.filter(p => !p.isDebt), ...pdPays])
})

const detailTotal = computed(() => {
  if (detailView.value === 'pros') {
    const cli = detailCli.value
    return getClinicProsDoc(cli)
  }
  return detailItems.value.reduce((s, r) => s + (Number(r.amount || r.doctorShare) || 0), 0)
})

function showDetail(type, cli) {
  detailView.value = type
  detailCli.value = cli
}

function buildTable(headers, rows, totRow = null) {
  const ths = headers.map(h => `<th>${h}</th>`).join('')
  const trs = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
  const tot = totRow ? `<tr class="total-row">${totRow.map(c => `<td>${c}</td>`).join('')}</tr>` : ''
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}${tot}</tbody></table>`
}

function printDetail() {
  if (!detailItems.value.length) return
  const isP = detailView.value === 'pros'
  const c = cur.value
  if (isP) {
    const cli = detailCli.value
    const cp = moPros().filter(p => p.clinic === cli)
    const pd = moPdPays().filter(r => r.clinic === cli)
    const { pDoc } = prosDocEarnings(cp, pd)
    const headers = ['الاسم', 'التاريخ', 'الدفع', 'الإجمالي', 'المعمل', 'نسبة الطبيب']
    const prosRows = cp.map(p => [p.name, p.date, p.payment || '', n(p.total || 0) + ' ' + c, n(p.labValue || 0) + ' ' + c, n(p.doctorShare || 0) + ' ' + c])
    const pdRows = pd.map(r => [r.name, r.date, r.payment || '', 'دفعة دين', '—', n(r.amount || 0) + ' ' + c])
    const allRows = [...prosRows, ...pdRows]
    const tot = ['المجموع', '', '', '', '', n(pDoc) + ' ' + c]
    printTitle.value = detailTitle.value
    printHtml.value = `<h1>${detailTitle.value}</h1><p class="sub">${month.value}</p>${buildTable(headers, allRows, tot)}`
  } else {
    const headers = ['الاسم', 'التاريخ', 'الخدمة', 'القيمة', c]
    const rows = detailItems.value.map(r => [r.name, r.date, r.service || '', n(r.amount || 0) + ' ' + c, r.payment || ''])
    const tot = ['المجموع', '', '', n(detailItems.value.reduce((s, r) => s + (+r.amount || 0), 0)) + ' ' + c, '']
    printTitle.value = detailTitle.value
    printHtml.value = `<h1>${detailTitle.value}</h1><p class="sub">${month.value}</p>${buildTable(headers, rows, tot)}`
  }
  showPrint.value = true
}
</script>
