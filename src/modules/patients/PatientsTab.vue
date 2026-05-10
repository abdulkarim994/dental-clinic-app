<template>
  <div class="space-y-4">
    <!-- Search -->
    <div class="glass p-4 rounded-2xl">
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <input
            :value="searchQuery"
            type="text"
            class="inp"
            placeholder="بحث عن مريض..."
            style="padding-right:38px"
            @input="onSearch"
          >
          <svg
            class="absolute top-1/2 right-3 -translate-y-1/2 opacity-30"
            viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <span class="text-[10px] opacity-40 whitespace-nowrap">
          <span class="n">{{ totalPatients }}</span> مريض
        </span>
      </div>
    </div>

    <!-- Patients list -->
    <div v-if="!patients.length" class="text-center opacity-35 py-14 text-sm">
      لا يوجد مرضى مسجلون بعد
    </div>

    <PatientCard
      v-for="patient in patients"
      :key="patient.name"
      :patient="patient"
      @add-visit="addVisitForPatient"
      @open-detail="togglePatDetail"
      @open-report="openPatientReport"
      @open-treatment="openTpModal"
      @print="printPatient"
      @edit="editPatientName"
      @delete="deletePatient"
      @settle-debt="settleDebt"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePatientsStore } from '@/stores/patients.store'
import { useToast } from '@/composables/useToast'
import { debounce } from '@/utils/debounce'
import PatientCard from './components/PatientCard.vue'

const patientsStore = usePatientsStore()
const { toast } = useToast()

const searchQuery = computed(() => patientsStore.searchQuery)
const patients = computed(() => patientsStore.filteredPatients)
const totalPatients = computed(() => patientsStore.totalPatients)

const onSearch = debounce((e) => {
  patientsStore.setSearch(e.target.value)
}, 250)

function addVisitForPatient(name) {
  toast(`زيارة جديدة لـ ${name} — قيد التطوير`)
}

function togglePatDetail(name) {
  patientsStore.selectPatient(name)
}

function openPatientReport(name) {
  toast(`تقرير ${name} — قيد التطوير`)
}

function openTpModal(name) {
  toast(`خطة العلاج لـ ${name} — قيد التطوير`)
}

function printPatient(name) {
  toast(`طباعة بيانات ${name} — قيد التطوير`)
}

function editPatientName(name) {
  toast(`تعديل بيانات ${name} — قيد التطوير`)
}

function deletePatient(name) {
  toast(`حذف ${name} — قيد التطوير`)
}

function settleDebt(name) {
  toast(`تسديد دين ${name} — قيد التطوير`)
}
</script>
