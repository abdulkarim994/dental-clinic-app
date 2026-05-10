<template>
  <div class="max-w-lg mx-auto px-4 mt-4 space-y-4 tab-in">
    <div class="flex justify-between items-center">
      <div class="sec-h">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        المواعيد
      </div>
      <button @click="$emit('addAppt')" class="btn-g px-4 py-2 text-xs">+ موعد جديد</button>
    </div>

    <!-- Calendar grid -->
    <div class="glass p-4">
      <div class="flex justify-between items-center mb-3">
        <button @click="prevMonth" class="btn-o px-2 py-1 text-xs">&larr;</button>
        <span class="font-bold text-sm" style="color:var(--gold-l)">{{ calMonthLabel }}</span>
        <button @click="nextMonth" class="btn-o px-2 py-1 text-xs">&rarr;</button>
      </div>

      <div class="cal-grid">
        <div v-for="d in dayHeaders" :key="d" class="cal-hd">{{ d }}</div>
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

    <!-- Today / selected day appointments -->
    <div v-if="selectedDayAppts.length" class="glass p-4 space-y-2">
      <h3 class="sec-h mb-2">مواعيد {{ selectedDayLabel }}</h3>
      <div v-for="a in selectedDayAppts" :key="a.id" class="appt-field">
        <div class="flex-1">
          <span class="font-bold text-xs" style="color:var(--gold-l)">{{ a.name }}</span>
          <p class="text-[9px] opacity-40">{{ a.service || '' }}</p>
        </div>
        <span class="n text-xs font-bold" style="color:var(--green)">{{ a.time || '' }}</span>
        <button @click="$emit('deleteAppt', a.id)" class="ic-btn ic-del" style="width:30px;height:30px;padding:5px">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>

    <!-- Upcoming appointments -->
    <div class="glass p-4 space-y-2">
      <h3 class="sec-h mb-2">المواعيد القادمة</h3>
      <div v-if="upcoming.length === 0" class="text-center py-6 opacity-25 text-xs">لا توجد مواعيد قادمة</div>
      <div v-for="a in upcoming" :key="a.id" class="appt-field">
        <div class="flex-1">
          <span class="font-bold text-xs" style="color:var(--gold-l)">{{ a.name }}</span>
          <p class="text-[9px] opacity-40">{{ a.date }} · {{ a.service || '' }}</p>
        </div>
        <span class="n text-xs font-bold" style="color:var(--green)">{{ a.time || '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppointmentsStore } from '../stores/appointments.store'
import { n, todayStr } from '../utils/helpers'

const apptsStore = useAppointmentsStore()

defineEmits(['addAppt', 'deleteAppt'])

const dayHeaders = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
const calMonth = ref(new Date())
const selectedDay = ref(todayStr())

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
    return new Date(d).toLocaleDateString('ar-LY', { month: 'short', day: 'numeric' })
  } catch { return d }
})

const upcoming = computed(() => apptsStore.getUpcomingAppointments().slice(0, 10))

function selectDay(day) {
  selectedDay.value = day.date
}

function prevMonth() {
  calMonth.value = new Date(calMonth.value.getFullYear(), calMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  calMonth.value = new Date(calMonth.value.getFullYear(), calMonth.value.getMonth() + 1, 1)
}
</script>
