/**
 * Appointments Store — manages patient appointments and calendar
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uid } from '../utils/helpers'

export const useAppointmentsStore = defineStore('appointments', () => {
  const appointments = ref([])
  const dirty = ref(false)

  function setAppointments(appts) {
    appointments.value = appts
  }

  function addAppointment(appt) {
    appointments.value.push({ ...appt, id: appt.id || uid() })
    dirty.value = true
  }

  function updateAppointment(id, updates) {
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      appointments.value[idx] = { ...appointments.value[idx], ...updates }
      dirty.value = true
    }
  }

  function removeAppointment(id) {
    appointments.value = appointments.value.filter(a => a.id !== id)
    dirty.value = true
  }

  function getAppointmentsByDate(date) {
    return appointments.value.filter(a => a.date === date)
  }

  function getAppointmentsByMonth(month) {
    return appointments.value.filter(a => (a.date || '').substring(0, 7) === month)
  }

  function getUpcomingAppointments() {
    const today = new Date().toISOString().substring(0, 10)
    return appointments.value
      .filter(a => a.date >= today)
      .sort((a, b) => (a.date > b.date ? 1 : -1))
  }

  function getTodayAppointments() {
    const today = new Date().toISOString().substring(0, 10)
    return appointments.value
      .filter(a => a.date === today)
      .sort((a, b) => ((a.time || '') > (b.time || '') ? 1 : -1))
  }

  function clearDirty() {
    dirty.value = false
  }

  return {
    appointments, dirty,
    setAppointments, addAppointment, updateAppointment, removeAppointment,
    getAppointmentsByDate, getAppointmentsByMonth,
    getUpcomingAppointments, getTodayAppointments, clearDirty
  }
})
