<template>
  <div class="login-bg">
    <div class="login-card glass w-full space-y-6" style="max-width:360px;padding:32px 28px 28px">
      <div class="text-center space-y-4">
        <div class="mx-auto" style="width:92px;height:92px;border-radius:26px;background:#EEF4FF;box-shadow:0 18px 52px rgba(37,99,235,.32),0 3px 0 rgba(255,255,255,.8) inset;display:flex;align-items:center;justify-content:center">
          <svg viewBox="0 0 80 80" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="tG" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1D4ED8"/></linearGradient></defs>
            <path d="M15,24 C15,14 22,8 30,8 C34,8 37,11.5 40,11.5 C43,11.5 46,8 50,8 C58,8 65,14 65,24 C65,33 61,40 59,52 C57,62 55,68 52,70 C49,72 47,67 45,59 C43.5,53.5 42,52 40,52 C38,52 36.5,53.5 35,59 C33,67 31,72 28,70 C25,68 23,62 21,52 C19,40 15,33 15,24 Z" fill="none" stroke="url(#tG)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="43" y="38" width="26" height="32" rx="5" fill="white" opacity=".96"/>
            <rect x="43" y="38" width="26" height="32" rx="5" fill="none" stroke="rgba(59,130,246,.15)" stroke-width="1"/>
            <line x1="48" y1="47" x2="64" y2="47" stroke="rgba(96,165,250,.6)" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="48" y1="53" x2="62" y2="53" stroke="rgba(96,165,250,.4)" stroke-width="2" stroke-linecap="round"/>
            <circle cx="56" cy="62" r="5.5" fill="url(#tG)"/>
            <text x="56" y="65.5" text-anchor="middle" fill="white" font-size="6.5" font-weight="700" font-family="Arial">$</text>
          </svg>
        </div>
        <div>
          <h1 class="font-black text-2xl leading-tight tracking-tight" style="color:var(--gold)">طب الأسنان الرقمي</h1>
          <p class="text-[11px] opacity-35 mt-1 tracking-wide">نظام إدارة العيادة المتكامل</p>
        </div>
      </div>
      <div class="space-y-2.5">
        <input type="email" v-model="email" class="inp" placeholder="البريد الإلكتروني" autocomplete="email" style="text-align:right;direction:rtl">
        <input type="password" v-model="password" class="inp" placeholder="كلمة المرور" autocomplete="current-password" @keydown.enter="handleLogin" style="text-align:right;direction:rtl;letter-spacing:.12em">
        <div class="flex items-center justify-between px-1 pt-1">
          <div>
            <p class="text-xs font-semibold opacity-60">تذكّر بيانات الدخول</p>
            <p class="text-[9px] opacity-30">سيحفظ جهازك كلمة المرور</p>
          </div>
          <label class="tgl"><input type="checkbox" v-model="remember"><span class="tgl-s"></span></label>
        </div>
        <div v-if="authStore.error" class="text-red-400 text-xs text-center py-1">{{ authStore.error }}</div>
      </div>
      <button @click="handleLogin" class="btn-g w-full py-3.5 text-sm font-black tracking-wide" :disabled="authStore.loading">تسجيل الدخول</button>
      <div class="text-center">
        <button @click="showReg = !showReg" class="text-xs opacity-35 hover:opacity-65 transition-opacity">إنشاء حساب جديد</button>
      </div>
      <div v-if="showReg" class="space-y-3 pt-4" style="border-top:1px solid rgba(255,255,255,.08)">
        <p class="text-xs text-center opacity-45 font-bold">إنشاء حساب جديد</p>
        <input type="email" v-model="regEmail" class="inp" placeholder="البريد الإلكتروني" autocomplete="email">
        <input type="password" v-model="regPass" class="inp" placeholder="كلمة المرور (6 أحرف+)" autocomplete="new-password">
        <button @click="handleRegister" class="btn-o w-full py-3 text-sm">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          إنشاء الحساب
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useToast } from '../composables/useToast'
import { loadCredentials, saveCredentials } from '../services/cache.service'

const authStore = useAuthStore()
const { toast } = useToast()

const email = ref('')
const password = ref('')
const remember = ref(true)
const showReg = ref(false)
const regEmail = ref('')
const regPass = ref('')

onMounted(() => {
  const saved = loadCredentials()
  if (saved.email) {
    email.value = saved.email
    password.value = saved.password
  }
})

async function handleLogin() {
  if (remember.value) {
    saveCredentials(email.value.trim(), password.value)
  }
  await authStore.login(email.value.trim(), password.value)
}

async function handleRegister() {
  try {
    await authStore.register(regEmail.value.trim(), regPass.value)
    toast('✅ تم إنشاء الحساب — تحقق من بريدك')
  } catch (e) {
    toast('❌ ' + e.message)
  }
}
</script>
