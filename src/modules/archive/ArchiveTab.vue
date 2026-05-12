<template>
  <div>
    <!-- List View -->
    <div v-if="!detailMonth" class="space-y-3">
      <div v-if="!months.length" class="text-center py-16 opacity-25">
        <svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto;display:block;color:var(--gold)"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        <p class="text-sm font-bold mt-3">لا توجد بيانات مسجلة</p>
      </div>
      <div v-for="m in months" :key="m" class="glass p-4 cursor-pointer transition-all hover:border-yellow-400/30" @click="openDetail(m)">
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;color:var(--gold)"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
            <span class="font-black text-sm" style="color:var(--gold-l)"><span class="n">{{ m }}</span></span>
          </div>
          <div class="text-left" v-if="monthData(m).inMem">
            <p class="text-base font-black" style="color:var(--gold)"><span class="n">{{ n(monthData(m).total) }}</span> {{ cur }}</p>
            <p class="text-[9px] opacity-35">إجمالي الدخل</p>
          </div>
          <span v-else class="text-xs opacity-45">اضغط للتحميل ↗</span>
        </div>
        <div v-if="monthData(m).inMem" class="grid grid-cols-3 gap-2 text-center">
          <div><p class="text-[9px] opacity-35"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="12" cy="15" r="2"/></svg> كاش</p><p class="text-xs font-bold text-green-400"><span class="n">{{ n(monthData(m).cash) }}</span></p></div>
          <div><p class="text-[9px] opacity-35"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 9h18"/><path d="M8 15h4"/></svg> تحويل</p><p class="text-xs font-bold text-blue-400"><span class="n">{{ n(monthData(m).xfer) }}</span></p></div>
          <div>
            <p class="text-[9px] opacity-35"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><path d="M12 2C8.5 2 7 4.5 7 7c0 3 1.5 6 2 9 .3 2 .7 4 1 5h4c.3-1 .7-3 1-5 .5-3 2-6 2-9 0-2.5-1.5-5-5-5z"/></svg> تركيبات ({{ cur }})</p>
            <p class="text-xs font-bold text-yellow-400"><span class="n">{{ n(monthData(m).prosDoc) }}</span></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail View -->
    <div v-else>
      <div class="flex items-center gap-3 mb-4">
        <button @click="detailMonth = null" class="btn-o px-3 py-1.5 text-xs">← رجوع</button>
        <h3 class="font-bold text-sm flex-1" style="color:var(--gold)"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> {{ detailMonth }}</h3>
        <button @click="printMonth" class="btn-o px-3 py-1.5 text-xs">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> طباعة
        </button>
      </div>
      <div class="glass p-4 space-y-3">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="stat-card p-3"><p class="text-[9px] opacity-40"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="12" cy="15" r="2"/></svg> كاش</p><p class="text-sm font-bold text-green-400"><span class="n">{{ n(detailData.cash) }}</span></p></div>
          <div class="stat-card p-3"><p class="text-[9px] opacity-40"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 9h18"/><path d="M8 15h4"/></svg> تحويل</p><p class="text-sm font-bold text-blue-400"><span class="n">{{ n(detailData.xfer) }}</span></p></div>
          <div class="stat-card p-3">
            <p class="text-[9px] opacity-40"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-1px"><path d="M12 2C8.5 2 7 4.5 7 7c0 3 1.5 6 2 9 .3 2 .7 4 1 5h4c.3-1 .7-3 1-5 .5-3 2-6 2-9 0-2.5-1.5-5-5-5z"/></svg> تركيبات ({{ cur }})</p>
            <p class="text-sm font-bold text-yellow-400"><span class="n">{{ n(detailData.prosDoc) }}</span></p>
          </div>
        </div>
        <div class="border-t border-white/10 pt-3 text-center">
          <p class="text-[9px] opacity-35 mb-1">الإجمالي الكلي</p>
          <p class="text-2xl font-black" style="color:var(--gold)"><span class="n">{{ n(detailData.total) }}</span> {{ cur }}</p>
        </div>
      </div>
      <div class="space-y-2 mt-3">
        <span class="sec-h">سجلات الشهر</span>
        <div v-for="r in detailRecords" :key="r.id" class="row-card p-3 flex justify-between items-center">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold">{{ r.name || '' }}</p>
            <p class="text-[9px] opacity-35">{{ r.date || '' }} | {{ r.service || '' }}</p>
          </div>
          <p class="text-xs font-bold text-green-400"><span class="n">{{ n(r.amount || r.doctorShare || 0) }}</span> {{ cur }}</p>
        </div>
        <div v-if="!detailRecords.length" class="text-center py-8 opacity-30 text-sm">لا توجد سجلات</div>
      </div>
    </div>

    <PrintOverlay :visible="showPrint" :title="printTitle" :html="printHtml" @close="showPrint = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { loadAllMonths, getKnownMonths } from '@/services/sync.service'
