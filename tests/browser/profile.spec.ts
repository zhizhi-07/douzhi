import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') return route.continue()
    if (url.pathname === '/auth/user') return route.fulfill({ json: { user: { id: 'test-user', email: 'test@example.invalid' } } })
    return route.abort()
  })
  await page.goto('/tests/emoji-panel.html')
  await page.getByRole('button', { name: 'Open emojis' }).waitFor()
  await page.evaluate(async () => {
    localStorage.setItem('auth_channel', 'cloudflare')
    localStorage.setItem('cf_auth_token', 'test-only')
    localStorage.setItem('indexeddb_migration_completed', '1.0')
    localStorage.setItem('user_info', JSON.stringify({ nickname: '旧网名', realName: '测试用户', signature: '旧签名', avatar: 'indexeddb://user_avatar', allowAvatarRecognition: false }))
    const { saveUserAvatar } = await import('/src/utils/avatarStorage.ts')
    await saveUserAvatar('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=')
    const { saveAllCharacters } = await import('/src/utils/characterManager.ts')
    await saveAllCharacters([{ id: 'profile-test', realName: '测试角色', createdAt: new Date().toISOString() }])
  })
})

for (const change of ['none', 'nickname', 'signature'] as const) {
  test(`saving profile (${change}) without uploading does not invent an avatar event`, async ({ page }) => {
    await page.goto('/user-profile')
    await expect(page.getByAltText('头像', { exact: true })).toBeVisible()
    if (change === 'nickname') await page.getByPlaceholder('不填则使用真实姓名').fill('新网名')
    if (change === 'signature') await page.getByPlaceholder('写点什么吧...').fill('新签名')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await expect(page).not.toHaveURL(/user-profile/)
    const state = await page.evaluate(async () => {
      const { ensureMessagesLoaded } = await import('/src/utils/simpleMessageManager.ts')
      const { getUserAvatar } = await import('/src/utils/avatarStorage.ts')
      const { getUserInfoChangeContext } = await import('/src/utils/userInfoChangeTracker.ts')
      return { messages: await ensureMessagesLoaded('profile-test'), info: JSON.parse(localStorage.getItem('user_info')!), avatar: await getUserAvatar(), context: getUserInfoChangeContext(true) }
    })
    expect(JSON.stringify(state.messages)).not.toContain('用户换了新头像')
    expect(state.info.avatar).toBe('indexeddb://user_avatar')
    expect(state.avatar).toMatch(/^data:image\/png/)
    if (change === 'none') expect(state.messages).toEqual([])
    else {
      expect(state.messages).toEqual([]) // Facts are bounded context, not duplicated into each account's history.
      expect(state.context).toContain(change === 'nickname' ? '新网名' : '新签名')
      expect(state.context).not.toContain('用户换了新头像')
    }
  })
}

for (const allowRecognition of [true, false]) {
  test(`real upload records one change and respects consent (${allowRecognition})`, async ({ page }) => {
    await page.evaluate(allow => {
      const info = JSON.parse(localStorage.getItem('user_info')!)
      info.allowAvatarRecognition = allow
      localStorage.setItem('user_info', JSON.stringify(info))
    }, allowRecognition)
    await page.goto('/user-profile')
    await expect(page.getByAltText('头像', { exact: true })).toBeVisible()
    const image = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 4
      const context = canvas.getContext('2d')!
      context.fillStyle = 'red'
      context.fillRect(0, 0, 4, 4)
      return canvas.toDataURL().split(',')[1]
    })
    await page.locator('input[type=file]').setInputFiles({ name: 'new.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') })
    await expect(page.getByAltText('头像', { exact: true })).toHaveAttribute('src', /^data:image\/jpeg/)
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await expect(page).not.toHaveURL(/user-profile/)
    await page.goto('/user-profile')
    await expect(page.getByAltText('头像', { exact: true })).toHaveAttribute('src', /^data:image\/jpeg/)
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await expect(page).not.toHaveURL(/user-profile/)
    const facts = await page.evaluate(async () => {
      const { ensureMessagesLoaded } = await import('/src/utils/simpleMessageManager.ts')
      const { getUserInfoChangeContext, getUserInfoChangeHistory } = await import('/src/utils/userInfoChangeTracker.ts')
      const events = (await ensureMessagesLoaded('profile-test')).filter(message => message.aiReadableContent?.includes('用户换了新头像'))
      const info = JSON.parse(localStorage.getItem('user_info')!)
      return { events, changes: getUserInfoChangeHistory().avatar.history, context: getUserInfoChangeContext(info.allowAvatarRecognition) }
    })
    expect(facts.events).toHaveLength(0)
    expect(facts.changes).toHaveLength(1)
    if (allowRecognition) expect(facts.context).toContain('用户换了新头像')
    else expect(facts.context).not.toContain('用户换了新头像')
  })
}

