<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-ol" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto" @click.self="$emit('close')">
      <div class="max-w-lg mx-auto px-4 pb-20 space-y-4 w-full" @click.stop>
        <div class="flex justify-between items-center py-4 sticky top-0 z-10 backdrop-blur-xl border-b border-white/5 mb-2" style="background:rgba(4,9,24,.97)">
          <h2 class="font-black text-base" style="color:var(--gold)">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            الإعدادات
          </h2>
          <button @click="$emit('close')" class="glass-sm w-11 h-11 flex items-center justify-center text-sm">✕</button>
        </div>

        <!-- GROUP 1: Center Info -->
        <div class="set-group">
          <div class="set-group-head" @click="toggle('center')">
            <div class="sg-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1"/><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/></svg>
              معلومات المركز
            </div>
            <span class="sg-arr" :class="{ 'sg-open': openGroups.has('center') }">▼</span>
          </div>
          <div class="set-group-body" :class="openGroups.has('center') ? 'sg-show' : ''">
            <div class="set-group-body-inner">
              <div class="glass p-4 space-y-3">
                <span class="sec-h">اسم المركز</span>
                <div class="flex gap-2"><input type="text" v-model="localCfg.centerName" class="inp flex-1 text-sm" placeholder="طب الأسنان الرقمي"><button @click="saveSetting('centerName')" class="btn-g px-4 py-2 text-xs">حفظ</button></div>
              </div>
              <div class="glass p-4 space-y-3">
                <span class="sec-h">عملة الدفع</span>
                <div class="flex gap-2"><input type="text" v-model="localCfg.currency" class="inp flex-1 text-sm" placeholder="د.ل"><button @click="saveSetting('currency')" class="btn-g px-4 py-2 text-xs">حفظ</button></div>
              </div>
              <div class="glass p-4 space-y-3">
                <span class="sec-h">نسبة الطبيب في التركيبات</span>
                <div class="flex gap-2 items-center"><input type="number" v-model.number="localCfg.doctorPct" class="inp flex-1 text-sm" min="0" max="100"><span class="opacity-50">%</span><button @click="saveSetting('doctorPct')" class="btn-g px-4 py-2 text-xs">حفظ</button></div>
              </div>
            </div>
          </div>
        </div>

        <!-- GROUP 2: Clinics & Services -->
        <div class="set-group">
          <div class="set-group-head" @click="toggle('clinic')">
            <div class="sg-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.5 2 7 4.5 7 7c0 3 1.5 6 2 9 .3 2 .7 4 1 5h4c.3-1 .7-3 1-5 .5-3 2-6 2-9 0-2.5-1.5-5-5-5z"/></svg>
              العيادات والمعالجات
            </div>
            <span class="sg-arr" :class="{ 'sg-open': openGroups.has('clinic') }">▼</span>
          </div>
          <div class="set-group-body" :class="openGroups.has('clinic') ? 'sg-show' : ''">
            <div class="set-group-body-inner">
              <!-- Clinics -->
              <div class="glass p-4 space-y-3">
                <span class="sec-h">العيادات</span>
                <div class="space-y-1">
                  <div v-for="(cli, i) in localCfg.clinics" :key="i" class="flex items-center justify-between gap-2 p-2 rounded-lg" style="background:rgba(255,255,255,.04)">
                    <span class="text-xs">{{ cli }}</span>
                    <button @click="removeItem('clinics', i)" class="text-red-400 text-xs px-2">✕</button>
                  </div>
                </div>
                <div class="flex gap-2 mt-2"><input type="text" v-model="newClinic" class="inp flex-1 text-sm" placeholder="اسم عيادة جديدة"><button @click="addItem('clinics', newClinic); newClinic = ''" class="btn-g px-3 py-2 text-xs">+ إضافة</button></div>
              </div>
              <!-- Services -->
              <div class="glass p-4 space-y-3">
                <span class="sec-h">المعالجات</span>
                <div class="space-y-1">
                  <div v-for="(svc, i) in localCfg.services" :key="i" class="flex items-center justify-between gap-2 p-2 rounded-lg" style="background:rgba(255,255,255,.04)">
                    <span class="text-xs">{{ svc }}</span>
                    <div class="flex items-center gap-1">
                      <input type="number" :value="localCfg.servicePrices?.[svc] || ''" @change="setSvcPrice(svc, $event.target.value)" class="inp text-xs" style="width:70px;padding:3px 6px" placeholder="السعر" min="0">
                      <button @click="removeItem('services', i)" class="text-red-400 text-xs px-2">✕</button>
                    </div>
                  </div>
                </div>
                <div class="flex gap-2 mt-2"><input type="text" v-model="newService" class="inp flex-1 text-sm" placeholder="اسم معالجة جديدة"><button @click="addItem('services', newService); newService = ''" class="btn-g px-3 py-2 text-xs">+ إضافة</button></div>
              </div>
              <!-- Payments -->
              <div class="glass p-4 space-y-3">
                <span class="sec-h">طرق الدفع</span>
                <div class="space-y-1">
                  <div v-for="(pay, i) in localCfg.payments" :key="i" class="flex items-center justify-between gap-2 p-2 rounded-lg" style="background:rgba(255,255,255,.04)">
                    <span class="text-xs">{{ pay }}</span>
                    <button @click="removeItem('payments', i)" class="text-red-400 text-xs px-2">✕</button>
                  </div>
                </div>
                <div class="flex gap-2 mt-2"><input type="text" v-model="newPayment" class="inp flex-1 text-sm" placeholder="طريقة دفع جديدة"><button @click="addItem('payments', newPayment); newPayment = ''" class="btn-g px-3 py-2 text-xs">+ إضافة</button></div>
              </div>
            </div>
          </div>
        </div>

        <!-- GROUP 3: Appearance -->
        <div class="set-group">
          <div class="set-group-head" @click="toggle('theme')">
            <div class="sg-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              المظهر والعرض
            </div>
            <span class="sg-arr" :class="{ 'sg-open': openGroups.has('theme') }">▼</span>
          </div>
          <div class="set-group-body" :class="openGroups.has('theme') ? 'sg-show' : ''">
            <div class="set-group-body-inner">
              <div class="glass p-4 space-y-3">
                <span class="sec-h">حجم الخط</span>
                <div class="grid grid-cols-4 gap-2">
                  <button v-for="fs in fontSizes" :key="fs.key" @click="setFontSize(fs.key)" class="btn-o py-2.5 text-xs font-bold" :class="{ 'qs-on': currentFontSize === fs.key }">{{ fs.label }}</button>
                </div>
              </div>
              <div class="glass p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div><p class="text-xs font-bold">الوضع الفاتح</p><p class="text-[10px] opacity-40">Light Mode</p></div>
                  <label class="tgl"><input type="checkbox" v-model="isLight" @change="toggleTheme"><span class="tgl-s"></span></label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GROUP 4: Sync & Backup -->
        <div class="set-group">
          <div class="set-group-head" @click="toggle('storage')">
            <div class="sg-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>
              التخزين والنسخ الاحتياطي
            </div>
            <span class="sg-arr" :class="{ 'sg-open': openGroups.has('storage') }">▼</span>
          </div>
          <div class="set-group-body" :class="openGroups.has('storage') ? 'sg-show' : ''">
            <div class="set-group-body-inner">
              <div class="glass p-4 space-y-3">
                <span class="sec-h">المزامنة</span>
                <div class="flex items-center justify-between"><span class="text-xs opacity-60">مزامنة تلقائية</span><label class="tgl"><input type="checkbox" v-model="localCfg.autoSync" @change="saveSetting('autoSync')"><span class="tgl-s"></span></label></div>
                <div class="flex gap-2 items-center"><span class="text-xs opacity-50 whitespace-nowrap">كل:</span><input type="number" v-model.number="localCfg.syncMin" class="inp flex-1 text-sm" min="5" placeholder="30"><span class="text-xs opacity-40">دقيقة</span><button @click="saveSetting('syncMin')" class="btn-g px-3 py-2 text-xs">حفظ</button></div>
              </div>
              <div class="glass p-4 space-y-3">
                <span class="sec-h">النسخ الاحتياطي</span>
                <button @click="exportJSON" class="btn-o w-full py-2 text-xs flex items-center justify-center gap-1.5">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>
                  نسخة محلية JSON
                </button>
                <label class="btn-o w-full py-2 text-xs text-center cursor-pointer flex items-center justify-center gap-1.5">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><polyline points="12 11 12 17"/><polyline points="9 14 12 11 15 14"/></svg>
                  استعادة JSON
                  <input type="file" accept=".json" class="hidden" @change="importJSON">
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Logout -->
        <div class="glass p-4">
          <button @click="doLogout" class="w-full py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2" style="background:rgba(255,68,85,.1);border:1px solid rgba(255,68,85,.25);color:#ff4455">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            تسجيل الخروج
          </button>
        </div>

        <!-- Support -->
        <div class="glass p-4 space-y-2 text-center">
          <p class="text-[10px] opacity-35 mb-2">الدعم الفني</p>
          <a href="https://wa.me/218919292258" target="_blank" rel="noopener"
             class="flex items-center justify-center gap-2.5 w-full py-3 text-sm font-bold rounded-xl"
             style="background:rgba(37,211,102,.1);border:1px solid rgba(37,211,102,.28);color:#25d366;text-decoration:none">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.523 5.845L.057 23.492a.5.5 0 00.613.593l5.797-1.522A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.504-5.23-1.385l-.374-.217-3.881 1.018 1.035-3.783-.233-.378A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            تواصل مع المطور — 0919292258
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'

