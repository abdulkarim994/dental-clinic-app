/**
 * UI Store — manages UI state (active tab, modals, sync overlay, theme, font size, fast mode)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getFastMode, setFastMode as cacheFastMode, getTheme, setTheme as cacheTheme, getFontSize, setFontSize as cacheFontSize } from '../services/cache.service'

export const useUiStore = defineStore('ui', () => {
  const activeTab = ref('add')
  const selectedMonth = ref(new Date().toISOString().substring(0, 7))
  const syncVisible = ref(false)
  const syncMsg = ref('')
  const syncProgress = ref(0)
  const fastMode = ref(getFastMode())
  const theme = ref(getTheme())
  const fontSize = ref(getFontSize())

  /* Modal states */
  const settingsOpen = ref(false)
  const xrayViewerOpen = ref(false)
  const reportModalOpen = ref(false)
  const viewReportModalOpen = ref(false)
  const installmentModalOpen = ref(false)
  const editDebtModalOpen = ref(false)
  const debtPayPopupOpen = ref(false)
  const printOverlayOpen = ref(false)
  const apptNotifOpen = ref(false)
  const doubleConfirmOpen = ref(false)

  const isLightMode = computed(() => theme.value === 'light')

  function setTab(tab) {
    activeTab.value = tab
  }

  function setMonth(month) {
    selectedMonth.value = month
  }

  function showSync(msg, progress = 0) {
    syncVisible.value = true
    syncMsg.value = msg
    syncProgress.value = progress
  }

  function updateSyncProgress(p) {
    syncProgress.value = p
  }

  function hideSync() {
    syncVisible.value = false
  }

  function toggleFastMode() {
    fastMode.value = !fastMode.value
    cacheFastMode(fastMode.value)
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    cacheTheme(theme.value)
    applyTheme()
  }

  function applyTheme() {
    if (theme.value === 'light') {
      document.body.classList.add('light')
    } else {
      document.body.classList.remove('light')
    }
  }

  function setFontSizeLevel(cls) {
    document.body.classList.remove('fs-small', 'fs-medium', 'fs-large', 'fs-xlarge')
    document.body.classList.add(cls)
    fontSize.value = cls
    cacheFontSize(cls)
  }

  function initTheme() {
    applyTheme()
    document.body.classList.add(fontSize.value)
  }

  return {
    activeTab, selectedMonth, syncVisible, syncMsg, syncProgress,
    fastMode, theme, fontSize, isLightMode,
    settingsOpen, xrayViewerOpen, reportModalOpen, viewReportModalOpen,
    installmentModalOpen, editDebtModalOpen, debtPayPopupOpen,
    printOverlayOpen, apptNotifOpen, doubleConfirmOpen,
    setTab, setMonth, showSync, updateSyncProgress, hideSync,
    toggleFastMode, toggleTheme, applyTheme, setFontSizeLevel, initTheme
  }
})
