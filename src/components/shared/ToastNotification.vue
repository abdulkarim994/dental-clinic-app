<template>
  <div v-if="toastVisible" class="toast-el" :style="{ opacity: toastVisible ? '1' : '0' }" v-html="toastMessage">
  </div>
</template>

<script setup>
import { useToast } from '../../composables/useToast'

const { toastMessage, toastVisible } = useToast()
</script>
