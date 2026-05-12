# Architecture Documentation

## Overview

Dental Clinic App is a Vue 3 + Vite + Capacitor offline-first application for dental clinic management. It supports both web (IndexedDB) and native Android (SQLite) storage, with Supabase as the cloud backend.

## Directory Structure

```
src/
├── assets/            # Static assets (CSS, images)
├── components/        # Shared UI components
│   ├── icons/         # SVG icon components
│   ├── LazyImage.vue  # IntersectionObserver-based lazy image loading
│   ├── VirtualScroll.vue  # Virtualized list rendering
│   ├── SyncOverlay.vue    # Sync status overlay
│   └── ...
├── composables/       # Vue composables (shared reactive logic)
│   ├── useMemoized.js     # Memoized computed values
│   ├── useToast.js        # Toast notification system
│   ├── useTheme.js        # Theme management
│   └── useDoubleConfirm.js # Double-confirmation pattern
├── domains/           # Domain aggregation layer
│   ├── appointments/  # Appointment domain exports
│   ├── billing/       # Billing & debt domain exports
│   ├── patients/      # Patient domain exports
│   └── xrays/         # X-ray image domain exports
├── dto/               # Data Transfer Objects
│   ├── appointment.dto.js
│   ├── debt.dto.js
│   ├── patient.dto.js
│   └── record.dto.js
├── modules/           # Feature modules (components + module-level services)
│   ├── archive/       # Archive tab
│   ├── calendar/      # Calendar/appointments tab
│   ├── debts/         # Debt management
│   ├── patients/      # Patient management
│   ├── profits/       # Profit tracking
│   ├── prosthetics/   # Prosthetic billing
│   ├── records/       # Record management (add/edit)
│   ├── reports/       # Financial reports
│   ├── settings/      # App settings
│   ├── treasury/      # Treasury/cash flow
│   ├── treatments/    # Treatment plans
│   └── xrays/         # X-ray gallery & upload
├── pages/             # Route-level pages
│   ├── AppShell.vue   # Main app shell (tabs, sync, notifications)
│   └── LoginPage.vue  # Authentication page
├── repositories/      # Data access layer (cache + persistence)
│   ├── base.repository.js      # Abstract repository pattern
│   ├── appointments.repository.js
│   ├── config.repository.js
│   ├── debts.repository.js
│   ├── patients.repository.js
│   └── xrays.repository.js
├── services/          # Business logic & infrastructure services
│   ├── auth.service.js         # Authentication lifecycle
│   ├── api-validation.service.js  # Payload validation layer
│   ├── auto-cleanup.service.js    # Automatic memory/cache cleanup
│   ├── background-sync.service.js # Background sync orchestration
│   ├── cache.service.js           # localStorage cache management
│   ├── db-adapter.service.js      # SQLite/IndexedDB adapter
│   ├── diagnostics.service.js     # Centralized diagnostics hub
│   ├── error.service.js           # Error classification & logging
│   ├── image-pipeline.service.js  # Image compression & blob management
│   ├── image.service.js           # Image storage & retrieval
│   ├── memory-diagnostics.service.js  # Memory usage tracking
│   ├── offline-queue.js           # Offline operation queue
│   ├── permissions.service.js     # Role-based permission checks
│   ├── r2.service.js              # Cloudflare R2 image storage
│   ├── secure-storage.service.js  # AES-256-GCM encrypted storage
│   ├── sqlite.service.js          # IndexedDB abstraction
│   ├── sqlite-native.service.js   # Capacitor SQLite (Android)
│   ├── supabase.service.js        # Supabase client & operations
│   ├── supabase-query.service.js  # Query layer with caching & dedup
│   ├── sync.service.js            # Month-based data sync
│   └── sync-queue.service.js      # Sync action queue with retry
├── stores/            # Pinia state management
│   ├── app.store.js       # Central app orchestrator
│   ├── auth.store.js      # Authentication state
│   ├── appointments.store.js
│   ├── config.store.js    # App configuration
│   ├── debts.store.js
│   ├── patients.store.js  # Patient map with fuzzy search
│   ├── records.store.js   # Records & prosthetics
│   └── sync.store.js      # Sync UI state
├── utils/             # Pure utility functions
│   ├── index.js       # Central re-exports
│   ├── debounce.js    # Debounce & throttle
│   ├── format.js      # Number/date formatting
│   ├── helpers.js     # Business logic helpers
│   ├── pagination.js  # Pagination & infinite scroll
│   ├── sanitize.js    # Input sanitization & validation
│   └── search.js      # Fuzzy search (Arabic-aware)
└── workers/           # Web Workers
    ├── compress-bridge.js    # Worker communication bridge
    └── image-compress.worker.js  # OffscreenCanvas compression
```

