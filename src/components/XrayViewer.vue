<template>
  <Teleport to="body">
    <div v-if="visible" class="xray-ol" @click.self="close">
      <div class="xray-bar">
        <div class="xb-title">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
          {{ patientName }} — أشعة {{ currentIdx + 1 }}/{{ images.length }}
        </div>
        <div class="xb-btns">
          <button class="xb-btn xb-del" @click="deleteCurrent" title="حذف">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
          <button class="xb-btn" @click="close" title="إغلاق">✕</button>
        </div>
      </div>
      <div class="xray-body" ref="bodyEl" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @wheel.prevent="onWheel">
        <div v-if="imgLoading" class="xray-loading">
          <img v-if="thumbSrc" :src="thumbSrc" :alt="patientName + ' أشعة'" class="xray-preview-blur" :style="imgStyle">
          <div class="xray-spinner"></div>
        </div>
        <img ref="imgEl" :src="currentSrc" :alt="patientName + ' أشعة'" :style="imgStyle" draggable="false" @load="onImageLoad" @error="onImageError" :class="{ 'xray-img-hidden': imgLoading }">
      </div>
      <div class="xray-tools">
        <button class="xt-btn" @click="zoomIn">🔍+</button>
        <button class="xt-btn" @click="zoomOut">🔍−</button>
        <button class="xt-btn" @click="rotate">↻ تدوير</button>
        <button class="xt-btn" :class="{ 'xt-on': st.invert }" @click="toggleInvert">◑ عكس</button>
        <button class="xt-btn" @click="brightUp">☀ سطوع+</button>
        <button class="xt-btn" @click="brightDown">☀ سطوع−</button>
        <button class="xt-btn" @click="contrastUp">◐ تباين+</button>
        <button class="xt-btn" @click="contrastDown">◐ تباين−</button>
        <button class="xt-btn" @click="reset">⟳ إعادة</button>
      </div>
      <div v-if="images.length > 1" class="xray-thumbs">
        <img v-for="(im, i) in images" :key="i" :src="thumbStripSrc(im)" :class="{ 'xt-sel': i === currentIdx }" @click="goTo(i)" loading="lazy">
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { getImageUrl, getThumbnailUrl } from '@/services/image.service'
import { preloadAdjacent } from '@/services/image-pipeline.service'

const props = defineProps({
  visible: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  patientName: { type: String, default: '' },
  startIndex: { type: Number, default: 0 },
})
const emit = defineEmits(['close', 'delete'])

const bodyEl = ref(null)
const imgEl = ref(null)
const currentIdx = ref(0)
const imgLoading = ref(false)

const st = reactive({
  zoom: 1, rotate: 0, invert: false,
  brightness: 100, contrast: 100,
  panX: 0, panY: 0, dragging: false, lx: 0, ly: 0,
})

watch(() => props.visible, (v) => {
  if (v) {
    currentIdx.value = Math.min(props.startIndex, props.images.length - 1)
    resetState()
    imgLoading.value = true
    document.body.style.overflow = 'hidden'
    // Preload adjacent images for smooth navigation
    preloadAdjacent(props.images, currentIdx.value, imgSrc)
  } else {
    document.body.style.overflow = ''
  }
})

function resetState() {
  st.zoom = 1; st.rotate = 0; st.invert = false
  st.brightness = 100; st.contrast = 100
  st.panX = 0; st.panY = 0; st.dragging = false
}

function imgSrc(im) {
  if (typeof im === 'string') return im.startsWith('http') || im.startsWith('data:') ? im : getImageUrl(im)
  return im.url || (im.key ? getImageUrl(im.key) : '') || im.src || ''
}

function thumbStripSrc(im) {
  if (typeof im === 'string') return im.startsWith('http') || im.startsWith('data:') ? im : getThumbnailUrl(im)
  return im.url || (im.key ? getThumbnailUrl(im.key) : '') || im.src || ''
}

const currentSrc = computed(() => props.images[currentIdx.value] ? imgSrc(props.images[currentIdx.value]) : '')

const imgStyle = computed(() => ({
  transform: `scale(${st.zoom}) rotate(${st.rotate}deg) translate(${st.panX / st.zoom}px, ${st.panY / st.zoom}px)`,
  filter: `invert(${st.invert ? 1 : 0}) brightness(${st.brightness}%) contrast(${st.contrast}%)`,
  cursor: st.zoom > 1 ? 'grab' : 'default',
}))

function zoomIn() { st.zoom = Math.min(5, st.zoom + 0.25); applyPanLimit() }
function zoomOut() { st.zoom = Math.max(0.5, st.zoom - 0.25); applyPanLimit() }
function rotate() { st.rotate = (st.rotate + 90) % 360 }
function toggleInvert() { st.invert = !st.invert }
function brightUp() { st.brightness = Math.min(300, st.brightness + 15) }
function brightDown() { st.brightness = Math.max(20, st.brightness - 15) }
function contrastUp() { st.contrast = Math.min(300, st.contrast + 15) }
function contrastDown() { st.contrast = Math.max(20, st.contrast - 15) }
function reset() { resetState() }

function applyPanLimit() {
  if (st.zoom <= 1) { st.panX = 0; st.panY = 0 }
}

// Thumbnail source for progressive loading blur placeholder
const thumbSrc = computed(() => {
  const img = props.images[currentIdx.value]
  if (!img) return ''
  if (typeof img === 'string') return img.startsWith('http') || img.startsWith('data:') ? '' : getThumbnailUrl(img)
  return img.key ? getThumbnailUrl(img.key) : ''
})

function onImageLoad() {
  imgLoading.value = false
}

function onImageError() {
  imgLoading.value = false
}

function goTo(i) {
  currentIdx.value = i
  resetState()
  imgLoading.value = true
  preloadAdjacent(props.images, i, imgSrc)
}

function onPointerDown(e) {
  if (st.zoom > 1 && e.target === imgEl.value) {
    st.dragging = true; st.lx = e.clientX; st.ly = e.clientY
    bodyEl.value?.setPointerCapture(e.pointerId)
  }
}
function onPointerMove(e) {
  if (!st.dragging) return
  st.panX += e.clientX - st.lx; st.panY += e.clientY - st.ly
  st.lx = e.clientX; st.ly = e.clientY
}
function onPointerUp() { st.dragging = false }
function onWheel(e) { e.deltaY < 0 ? zoomIn() : zoomOut() }

function close() {
  document.body.style.overflow = ''
  emit('close')
}

function deleteCurrent() {
  if (!confirm('حذف هذه الصورة؟')) return
  emit('delete', currentIdx.value)
  if (currentIdx.value >= props.images.length - 1) currentIdx.value = Math.max(0, props.images.length - 2)
  if (!props.images.length) close()
}

// Keyboard navigation
function onKeydown(e) {
  if (!props.visible) return
  if (e.key === 'ArrowRight' && currentIdx.value > 0) goTo(currentIdx.value - 1)
  if (e.key === 'ArrowLeft' && currentIdx.value < props.images.length - 1) goTo(currentIdx.value + 1)
  if (e.key === 'Escape') close()
}

watch(() => props.visible, (v) => {
  if (v) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
}, { immediate: false })
</script>
