/**
 * Debts Store — manages patient debts and installments
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uid } from '../utils/helpers'

export const useDebtsStore = defineStore('debts', () => {
  const debts = ref([])
  const dirty = ref(false)

  const activeDebts = computed(() => debts.value.filter(d => !d.settled))
  const settledDebts = computed(() => debts.value.filter(d => d.settled))

  const totalDebt = computed(() =>
    activeDebts.value.reduce((s, d) => s + (Number(d.amount) || 0), 0)
  )

  const totalPaid = computed(() =>
    activeDebts.value.reduce((s, d) => {
      const payments = d.payments || []
      return s + payments.reduce((ps, p) => ps + (Number(p.amount) || 0), 0)
    }, 0)
  )

  const debtCount = computed(() => activeDebts.value.length)

  function setDebts(d) {
    debts.value = d
  }

  function addDebt(debt) {
    debts.value.push({ ...debt, id: debt.id || uid() })
    dirty.value = true
  }

  function updateDebt(id, updates) {
    const idx = debts.value.findIndex(d => d.id === id)
    if (idx !== -1) {
      debts.value[idx] = { ...debts.value[idx], ...updates }
      dirty.value = true
    }
  }

  function removeDebt(id) {
    debts.value = debts.value.filter(d => d.id !== id)
    dirty.value = true
  }

  function addPayment(debtId, payment) {
    const debt = debts.value.find(d => d.id === debtId)
    if (debt) {
      if (!debt.payments) debt.payments = []
      debt.payments.push({ ...payment, id: uid() })
      dirty.value = true
    }
  }

  function settleDebt(id) {
    const debt = debts.value.find(d => d.id === id)
    if (debt) {
      debt.settled = true
      dirty.value = true
    }
  }

  function getDebtsByPatient(name) {
    return debts.value.filter(d => d.name === name)
  }

  function getActiveDebtsByPatient(name) {
    return debts.value.filter(d => d.name === name && !d.settled)
  }

  function clearDirty() {
    dirty.value = false
  }

  return {
    debts, dirty,
    activeDebts, settledDebts, totalDebt, totalPaid, debtCount,
    setDebts, addDebt, updateDebt, removeDebt,
    addPayment, settleDebt,
    getDebtsByPatient, getActiveDebtsByPatient, clearDirty
  }
})
