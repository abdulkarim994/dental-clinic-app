/**
 * Records Store — manages records and prosthetics data
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uid, isProsthetic } from '../utils/helpers'

export const useRecordsStore = defineStore('records', () => {
  const records = ref([])
  const prosthetics = ref([])
  const dirtyMonths = ref(new Set())
  const knownMonths = ref(new Set())

  function monthOf(d) {
    return (d || '').substring(0, 7)
  }

  function markMonthDirty(dateStr) {
    if (dateStr) dirtyMonths.value.add(monthOf(dateStr))
  }

  function clearDirty() {
    dirtyMonths.value.clear()
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
    } else {
      records.value.push(rec)
    }
    markMonthDirty(rec.date)
  }

  function updateRecord(id, updates, isPros) {
    const arr = isPros ? prosthetics.value : records.value
    const idx = arr.findIndex(r => r.id === id)
    if (idx !== -1) {
      const old = arr[idx]
      markMonthDirty(old.date)
      arr[idx] = { ...old, ...updates }
      markMonthDirty(arr[idx].date)
    }
  }

  function removeRecord(id, isPros) {
    if (isPros) {
      const idx = prosthetics.value.findIndex(r => r.id === id)
      if (idx !== -1) {
        markMonthDirty(prosthetics.value[idx].date)
        prosthetics.value.splice(idx, 1)
      }
    } else {
      const idx = records.value.findIndex(r => r.id === id)
      if (idx !== -1) {
        markMonthDirty(records.value[idx].date)
        records.value.splice(idx, 1)
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

  function mergeMonthData(month, data) {
    records.value = records.value.filter(r => monthOf(r.date) !== month)
    prosthetics.value = prosthetics.value.filter(p => monthOf(p.date) !== month)
    records.value.push(...(data.records || []))
    prosthetics.value.push(...(data.prosthetics || []))
  }

  function rebuildKnownMonths() {
    const allMonths = [
      ...new Set([
        ...records.value.map(r => monthOf(r.date)),
        ...prosthetics.value.map(p => monthOf(p.date))
      ])
    ].filter(Boolean)
    allMonths.forEach(m => knownMonths.value.add(m))
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
    records, prosthetics, dirtyMonths, knownMonths,
    monthOf, markMonthDirty, clearDirty,
    setRecords, setProsthetics,
    addRecord, updateRecord, removeRecord,
    getRecordsByMonth, getProstheticsByMonth, getAllByMonth,
    mergeMonthData, rebuildKnownMonths,
    getUniquePatientNames, getRecordsForPatient
  }
})
