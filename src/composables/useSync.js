/**
 * Sync composable — manages data synchronization lifecycle
 * Phase 2: Uses normalized tables with item-level dirty tracking
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
import { deleteRecord, deleteProsthetic, deleteDebt, deleteAppointment } from '../services/database.service'
import { DEFAULT_CONFIG } from '../utils/defaults'
import { useToast } from './useToast'

let syncTimer = null
let rtChannels = null

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
  }

  async function save(showOl = false) {
    const { auth, records, debts, appts, config, ui } = getStores()
    if (!auth.userId) return false

    const onProgress = showOl ? (p) => ui.updateSyncProgress(p) : null
    if (showOl) ui.showSync('رفع البيانات...', 0)

    // Handle deletions first
    const deleteOps = []
    for (const id of records.deletedRecords) {
      deleteOps.push(deleteRecord(id))
    }
    for (const id of records.deletedProsthetics) {
      deleteOps.push(deleteProsthetic(id))
    }
    for (const id of debts.deletedDebts) {
      deleteOps.push(deleteDebt(id))
    }
    for (const id of appts.deletedAppointments) {
      deleteOps.push(deleteAppointment(id))
    }
    if (deleteOps.length > 0) {
      await Promise.all(deleteOps)
    }

    const ok = await saveToSupabase(auth.userId, {
      records: records.records,
      prosthetics: records.prosthetics,
      debts: debts.debts,
      appointments: appts.appointments,
      cfg: config.cfg,
      dirtyRecords: records.dirtyRecords,
      dirtyProsthetics: records.dirtyProsthetics,
      dirtyDebts: debts.dirtyDebts,
      dirtyAppointments: appts.dirtyAppointments,
      cfgDirty: config.dirty,
      showOl,
      onProgress
    })

    if (ok) {
      records.clearDirty()
      debts.clearDirty()
      appts.clearDirty()
      if (config.dirty) config.dirty = false
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
      cfg: config.cfg,
      onProgress
    })

    if (result) {
      config.setConfig(result.cfg)
      debts.setDebts(result.debts)
      appts.setAppointments(result.appointments)
      records.setRecords(result.records)
      records.setProsthetics(result.prosthetics)
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

    rtChannels = setupRealtime(auth.userId, (payload) => {
      const ae = document.activeElement
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT')) return

      const row = payload.new
      if (!row) return
      const table = payload.table

      if (table === 'records') {
        const idx = records.records.findIndex(r => r.id === row.id)
        if (idx >= 0) records.records[idx] = row
        else records.records.push(row)
        localSave()
      } else if (table === 'prosthetics') {
        const idx = records.prosthetics.findIndex(p => p.id === row.id)
        if (idx >= 0) records.prosthetics[idx] = row
        else records.prosthetics.push(row)
        localSave()
      } else if (table === 'debts') {
        const idx = debts.debts.findIndex(d => d.id === row.id)
        if (idx >= 0) debts.debts[idx] = row
        else debts.debts.push(row)
        localSave()
      } else if (table === 'appointments') {
        const idx = appts.appointments.findIndex(a => a.id === row.id)
        if (idx >= 0) appts.appointments[idx] = row
        else appts.appointments.push(row)
        localSave()
      } else if (table === 'user_config') {
        if (row.config) config.mergeConfig(row.config)
      }
    })
  }

  function stopRealtime() {
    if (rtChannels) {
      clearRealtime(rtChannels)
      rtChannels = null
    }
  }

  return {
    localSave, localLoad,
    save, load, manualSync,
    startAutoSync, stopAutoSync,
    startRealtime, stopRealtime
  }
}
