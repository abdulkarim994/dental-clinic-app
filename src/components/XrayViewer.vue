<template>
  <Teleport to="body">
    <div v-if="visible" class="xray-ol" @keydown.esc="close">
      <!-- Top Bar -->
      <div class="xray-bar">
        <div class="xb-title">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
          {{ patientName }} — أشعة {{ currentIndex + 1 }}/{{ images.length }}
        </div>
        <div class="xb-btns">
          <button class="xb-btn xb-del" @click="deleteCurrent" title="حذف">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
          <button class="xb-btn" @click="close" title="إغلاق">✕</button>
        </div>
      </div>

      <!-- Image Body -->
      <div
        class="xray-body"
        ref="bodyEl"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @wheel.prevent="onWheel"
      >
        <img
          ref="imgEl"
          :src="currentSrc"
          :alt="currentImage?.name || 'أشعة'"
          :class="{ 'xr-zoomed': state.zoom > 1 }"
          :style="imgStyle"
        >
      </div>

      <!-- Tools -->
      <div class="xray-tools">
        <button class="xt-btn" @click="zoom(1)">🔍+</button>
        <button class="xt-btn" @click="zoom(-1)">🔍−</button>
        <button class="xt-btn" @click="rotate">↻ تدوير</button>
        <button class="xt-btn" :class="{ 'xt-on': state.invert }" @click="toggleInvert">◑ عكس</button>
        <button class="xt-btn" @click="brightness(1)">☀ سطوع+</button>
        <button class="xt-btn" @click="brightness(-1)">☀ سطوع−</button>
        <button class="xt-btn" @click="contrast(1)">◐ تباين+</button>
        <button class="xt-btn" @click="contrast(-1)">◐ تباين−</button>
        <button class="xt-btn" @click="reset">⟳ إعادة</button>
      </div>

      <!-- Thumbnails -->
      <div v-if="images.length > 1" class="xray-thumbs">
        <img
          v-for="(img, i) in images"
          :key="img.key || i"
          :src="imgSrc(img)"
          :class="{ 'xt-sel': i === currentIndex }"
          @click="goTo(i)"
        >
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { getImageUrl } from '@/services/image.service'

const props = defineProps({
  visible: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  startIndex: { type: Number, default: 0 },
  patientName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'delete'])

const bodyEl = ref(null)
const imgEl = ref(null)

const currentIndex = ref(0)
const state = reactive({
  zoom: 1, rotate: 0, invert: false,
  brightness: 100, contrast: 100,
  panX: 0, panY: 0,
  dragging: false, lx: 0, ly: 0,
})

const currentImage = computed(() => props.images[currentIndex.value])
const currentSrc = computed(() => {
  const img = currentImage.value
  if (!img) return ''
  return imgSrc(img)
})

const imgStyle = computed(() => ({
  transform: `scale(${state.zoom}) rotate(${state.rotate}deg) translate(${state.panX / state.zoom}px, ${state.panY / state.zoom}px)`,
  filter: `invert(${state.invert ? 1 : 0}) brightness(${state.brightness}%) contrast(${state.contrast}%)`,
}))

watch(() => props.visible, (v) => {
  if (v) {
    currentIndex.value = Math.min(props.startIndex, props.images.length - 1)
    resetState()
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function imgSrc(img) {
  if (img.key) return getImageUrl(img.key)
  if (img.data) return img.data
  return ''
}

function resetState() {
  state.zoom = 1
  state.rotate = 0
  state.invert = false
  state.brightness = 100
  state.contrast = 100
  state.panX = 0
  state.panY = 0
  state.dragging = false
}

function zoom(dir) {
  state.zoom = Math.max(0.5, Math.min(5, state.zoom + (dir > 0 ? 0.25 : -0.25)))
  if (state.zoom <= 1) { state.panX = 0; state.panY = 0 }
}

function rotate() { state.rotate = (state.rotate + 90) % 360 }
function toggleInvert() { state.invert = !state.invert }
function brightness(dir) { state.brightness = Math.max(20, Math.min(300, state.brightness + (dir > 0 ? 15 : -15))) }
function contrast(dir) { state.contrast = Math.max(20, Math.min(300, state.contrast + (dir > 0 ? 15 : -15))) }
function reset() { resetState() }

function goTo(i) {
  currentIndex.value = i
  resetState()
}

function close() {
  document.body.style.overflow = ''
  emit('close')
}

function deleteCurrent() {
  if (!confirm('حذف هذه الصورة؟')) return
  emit('delete', currentIndex.value)
  if (props.images.length <= 1) {
    close()
  } else {
    currentIndex.value = Math.min(currentIndex.value, props.images.length - 2)
    resetState()
  }
}

function onPointerDown(e) {
  if (state.zoom > 1) {
    state.dragging = true
    state.lx = e.clientX
    state.ly = e.clientY
    bodyEl.value?.setPointerCapture(e.pointerId)
  }
}

function onPointerMove(e) {
  if (!state.dragging) return
  state.panX += e.clientX - state.lx
  state.panY += e.clientY - state.ly
  state.lx = e.clientX
  state.ly = e.clientY
}

function onPointerUp() {
  state.dragging = false
}

function onWheel(e) {
  zoom(e.deltaY < 0 ? 1 : -1)
}
</script>
