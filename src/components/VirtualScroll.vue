<template>
  <div ref="container" class="virtual-scroll-container" :style="{ height: containerHeight + 'px', overflow: 'auto' }" @scroll="onScroll">
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <slot v-for="item in visibleItems" :key="item._vsId" :item="item" :index="item._vsIndex" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  itemHeight: { type: Number, default: 80 },
  containerHeight: { type: Number, default: 600 },
  buffer: { type: Number, default: 5 },
})

const container = ref(null)
const scrollTop = ref(0)

const totalHeight = computed(() => props.items.length * props.itemHeight)

const startIndex = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight) - props.buffer
  return Math.max(0, start)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight) + props.buffer * 2
  return Math.min(props.items.length, startIndex.value + visibleCount)
})

const offsetY = computed(() => startIndex.value * props.itemHeight)

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value).map((item, i) => ({
    ...item,
    _vsId: item.id || startIndex.value + i,
    _vsIndex: startIndex.value + i,
  }))
})

function onScroll() {
  if (container.value) scrollTop.value = container.value.scrollTop
}
</script>
