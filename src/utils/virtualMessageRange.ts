/** Prefix offsets include zero and the total height. Binary search stays O(log n). */
export function getVisibleRange(offsets: number[], scrollTop: number, viewportHeight: number, overscan = 8) {
  const count = Math.max(0, offsets.length - 1)
  if (!count) return { start: 0, end: 0 }
  const locate = (position: number) => {
    let low = 0, high = count - 1
    while (low < high) {
      const mid = (low + high) >>> 1
      if (offsets[mid + 1] <= position) low = mid + 1
      else high = mid
    }
    return low
  }
  return {
    start: Math.max(0, locate(Math.max(0, scrollTop)) - overscan),
    end: Math.min(count, locate(Math.max(0, scrollTop + viewportHeight)) + 1 + overscan)
  }
}
