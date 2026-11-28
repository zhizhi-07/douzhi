import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  await page.goto('/data-manager.html')
})

test('clear all includes music and legacy chat databases', async ({ page }) => {
  const remaining = await page.evaluate(async () => {
    localStorage.setItem('test-data', 'clear me'); sessionStorage.setItem('test-data', 'clear me')
    await (await caches.open('douzhi-test-cache')).put('/synthetic', new Response('cache bytes'))
    for (const name of ['MusicStorageDB', 'WeChatAppDB']) await new Promise<void>(resolve => {
      const request = indexedDB.open(name, 1)
      request.onupgradeneeded = () => request.result.createObjectStore('test')
      request.onsuccess = () => { request.result.close(); resolve() }
    })
    const manager = await import('/src/utils/dataManager.ts')
    await manager.clearAllData()
    return { databases: (await indexedDB.databases()).map(db => db.name), caches: await caches.keys(), local: localStorage.length, session: sessionStorage.length }
  })
  expect(remaining.databases).not.toContain('MusicStorageDB')
  expect(remaining.databases).not.toContain('WeChatAppDB')
  expect(remaining.caches).toEqual([])
  expect(remaining.local).toBe(0)
  expect(remaining.session).toBe(0)
})

test('blocked deletion stays pending rather than falsely reporting success', async ({ page }) => {
  await page.evaluate(async () => {
    const request = indexedDB.open('DouzhiDB', 4)
    const held = await new Promise<IDBDatabase>(resolve => { request.onsuccess = () => resolve(request.result) })
    ;(window as any).held = held
    const manager = await import('/src/utils/dataManager.ts')
    ;(window as any).clearResult = 'pending'
    ;(window as any).clearPromise = manager.clearAllData().then(() => { (window as any).clearResult = 'done' })
  })
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => (window as any).clearResult)).toBe('pending')
  await page.evaluate(async () => { (window as any).held.close(); await (window as any).clearPromise })
  expect(await page.evaluate(() => (window as any).clearResult)).toBe('done')
})

test('invalid import is rejected before touching existing local data', async ({ page }) => {
  const result = await page.evaluate(async () => {
    localStorage.setItem('keep-original', 'sentinel')
    const manager = await import('/src/utils/dataManager.ts')
    const bad = { type: 'chat', version: '2.2', exportTime: 'test', indexedDB: { DouzhiDB: { characters: { keys: ['all'], values: [] } } } }
    let rejected = false
    try { await manager.importAllData(new File([JSON.stringify(bad)], 'bad.json')) } catch { rejected = true }
    return { rejected, kept: localStorage.getItem('keep-original') }
  })
  expect(result).toEqual({ rejected: true, kept: 'sentinel' })
})

test('legacy style imports use the real database version and inline keys', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const emojis = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('EmojiDB', 3)
      request.onupgradeneeded = () => request.result.createObjectStore('emojis')
      request.onsuccess = () => resolve(request.result)
    })
    emojis.close()
    const manager = await import('/src/utils/dataManager.ts')
    const backup = { type: 'style', version: '2.2', exportTime: 'test', indexedDB: {
      EmojiDB: { emojis: { keys: ['custom_emojis'], values: [[{ id: 1, url: 'data:image/png;base64,test', name: 'test', useCount: 1 }]] } },
      AvatarStorage: { avatars: { keys: ['user'], values: [{ id: 'user', data: 'avatar data', updatedAt: 1 }] } },
    } }
    await manager.importAllData(new File([JSON.stringify(backup)], 'style.json'))
    const read = async (name: string, store: string, key: string) => {
      const db = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open(name); request.onsuccess = () => resolve(request.result) })
      const transaction = db.transaction(store)
      const objectStore = transaction.objectStore(store)
      const value = await new Promise<any>(resolve => { const request = objectStore.get(key); request.onsuccess = () => resolve(request.result) })
      const result = { value, keyPath: objectStore.keyPath, version: db.version }
      db.close()
      return result
    }
    return { emojis: await read('EmojiDB', 'emojis', 'custom_emojis'), avatar: await read('AvatarStorage', 'avatars', 'user') }
  })
  expect(result.emojis.value).toHaveLength(1)
  expect(result.emojis.version).toBe(3)
  expect(result.avatar.keyPath).toBe('id')
  expect(result.avatar.value.data).toBe('avatar data')
})

