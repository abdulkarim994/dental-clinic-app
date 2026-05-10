# طب الأسنان الرقمي — Dental Clinic Management System

نظام إدارة عيادات الأسنان المتكامل — مبني بـ Vue 3 + Vite + Capacitor.

## 🏗️ البنية المعمارية

```
src/
├── components/          # Vue components
│   ├── layout/          # AppHeader, AppNav
│   └── shared/          # SyncOverlay, ToastNotification
├── composables/         # useSync, useToast (shared logic)
├── modules/             # Feature modules (future expansion)
├── pages/               # Route pages
│   ├── LoginPage.vue
│   ├── AddPage.vue
│   ├── RecordsPage.vue
│   ├── TreasuryPage.vue
│   ├── ArchivePage.vue
│   ├── DebtsPage.vue
│   ├── ProfitsPage.vue
│   ├── PatientsPage.vue
│   └── CalendarPage.vue
├── router/              # Vue Router config
├── services/            # Business services
│   ├── supabase.service.js
│   ├── r2.service.js
│   ├── auth.service.js
│   ├── sync.service.js
│   ├── cache.service.js
│   └── image.service.js
├── stores/              # Pinia state management
│   ├── auth.store.js
│   ├── config.store.js
│   ├── records.store.js
│   ├── debts.store.js
│   ├── appointments.store.js
│   └── ui.store.js
├── styles/              # Modular CSS
│   ├── variables.css
│   ├── base.css
│   ├── components.css
│   ├── modals.css
│   ├── animations.css
│   ├── navigation.css
│   ├── login.css
│   ├── light-mode.css
│   └── index.css
├── utils/               # Helpers, icons, defaults
├── App.vue              # Root component
└── main.js              # Entry point
```

## 🚀 التشغيل

```bash
# تثبيت الحزم
npm install

# تشغيل خادم التطوير
npm run dev

# بناء الإنتاج
npm run build

# معاينة البناء
npm run preview
```

## 📱 Capacitor (Android / Windows)

```bash
# إضافة منصة Android
npx cap add android

# إضافة منصة Electron (Windows)
npx cap add @nickvdl/capacitor-electron

# بناء + مزامنة
npm run build && npx cap sync
```

## ⚡ التقنيات

- **Vue 3** — Composition API
- **Vite** — Build tooling
- **Pinia** — State management
- **Vue Router** — Navigation (hash-based)
- **Supabase** — Backend + Auth + Realtime
- **Cloudflare R2** — X-ray image storage
- **Capacitor** — Native mobile/desktop
- **XLSX** — Excel export

## 🔒 الأمان

- Auth persistence via Supabase session
- Token refresh on visibility change
- localStorage caching with user-scoped keys
- Offline-first with background sync
