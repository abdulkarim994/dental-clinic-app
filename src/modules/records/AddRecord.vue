<template>
  <div class="space-y-4">
    <!-- Today Summary Bar -->
    <div class="today-bar mb-1">
      <div class="today-cell">
        <div class="today-val">{{ todayPatients || '—' }}</div>
        <div class="today-lbl">مريض اليوم</div>
      </div>
      <div class="today-cell">
        <div class="today-val" :style="{ fontSize: 'calc(12px * var(--fs))' }">{{ todayIncome > 0 ? n(todayIncome) : '—' }}</div>
        <div class="today-lbl">دخل اليوم</div>
      </div>
      <div class="today-cell" v-if="pendingDebts > 0" @click="goTab('debts')" style="cursor:pointer">
        <div class="today-val" style="color:var(--red)">{{ n(pendingDebtTotal) }}</div>
        <div class="today-lbl" style="color:var(--red)">ديون معلقة ({{ pendingDebts }})</div>
      </div>
    </div>

    <div class="glass p-5 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="font-bold text-sm" style="color:var(--gold-l)">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          {{ editId ? 'تعديل القيد' : 'إدخال جديد' }}
        </h2>
        <div class="flex gap-1.5">
          <button @click="setToday" class="btn-o px-3 py-1 text-xs">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> اليوم
          </button>
          <button @click="toggleFastMode" class="btn-o px-2 py-1 text-xs" :class="{ 'qs-on': fastMode }" title="وضع الكشف السريع">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
          </button>
        </div>
      </div>

      <!-- Date + Amount -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-[10px] opacity-45 mb-1 block">التاريخ</label>
          <input type="date" v-model="form.date" class="inp text-xs">
        </div>
        <div>
          <label class="text-[10px] opacity-45 mb-1 block">القيمة ({{ cur }})</label>
          <input type="number" v-model.number="form.amount" class="inp" placeholder="0" min="0" @input="calcPros">
        </div>
      </div>

      <!-- Patient Name -->
      <div>
        <label class="text-[10px] opacity-45 mb-1 block">اسم المريض</label>
        <input type="text" v-model="form.name" class="inp" placeholder="ابحث أو أدخل اسماً جديداً" autocomplete="off" @input="onNameInput">
        <div v-if="nameSuggestions.length" class="mt-1.5 flex flex-wrap gap-1.5 items-center p-2 rounded-xl" style="background:rgba(234,179,8,.06);border:1px solid rgba(234,179,8,.2)">
          <span class="text-[10px] opacity-60">مسجل مسبقاً:</span>
          <button v-for="s in nameSuggestions" :key="s" @click="form.name = s" class="qs-btn text-[10px] px-2 py-0.5">{{ s }}</button>
        </div>
      </div>

      <!-- Clinic + Payment (hidden in fast mode) -->
      <div class="grid grid-cols-2 gap-3" v-if="!fastMode">
        <div>
          <label class="text-[10px] opacity-45 mb-1 block">العيادة</label>
          <select v-model="form.clinic" class="inp text-xs">
            <option v-for="c in clinics" :key="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] opacity-45 mb-1 block">طريقة الدفع</label>
          <select v-model="form.payment" class="inp text-xs">
            <option v-for="p in payments" :key="p">{{ p }}</option>
          </select>
        </div>
      </div>

      <!-- Service -->
      <div>
        <label class="text-[10px] opacity-45 mb-1 block">الخدمة</label>
        <select v-model="form.service" class="inp text-xs" @change="onSvcChange">
          <option v-for="s in services" :key="s">{{ s }}</option>
        </select>
      </div>

      <!-- Quick Service Buttons -->
      <div v-if="services.length">
        <span class="text-[10px] opacity-35 block mb-1.5">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg> اختيار سريع
        </span>
        <div class="flex gap-1.5 flex-wrap">
          <button v-for="s in services" :key="s" type="button"
            class="qs-btn" :class="{ 'qs-on': form.service === s }"
            @click="quickPickSvc(s)">
            <span style="word-break:break-word;max-width:100px">{{ s }}</span>
            <span v-if="svcPrices[s]" class="qs-price">{{ n(svcPrices[s]) }}</span>
          </button>
        </div>
      </div>

      <!-- Lab Row (prosthetics) -->
      <div v-if="isPros" class="glass-sm p-3 space-y-2">
        <label class="text-[10px] opacity-45 block">قيمة المعمل ({{ cur }})</label>
        <input type="number" v-model.number="form.labValue" class="inp" placeholder="0" min="0" @input="calcPros">
        <div class="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label class="text-[10px] opacity-45 block mb-1">تاريخ الإرسال للمعمل</label>
            <input type="date" v-model="form.labSentDate" class="inp text-xs">
          </div>
          <div>
            <label class="text-[10px] opacity-45 block mb-1">التاريخ المتوقع للاستلام</label>
            <input type="date" v-model="form.labExpectedDate" class="inp text-xs">
          </div>
        </div>
        <div>
          <label class="text-[10px] opacity-45 block mb-1">حالة المعمل</label>
          <div class="lab-status-grid">
            <button type="button" v-for="st in labStatuses" :key="st.value"
              class="lab-status-btn" :class="{ 'ls-active': form.labStatus === st.value, [st.cls]: true }"
              @click="form.labStatus = st.value">
              <span class="ls-icon" v-html="st.icon"></span>
              <span class="ls-label">{{ st.label }}</span>
            </button>
          </div>
        </div>
        <div class="space-y-1.5 pt-1">
          <div class="flex justify-between text-xs"><span class="opacity-50">صافي الربح:</span><span class="n font-bold" style="color:var(--gold)">{{ n(prosNet) }}</span></div>
          <div class="flex justify-between text-xs"><span class="opacity-50">نسبة الطبيب ({{ doctorPct }}%):</span><span class="n font-bold text-green-400">{{ n(prosDocShare) }}</span></div>
          <div class="flex justify-between text-xs"><span class="opacity-50">نسبة العيادة ({{ 100 - doctorPct }}%):</span><span class="n font-bold text-blue-400">{{ n(prosClinShare) }}</span></div>
        </div>
      </div>

      <!-- Report Toggle -->
      <div v-if="!fastMode" class="glass-sm p-3 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold">تقرير</p>
          <p class="text-[9px] opacity-40">تقرير المعالجات (اختياري)</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button v-if="hasReport" @click="showReportModal = true" class="btn-o px-3 py-1.5 text-xs flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            تحديد
          </button>
          <label class="tgl"><input type="checkbox" v-model="hasReport" @change="onReportTgl"><span class="tgl-s"></span></label>
        </div>
      </div>
      <div v-if="hasReport && reportEntries.length" class="glass-sm p-2 rounded-xl">
        <p class="text-[9px] opacity-40 mb-1">التقرير: {{ reportEntries.length }} معالجة — {{ n(reportTotal) }} {{ cur }}</p>
      </div>

      <!-- Report Modal Popup -->
      <ToothReport
        :visible="showReportModal"
        v-model="reportEntries"
        :reportMeta="reportMeta"
        :currency="cur"
        :formAmount="form.amount || 0"
        :patientName="form.name"
        :patientPhone="form.phone"
        @update:reportMeta="reportMeta = $event"
        @confirm="onReportConfirm"
        @close="showReportModal = false"
        @update-amount="form.amount = $event"
      />

      <!-- Debt Toggle -->
      <div class="glass-sm p-3 flex items-center justify-between" v-if="!fastMode">
        <div><p class="text-xs font-bold">تسجيل كدين؟</p><p class="text-[9px] opacity-40">لن يُضاف للخزينة حتى الدفع</p></div>
        <label class="tgl"><input type="checkbox" v-model="form.isDebt"><span class="tgl-s"></span></label>
      </div>

      <!-- Debt Fields -->
      <div v-if="form.isDebt" class="space-y-3">
        <div class="glass-sm p-3 space-y-2">
          <label class="text-[10px] opacity-45 block">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8"/></svg> الدفعة الأولى (اختياري)
          </label>
          <input type="number" v-model.number="form.firstPay" class="inp" placeholder="0 — اترك فارغاً إذا لم تُدفع شيء" min="0">
          <p class="text-[9px] opacity-35">تُسجَّل كدفعة جزئية فورية في السجلات والخزينة</p>
        </div>
        <input type="tel" v-model="form.phone" class="inp" placeholder=" رقم الهاتف (اختياري)">
        <textarea v-model="form.notes" class="inp h-16 resize-none text-xs" placeholder="ملاحظات..."></textarea>
      </div>

      <!-- Appointment -->
      <div v-if="showAppt && !fastMode" class="appt-field" style="display:flex;align-items:center;gap:8px">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;opacity:.55"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <span class="text-[10px] opacity-50 flex-shrink-0">موعد المتابعة:</span>
        <input type="date" v-model="form.appointment" class="inp flex-1 text-xs" style="padding:4px 8px;min-height:36px">
      </div>
      <button v-if="!fastMode" @click="goFollowUpAppt" class="btn-o w-full py-2 text-xs flex items-center justify-center gap-1.5">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        إضافة موعد متابعة (اختياري)
      </button>

      <!-- Save Button -->
      <button @click="saveRec" :disabled="saving" class="btn-g w-full py-4 text-sm shadow-lg">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        {{ editId ? 'تحديث البيانات' : 'حفظ البيانات' }}
      </button>
      <button v-if="editId" @click="resetForm" class="w-full btn-del py-2.5 text-xs rounded-xl">✕ إلغاء التعديل</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, provide, onMounted, onActivated, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { formatNumber, isProsthetic, getCurrentDate } from '@/utils/format'
