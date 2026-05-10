<template>
  <div class="skeleton-wrap">
    <div v-for="i in count" :key="i" class="skeleton-card glass-sm rounded-xl" :style="{ height: height + 'px' }">
      <div class="skeleton-line w-2/3 h-3 mb-2"></div>
      <div class="skeleton-line w-1/2 h-2 mb-1.5"></div>
      <div class="skeleton-line w-1/3 h-2"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 3 },
  height: { type: Number, default: 70 },
})
</script>

<style scoped>
.skeleton-card {
  padding: 14px;
  overflow: hidden;
}
.skeleton-line {
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.04) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}
body.light .skeleton-line {
  background: linear-gradient(90deg, rgba(0,0,0,.05) 25%, rgba(0,0,0,.12) 50%, rgba(0,0,0,.05) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}
</style>
