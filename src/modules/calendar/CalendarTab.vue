<template>
  <div class="space-y-4">
    <!-- Calendar Header -->
    <div class="glass p-4 rounded-2xl">
      <div class="flex justify-between items-center mb-4">
        <button @click="shiftMonth(-1)" class="btn-o px-3 py-2 text-xs">◀</button>
        <h2 class="font-bold text-sm" style="color:var(--gold)">{{ monthLabel }}</h2>
        <button @click="shiftMonth(1)" class="btn-o px-3 py-2 text-xs">▶</button>
      </div>
      <!-- Day headers -->
      <div class="grid grid-cols-7 gap-0.5 mb-1">
        <div v-for="d in dayNames" :key="d" class="cal-hd text-center text-[9px] opacity-40 font-bold py-1">{{ d }}</div>
      </div>
      <!-- Calendar grid -->
      <div class="grid grid-cols-7 gap-0.5">
        <div v-for="(cell, i) in calendarCells" :key="i"
          class="cal-day text-center py-1.5 text-xs rounded-lg cursor-pointer relative"
          :class="{
            'other-month': cell.other,
            'today': cell.isToday,
            'has-appt': cell.apptCount > 0,
            'cal-selected': cell.dateStr === selectedDay,
          }"
          @click="cell.other ? null : selectDay(cell.dateStr)">
          {{ cell.day }}
          <span v-if="cell.apptCount > 0" class="cal-dot"></span>
          <span v-if="cell.apptCount > 0 && !cell.other" class="cal-appt-names">{{ cell.names }}</span>
        </div>
      </div>
    </div>

    <!-- Day Detail -->
    <div v-if="selectedDay" class="glass p-4 rounded-2xl space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="font-bold text-xs" style="color:var(--gold-l)">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          {{ selectedDay }} <span class="opacity-50 text-[9px]">({{ dayRelLabel }})</span> — {{ dayAppts.length }} موعد
        </h3>
        <button @click="openAddAppt" class="btn-g px-3 py-1.5 text-[10px]">+ موعد جديد</button>
      </div>

      <div v-if="!dayAppts.length" class="text-center opacity-40 py-4 text-[10px]">لا مواعيد في هذا اليوم</div>

      <!-- Appointment cards -->
      <div v-for="a in dayAppts" :key="a.id" class="glass-sm p-3 space-y-1.5 rounded-xl" :style="a.status === 'completed' ? 'opacity:.7' : ''">
        <div class="flex justify-between items-start gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold">
              <span style="color:var(--gold-l);cursor:pointer" @click="goPatient(a.name)">{{ a.name || '—' }}</span>
              <span v-if="a.status === 'completed'" class="text-green-500 text-[9px] font-bold mr-1">✓ تم</span>
              <span v-else-if="a.status === 'cancelled'" class="text-red-400 text-[9px] font-bold mr-1">✕ ملغي</span>
              <span v-else class="text-blue-400 text-[9px] font-bold mr-1">◷ قادم</span>
            </p>
            <p class="text-[9px] opacity-50">🦷 {{ a.service || '—' }} <span v-if="a.time" class="opacity-60">◷ {{ to12h(a.time) }}</span></p>
            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
              <a v-if="a.phone" :href="'tel:' + cleanPhone(a.phone)" class="text-blue-400 text-[9px]" @click.stop>{{ a.phone }}</a>
              <a v-if="cleanPhone(a.phone)" :href="waReminderLink(a)" target="_blank" rel="noopener" class="whatsapp-btn" style="font-size:8px;padding:2px 7px" @click.stop>تذكير واتساب</a>
              <a v-if="cleanPhone(a.phone)" :href="smsReminderLink(a)" class="btn-o" style="font-size:8px;padding:2px 7px;border-radius:50px" @click.stop>SMS</a>
            </div>
            <p v-if="a.notes" class="text-[9px] opacity-40 mt-0.5">✎ {{ a.notes }}</p>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <button v-if="a.status !== 'completed'" @click="markDone(a.id)" class="ic-btn" style="width:28px;height:28px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:#22c55e" title="تم">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <button v-else @click="unmarkDone(a.id)" class="ic-btn" style="width:28px;height:28px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:#f59e0b" title="إلغاء تم">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M14 10l-4 4M10 10l4 4"/></svg>
            </button>
            <button @click="editAppt(a)" class="ic-btn ic-edit" style="width:28px;height:28px" title="تعديل">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button @click="deleteAppt(a.id)" class="ic-btn ic-del" style="width:28px;height:28px" title="حذف">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Appointments -->
    <div class="glass p-4 rounded-2xl space-y-3">
      <h3 class="sec-h text-[10px]">المواعيد القادمة</h3>
      <div v-if="!upcoming.length" class="text-center py-4 opacity-30 text-xs">لا توجد مواعيد قادمة</div>
      <div v-for="a in upcoming" :key="a.id" class="row-card p-3 flex justify-between items-center cursor-pointer" @click="selectDay(a.date)">
        <div>
          <p class="text-xs font-bold" style="color:var(--gold-l)">{{ a.name }}</p>
          <p class="text-[9px] opacity-40">{{ a.date }} {{ a.time ? '— ' + to12h(a.time) : '' }} — {{ a.service || '—' }}</p>
        </div>
        <span class="text-[9px] font-bold" :style="{ color: dayDiff(a.date) === 0 ? '#f59e0b' : dayDiff(a.date) <= 2 ? '#3b82f6' : '#94a3b8' }">{{ dayLabel(a.date) }}</span>
      </div>
    </div>

    <!-- Add/Edit Appointment Modal -->
    <Teleport to="body">
      <div v-if="showApptModal" class="modal-ol" style="display:flex;align-items:flex-start;justify-content:center;padding-top:24px" @click.self="closeApptModal">
        <div class="glass p-5 w-full max-w-sm mx-3 space-y-4 rounded-2xl" @click.stop>
          <h3 class="font-bold text-sm" style="color:var(--gold)">{{ editingAppt ? 'تعديل الموعد' : 'موعد جديد' }}</h3>
          <input type="text" v-model="apptForm.name" class="inp" placeholder="اسم المريض" autocomplete="off" @input="onApptNameInput">
          <div v-if="apptNameSuggestions.length" class="flex flex-wrap gap-1.5 p-2 rounded-xl" style="background:rgba(234,179,8,.06);border:1px solid rgba(234,179,8,.2)">
            <button v-for="s in apptNameSuggestions" :key="s" @click="apptForm.name = s; apptNameSuggestions = []" class="qs-btn text-[10px] px-2 py-0.5">{{ s }}</button>
          </div>
          <input type="tel" v-model="apptForm.phone" class="inp" placeholder="رقم الهاتف (اختياري)">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] opacity-45 mb-1 block">التاريخ</label>
              <input type="date" v-model="apptForm.date" class="inp text-xs">
            </div>
            <div>
              <label class="text-[10px] opacity-45 mb-1 block">الوقت (اختياري)</label>
              <input type="time" v-model="apptForm.time" class="inp text-xs">
            </div>
          </div>
          <div>
            <label class="text-[10px] opacity-45 mb-1 block">الخدمة</label>
            <select v-model="apptForm.service" class="inp text-xs">
              <option value="">— اختر —</option>
              <option v-for="s in services" :key="s">{{ s }}</option>
            </select>
          </div>
          <textarea v-model="apptForm.notes" class="inp h-14 resize-none text-xs" placeholder="ملاحظات..."></textarea>
          <div class="flex gap-2">
            <button @click="saveAppt" class="btn-g flex-1 py-3 text-xs font-bold">{{ editingAppt ? 'تحديث' : 'حفظ الموعد' }}</button>
            <button @click="closeApptModal" class="btn-o px-4 py-3 text-xs">إلغاء</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { formatNumber, getCurrentDate } from '@/utils/format'
