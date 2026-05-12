<template>
  <div class="space-y-4">
    <!-- Search -->
    <div class="mb-2 relative">
      <input type="text" v-model="searchQuery" class="inp" placeholder=" بحث في الديون بالاسم..." autocomplete="off">
    </div>

    <!-- Filter Buttons -->
    <div class="rec-filter-bar mb-2">
      <button class="rec-filter-btn" :class="{ 'rf-on': debtFilter === 'active' }" @click="debtFilter = 'active'">نشطة ({{ activeCount }})</button>
      <button class="rec-filter-btn" :class="{ 'rf-on': debtFilter === 'paid' }" @click="debtFilter = 'paid'">مسددة ({{ paidCount }})</button>
      <button class="rec-filter-btn" :class="{ 'rf-on': debtFilter === 'all' }" @click="debtFilter = 'all'">الكل</button>
    </div>

    <!-- Empty -->
    <SkeletonLoader v-if="app.syncing" :count="3" variant="card" />
    <div v-else-if="!filteredDebts.length" class="text-center py-16 opacity-25">
      <svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto;display:block;color:var(--gold)"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8"/></svg>
      <p class="text-sm font-bold mt-3">لا توجد ديون</p>
    </div>

    <!-- Debt Cards -->
    <VirtualScroll
      v-if="filteredDebts.length"
      :items="filteredDebts"
      :itemHeight="180"
      :containerHeight="vsContainerHeight"
      :buffer="3"
    >
      <template #default="{ item }">
        <DebtCard :key="item.id" :debt="item" :currency="cur" :doctor-pct="doctorPct"
          @pay="openInstModal" @edit="openEditModal" @delete="delDebt" @view-payments="openPayPopup" @go-patient="goPatient" />
      </template>
    </VirtualScroll>

    <!-- Installment Modal -->
    <Teleport to="body">
      <div v-if="showInstModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" style="background:rgba(0,0,0,.75);backdrop-filter:blur(8px)" @click.self="closeInstModal">
        <div class="glass p-5 w-full max-w-sm space-y-4 rounded-2xl">
          <h3 class="font-bold text-sm" style="color:var(--gold)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8"/></svg>
            تسجيل دفعة
          </h3>
          <div class="space-y-1.5">
            <div class="flex justify-between"><span class="opacity-50 text-xs">المتبقي:</span><span class="n font-black text-red-400">{{ n(instDebt?.remaining || 0) }} {{ cur }}</span></div>
            <template v-if="instDebt?.type === 'prosthetic' && instLabRem > 0">
              <div class="flex justify-between"><span class="opacity-50 text-xs">المعمل المتبقي:</span><span class="n text-orange-400">{{ n(instLabRem) }} {{ cur }}</span></div>
              <p class="text-[9px] text-orange-300 border-t border-white/10 pt-1.5">⚠ تُخصم أولاً من المعمل ثم الربح</p>
            </template>
          </div>
          <input type="number" v-model.number="instAmt" class="inp" placeholder="قيمة الدفعة" min="0" @input="previewInst">
          <input type="date" v-model="instDate" class="inp text-xs">
          <select v-model="instPay" class="inp text-xs">
            <option v-for="p in payments" :key="p">{{ p }}</option>
          </select>
          <!-- Preview -->
          <div v-if="instPreview" class="glass-sm p-3 space-y-1.5 rounded-xl">
            <p class="opacity-50 font-bold text-xs mb-1">معاينة:</p>
            <template v-if="instDebt?.type === 'prosthetic'">
              <div v-if="instPreview.toLab > 0" class="flex justify-between"><span class="opacity-50 text-xs">للمعمل:</span><span class="n text-orange-400">{{ n(instPreview.toLab) }} {{ cur }}</span></div>
              <template v-if="instPreview.toProfit > 0">
                <div class="flex justify-between"><span class="opacity-50 text-xs">ربح الطبيب ({{ doctorPct }}%):</span><span class="n text-green-400">{{ n(instPreview.docShare) }} {{ cur }}</span></div>
                <div class="flex justify-between"><span class="opacity-50 text-xs">ربح العيادة ({{ 100 - doctorPct }}%):</span><span class="n text-blue-400">{{ n(instPreview.clinShare) }} {{ cur }}</span></div>
              </template>
              <p v-else class="text-orange-300 text-xs">كل الدفعة للمعمل فقط</p>
            </template>
            <template v-else>
              <div class="flex justify-between"><span class="opacity-50 text-xs">قيمة الدفعة:</span><span class="n text-green-400">{{ n(instAmt) }} {{ cur }}</span></div>
            </template>
          </div>
          <div class="flex gap-2">
            <button @click="confirmInst" class="btn-g flex-1 py-3 text-xs font-bold">تأكيد الدفعة</button>
            <button @click="closeInstModal" class="btn-o px-4 py-3 text-xs">إلغاء</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Debt Modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" style="background:rgba(0,0,0,.75);backdrop-filter:blur(8px)" @click.self="closeEditModal">
        <div class="glass p-5 w-full max-w-sm space-y-4 rounded-2xl">
          <h3 class="font-bold text-sm" style="color:var(--gold)">تعديل بيانات الدين</h3>
          <input type="text" v-model="editName" class="inp" placeholder="اسم المريض">
          <div>
            <label class="text-[10px] opacity-45 mb-1 block">المبلغ الإجمالي ({{ cur }})</label>
            <input type="number" v-model.number="editTotal" class="inp" placeholder="المبلغ الإجمالي" min="0">
            <p v-if="editTotalChanged" class="text-[9px] text-orange-300 mt-1">⚠ سيتم إعادة حساب المتبقي تلقائياً</p>
          </div>
          <input type="tel" v-model="editPhone" class="inp" placeholder="رقم الهاتف">
          <textarea v-model="editNotes" class="inp h-16 resize-none text-xs" placeholder="ملاحظات"></textarea>
          <div class="flex gap-2">
            <button @click="confirmEditDebt" class="btn-g flex-1 py-3 text-xs font-bold">حفظ</button>
            <button @click="closeEditModal" class="btn-o px-4 py-3 text-xs">إلغاء</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Payment History Popup -->
    <Teleport to="body">
      <div v-if="showPayPopup" class="fixed inset-0 z-[999] flex items-center justify-center p-4" style="background:rgba(0,0,0,.75);backdrop-filter:blur(8px)" @click.self="closePayPopup">
        <div class="glass p-5 w-full max-w-sm space-y-4 rounded-2xl max-h-[80vh] overflow-y-auto">
          <h3 class="font-bold text-sm" style="color:var(--gold)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
            سجل الدفعات — {{ payPopupDebt?.name }}
          </h3>
          <div v-if="payPopupDebt" class="glass-sm p-3 space-y-2 rounded-xl">
            <div class="flex justify-between items-center mb-1">
              <span class="sec-h text-[10px]">معلومات الدين</span>
              <span :class="payPopupDebt.status === 'paid' ? 'b-debt-settled' : 'b-unpaid'">{{ payPopupDebt.status === 'paid' ? 'مسدد بالكامل' : 'غير مسدد' }}</span>
            </div>
            <div class="flex justify-between"><span class="opacity-50 text-xs">المريض:</span><span class="font-black text-sm cursor-pointer" style="color:var(--gold)" @click="closePayPopup(); goPatient(payPopupDebt.name)">{{ payPopupDebt.name }}</span></div>
            <div v-if="payPopupDebt.phone" class="flex justify-between items-center"><span class="opacity-50 text-xs">الهاتف:</span><a :href="'tel:' + payPopupDebt.phone" class="text-blue-400 text-xs">{{ payPopupDebt.phone }}</a></div>
            <div class="flex justify-between"><span class="opacity-50 text-xs">المبلغ الكلي:</span><span class="n font-bold text-yellow-400">{{ n(payPopupDebt.totalAmount || payPopupDebt.total || 0) }} {{ cur }}</span></div>
            <div class="flex justify-between"><span class="opacity-50 text-xs">المدفوع:</span><span class="n font-bold text-green-400">{{ n(payPopupDebt.paidAmount || 0) }} {{ cur }}</span></div>
            <div class="flex justify-between"><span class="opacity-50 text-xs">المتبقي:</span><span class="n font-bold text-red-400">{{ n(payPopupDebt.remaining || 0) }} {{ cur }}</span></div>
            <!-- Progress -->
            <div class="pt-2">
              <div class="w-full h-2 rounded-full overflow-hidden" style="background:rgba(255,255,255,.1)">
                <div class="h-full rounded-full transition-all" :style="{ width: payPct + '%', background: payPct >= 100 ? 'var(--green)' : 'var(--gold)' }"></div>
              </div>
              <p class="text-[9px] opacity-40 mt-1 text-center"><span class="n">{{ payPct }}%</span> مسدد</p>
            </div>
          </div>
          <!-- Installment list -->
          <div v-if="payPopupDebt?.installments?.length" class="space-y-2">
            <span class="sec-h text-[10px]">الدفعات</span>
            <div v-for="(inst, i) in payPopupDebt.installments" :key="inst.id || i" class="row-card p-3 flex justify-between items-center">
              <div>
                <p class="text-xs font-bold text-green-400"><span class="n">{{ n(inst.amount) }}</span> {{ cur }}</p>
                <p class="text-[9px] opacity-35">{{ inst.date }} — {{ inst.payment }}</p>
              </div>
              <span class="text-[10px] opacity-40">#{{ i + 1 }}</span>
            </div>
          </div>
          <div v-else class="text-center py-4 opacity-30 text-xs">لا توجد دفعات مسجلة</div>
          <button @click="closePayPopup" class="btn-o w-full py-2.5 text-xs">إغلاق</button>
        </div>
      </div>
    </Teleport>
    <DoubleConfirm :visible="dcVisible" :title="dcTitle" :msg="dcMsg" :duration="dcDuration" @confirm="onDcConfirm" @cancel="onDcCancel" />
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { fuzzyMatch, fuzzyScore } from '@/utils/search'
import { sortByNewest, n } from '@/utils/helpers'
import { markMonthDirty, markDebtsDirty } from '@/services/sync.service'
import DebtCard from './components/DebtCard.vue'
import VirtualScroll from '@/components/VirtualScroll.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useDoubleConfirm } from '@/composables/useDoubleConfirm'
import { getCurrentDate } from '@/utils/format'

