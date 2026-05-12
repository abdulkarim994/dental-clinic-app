# Performance Report

**Generated:** 2026-05-12

## Build Performance

| Metric | Before | After |
|--------|--------|-------|
| Total modules | 160 | 161 |
| Build time | ~640ms | ~620ms |
| Bundle size (vendor) | 377.88 KB | 380.02 KB (+2.14 KB) |
| Bundle size (gzip) | 114.34 KB | 114.95 KB (+0.61 KB) |

The 2KB increase in vendor chunk is from the new services (permissions, diagnostics, validation). This is negligible relative to the total bundle.

## Reactivity Optimizations

### shallowRef Migration
| Store | Array | Previous | After | Impact |
|-------|-------|----------|-------|--------|
| records | records[] | `ref()` (deep) | `shallowRef()` | Eliminates deep proxy on potentially 1000+ records |
| records | prosthetics[] | `ref()` (deep) | `shallowRef()` | Same |
| debts | debts[] | `ref()` (deep) | `shallowRef()` | Eliminates deep proxy on debt objects |
| appointments | appointments[] | `ref()` (deep) | `shallowRef()` | Eliminates deep proxy on appointment objects |

**Expected improvement:** For a clinic with 500 records, `shallowRef` avoids creating ~500 recursive Proxy objects per array reassignment. This is particularly impactful on Android WebView where proxy creation is 3-5x slower than desktop Chrome.

### Computed Chain Preservation
Existing optimizations preserved:
- `useMemoizedArray()` in `patients.store.js` prevents downstream reactivity on unchanged arrays
- `_patMapCache` / `_patMapCacheKey` in patient map computation prevents recomputation when data hasn't changed
- `keep-alive :max="5"` in AppShell preserves mounted component state

## Memory Management

### Automatic Cleanup Thresholds
| Resource | Threshold | Action |
|----------|-----------|--------|
| Stale cache entries | > 7 days old | Remove from localStorage |
| Blob URL count | > 60 total | Revoke all blob URLs |
| Idle worker | > 2 minutes | Terminate worker thread |
| Cleanup interval (normal) | Every 5 minutes | Run cleanup cycle |
| Cleanup interval (pressure) | Every 1 minute | Run pressure cleanup |

### Memory Pressure Detection
- `PressureObserver` API (when available)
- JS heap usage > 85% of limit
- Blob URL count > 80
- Falls back gracefully on unsupported platforms

## Image Pipeline Performance (Unchanged)
| Quality | Max Width | JPEG Quality | Use Case |
|---------|-----------|-------------|----------|
| Thumbnail | 150px | 0.6 | List views, cards |
| Medium | 400px | 0.7 | Gallery preview |
| Full | 1200px | 0.8 | Viewer/detail |

Web Worker compression prevents UI thread blocking during image processing.
