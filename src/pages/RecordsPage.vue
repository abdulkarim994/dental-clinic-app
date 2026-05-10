<template>
  <div class="max-w-lg mx-auto px-4 mt-4 space-y-4 tab-in">
    <!-- Search -->
    <div class="mb-4 relative">
      <input type="text" v-model="search" class="inp" placeholder=" بحث ذكي بالاسم..." autocomplete="off">
    </div>

    <!-- Filter bar -->
    <div class="rec-filter-bar">
      <button @click="recFilter = 'month'" class="rec-filter-btn" :class="{ 'rf-on': recFilter === 'month' }">هذا الشهر</button>
      <button @click="recFilter = 'week'" class="rec-filter-btn" :class="{ 'rf-on': recFilter === 'week' }">هذا الأسبوع</button>
      <button @click="recFilter = 'today'" class="rec-filter-btn" :class="{ 'rf-on': recFilter === 'today' }">اليوم</button>
      <button @click="recFilter = 'all'" class="rec-filter-btn" :class="{ 'rf-on': recFilter === 'all' }">الكل</button>
    </div>

    <!-- Records list -->
    <div v-if="filteredRecords.length === 0" class="text-center py-12 opacity-25">
      <div class="text-4xl mb-2">📋</div>
      <p class="text-xs">لا توجد سجلات</p>
    </div>

    <div class="space-y-2">
      <div v-for="rec in filteredRecords" :key="rec.id" class="row-card p-3">
        <div class="flex justify-between items-start gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-sm pat-name-link" @click="$emit('goToPatient', rec.name)">{{ rec.name }}</span>
              <span v-if="rec._t === 'p'" class="b-pros">تركيبات</span>
              <span v-if="rec.labStatus === 'pending'" class="b-lab-pending">قيد التنفيذ</span>
              <span v-if="rec.labStatus === 'ready'" class="b-lab-ready">جاهز</span>
              <span v-if="rec.labStatus === 'late'" class="b-lab-late">متأخر</span>
            </div>
            <p class="text-[10px] opacity-45">{{ rec.service }} — {{ rec.clinic }}</p>
            <p class="text-[10px] opacity-30">{{ rec.date }} · {{ rec.payment }}</p>
            <p v-if="rec.notes" class="text-[9px] opacity-30 mt-1">{{ rec.notes }}</p>
          </div>
          <div class="text-left flex-shrink-0">
            <div class="n font-bold text-sm" style="color:var(--gold)">{{ n(rec.amount) }}</div>
            <div v-if="rec._t === 'p' && rec.labCost" class="text-[9px] opacity-40">معمل: <span class="n">{{ n(rec.labCost) }}</span></div>
          </div>
        </div>
        <div class="flex gap-1.5 mt-2 justify-end">
          <button @click="$emit('editRecord', rec.id, rec._t)" class="ic-btn ic-edit">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button @click="$emit('deleteRecord', rec.id, rec._t)" class="ic-btn ic-del">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecordsStore } from '../stores/records.store'
import { useUiStore } from '../stores/ui.store'
import { n, todayStr } from '../utils/helpers'

const recordsStore = useRecordsStore()
const ui = useUiStore()

defineEmits(['editRecord', 'deleteRecord', 'goToPatient'])

const search = ref('')
const recFilter = ref('month')

const allRecords = computed(() => {
  const all = [...recordsStore.records, ...recordsStore.prosthetics]
  return all.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
})

const filteredRecords = computed(() => {
  let recs = allRecords.value
  const today = todayStr()
  const selectedMonth = ui.selectedMonth

  if (recFilter.value === 'month') {
    recs = recs.filter(r => (r.date || '').substring(0, 7) === selectedMonth)
  } else if (recFilter.value === 'week') {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekStartStr = weekStart.toISOString().substring(0, 10)
    recs = recs.filter(r => r.date >= weekStartStr && r.date <= today)
  } else if (recFilter.value === 'today') {
    recs = recs.filter(r => r.date === today)
  }

  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    recs = recs.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.service || '').toLowerCase().includes(q) ||
      (r.notes || '').toLowerCase().includes(q)
    )
  }
  return recs
})
</script>