import { fuzzyMatch } from '@/utils/search'
import { markMonthDirty, markDebtsDirty } from '@/services/sync.service'
import { sum, isProsDebtPay, prosDocEarnings, n } from '@/utils/helpers'
import ToothReport from './components/ToothReport.vue'

const router = useRouter()
const route = useRoute()
const app = useAppStore()
const auth = useAuthStore()
const { toast } = useToast()

const saving = ref(false)
const fastMode = ref(false)
const showAppt = ref(false)
const editId = ref(null)
const editType = ref('')
const hasReport = ref(false)
const showReportModal = ref(false)
const reportEntries = ref([])
const reportMeta = ref({})

const reportTotal = computed(() => reportEntries.value.reduce((s, e) => s + (+e.cost || 0), 0))

function onReportConfirm() {
  hasReport.value = reportEntries.value.length > 0
  showReportModal.value = false
}

function onReportTgl() {
  if (hasReport.value) {
    showReportModal.value = true
  } else {
    reportEntries.value = []
    reportMeta.value = {}
  }
}

const form = ref({
  date: getCurrentDate(),
  amount: null,
  name: '',
  clinic: '',
  payment: '',
  service: '',
  isDebt: false,
  phone: '',
  notes: '',
  firstPay: null,
  labValue: null,
  labSentDate: '',
  labExpectedDate: '',
  labStatus: '',
  appointment: '',
})

