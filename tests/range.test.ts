import { describe, expect, it } from 'vitest'
import { getVisibleRange } from '../src/utils/virtualMessageRange'

describe('virtual message ranges', () => {
  it('handles empty lists, the last row and measured nonuniform heights', () => {
    expect(getVisibleRange([0], 0, 500)).toEqual({ start: 0, end: 0 })
    expect(getVisibleRange([0, 20, 1020, 1040], 1000, 40, 0)).toEqual({ start: 1, end: 3 })
    expect(getVisibleRange([0, 20, 1020, 1040], 1040, 500, 0)).toEqual({ start: 2, end: 3 })
  })
  it('renders only a bounded window for 10000 messages', () => {
    const offsets = Array.from({ length: 10001 }, (_, i) => i * 100)
    for (let top = 0; top < 1000000; top += 5000) {
      const range = getVisibleRange(offsets, top, 600)
      expect(range.end - range.start).toBeLessThanOrEqual(23)
      expect(offsets[range.start]).toBeLessThanOrEqual(top)
      expect(offsets[range.end]).toBeGreaterThanOrEqual(top + 600)
    }
  })
})
