/**
 * Appointments Store — manages patient appointments and calendar
 * Phase 2: Uses item-level dirty tracking for normalized tables
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uid } from '../utils/helpers'

export const useAppointmentsStore = defineStore('appointments', () => {
  const appointments = ref([])
  const dirtyAppointments = ref(new Set())
  const deletedAppointments = ref(new Set())

  function markDirty(id) {
    if (id) dirtyAppointments.value.add(id)
  }

  function setAppointments(appts) {
    appointments.value = appts
  }

  function addAppointment(appt) {
    const a = { ...appt, id: appt.id || uid() }
    appointments.value.push(a)
    markDirty(a.id)
  }

  function updateAppointment(id, updates) {
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      appointments.value[idx] = { ...appointments.value[idx], ...updates }
      markDirty(id)
    }
  }

  function removeAppointment(id) {
    appointments.value = appointments.value.filter(a => a.id !== id)
    deletedAppointments.value.add(id)
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
    dirtyAppointments.value.clear()
    deletedAppointments.value.clear()
  }

  return {
    appointments, dirtyAppointments, deletedAppointments,
    setAppointments, addAppointment, updateAppointment, removeAppointment,
    getAppointmentsByDate, getAppointmentsByMonth,
    getUpcomingAppointments, getTodayAppointments, clearDirty,
    markDirty
  }
})