// Handle ?name= from patients tab (add visit for patient)
function handleQueryName() {
  const q = route.query
  if (q.name) {
    form.value.name = q.name
    // Also fill phone if available
    const patPhone = app.records.find(r => r.name === q.name)?.phone ||
      app.debts.find(d => d.name === q.name)?.phone ||
      app.appointments.find(a => a.name === q.name)?.phone || ''
    if (patPhone && !form.value.phone) form.value.phone = patPhone
    router.replace({ name: 'add', query: {} })
  }
}
onMounted(handleQueryName)
onActivated(handleQueryName)

const cur = computed(() => app.currency)
const clinics = computed(() => app.clinics)
const services = computed(() => app.services)
const payments = computed(() => app.payments)
const doctorPct = computed(() => app.config.doctorPct || 50)
const svcPrices = computed(() => app.config.servicePrices || {})

// Set defaults when clinics/payments/services load
watch([clinics, payments, services], () => {
  if (!form.value.clinic && clinics.value.length) form.value.clinic = clinics.value[0]
  if (!form.value.payment && payments.value.length) form.value.payment = payments.value[0]
  if (!form.value.service && services.value.length) form.value.service = services.value[0]
}, { immediate: true })

const labStatuses = [
  { value: '', label: 'لم يُرسل بعد', cls: 'ls-none', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>' },
  { value: 'pending', label: 'قيد التنفيذ', cls: 'ls-pending', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' },
  { value: 'ready', label: 'جاهز للاستلام', cls: 'ls-ready', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>' },
  { value: 'delivered', label: 'تم الاستلام', cls: 'ls-delivered', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>' },
  { value: 'late', label: 'متأخر', cls: 'ls-late', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
]

const isPros = computed(() => isProsthetic(form.value.service))
const prosNet = computed(() => (form.value.amount || 0) - (form.value.labValue || 0))
const prosDocShare = computed(() => prosNet.value * (doctorPct.value / 100))
const prosClinShare = computed(() => prosNet.value * ((100 - doctorPct.value) / 100))

// Name suggestions
const nameSuggestions = ref([])
function onNameInput() {
  const q = (form.value.name || '').trim()
  if (q.length < 2) { nameSuggestions.value = []; return }
  const allNames = new Set([
    ...app.records.map(r => r.name),
    ...app.prosthetics.map(p => p.name),
  ].filter(Boolean))
  nameSuggestions.value = [...allNames]
    .filter(name => fuzzyMatch(q, name))
    .slice(0, 5)
}

function onSvcChange() {
  const p = svcPrices.value[form.value.service]
  if (p && !form.value.amount) form.value.amount = p
}

function quickPickSvc(svc) {
  form.value.service = svc
  const p = svcPrices.value[svc]
  if (p) form.value.amount = p
  onSvcChange()
}

function calcPros() { /* reactivity handles it */ }

function setToday() {
  form.value.date = getCurrentDate()
  app.selectedMonth = new Date().toISOString().substring(0, 7)
}

function toggleFastMode() {
  fastMode.value = !fastMode.value
}

function goTab(id) {
  app.activeTab = id
  router.push({ name: id })
}

// Today summary
const todayPatients = computed(() => {
  const today = getCurrentDate()
  const names = new Set([
    ...app.records.filter(r => r.date === today).map(r => r.name),
    ...app.prosthetics.filter(p => p.date === today).map(p => p.name),
  ].filter(Boolean))
  return names.size
})

const todayIncome = computed(() => {
  const today = getCurrentDate()
  const debts = app.debts
  const tRec = app.records.filter(r => r.date === today && !r.isDebt && !r.isPros && r.payment !== 'دين' && !isProsDebtPay(r, debts))
  const tPros = app.prosthetics.filter(p => p.date === today)
  const tPdP = app.records.filter(r => r.date === today && isProsDebtPay(r, debts))
  const tDebtPays = app.records.filter(r => r.date === today && r.isDebtPayment && !isProsDebtPay(r, debts))
  const { pDoc } = prosDocEarnings(tPros, tPdP)
  return sum(tRec, 'amount') + pDoc + sum(tDebtPays, 'amount')
})

const pendingDebts = computed(() => app.debts.filter(d => d.status !== 'paid').length)
const pendingDebtTotal = computed(() => app.debts.filter(d => d.status !== 'paid').reduce((s, d) => s + (Number(d.remaining) || 0), 0))

// Expose editRec for external calls
provide('editRec', editRec)

function editRec(id, type) {
  if (type === 'p') {
    const p = app.prosthetics.find(x => x.id === id)
    if (!p) return
    editId.value = p.id
    editType.value = 'p'
    form.value = {
      date: p.date, amount: p.total, name: p.name,
      clinic: p.clinic, service: services.value.find(s => isProsthetic(s)) || 'تركيبات',
      payment: p.payment === 'دين' ? (payments.value[0] || 'كاش') : p.payment,
      isDebt: !!p.isDebt, phone: '', notes: '',
      labValue: p.labValue || 0, labSentDate: p.labSentDate || '',
      labExpectedDate: p.labExpectedDate || '', labStatus: p.labStatus || '',
      firstPay: null, appointment: p.appointment || '',
    }
    if (p.isDebt) {
      const d = app.debts.find(x => x.prostheticId === p.id)
      form.value.phone = d?.phone || ''
      form.value.notes = d?.notes || ''
    }
    if (p.report && (Array.isArray(p.report) ? p.report.length : p.report.entries?.length)) {
      hasReport.value = true
      reportEntries.value = JSON.parse(JSON.stringify(Array.isArray(p.report) ? p.report : p.report.entries || []))
      reportMeta.value = p.report.meta ? { ...p.report.meta } : {}
    }
  } else {
    const r = app.records.find(x => x.id === id)
    if (!r) return
    editId.value = r.id
    editType.value = 'r'
    form.value = {
      date: r.date, amount: r.amount, name: r.name,
      clinic: r.clinic, service: r.service,
      payment: r.payment === 'دين' ? (payments.value[0] || 'كاش') : r.payment,
      isDebt: !!r.isDebt, phone: '', notes: '',
      labValue: null, labSentDate: '', labExpectedDate: '', labStatus: '',
      firstPay: null, appointment: r.appointment || '',
    }
    if (r.isDebt) {
      const d = app.debts.find(x => x.recordId === r.id)
      form.value.phone = d?.phone || ''
      form.value.notes = d?.notes || ''
    }
    if (r.report && (Array.isArray(r.report) ? r.report.length : r.report.entries?.length)) {
      hasReport.value = true
      reportEntries.value = JSON.parse(JSON.stringify(Array.isArray(r.report) ? r.report : r.report.entries || []))
      reportMeta.value = r.report.meta ? { ...r.report.meta } : {}
    }
  }
  if (form.value.appointment) showAppt.value = true
}

async function saveRec() {
  if (saving.value) return
  saving.value = true

  const { name, amount, date, clinic, service, payment, isDebt, phone, notes, appointment } = form.value
  if (!name?.trim()) { toast('يرجى إدخال اسم المريض'); saving.value = false; return }
  if (!date) { toast('يرجى اختيار التاريخ'); saving.value = false; return }
  if (isNaN(amount) || amount <= 0) { toast('يرجى إدخال قيمة صحيحة أكبر من صفر'); saving.value = false; return }
  if (!clinic) { toast('يرجى اختيار العيادة'); saving.value = false; return }
  if (!service) { toast('يرجى اختيار الخدمة'); saving.value = false; return }

  const uid = auth.uid
  const now_mod = Date.now()
  const ip = isProsthetic(service)
  const lab = ip ? (form.value.labValue || 0) : 0
  const net = amount - lab
  const dp = doctorPct.value
  const docShare = net * (dp / 100)
  const clinShare = net * ((100 - dp) / 100)

  if (editId.value) {
    const oldP = app.prosthetics.find(x => x.id === editId.value)
    const oldR = app.records.find(x => x.id === editId.value)
    const oldDate = oldP?.date || oldR?.date
    if (oldDate && oldDate.substring(0, 7) !== date.substring(0, 7)) markMonthDirty(oldDate)
  }

  if (ip) {
    const pid = editId.value || now_mod
    const pEntry = {
      id: pid, uid, date, name: name.trim(), total: amount, labValue: lab,
      doctorShare: docShare, clinicShare: clinShare,
      payment: isDebt ? 'دين' : payment, clinic, isDebt, _mod: now_mod, _t: 'p',
      ...(form.value.labStatus ? { labStatus: form.value.labStatus } : {}),
      ...(form.value.labSentDate ? { labSentDate: form.value.labSentDate } : {}),
      ...(form.value.labExpectedDate ? { labExpectedDate: form.value.labExpectedDate } : {}),
      ...(appointment ? { appointment } : {}),
      report: hasReport.value && reportEntries.value.length > 0 ? { entries: JSON.parse(JSON.stringify(reportEntries.value)), meta: { ...reportMeta.value } } : null,
    }

    if (editId.value) {
      const idx = app.prosthetics.findIndex(x => x.id === pid)
      if (idx >= 0) app.prosthetics[idx] = pEntry; else app.prosthetics.push(pEntry)
      const dIdx = app.debts.findIndex(d => d.prostheticId === pid)
      if (dIdx >= 0) {
        const oldPaid = Number(app.debts[dIdx].paidAmount) || 0
        app.debts[dIdx].total = amount
        app.debts[dIdx].labValue = lab
        app.debts[dIdx].name = name.trim()
        app.debts[dIdx].date = date
        app.debts[dIdx].clinic = clinic
        app.debts[dIdx].remaining = Math.max(0, amount - oldPaid)
        app.debts[dIdx]._mod = now_mod
        if (app.debts[dIdx].remaining <= 0.01) app.debts[dIdx].status = 'paid'
      }
    } else {
      app.prosthetics.push(pEntry)
      if (isDebt) {
        const firstPay = form.value.firstPay || 0
        const dId = now_mod + 1
        const labRem = Math.max(0, lab)
        const toLab = Math.min(firstPay, labRem)
        const toProfit = firstPay - toLab
        const initPaid = Math.min(firstPay, amount)
        const initRem = Math.max(0, amount - initPaid)
        const isFull = initRem <= 0.01
        const newDebt = {
          id: dId, uid, date, name: name.trim(), phone, notes,
          type: 'prosthetic', status: isFull ? 'paid' : (firstPay > 0 ? 'partial' : 'unpaid'),
          total: amount, labValue: lab, labPaid: toLab,
          paidAmount: initPaid, remaining: initRem,
          doctorEarned: toProfit * (dp / 100), payment, clinic,
          prostheticId: pid, installments: [], _mod: dId, _t: 'd',
        }
        if (firstPay > 0) {
          newDebt.installments = [{ id: dId + 1, amount: firstPay, date, payment }]
          if (toProfit > 0) {
            app.records.push({
              id: dId + 2, uid, date, name: name.trim(),
              amount: toProfit * (dp / 100), clinic,
              service: 'تركيبات (دفعة أولى)', payment,
              isDebt: false, isPros: false, isDebtPayment: true,
              debtId: dId, debtPaymentType: isFull ? 'full' : 'partial',
              _mod: dId + 2, _t: 'r',
            })
          }
        }
        app.debts.push(newDebt)
      }
    }
  } else {
    const rid = editId.value || now_mod
    const rEntry = {
      id: rid, uid, date, name: name.trim(), amount,
      clinic, service, payment: isDebt ? 'دين' : payment,
      isDebt, isPros: false,
      phone: isDebt ? phone : null, notes: isDebt ? notes : null, _mod: now_mod, _t: 'r',
      ...(appointment ? { appointment } : {}),
      report: hasReport.value && reportEntries.value.length > 0 ? { entries: JSON.parse(JSON.stringify(reportEntries.value)), meta: { ...reportMeta.value } } : null,
    }

    if (editId.value) {
      const idx = app.records.findIndex(x => x.id === rid)
      if (idx >= 0) app.records[idx] = rEntry; else app.records.push(rEntry)
      const dIdx = app.debts.findIndex(d => d.recordId === rid)
      if (dIdx >= 0) {
        const oldPaid = Number(app.debts[dIdx].paidAmount) || 0
        app.debts[dIdx].totalAmount = amount
        app.debts[dIdx].name = name.trim()
        app.debts[dIdx].date = date
        app.debts[dIdx].clinic = clinic
        app.debts[dIdx].remaining = Math.max(0, amount - oldPaid)
        app.debts[dIdx]._mod = now_mod
        if (app.debts[dIdx].remaining <= 0.01) app.debts[dIdx].status = 'paid'
      }
    } else {
      app.records.push(rEntry)
      if (isDebt) {
        const firstPay = form.value.firstPay || 0
        const dId = now_mod + 1
        const initPaid = Math.min(firstPay, amount)
        const initRem = Math.max(0, amount - initPaid)
        const isFull = initRem <= 0.01
        const newDebt = {
          id: dId, uid, date, name: name.trim(), phone, notes,
          type: 'regular', status: isFull ? 'paid' : (firstPay > 0 ? 'partial' : 'unpaid'),
          totalAmount: amount, paidAmount: initPaid, remaining: initRem,
          payment, clinic, recordId: rid, installments: [], _mod: dId, _t: 'd',
        }
        if (firstPay > 0) {
          newDebt.installments = [{ id: dId + 1, amount: firstPay, date, payment }]
          app.records.push({
            id: dId + 2, uid, date, name: name.trim(),
            amount: firstPay, clinic,
            service: 'دفعة أولى (دين)', payment,
            isDebt: false, isPros: false, isDebtPayment: true,
            debtId: dId, debtPaymentType: isFull ? 'full' : 'partial',
            _mod: dId + 2, _t: 'r',
          })
        }
        app.debts.push(newDebt)
      }
    }
  }

  markMonthDirty(date)
  markDebtsDirty()
  app.saveToCache(uid)
  app.syncSave(uid, false)
  resetForm()
  toast('✅ تم الحفظ بنجاح')
  saving.value = false
}

function goFollowUpAppt() {
  const name = (form.value.name || '').trim()
  const phone = (form.value.phone || '').trim()
  const svc = (form.value.service || '').trim()
  app.activeTab = 'calendar'
  router.push({ name: 'calendar', query: { followup: '1', name, phone, service: svc } })
}

function resetForm() {
  editId.value = null
  editType.value = ''
  showAppt.value = false
  hasReport.value = false
  reportEntries.value = []
  reportMeta.value = {}
  form.value = {
    date: getCurrentDate(),
    amount: null, name: '', clinic: clinics.value[0] || '',
    payment: payments.value[0] || '', service: services.value[0] || '',
    isDebt: false, phone: '', notes: '', firstPay: null,
    labValue: null, labSentDate: '', labExpectedDate: '', labStatus: '',
    appointment: '',
  }
  nameSuggestions.value = []
}
</script>