const DoubleConfirm = defineAsyncComponent(() => import('@/components/DoubleConfirm.vue'))

const vsContainerHeight = Math.max(400, window.innerHeight - 220)

const router = useRouter()
const app = useAppStore()
const auth = useAuthStore()
const { toast } = useToast()
const { dcVisible, dcTitle, dcMsg, dcDuration, dblConfirm, onDcConfirm, onDcCancel } = useDoubleConfirm()

const searchQuery = ref('')
const debtFilter = ref('active')
const showInstModal = ref(false)
const showEditModal = ref(false)
const showPayPopup = ref(false)
const instDebtId = ref(null)
const instAmt = ref(null)
const instDate = ref(getCurrentDate())
const instPay = ref('')
const instPreview = ref(null)
const editDebtId = ref(null)
const editName = ref('')
const editPhone = ref('')
const editNotes = ref('')
const editTotal = ref(null)
const editOriginalTotal = ref(null)
const payPopupDebtId = ref(null)
const editTotalChanged = computed(() => editTotal.value !== null && editOriginalTotal.value !== null && editTotal.value !== editOriginalTotal.value)

const cur = computed(() => app.currency)
const payments = computed(() => app.payments)
const doctorPct = computed(() => app.config.doctorPct || 50)

const activeCount = computed(() => app.debts.filter(d => d.status !== 'paid').length)
const paidCount = computed(() => app.debts.filter(d => d.status === 'paid').length)

