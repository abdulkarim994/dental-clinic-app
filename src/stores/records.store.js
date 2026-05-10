/**
 * Records Store — manages records and prosthetics data
 * Phase 2: Uses item-level dirty tracking for normalized tables
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uid, isProsthetic } from '../utils/helpers'

export const useRecordsStore = defineStore('records', () => {
  const records = ref([])
  const prosthetics = ref([])
  const dirtyRecords = ref(new Set())
  const dirtyProsthetics = ref(new Set())
  const deletedRecords = ref(new Set())
  const deletedProsthetics = ref(new Set())

  function monthOf(d) {
    return (d || '').substring(0, 7)
  }

  function markRecordDirty(id) {
    if (id) dirtyRecords.value.add(id)
  }

  function markProstheticDirty(id) {
    if (id) dirtyProsthetics.value.add(id)
  }

  function clearDirty() {
    dirtyRecords.value.clear()
    dirtyProsthetics.value.clear()
    deletedRecords.value.clear()
    deletedProsthetics.value.clear()
  }

  function setRecords(recs) {
    records.value = recs
  }

  function setProsthetics(pros) {
    prosthetics.value = pros
  }

  function addRecord(rec) {
    if (isProsthetic(rec.service || '')) {
      prosthetics.value.push(rec)
      markProstheticDirty(rec.id)
    } else {
      records.value.push(rec)
      markRecordDirty(rec.id)
    }
  }

  function updateRecord(id, updates, isPros) {
    const arr = isPros ? prosthetics.value : records.value
    const idx = arr.findIndex(r => r.id === id)
    if (idx !== -1) {
      arr[idx] = { ...arr[idx], ...updates }
      if (isPros) markProstheticDirty(id)
      else markRecordDirty(id)
    }
  }

  function removeRecord(id, isPros) {
    if (isPros) {
      const idx = prosthetics.value.findIndex(r => r.id === id)
      if (idx !== -1) {
        prosthetics.value.splice(idx, 1)
        deletedProsthetics.value.add(id)
      }
    } else {
      const idx = records.value.findIndex(r => r.id === id)
      if (idx !== -1) {
        records.value.splice(idx, 1)
        deletedRecords.value.add(id)
      }
    }
  }

  function getRecordsByMonth(month) {
    return records.value.filter(r => monthOf(r.date) === month)
  }

  function getProstheticsByMonth(month) {
    return prosthetics.value.filter(p => monthOf(p.date) === month)
  }

  function getAllByMonth(month) {
    return [
      ...getRecordsByMonth(month).map(r => ({ ...r, _t: 'r' })),
      ...getProstheticsByMonth(month).map(p => ({ ...p, _t: 'p' }))
    ].sort((a, b) => (a.date > b.date ? -1 : 1))
  }

  function getUniquePatientNames() {
    const names = new Set()
    records.value.forEach(r => { if (r.name) names.add(r.name) })
    prosthetics.value.forEach(p => { if (p.name) names.add(p.name) })
    return [...names].sort()
  }

  function getRecordsForPatient(name) {
    return [
      ...records.value.filter(r => r.name === name).map(r => ({ ...r, _t: 'r' })),
      ...prosthetics.value.filter(p => p.name === name).map(p => ({ ...p, _t: 'p' }))
    ].sort((a, b) => (a.date > b.date ? -1 : 1))
  }

  return {
    records, prosthetics, dirtyRecords, dirtyProsthetics,
    deletedRecords, deletedProsthetics,
    monthOf, markRecordDirty, markProstheticDirty, clearDirty,
    setRecords, setProsthetics,
    addRecord, updateRecord, removeRecord,
    getRecordsByMonth, getProstheticsByMonth, getAllByMonth,
    getUniquePatientNames, getRecordsForPatient
  }
})
