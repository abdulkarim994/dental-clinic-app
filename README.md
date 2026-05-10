# طب الأسنان الرقمي — Dental Clinic App

نظام إدارة عيادات الأسنان المتكامل — مبني بـ Vue 3 + Vite + Capacitor

## المعمارية / Architecture

```
src/
  assets/styles/       # Global CSS (Glassmorphism, theme, variables)
  components/          # Shared UI components
    icons/             # SVG icon components (functional)
  composables/         # Vue composables (useToast, useTheme)
  modules/             # Feature modules (lazy-loaded)
    patients/          # ✅ Patients module (POC - fully converted)
    appointments/      # 🔄 Placeholder
    debts/             # 🔄 Placeholder
    records/           # 🔄 Placeholder
    reports/           # 🔄 Placeholder
    xrays/             # 🔄 Placeholder
    settings/          # 🔄 Placeholder
    sync/              # 🔄 Placeholder
    treatments/        # 🔄 Placeholder
    prosthetics/       # 🔄 Placeholder
    treasury/          # 🔄 Placeholder
    archive/           # 🔄 Placeholder
    profits/           # 🔄 Placeholder
    calendar/          # 🔄 Placeholder
  pages/               # Page-level components (LoginPage, AppShell)
  router/              # Vue Router with lazy loading
  services/            # Service layer
    supabase.service   # Supabase client + retry + dedup
    r2.service         # Cloudflare R2 image management
    auth.service       # Authentication
    sync.service       # Data sync (Supabase ↔ local)
    cache.service      # localStorage cache
    image.service      # Image processing + caching
  stores/              # Pinia stores
    auth.store         # Auth state
    app.store          # App-wide state (records, debts, config)
    patients.store     # Patient-specific computed data
  utils/               # Utility functions
    format             # Number/date formatting
    search             # Arabic fuzzy search
    debounce           # Debounce/throttle
```

## التشغيل / Development

```bash
npm install
npm run dev
```

## البناء / Build

```bash
npm run build
```

## Capacitor (Android/Windows)

```bash
npm run build
npx cap sync
npx cap open android
```

## التقنيات / Tech Stack

- **Vue 3.5+** — Composition API, `<script setup>`
- **Vite 8+** — Fast dev/build
- **Pinia** — State management
- **Vue Router 4** — Lazy-loaded routes
- **Supabase** — Auth + Database
- **Cloudflare R2** — Image storage
- **Capacitor 7** — Native mobile/desktop
- **Tailwind CSS 4** — Utility-first CSS

## القواعد / Guidelines

- **لا تحذف ميزة تعمل حاليًا**
- **لا تغيّر التصميم أو الألوان**
- **Migration تدريجي — موديول واحد في كل مرة**
- **التطبيق يجب أن يعمل بعد كل خطوة**
