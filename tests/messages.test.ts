import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../src/utils/accountManager', () => ({ getCurrentAccountId: () => 'main' }))
vi.mock('../src/services/characterService', () => ({ characterService: { getById: () => null } }))

const data = new Map<string, string>()
const storage = {
  get length() { return data.size },
  key: (i: number) => [...data.keys()][i] ?? null,
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => { data.set(key, value) },
  removeItem: (key: string) => { data.delete(key) },
}
vi.stubGlobal('localStorage', storage)
vi.stubGlobal('window', Object.assign(new EventTarget(), { localStorage: storage }))
vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }))
for (const name of ['Node', 'Window', 'Document']) vi.stubGlobal(name, class {})

let db: typeof import('../src/utils/indexedDBManager')
let chat: typeof import('../src/utils/simpleMessageManager')
let group: typeof import('../src/utils/groupChatManager')
const msg = (id: number) => ({ id, timestamp: id, content: `message ${id}`, type: 'sent' as const, time: '12:00' })
const groupMsg = (i: number, groupId = 'long') => ({ id: `msg_${i}`, groupId, userId: 'user', userName: '我', userAvatar: '', content: `message ${i}`, type: 'text' as const, time: '12:00', timestamp: i })
const settle = () => new Promise(resolve => setTimeout(resolve, 100))

beforeAll(async () => {
  db = await import('../src/utils/indexedDBManager')
  chat = await import('../src/utils/simpleMessageManager')
  group = await import('../src/utils/groupChatManager')
  await settle()
})

