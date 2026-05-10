<template>
  <div class="max-w-lg mx-auto px-4 mt-4 space-y-4" :class="{ 'fast-mode-on': ui.fastMode }">
    <!-- Today Summary Bar -->
    <div class="today-bar mb-1" v-html="todayBarHtml"></div>

    <!-- Main Form Card -->
    <div class="glass p-5 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="font-bold text-sm" style="color:var(--gold-l)">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          {{ editId ? 'تعديل السجل' : 'إدخال جديد' }}
        </h2>
        <div class="flex gap-1.5">
          <button @click="setToday" class="btn-o px-3 py-1 text-xs">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            اليوم
          </button>
          <button @click="ui.toggleFastMode()" class="btn-o px-2 py-1 text-xs" title="وضع الكشف السريع"
            :style="ui.fastMode ? 'background:rgba(234,179,8,.18);border-color:rgba(234,179,8,.4);color:var(--gold)' : ''">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
            <span v-if="ui.fastMode"> سريع ✓</span>
          </button>
        </div>
      </div>

      <!-- Hidden fields for edit mode -->
      <input type="hidden" v-model="editId">
      <input type="hidden" v-model="editType">

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-[10px] opacity-45 mb-1 block">التاريخ</label>
          <input type="date" v-model="form.date" class="inp text-xs">
        </div>
        <div>
          <label class="text-[10px] opacity-45 mb-1 block">القيمة ({{ configStore.currency }})</label>
          <input type="number" v-model="form.amount" class="inp" placeholder="0" min="0" @input="calcPros">
        </div>
      </div>

      <div>
        <label class="text-[10px] opacity-45 mb-1 block">اسم المريض</label>
        <input type="text" v-model="form.name" class="inp" placeholder="ابحث أو أدخل اسماً جديداً" autocomplete="off" @input="onNameInput">
        <!-- Patient suggestions -->
        <div v-if="suggestions.length" class="mt-1.5 flex flex-wrap gap-1.5 items-center p-2 rounded-xl" style="background:rgba(234,179,8,.06);border:1px solid rgba(234,179,8,.2)">
          <span class="text-[10px] opacity-60">مسجل مسبقاً:</span>
          <button v-for="s in suggestions" :key="s" @click="form.name = s" class="btn-o px-2 py-0.5 text-[10px]">{{ s }}</button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 fm-hide">
        <div>
          <label class="text-[10px] opacity-45 mb-1 block">العيادة</label>
          <select v-model="form.clinic" class="inp text-xs">
            <option v-for="c in configStore.clinics" :key="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] opacity-45 mb-1 block">طريقة الدفع</label>
          <select v-model="form.payment" class="inp text-xs">
            <option v-for="p in configStore.payments" :key="p">{{ p }}</option>
          </select>
        </div>
      </div>

      <div>
        <label class="text-[10px] opacity-45 mb-1 block">الخدمة</label>
        <select v-model="form.service" class="inp text-xs" @change="onSvcChange">
          <option v-for="s in configStore.services" :key="s">{{ s }}</option>
        </select>
      </div>

      <!-- Quick service buttons -->
      <div>
        <span class="text-[10px] opacity-35 block mb-1.5">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
          اختيار سريع
        </span>
        <div class="flex gap-1.5 flex-wrap">
          <button v-for="s in configStore.services" :key="s" @click="quickSelect(s)"
            class="qs-btn" :class="{ 'qs-on': form.service === s }">
            {{ s }}
            <span v-if="configStore.servicePrices[s]" class="qs-price">{{ configStore.servicePrices[s] }}</span>
          </button>
        </div>
      </div>

      <!-- Lab value (for prosthetics) -->
      <div v-if="showLab" class="glass-sm p-3 space-y-2">
        <label class="text-[10px] opacity-45 block">قيمة المعمل ({{ configStore.currency }})</label>
        <input type="number" v-model="form.labCost" class="inp" placeholder="0" min="0" @input="calcPros">
        <div class="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label class="text-[10px] opacity-45 block mb-1">تاريخ الإرسال للمعمل</label>
            <input type="date" v-model="form.labSent" class="inp text-xs">
          </div>
          <div>
            <label class="text-[10px] opacity-45 block mb-1">التاريخ المتوقع للاستلام</label>
            <input type="date" v-model="form.labExpected" class="inp text-xs">
          </div>
        </div>
        <div>
          <label class="text-[10px] opacity-45 block mb-1">حالة المعمل</label>
          <select v-model="form.labStatus" class="inp text-xs">
            <option value="">— لم يُرسل بعد —</option>
            <option value="pending">⏳ قيد التنفيذ</option>
            <option value="ready">✅ جاهز للاستلام</option>
            <option value="delivered">✓ تم الاستلام</option>
            <option value="late">⚠️ متأخر</option>
          </select>
        </div>
        <div v-if="prosCalc.net > 0" class="space-y-1.5 pt-1">
          <div class="flex justify-between text-xs"><span class="opacity-50">صافي الربح:</span><span class="n font-bold" style="color:var(--gold)">{{ n(prosCalc.net) }}</span></div>
          <div class="flex justify-between text-xs"><span class="opacity-50">نسبة الطبيب ({{ configStore.doctorPct }}%):</span><span class="n font-bold text-green-400">{{ n(prosCalc.doc) }}</span></div>
          <div class="flex justify-between text-xs"><span class="opacity-50">نسبة العيادة ({{ configStore.clinicPct }}%):</span><span class="n font-bold text-blue-400">{{ n(prosCalc.clinic) }}</span></div>
        </div>
      </div>

      <!-- Debt toggle -->
      <div class="fm-hide">
        <div class="flex items-center justify-between">
          <label class="text-[10px] opacity-45">تسجيل كدين</label>
          <label class="tgl"><input type="checkbox" v-model="form.isDebt"><span class="tgl-s"></span></label>
        </div>
        <div v-if="form.isDebt" class="mt-2 space-y-2">
          <input type="text" v-model="form.debtPhone" class="inp text-xs" placeholder="رقم هاتف المريض (اختياري)">
          <input type="text" v-model="form.debtNote" class="inp text-xs" placeholder="ملاحظة (اختياري)">
        </div>
      </div>

      <!-- Appointment row -->
      <div class="fm-hide">
        <div class="flex items-center justify-between">
          <label class="text-[10px] opacity-45">حجز موعد قادم</label>
          <label class="tgl"><input type="checkbox" v-model="form.hasAppt"><span class="tgl-s"></span></label>
        </div>
        <div v-if="form.hasAppt" class="mt-2 grid grid-cols-2 gap-2">
          <input type="date" v-model="form.apptDate" class="inp text-xs">
          <input type="time" v-model="form.apptTime" class="inp text-xs">
          <input type="text" v-model="form.apptSvc" class="inp text-xs col-span-2" placeholder="الخدمة (اختياري)">
        </div>
      </div>

      <!-- Notes -->
      <div class="fm-hide">
        <label class="text-[10px] opacity-45 mb-1 block">ملاحظات</label>
        <textarea v-model="form.notes" class="inp text-xs" rows="2" placeholder="ملاحظات إضافية..."></textarea>
      </div>

      <!-- Dental report toggle -->
      <div class="fm-hide flex items-center justify-between">
        <label class="text-[10px] opacity-45">إضافة تقرير سني</label>
        <label class="tgl"><input type="checkbox" v-model="form.hasReport"><span class="tgl-s"></span></label>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2">
        <button @click="saveRecord" class="btn-g flex-1 py-3 text-sm" :disabled="saving">
          {{ editId ? 'تحديث' : 'حفظ' }}
        </button>
        <button v-if="editId" @click="resetForm" class="btn-o px-4 py-3 text-sm">إلغاء</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUiStore } from '../stores/ui.store'