const filteredDebts = computed(() => {
  let list = app.debts
  const q = searchQuery.value.trim()
  if (q) list = list.filter(d => fuzzyMatch(q, d.name || ''))
  if (debtFilter.value === 'active') list = list.filter(d => d.status !== 'paid')
  else if (debtFilter.value === 'paid') list = list.filter(d => d.status === 'paid')
  return sortByNewest(list)
})

const instDebt = computed(() => app.debts.find(d => d.id === instDebtId.value))
const instLabRem = computed(() => {
  const d = instDebt.value
  if (!d || d.type !== 'prosthetic') return 0
  return Math.max(0, (Number(d.labValue) || 0) - (Number(d.labPaid) || 0))
})

function openInstModal(id) {
  instDebtId.value = id
  instAmt.value = null
  instDate.value = getCurrentDate()
  instPay.value = payments.value[0] || 'كاش'
  instPreview.value = null
  showInstModal.value = true
}

function previewInst() {
  const d = instDebt.value
  if (!d || !instAmt.value || instAmt.value <= 0) { instPreview.value = null; return }
  const ip = d.type === 'prosthetic'
  const labRem = ip ? Math.max(0, (Number(d.labValue) || 0) - (Number(d.labPaid) || 0)) : 0
  const toLab = ip ? Math.min(instAmt.value, labRem) : 0
  const toProfit = instAmt.value - toLab
  const dp = doctorPct.value
  instPreview.value = {
    toLab,
    toProfit,
    docShare: toProfit * (dp / 100),
    clinShare: toProfit * ((100 - dp) / 100),
  }
}