test('export preserves binary icon payloads and does not create absent empty databases', async ({ page }) => {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('IconStorage', 2)
      request.onupgradeneeded = () => { request.result.createObjectStore('ui_icons'); request.result.createObjectStore('desktop_icons') }
      request.onsuccess = () => resolve(request.result)
    })
    const transaction = db.transaction('ui_icons', 'readwrite')
    transaction.objectStore('ui_icons').put(new Blob(['icon bytes'], { type: 'image/png' }), 'sample')
    await new Promise<void>(resolve => { transaction.oncomplete = () => resolve() })
    db.close()
  })
  const download = page.waitForEvent('download')
  await page.evaluate(async () => { const manager = await import('/src/utils/dataManager.ts'); await manager.exportStyleData() })
  const file = await download
  const json = JSON.parse(await readFile((await file.path())!, 'utf8'))
  const icon = json.indexedDB.IconStorage.stores?.ui_icons?.values?.[0] ?? json.indexedDB.IconStorage.ui_icons.values[0]
  expect(icon).not.toEqual({})
  const names = await page.evaluate(async () => (await indexedDB.databases()).map(db => db.name))
  expect(names).not.toContain('FontStorage')
})

test('failed multi-database import restores the original data instead of leaving a partial import', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const manager = await import('/src/utils/dataManager.ts')
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('EmojiDB', 3)
      request.onupgradeneeded = () => request.result.createObjectStore('emojis')
      request.onsuccess = () => resolve(request.result)
    })
    const transaction = db.transaction('emojis', 'readwrite')
    transaction.objectStore('emojis').put(['original'], 'custom_emojis')
    await new Promise<void>(resolve => { transaction.oncomplete = () => resolve() }); db.close()
    localStorage.setItem('original', 'keep')
    const backup = { type: 'style', version: '2.2', exportTime: 'test', indexedDB: {
      EmojiDB: { emojis: { keys: ['custom_emojis'], values: [['new']] } },
      kiro_avatar_library: { tags: { keys: ['a', 'b'], values: [{ id: 'a', name: 'duplicate' }, { id: 'b', name: 'duplicate' }] } },
    } }
    let error = ''
    try { await manager.importAllData(new File([JSON.stringify(backup)], 'failure.json')) } catch (failure) { error = String(failure) }
    const restored = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('EmojiDB', 3); request.onsuccess = () => resolve(request.result) })
    const value = await new Promise(resolve => { const request = restored.transaction('emojis').objectStore('emojis').get('custom_emojis'); request.onsuccess = () => resolve(request.result) }); restored.close()
    return { error, value, local: localStorage.getItem('original'), pending: await manager.hasPendingImport() }
  })
  expect(result.error).toContain('已恢复导入前数据')
  expect(result.value).toEqual(['original'])
  expect(result.local).toBe('keep')
  expect(result.pending).toBe(false)
})

test('interrupted import is detected before starting the application and can be recovered', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('dialog', dialog => dialog.accept())
  await page.evaluate(async () => {
    const { normalizeBackup } = await import('/src/utils/backupSchema.ts')
    const original = normalizeBackup({ type: 'chat', indexedDB: { DouzhiDB: { characters: { keys: ['all'], values: [[{ id: 'restored', realName: 'Recovered Role' }]] } } } })
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('douzhi_maintenance_rollback', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('snapshot')
      request.onsuccess = () => resolve(request.result)
    })
    const transaction = db.transaction('snapshot', 'readwrite')
    transaction.objectStore('snapshot').put({ targets: ['DouzhiDB'], databases: original.databases, localStorage: { original: 'safe' } }, 'before-import')
    await new Promise<void>(resolve => { transaction.oncomplete = () => resolve() }); db.close()
    localStorage.setItem('focus_mode', '{broken')
  })
  await page.goto('/')
  await expect(page).toHaveURL(/data-manager\.html/)
  await expect(page.getByRole('button', { name: '恢复导入前数据', exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('interrupted-import-recovery.png'), animations: 'disabled' })
  await page.getByRole('button', { name: '恢复导入前数据', exact: true }).click()
  await expect(page).not.toHaveURL(/data-manager\.html/)
  expect(await page.evaluate(() => localStorage.getItem('original'))).toBe('safe')
  expect(await page.evaluate(async () => (await indexedDB.databases()).some(db => db.name === 'douzhi_maintenance_rollback'))).toBe(false)
  expect(errors).toEqual([])
})

