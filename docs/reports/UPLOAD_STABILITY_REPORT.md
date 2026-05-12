# Upload Stability Report

**Generated:** 2026-05-12

## Image Upload Pipeline

### Architecture
```
XrayUploader.vue → image-pipeline.service → compress-bridge (Worker) → r2.service → Cloudflare R2
```

### Resilience Features

| Feature | Implementation | Status |
|---------|---------------|--------|
| Upload retry | 2 retries with progressive backoff (1s, 2s) | Active |
| Upload timeout | 60 seconds per attempt | Active |
| AbortController | Per-request signal with cleanup | Active |
| Token refresh before upload | `refreshToken()` called per attempt | Active |
| Multi-quality compression | 150px/400px/1200px before upload | Active |
| Worker-based compression | OffscreenCanvas in Web Worker | Active |
| Worker fallback | Main-thread compression if Worker unavailable | Active |
| Worker idle cleanup | Auto-terminate after 2 min idle | Active (Phase 4) |
| Blob URL tracking | Set-based tracking for lifecycle management | Active |
| Blob URL auto-cleanup | Revoke when count > 60 | Active (Phase 4) |

### Offline Upload Recovery

| Scenario | Behavior |
|----------|----------|
| Network disconnect during upload | Retry 2x, then throw → caller can re-queue |
| App close during upload | AbortController cancels in-flight request |
| Android backgrounding | Capacitor lifecycle handles pause/resume |
| Crash during upload | Sync queue persists pending actions to SQLite |

### Sync Queue Protection
- All data mutations are enqueued to `sync-queue.service.js`
- Queue persists in SQLite (native) or IndexedDB (web)
- Exponential backoff: 1s base, max 30s
- Deduplication by action+table+record_id
- Failed actions quarantined after max retries
- Queue stats available via `getQueueStats()`

### Android Memory Safety
- Image compression happens in Web Worker (not UI thread)
- 30-second timeout per compression job
- Automatic worker termination after 2 minutes idle
- `shallowRef` for image arrays reduces GC pressure
- Blob URL cleanup prevents WebView OOM
- Memory pressure monitoring triggers aggressive cleanup
