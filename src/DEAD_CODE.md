# Dead Code Manifest — Phase 6 Trace Analysis

Files/exports confirmed unused via import trace analysis (2026-05-10).
These can be safely removed in a future cleanup pass.

## Unused Files (no imports found)

| File | Reason |
|------|--------|
| `composables/useDebounce.js` | Not imported anywhere. `utils/debounce.js` is used instead. |
| `composables/useMemoized.js` | Not imported anywhere. Manual caching used in stores instead. |
| `composables/useVirtualGallery.js` | Not imported anywhere. `XrayGallery.vue` inlines its own virtualization. |
| `utils/icons.js` | Not imported anywhere. Component-based icons (`components/icons/`) used instead. |

## Unused Exports

| File | Export | Reason |
|------|--------|--------|
| `utils/pagination.js` | `usePagination`, `useInfiniteScroll`, `paginate` | Not imported anywhere. `VirtualScroll` component used instead. |
| `utils/debounce.js` | `throttle` | Not imported anywhere. Only `debounce` is used. |
| `utils/format.js` | `formatDate`, `getMonthFromDate` | Not imported anywhere. |

## Notes
- Do NOT delete until confirmed in a regression test pass.
- These were added during Phases 1-4 as utilities that were later superseded.
