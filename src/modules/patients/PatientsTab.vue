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
      @xray-upload="onXrayUpload"
      @xray-delete="onXrayDelete"
      @xray-view="openXrayViewer"
      @wa-templates="openWaTemplates"
    />

    <!-- Treatment Plan Modal -->
    <Teleport to="body">
      <div v-if="tpVisible" class="modal-ol" style="display:flex;align-items:flex-start;justify-content:center;padding-top:24px" @click.self="closeTpModal">
        <div class="glass p-5 w-full max-w-sm mx-3 space-y-4 rounded-2xl max-h-[90vh] overflow-y-auto" @click.stop>
          <div class="flex justify-between items-center">
            <h3 class="font-bold text-sm" style="color:var(--gold)">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              خطة العلاج
            </h3>
            <button @click="closeTpModal" class="glass-sm w-8 h-8 flex items-center justify-center text-sm">✕</button>
          </div>
          <p class="text-[10px] opacity-50">المريض: {{ tpName }}</p>

          <!-- Stages list -->
          <div v-if="!tpStages.length" class="text-xs opacity-40 text-center py-4">لا توجد مراحل — أضف مرحلة أدناه</div>
          <div v-else class="space-y-2">
            <div v-for="(s, i) in tpStages" :key="s.id" class="tp-stage" :class="{ done: s.done }">
              <div class="tp-check" :class="{ checked: s.done }" @click="tpToggleStage(i)">{{ s.done ? '✓' : '' }}</div>
              <div class="flex-1 min-w-0">
                <p class="tp-desc text-xs font-bold">{{ s.desc }}</p>
                <p v-if="s.doneDate" class="text-[9px] opacity-40">أُنجز: {{ s.doneDate }}</p>
              </div>
              <button @click="tpRemoveStage(i)" class="text-[10px] px-1.5 py-0.5 rounded" style="color:var(--red);opacity:.6">✕</button>
            </div>
          </div>

          <!-- Add new stage -->
          <div class="flex gap-2">
            <input type="text" v-model="tpNewStage" class="inp flex-1 text-xs" placeholder="وصف المرحلة الجديدة..." @keyup.enter="tpAddStage">
            <button @click="tpAddStage" class="btn-g px-3 py-1.5 text-xs">+ إضافة</button>
          </div>

          <!-- Save/Cancel -->
          <div class="flex gap-2 pt-2 border-t border-white/10">
            <button @click="closeTpModal" class="btn-o flex-1 py-2 text-xs">إلغاء</button>
            <button @click="saveTpModal" class="btn-g flex-1 py-2 text-xs">حفظ الخطة</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="dcVisible" class="modal-ol" style="display:flex;align-items:center;justify-content:center" @click.self="dcClose">
        <div class="glass p-5 w-full max-w-sm mx-3 space-y-4 rounded-2xl" @click.stop>
          <div class="text-center">
            <div class="mx-auto mb-3" style="width:48px;height:48px;border-radius:50%;background:rgba(255,68,85,.12);display:flex;align-items:center;justify-content:center">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <p class="font-bold text-sm" style="color:var(--red)">{{ dcTitle }}</p>
            <p class="text-[11px] opacity-60 mt-2 whitespace-pre-line">{{ dcMsg }}</p>
            <p class="text-[10px] mt-2 font-bold" style="color:var(--red)">⚠ هذا الإجراء لا يمكن التراجع عنه!</p>
          </div>
          <div class="flex gap-2">
            <button @click="dcClose" class="btn-o flex-1 py-2 text-xs">إلغاء</button>
            <button @click="dcConfirm" class="btn-del flex-1 py-2 text-xs font-bold" :disabled="dcCountdown > 0">
              {{ dcCountdown > 0 ? `تأكيد (${dcCountdown})` : 'تأكيد الحذف' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- X-ray Viewer -->
    <XrayViewer
      :visible="xrayViewerVisible"
      :images="xrayViewerImages"
      :start-index="xrayViewerIndex"
      :patient-name="xrayViewerPatient"
      @close="xrayViewerVisible = false"
      @delete="onXrayDeleteFromViewer"
    />

    <!-- WhatsApp Templates Popup -->
    <WaTemplatesPopup
      :visible="waPopupVisible"
      :patient-name="waPopupName"
      :phone="waPopupPhone"
      @close="waPopupVisible = false"
    />

    <!-- Patient Print Overlay -->
    <PrintOverlay
      :visible="printVisible"
      :title="printTitle"
      :html="printHtml"
      @close="printVisible = false"
    />

    <!-- Debt Pay Popup -->
    <DebtPayPopup
      :visible="debtPayVisible"
      :debt="debtPayTarget"
      @close="debtPayVisible = false"
      @paid="onDebtPaid"
    />
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientsStore } from '@/stores/patients.store'
import { useAppStore } from '@/stores/app.store'
import { useToast } from '@/composables/useToast'
import { debounce } from '@/utils/debounce'
import { formatNumber } from '@/utils/format'
import { markMonthDirty, markDebtsDirty } from '@/services/sync.service'
import { useAuthStore } from '@/stores/auth.store'
import PatientCard from './components/PatientCard.vue'
import PrintOverlay from '@/components/PrintOverlay.vue'
import DebtPayPopup from '@/components/DebtPayPopup.vue'
import XrayViewer from '@/components/XrayViewer.vue'
import WaTemplatesPopup from '@/components/WaTemplatesPopup.vue'
import { deleteXrayImage } from '@/services/image.service'

const patientsStore = usePatientsStore()
const app = useAppStore()
const auth = useAuthStore()
const router = useRouter()
const { toast } = useToast()

const searchQuery = computed(() => patientsStore.searchQuery)
const patients = computed(() => patientsStore.filteredPatients)
const totalPatients = computed(() => patientsStore.totalPatients)
const n = formatNumber

const onSearch = debounce((e) => {
  patientsStore.setSearch(e.target.value)
}, 250)

/* ── 1. ADD VISIT — navigate to Add tab with name pre-filled ── */
function addVisitForPatient(name) {
  app.activeTab = 'add'
  router.push({ name: 'add', query: { name } })
}

/* ── 2. TOGGLE DETAIL ── */
function togglePatDetail(name) {
  patientsStore.selectPatient(name)
}

/* ── 3. OPEN PATIENT REPORT (file) — print full patient report ── */
function openPatientReport(name) {
  printPatient(name)
}

/* ── 4. TREATMENT PLAN MODAL ── */
const tpVisible = ref(false)
const tpName = ref('')
const tpStages = ref([])
const tpNewStage = ref('')

function openTpModal(name) {
  tpName.value = name
  tpStages.value = JSON.parse(JSON.stringify(
    (app.config.treatmentPlans && app.config.treatmentPlans[name]) || []
  ))
  tpNewStage.value = ''
  tpVisible.value = true
}

function closeTpModal() {
  tpVisible.value = false
}

function tpToggleStage(i) {
  tpStages.value[i].done = !tpStages.value[i].done
  tpStages.value[i].doneDate = tpStages.value[i].done
    ? new Date().toISOString().substring(0, 10) : ''
}

function tpRemoveStage(i) {
  tpStages.value.splice(i, 1)
}

function tpAddStage() {
  const v = (tpNewStage.value || '').trim()
  if (!v) { toast('أدخل وصف المرحلة'); return }
  tpStages.value.push({ id: Date.now(), desc: v, done: false, doneDate: '' })
  tpNewStage.value = ''
}

function saveTpModal() {
  if (!app.config.treatmentPlans) app.config.treatmentPlans = {}
  app.config.treatmentPlans[tpName.value] = tpStages.value
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تم حفظ خطة العلاج')
  closeTpModal()
}

/* ── 5. PRINT PATIENT FULL ── */
const printVisible = ref(false)
const printTitle = ref('')
const printHtml = ref('')

function printPatient(name) {
  const patMap = patientsStore.patientMap
  const p = patMap[name]
  if (!p) { toast('لا توجد بيانات لهذا المريض'); return }
  const patDebts = app.debts.filter(d => d.name === name)
  const totalDebtRem = patDebts.reduce((s, d) => s + (Number(d.remaining) || 0), 0)
  const clinicName = app.centerName || 'عيادة الأسنان'
  const today = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
  const cur = app.currency

  const logoHtml = app.config.logo
    ? `<img src="${app.config.logo}" style="max-height:50px;max-width:100px;object-fit:contain" onerror="this.style.display='none'">`
    : `<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#3b82f6);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 2C8.5 2 7 4.5 7 7c0 3 1.5 6 2 9 .3 2 .7 4 1 5h4c.3-1 .7-3 1-5 .5-3 2-6 2-9 0-2.5-1.5-5-5-5z"/></svg></div>`

  const serviceEntries = [...p.entries].filter(r => !r.isDebtPayment).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const paymentEntries = [...p.entries].filter(r => r.isDebtPayment).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const patPhone = patDebts.find(d => d.phone)?.phone || p.entries.find(r => r.phone)?.phone || ''

  let idx = 0
  const svcRows = serviceEntries.map(r => {
    idx++
    const isPros = r._t === 'p' || r._s === 'p'
    const amt = Number(r.amount || r.total || 0) || 0
    const rowBg = idx % 2 === 0 ? '#f8faff' : '#ffffff'
    const hasRep = r.report && (Array.isArray(r.report) ? r.report.length > 0 : (r.report.entries?.length || 0) > 0)
    const repEntries = hasRep ? (Array.isArray(r.report) ? r.report : (r.report.entries || [])) : []
    const debtCol = r.isDebt ? `<span style="color:#dc2626;font-weight:800">${n(amt)}</span>` : '—'
    let paidCol
    if (r.isDebt) {
      const dbt = isPros
        ? app.debts.find(d => d.prostheticId === r.id)
        : app.debts.find(d => d.recordId === r.id)
      const paid = Number(dbt?.paidAmount || 0) || 0
      paidCol = paid > 0 ? `<span style="color:#166534;font-weight:800">${n(paid)}</span>` : `<span style="color:#94a3b8;font-size:10px">—</span>`
    } else {
      paidCol = `<span style="color:#166534;font-weight:800">${n(amt)}</span>`
    }
    let repDetail = ''
    if (repEntries.length) {
      repDetail = `<div style="margin-top:4px;padding:4px 8px;background:#f0f5ff;border-radius:6px;font-size:9px;color:#475569">`
      repDetail += repEntries.map(e => `<span style="display:inline-block;margin:1px 3px;background:#dbeafe;border-radius:4px;padding:1px 6px;font-weight:600">${e.service}${e.teeth?.length ? ' (' + e.teeth.map(t => t.n).join(',') + ')' : ''}</span>`).join('')
      repDetail += `</div>`
    }
    return `<tr style="background:${rowBg}">
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b">${idx}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#64748b">${r.date || '—'}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a">${r.service || (isPros ? 'تركيبة' : 'علاج')}${isPros ? ' <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:inline;vertical-align:-1px"><path d="M12 2C8.5 2 7 4.5 7 7c0 3 1.5 6 2 9 .3 2 .7 4 1 5h4c.3-1 .7-3 1-5 .5-3 2-6 2-9 0-2.5-1.5-5-5-5z"/></svg>' : ''}${repDetail}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center">${paidCol}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center">${debtCol}</td>
    </tr>`
  }).join('')

  const payRows = paymentEntries.map(r => {
    idx++
    const amt = Number(r.amount || 0) || 0
    const rowBg = idx % 2 === 0 ? '#f0fdf4' : '#f7fdf9'
    return `<tr style="background:${rowBg}">
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:10px;color:#64748b">${idx}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b">${r.date || '—'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#15803d;font-weight:600">${r.service || 'دفعة دين'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:center;color:#15803d;font-weight:800">${n(amt)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:center;color:#94a3b8">—</td>
    </tr>`
  }).join('')

  printTitle.value = `ملف المريض — ${name}`
  printHtml.value = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.pat-page{font-family:'Cairo',Arial,sans-serif;color:#0f172a;font-size:13px;direction:rtl;background:#f1f5f9;padding:16px}
.pat-pg{background:#fff;max-width:780px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12)}
.pat-accent{height:7px;background:linear-gradient(90deg,#1d4ed8 0%,#3b82f6 50%,#60a5fa 100%)}
.pat-hdr{display:flex;justify-content:space-between;align-items:center;padding:18px 24px 14px;border-bottom:1.5px solid #e2e8f0}
.pat-hdr-l{display:flex;align-items:center;gap:12px}
.pat-clinic{font-size:20px;font-weight:900;color:#1d4ed8;line-height:1.1}
.pat-clinic-sub{font-size:10px;color:#64748b;margin-top:3px;font-weight:500}
.pat-hdr-r{text-align:left;background:#f0f5ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 14px}
.pat-hdr-r .lbl{font-size:8px;color:#94a3b8;font-weight:600;letter-spacing:.4px}
.pat-hdr-r .val{font-size:11px;font-weight:700;color:#1e3a8a;margin-top:1px}
.pat-sec{display:flex;align-items:center;gap:8px;background:#1d4ed8;color:#fff;padding:7px 16px;font-size:11px;font-weight:700}
.pat-sec .dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5)}
.pat-info{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#e2e8f0}
.pat-info-cell{background:#fff;padding:10px 14px}
.pat-info-cell .lbl{font-size:8px;color:#94a3b8;font-weight:700;margin-bottom:2px}
.pat-info-cell .v{font-size:12px;font-weight:700;color:#0f172a;border-bottom:1.5px solid #cbd5e1;min-height:20px;padding-bottom:2px}
table{width:100%;border-collapse:collapse}
thead tr{background:linear-gradient(90deg,#1e3a8a,#1d4ed8);color:#fff}
thead th{padding:9px 10px;font-weight:700;font-size:10.5px}
.pat-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px 20px;background:#f8faff;border-top:2px solid #1d4ed8}
.pat-sum-card{background:#fff;border-radius:8px;padding:10px 8px;text-align:center;border:1px solid #e2e8f0}
.pat-sum-card .lbl{font-size:8px;color:#94a3b8;font-weight:600;margin-bottom:3px}
.pat-sum-card .val{font-size:18px;font-weight:900}
.pat-debt-footer{background:#fef2f2;border-top:2px solid #dc2626;padding:12px 20px;display:flex;justify-content:space-between;align-items:center}
.pat-sig{display:flex;justify-content:space-around;padding:16px 24px;border-top:1px solid #e2e8f0;background:#fafbff}
.pat-sig-box{text-align:center;flex:1;padding:0 8px}
.pat-sig-line{border-bottom:1.5px solid #94a3b8;margin:0 8px 4px;height:24px}
.pat-sig-lbl{font-size:9px;color:#64748b;font-weight:600}
.pat-ftr{background:#1e3a8a;color:rgba(255,255,255,.7);font-size:9px;padding:7px 20px;display:flex;justify-content:space-between}
.pat-ftr strong{color:#fff}
</style>
<div class="pat-page"><div class="pat-pg">
  <div class="pat-accent"></div>
  <div class="pat-hdr">
    <div class="pat-hdr-l">
      ${logoHtml}
      <div><div class="pat-clinic">${clinicName}</div><div class="pat-clinic-sub">سجل مريض شامل — ملف طبي ومالي</div></div>
    </div>
    <div class="pat-hdr-r">
      <div class="lbl">تاريخ التقرير</div><div class="val">${today}</div>
      <div class="lbl" style="margin-top:6px">عدد الزيارات</div><div class="val" style="color:#059669">${p.visitCount} زيارة</div>
    </div>
  </div>
  <div class="pat-sec"><div class="dot"></div>بيانات المريض</div>
  <div class="pat-info">
    <div class="pat-info-cell" style="grid-column:span 2"><div class="lbl">الاسم الكامل</div><div class="v">${name}</div></div>
    <div class="pat-info-cell"><div class="lbl">رقم الجوال</div><div class="v">${patPhone || '—'}</div></div>
  </div>
  <div class="pat-sec" style="margin-top:1px"><div class="dot"></div>سجل الخدمات والمدفوعات</div>
  <table>
    <thead><tr>
      <th style="width:36px;text-align:center">#</th>
      <th style="width:90px">التاريخ</th>
      <th>الخدمة / الإجراء</th>
      <th style="width:90px;text-align:center">المدفوع ${cur}</th>
      <th style="width:90px;text-align:center">الدين ${cur}</th>
    </tr></thead>
    <tbody>${svcRows}${payRows}</tbody>
  </table>
  <div class="pat-summary">
    <div class="pat-sum-card"><div class="lbl">تكلفة الخدمات</div><div class="val" style="color:#b8860b">${n(p.grossTotal)}</div><div style="font-size:8px;color:#94a3b8">${cur}</div></div>
    <div class="pat-sum-card"><div class="lbl">المدفوع فعلياً</div><div class="val" style="color:#166534">${n(p.total)}</div><div style="font-size:8px;color:#94a3b8">${cur}</div></div>
    <div class="pat-sum-card"><div class="lbl">الرصيد المتبقي</div><div class="val" style="color:${totalDebtRem > 0 ? '#dc2626' : '#166534'}">${totalDebtRem > 0 ? n(totalDebtRem) : '0'}</div><div style="font-size:8px;color:#94a3b8">${cur}</div></div>
  </div>
  ${totalDebtRem > 0 ? `<div class="pat-debt-footer">
    <span style="font-size:11px;font-weight:700;color:#dc2626">رصيد دين مستحق على المريض</span>
    <span style="font-size:16px;font-weight:900;color:#dc2626">${n(totalDebtRem)} ${cur}</span>
  </div>` : ''}
  <div class="pat-sig">
    <div class="pat-sig-box"><div class="pat-sig-line"></div><div class="pat-sig-lbl">توقيع الطبيب</div></div>
    <div class="pat-sig-box"><div class="pat-sig-line"></div><div class="pat-sig-lbl">توقيع المريض</div></div>
    <div class="pat-sig-box"><div class="pat-sig-line"></div><div class="pat-sig-lbl">ختم المركز</div></div>
  </div>
  <div class="pat-ftr"><span>تم إصدار هذا التقرير بواسطة <strong>نظام إدارة العيادة الرقمي</strong></span><span>${today}</span></div>
</div></div>`
  printVisible.value = true
}

/* ── 6. EDIT PATIENT NAME ── */
function editPatientName(oldName) {
  const newName = prompt('تعديل اسم المريض:\n(سيتم تحديث الاسم في جميع السجلات والديون)', oldName)
  if (!newName || !newName.trim() || newName.trim() === oldName) return
  const trimmed = newName.trim()

  app.records.forEach(r => { if (r.name === oldName) { r.name = trimmed; r._mod = Date.now() } })
  app.prosthetics.forEach(p => { if (p.name === oldName) { p.name = trimmed; p._mod = Date.now() } })
  app.debts.forEach(d => { if (d.name === oldName) { d.name = trimmed; d._mod = Date.now() } })

  if (app.config.treatmentPlans && app.config.treatmentPlans[oldName]) {
    app.config.treatmentPlans[trimmed] = app.config.treatmentPlans[oldName]
    delete app.config.treatmentPlans[oldName]
  }

  markDebtsDirty()
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تم تحديث اسم المريض إلى: ' + trimmed)
}

/* ── 7. DELETE PATIENT — with double-confirmation ── */
const dcVisible = ref(false)
const dcTitle = ref('')
const dcMsg = ref('')
const dcCountdown = ref(0)
let dcTimer = null
let dcCallback = null

function dblConfirm(title, msg, callback, dcType) {
  const dc = app.config.dcConfirm || {}
  const typeCfg = dcType && dc[dcType + 'On'] !== undefined
    ? { enabled: dc[dcType + 'On'] !== false, duration: dc[dcType + 'Dur'] || 3 }
    : { enabled: true, duration: 3 }

  if (!typeCfg.enabled) { callback(); return }

  dcTitle.value = title
  dcMsg.value = msg
  dcCallback = callback
  dcCountdown.value = Math.max(0, typeCfg.duration || 3)
  dcVisible.value = true

  if (dcCountdown.value > 0) {
    dcTimer = setInterval(() => {
      dcCountdown.value--
      if (dcCountdown.value <= 0) clearInterval(dcTimer)
    }, 1000)
  }
}

function dcClose() {
  dcVisible.value = false
  clearInterval(dcTimer)
  dcCallback = null
}

function dcConfirm() {
  if (dcCountdown.value > 0) return
  dcVisible.value = false
  clearInterval(dcTimer)
  if (dcCallback) dcCallback()
  dcCallback = null
}

onUnmounted(() => { clearInterval(dcTimer) })

function deletePatient(name) {
  const patRecs = app.records.filter(r => r.name === name)
  const patPros = app.prosthetics.filter(p => p.name === name)
  const patDebts = app.debts.filter(d => d.name === name)
  const totalEntries = patRecs.length + patPros.length
  const msg = `سيتم حذف:\n• ${patRecs.length} سجل علاج\n• ${patPros.length} سجل تركيبات\n• ${patDebts.length} سجل ديون\nإجمالي السجلات: ${totalEntries}`

  dblConfirm('حذف جميع بيانات المريض "' + name + '"؟', msg, () => {
    patRecs.forEach(r => markMonthDirty(r.date))
    patPros.forEach(p => markMonthDirty(p.date))
    app.records = app.records.filter(r => r.name !== name)
    app.prosthetics = app.prosthetics.filter(p => p.name !== name)
    app.debts = app.debts.filter(d => d.name !== name)
    if (app.config.treatmentPlans && app.config.treatmentPlans[name]) delete app.config.treatmentPlans[name]
    markDebtsDirty()
    app.saveToCache(auth.uid)
    app.syncSave(auth.uid, false)
    toast('تم حذف جميع بيانات المريض: ' + name)
  }, 'pat')
}

/* ── 8. SETTLE DEBT — open first active debt for payment ── */
const debtPayVisible = ref(false)
const debtPayTarget = ref(null)

function settleDebt(name) {
  const activeDebts = app.debts.filter(d => d.name === name && d.status !== 'paid')
  if (!activeDebts.length) { toast('لا توجد ديون نشطة لهذا المريض'); return }
  debtPayTarget.value = activeDebts[0]
  debtPayVisible.value = true
}

function onDebtPaid() {
  debtPayVisible.value = false
  debtPayTarget.value = null
}

/* ── 9. X-RAY MANAGEMENT ── */
const xrayViewerVisible = ref(false)
const xrayViewerImages = ref([])
const xrayViewerIndex = ref(0)
const xrayViewerPatient = ref('')

function onXrayUpload(name, imgData) {
  if (!app.config.patientXrays) app.config.patientXrays = {}
  if (!app.config.patientXrays[name]) app.config.patientXrays[name] = []
  app.config.patientXrays[name].push(imgData)
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
}

async function onXrayDelete(name, idx) {
  if (!app.config.patientXrays || !app.config.patientXrays[name]) return
  if (!confirm('حذف صورة الأشعة؟')) return
  const img = app.config.patientXrays[name][idx]
  if (img && img.key) {
    try { await deleteXrayImage(img.key) } catch (e) { console.error('[R2] delete:', e) }
  }
  app.config.patientXrays[name].splice(idx, 1)
  if (!app.config.patientXrays[name].length) delete app.config.patientXrays[name]
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تم حذف صورة الأشعة')
}

function openXrayViewer(name, idx) {
  const imgs = (app.config.patientXrays && app.config.patientXrays[name]) || []
  if (!imgs.length) return
  xrayViewerPatient.value = name
  xrayViewerImages.value = imgs
  xrayViewerIndex.value = idx
  xrayViewerVisible.value = true
}

async function onXrayDeleteFromViewer(idx) {
  const name = xrayViewerPatient.value
  if (!app.config.patientXrays || !app.config.patientXrays[name]) return
  const img = app.config.patientXrays[name][idx]
  if (img && img.key) {
    try { await deleteXrayImage(img.key) } catch (e) { console.error('[R2] delete:', e) }
  }
  app.config.patientXrays[name].splice(idx, 1)
  if (!app.config.patientXrays[name].length) {
    delete app.config.patientXrays[name]
    xrayViewerVisible.value = false
  }
  xrayViewerImages.value = (app.config.patientXrays && app.config.patientXrays[name]) || []
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تم حذف صورة الأشعة')
}

/* ── 10. WHATSAPP TEMPLATES POPUP ── */
const waPopupVisible = ref(false)
const waPopupName = ref('')
const waPopupPhone = ref('')

function openWaTemplates(name, phone) {
  waPopupName.value = name
  waPopupPhone.value = phone
  waPopupVisible.value = true
}
</script>
