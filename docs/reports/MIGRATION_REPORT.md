# Migration Report

**Generated:** 2026-05-12

## Changes by Phase

### Phase 4 — Optimization
| File | Change Type | Risk |
|------|------------|------|
| `stores/records.store.js` | `ref()` → `shallowRef()`, added `batchSetRecords()` | Low — immutable patterns already used |
| `stores/debts.store.js` | `ref()` → `shallowRef()` | Low |
| `stores/appointments.store.js` | `ref()` → `shallowRef()` | Low |
| `services/memory-diagnostics.service.js` | New file | None — additive |
| `services/auto-cleanup.service.js` | New file | Low — cleanup thresholds are conservative |
| `pages/AppShell.vue` | Added lifecycle hooks for diagnostics/cleanup | Low |
| `workers/compress-bridge.js` | Added worker usage tracking | None |

### Phase 5 — Security Hardening
| File | Change Type | Risk |
|------|------------|------|
| `services/auth.service.js` | Mutex refresh, loop prevention, stale detection | Medium — auth-critical path |
| `stores/auth.store.js` | Permission integration, crash recovery | Medium — auth state management |
| `services/permissions.service.js` | New file | None — additive |
| `services/api-validation.service.js` | New file | None — additive |
| `utils/sanitize.js` | Extended sanitization rules | Low — broadens existing filters |

### Phase 6 — Enterprise Cleanup
| File | Change Type | Risk |
|------|------------|------|
| `modules/appointments/` | Removed empty directory | None |
| `modules/sync/` | Removed empty directory | None |
| `modules/auth/` | Removed empty directory | None |
| `services/diagnostics.service.js` | New file | None — additive |
| `services/index.js` | New file | None — additive |
| `services/error.service.js` | Added `getErrorStats()` | None |
| `services/sync-queue.service.js` | Added `getQueueStats()` | None |
| `utils/index.js` | Extended exports | None |
| `docs/ARCHITECTURE.md` | New file | None |

## Backward Compatibility

All changes are backward compatible:
- No existing imports broken
- No function signatures changed
- No data format changes
- `shallowRef` is safe because all stores already use immutable array patterns (spread + reassign)
- New services are opt-in (not auto-invoked except memory diagnostics in AppShell)
