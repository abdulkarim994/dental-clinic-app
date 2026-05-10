<template>
  <div class="space-y-2">
    <!-- Upload Button -->
    <label class="xray-upload-btn">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      {{ uploading ? 'جار الرفع...' : 'رفع صور أشعة' }}
      <input type="file" accept="image/*" multiple class="hidden" @change="onFileSelect" :disabled="uploading">
    </label>
    <p class="text-[9px] opacity-30 text-center">PNG/JPG — حد أقصى 5MB لكل صورة</p>

    <!-- Grid -->
    <div v-if="images.length" class="xray-grid">
      <div v-for="(img, i) in images" :key="img.key || i" class="xg-item" @click="$emit('open-viewer', i)">
        <img :src="imgSrc(img)" :alt="img.name || 'أشعة'" loading="lazy">
        <button class="xg-del" @click.stop="$emit('delete', i)" title="حذف">✕</button>
      </div>
    </div>
    <p v-else class="text-[10px] opacity-30 text-center py-2">لا توجد صور أشعة</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getImageUrl, uploadXrayImage } from '@/services/image.service'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  images: { type: Array, default: () => [] },
  patientName: { type: String, required: true },
  uploading: { type: Boolean, default: false },
})

const emit = defineEmits(['upload', 'delete', 'open-viewer'])
const auth = useAuthStore()
const { toast } = useToast()
const uploading = ref(false)

function imgSrc(img) {
  if (img.key) return getImageUrl(img.key)
  if (img.data) return img.data
  return ''
}

async function onFileSelect(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  uploading.value = true
  let uploaded = 0
  let failed = 0
  toast('جار رفع ' + files.length + ' صورة...')

  for (const f of files) {
    if (f.size > 5 * 1024 * 1024) {
      toast('صورة ' + f.name + ' أكبر من 5MB')
      failed++
      continue
    }
    try {
      const key = await uploadXrayImage(f, props.patientName, auth.uid)
      emit('upload', { name: f.name, key, date: new Date().toISOString().substring(0, 10) })
      uploaded++
    } catch (err) {
      console.error('[Xray] upload error:', err)
      failed++
      toast('فشل رفع ' + f.name)
    }
  }

  uploading.value = false
  e.target.value = ''
  if (uploaded) toast('تم رفع ' + uploaded + ' صورة أشعة' + (failed ? ' (' + failed + ' فشلت)' : ''))
  else if (failed) toast('فشل رفع جميع الصور')
}
</script>