import { useConfigStore } from '../stores/config.store'
import { useRecordsStore } from '../stores/records.store'
import { useDebtsStore } from '../stores/debts.store'
import { useAppointmentsStore } from '../stores/appointments.store'
import { useToast } from '../composables/useToast'
import { useSync } from '../composables/useSync'
import { n, isProsthetic, uid, todayStr, sum } from '../utils/helpers'

const ui = useUiStore()
const configStore = useConfigStore()
const recordsStore = useRecordsStore()
const debtsStore = useDebtsStore()
const apptsStore = useAppointmentsStore()
const { toast } = useToast()
const { localSave, save } = useSync()

const editId = ref('')
const editType = ref('')
const saving = ref(false)
const suggestions = ref([])

const form = reactive({
  date: todayStr(),
  amount: '',
  name: '',
  clinic: '',
  payment: '',
  service: '',
  labCost: '',
  labSent: '',
  labExpected: '',
  labStatus: '',
  isDebt: false,
  debtPhone: '',
  debtNote: '',
  hasAppt: false,
  apptDate: '',
  apptTime: '',
  apptSvc: '',
  notes: '',
  hasReport: false
})

const showLab = computed(() => isProsthetic(form.service))

const prosCalc = computed(() => {
  const amt = Number(form.amount) || 0
  const lab = Number(form.labCost) || 0
  const net = amt - lab
  const docPct = configStore.doctorPct / 100
  return {
    net: net > 0 ? net : 0,
    doc: net > 0 ? net * docPct : 0,
    clinic: net > 0 ? net * (1 - docPct) : 0
  }
})

