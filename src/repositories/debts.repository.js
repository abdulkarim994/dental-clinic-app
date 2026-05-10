/**
 * Debts Repository — Phase 6
 *
 * Provides unified CRUD access for debt records across both
 * SQLite (native) and IndexedDB (web) backends.
 * Components and stores should use this instead of direct DB access.
 */

import { BaseRepository } from './base.repository'

class DebtsRepository extends BaseRepository {
  constructor() {
    super('debts', 'debts')
  }

  async getUnpaidDebts() {
    const all = await this.getAll()
    return all.filter(d => d.status !== 'paid' && !d._deleted)
  }

  async getDebtsByPatient(patientName) {
    const all = await this.getAll()
    return all.filter(d => d.name === patientName && !d._deleted)
  }

  async markAsPaid(id) {
    return this.update(id, { status: 'paid', _mod: Date.now() })
  }

  async addPayment(id, amount) {
    const debt = await this.getById(id)
    if (!debt) return null
    const paidAmount = (Number(debt.paidAmount) || 0) + Number(amount)
    const remaining = (Number(debt.totalAmount || debt.total) || 0) - paidAmount
    const updates = {
      paidAmount,
      remaining: Math.max(0, remaining),
      _mod: Date.now(),
    }
    if (remaining <= 0) updates.status = 'paid'
    return this.update(id, updates)
  }
}

export const debtsRepository = new DebtsRepository()
