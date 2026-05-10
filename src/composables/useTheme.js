import { ref, watch } from 'vue'

const isLight = ref(localStorage.getItem('dental_theme') === 'light')
const fontSizeClass = ref(localStorage.getItem('dental_fs') || 'fs-medium')

export function useTheme() {
  function applyTheme(light) {
    isLight.value = light
    document.body.classList.toggle('light', light)
    localStorage.setItem('dental_theme', light ? 'light' : 'dark')
  }

  function applyFontSize(cls) {
    fontSizeClass.value = cls
    document.body.classList.remove('fs-small', 'fs-medium', 'fs-large', 'fs-xlarge')
    document.body.classList.add(cls)
    localStorage.setItem('dental_fs', cls)
  }

  function initTheme() {
    applyTheme(isLight.value)
    applyFontSize(fontSizeClass.value)
  }

  return {
    isLight,
    fontSizeClass,
    applyTheme,
    applyFontSize,
    initTheme,
  }
}