const todayBarHtml = computed(() => {
  const today = todayStr()
  const todayRecs = recordsStore.records.filter(r => r.date === today)
  const todayPros = recordsStore.prosthetics.filter(p => p.date === today)
  const all = [...todayRecs, ...todayPros]
  const totalAmt = sum(all, 'amount')
  const count = all.length
  const todayAppts = apptsStore.getTodayAppointments()

  return `
    <div class="today-cell"><div class="today-val">${count}</div><div class="today-lbl">مراجعات اليوم</div></div>
    <div class="today-cell"><div class="today-val n">${n(totalAmt)}</div><div class="today-lbl">إيرادات اليوم</div></div>
    <div class="today-cell"><div class="today-val">${todayAppts.length}</div><div class="today-lbl">مواعيد اليوم</div></div>
  `
})

function onSvcChange() {
  const price = configStore.servicePrices[form.service]
  if (price && !form.amount) {
    form.amount = price
  }
}

function quickSelect(svc) {
  form.service = svc
  const price = configStore.servicePrices[svc]
  if (price) form.amount = price
}

function onNameInput() {
  const val = (form.name || '').trim().toLowerCase()
  if (!val || val.length < 2) {
    suggestions.value = []
    return
  }
  const names = recordsStore.getUniquePatientNames()
  suggestions.value = names.filter(n => n.toLowerCase().includes(val)).slice(0, 5)
}

function calcPros() {
  /* computed handles this reactively */
}

function setToday() {
  form.date = todayStr()
  ui.setMonth(new Date().toISOString().substring(0, 7))
}

async function saveRecord() {
  if (!form.name?.trim()) { toast('❌ أدخل اسم المريض'); return }
  if (!form.service) { toast('❌ اختر الخدمة'); return }

  saving.value = true
  try {
    const isPros = isProsthetic(form.service)
    const rec = {
      id: editId.value || uid(),
      date: form.date || todayStr(),
      amount: Number(form.amount) || 0,
      name: form.name.trim(),
      clinic: form.clinic || configStore.clinics[0] || '',
      payment: form.payment || configStore.payments[0] || '',
      service: form.service,
      notes: form.notes || '',
      ...(isPros ? {
        labCost: Number(form.labCost) || 0,
        labSent: form.labSent || '',
        labExpected: form.labExpected || '',
        labStatus: form.labStatus || ''
      } : {})
    }

    if (editId.value) {
      recordsStore.updateRecord(editId.value, rec, editType.value === 'p')
    } else {
      recordsStore.addRecord(rec)
    }

    if (form.isDebt && !editId.value) {
      debtsStore.addDebt({
        name: form.name.trim(),
        amount: Number(form.amount) || 0,
        date: form.date || todayStr(),
        service: form.service,
        phone: form.debtPhone || '',
        note: form.debtNote || '',
        payments: []
      })
    }

    if (form.hasAppt && form.apptDate) {
      apptsStore.addAppointment({
        name: form.name.trim(),
        date: form.apptDate,
        time: form.apptTime || '',
        service: form.apptSvc || form.service
      })
    }

    localSave()
    await save(false)
    toast(editId.value ? '✅ تم التحديث' : '✅ تم الحفظ')
    resetForm()
  } catch (e) {
    toast('❌ خطأ في الحفظ')
    console.error(e)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  editId.value = ''
  editType.value = ''
  form.date = todayStr()
  form.amount = ''
  form.name = ''
  form.clinic = configStore.clinics[0] || ''
  form.payment = configStore.payments[0] || ''
  form.service = configStore.services[0] || ''
  form.labCost = ''
  form.labSent = ''
  form.labExpected = ''
  form.labStatus = ''
  form.isDebt = false
  form.debtPhone = ''
  form.debtNote = ''
  form.hasAppt = false
  form.apptDate = ''
  form.apptTime = ''
  form.apptSvc = ''
  form.notes = ''
  form.hasReport = false
  suggestions.value = []
}

onMounted(() => {
  form.clinic = configStore.clinics[0] || ''
  form.payment = configStore.payments[0] || ''
  form.service = configStore.services[0] || ''
})
</script>
