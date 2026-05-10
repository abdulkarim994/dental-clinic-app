<template>
  <Teleport to="body">
    <div v-if="visible" class="print-overlay active" id="_printArea">
      <div class="pov-bar no-print">
        <div style="display:flex;align-items:center;gap:10px;min-width:0">
          <button class="pov-btn-back" @click="close">← رجوع</button>
          <h2 style="margin:0;font-size:13px;font-weight:700;font-family:'Cairo',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>
            {{ title }}
          </h2>
        </div>
        <button class="pov-btn-print" @click="doPrint">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          طباعة / PDF
        </button>
      </div>
      <div class="pov-content" v-html="styledContent"></div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  html: { type: String, default: '' },
})
const emit = defineEmits(['close'])

const printStyles = `
<style>
  .pov-content h1{text-align:center;font-size:20px;color:#0a1428;margin-bottom:4px;font-family:'Cairo',sans-serif}
  .pov-content .sub{text-align:center;font-size:11px;color:#888;margin-bottom:20px;font-family:'Cairo',sans-serif}
  .pov-content table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;font-family:'Cairo',sans-serif}
  .pov-content th{background:#0a1428;color:#fff;padding:8px 10px;text-align:right;font-weight:700}
  .pov-content td{padding:7px 10px;border-bottom:1px solid #eee;text-align:right}
  .pov-content tr:nth-child(even) td{background:#f9f9f9}
  .pov-content .total-row td{font-weight:800;background:#EEF3FB;font-size:13px}
  .pov-content .pros-td{color:#3B82F6;font-weight:700}
</style>`

const styledContent = computed(() => {
  const today = new Date().toLocaleDateString('ar')
  return printStyles + props.html + `<div class="pov-footer">نظام طب الأسنان الرقمي — ${today}</div>`
})

function close() { emit('close') }
function doPrint() { window.print() }
</script>
