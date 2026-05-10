import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cacheGetAll, cacheSaveAll } from '@/services/cache.service'
import { saveToSupabase, loadFromSupabase, markMonthDirty, markDebtsDirty, markApptsDirty } from '@/services/sync.service'
import { getCurrentMonth, getMonthFromDate } from '@/utils/format'

const DEFAULT_CONFIG = {
  centerName: 'طب الأسنان الرقمي',
  clinics: ['عيادة 1', 'عيادة 2'],
  services: ['حشو عصب', 'خلع', 'تنظيف', 'تقويم', 'حشو', 'تركيبات'],
  payments: ['كاش', 'تحويل'],
  currency: 'د.ل',
  doctorPct: 50,
  syncMin: 30,
  autoSync: true,
  servicePrices: {},
  waTemplates: [
    { lbl: 'تذكير بموعد', msg: 'السلام عليكم {name}\nنذكركم بموعدكم في {center}.\nنرجو التأكيد أو التواصل معنا 🦷' },
    { lbl: 'تذكير بدين', msg: 'السلام عليكم {name}\nنود تذكيركم بوجود مبلغ مستحق في {center}.\nنشكر تعاونكم 🙏' },
    { lbl: 'متابعة العلاج', msg: 'السلام عليكم {name}\nنتمنى أن تكونوا بصحة وعافية.\nكيف حال الأسنان بعد آخر زيارة؟ 😊' },
    { lbl: 'عرض خاص', msg: 'السلام عليكم {name}\nيسعدنا إعلامكم عن عرض خاص في {center}.\nتواصلوا معنا لمزيد من التفاصيل ✨' },
  ],
  treatmentPlans: {},
  logo: '',
  apptNotif: true,
  followUpAuto: false,
  dcConfirm: { recOn: true, recDur: 3, debtOn: true, debtDur: 3, patOn: true, patDur: 3, apptOn: true, apptDur: 3 },
}

export const useAppStore = defineStore('app', () => {
  const records = ref([])
  const prosthetics = ref([])
  const debts = ref([])
  const appointments = ref([])
  const config = ref({ ...DEFAULT_CONFIG })
  const activeTab = ref('add')
  const selectedMonth = ref(getCurrentMonth())
  const syncing = ref(false)
  const syncMessage = ref('')
  const syncProgress = ref(0)

  const currency = computed(() => config.value.currency || 'د.ل')
  const centerName = computed(() => config.value.centerName || 'طب الأسنان الرقمي')
  const clinics = computed(() => config.value.clinics || [])
  const services = computed(() => config.value.services || [])
  const payments = computed(() => config.value.payments || [])

  function loadFromCache(uid) {
    const cached = cacheGetAll(uid)
    if (cached.records?.length) records.value = cached.records
    if (cached.prosthetics?.length) prosthetics.value = cached.prosthetics
    if (cached.debts?.length) debts.value = cached.debts
    if (cached.appointments?.length) appointments.value = cached.appointments
    if (cached.config) config.value = { ...DEFAULT_CONFIG, ...cached.config }
  }

  function saveToCache(uid) {
    cacheSaveAll(uid, {
      records: records.value,
      prosthetics: prosthetics.value,
      debts: debts.value,
      config: config.value,
      appointments: appointments.value,
    })
  }

  async function syncSave(uid, showOl = false) {
    syncing.value = true
    syncMessage.value = 'جار المزامنة...'
    syncProgress.value = 0
    try {
      const ok = await saveToSupabase(uid, {
        records: records.value,
        prosthetics: prosthetics.value,
        debts: debts.value,
        config: config.value,
        appointments: appointments.value,
      }, showOl)
      syncProgress.value = 100
      return ok
    } finally {
      syncing.value = false
    }
  }

  async function syncLoad(uid) {
    syncing.value = true
    syncMessage.value = 'جار تحميل البيانات...'
    syncProgress.value = 0
    try {
      const data = await loadFromSupabase(uid)
      if (data.records?.length) records.value = data.records
      if (data.prosthetics?.length) prosthetics.value = data.prosthetics
      if (data.debts?.length) debts.value = data.debts
      if (data.appointments?.length) appointments.value = data.appointments
      if (data.config) config.value = { ...DEFAULT_CONFIG, ...data.config }
      syncProgress.value = 100
    } finally {
      syncing.value = false
    }
  }

  function addRecord(record) {
    record._mod = Date.now()
    records.value.push(record)
    markMonthDirty(record.date)
  }

  function updateRecord(id, updates) {
    const idx = records.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      records.value[idx] = { ...records.value[idx], ...updates, _mod: Date.now() }
      markMonthDirty(records.value[idx].date)
    }
  }

  function deleteRecord(id) {
    const idx = records.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      markMonthDirty(records.value[idx].date)
      records.value.splice(idx, 1)
    }
  }

  function addDebt(debt) {
    debts.value.push(debt)
    markDebtsDirty()
  }

  function updateDebt(id, updates) {
    const idx = debts.value.findIndex(d => d.id === id)
    if (idx !== -1) {
      debts.value[idx] = { ...debts.value[idx], ...updates }
      markDebtsDirty()
    }
  }

  function addAppointment(appt) {
    appointments.value.push(appt)
    markApptsDirty()
  }

  function removeAppointment(id) {
    appointments.value = appointments.value.filter(a => a.id !== id)
    markApptsDirty()
  }

  function updateConfig(updates) {
    config.value = { ...config.value, ...updates }
  }

  function resetState() {
    records.value = []
    prosthetics.value = []
    debts.value = []
    appointments.value = []
    config.value = { ...DEFAULT_CONFIG }
    activeTab.value = 'add'
    selectedMonth.value = getCurrentMonth()
  }

  return {
    records,
    prosthetics,
    debts,
    appointments,
    config,
    activeTab,
    selectedMonth,
    syncing,
    syncMessage,
    syncProgress,
    currency,
    centerName,
    clinics,
    services,
    payments,
    loadFromCache,
    saveToCache,
    syncSave,
    syncLoad,
    addRecord,
    updateRecord,
    deleteRecord,
    addDebt,
    updateDebt,
    addAppointment,
    removeAppointment,
    updateConfig,
    resetState,
  }
})
