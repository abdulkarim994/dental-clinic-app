# 🔍 CUMULATIVE SYSTEM AUDIT REPORT
## Dental Clinic App — Phase 1 → Phase 5

**Date:** 2026-05-10  
**Scope:** Full system audit across all implemented phases  
**Build Status:** ✅ Passes (`vite build` — 153 modules, 0 errors)

---

## 📐 ARCHITECTURE SUMMARY (Current State)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DENTAL CLINIC APP                             │
│                    Vue 3 + Vite 8 + Pinia + Capacitor                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │  LoginPage   │  │  AppShell   │  │ SettingsModal│                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
│         │                │                │                          │
│  ┌──────┴────────────────┴────────────────┴──────────┐               │
│  │              ROUTE-LEVEL MODULES (lazy loaded)     │               │
│  │  AddRecord │ Records │ Treasury │ Archive │ Debts  │               │
│  │  Profits   │ Patients│ Calendar │ XRays   │ ...    │               │
│  └──────────────────────┬────────────────────────────┘               │
│                         │                                            │
│  ┌──────────────────────┴────────────────────────────┐               │
│  │              PINIA STATE MANAGEMENT                │               │
│  │  app.store │ auth.store │ records.store │ ...      │               │
│  └──────────────────────┬────────────────────────────┘               │
│                         │                                            │
│  ┌──────────────────────┴────────────────────────────┐               │
│  │              SERVICE LAYER                         │               │
│  │                                                    │               │
│  │  ┌──────────────┐  ┌──────────────┐               │               │
│  │  │ sync.service  │  │ auth.service │               │               │
│  │  │ (month-based  │  │ (token       │               │               │
│  │  │  conflict-    │  │  refresh,    │               │               │
│  │  │  safe merge)  │  │  restore)    │               │               │
│  │  └──────┬───────┘  └──────┬───────┘               │               │
│  │         │                 │                        │               │
│  │  ┌──────┴───────┐  ┌─────┴────────┐               │               │
│  │  │ supabase     │  │ secure-      │               │               │
│  │  │ .service     │  │ storage      │               │               │
│  │  │ (retry,      │  │ (AES-GCM)    │               │               │
│  │  │  dedup,      │  └──────────────┘               │               │
│  │  │  abort)      │                                  │               │
│  │  └──────────────┘                                  │               │
│  │                                                    │               │
│  │  ┌──────────────────────────────────────┐          │               │
│  │  │         OFFLINE-FIRST LAYER          │          │               │
│  │  │                                      │          │               │
│  │  │  db-adapter.service                  │          │               │
│  │  │  ┌─────────────┬─────────────┐       │          │               │
│  │  │  │ SQLite      │ IndexedDB   │       │          │               │
│  │  │  │ (Android)   │ (Web/Win)   │       │          │               │
│  │  │  └─────────────┴─────────────┘       │          │               │
│  │  │                                      │          │               │
│  │  │  ┌──────────────────────────┐        │          │               │
│  │  │  │ Repositories (CRUD)      │        │          │               │
│  │  │  │ patients │ appointments  │        │          │               │
│  │  │  │ xrays    │ base          │        │          │               │
│  │  │  └──────────────────────────┘        │          │               │
│  │  │                                      │          │               │
│  │  │  ┌──────────────────────────┐        │          │               │
│  │  │  │ Sync Queues              │        │          │               │
│  │  │  │ sync-queue (new, robust) │        │          │               │
│  │  │  │ offline-queue (old, LS)  │        │          │               │
│  │  │  └──────────────────────────┘        │          │               │
│  │  └──────────────────────────────────────┘          │               │
│  │                                                    │               │
│  │  ┌──────────────────────────────────────┐          │               │
│  │  │       IMAGE PIPELINE                 │          │               │
│  │  │ image-pipeline │ image.service       │          │               │
│  │  │ r2.service     │ Web Worker          │          │               │
│  │  │ compress-bridge│ LazyImage           │          │               │
│  │  └──────────────────────────────────────┘          │               │
│  └────────────────────────────────────────────────────┘               │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                     │
│  │ Supabase   │  │ Cloudflare │  │ Capacitor  │                     │
│  │ (Auth + KV │  │ R2         │  │ (Android/  │                     │
│  │  Storage)  │  │ (X-rays)   │  │  iOS/Win)  │                     │
│  └────────────┘  └────────────┘  └────────────┘                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ STABILITY AUDIT

