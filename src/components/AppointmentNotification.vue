<template>
  <Teleport to="body">
    <div v-if="visible" class="appt-notif-ol" @click.self="close">
      <div class="appt-notif-box">
        <div class="an-header">
          <div class="an-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            المواعيد القادمة
          </div>
          <button class="an-close" @click="close">✕</button>
        </div>

        <!-- Today -->
        <div v-if="todayAppts.length" class="an-section">
          <div class="an-section-title">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            مواعيد اليوم ({{ todayAppts.length }})
          </div>
          <div v-for="a in todayAppts" :key="a.id" class="an-card">
            <div>
              <div class="an-name">{{ a.name || '—' }}</div>
              <div class="an-svc">{{ a.service || '' }}</div>
            </div>
            <div class="an-time">{{ to12h(a.time) }}</div>
          </div>
        </div>

        <!-- Tomorrow -->
        <div v-if="tomorrowAppts.length" class="an-section">
          <div class="an-section-title">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#3b82f6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            مواعيد الغد ({{ tomorrowAppts.length }})
          </div>
          <div v-for="a in tomorrowAppts" :key="a.id" class="an-card">
            <div>
              <div class="an-name">{{ a.name || '—' }}</div>
              <div class="an-svc">{{ a.service || '' }}</div>
            </div>
            <div class="an-time">{{ to12h(a.time) }}</div>
          </div>
        </div>

        <div class="an-footer">
          <button @click="close">حسناً</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from '@/stores/app.store'

const app = useAppStore()
const visible = ref(false)

const today = new Date().toISOString().substring(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().substring(0, 10)

const todayAppts = computed(() =>
  (app.appointments || [])
    .filter(a => a.date === today && a.status !== 'cancelled')
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
)

const tomorrowAppts = computed(() =>
  (app.appointments || [])
    .filter(a => a.date === tomorrow && a.status !== 'cancelled')
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
)

function to12h(time) {
  if (!time) return '—'
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'م' : 'ص'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function close() {
  visible.value = false
  document.body.style.overflow = ''
}

onMounted(() => {
  if (app.config.apptNotif === false) return
  if (!todayAppts.value.length && !tomorrowAppts.value.length) return
  visible.value = true
  document.body.style.overflow = 'hidden'
})
</script>
