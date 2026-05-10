<template>
  <div class="max-w-lg mx-auto px-4 mt-4 space-y-4 tab-in">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-bold text-sm" style="color:var(--gold)">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:inline;vertical-align:-2px"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        جدول المواعيد
      </h2>
      <div class="flex items-center gap-2">
        <button @click="prevMonth" class="glass-sm w-9 h-9 flex items-center justify-center text-base">‹</button>
        <span class="text-xs font-bold opacity-70 min-w-[80px] text-center">{{ calMonthLabel }}</span>
        <button @click="nextMonth" class="glass-sm w-9 h-9 flex items-center justify-center text-base">›</button>
      </div>
    </div>

    <!-- Add appointment button -->
    <button @click="showApptForm = !showApptForm" class="btn-g w-full py-3 text-sm font-bold mb-3" style="border-radius:14px">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="display:inline;vertical-align:-2px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      إضافة موعد جديد
    </button>

    <!-- Appointment form -->
    <div v-if="showApptForm" class="glass p-4 mb-3 space-y-3" style="border-radius:18px;border:1px solid rgba(59,130,246,.2)">
      <p class="text-xs font-bold opacity-60">{{ apptEditId ? 'تعديل الموعد' : 'موعد جديد' }}</p>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="text-[9px] opacity-40 block mb-1">اسم المريض *</label>
          <input type="text" v-model="apptForm.name" class="inp text-xs w-full" placeholder="اسم المريض" autocomplete="off">
        </div>
        <div>
          <label class="text-[9px] opacity-40 block mb-1">رقم الهاتف</label>
          <input type="tel" v-model="apptForm.phone" class="inp text-xs w-full" placeholder="رقم الهاتف">
        </div>
      </div>
      <div>
        <label class="text-[9px] opacity-40 block mb-1">الخدمة / الإجراء</label>
        <input type="text" v-model="apptForm.service" class="inp text-xs w-full" placeholder="مثال: كشف، تنظيف، حشو...">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="text-[9px] opacity-40 block mb-1">التاريخ *</label>
          <input type="date" v-model="apptForm.date" class="inp text-xs w-full">
        </div>
        <div>
          <label class="text-[9px] opacity-40 block mb-1">الوقت</label>
          <input type="time" v-model="apptForm.time" class="inp text-xs w-full">
        </div>
      </div>
      <div>
        <label class="text-[9px] opacity-40 block mb-1">ملاحظات</label>
        <textarea v-model="apptForm.notes" class="inp text-xs w-full resize-none" rows="2" placeholder="ملاحظات إضافية..."></textarea>
      </div>
      <div class="flex gap-2">
        <button @click="saveAppt" class="btn-g flex-1 py-2.5 text-xs font-bold">حفظ الموعد</button>
        <button @click="cancelApptForm" class="btn-o px-4 py-2.5 text-xs">إلغاء</button>
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="glass p-3 mb-4">
      <div class="cal-grid" id="calDaysHdr">
        <div v-for="d in dayHeaders" :key="d" class="cal-hd">{{ d }}</div>
      </div>
      <div class="cal-grid">
        <div v-for="(day, i) in calDays" :key="i"
          class="cal-day"
          :class="{
            today: day.isToday,
            'has-appt': day.appts > 0,
            'other-month': day.otherMonth
          }"
          @click="selectDay(day)">
          <span>{{ day.num }}</span>
          <span v-if="day.appts > 0" class="cal-dot"></span>
          <span v-if="day.names" class="cal-appt-names">{{ day.names }}</span>
        </div>
      </div>
    </div>

    <!-- Selected day detail -->
    <div v-if="selectedDayAppts.length" class="glass p-4 space-y-2">
      <div class="flex justify-between items-center mb-2">
        <p class="text-xs font-bold opacity-60">{{ selectedDayLabel }}</p>
        <button @click="addApptForDay" class="btn-g px-2.5 py-1 text-[10px]">+ موعد</button>
      </div>
      <div v-for="a in selectedDayAppts" :key="a.id" class="appt-field">
        <div class="flex-1">
          <span class="font-bold text-xs" style="color:var(--gold-l)">{{ a.name }}</span>
          <p class="text-[9px] opacity-40">{{ a.service || '' }}</p>
        </div>
        <span class="n text-xs font-bold" style="color:var(--green)">{{ a.time || '' }}</span>
        <button @click="deleteAppt(a.id)" class="ic-btn ic-del" style="width:30px;height:30px;padding:5px">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>

    <!-- Search appointments -->
    <div class="mt-3 mb-3">
      <div class="relative">
        <input type="text" v-model="apptSearch" class="inp" placeholder="🔍 بحث في المواعيد بالاسم أو الخدمة..." autocomplete="off" style="font-size:11px;padding-right:36px">
        <span v-if="apptSearch" @click="apptSearch = ''" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);cursor:pointer;opacity:.4;font-size:14px;line-height:1">✕</span>
      </div>
      <div v-if="apptSearch && searchResults.length" class="space-y-2 mt-2">
        <div v-for="a in searchResults" :key="a.id" class="appt-field">
          <div class="flex-1">
            <span class="font-bold text-xs" style="color:var(--gold-l)">{{ a.name }}</span>
            <p class="text-[9px] opacity-40">{{ a.date }} · {{ a.service || '' }}</p>
          </div>
          <span class="n text-xs font-bold" style="color:var(--green)">{{ a.time || '' }}</span>
        </div>
      </div>
    </div>

    <!-- Upcoming appointments -->
    <div class="mt-3">
      <p class="text-xs font-bold opacity-50 mb-2">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:inline;vertical-align:-1px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        المواعيد القادمة
      </p>
      <div v-if="upcoming.length === 0" class="text-center py-6 opacity-25 text-xs">لا توجد مواعيد قادمة</div>
      <div class="space-y-2">
        <div v-for="a in upcoming" :key="a.id" class="appt-field">
          <div class="flex-1">
            <span class="font-bold text-xs" style="color:var(--gold-l)">{{ a.name }}</span>
            <p class="text-[9px] opacity-40">{{ a.date }} · {{ a.service || '' }}</p>
          </div>
          <span class="n text-xs font-bold" style="color:var(--green)">{{ a.time || '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAppointmentsStore } from '../stores/appointments.store'
import { useToast } from '../composables/useToast'
import { uid, todayStr } from '../utils/helpers'

const apptsStore = useAppointmentsStore()
const { toast } = useToast()

const dayHeaders = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
const calMonth = ref(new Date())
const selectedDay = ref(todayStr())
const showApptForm = ref(false)
const apptEditId = ref('')
const apptSearch = ref('')

const apptForm = reactive({
  name: '',
  phone: '',
  service: '',
  date: todayStr(),
  time: '',
  notes: ''
})

const calMonthLabel = computed(() => {
  return calMonth.value.toLocaleDateString('ar-LY', { year: 'numeric', month: 'long' })
})

const calDays = computed(() => {
  const y = calMonth.value.getFullYear()
  const m = calMonth.value.getMonth()
  const first = new Date(y, m, 1)
  const last = new Date(y, m + 1, 0)
  const startDay = first.getDay()
  const days = []

  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(y, m, -i)
    days.push(makeDay(d, true))
  }
  for (let i = 1; i <= last.getDate(); i++) {
    const d = new Date(y, m, i)
    days.push(makeDay(d, false))
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(y, m + 1, i)
    days.push(makeDay(d, true))
  }
  return days
})

function makeDay(date, otherMonth) {
  const ds = date.toISOString().substring(0, 10)
  const appts = apptsStore.getAppointmentsByDate(ds)
  const today = todayStr()
  return {
    num: date.getDate(),
    date: ds,
    isToday: ds === today,
    otherMonth,
    appts: appts.length,
    names: appts.slice(0, 2).map(a => a.name).join('، ')
  }
}

const selectedDayAppts = computed(() => {
  return apptsStore.getAppointmentsByDate(selectedDay.value)
    .sort((a, b) => ((a.time || '') > (b.time || '') ? 1 : -1))
})

const selectedDayLabel = computed(() => {
  const d = selectedDay.value
  if (d === todayStr()) return 'اليوم'
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('ar-LY', { weekday: 'long', month: 'short', day: 'numeric' })
  } catch { return d }
})