for (const scenario of ['first', 'retry', 'changed', 'disabled', 'no-vision'] as const) {
  test(`real chat request keeps photo and avatar facts separate (${scenario})`, async ({ page }) => {
    const requests: any[] = []
    await page.route('https://avatar-test.invalid/**', async route => {
      requests.push(route.request().postDataJSON())
      await route.fulfill({ json: { choices: [{ message: { role: 'assistant', content: '收到\n[头像描述:测试头像]' }, finish_reason: 'stop' }] } })
    })
    await page.evaluate(async scenario => {
      const info = JSON.parse(localStorage.getItem('user_info')!)
      info.allowAvatarRecognition = scenario !== 'disabled'
      localStorage.setItem('user_info', JSON.stringify(info))
      localStorage.setItem('apiSettings', JSON.stringify({ provider: 'openai', baseUrl: 'https://avatar-test.invalid/v1', apiKey: 'test-only', model: 'test-vision', supportsVision: scenario !== 'no-vision', temperature: 0.5 }))
      const avatar = await import('/src/utils/userAvatarManager.ts')
      const { getUserAvatar } = await import('/src/utils/avatarStorage.ts')
      if (scenario === 'retry') avatar.setUserAvatarDescription('无法看到', (await getUserAvatar())!)
      if (scenario === 'changed') avatar.setUserAvatarDescription('旧头像', 'old-avatar.png')
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 4
      canvas.getContext('2d')!.fillRect(0, 0, 4, 4)
      const db = await import('/src/utils/indexedDBManager.ts')
      await db.setItem(db.STORES.MESSAGES, 'profile-test', [{ id: 1, type: 'sent', messageType: 'photo', photoDescription: '用户发来的测试照片', photoBase64: canvas.toDataURL(), time: '12:00', timestamp: Date.now() }])
    }, scenario)
    await page.goto('/chat/profile-test')
    await expect(page.locator('.chat-ai-btn')).toBeVisible()
    await page.locator('.chat-ai-btn').click()
    await expect.poll(() => requests.length).toBeGreaterThan(0)
    await expect(page.getByText('收到', { exact: true })).toBeVisible()
    const request = requests[0]
    const prompt = request.messages[0].content
    expect(prompt).not.toContain('用户换了头像，回复时')
    const shouldRecognize = scenario !== 'disabled' && scenario !== 'no-vision'
    expect(prompt.includes('系统附加的图片是用户当前头像')).toBe(shouldRecognize)
    if (shouldRecognize) {
      const photoMessage = request.messages.find((message: any) => Array.isArray(message.content) && message.content.some((part: any) => part.text?.includes('用户发来的测试照片')))
      expect(photoMessage).toBeTruthy()
      expect(photoMessage.content.filter((part: any) => part.type === 'image_url')).toHaveLength(2)
      expect(photoMessage.content.every((part: any) => part.type !== 'text' || typeof part.text === 'string')).toBe(true)
      expect(photoMessage.content.some((part: any) => part.text?.includes('非用户本次发送的照片'))).toBe(true)
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('user_avatar_info')!).current.description)
      expect(saved).toBe('测试头像')
    }
  })
}
