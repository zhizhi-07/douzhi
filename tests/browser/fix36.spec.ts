import { test, expect, type Page } from '@playwright/test'

async function seed(page: Page) {
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') return route.continue()
    if (url.pathname === '/auth/user') return route.fulfill({ json: { user: { id: 'regression-only', email: 'regression@example.invalid' } } })
    return route.abort()
  })
  page.on('dialog', dialog => dialog.dismiss())
  await page.goto('/data-manager.html')
  await page.evaluate(async () => {
    localStorage.setItem('auth_channel', 'cloudflare'); localStorage.setItem('cf_auth_token', 'test-only')
    localStorage.setItem('indexeddb_migration_completed', '1.0')
    localStorage.setItem('user_info', JSON.stringify({ realName: '测试用户', nickname: '旧昵称' }))
    // @ts-ignore -- browser module URL resolved by Vite.
    const db = await import('/src/utils/indexedDBManager.ts')
    await db.setItem(db.STORES.CHARACTERS, 'all', [{ id: 'test-ai', realName: '测试角色', createdAt: new Date().toISOString() }])
    await db.setItem(db.STORES.MISC, 'group_chats', [{ id: 'test-group', name: '回归群聊', memberIds: ['user', 'test-ai'], members: [{ id: 'user', role: 'owner' }, { id: 'test-ai', role: 'member' }], createdAt: new Date().toISOString() }])
  })
}

test('profile saves and survives reload with localStorage completely full', async ({ page }) => {
  await seed(page); await page.goto('/user-profile')
  await page.getByPlaceholder('不填则使用真实姓名').fill('已持久化的新昵称')
  await page.evaluate(() => {
    let n = 0
    for (const size of [262144, 16384, 1024, 64, 1]) for (;;) {
      try { localStorage.setItem('__test_quota_' + n++, 'x'.repeat(size)) } catch { break }
    }
  })
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page).not.toHaveURL(/user-profile/)
  const saved = await page.evaluate(async () => {
    // @ts-ignore
    const db = await import('/src/utils/indexedDBManager.ts')
    return (await db.getItem(db.STORES.USER_INFO, 'profile')).nickname
  })
  expect(saved).toBe('已持久化的新昵称')
  await page.goto('/user-profile')
  await expect(page.getByPlaceholder('不填则使用真实姓名')).toHaveValue('已持久化的新昵称')
})

