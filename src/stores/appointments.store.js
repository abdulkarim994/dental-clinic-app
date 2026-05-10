import { defineStore } from 'pinia'
import { ref } from 'vue'
import { markApptsDirty } from '@/services/sync.service'
import { enqueueSyncAction } from '@/services/sync-queue.service'
import { sanitizeAppointment } from '@/utils/sanitize'

export const useAppointmentsStore = defineStore('appointments', () => {
  const appointments = ref([])

  function addAppointment(appt) {
    const clean = sanitizeAppointment(appt)
    appointments.value.push(clean)
    markApptsDirty()
    enqueueSyncAction({ type: 'appt_add', table: 'appointments', recordId: clean.id, data: clean }).catch(() => {})
  }

  function removeAppointment(id) {
    appointments.value = appointments.value.filter(a => a.id !== id)
    markApptsDirty()
    enqueueSyncAction({ type: 'appt_delete', table: 'appointments', recordId: id, data: { id } }).catch(() => {})
  }

  function updateAppointment(id, updates) {
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      const clean = sanitizeAppointment(updates)
      appointments.value[idx] = { ...appointments.value[idx], ...clean }
      markApptsDirty()
      enqueueSyncAction({ type: 'appt_update', table: 'appointments', recordId: id, data: { id, ...clean } }).catch(() => {})
    }
  }

  return {
    appointments,
    addAppointment,
    removeAppointment,
    updateAppointment,
  }
})