import { fuzzyMatch } from '@/utils/search'
import { markApptsDirty } from '@/services/sync.service'

const router = useRouter()
const app = useAppStore()
const auth = useAuthStore()
const { toast } = useToast()

const MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const dayNames = ['أح','إث','ثل','أر','خم','جم','سب']

const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())
const selectedDay = ref(null)
const showApptModal = ref(false)
const editingAppt = ref(null)
const apptNameSuggestions = ref([])
const apptForm = ref({ name: '', phone: '', date: '', time: '', service: '', notes: '' })

const services = computed(() => app.services)
const monthLabel = computed(() => MONTH_NAMES[calMonth.value] + ' ' + calYear.value)

function n(v) { return formatNumber(v) }

function shiftMonth(delta) {
  calMonth.value += delta
  if (calMonth.value > 11) { calMonth.value = 0; calYear.value++ }
  else if (calMonth.value < 0) { calMonth.value = 11; calYear.value-- }
  selectedDay.value = null
}

const apptMap = computed(() => {
  const map = {}
  const allAppts = [
    ...app.appointments.map(a => ({ ...a, _src: 'appt' })),
    ...app.records.filter(r => r.appointment).map(r => ({ id: 'rec-' + r.id, name: r.name, date: r.appointment, service: r.service, phone: '', notes: '', status: 'upcoming', _src: 'rec' })),
    ...app.prosthetics.filter(p => p.appointment).map(p => ({ id: 'pros-' + p.id, name: p.name, date: p.appointment, service: 'تركيبات', phone: '', notes: '', status: 'upcoming', _src: 'rec' })),
  ]
  allAppts.forEach(a => {
    if (!a.date) return
    if (!map[a.date]) map[a.date] = []
    map[a.date].push(a)
  })
  return map
})

