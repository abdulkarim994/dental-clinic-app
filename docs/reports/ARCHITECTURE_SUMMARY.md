# Architecture Summary Report

**Generated:** 2026-05-12  
**Phases:** 4 (Optimization), 5 (Security), 6 (Enterprise Cleanup), Final Integration

## Architecture Overview

The dental clinic app follows an offline-first, layered architecture:

```
Pages → Stores (Pinia) → Domains → DTOs/Repos/Services → Infrastructure → Supabase/SQLite/IndexedDB/R2
```

## Key Systems

| System | Files | Status |
|--------|-------|--------|
| State Management | 8 Pinia stores | Optimized (shallowRef, memoized computeds) |
| Data Sync | sync.service, background-sync, sync-queue | Production-ready with conflict resolution |
| Image Pipeline | image-pipeline, image.service, compress-bridge | Multi-quality, worker-based, memory-managed |
| Authentication | auth.service, auth.store, secure-storage | Hardened (mutex refresh, loop prevention, crash recovery) |
| Diagnostics | memory-diagnostics, auto-cleanup, diagnostics | Full lifecycle monitoring |
| Permissions | permissions.service | Role-based, centralized |
| Validation | api-validation, sanitize.js | Input sanitization + payload validation |
| Error Handling | error.service | Classified logging with rolling buffer |

## Module Count

- **Services:** 23 files
- **Stores:** 8 files
- **Composables:** 4 files
- **Repositories:** 6 files
- **DTOs:** 5 files (including index)
- **Domains:** 4 aggregate indexes
- **Feature Modules:** 12 modules (archive, calendar, debts, patients, profits, prosthetics, records, reports, settings, treasury, treatments, xrays)
- **Workers:** 2 files
- **Utils:** 7 files (including index)

## Build Output

- Total modules: 161
- Build time: ~620ms
- Largest chunk: vue-vendor (380KB / 115KB gzip)
- Image services chunk: 251KB / 65KB gzip (lazy-loaded)