## Layer Architecture

```
┌─────────────────────────────────────────┐
│           Pages / Components            │  ← Vue SFCs, user interaction
├─────────────────────────────────────────┤
│              Stores (Pinia)             │  ← Reactive state management
├─────────────────────────────────────────┤
│           Domain Aggregation            │  ← Clean imports, domain boundaries
├──────────┬──────────┬───────────────────┤
│   DTOs   │  Repos   │    Services       │  ← Data mapping, persistence, logic
├──────────┴──────────┴───────────────────┤
│        Infrastructure Services          │  ← DB adapters, auth, sync, storage
├─────────────────────────────────────────┤
│    Supabase / SQLite / IndexedDB / R2   │  ← External storage
└─────────────────────────────────────────┘
```

## Key Design Patterns

### Offline-First
- All data mutations write locally first (optimistic updates)
- Sync queue batches changes for server push
- Month-based conflict resolution via `_mod` timestamps
- Background sync every 30 seconds when online

### Dual-Database
- **Web**: IndexedDB via `sqlite.service.js`
- **Android**: Capacitor SQLite via `sqlite-native.service.js`
- `db-adapter.service.js` selects the right implementation at runtime

### Image Pipeline
- Multi-quality compression (150px/400px/1200px)
- Web Worker bridge for OffscreenCanvas (non-blocking)
- Blob URL lifecycle management to prevent memory leaks
- R2 cloud storage with Authorization header authentication

### Security
- AES-256-GCM session encryption via Web Crypto API
- Token refresh with mutex, backoff, and loop prevention
- Input sanitization on all text fields (XSS prevention)
- Role-based permission checks

### Performance
- `shallowRef` for large collections (records, debts, appointments)
- Memoized computed chains to prevent cascading reactivity
- LazyImage with IntersectionObserver for progressive loading
- VirtualScroll for large lists
- Memory diagnostics with automatic cleanup under pressure

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Service | `kebab-case.service.js` | `auth.service.js` |
| Store | `kebab-case.store.js` | `app.store.js` |
| Repository | `kebab-case.repository.js` | `debts.repository.js` |
| DTO | `kebab-case.dto.js` | `record.dto.js` |
| Composable | `camelCase.js` | `useMemoized.js` |
| Component | `PascalCase.vue` | `LazyImage.vue` |
| Utility | `kebab-case.js` | `sanitize.js` |
| Worker | `kebab-case.worker.js` | `image-compress.worker.js` |

## Service Dependency Graph

```
AppShell.vue
  ├── app.store → sync.service, cache.service, background-sync.service
  ├── auth.store → auth.service → supabase.service, secure-storage.service
  ├── memory-diagnostics.service → image-pipeline.service, image.service
  ├── auto-cleanup.service → image-pipeline.service, compress-bridge
  └── diagnostics.service → (aggregates all services)

Records/Debts/Appointments stores
  ├── sync.service (dirty flag management)
  ├── sync-queue.service (action queue)
  └── sanitize.js (input validation)

Image Pipeline
  ├── compress-bridge → image-compress.worker
  ├── image.service → image-pipeline.service
  └── r2.service → supabase.service (token management)
```
