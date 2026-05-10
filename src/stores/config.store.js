/**
 * Config Store — manages app configuration (center name, clinics, services, etc.)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DEFAULT_CONFIG } from '../utils/defaults'

export const useConfigStore = defineStore('config', () => {
  const cfg = ref({ ...DEFAULT_CONFIG })
  const dirty = ref(false)

  const centerName = computed(() => cfg.value.centerName || 'طب الأسنان الرقمي')
  const currency = computed(() => cfg.value.currency || 'د.ل')
  const clinics = computed(() => cfg.value.clinics || [])
  const services = computed(() => cfg.value.services || [])
  const payments = computed(() => cfg.value.payments || [])
  const doctorPct = computed(() => cfg.value.doctorPct ?? 50)
  const clinicPct = computed(() => 100 - doctorPct.value)
  const autoSync = computed(() => cfg.value.autoSync !== false)
  const syncMin = computed(() => cfg.value.syncMin || 30)
  const servicePrices = computed(() => cfg.value.servicePrices || {})
  const waTemplates = computed(() => cfg.value.waTemplates || DEFAULT_CONFIG.waTemplates)
  const treatmentPlans = computed(() => cfg.value.treatmentPlans || {})
  const logo = computed(() => cfg.value.logo || '')

  function setConfig(newCfg) {
    cfg.value = { ...DEFAULT_CONFIG, ...newCfg }
  }

  function mergeConfig(partial) {
    cfg.value = { ...cfg.value, ...partial }
  }

  function updateCenterName(name) {
    cfg.value.centerName = name || 'طب الأسنان الرقمي'
    dirty.value = true
  }

  function updateCurrency(cur) {
    cfg.value.currency = cur || 'د.ل'
    dirty.value = true
  }

  function updateDoctorPct(pct) {
    cfg.value.doctorPct = Math.min(100, Math.max(0, parseFloat(pct) || 50))
    dirty.value = true
  }

  function updateAutoSync(enabled) {
    cfg.value.autoSync = enabled
    dirty.value = true
  }

  function updateSyncMin(min) {
    cfg.value.syncMin = parseInt(min) || 30
    dirty.value = true
  }

  function addClinic(name) {
    if (name && !cfg.value.clinics.includes(name)) {
      cfg.value.clinics.push(name)
      dirty.value = true
    }
  }

  function editClinic(index, name) {
    if (name?.trim() && index >= 0 && index < cfg.value.clinics.length) {
      cfg.value.clinics[index] = name.trim()
      dirty.value = true
    }
  }

  function removeClinic(index) {
    cfg.value.clinics.splice(index, 1)
    dirty.value = true
  }

  function addService(name) {
    if (name && !cfg.value.services.includes(name)) {
      cfg.value.services.push(name)
      dirty.value = true
    }
  }

  function editService(index, name) {
    if (name?.trim() && index >= 0 && index < cfg.value.services.length) {
      cfg.value.services[index] = name.trim()
      dirty.value = true
    }
  }

  function removeService(index) {
    cfg.value.services.splice(index, 1)
    dirty.value = true
  }

  function setServicePrice(serviceName, price) {
    if (!cfg.value.servicePrices) cfg.value.servicePrices = {}
    cfg.value.servicePrices[serviceName] = Number(price) || 0
    dirty.value = true
  }

  function addPayment(name) {
    if (name && !cfg.value.payments.includes(name)) {
      cfg.value.payments.push(name)
      dirty.value = true
    }
  }

  function editPayment(index, name) {
    if (name?.trim() && index >= 0 && index < cfg.value.payments.length) {
      cfg.value.payments[index] = name.trim()
      dirty.value = true
    }
  }

  function removePayment(index) {
    cfg.value.payments.splice(index, 1)
    dirty.value = true
  }

  function setLogo(dataUrl) {
    cfg.value.logo = dataUrl || ''
    dirty.value = true
  }

  function updateTreatmentPlan(patientName, plan) {
    if (!cfg.value.treatmentPlans) cfg.value.treatmentPlans = {}
    cfg.value.treatmentPlans[patientName] = plan
    dirty.value = true
  }

  function resetConfig() {
    cfg.value = { ...DEFAULT_CONFIG }
  }

  return {
    cfg, dirty,
    centerName, currency, clinics, services, payments, doctorPct, clinicPct,
    autoSync, syncMin, servicePrices, waTemplates, treatmentPlans, logo,
    setConfig, mergeConfig,
    updateCenterName, updateCurrency, updateDoctorPct, updateAutoSync, updateSyncMin,
    addClinic, editClinic, removeClinic,
    addService, editService, removeService, setServicePrice,
    addPayment, editPayment, removePayment,
    setLogo, updateTreatmentPlan, resetConfig
  }
})
