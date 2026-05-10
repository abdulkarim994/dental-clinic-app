/**
 * Debts Store — manages patient debts and installments
 * Phase 2: Uses item-level dirty tracking for normalized tables
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uid } from '../utils/helpers'

export const useDebtsStore = defineStore('debts', () => {
  const debts = ref([])
  const dirtyDebts = ref(new Set())
  const deletedDebts = ref(new Set())

  const activeDebts = computed(() => debts.value.filter(d => !d.settled))
  const settledDebts = computed(() => debts.value.filter(d => d.settled))

  const totalDebt = computed(() =>
    activeDebts.value.reduce((s, d) => s + (Number(d.amount || d.total_amount || d.totalAmount) || 0), 0)
  )

  const totalPaid = computed(() =>
    activeDebts.value.reduce((s, d) => {
      const payments = d.payments || d.installments || []
      return s + payments.reduce((ps, p) => ps + (Number(p.amount) || 0), 0)
    }, 0)
  )

  const debtCount = computed(() => activeDebts.value.length)

  function markDirty(id) {
    if (id) dirtyDebts.value.add(id)
  }

  function setDebts(d) {
    debts.value = d
  }

  function addDebt(debt) {
    const d = { ...debt, id: debt.id || uid() }
    debts.value.push(d)
    markDirty(d.id)
  }

  function updateDebt(id, updates) {
    const idx = debts.value.findIndex(d => d.id === id)
    if (idx !== -1) {
      debts.value[idx] = { ...debts.value[idx], ...updates }
      markDirty(id)
    }
  }

  function removeDebt(id) {
    debts.value = debts.value.filter(d => d.id !== id)
    deletedDebts.value.add(id)
  }

  function addPayment(debtId, payment) {
    const debt = debts.value.find(d => d.id === debtId)
    if (debt) {
      if (!debt.payments) debt.payments = []
      if (!debt.installments) debt.installments = []
      const p = { ...payment, id: payment.id || uid() }
      debt.payments.push(p)
      debt.installments.push(p)
      markDirty(debtId)
    }
  }

  function settleDebt(id) {
    const debt = debts.value.find(d => d.id === id)
    if (debt) {
      debt.settled = true
      markDirty(id)
    }
  }

  function getDebtsByPatient(name) {
    return debts.value.filter(d => d.name === name)
  }

  function getActiveDebtsByPatient(name) {
    return debts.value.filter(d => d.name === name && !d.settled)
  }

  function clearDirty() {
    dirtyDebts.value.clear()
    deletedDebts.value.clear()
  }

  return {
    debts, dirtyDebts, deletedDebts,
    activeDebts, settledDebts, totalDebt, totalPaid, debtCount,
    setDebts, addDebt, updateDebt, removeDebt,
    addPayment, settleDebt,
    getDebtsByPatient, getActiveDebtsByPatient, clearDirty,
    markDirty
  }
})
