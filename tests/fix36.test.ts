import 'fake-indexeddb/auto'
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const values = new Map<string, string>()
const storage = {
  get length() { return values.size }, key: (i: number) => [...values.keys()][i] ?? null,
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, String(value)) },
  removeItem: (key: string) => { values.delete(key) }
}
vi.mock('../src/utils/coupleSpaceUtils', () => ({ getCoupleSpaceRelation: () => null, endCoupleSpaceRelation: vi.fn(), removeFamilyMember: vi.fn(), isMemberInFamily: () => false }))
vi.mock('../src/utils/momentsAI/director', () => ({ triggerAIMomentsInteraction: vi.fn() }))
vi.mock('../src/utils/emojiStorage', () => ({ clearEmojis: vi.fn() }))
beforeEach(() => {
  vi.resetModules(); values.clear()
  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('window', Object.assign(new EventTarget(), { localStorage: storage, setInterval, clearInterval }))
  vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }))
  for (const name of ['Node', 'Window', 'Document']) vi.stubGlobal(name, class {})
})
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })
const moment = (id: string) => ({ id, userId: 'user', userName: '用户', userAvatar: '', content: id, images: [], likes: [], comments: [], createdAt: 1 })
const actor = { id: 'ai', name: 'AI', avatar: '' }

describe('fix36 durable commits', () => {
  it('saves a profile when localStorage is full and reloads the committed profile', async () => {
    const user = await import('../src/utils/userUtils')
    const mirror = vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError') })
    await user.saveUserInfo({ realName: '新用户', nickname: '新昵称' })
    expect(user.getUserInfo().nickname).toBe('新昵称')
    mirror.mockRestore(); vi.resetModules()
    const profile = await import('../src/utils/userProfileStorage'); await profile.initializeUserProfile()
    expect(profile.getStoredUserProfile().nickname).toBe('新昵称')
  })
  it('rejects a failed profile transaction without changing cached facts or reminder history', async () => {
    const user = await import('../src/utils/userUtils')
    await user.saveUserInfo({ realName: '用户', nickname: '旧名' })
    const before = storage.getItem('user_info_change_history')
    const db = await import('../src/utils/indexedDBManager')
    vi.spyOn(db, 'setItem').mockRejectedValueOnce(new Error('quota'))
    await expect(user.saveUserInfo({ realName: '用户', nickname: '未保存' })).rejects.toThrow('quota')
    expect(user.getUserInfo().nickname).toBe('旧名')
    expect(storage.getItem('user_info_change_history')).toBe(before)
  })
  it('does not publish an avatar when put succeeds but its transaction aborts', async () => {
    const avatars = await import('../src/utils/avatarStorage')
    await avatars.saveUserAvatar('old')
    const put = IDBObjectStore.prototype.put
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (...args: any[]) {
      const request = put.apply(this, args as any)
      request.addEventListener('success', () => this.transaction.abort())
      return request
    })
    expect(await avatars.saveUserAvatar('new')).toBe(false)
    expect(await avatars.getUserAvatar()).toBe('old')
  })
  it('rejects failed account and mask avatars, retaining both lists', async () => {
    const avatar = await import('../src/utils/avatarStorage')
    vi.spyOn(avatar, 'saveAccountAvatar').mockResolvedValue(false)
    vi.spyOn(avatar, 'saveMaskAvatar').mockResolvedValue(false)
    const accounts = await import('../src/utils/accountManager')
    const masks = await import('../src/utils/maskManager')
    await expect(accounts.createSubAccountAsync('新小号', 'data:image/png;base64,test')).rejects.toThrow()
    await expect(masks.createMask({ nickname: '新面具', avatar: 'data:image/png;base64,test' })).rejects.toThrow()
    expect(accounts.getAccounts().filter(a => !a.isMain)).toHaveLength(0)
    expect(masks.getMasks()).toHaveLength(0)
  })
  it('keeps role service and manager caches unchanged after an aborted edit', async () => {
    const { characterService: roles } = await import('../src/services/characterService')
    await roles.waitForLoad(); const role = await roles.save({ realName: '角色', avatar: 'old' })
    const db = await import('../src/utils/indexedDBManager')
    vi.spyOn(db, 'updateItem').mockRejectedValueOnce(new Error('abort'))
    await expect(roles.update(role.id, { avatar: 'new' })).rejects.toThrow('abort')
    expect(roles.getById(role.id)?.avatar).toBe('old')
    await expect((await import('../src/utils/characterManager')).getCharacterById(role.id).then(c => c?.avatar)).resolves.toBe('old')
  })
  it('deletes every account history and the contact in one durable operation, never restoring an empty list', async () => {
    const { characterService: roles } = await import('../src/services/characterService')
    await roles.waitForLoad(); const role = await roles.save({ realName: '角色' })
    const db = await import('../src/utils/indexedDBManager')
    await db.setItem(db.STORES.MESSAGES, role.id, [{ id: 1 }])
    await db.setItem(db.STORES.MESSAGES, role.id + '_sub_abc', [{ id: 2 }])
    await db.setItem(db.STORES.MESSAGES, 'another', [{ id: 3 }])
    storage.setItem('msg_backup_' + role.id, '[{"id":1}]')
    await roles.delete(role.id)
    expect(await db.getItem(db.STORES.MESSAGES, role.id)).toBeNull()
    expect(await db.getItem(db.STORES.MESSAGES, role.id + '_sub_abc')).toBeNull()
    expect(await db.getItem(db.STORES.MESSAGES, 'another')).toEqual([{ id: 3 }])
    expect(storage.getItem('msg_backup_' + role.id)).toBeNull()
    expect(await (await import('../src/utils/characterManager')).forceReloadCharacters()).toEqual([])
  })
  it('does not publish a failed group setting and does not let getGroup mutate the cache', async () => {
    const { groupChatManager: groups } = await import('../src/utils/groupChatManager')
    const group = await groups.createGroup('old', ['user'])
    groups.getGroup(group.id)!.name = 'mutation'
    expect(groups.getGroup(group.id)?.name).toBe('old')
    const db = await import('../src/utils/indexedDBManager')
    vi.spyOn(db, 'updateItem').mockRejectedValueOnce(new Error('abort'))
    await expect(groups.updateGroup(group.id, { name: 'new' })).rejects.toThrow('abort')
    expect(groups.getGroup(group.id)?.name).toBe('old')
  })
  it('merges concurrent committed metadata patches without dropping fields', async () => {
    const { groupChatManager: groups } = await import('../src/utils/groupChatManager')
    const group = await groups.createGroup('old', ['user'])
    await Promise.all([groups.updateGroup(group.id, { name: 'new' }), groups.updateGroup(group.id, { announcement: 'keep' })])
    expect(groups.getGroup(group.id)).toMatchObject({ name: 'new', announcement: 'keep' })
  })
  it('cold moment publishing and parallel likes preserve existing posts', async () => {
    const db = await import('../src/utils/indexedDBManager')
    await db.setItem(db.STORES.MOMENTS, 'moments', [moment('old')])
    const manager = await import('../src/utils/momentsManager')
    await manager.publishMoment({ id: 'user', name: '用户', avatar: '' }, 'new')
    await Promise.all(Array.from({ length: 20 }, (_, i) => manager.likeMoment('old', { ...actor, id: 'ai' + i })))
    const saved = await db.getItem<any[]>(db.STORES.MOMENTS, 'moments')
    expect(saved).toHaveLength(2); expect(saved?.find(m => m.id === 'old').likes).toHaveLength(20)
  })
  it('uses snapshot IDs after a new post is inserted and rechecks current visibility', async () => {
    const db = await import('../src/utils/indexedDBManager')
    await db.setItem(db.STORES.MOMENTS, 'moments', [moment('old')])
    const manager = await import('../src/utils/momentsManager'); await manager.ensureMomentsLoaded()
    await manager.publishMoment({ id: 'user', name: '用户', avatar: '' }, 'new')
    const parser = await import('../src/utils/momentsInteractionParser')
    await parser.executeMomentsInteractions([{ type: 'like', momentIndex: 1, aiId: 'ai', aiName: 'AI' }], ['old'])
    const saved = await db.getItem<any[]>(db.STORES.MOMENTS, 'moments')
    expect(saved?.find(m => m.id === 'old').likes).toHaveLength(1)
    expect(saved?.find(m => m.content === 'new').likes).toHaveLength(0)
    await manager.updateMoments(current => current.map(m => ({ ...m, privacy: 'private' })))
    await parser.executeMomentsInteractions([{ type: 'comment', momentIndex: 1, aiId: 'ai', aiName: 'AI', content: 'no' }], ['old'])
    expect(manager.loadMoments().find(m => m.id === 'old')?.comments).toHaveLength(0)
  })
  it('preserves all twenty parallel forum replies and avoids incompatible migration', async () => {
    storage.setItem('forum_comments', JSON.stringify([{ id: 'forum', postId: 'p', author: '论坛', content: 'keep' }]))
    const comments = await import('../src/utils/forumCommentsDB')
    await comments.migrateFromLocalStorage()
    expect(storage.getItem('forum_comments')).toContain('keep')
    const parent = await comments.addComment('p', 'user', '用户', '', 'parent')
    await Promise.all(Array.from({ length: 20 }, (_, i) => comments.addReply(parent.id, 'user' + i, '用户', '', String(i))))
    await Promise.all([comments.toggleCommentLike(parent.id), comments.toggleCommentLike(parent.id), comments.updateCommentTimes()])
    const saved = (await comments.getPostComments('p'))[0]
    expect(saved.replies).toHaveLength(20); expect(saved.likes).toBe(0)
  })
  it('stores all frame fields atomically without a localStorage write, including a large image', async () => {
    const frame = await import('../src/utils/avatarFrameStorage')
    storage.setItem('user_avatar_frame_image_chat', 'legacy')
    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('quota') })
    const settings = { user_avatar_frame_image_chat: 'data:' + 'x'.repeat(500000), avatar_size_chat: '130' }
    await frame.saveAvatarFrameSettings('chat', settings)
    expect(await frame.loadAvatarFrameSettings('chat')).toEqual(settings)
    expect(storage.getItem('user_avatar_frame_image_chat')).toBeNull()
  })
  it('retains the old complete frame and legacy images if a transaction aborts', async () => {
    const frame = await import('../src/utils/avatarFrameStorage')
    await frame.saveAvatarFrameSettings('chat', { avatar_size_chat: '100' })
    storage.setItem('user_avatar_frame_image_chat', 'legacy')
    const put = IDBObjectStore.prototype.put
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (...args: any[]) {
      const request = put.apply(this, args as any)
      request.addEventListener('success', () => this.transaction.abort()); return request
    })
    await expect(frame.saveAvatarFrameSettings('chat', { avatar_size_chat: '150' })).rejects.toThrow()
    expect(await frame.loadAvatarFrameSettings('chat')).toEqual({ avatar_size_chat: '100' })
    expect(storage.getItem('user_avatar_frame_image_chat')).toBe('legacy')
  })
  it('does not recreate deleted API configurations or retain their active key', async () => {
    const { apiService: api } = await import('../src/services/apiService')
    api.getAll().push({ id: 'must-not-leak' } as any)
    expect(api.getAll()).toEqual([])
    const config = api.add({ name: 'test', baseUrl: 'https://example.invalid', apiKey: 'fake', model: 'fake', provider: 'openai' })
    api.delete(config.id)
    expect(api.getAll()).toEqual([]); expect(api.getCurrentId()).toBe(''); expect(storage.getItem('apiSettings')).toBeNull()
  })
  it('has unique forum IDs even in a frozen millisecond', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(123)
    const forum = await import('../src/utils/forumManager')
    storage.setItem('forum_posts', '[]')
    const ids = Array.from({ length: 100 }, () => forum.createPost({ author: 'test', title: 'post', content: 'test', tags: [] } as any).id)
    expect(new Set(ids).size).toBe(100)
    forum.deletePost(ids[0]); expect(forum.loadPosts()).toHaveLength(99)
  })
  it('protects private moments and whitelists styles without credentials', async () => {
    const { canViewMoment } = await import('../src/utils/momentVisibility')
    expect(canViewMoment({ ...moment('p'), privacy: 'private' }, 'ai')).toBe(false)
    expect(canViewMoment({ ...moment('p'), privacy: 'selected', visibleTo: ['ai'] }, 'ai')).toBe(true)
    const { isStyleStorageKey } = await import('../src/utils/styleStorageKeys')
    for (const key of ['global_button_color', 'user_avatar_frame_image_chat', 'user_bubble_color_chat', 'switch_active_color']) expect(isStyleStorageKey(key)).toBe(true)
    for (const key of ['apiSettings', 'cf_auth_token', 'messages_chat', 'user_info']) expect(isStyleStorageKey(key)).toBe(false)
  })
})
