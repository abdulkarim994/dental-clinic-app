<template>
  <div class="max-w-lg mx-auto px-4 mt-4 space-y-4 tab-in">
    <div class="sec-h mb-3">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a7 7 0 0114 0v2"/></svg>
      المرضى ({{ patientList.length }})
    </div>

    <!-- Search -->
    <input type="text" v-model="search" class="inp text-xs" placeholder="بحث بالاسم...">

    <!-- Patient list -->
    <div v-if="filteredPatients.length === 0" class="text-center py-12 opacity-25">
      <div class="text-4xl mb-2">👥</div>
      <p class="text-xs">لا يوجد مرضى</p>
    </div>

    <div v-for="pat in filteredPatients" :key="pat.name" class="pat-card row-card p-3 clickable" @click="openPatient(pat.name)">
      <div class="flex items-center gap-3">
        <div class="pat-photo-ph" v-if="!pat.photo">
          <span>{{ pat.name.charAt(0) }}</span>
        </div>
        <img v-else :src="pat.photo" class="pat-photo" :alt="pat.name">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="font-bold text-sm truncate">{{ pat.name }}</span>
            <span v-if="pat.hasDebt" class="b-debt">دين</span>
          </div>
          <p class="text-[10px] opacity-40">{{ pat.visitCount }} زيارة · آخر زيارة {{ pat.lastVisit }}</p>
        </div>
        <div class="text-left flex-shrink-0">
          <div class="n text-xs font-bold" style="color:var(--gold)">{{ n(pat.totalAmount) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecordsStore } from '../stores/records.store'
import { useDebtsStore } from '../stores/debts.store'
import { n, sum } from '../utils/helpers'

const recordsStore = useRecordsStore()
const debtsStore = useDebtsStore()

const search = ref('')

const patientList = computed(() => {
  const names = recordsStore.getUniquePatientNames()
  return names.map(name => {
    const recs = recordsStore.getRecordsForPatient(name)
    const lastRec = recs[0]
    const activeDebts = debtsStore.getActiveDebtsByPatient(name)
    return {
      name,
      visitCount: recs.length,
      lastVisit: lastRec?.date || '',
      totalAmount: sum(recs, 'amount'),
      hasDebt: activeDebts.length > 0,
      photo: null
    }
  })
})

const filteredPatients = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return patientList.value
  return patientList.value.filter(p => p.name.toLowerCase().includes(q))
})

function openPatient(name) {
  /* TODO: open patient detail */
}
</script>