describe('message durability', () => {
  it('keeps every concurrent partial save, not only the last queued request', async () => {
    chat.saveMessages('race', [msg(1)])
    chat.saveMessages('race', [msg(2)])
    chat.saveMessages('race', [msg(3)])
    await settle()
    expect((await db.getItem<any[]>(db.STORES.MESSAGES, 'race'))?.map(m => m.id)).toEqual([1, 2, 3])
  })

  it('keeps force overwrite semantics while a save is pending', async () => {
    chat.saveMessages('overwrite', [msg(1), msg(2)])
    chat.saveMessages('overwrite', [msg(1)], true)
    await settle()
    expect((await db.getItem<any[]>(db.STORES.MESSAGES, 'overwrite'))?.map(m => m.id)).toEqual([1])
  })

  it('does not resurrect deleted messages from the legacy backup', async () => {
    chat.saveMessages('delete', [msg(1), msg(2)])
    await settle()
    chat.deleteMessage('delete', 1)
    await settle()
    expect((await chat.ensureMessagesLoaded('delete')).map(m => m.id)).toEqual([2])
  })

  it('does not write to IndexedDB just by reading a cached message list', async () => {
    chat.saveMessages('read', [msg(1)])
    await settle()
    const spy = vi.spyOn(db, 'setItem')
    chat.loadMessages('read'); chat.loadMessages('read')
    await settle()
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('generates safe, unique numeric private message IDs', () => {
    const messages = Array.from({ length: 2000 }, () => chat.createTextMessage('test', 'sent'))
    expect(messages.every(m => Number.isSafeInteger(m.id))).toBe(true)
    expect(new Set(messages.map(m => m.id)).size).toBe(messages.length)
  })

  it('shares safe IDs across the actual private message factories', async () => {
    const { createMessage } = await import('../src/utils/messageUtils')
    const messages = Array.from({ length: 2000 }, (_, i) => i % 2 ? createMessage('test', 'sent') : chat.createTextMessage('test', 'received'))
    expect(messages.every(m => Number.isSafeInteger(m.id))).toBe(true)
    expect(new Set(messages.map(m => m.id)).size).toBe(2000)
  })

  it('never trims group history in memory or on disk at 400 messages', async () => {
    const messages = Array.from({ length: 501 }, (_, i) => groupMsg(i))
    await db.setItem(db.STORES.MESSAGES, 'group_long', messages)
    await group.groupChatManager.loadMessagesAsync('long')
    expect(group.groupChatManager.getMessages('long')).toHaveLength(501)
    await settle()
    expect(await db.getItem<any[]>(db.STORES.MESSAGES, 'group_long')).toHaveLength(501)
  })

  it('preserves history when adding before the group has loaded', async () => {
    await db.setItem(db.STORES.MESSAGES, 'group_cold', [groupMsg(1, 'cold')])
    group.groupChatManager.addMessage('cold', { userId: 'user', userName: '我', userAvatar: '', content: 'new', type: 'text' })
    await settle()
    expect(await db.getItem<any[]>(db.STORES.MESSAGES, 'group_cold')).toHaveLength(2)
  })

  it('persists silent AI messages before the whole reply finishes', async () => {
    group.setBatchMode(true)
    group.groupChatManager.addMessage('silent', { userId: 'ai', userName: 'AI', userAvatar: '', content: 'reply', type: 'text' }, true)
    await settle()
    group.setBatchMode(false)
    expect(await db.getItem<any[]>(db.STORES.MESSAGES, 'group_silent')).toHaveLength(1)
  })

  it('allows explicitly deleting the final group message', async () => {
    group.groupChatManager.replaceAllMessages('empty', [groupMsg(1, 'empty')])
    await settle()
    group.groupChatManager.replaceAllMessages('empty', [], true)
    await settle()
    expect(await db.getItem<any[]>(db.STORES.MESSAGES, 'group_empty')).toEqual([])
  })

  it('preserves full private history after saving a paginated view and reloading', async () => {
    await chat.saveMessages('page', Array.from({ length: 1000 }, (_, i) => msg(i)))
    const page = await chat.loadMessagesPaginated('page', 30)
    expect(page.messages).toHaveLength(30)
    await chat.saveMessages('page', [...page.messages, msg(1000)])
    chat.clearMessageCache()
    expect(await chat.ensureMessagesLoaded('page')).toHaveLength(1001)
  })

  it('keeps distinct old messages whose unsafe numeric IDs collided', async () => {
    const originals = [{ ...msg(1), content: 'first' }, { ...msg(1), content: 'second' }]
    await db.setItem(db.STORES.MESSAGES, 'collided', originals)
    const messages = await chat.ensureMessagesLoaded('collided')
    expect(messages.map(message => message.content)).toEqual(['first', 'second'])
    expect(new Set(messages.map(message => message.id)).size).toBe(2)
    chat.clearMessageCache()
    expect(await chat.ensureMessagesLoaded('collided')).toHaveLength(2)
  })

  it('retries a failed write in order instead of dropping it on the next save', async () => {
    await chat.saveMessages('retry', [msg(1)])
    const spy = vi.spyOn(db, 'updateItem').mockRejectedValueOnce(new Error('simulated quota failure'))
    await expect(chat.saveMessages('retry', [msg(2)])).rejects.toThrow('simulated quota failure')
    await chat.saveMessages('retry', [msg(3)])
    spy.mockRestore()
    expect((await db.getItem<any[]>(db.STORES.MESSAGES, 'retry'))?.map(m => m.id)).toEqual([1, 2, 3])
    expect(storage.getItem('msg_backup_retry')).toBeNull()
  })

  it('merges concurrent database updates atomically', async () => {
    const { mergeMessages } = await import('../src/utils/mergeMessages')
    await Promise.all(Array.from({ length: 20 }, (_, i) => db.updateItem<any[]>(db.STORES.MESSAGES, 'atomic', current => mergeMessages(current || [], [msg(i)]))))
    expect(await db.getItem<any[]>(db.STORES.MESSAGES, 'atomic')).toHaveLength(20)
  })

  it('aborts bad writes without damaging the previous database record', async () => {
    await db.setItem(db.STORES.MESSAGES, 'abort', [msg(1)])
    await expect(db.updateItem(db.STORES.MESSAGES, 'abort', () => [{ bad: () => {} }])).rejects.toThrow()
    expect(await db.getItem(db.STORES.MESSAGES, 'abort')).toEqual([msg(1)])
  })

  it('migrates legacy records only after commit and preserves malformed backups', async () => {
    storage.setItem('chat_messages_legacy', JSON.stringify([msg(1)]))
    await db.setItem(db.STORES.MESSAGES, 'legacy', [msg(2)])
    expect(await chat.ensureMessagesLoaded('legacy')).toEqual([msg(1), msg(2)])
    expect(storage.getItem('chat_messages_legacy')).toBeNull()
    storage.setItem('msg_backup_malformed', '{broken')
    await chat.ensureMessagesLoaded('malformed')
    expect(storage.getItem('msg_backup_malformed')).toBe('{broken')
  })

  it('does not truncate large image histories when JSON serialization is unavailable', async () => {
    const messages = Array.from({ length: 600 }, (_, i) => ({ ...msg(i), image: 'data:image/png;base64,' + 'a'.repeat(2000) }))
    const spy = vi.spyOn(JSON, 'stringify').mockImplementation(() => { throw new RangeError('simulated string-size limit') })
    try { await db.setItem(db.STORES.MESSAGES, 'large', messages) } finally { spy.mockRestore() }
    expect(await db.getItem(db.STORES.MESSAGES, 'large')).toEqual(messages)
  })

  it('automatic cleanup never deletes chat records or recovery copies', async () => {
    const { cleanupOldMessages, emergencyCleanup } = await import('../src/utils/cleanupLocalStorage')
    const payload = 'x'.repeat(300000)
    storage.setItem('chat_messages_keep', payload)
    storage.setItem('group_messages_keep', payload)
    storage.setItem('msg_backup_keep', payload)
    cleanupOldMessages(); emergencyCleanup()
    for (const key of ['chat_messages_keep', 'group_messages_keep', 'msg_backup_keep']) expect(storage.getItem(key)).toBe(payload)
  })
})