defineProps({ visible: { type: Boolean, default: false } })
defineEmits(['close'])

const router = useRouter()
const app = useAppStore()
const auth = useAuthStore()
const { toast } = useToast()
const { toggleTheme: doToggleTheme, initTheme } = useTheme()

const openGroups = ref(new Set(['center']))
const newClinic = ref('')
const newService = ref('')
const newPayment = ref('')

const fontSizes = [
  { key: 'fs-small', label: 'صغير' },
  { key: 'fs-medium', label: 'عادي' },
  { key: 'fs-large', label: 'كبير' },
  { key: 'fs-xlarge', label: 'أكبر' },
]
const currentFontSize = ref(localStorage.getItem('dental_font_size') || 'fs-medium')
const isLight = ref(document.body.classList.contains('light'))

const localCfg = reactive({
  centerName: '',
  currency: '',
  doctorPct: 50,
  clinics: [],
  services: [],
  payments: [],
  servicePrices: {},
  autoSync: true,
  syncMin: 30,
})

watch(() => app.config, (cfg) => {
  localCfg.centerName = cfg.centerName || ''
  localCfg.currency = cfg.currency || 'د.ل'
  localCfg.doctorPct = cfg.doctorPct || 50
  localCfg.clinics = [...(cfg.clinics || [])]
  localCfg.services = [...(cfg.services || [])]
  localCfg.payments = [...(cfg.payments || [])]
  localCfg.servicePrices = { ...(cfg.servicePrices || {}) }
  localCfg.autoSync = cfg.autoSync !== false
  localCfg.syncMin = cfg.syncMin || 30
}, { immediate: true, deep: true })