### ✅ What Works Well
- **Build passes** — 153 modules compile successfully with Vite 8 (rolldown)
- **Router** — All routes use dynamic imports (lazy loading), proper auth guard
- **Component lifecycle** — Proper `onUnmounted` cleanup in AppShell, LazyImage, VirtualScroll
- **Error boundaries** — All async operations wrapped in try/catch with console logging
- **Capacitor config** — Proper SQLite plugin configuration for Android
- **Keep-alive** — Route views cached with `max=5` limit (prevents unbounded memory)
- **Back button handler** — Android popstate handled correctly
- **Realtime cleanup** — Supabase channel properly removed on unmount

### ⚠️ Stability Risks

| # | Risk | Severity | Location | Details |
|---|------|----------|----------|---------|
| S1 | Background sync not activated | Medium | `app.store.js` | `initBackgroundSync()` is defined and exported but **never called** in AppShell.vue or App.vue. The new sync queue (30s interval, online/offline listeners from `background-sync.service.js`) is inactive. Only the old `setInterval` sync runs. |
| S2 | Dual sync queue coexistence | Medium | AppShell.vue + stores | Stores enqueue to `sync-queue.service.js` (new), but AppShell's reconnect handler uses `offline-queue.js` (old). The old queue is `localStorage`-based and only processes via `syncSave()`, not individual queue items. New queue items may remain unprocessed until `background-sync.service.js` is activated. |
| S3 | `_dirtyMonths` cleared before save completes | High | `sync.service.js:128` | `_dirtyMonths.clear()` executes BEFORE `await Promise.all(ops)`. If the Promise.all fails, dirty month tracking is lost and those months won't be retried on next save. |
| S4 | `_debtsDirty`/`_apptsDirty` reset before save completes | High | `sync.service.js:119,125` | Same pattern — dirty flags reset inside `try` block before the async operations complete. |

---

## 2️⃣ DATA INTEGRITY AUDIT

### ✅ What Works Well
- **Conflict resolution** — `mergeByMod()` in sync.service.js merges by `_mod` timestamp (last-write-wins per record)
- **Conflict-safe upsert** — `conflictSafeUpsert()` checks server timestamp before overwriting
- **Data validation** — `validateRecords/Debts/Appointments/Config` in sanitize.js filter invalid records
- **Input sanitization** — XSS prevention via `sanitizeInput()` on all text fields
- **Supabase as source of truth** — Data always loaded from Supabase, local cache used for offline only
- **Soft deletes** — SQLite uses `_deleted` flag, preserving records for sync
- **Transaction support** — Native SQLite has `transaction()` for batch operations

### ⚠️ Data Integrity Risks

| # | Risk | Severity | Location | Details |
|---|------|----------|----------|---------|
| D1 | Dirty flags lost on save failure | High | `sync.service.js:119-128` | As noted in S3/S4 — if Supabase save fails, the dirty state (`_dirtyMonths`, `_debtsDirty`, `_apptsDirty`) is already cleared. Data changes may not be retried. **Fix:** Move flag clearing AFTER `await Promise.all(ops)`. |
| D2 | New sync queue items not processed on reconnect | Medium | AppShell.vue:245-247 | On reconnect, only `offline-queue.js` processes. The new `sync-queue.service.js` items (added by Pinia stores) sit idle. They'll only process if `background-sync.service.js` is activated, which it currently is not (S1). |
| D3 | Patient ID is the patient name | Low | `patients.repository.js:75` | `id: name` — patient identity is their name string. Name changes would create duplicates. This appears to be the existing design (not a regression). |
| D4 | `cacheFromRecords` overwrites with latest records only | Low | `patients.repository.js:68-96` | When caching patients from Supabase records, only data from current records is used. Historical patient data not in current records won't appear in the offline cache. This is by design (cache layer, not source of truth). |

