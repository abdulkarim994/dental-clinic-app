import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { markMonthDirty } from '@/services/sync.service'
import { sanitizeRecord } from '@/utils/sanitize'
import { enqueueSyncAction } from '@/services/sync-queue.service'

export const useRecordsStore = defineStore('records', () => {
  const records = shallowRef([])
  const prosthetics = shallowRef([])
  const isLoadedFromCache = ref(false)

  function addRecord(record) {
    const clean = sanitizeRecord(record)
    clean._mod = Date.now()
    records.value = [...records.value, clean]
    markMonthDirty(clean.date)
    enqueueSyncAction({ type: 'record_add', table: 'records', recordId: clean.id, data: clean }).catch(() => {})
  }

  function updateRecord(id, updates) {
    const idx = records.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      const updated = [...records.value]
      updated[idx] = { ...updated[idx], ...updates, _mod: Date.now() }
      records.value = updated
      markMonthDirty(records.value[idx].date)
      enqueueSyncAction({ type: 'record_update', table: 'records', recordId: id, data: { id, ...updates } }).catch(() => {})
    }
  }

  function deleteRecord(id) {
    const idx = records.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      markMonthDirty(records.value[idx].date)
      records.value = records.value.filter(r => r.id !== id)
      enqueueSyncAction({ type: 'record_delete', table: 'records', recordId: id, data: { id } }).catch(() => {})
    }
  }

  return {
    records,
    prosthetics,
    isLoadedFromCache,
    addRecord,
    updateRecord,
    deleteRecord,
  }
})
