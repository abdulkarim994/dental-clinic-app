import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cacheGetAll, cacheSaveAll } from '@/services/cache.service'
import { saveToSupabase, loadFromSupabase, markMonthDirty, markDebtsDirty, markApptsDirty } from '@/services/sync.service'
import { getCurrentMonth } from '@/utils/format'
import { validateRecords, validateDebts, validateAppointments, validateConfig } from '@/utils/sanitize'
import { useRecordsStore } from './records.store'
import { useDebtsStore as useDebtsSubStore } from './debts.store'
import { useAppointmentsStore } from './appointments.store'
import { useConfigStore, DEFAULT_CONFIG } from './config.store'
import { useSyncStore } from './sync.store'
import { usePatientsStore } from './patients.store'
import { startBackgroundSync, stopBackgroundSync, cacheSupabaseData } from '@/services/background-sync.service'

export const useAppStore = defineStore('app', () => {
  const recordsStore = useRecordsStore()
  const debtsSubStore = useDebtsSubStore()
  const appointmentsStore = useAppointmentsStore()
  const configStore = useConfigStore()
  const syncSt = useSyncStore()
  const patientsStore = usePatientsStore()

  const records = computed({
    get: () => recordsStore.records,
    set: (v) => { recordsStore.records = v },
  })
  const prosthetics = computed({
    get: () => recordsStore.prosthetics,
    set: (v) => { recordsStore.prosthetics = v },
  })
  const debts = computed({
    get: () => debtsSubStore.debts,
    set: (v) => { debtsSubStore.debts = v },
  })
  const appointments = computed({
    get: () => appointmentsStore.appointments,
    set: (v) => { appointmentsStore.appointments = v },
  })
  const config = computed({
    get: () => configStore.config,
    set: (v) => { configStore.config = v },
  })

  const activeTab = ref('add')
  const selectedMonth = ref(getCurrentMonth())

  const syncing = computed({
    get: () => syncSt.syncing,
    set: (v) => { syncSt.syncing = v },
  })
  const syncMessage = computed({
    get: () => syncSt.syncMessage,
    set: (v) => { syncSt.syncMessage = v },
  })
  const syncProgress = computed({
    get: () => syncSt.syncProgress,
    set: (v) => { syncSt.syncProgress = v },
  })

  const currency = computed(() => configStore.currency)
  const centerName = computed(() => configStore.centerName)
  const clinics = computed(() => configStore.clinics)
  const services = computed(() => configStore.services)
  const payments = computed(() => configStore.payments)

  function loadFromCache(uid) {
    if (!uid) return
    const cached = cacheGetAll(uid)
    const validRecs = validateRecords(cached.records)
    const validPros = validateRecords(cached.prosthetics)
    const validDebts = validateDebts(cached.debts)
    const validAppts = validateAppointments(cached.appointments)
    const validConfig = validateConfig(cached.config)
    if (validRecs.length) recordsStore.records = validRecs
    if (validPros.length) recordsStore.prosthetics = validPros
    if (validDebts.length) debtsSubStore.debts = validDebts
    if (validAppts.length) appointmentsStore.appointments = validAppts
    if (validConfig) configStore.config = { ...DEFAULT_CONFIG, ...validConfig }

    recordsStore.isLoadedFromCache = true
    debtsSubStore.isLoadedFromCache = true
    appointmentsStore.isLoadedFromCache = true
    patientsStore.isLoadedFromCache = true
  }

  function saveToCache(uid) {
    cacheSaveAll(uid, {
      records: recordsStore.records,
      prosthetics: recordsStore.prosthetics,
      debts: debtsSubStore.debts,
      config: configStore.config,
      appointments: appointmentsStore.appointments,
    })
  }

  /**
   * Persist current state to local cache and sync to Supabase.
   * Convenience method to replace the repeated saveToCache + syncSave pattern.
   */
  async function persistAndSync(uid) {
    saveToCache(uid)
    return syncSave(uid, false)
  }

  async function syncSave(uid, showOl = false) {
    if (showOl) {
      syncSt.syncing = true
      syncSt.syncMessage = 'جار المزامنة...'
      syncSt.syncProgress = 0
    }
    try {
      const ok = await saveToSupabase(uid, {
        records: recordsStore.records,
        prosthetics: recordsStore.prosthetics,
        debts: debtsSubStore.debts,
        config: configStore.config,
        appointments: appointmentsStore.appointments,
      }, showOl)
      if (showOl) syncSt.syncProgress = 100
      return ok
    } finally {
      if (showOl) syncSt.syncing = false
    }
  }

  async function syncLoad(uid, showOl = false) {
    if (showOl) {
      syncSt.syncing = true
      syncSt.syncMessage = 'جار تحميل البيانات...'
      syncSt.syncProgress = 0
    }
    try {
      const data = await loadFromSupabase(uid)
      const validRecords = validateRecords(data.records)
      const validProsthetics = validateRecords(data.prosthetics)
      const validDebts = validateDebts(data.debts)
      const validAppts = validateAppointments(data.appointments)
      if (validRecords.length) recordsStore.records = validRecords
      if (validProsthetics.length) recordsStore.prosthetics = validProsthetics
      if (validDebts.length) debtsSubStore.debts = validDebts
      if (validAppts.length) appointmentsStore.appointments = validAppts
      const validConfig = data.config ? validateConfig(data.config) : null
      if (validConfig) configStore.config = { ...DEFAULT_CONFIG, ...validConfig }
      if (showOl) syncSt.syncProgress = 100

      recordsStore.isLoadedFromCache = false
      debtsSubStore.isLoadedFromCache = false
      appointmentsStore.isLoadedFromCache = false
      patientsStore.isLoadedFromCache = false

      // Populate the offline repository layer in the background (non-blocking)
      cacheSupabaseData({
        records: recordsStore.records,
        prosthetics: recordsStore.prosthetics,
        appointments: appointmentsStore.appointments,
      }).catch(() => {})
    } finally {
      if (showOl) syncSt.syncing = false
    }
  }

  function addRecord(record) {
    recordsStore.addRecord(record)
  }

  function updateRecord(id, updates) {
    recordsStore.updateRecord(id, updates)
  }

  function deleteRecord(id) {
    recordsStore.deleteRecord(id)
  }

  function addDebt(debt) {
    debtsSubStore.addDebt(debt)
  }

  function updateDebt(id, updates) {
    debtsSubStore.updateDebt(id, updates)
  }

  function addAppointment(appt) {
    appointmentsStore.addAppointment(appt)
  }

  function removeAppointment(id) {
    appointmentsStore.removeAppointment(id)
  }

  function updateConfig(updates) {
    configStore.updateConfig(updates)
  }

  function resetState() {
    recordsStore.records = []
    recordsStore.prosthetics = []
    debtsSubStore.debts = []
    appointmentsStore.appointments = []
    configStore.resetConfig()
    activeTab.value = 'add'
    selectedMonth.value = getCurrentMonth()
  }

  /**
   * Initialize background sync processing.
   * Call after user login with the syncHandler that processes queue items.
   */
  function initBackgroundSync(syncHandler) {
    startBackgroundSync(syncHandler)
  }

  /**
   * Stop background sync (call on logout or app destroy).
   */
  function destroyBackgroundSync() {
    stopBackgroundSync()
  }

  return {
    records,
    prosthetics,
    debts,
    appointments,
    config,
    activeTab,
    selectedMonth,
    syncing,
    syncMessage,
    syncProgress,
    currency,
    centerName,
    clinics,
    services,
    payments,
    loadFromCache,
    saveToCache,
    persistAndSync,
    syncSave,
    syncLoad,
    addRecord,
    updateRecord,
    deleteRecord,
    addDebt,
    updateDebt,
    addAppointment,
    removeAppointment,
    updateConfig,
    resetState,
    initBackgroundSync,
    destroyBackgroundSync,
  }
})