test('real UI export-clear-import permits creating a new role and chatting after reload', async ({ page }) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('dialog', dialog => dialog.accept())
  await page.route('https://example.invalid/**', route => route.fulfill({ json: { choices: [{ message: { role: 'assistant', content: 'synthetic AI reply after import' }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } } }))
  await page.route('**/auth/user', route => route.fulfill({ json: { user: { id: 'test-user', email: 'test@example.invalid' } } }))
  await page.evaluate(async () => {
    localStorage.setItem('auth_channel', 'cloudflare'); localStorage.setItem('cf_auth_token', 'SESSION-MUST-NOT-EXPORT')
    localStorage.setItem('apiConfigs', JSON.stringify([{ id: 'test-api', name: 'Test API', baseUrl: 'https://example.invalid/v1', apiKey: 'synthetic-key', provider: 'custom', model: 'synthetic', createdAt: new Date().toISOString() }]))
    localStorage.setItem('currentApiId', 'test-api')
    const { DATABASE_SCHEMAS } = await import('/src/utils/backupSchema.ts')
    for (const name of ['DouzhiDB', 'IconStorage', 'UnifiedMemoryDB']) {
      const definition = DATABASE_SCHEMAS[name]
      const db = await new Promise<IDBDatabase>(resolve => {
        const request = indexedDB.open(name, definition.version)
        request.onupgradeneeded = () => {
          for (const [storeName, schema] of Object.entries(definition.stores)) {
            const store = request.result.createObjectStore(storeName, { keyPath: schema.keyPath })
            for (const index of schema.indexes) store.createIndex(index.name, index.keyPath, { unique: !!index.unique })
          }
        }
        request.onsuccess = () => resolve(request.result)
      })
      const transaction = db.transaction(Array.from(db.objectStoreNames), 'readwrite')
      if (name === 'DouzhiDB') {
        transaction.objectStore('characters').put([{ id: 'original', realName: 'Original Role', createdAt: new Date().toISOString() }], 'all')
        transaction.objectStore('messages').put([{ id: 1, type: 'sent', content: 'original message', time: '12:00', timestamp: 1 }], 'original')
      } else if (name === 'IconStorage') transaction.objectStore('ui_icons').put(new Blob(['icon bytes'], { type: 'image/png' }), 'test-icon')
      else transaction.objectStore('memories').put({ id: 'memory', characterId: 'original', title: 'kept memory', timestamp: 1, domain: 'chat', importance: 1 })
      await new Promise<void>(resolve => { transaction.oncomplete = () => resolve() }); db.close()
    }
  })
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /导出聊天数据/ }).click()
  const backup = await download
  const backupPath = (await backup.path())!
  expect(await readFile(backupPath, 'utf8')).not.toContain('SESSION-MUST-NOT-EXPORT')
  await page.getByRole('button', { name: /清除所有数据/ }).click()
  await expect(page).not.toHaveURL(/data-manager\.html/)
  await page.goto('/data-manager.html')
  await page.evaluate(() => { localStorage.setItem('auth_channel', 'cloudflare'); localStorage.setItem('cf_auth_token', 'CURRENT-SESSION-KEEP') })
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: /导入数据/ }).click()
  await (await chooser).setFiles(backupPath)
  await expect(page).not.toHaveURL(/data-manager\.html/)
  expect(await page.evaluate(() => localStorage.getItem('cf_auth_token'))).toBe('CURRENT-SESSION-KEEP')
  await page.goto('/create-character')
  await page.getByPlaceholder('角色的真实姓名').fill('New Role After Import')
  await page.getByRole('button', { name: '完成', exact: true }).click()
  await expect(page).toHaveURL(/\/contacts$/)
  const created = await page.evaluate(async () => {
    const { characterService } = await import('/src/services/characterService.ts')
    await characterService.waitForLoad()
    return characterService.getAll().find(character => character.realName === 'New Role After Import')
  })
  expect(created?.id).toBeTruthy()
  await page.goto(`/chat/${created!.id}`)
  await page.getByPlaceholder('发送消息').fill('chat works after import')
  await page.getByPlaceholder('发送消息').press('Enter')
  await expect(page.getByText('chat works after import', { exact: true })).toBeInViewport()
  await page.locator('.chat-ai-btn').click()
  await expect(page.getByText('synthetic AI reply after import', { exact: true })).toBeInViewport({ timeout: 15000 })
  await page.reload()
  await expect(page.getByText('chat works after import', { exact: true })).toBeInViewport()
  await expect(page.getByText('synthetic AI reply after import', { exact: true })).toBeInViewport()
  const restored = await page.evaluate(async () => {
    const { characterService } = await import('/src/services/characterService.ts')
    const { ensureMessagesLoaded } = await import('/src/utils/simpleMessageManager.ts')
    const { unifiedMemoryService } = await import('/src/services/unifiedMemoryService.ts')
    const iconDB = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('IconStorage', 2); request.onsuccess = () => resolve(request.result) })
    const icon = await new Promise<Blob>(resolve => { const request = iconDB.transaction('ui_icons').objectStore('ui_icons').get('test-icon'); request.onsuccess = () => resolve(request.result) }); iconDB.close()
    await characterService.waitForLoad()
    return { characters: characterService.getAll().length, oldMessage: (await ensureMessagesLoaded('original'))[0].content,
      icon: await icon.text(), memories: (await unifiedMemoryService.getMemoriesByCharacter('original')).length, api: JSON.parse(localStorage.getItem('apiConfigs')!)[0].id }
  })
  expect(restored).toEqual({ characters: 2, oldMessage: 'original message', icon: 'icon bytes', memories: 1, api: 'test-api' })
  expect(errors).toEqual([])
})

