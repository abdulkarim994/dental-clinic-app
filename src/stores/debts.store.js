import { defineStore } from 'pinia'
import { ref } from 'vue'
import { markDebtsDirty } from '@/services/sync.service'
import { enqueueSyncAction } from '@/services/sync-queue.service'
import { sanitizeDebt } from '@/utils/sanitize'

export const useDebtsStore = defineStore('debts', () => {
  const debts = ref([])

  function addDebt(debt) {
    const clean = sanitizeDebt(debt)
    debts.value.push(clean)
    markDebtsDirty()
    enqueueSyncAction({ type: 'debt_add', table: 'debts', recordId: clean.id, data: clean }).catch(() => {})
  }

  function updateDebt(id, updates) {
    const idx = debts.value.findIndex(d => d.id === id)
    if (idx !== -1) {
      const clean = sanitizeDebt(updates)
      debts.value[idx] = { ...debts.value[idx], ...clean }
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
    addDebt,
    updateDebt,
    deleteDebt,
  }
})
