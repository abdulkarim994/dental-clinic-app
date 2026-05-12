import { defineStore } from 'pinia'
import { ref } from 'vue'
import { markDebtsDirty } from '@/services/sync.service'
import { enqueueSyncAction } from '@/services/sync-queue.service'
import { sanitizeDebt } from '@/utils/sanitize'

export const useDebtsStore = defineStore('debts', () => {
  const debts = ref([])
  const isLoadedFromCache = ref(false)

  function addDebt(debt) {
    const clean = sanitizeDebt(debt)
    debts.value = [...debts.value, clean]
    markDebtsDirty()
    enqueueSyncAction({ type: 'debt_add', table: 'debts', recordId: clean.id, data: clean }).catch(() => {})
  }

  function updateDebt(id, updates) {
    const idx = debts.value.findIndex(d => d.id === id)
    if (idx !== -1) {
      const clean = sanitizeDebt(updates)
      const updated = [...debts.value]
      updated[idx] = { ...updated[idx], ...clean }
      debts.value = updated
      markDebtsDirty()
      enqueueSyncAction({ type: 'debt_update', table: 'debts', recordId: id, data: { id, ...clean } }).catch(() => {})
    }
  }

  function deleteDebt(id) {
    debts.value = debts.value.filter(d => d.id !== id)
    markDebtsDirty()
    enqueueSyncAction({ type: 'debt_delete', table: 'debts', recordId: id, data: { id } }).catch(() => {})
  }

  return {
    debts,
    isLoadedFromCache,
    addDebt,
    updateDebt,
    deleteDebt,
  }
})