import { sum, isProsDebtPay, prosDocEarnings, sortByNewest, n } from '@/utils/helpers'

const PrintOverlay = defineAsyncComponent(() => import('@/components/PrintOverlay.vue'))

const app = useAppStore()
const auth = useAuthStore()

onMounted(async () => {
  const data = await loadAllMonths(auth.uid)
  if (data.records.length || data.prosthetics.length) {
    app.records = [...app.records, ...data.records]
    app.prosthetics = [...app.prosthetics, ...data.prosthetics]
    app.saveToCache(auth.uid)
  }
})
const detailMonth = ref(null)
const showPrint = ref(false)
const printTitle = ref('')
const printHtml = ref('')
const cur = computed(() => app.currency)

const months = computed(() => {
  const inMem = [...new Set([
    ...app.records.map(r => r.date?.substring(0, 7)),
    ...app.prosthetics.map(p => p.date?.substring(0, 7)),
  ])].filter(Boolean)
  const known = [...getKnownMonths()]
  return [...new Set([...inMem, ...known])].sort().reverse()
})

function getMonthRecs(m) {
  return app.records.filter(r => r.date?.startsWith(m) && !r.isDebt && !r.isPros && r.payment !== 'دين' && !isProsDebtPay(r, app.debts))
}
function getMonthPros(m) { return app.prosthetics.filter(p => p.date?.startsWith(m)) }
function getMonthPdPays(m) { return app.records.filter(r => r.date?.startsWith(m) && isProsDebtPay(r, app.debts)) }

function monthData(m) {
  const mr = getMonthRecs(m)
  const mp = getMonthPros(m)
  const pd = getMonthPdPays(m)
  const inMem = mr.length > 0 || mp.length > 0 || pd.length > 0
  const cash = sum(mr.filter(r => r.payment === 'كاش'), 'amount')
  const xfer = sum(mr.filter(r => r.payment !== 'كاش'), 'amount')
  const { pDoc: prosDoc } = prosDocEarnings(mp, pd)
  return { inMem, cash, xfer, prosDoc, total: cash + xfer + prosDoc }
}

function openDetail(m) { detailMonth.value = m }

const detailData = computed(() => {
  if (!detailMonth.value) return { cash: 0, xfer: 0, prosDoc: 0, total: 0 }
  return monthData(detailMonth.value)
})

const detailRecords = computed(() => {
  if (!detailMonth.value) return []
  const m = detailMonth.value
  const mr = getMonthRecs(m)
  const mp = getMonthPros(m).filter(p => !p.isDebt)
  const pd = getMonthPdPays(m)
  return sortByNewest([...mr, ...mp, ...pd])
})

function buildTable(headers, rows, totRow = null) {
  const ths = headers.map(h => `<th>${h}</th>`).join('')
  const trs = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
  const tot = totRow ? `<tr class="total-row">${totRow.map(c => `<td>${c}</td>`).join('')}</tr>` : ''
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}${tot}</tbody></table>`
}

function printMonth() {
  const m = detailMonth.value
  if (!m) return
  const c = cur.value
  const mr = getMonthRecs(m)
  const mp = getMonthPros(m)
  const pd = getMonthPdPays(m)
  const data = detailData.value
  let html = `<h1>تقرير شهر ${m}</h1><p class="sub">${app.config.centerName || ''}</p>
    <h3 style="margin:12px 0 6px;color:#0a1428">الملخص</h3>
    <table><thead><tr><th>كاش</th><th>تحويل</th><th>تركيبات</th><th>الإجمالي</th></tr></thead>
    <tbody><tr><td>${n(data.cash)} ${c}</td><td>${n(data.xfer)} ${c}</td><td class="pros-td">${n(data.prosDoc)} ${c}</td><td><strong>${n(data.total)} ${c}</strong></td></tr></tbody></table>`
  if (mr.length) {
    const recRows = mr.map(r => [r.name, r.date, r.service || '', r.payment || '', n(r.amount) + ' ' + c])
    html += `<h3 style="margin:16px 0 6px;color:#0a1428">السجلات</h3>` + buildTable(['الاسم', 'التاريخ', 'الخدمة', 'الدفع', 'القيمة'], recRows, ['المجموع', '', '', '', n(sum(mr, 'amount')) + ' ' + c])
  }
  if (mp.length) {
    const prosRows = mp.map(p => [p.name, p.date, 'تركيبات', n(p.total) + ' ' + c, n(p.labValue || 0) + ' ' + c, n(p.doctorShare) + ' ' + c])
    html += `<h3 style="margin:16px 0 6px;color:#0a1428">التركيبات</h3>` + buildTable(['الاسم', 'التاريخ', 'النوع', 'الإجمالي', 'المعمل', 'نسبة الطبيب'], prosRows, ['المجموع', '', '', '', '', n(data.prosDoc) + ' ' + c])
  }
  printTitle.value = 'تقرير ' + m
  printHtml.value = html
  showPrint.value = true
}
</script>
