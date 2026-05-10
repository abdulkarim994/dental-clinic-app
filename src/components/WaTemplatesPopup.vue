<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[900] flex items-end justify-center p-0" style="background:rgba(4,9,24,.92);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)" @click.self="$emit('close')">
      <div class="w-full max-w-[480px] rounded-t-3xl p-4 space-y-3" style="background:rgba(6,12,26,.98);border:1px solid rgba(59,130,246,.2);border-bottom:none;font-family:'Cairo',sans-serif;max-height:85vh;overflow-y:auto">
        <div class="flex justify-between items-center mb-2">
          <span class="font-extrabold text-sm" style="color:var(--gold)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
            قوالب رسائل — {{ patientName }}
          </span>
          <button @click="$emit('close')" class="glass-sm w-8 h-8 flex items-center justify-center text-sm">✕</button>
        </div>

        <a
          v-for="(tpl, i) in resolvedTemplates"
          :key="i"
          :href="`https://wa.me/${cleanPhone}?text=${encodeURIComponent(tpl.msg)}`"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-3 p-3 rounded-2xl no-underline cursor-pointer"
          style="background:rgba(37,211,102,.07);border:1px solid rgba(37,211,102,.18);margin-bottom:2px;text-decoration:none;transition:all .2s"
          @click="$emit('close')"
        >
          <span class="text-xl flex-shrink-0">{{ tpl.ico }}</span>
          <div class="min-w-0">
            <p class="text-[13px] font-extrabold m-0 mb-0.5" style="color:var(--gold-l)">{{ tpl.lbl }}</p>
            <p class="text-[9px] opacity-45 m-0 overflow-hidden text-ellipsis whitespace-nowrap">{{ tpl.msg.replace(/\n/g, ' ') }}</p>
          </div>
        </a>

        <div v-if="!resolvedTemplates.length" class="text-center text-xs opacity-40 py-6">
          لا توجد قوالب — أضف قوالب من الإعدادات
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.store'

const props = defineProps({
  visible: { type: Boolean, default: false },
  patientName: { type: String, default: '' },
  phone: { type: String, default: '' },
})

defineEmits(['close'])

const app = useAppStore()

const ICONS = ['📅', '💰', '🦷', '✨']

const cleanPhone = computed(() => (props.phone || '').replace(/[^0-9+]/g, ''))

const resolvedTemplates = computed(() => {
  const center = app.centerName || 'العيادة'
  const name = props.patientName
  const templates = app.config.waTemplates && app.config.waTemplates.length
    ? app.config.waTemplates
    : [
        { lbl: 'تذكير بموعد', msg: 'السلام عليكم {name}\nنذكركم بموعدكم في {center}.\nنرجو التأكيد أو التواصل معنا' },
        { lbl: 'تذكير بدين', msg: 'السلام عليكم {name}\nنود تذكيركم بوجود مبلغ مستحق في {center}.\nنشكر تعاونكم' },
        { lbl: 'متابعة العلاج', msg: 'السلام عليكم {name}\nنتمنى أن تكونوا بصحة وعافية.\nكيف حال الأسنان بعد آخر زيارة؟' },
        { lbl: 'عرض خاص', msg: 'السلام عليكم {name}\nيسعدنا إعلامكم عن عرض خاص في {center}.\nتواصلوا معنا لمزيد من التفاصيل' },
      ]

  return templates.map((t, i) => ({
    ...t,
    ico: ICONS[i % ICONS.length],
    msg: (t.msg || '').replace(/\{name\}/g, name).replace(/\{center\}/g, center),
  }))
})
</script>
