<template>
  <div class="pat-card glass p-4 rounded-2xl space-y-2.5">
    <!-- Header row -->
    <div class="flex items-start justify-between gap-2">
      <div style="cursor:pointer" title="صورة المريض — اضغط للتغيير" @click="$emit('openPhoto', patient.name)">
        <img v-if="photo" :src="photo" class="pat-photo" :alt="patient.name">
        <div v-else class="pat-photo-ph">👤</div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <p class="text-sm font-black">{{ patient.name }}</p>
          <span
            v-if="hasReport"
            class="report-badge"
            style="cursor:pointer"
            @click.stop="$emit('open-report', patient.name)"
          >
            <IconRecords :size="10" style="display:inline;vertical-align:-1px" /> تقرير
          </span>
          <span v-if="hasPros" class="b-pros">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:inline;vertical-align:-1px"><path d="M12 2C8 2 6 5 6 8c0 4 6 14 6 14s6-10 6-14c0-3-2-6-6-6z"/><circle cx="12" cy="8" r="2"/></svg>
            تركيبات
          </span>
          <span
            v-if="activeDebts.length"
            class="b-debt badge-click"
            title="اضغط لعرض الديون"
            @click.stop="$emit('settle-debt', patient.name)"
          >
            <IconDebts :size="10" style="display:inline;vertical-align:-1px" />
            {{ activeDebts.length }} دين
          </span>
        </div>
        <p class="text-[10px] opacity-40 mt-0.5">
          آخر زيارة: {{ patient.lastDate || '—' }} • {{ patient.visitCount }} زيارة
        </p>
        <p v-if="treatmentPlan.length" class="text-[9px] mt-0.5" style="color:var(--green)">
          خطة علاج: {{ tpDone }}/{{ treatmentPlan.length }} مرحلة
        </p>
      </div>

      <div class="text-left flex-shrink-0">
        <p class="text-sm font-black" style="color:var(--gold)">
          <span class="n">{{ formatNumber(patient.total) }}</span>
        </p>
        <p class="text-[9px] opacity-35">{{ currency }}</p>
      </div>
    </div>

    <!-- Summary box -->
    <div class="pat-summary-box" style="grid-template-columns:repeat(4,1fr)">
      <div>
        <div class="ps-val">{{ patient.visitCount }}</div>
        <div class="ps-lbl">زيارة</div>
      </div>
      <div title="إجمالي تكلفة الخدمات">
        <div class="ps-val" style="color:var(--gold-l)">{{ formatNumber(patient.grossTotal) }}</div>
        <div class="ps-lbl">التكلفة {{ currency }}</div>
      </div>
      <div title="إجمالي المبالغ المدفوعة فعلياً">
        <div class="ps-val" style="color:var(--green)">{{ formatNumber(patient.total) }}</div>
        <div class="ps-lbl">المدفوع {{ currency }}</div>
      </div>
      <div
        :style="patient.debtRemaining > 0 ? 'cursor:pointer' : ''"
        :title="patient.debtRemaining > 0 ? 'رصيد مستحق — اضغط للتفاصيل' : 'لا ديون مستحقة'"
        @click="patient.debtRemaining > 0 && $emit('settle-debt', patient.name)"
      >
        <div
          class="ps-val"
          :style="{
            color: patient.debtRemaining > 0 ? 'var(--red)' : 'var(--green)',
            textDecoration: patient.debtRemaining > 0 ? 'underline dotted' : 'none'
          }"
        >
          {{ patient.debtRemaining > 0 ? formatNumber(patient.debtRemaining) : '✓' }}
        </div>
        <div class="ps-lbl">{{ patient.debtRemaining > 0 ? 'المتبقي ↗' : 'لا ديون' }}</div>
      </div>
    </div>

    <!-- Service tags -->
    <div v-if="serviceTags.length" class="flex flex-wrap gap-1">
      <span
        v-for="svc in serviceTags"
        :key="svc"
        class="report-badge badge-click"
        style="font-size:9px"
      >{{ svc }}</span>
      <span v-if="moreServices > 0" class="text-[9px] opacity-40">+{{ moreServices }}</span>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-2 pt-1">
      <button class="btn-o px-3 py-1.5 text-[10px] flex-1 flex items-center justify-center gap-1" @click="$emit('open-detail', patient.name)">
        <IconRecords :size="12" /> السجل الكامل
      </button>
      <button class="btn-g px-3 py-1.5 text-[10px] flex-1 flex items-center justify-center gap-1" @click="$emit('add-visit', patient.name)">
        <IconAdd :size="12" /> زيارة جديدة
      </button>
      <button class="btn-o px-2 py-1.5 text-[10px] flex items-center justify-center gap-0.5" title="خطة العلاج" @click="$emit('open-treatment', patient.name)">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      </button>
      <button class="pat-pdf-btn" @click="$emit('print', patient.name)">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      </button>
      <button class="btn-o px-2 py-1.5 text-[10px] flex items-center justify-center gap-0.5" title="تعديل بيانات المريض" @click="$emit('edit', patient.name)">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="ic-btn ic-del" style="width:30px;height:30px" title="حذف جميع بيانات المريض" @click="$emit('delete', patient.name)">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>

    <!-- Settle debt button -->
    <button
      v-if="activeDebts.length"
      class="w-full py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-2"
      style="background:linear-gradient(135deg,rgba(74,222,128,.15),rgba(34,197,94,.08));border:1px solid rgba(74,222,128,.3);color:#4ade80;transition:all .2s"
      @click="$emit('settle-debt', patient.name)"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8"/></svg>
      تسديد الدين ({{ formatNumber(patient.debtRemaining) }} {{ currency }})
    </button>

    <!-- WhatsApp buttons -->
    <div v-if="waPhone" class="flex gap-1.5">
      <a
        :href="`https://wa.me/${waPhone}?text=${waMsg}`"
        class="whatsapp-btn flex-1 justify-center py-1.5"
        target="_blank"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        واتساب
      </a>
      <button
        class="whatsapp-btn flex-1 justify-center py-1.5"
        style="background:rgba(37,211,102,.08);border-color:rgba(37,211,102,.2)"
        @click.prevent="$emit('wa-templates', patient.name, waPhone)"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
        قوالب
      </button>
    </div>

    <!-- X-ray Gallery -->
    <div v-if="xrayImages.length || showingDetail" class="space-y-2 pt-1 border-t border-white/10">
      <XrayGallery
        :images="xrayImages"
        :patient-name="patient.name"
        @upload="$emit('xray-upload', patient.name, $event)"
        @delete="$emit('xray-delete', patient.name, $event)"
        @open-viewer="$emit('xray-view', patient.name, $event)"
      />
    </div>

    <!-- Detail section (collapsible) -->
    <div v-if="showingDetail" class="space-y-1.5 pt-1 border-t border-white/10">
      <div
        v-for="entry in patient.entries.slice(0, 20)"
        :key="entry.id"
        class="row-card p-2 text-[10px]"
      >
        <div class="flex justify-between">
          <span>{{ entry.service || '—' }}</span>
          <span class="n">{{ formatNumber(entry.amount || entry.total || 0) }}</span>
        </div>
        <div class="opacity-40 text-[9px]">{{ entry.date }}</div>
      </div>
      <div v-if="patient.entries.length > 20" class="text-center text-[10px] opacity-40 py-2">
        +{{ patient.entries.length - 20 }} سجل إضافي
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePatientsStore } from '@/stores/patients.store'
import { useAppStore } from '@/stores/app.store'
import { formatNumber } from '@/utils/format'
import IconRecords from '@/components/icons/IconRecords.vue'
import IconAdd from '@/components/icons/IconAdd.vue'
import IconDebts from '@/components/icons/IconDebts.vue'
import XrayGallery from '@/components/XrayGallery.vue'