function toggle(key) {
  if (openGroups.value.has(key)) openGroups.value.delete(key)
  else openGroups.value.add(key)
  openGroups.value = new Set(openGroups.value)
}

function saveSetting(key) {
  const updates = {}
  updates[key] = localCfg[key]
  app.updateConfig(updates)
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تم الحفظ')
}

function addItem(key, val) {
  if (!val?.trim()) return
  localCfg[key].push(val.trim())
  app.updateConfig({ [key]: [...localCfg[key]] })
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تمت الإضافة')
}

function removeItem(key, idx) {
  localCfg[key].splice(idx, 1)
  app.updateConfig({ [key]: [...localCfg[key]] })
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تم الحذف')
}

function setSvcPrice(svc, val) {
  const prices = { ...localCfg.servicePrices }
  if (val && Number(val) > 0) prices[svc] = Number(val)
  else delete prices[svc]
  localCfg.servicePrices = prices
  app.updateConfig({ servicePrices: prices })
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
}

function setFontSize(key) {
  currentFontSize.value = key
  document.body.classList.remove('fs-small', 'fs-medium', 'fs-large', 'fs-xlarge')
  document.body.classList.add(key)
  localStorage.setItem('dental_font_size', key)
}

function toggleTheme() {
  doToggleTheme()
  isLight.value = document.body.classList.contains('light')
}

function exportJSON() {
  const data = {
    records: app.records,
    prosthetics: app.prosthetics,
    debts: app.debts,
    appointments: app.appointments,
    config: app.config,
    exportDate: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dental_backup_${new Date().toISOString().substring(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast('تم تصدير النسخة الاحتياطية')
}

function importJSON(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      if (!confirm('استعادة النسخة الاحتياطية ستستبدل جميع البيانات الحالية.\n\nمتأكد؟')) return
      if (data.records) app.records = data.records
      if (data.prosthetics) app.prosthetics = data.prosthetics
      if (data.debts) app.debts = data.debts
      if (data.appointments) app.appointments = data.appointments
      if (data.config) app.updateConfig(data.config)
      app.saveToCache(auth.uid)
      app.syncSave(auth.uid, false)
      toast('تمت الاستعادة بنجاح')
    } catch {
      toast('خطأ في قراءة الملف')
    }
  }
  reader.readAsText(file)
}

async function doLogout() {
  if (!confirm('تسجيل الخروج؟')) return
  await auth.logout()
  router.push({ name: 'login' })
}
</script>