---

## 3️⃣ PERFORMANCE AUDIT

### ✅ What Works Well
- **Code splitting** — Route-level dynamic imports in router
- **Manual chunks** — Supabase, Vue vendor, xlsx, offline-layer, image-services separated
- **Virtual scrolling** — `VirtualScroll` component used in Records, Debts, and Patients tabs
- **Lazy images** — `LazyImage` component with IntersectionObserver (200px rootMargin)
- **Virtual gallery** — `useVirtualGallery` composable for image grids
- **Web Worker** — Image compression runs off main thread via `compress-bridge.js`
- **Memoization** — `patientMap` in patients.store.js uses manual caching
- **Debounced realtime** — Supabase realtime events debounced to 5 seconds
- **Prefetch** — Adjacent tab modules prefetched via `requestIdleCallback`

### ⚠️ Performance Risks

| # | Risk | Severity | Location | Details |
|---|------|----------|----------|---------|
| P1 | Module chunks not separating | Medium | `vite.config.js` / build output | Vite 8 (rolldown) produces only 7 JS chunks. The `manualChunks` config defines 13+ module-specific chunks, but output shows them merged. Route lazy loading still works (dynamic imports), but initial chunk may be larger than expected. |
| P2 | `xlsx` at 283KB (94KB gzip) | Low | Build output | Large dependency used only for settings export. Consider dynamic import only when export is triggered. Currently in separate chunk, so it's lazy-loaded. ✅ Already handled. |
| P3 | `image-services` at 205KB (53KB gzip) | Medium | Build output | Seems large for image pipeline code. May include transitive dependencies. Worth investigating what's bundled. |
| P4 | `patientMap` cache key is simplistic | Low | `patients.store.js:22` | Cache key uses `${recs.length}:${pros.length}:...`. If a record is **updated** (not added/removed), the length doesn't change, and the cache may serve stale data. The `_mod` of first record is included, but only the first. |
| P5 | `usePagination`/`useInfiniteScroll` not used | Low | `pagination.js` | These utilities exist but are not imported anywhere. The app relies on VirtualScroll instead, which is fine. Dead code. |
| P6 | `useMemoized` composable not used | Low | `composables/useMemoized.js` | Defined but not imported in any component/store. Dead code. |

### 📊 Build Size Analysis

| Chunk | Size | Gzip | Contents |
|-------|------|------|----------|
| `vue-vendor` | 375 KB | 113 KB | Vue 3, Pinia, Vue Router |
| `xlsx` | 283 KB | 94 KB | XLSX export library |
| `image-services` | 205 KB | 53 KB | Image pipeline + R2 service |
| `index.css` | 68 KB | 13 KB | All CSS (Tailwind + custom) |
| `offline-layer` | 34 KB | 9 KB | SQLite, DB adapter, repositories |
| `web` | 9.5 KB | 1.3 KB | App modules + Supabase |
| **Total JS** | **~909 KB** | **~272 KB** | |

---

## 4️⃣ SECURITY AUDIT

### ✅ What Works Well
- **Token encryption at rest** — AES-256-GCM via Web Crypto API for session storage
- **Token refresh lifecycle** — Scheduled 5 minutes before expiry, auto-refresh
- **Session crash recovery** — `restoreSessionFromSecureStorage()` recovers from lost Supabase sessions
- **Auth error handler** — Centralized detection of expired tokens, auto-redirect to login
- **Input sanitization** — XSS prevention on all user text fields
- **Script tag stripping** — `sanitizeInput()` removes `<script>` and `on*=""` handlers
- **Secure image fetch** — `fetchImageSecure()` uses Authorization headers instead of URL tokens
- **Logout cleanup** — Timer cleared, session cleared, Supabase signOut called, pending requests cleared

### ⚠️ Security Risks

