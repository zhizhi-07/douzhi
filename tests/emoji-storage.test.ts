import { beforeEach, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => new Map<string, any>())
vi.mock('../src/utils/indexedDBStorage', () => ({
  isIndexedDBAvailable: () => true,
  getItem: vi.fn(async (key: string) => structuredClone(db.get(key) ?? null)),
  setItem: vi.fn(async (key: string, value: any) => { db.set(key, structuredClone(value)) }),
  removeItem: vi.fn(async (key: string) => { db.delete(key) }),
}))
vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
const emoji = { id: 1, url: 'data:image/png;base64,payload', name: 'test', description: 'test', addTime: '2026-11-27', useCount: 0 }
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); db.clear(); db.set('custom_emojis', [emoji]) })

it('deduplicates cold reads shared by many message bubbles', async () => {
  const storage = await import('../src/utils/emojiStorage')
  const idb = await import('../src/utils/indexedDBStorage')
  await Promise.all(Array.from({ length: 50 }, () => storage.getEmojis()))
  expect(vi.mocked(idb.getItem).mock.calls.filter(([key]) => key === 'custom_emojis')).toHaveLength(1)
})

it('does not hide a healthy emoji library when usage metadata is malformed', async () => {
  db.set('emoji_use_counts', ['invalid metadata'])
  const storage = await import('../src/utils/emojiStorage')
  expect(await storage.getEmojis()).toEqual([emoji])
})

it('preserves rapid usage updates and never writes the image library for them', async () => {
  const storage = await import('../src/utils/emojiStorage')
  const idb = await import('../src/utils/indexedDBStorage')
  await Promise.all(Array.from({ length: 20 }, () => storage.incrementUseCount(1)))
  expect((await storage.getEmojis())[0].useCount).toBe(20)
  expect(db.get('emoji_use_counts')).toEqual({ 1: 20 })
  expect(vi.mocked(idb.setItem).mock.calls.some(([key]) => key === 'custom_emojis')).toBe(false)
  storage.clearCache()
  expect((await storage.getEmojis())[0].useCount).toBe(20)
})

it('keeps add/import/export/delete compatible with separate usage metadata', async () => {
  const storage = await import('../src/utils/emojiStorage')
  await storage.incrementUseCount(1)
  await storage.addEmoji({ url: 'second', name: 'second', description: 'second', tag: 'tag' })
  expect(JSON.parse(await storage.exportEmojis()).emojis.find((item: any) => item.id === 1).useCount).toBe(1)
  expect(await storage.getAllTags()).toEqual(['tag'])
  await storage.clearAllEmojis()
  expect(db.get('emoji_use_counts')).toBeUndefined()
  expect(await storage.getEmojis()).toEqual([])
})