function confirmInst() {
  const dIdx = app.debts.findIndex(d => d.id === instDebtId.value)
  if (dIdx < 0) return
  const debt = { ...app.debts[dIdx] }
  const amt = instAmt.value
  const date = instDate.value
  const pay = instPay.value
  if (isNaN(amt) || amt <= 0) { toast('يرجى إدخال قيمة دفعة صحيحة'); return }
  if (!date) { toast('يرجى اختيار تاريخ الدفعة'); return }
  if (amt > (Number(debt.remaining) || 0) + 0.01) { toast('الدفعة أكبر من المتبقي (' + n(debt.remaining || 0) + ' ' + cur.value + ')'); return }

  const ip = debt.type === 'prosthetic'
  const labRem = ip ? Math.max(0, (Number(debt.labValue) || 0) - (Number(debt.labPaid) || 0)) : 0
  const toLab = ip ? Math.min(amt, labRem) : 0
  const toProfit = amt - toLab
  const dp = doctorPct.value

  debt.installments = debt.installments || []
  debt.installments.push({ id: Date.now(), amount: amt, date, payment: pay })
  debt.paidAmount = (Number(debt.paidAmount) || 0) + amt
  debt.remaining = Math.max(0, (Number(debt.remaining) || 0) - amt)
  const isFull = debt.remaining <= 0.01

  if (ip) {
    debt.labPaid = (Number(debt.labPaid) || 0) + toLab
    if (toProfit > 0) {
      const dProfit = toProfit * (dp / 100)
      debt.doctorEarned = (Number(debt.doctorEarned) || 0) + dProfit
      app.records.push({
        id: Date.now() + Math.floor(Math.random() * 100), uid: auth.uid, date, name: debt.name,
        amount: dProfit, clinic: debt.clinic, service: 'تركيبات (دفعة دين)', payment: pay,
        isDebt: false, isPros: false, isDebtPayment: true, debtId: debt.id,
        debtPaymentType: isFull ? 'full' : 'partial', _mod: Date.now(), _t: 'r',
      })
    }
  } else {
    app.records.push({
      id: Date.now() + Math.floor(Math.random() * 100), uid: auth.uid, date, name: debt.name,
      amount: amt, clinic: debt.clinic, service: 'دفعة دين', payment: pay,
      isDebt: false, isPros: false, isDebtPayment: true, debtId: debt.id,
      debtPaymentType: isFull ? 'full' : 'partial', _mod: Date.now(), _t: 'r',
    })
  }

  if (isFull) { debt.status = 'paid'; debt.remaining = 0 }
  else { debt.status = 'partial' }
  debt._mod = Date.now()
  app.debts[dIdx] = debt
  markMonthDirty(date)
  markDebtsDirty()
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast(isFull ? 'تم سداد الدين بالكامل!' : 'تم تسجيل الدفعة')
  closeInstModal()
}