const upcoming = computed(() => apptsStore.getUpcomingAppointments().slice(0, 10))

const searchResults = computed(() => {
  if (!apptSearch.value.trim()) return []
  const q = apptSearch.value.trim().toLowerCase()
  return apptsStore.appointments.filter(a =>
    (a.name || '').toLowerCase().includes(q) ||
    (a.service || '').toLowerCase().includes(q)
  ).slice(0, 20)
})

function selectDay(day) {
  selectedDay.value = day.date
}

function prevMonth() {
  calMonth.value = new Date(calMonth.value.getFullYear(), calMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  calMonth.value = new Date(calMonth.value.getFullYear(), calMonth.value.getMonth() + 1, 1)
}

function addApptForDay() {
  apptForm.date = selectedDay.value
  showApptForm.value = true
}

function saveAppt() {
  if (!apptForm.name.trim()) { toast('يرجى إدخال اسم المريض'); return }
  if (!apptForm.date) { toast('يرجى اختيار التاريخ'); return }

  if (apptEditId.value) {
    apptsStore.updateAppointment(apptEditId.value, { ...apptForm })
  } else {
    apptsStore.addAppointment({
      id: uid(),
      name: apptForm.name.trim(),
      phone: apptForm.phone || '',
      service: apptForm.service || '',
      date: apptForm.date,
      time: apptForm.time || '',
      notes: apptForm.notes || ''
    })
  }
  toast('تم حفظ الموعد')
  cancelApptForm()
}

function cancelApptForm() {
  showApptForm.value = false
  apptEditId.value = ''
  apptForm.name = ''
  apptForm.phone = ''
  apptForm.service = ''
  apptForm.date = todayStr()
  apptForm.time = ''
  apptForm.notes = ''
}

function deleteAppt(id) {
  apptsStore.removeAppointment(id)
  toast('تم حذف الموعد')
}
</script>