const calendarCells = computed(() => {
  const y = calYear.value, m = calMonth.value
  const firstDay = new Date(y, m, 1).getDay()
  const lastDate = new Date(y, m + 1, 0).getDate()
  const prevLast = new Date(y, m, 0).getDate()
  const today = new Date().toISOString().substring(0, 10)
  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevLast - i, other: true, isToday: false, apptCount: 0, names: '', dateStr: '' })
  }
  for (let d = 1; d <= lastDate; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const ap = apptMap.value[ds] || []
    const names = ap.map(a => a.name).slice(0, 2).join('، ') + (ap.length > 2 ? '...' : '')
    cells.push({ day: d, other: false, isToday: ds === today, apptCount: ap.length, names, dateStr: ds })
  }
  const total = firstDay + lastDate
  const rem = total % 7 ? 7 - (total % 7) : 0
  for (let d = 1; d <= rem; d++) {
    cells.push({ day: d, other: true, isToday: false, apptCount: 0, names: '', dateStr: '' })
  }
  return cells
})

const dayAppts = computed(() => {
  if (!selectedDay.value) return []
  return (apptMap.value[selectedDay.value] || []).sort((a, b) => ((b._mod || 0) - (a._mod || 0)))
})

function dayDiff(ds) {
  const today = new Date(new Date().toISOString().substring(0, 10) + 'T00:00:00')
  return Math.ceil((new Date(ds + 'T00:00:00') - today) / 86400000)
}
function dayLabel(ds) {
  const diff = dayDiff(ds)
  if (diff === 0) return 'اليوم'
  if (diff === 1) return 'غداً'
  if (diff < 0) return `منذ ${Math.abs(diff)} أيام`
  return `بعد ${diff} أيام`
}
const dayRelLabel = computed(() => selectedDay.value ? dayLabel(selectedDay.value) : '')

