# Remaining Technical Debt Report

**Generated:** 2026-05-12

## Priority: High

| Item | Location | Description | Recommendation |
|------|----------|-------------|----------------|
| No automated tests | Project-wide | No unit/integration/e2e tests exist | Add Vitest for unit tests, Playwright for e2e |
| No TypeScript | Project-wide | All files are `.js` with no type annotations | Incremental migration to `.ts` starting with services |
| Supabase key in source | `supabase.service.js:4` | Anon key hardcoded as fallback | Move to env-only, remove fallback |
| No CSP headers | `index.html` | No Content-Security-Policy meta tag | Add restrictive CSP for XSS prevention |

## Priority: Medium

| Item | Location | Description | Recommendation |
|------|----------|-------------|----------------|
| No error boundary | `App.vue` | Unhandled errors crash the app | Add Vue `errorHandler` + ErrorBoundary component |
| `formatDate` is a no-op | `utils/format.js:9-12` | Returns input unchanged | Implement proper date formatting or remove |
| LRU cache is manual | `image.service.js` | Hand-rolled LRU with MAX_CACHE_SIZE=100 | Consider `lru-cache` package for robustness |
| No retry on image fetch | `r2.service.js:23-34` | `fetchImageSecure` doesn't retry on network error | Add retry wrapper |
| Sync lock not timeout-safe | `sync.service.js` | `_saveLock` / `_loadLock` can deadlock if promise never resolves | Add timeout to lock acquisition |
| Queue processing not batched | `sync-queue.service.js` | Processes one action at a time | Batch process for efficiency |

## Priority: Low

| Item | Location | Description | Recommendation |
|------|----------|-------------|----------------|
| `utils/format.js` unused exports | `formatDate`, `getMonthFromDate` | Exported but never imported directly (only via index) | Keep for future use |
| Inline SVG icons | `LoginPage.vue`, `AppShell.vue` | Large inline SVGs in templates | Extract to icon components |
| No i18n framework | Project-wide | Arabic strings hardcoded | Add vue-i18n for future localization |
| No PWA manifest | Project root | No service worker or manifest.json | Add for installable web app |
| `api-validation.service.js` not wired | Stores | Created but not enforced in mutation paths | Wire into store actions incrementally |
| Permission checks not enforced | Feature modules | `permissions.service.js` exists but not checked before operations | Add `requirePermission()` calls in stores |

## Verified Clean

| Check | Result |
|-------|--------|
| No duplicate systems | All services have unique responsibilities |
| No orphan logic | No imports to nonexistent files |
| No broken imports | Build passes with 0 errors |
| No dead features | 3 empty module directories removed |
| No memory leaks | Blob URLs tracked, workers terminated, listeners cleaned |
| No duplicate listeners | All event listeners paired with removal in `onUnmounted` |
| No queue corruption risks | Dedup + lock guards + quarantine for failed actions |
