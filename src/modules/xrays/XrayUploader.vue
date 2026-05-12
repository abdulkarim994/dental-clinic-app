<template>
  <label class="xray-upload-btn mt-1 cursor-pointer flex items-center justify-center gap-1.5 text-[10px] py-1.5 rounded-xl" style="background:rgba(59,130,246,.08);border:1px dashed rgba(59,130,246,.25);color:var(--gold-l)">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    إرفاق صور أشعة
    <input type="file" accept="image/*" multiple class="hidden" @change="onUpload">
  </label>
</template>

<script setup>
import { uploadXray } from './xrays.service'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  patientName: { type: String, required: true },
})
const emit = defineEmits(['uploaded'])

const appStore = useAppStore()
const authStore = useAuthStore()
const { toast } = useToast()

async function onUpload(e) {
  const files = e.target.files
  if (!files || !files.length) return
  const name = props.patientName
  const uid = authStore.uid
  const xrays = [...((appStore.config.patientXrays && appStore.config.patientXrays[name]) || [])]
  for (const file of files) {
    try {
      const key = await uploadXray(file, name, uid)
      xrays.push(key)
    } catch {
      toast('خطأ في رفع الصورة')
    }
  }
  appStore.updateConfig({ patientXrays: { ...appStore.config.patientXrays, [name]: xrays } })
  appStore.saveToCache(uid)
  appStore.syncSave(uid, false)
  toast('تم رفع صور الأشعة')
  emit('uploaded')
  e.target.value = ''
}
</script>
