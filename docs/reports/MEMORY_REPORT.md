# Memory Report

**Generated:** 2026-05-12

## Memory Monitoring Infrastructure

### Diagnostics Service (`memory-diagnostics.service.js`)
Periodic sampling at 30-second intervals, rolling buffer of 60 snapshots (30 minutes of history).

#### Tracked Metrics
| Metric | Source | Unit |
|--------|--------|------|
| Pipeline blob URLs | `image-pipeline.service.getActiveBlobUrlCount()` | Count |
| Image service blob URLs | `image.service.getTrackedBlobCount()` | Count |
| X-ray storage estimate | `image-pipeline.service.estimateXrayStorageUsage()` | Bytes |
| localStorage entries | `localStorage.length` | Count |
| localStorage size | Character count × 2 | Bytes |
| JS heap used | `performance.memory.usedJSHeapSize` | MB |
| JS heap total | `performance.memory.totalJSHeapSize` | MB |
| JS heap limit | `performance.memory.jsHeapSizeLimit` | MB |
| Dental cache entries | Keys matching `dental_*` | Count |
| CPU pressure | `PressureObserver` | State (nominal/fair/serious/critical) |

### Automatic Warnings
| Condition | Warning |
|-----------|---------|
| Total blob URLs > 50 | "High blob URL count" |
| localStorage > 4 MB | "localStorage nearing limit" |
| JS heap > 100 MB | "High JS heap usage" |

## Cleanup Service (`auto-cleanup.service.js`)

### Cleanup Operations
| Operation | Trigger | Effect |
|-----------|---------|--------|
| Stale cache cleanup | Entry `_ts` > 7 days old | Remove localStorage key + timestamp |
| Orphaned thumbnail cleanup | Thumbnail key with no matching xray key | Remove from localStorage |
| Blob URL revocation | Total count > 60 | `revokeAllBlobUrls()` on both services |
| Worker termination | Idle > 2 minutes | `terminateWorker()` |

### Scheduling
- Normal mode: every 5 minutes
- Pressure mode: every 1 minute (when `isMemoryPressureHigh()` returns true)
- Initial cleanup: deferred via `requestIdleCallback` (10s timeout) to avoid startup impact

## Android WebView Safety

All memory operations are Android-safe:
- No `performance.measureUserAgentSpecificMemory()` (crashes WebView)
- `PressureObserver` wrapped in try/catch (not supported in most WebViews)
- `performance.memory` used as Chrome-specific extension with null fallback
- Blob URL cleanup prevents the unbounded memory growth that crashes Android
- Worker termination frees native thread resources
- `shallowRef` reduces proxy overhead that causes Android GC pressure

## Memory Leak Prevention

| Leak Vector | Prevention |
|-------------|------------|
| Blob URLs never revoked | Tracked in Sets, revoked on cleanup/unmount |
| Workers kept alive indefinitely | Idle timeout + unmount termination |
| Event listeners not removed | All listeners cleaned in `onUnmounted` |
| Timers not cleared | All intervals/timeouts cleared on unmount |
| Stale cache growth | 7-day TTL auto-removal |
| Deep reactive proxies on large arrays | `shallowRef` eliminates proxy chains |
