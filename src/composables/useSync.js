/**
 * Sync composable — manages data synchronization lifecycle
 */
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useRecordsStore } from '../stores/records.store'
import { useDebtsStore } from '../stores/debts.store'
import { useAppointmentsStore } from '../stores/appointments.store'
import { useConfigStore } from '../stores/config.store'
import { useUiStore } from '../stores/ui.store'
import { cacheSave, cacheLoad } from '../services/cache.service'
import { saveToSupabase, loadFromSupabase, setupRealtime, clearRealtime, monthOf } from '../services/sync.service'
import { DEFAULT_CONFIG } from '../utils/defaults'
import { useToast } from './useToast'

let syncTimer = null
let rtChannel = null

export function useSync() {
  const { toast } = useToast()

  function getStores() {
    return {
      auth: useAuthStore(),
      records: useRecordsStore(),
      debts: useDebtsStore(),
      appts: useAppointmentsStore(),
      config: useConfigStore(),
      ui: useUiStore()
    }
  }

  function localSave() {
    const { auth, records, debts, appts, config } = getStores()
    if (!auth.userId) return
    cacheSave(auth.userId, {
      records: records.records,
      prosthetics: records.prosthetics,
      debts: debts.debts,
      cfg: config.cfg,
      appointments: appts.appointments
    })
  }

  function localLoad() {
    const { auth, records, debts, appts, config } = getStores()
    if (!auth.userId) return
    const data = cacheLoad(auth.userId, DEFAULT_CONFIG)
    records.setRecords(data.records)
    records.setProsthetics(data.prosthetics)
    debts.setDebts(data.debts)
    config.setConfig(data.cfg)
    appts.setAppointments(data.appointments)
    records.rebuildKnownMonths()
  }

  async function save(showOl = false) {
    const { auth, records, debts, appts, config, ui } = getStores()
    if (!auth.userId) return false

    const onProgress = showOl ? (p) => ui.updateSyncProgress(p) : null
    if (showOl) ui.showSync('رفع البيانات...', 0)

    const ok = await saveToSupabase(auth.userId, {
      records: records.records,
      prosthetics: records.prosthetics,
      debts: debts.debts,
      appointments: appts.appointments,
      cfg: config.cfg,
      dirtyMonths: records.dirtyMonths,
      knownMonths: records.knownMonths,
      debtsDirty: debts.dirty,
      apptsDirty: appts.dirty,
      showOl,
      onProgress
    })

    if (ok) {
      records.clearDirty()
      debts.clearDirty()
      appts.clearDirty()
    }

    if (showOl) ui.updateSyncProgress(100)
    return ok
  }

  async function load(showOl = false) {
    const { auth, records, debts, appts, config, ui } = getStores()
    if (!auth.userId) return

    const onProgress = showOl ? (p) => ui.updateSyncProgress(p) : null
    if (showOl) ui.showSync('تحميل البيانات...', 0)

    const result = await loadFromSupabase(auth.userId, {
      records: records.records,
      prosthetics: records.prosthetics,
      cfg: config.cfg,
      knownMonths: records.knownMonths,
      onProgress
    })

    if (result) {
      config.setConfig(result.cfg)
      debts.setDebts(result.debts)
      appts.setAppointments(result.appointments)
      records.setRecords(result.records)
      records.setProsthetics(result.prosthetics)
      records.knownMonths = result.knownMonths
      records.clearDirty()
      debts.clearDirty()
      appts.clearDirty()
      localSave()
    } else {
      localLoad()
    }

    if (showOl) ui.updateSyncProgress(100)
  }

  async function manualSync() {
    try {
      const ok = await save(false)
      await load(false)
      localSave()
      if (!ok) toast('⚠ تحقق من الاتصال')
      else toast('✅ تمت المزامنة')
      return ok
    } catch (e) {
      toast('❌ فشلت المزامنة')
      return false
    }
  }

  function startAutoSync() {
    const { config } = getStores()
    clearInterval(syncTimer)
    if (!config.autoSync) return
    syncTimer = setInterval(() => save(false), (config.syncMin || 30) * 60 * 1000)
  }

  function stopAutoSync() {
    clearInterval(syncTimer)
  }

  function startRealtime() {
    const { auth, records, debts, config, appts } = getStores()
    stopRealtime()
    if (!auth.userId) return

    rtChannel = setupRealtime(auth.userId, (payload) => {
      const ae = document.activeElement
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT')) return

      const row = payload.new
      if (!row) return
      const dt = row.data_type
      const d = row.data

      if (dt === 'months') {
        const curMonth = new Date().toISOString().substring(0, 7)
        if (row.data_key === curMonth && d) {
          records.mergeMonthData(curMonth, d)
          localSave()
        }
      } else if (dt === 'debts' && d) {
        debts.setDebts(d.debts || [])
        localSave()
      } else if (dt === 'config' && d) {
        config.mergeConfig(d)
      } else if (dt === 'appointments' && d) {
        appts.setAppointments(d.items || [])
        localSave()
      }
    })
  }

  function stopRealtime() {
    if (rtChannel) {
      clearRealtime(rtChannel)
      rtChannel = null
    }
  }

  return {
    localSave, localLoad,
    save, load, manualSync,
    startAutoSync, stopAutoSync,
    startRealtime, stopRealtime
  }
}