test('cold group settings render members after a delayed metadata read', async ({ page }) => {
  await seed(page)
  await page.addInitScript(() => {
    const get = IDBObjectStore.prototype.get
    IDBObjectStore.prototype.get = function (...args) {
      const request = get.apply(this, args)
      if (this.name === 'misc' && args[0] === 'group_chats') request.addEventListener('success', event => {
        event.stopImmediatePropagation()
        const handler = request.onsuccess
        setTimeout(() => handler?.call(request, new Event('success')), 2000)
      })
      return request
    }
  })
  await page.goto('/group/test-group/settings')
  await expect(page.getByText('群成员 2人', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('测试角色', { exact: true }).first()).toBeVisible()
})

test('group generated HTML stays visible but cannot write application storage', async ({ page }) => {
  await seed(page)
  await page.evaluate(async () => {
    // @ts-ignore
    const db = await import('/src/utils/indexedDBManager.ts')
    await db.setItem(db.STORES.MESSAGES, 'group_test-group', [{ id: 'msg_1', groupId: 'test-group', userId: 'test-ai', userName: '测试角色', type: 'text', messageType: 'theatre_html', time: '12:00', timestamp: Date.now(), content: '<div style="color:purple">可见卡片<script>try { parent.localStorage.setItem("__escape", "bad") } catch { document.body.dataset.blocked="yes" }</script></div>' }])
  })
  await page.goto('/group/test-group')
  const frame = page.locator('iframe[title="消息卡片"]')
  await expect(frame).toBeVisible()
  await expect(page.frameLocator('iframe[title="消息卡片"]').getByText('可见卡片')).toBeVisible()
  expect(await frame.getAttribute('sandbox')).toBe('allow-scripts')
  expect(await page.evaluate(() => localStorage.getItem('__escape'))).toBeNull()
})

test('private HTML cannot access parent origin even with scripts enabled', async ({ page }) => {
  await seed(page)
  await page.evaluate(async () => {
    // @ts-ignore
    const db = await import('/src/utils/indexedDBManager.ts')
    await db.setItem(db.STORES.MESSAGES, 'test-ai', [{ id: 1, type: 'received', messageType: 'html', time: '12:00', timestamp: Date.now(), content: '<html><body>私聊卡片<script>try { parent.localStorage.setItem("__escape", "bad") } catch { document.body.dataset.blocked="yes" }</script></body></html>' }])
  })
  await page.goto('/chat/test-ai')
  const frame = page.locator('iframe[title="HTML内容"]')
  await expect(frame).toBeVisible()
  expect(await frame.getAttribute('sandbox')).toBe('allow-scripts')
  expect(await page.evaluate(() => localStorage.getItem('__escape'))).toBeNull()
})

test('check-ins change on local midnight and keep a consecutive streak', async ({ page }) => {
  await seed(page)
  const result = await page.evaluate(async () => {
    // @ts-ignore
    const checkin = await import('/src/utils/coupleSpaceCheckInUtils.ts')
    const OriginalDate = Date; let now = new OriginalDate('2026-11-27T23:30:00+08:00').getTime()
    // @ts-ignore -- deterministic clock, restore below.
    window.Date = class extends OriginalDate { constructor(...args: any[]) { super(...(args.length ? args : [now])) } static now() { return now } }
    try {
      const first = await checkin.doCheckIn('开心')
      now = new OriginalDate('2026-11-28T00:30:00+08:00').getTime()
      const before = await checkin.hasCheckedInToday()
      const second = await checkin.doCheckIn('开心')
      return { first: first.record.date, second: second.record.date, before, streak: second.stats.currentStreak }
    } finally { window.Date = OriginalDate }
  })
  expect(result).toEqual({ first: '2026-11-27', second: '2026-11-28', before: false, streak: 2 })
})

test('group voice calls audio playback for a real URL and releases it on unmount', async ({ page }) => {
  await seed(page)
  const result = await page.evaluate(async () => {
    // @ts-ignore
    const React = (await import('/node_modules/.vite/deps/react.js')).default
    // @ts-ignore
    const dom = await import('/node_modules/.vite/deps/react-dom_client.js')
    const createRoot = dom.createRoot || dom.default.createRoot
    // @ts-ignore
    const { useGroupEmoji } = await import('/src/pages/GroupChatDetail/hooks/useGroupEmoji.ts')
    // @ts-ignore
    const { groupChatManager: group } = await import('/src/utils/groupChatManager.ts')
    await group.waitForLoad(); await group.loadMessagesAsync('test-group')
    const message = group.addMessage('test-group', { userId: 'test-ai', userName: '角色', userAvatar: '', content: 'hello', type: 'voice', messageType: 'voice', voiceUrl: 'https://audio.example.invalid/synthetic.wav' })
    await group.flushMessages('test-group')
    let played = 0, paused = 0, usedUrl = ''
    const OriginalAudio = window.Audio
    // @ts-ignore
    window.Audio = class { constructor(url: string) { usedUrl = url } play() { played++; return Promise.resolve() } pause() { paused++ } }
    const host = document.createElement('div'); document.body.append(host); const root = createRoot(host)
    let api: any
    function Probe() { api = useGroupEmoji('test-group', () => {}, () => {}); return null }
    try {
      root.render(React.createElement(Probe))
      for (let n = 0; !api && n < 50; n++) await new Promise(resolve => setTimeout(resolve, 20))
      api.handlePlayVoice(Number(message.id.slice(4)), 1)
      await new Promise(resolve => setTimeout(resolve, 50))
      root.unmount()
      return { played, paused, usedUrl, id: message.id, known: group.getMessages('test-group').map((m: any) => ({ id: m.id, voiceUrl: m.voiceUrl })), playing: api.playingVoiceId }
    } finally { window.Audio = OriginalAudio; host.remove() }
  })
  console.log('audio probe', result)
  expect(result.played).toBe(1); expect(result.paused).toBeGreaterThan(0)
  expect(result.usedUrl).toBe('https://audio.example.invalid/synthetic.wav')
})
