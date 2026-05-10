/**
 * Virtual Gallery Composable — Phase 3
 *
 * Provides virtualization for large image galleries to prevent DOM bloat
 * and reduce memory consumption. Only renders images that are currently
 * visible (or within a buffer zone), using IntersectionObserver for
 * smart lazy loading.
 *
 * Features:
 * - Virtual rendering: only visible items are in the DOM
 * - IntersectionObserver for lazy image loading
 * - Configurable buffer (pre-render items outside viewport)
 * - Skeleton placeholder support
 * - Automatic cleanup on unmount
 *
 * Usage:
 *   const { visibleItems, containerStyle, itemStyle, onScroll, containerRef }
 *     = useVirtualGallery(imagesRef, { itemSize: 56, columns: 5 })
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const DEFAULT_ITEM_SIZE = 56 // 52px image + 4px gap
const DEFAULT_COLUMNS = 5
const DEFAULT_BUFFER = 2 // Extra rows to render above/below viewport

/**
 * @param {import('vue').Ref<Array>} itemsRef - Reactive array of image items
 * @param {Object} options
 * @param {number} [options.itemSize=56] - Size of each item (width & height + gap)
 * @param {number} [options.columns=5] - Number of columns in the grid
 * @param {number} [options.buffer=2] - Extra rows to render outside viewport
 * @param {number} [options.containerHeight=300] - Max container height before scrolling
 */
export function useVirtualGallery(itemsRef, options = {}) {
  const itemSize = options.itemSize || DEFAULT_ITEM_SIZE
  const columns = options.columns || DEFAULT_COLUMNS
  const buffer = options.buffer || DEFAULT_BUFFER
  const maxHeight = options.containerHeight || 300

  const containerRef = ref(null)
  const scrollTop = ref(0)

  const totalRows = computed(() => Math.ceil((itemsRef.value || []).length / columns))
  const totalHeight = computed(() => totalRows.value * itemSize)

  const needsVirtualization = computed(() => totalHeight.value > maxHeight)

  const visibleRange = computed(() => {
    if (!needsVirtualization.value) {
      return { startRow: 0, endRow: totalRows.value }
    }

    const startRow = Math.max(0, Math.floor(scrollTop.value / itemSize) - buffer)
    const visibleRows = Math.ceil(maxHeight / itemSize)
    const endRow = Math.min(totalRows.value, startRow + visibleRows + buffer * 2)

    return { startRow, endRow }
  })

  const visibleItems = computed(() => {
    const items = itemsRef.value || []
    if (!items.length) return []

    const { startRow, endRow } = visibleRange.value
    const startIdx = startRow * columns
    const endIdx = Math.min(endRow * columns, items.length)

    return items.slice(startIdx, endIdx).map((item, i) => ({
      item,
      index: startIdx + i,
      row: Math.floor((startIdx + i) / columns),
      col: (startIdx + i) % columns,
    }))
  })

  const containerStyle = computed(() => {
    if (!needsVirtualization.value) return {}

    return {
      height: `${Math.min(totalHeight.value, maxHeight)}px`,
      overflow: 'auto',
      position: 'relative',
    }
  })

  const innerStyle = computed(() => {
    if (!needsVirtualization.value) return {}

    return {
      height: `${totalHeight.value}px`,
      position: 'relative',
    }
  })

  function itemStyle(row) {
    if (!needsVirtualization.value) return {}

    return {
      position: 'absolute',
      top: `${row * itemSize}px`,
    }
  }

  function onScroll(e) {
    if (e && e.target) {
      scrollTop.value = e.target.scrollTop
    }
  }

  // Reset scroll when items change dramatically
  watch(() => (itemsRef.value || []).length, (newLen, oldLen) => {
    if (Math.abs(newLen - oldLen) > columns) {
      scrollTop.value = 0
      if (containerRef.value) containerRef.value.scrollTop = 0
    }
  })

  return {
    visibleItems,
    containerStyle,
    innerStyle,
    itemStyle,
    onScroll,
    containerRef,
    needsVirtualization,
    totalHeight,
    totalRows,
  }
}

/**
 * Composable for IntersectionObserver-based lazy loading.
 * Observes elements and triggers a callback when they enter the viewport.
 *
 * Usage:
 *   const { observe, unobserve } = useLazyLoad((entry) => {
 *     // Load the image for this entry
 *   })
 */
export function useLazyLoad(onVisible, options = {}) {
  let _observer = null
  const _callbacks = new Map()

  const rootMargin = options.rootMargin || '100px'
  const threshold = options.threshold || 0.01

  onMounted(() => {
    _observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = _callbacks.get(entry.target)
          if (cb) cb(entry)
          _observer.unobserve(entry.target)
          _callbacks.delete(entry.target)
        }
      }
    }, { rootMargin, threshold })
  })

  onUnmounted(() => {
    if (_observer) {
      _observer.disconnect()
      _observer = null
    }
    _callbacks.clear()
  })

  function observe(el, callback) {
    if (!_observer || !el) return

    _callbacks.set(el, callback || onVisible)
    _observer.observe(el)
  }

  function unobserve(el) {
    if (!_observer || !el) return
    _observer.unobserve(el)
    _callbacks.delete(el)
  }

  return { observe, unobserve }
}