test('role creation reports failed storage rather than navigating to a nonexistent chat', async ({ page }) => {
  await page.route('**/auth/user', route => route.fulfill({ json: { user: { id: 'test-user', email: 'test@example.invalid' } } }))
  await page.evaluate(() => { localStorage.setItem('auth_channel', 'cloudflare'); localStorage.setItem('cf_auth_token', 'test-only'); localStorage.setItem('indexeddb_migration_completed', '1.0') })
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'characters' && key === 'all') throw new DOMException('simulated disk full', 'QuotaExceededError')
      return key === undefined ? put.call(this, value) : put.call(this, value, key)
    }
  })
  await page.goto('/create-character')
  await page.getByPlaceholder('角色的真实姓名').fill('Must Not Pretend Saved')
  const alert = new Promise<string>(resolve => page.once('dialog', async dialog => {
    const message = dialog.message()
    await dialog.accept()
    resolve(message)
  }))
  await page.getByRole('button', { name: '完成', exact: true }).click()
  expect(await alert).toContain('角色保存失败')
  await expect(page).toHaveURL(/create-character/)
  expect(await page.evaluate(() => localStorage.getItem('characters_backup'))).toBeNull()
})

test('insufficient space for the recovery snapshot never starts replacing original data', async ({ page }) => {
  const result = await page.evaluate(async () => {
    localStorage.setItem('original', 'must remain')
    const manager = await import('/src/utils/dataManager.ts')
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.transaction.db.name === 'douzhi_maintenance_rollback') throw new DOMException('simulated snapshot quota failure', 'QuotaExceededError')
      return key === undefined ? put.call(this, value) : put.call(this, value, key)
    }
    let error = ''
    try { await manager.importAllData(new File([JSON.stringify({ type: 'chat', indexedDB: {} })], 'empty.json')) } catch (failure) { error = String(failure) }
    finally { IDBObjectStore.prototype.put = put }
    return { error, original: localStorage.getItem('original') }
  })
  expect(result.error).toContain('snapshot quota failure')
  expect(result.original).toBe('must remain')
})