| # | Risk | Severity | Location | Details |
|---|------|----------|----------|---------|
| X1 | AES key stored in localStorage | Medium | `secure-storage.service.js:21-28` | The encryption key (`_ds_ck`) is stored in localStorage as base64. Any JavaScript with localStorage access can decrypt the "secure" data. Provides obfuscation but not true security against XSS. Standard trade-off for client-side encryption. |
| X2 | Auth token in image URL | Medium | `r2.service.js:16` | `r2Url()` embeds `getSbToken()` in the URL query string. Tokens leak in browser history, HTTP referrer headers, and server logs. The secure alternative `fetchImageSecure()` exists but is **not used** anywhere in the app. |
| X3 | `remember` checkbox has no effect | Low | `LoginPage.vue:103` | The `remember` ref is defined but never passed to any auth function. Sessions are always persisted via `secureSetSession()`. UI suggests a choice that doesn't exist. |
| X4 | Supabase anon key hardcoded | Info | `supabase.service.js:3-4` | URL and anon key have hardcoded fallback values. This is standard Supabase practice (anon keys are public), but should use env vars exclusively in production builds. |
| X5 | No CSP headers configured | Low | N/A | No Content Security Policy configured. For a Capacitor app, this is less critical but still recommended. |

---

## 5️⃣ CROSS-PHASE INTEGRATION AUDIT

### Data Flow Path (Current)

```
User Action
    ↓
Pinia Store (records/debts/appointments)
    ↓ optimistic update to reactive state
    ├── sync-queue.service.js (enqueue for later sync) ← NEW, NOT PROCESSED
    ├── sync.service.js (markMonthDirty/markDebtsDirty) ← dirty flag tracking
    └── cache.service.js (localStorage + IndexedDB) ← immediate cache
    
Manual/Auto Sync (every N minutes via setInterval)
    ↓
sync.service.js → saveToSupabase() → Supabase KV upsert
    ↓
loadFromSupabase() → Pinia stores updated
    ↓
cache.service.js → cacheSaveAll() → localStorage + IndexedDB + repository layer

Reconnect (online event)
    ↓
offline-queue.js → processQueue() → syncSave() ← OLD QUEUE ONLY
```

### Integration Issues

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| I1 | `background-sync.service.js` inactive | The 30s interval sync, online/offline queue processing, and optimistic write pipeline are built but not activated. | Call `initBackgroundSync()` in AppShell's `onMounted` with a proper sync handler. |
| I2 | `supabase-query.service.js` unused | The enhanced query layer with typed builders, batch operations, and improved abort handling is built but not imported anywhere. | Migrate high-traffic queries incrementally to use `queries.*` helpers. |
| I3 | `fetchImageSecure()` unused | The secure image fetching (Authorization header) is built but never called. All images use `r2Url()` with token in URL. | Replace `r2Url()` usage in components with `fetchImageSecure()` for security. |
| I4 | `useMemoized` composable unused | Built but not imported. | Apply to heavy computed properties or remove dead code. |
| I5 | `usePagination`/`useInfiniteScroll` unused | Built but not imported. VirtualScroll used instead. | Remove or integrate where VirtualScroll is inappropriate. |

---

## 6️⃣ PRODUCTION READINESS VERDICT

### ✅ SYSTEM IS FUNCTIONAL FOR PRODUCTION

The application is currently operational and serving users. The core data flow (Supabase ↔ local cache ↔ UI) works correctly. All phases have been implemented with care to avoid breaking changes.

### ⚠️ BUT — Action Required Before Full Confidence

#### 🔴 Must Fix (Data Loss Risk)

1. **D1: Move dirty flag clearing AFTER successful save** (`sync.service.js:119-128`)
   - Current code clears `_dirtyMonths`, `_debtsDirty`, `_apptsDirty` BEFORE the Supabase operations complete
   - If the save fails, those changes are silently lost
   - **Fix: Move lines 119, 125, 128 to after `await Promise.all(ops)` succeeds**

#### 🟡 Should Fix (Functionality Gaps)