const props = defineProps({
  patient: { type: Object, required: true },
})

defineEmits([
  'add-visit', 'open-detail', 'open-report', 'open-treatment',
  'print', 'edit', 'delete', 'settle-debt', 'openPhoto',
  'xray-upload', 'xray-delete', 'xray-view', 'wa-templates',
])

const patientsStore = usePatientsStore()
const appStore = useAppStore()

const showingDetail = ref(false)

const currency = computed(() => appStore.currency)

const photo = computed(() => patientsStore.getPatientPhoto(props.patient.name))
const activeDebts = computed(() => patientsStore.getActiveDebts(props.patient.name))
const hasReport = computed(() => patientsStore.hasReport(props.patient))
const hasPros = computed(() => patientsStore.hasProsthetics(props.patient))
const treatmentPlan = computed(() => patientsStore.getTreatmentPlan(props.patient.name))
const tpDone = computed(() => treatmentPlan.value.filter(s => s.done).length)

const serviceTags = computed(() => [...props.patient.services].slice(0, 3))
const moreServices = computed(() => Math.max(0, props.patient.services.size - 3))

const waPhone = computed(() => patientsStore.getPatientPhone(props.patient.name))
const waMsg = computed(() => encodeURIComponent(`السلام عليكم ${props.patient.name}, هذا تذكير من العيادة`))
const xrayImages = computed(() => {
  const xrays = appStore.config.patientXrays
  return (xrays && xrays[props.patient.name]) || []
})
</script>