function to12h(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'م' : 'ص'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function cleanPhone(p) { return p ? (p + '').replace(/[^0-9+]/g, '') : '' }

function waReminderLink(a) {
  const ph = cleanPhone(a.phone)
  if (!ph) return '#'
  const dateObj = a.date ? new Date(a.date + 'T00:00:00') : null
  const dayName = dateObj ? dateObj.toLocaleDateString('ar-SA', { weekday: 'long' }) : ''
  const center = app.centerName
  const msg = encodeURIComponent(
    `🏥 *${center}*\n━━━━━━━━━━━━━━━\n📋 *تذكير بموعدكم*\n\nالسلام عليكم ورحمة الله\nعزيزنا/عزيزتنا *${a.name || ''}*\n\nنود تذكيركم بموعدكم القادم:\n\n📅 التاريخ: *${a.date}*\n📆 اليوم: *${dayName}*\n${a.time ? '🕐 الساعة: *' + to12h(a.time) + '*\n' : ''}${a.service ? '🦷 الخدمة: ' + a.service + '\n' : ''}\nنرجو التأكيد أو التواصل معنا في حال الرغبة بتغيير الموعد.\n\n━━━━━━━━━━━━━━━\n✨ مع تمنياتنا لكم بدوام الصحة والعافية\n*${center}* 🦷`
  )
  return `https://wa.me/${ph}?text=${msg}`
}

function smsReminderLink(a) {
  const ph = cleanPhone(a.phone)
  if (!ph) return '#'
  const dateObj = a.date ? new Date(a.date + 'T00:00:00') : null
  const dayName = dateObj ? dateObj.toLocaleDateString('ar-SA', { weekday: 'long' }) : ''
  const center = app.centerName
  const body = encodeURIComponent(`${center}: تذكير بموعدكم ${a.name || ''} - ${a.date} ${dayName}${a.time ? ' الساعة ' + to12h(a.time) : ''}. نرجو التأكيد.`)
  return `sms:${ph}?body=${body}`
}

const upcoming = computed(() => {
  const today = new Date().toISOString().substring(0, 10)
  const all = Object.values(apptMap.value).flat()
  return all
    .filter(a => a.date >= today && a.status !== 'completed' && a.status !== 'cancelled')
    .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0))
    .slice(0, 10)
})

function selectDay(ds) { selectedDay.value = ds }

function openAddAppt() {
  editingAppt.value = null
  apptForm.value = { name: '', phone: '', date: selectedDay.value || getCurrentDate(), time: '', service: '', notes: '' }
  apptNameSuggestions.value = []
  showApptModal.value = true
}

function editAppt(a) {
  editingAppt.value = a.id
  apptForm.value = { name: a.name || '', phone: a.phone || '', date: a.date || '', time: a.time || '', service: a.service || '', notes: a.notes || '' }
  showApptModal.value = true
}

function closeApptModal() { showApptModal.value = false }

function onApptNameInput() {
  const q = (apptForm.value.name || '').trim()
  if (q.length < 2) { apptNameSuggestions.value = []; return }
  const allNames = new Set([...app.records.map(r => r.name), ...app.prosthetics.map(p => p.name)].filter(Boolean))
  apptNameSuggestions.value = [...allNames].filter(name => fuzzyMatch(q, name)).slice(0, 5)
}

function saveAppt() {
  const { name, date, phone, time, service, notes } = apptForm.value
  if (!name?.trim()) { toast('يرجى إدخال اسم المريض'); return }
  if (!date) { toast('يرجى اختيار التاريخ'); return }

  if (editingAppt.value) {
    const idx = app.appointments.findIndex(a => a.id === editingAppt.value)
    if (idx >= 0) {
      app.appointments[idx] = { ...app.appointments[idx], name: name.trim(), phone, date, time, service, notes, _mod: Date.now() }
    }
    toast('تم تحديث الموعد')
  } else {
    app.appointments.push({
      id: Date.now(), uid: auth.uid, name: name.trim(), phone, date, time, service, notes,
      status: 'upcoming', _mod: Date.now(), _t: 'a',
    })
    toast('تم حفظ الموعد')
  }
  markApptsDirty()
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  closeApptModal()
}

function markDone(id) {
  const idx = app.appointments.findIndex(a => a.id === id)
  if (idx >= 0) {
    app.appointments[idx].status = 'completed'
    app.appointments[idx]._mod = Date.now()
    markApptsDirty()
    app.saveToCache(auth.uid)
    app.syncSave(auth.uid, false)
    toast('تم تحديد الموعد كمكتمل')
  }
}

function unmarkDone(id) {
  const idx = app.appointments.findIndex(a => a.id === id)
  if (idx >= 0) {
    app.appointments[idx].status = 'upcoming'
    app.appointments[idx]._mod = Date.now()
    markApptsDirty()
    app.saveToCache(auth.uid)
    app.syncSave(auth.uid, false)
    toast('تم إلغاء اكتمال الموعد')
  }
}

function deleteAppt(id) {
  if (!confirm('حذف الموعد نهائياً؟')) return
  app.appointments = app.appointments.filter(a => a.id !== id)
  markApptsDirty()
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تم حذف الموعد')
}

function goPatient(name) {
  app.activeTab = 'patients'
  router.push({ name: 'patients', query: { search: name } })
}
</script>
