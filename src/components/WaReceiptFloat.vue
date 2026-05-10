<template>
  <Teleport to="body">
    <a
      v-if="show"
      :href="waUrl"
      target="_blank"
      rel="noopener"
      class="wa-float"
      :style="{ opacity: fading ? 0 : 1 }"
      @click="dismiss"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      إرسال إيصال واتساب
    </a>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app.store'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  name: { type: String, default: '' },
  service: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  date: { type: String, default: '' },
  phone: { type: String, default: '' },
  trigger: { type: Number, default: 0 },
})

const app = useAppStore()
const show = ref(false)
const fading = ref(false)
let autoTimer = null
let fadeTimer = null

const waUrl = ref('')

function buildUrl() {
  const ph = (props.phone || '').replace(/[^0-9+]/g, '')
  if (!ph || ph.length < 6) return ''
  const center = app.centerName || 'العيادة'
  const n = formatNumber
  const msg = `إيصال | ${center}\n──────────────────\n${props.name}\n${props.service}\n${n(props.amount)} ${app.currency}\n${props.date}\n──────────────────\nشكراً لثقتكم`
  return `https://wa.me/${ph}?text=${encodeURIComponent(msg)}`
}

function dismiss() {
  clearTimeout(autoTimer)
  clearTimeout(fadeTimer)
  fading.value = true
  setTimeout(() => { show.value = false; fading.value = false }, 500)
}

watch(() => props.trigger, (v) => {
  if (!v) return
  waUrl.value = buildUrl()
  if (!waUrl.value) return
  show.value = true
  fading.value = false
  clearTimeout(autoTimer)
  clearTimeout(fadeTimer)
  autoTimer = setTimeout(() => {
    fading.value = true
    fadeTimer = setTimeout(() => { show.value = false; fading.value = false }, 500)
  }, 6000)
})

onUnmounted(() => {
  clearTimeout(autoTimer)
  clearTimeout(fadeTimer)
})
</script>