2. **I1: Activate background-sync.service.js** — The robust sync queue with exponential backoff, deduplication, and quarantine is built but not connected. Currently the stores enqueue sync actions that are never processed.

3. **X2: Use `fetchImageSecure()` instead of `r2Url()`** — Token-in-URL is a security concern. The secure alternative already exists.

4. **S2: Connect reconnect handler to new sync queue** — On reconnect, process both old and new sync queues.

#### 🟢 Nice to Have (Optimization)

5. Remove dead code (`useMemoized`, `usePagination`, `useInfiniteScroll`)
6. Connect `remember` checkbox to actual functionality or remove it
7. Investigate `image-services` chunk size (205KB)
8. Improve `patientMap` cache key to detect record updates

---

## 7️⃣ IMPROVEMENTS NOT YET IMPLEMENTED

| Feature | Status | Notes |
|---------|--------|-------|
| Phase 6: Architecture Cleanup | ❌ Not started | Per instructions, deferred until after this audit |
| Full SQLite migration | ⚠️ Partial | Native SQLite works on Android; IndexedDB used on web. Both coexist. |
| Background sync activation | ⚠️ Built, not activated | `background-sync.service.js` ready but `initBackgroundSync()` not called |
| Enhanced Supabase queries | ⚠️ Built, not integrated | `supabase-query.service.js` exists but not imported by app code |
| Secure image fetching | ⚠️ Built, not used | `fetchImageSecure()` exists but not called |
| Per-module chunk separation | ⚠️ Config exists, not effective | Vite 8/rolldown merges module chunks |

---

## 8️⃣ FILES INVENTORY

### Services (15 files)
| File | Purpose | Phase |
|------|---------|-------|
| `sqlite.service.js` | IndexedDB cache layer (web) | P1 |
| `sqlite-native.service.js` | Capacitor SQLite (native) | P1 |
| `db-adapter.service.js` | Platform routing (SQLite vs IDB) | P1 |
| `sync.service.js` | Month-based Supabase sync | P1 |
| `sync-queue.service.js` | Enhanced sync queue | P1 |
| `background-sync.service.js` | Background queue processor | P1 |
| `offline-queue.js` | Legacy localStorage queue | Pre |
| `cache.service.js` | Multi-layer caching | Pre |
| `supabase.service.js` | Supabase client + retry | P2 |
| `supabase-query.service.js` | Enhanced query builders | P2 |
| `image-pipeline.service.js` | Image processing pipeline | P3 |
| `image.service.js` | Image management | P3 |
| `r2.service.js` | Cloudflare R2 integration | Pre |
| `auth.service.js` | Auth + token lifecycle | P5 |
| `secure-storage.service.js` | AES-GCM encrypted storage | P5 |

### Repositories (4 files)
| File | Purpose | Phase |
|------|---------|-------|
| `base.repository.js` | Abstract CRUD base | P1 |
| `patients.repository.js` | Patient local cache | P1 |
| `appointments.repository.js` | Appointment local cache | P1 |
| `xrays.repository.js` | X-ray metadata + thumbnails | P1 |

### Stores (7 files)
| File | Purpose | Phase |
|------|---------|-------|
| `app.store.js` | Central orchestrator | Pre |
| `auth.store.js` | Auth state | P5 |
| `records.store.js` | Records + prosthetics | Pre |
| `debts.store.js` | Debts management | Pre |
| `appointments.store.js` | Appointments | Pre |
| `config.store.js` | App configuration | Pre |
| `sync.store.js` | Sync UI state | Pre |

---

## CONCLUSION

The system is a well-structured, production-capable dental clinic management application. Phases 1-5 have been implemented incrementally with respect for the existing codebase. The primary concern is the **D1 dirty flag bug** which could cause data loss on failed saves. The secondary concern is that several Phase 1-2 components (`background-sync`, `supabase-query`, `fetchImageSecure`) are built but not activated — meaning the app runs on the older, simpler sync path. This is safe but doesn't utilize the improvements that were built.

**The system is functional for production with the caveat that bug D1 should be fixed before any further development.**