function closeInstModal() { showInstModal.value = false }

function openEditModal(id) {
  const d = app.debts.find(x => x.id === id)
  if (!d) return
  editDebtId.value = id
  editName.value = d.name || ''
  editPhone.value = d.phone || ''
  editNotes.value = d.notes || ''
  const totalAmt = Number(d.totalAmount || d.total || 0)
  editTotal.value = totalAmt
  editOriginalTotal.value = totalAmt
  showEditModal.value = true
}

function confirmEditDebt() {
  const idx = app.debts.findIndex(d => d.id === editDebtId.value)
  if (idx < 0) return
  const debt = app.debts[idx]
  debt.name = editName.value.trim() || debt.name
  debt.phone = editPhone.value.trim()
  debt.notes = editNotes.value.trim()
  // Handle total amount change
  if (editTotal.value !== null && editTotal.value > 0 && editTotal.value !== editOriginalTotal.value) {
    const newTotal = editTotal.value
    const paid = Number(debt.paidAmount) || 0
    if (debt.totalAmount !== undefined) debt.totalAmount = newTotal
    if (debt.total !== undefined) debt.total = newTotal
    debt.remaining = Math.max(0, newTotal - paid)
    if (debt.remaining <= 0.01) { debt.status = 'paid'; debt.remaining = 0 }
    else if (paid > 0.01) { debt.status = 'partial' }
    else { debt.status = 'unpaid' }
  }
  debt._mod = Date.now()
  app.debts[idx] = debt
  markDebtsDirty()
  app.saveToCache(auth.uid)
  app.syncSave(auth.uid, false)
  toast('تم التحديث')
  closeEditModal()
}

function closeEditModal() { showEditModal.value = false }

function delDebt(id) {
  const debt = app.debts.find(d => d.id === id)
  if (!debt) return
  dblConfirm('حذف سجل الدين نهائياً؟', 'المريض: ' + (debt.name || '—') + '\nسيتم حذف جميع سجلات الدفعات المرتبطة.', () => {
    const relatedPayments = app.records.filter(r => r.isDebtPayment && r.debtId === id)
    relatedPayments.forEach(r => markMonthDirty(r.date))
    app.records = app.records.filter(r => !(r.isDebtPayment && r.debtId === id))
    app.debts = app.debts.filter(d => d.id !== id)
    markDebtsDirty()
    app.saveToCache(auth.uid)
    app.syncSave(auth.uid, false)
    toast('تم حذف الدين وسجلات الدفعات المرتبطة')
  }, 'debts')
}

const payPopupDebt = computed(() => app.debts.find(d => d.id === payPopupDebtId.value))
const payPct = computed(() => {
  const d = payPopupDebt.value
  if (!d) return 0
  const total = Number(d.totalAmount || d.total || 0) || 0
  return total > 0 ? Math.min(100, Math.round(((Number(d.paidAmount) || 0) / total) * 100)) : 0
})

function openPayPopup(id) { payPopupDebtId.value = id; showPayPopup.value = true }
function closePayPopup() { showPayPopup.value = false }

function goPatient(name) {
  app.activeTab = 'patients'
  router.push({ name: 'patients', query: { search: name } })
}
</script>
