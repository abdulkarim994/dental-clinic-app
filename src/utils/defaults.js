/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  centerName: 'طب الأسنان الرقمي',
  clinics: ['عيادة 1', 'عيادة 2'],
  services: ['حشو عصب', 'خلع', 'تنظيف', 'تقويم', 'حشو', 'تركيبات'],
  payments: ['كاش', 'تحويل'],
  currency: 'د.ل',
  doctorPct: 50,
  syncMin: 30,
  autoSync: true,
  servicePrices: {},
  waTemplates: [
    { lbl: 'تذكير بموعد', msg: 'السلام عليكم {name}\nنذكركم بموعدكم في {center}.\nنرجو التأكيد أو التواصل معنا 🦷' },
    { lbl: 'تذكير بدين', msg: 'السلام عليكم {name}\nنود تذكيركم بوجود مبلغ مستحق في {center}.\nنشكر تعاونكم 🙏' },
    { lbl: 'متابعة العلاج', msg: 'السلام عليكم {name}\nنتمنى أن تكونوا بصحة وعافية.\nكيف حال الأسنان بعد آخر زيارة؟ 😊' },
    { lbl: 'عرض خاص', msg: 'السلام عليكم {name}\nيسعدنا إعلامكم عن عرض خاص في {center}.\nتواصلوا معنا لمزيد من التفاصيل ✨' }
  ],
  treatmentPlans: {},
  logo: ''
}

/**
 * Tab definitions for navigation
 */
export const TABS = [
  { id: 'add', label: 'إضافة', icon: 'add' },
  { id: 'records', label: 'السجل', icon: 'records' },
  { id: 'treasury', label: 'الخزينة', icon: 'treasury' },
  { id: 'archive', label: 'الأرشيف', icon: 'archive' },
  { id: 'debts', label: 'الديون', icon: 'debts' },
  { id: 'profits', label: 'الأرباح', icon: 'profits' },
  { id: 'patients', label: 'المرضى', icon: 'patients' },
  { id: 'calendar', label: 'المواعيد', icon: 'calendar' }
]
