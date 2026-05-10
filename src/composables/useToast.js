/**
 * Toast composable — global toast notifications
 */
import { ref } from 'vue'
import { ICONS } from '../utils/icons'

const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer = null

export function useToast() {
  function toast(msg) {
    let html = msg
    if (msg.startsWith('✅')) {
      html = ICONS.check + msg.replace(/^✅\s*/, '')
    } else if (msg.startsWith('❌')) {
      html = ICONS.x + msg.replace(/^❌\s*/, '')
    } else if (msg.startsWith('⚠️')) {
      html = ICONS.warn + msg.replace(/^⚠️\s*/, '')
    } else if (msg.startsWith('🗑️')) {
      html = ICONS.trash + msg.replace(/^🗑️\s*/, '')
    }

    toastMessage.value = html
    toastVisible.value = true
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastVisible.value = false
    }, 2800)
  }

  return { toastMessage, toastVisible, toast }
}
