import { test, expect } from '@playwright/test'

test('5000 variable-height rows stay bounded, anchored and followed only at bottom', async ({ page }) => {
  await page.goto('/tests/virtual-list.html')
  const scroller = page.getByTestId('scroller')
  await expect(page.locator('[data-message-id="4999"]')).toBeVisible()
  await expect.poll(() => page.locator('[data-message-id]').count()).toBeLessThan(70)
  await scroller.dispatchEvent('wheel')
  await scroller.evaluate(node => { node.scrollTop = 150000 })
  await page.waitForTimeout(300)
  const position = await scroller.evaluate(node => node.scrollTop)
  await page.getByRole('textbox').fill('typing must not reset the scroll ref or jump to the first message')
  await expect(page.getByLabel('ref changes')).toHaveText('1')
  expect(await scroller.evaluate(node => node.scrollTop)).toBe(position)
  const anchor = await scroller.evaluate(node => [...node.querySelectorAll<HTMLElement>('[data-message-id]')].find(row => row.getBoundingClientRect().bottom > node.getBoundingClientRect().top)?.dataset.messageId)
  await page.getByRole('button', { name: 'Resize rows' }).click()
  await page.waitForTimeout(300)
  await expect(page.locator(`[data-message-id="${anchor}"]`)).toBeVisible()
  await page.getByRole('button', { name: 'Append' }).click()
  await page.waitForTimeout(150)
  await expect(page.locator('[data-message-id="5000"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Bottom', exact: true }).click()
  await expect(page.locator('[data-message-id="5000"]')).toBeVisible()
  await page.getByRole('button', { name: 'Append' }).click()
  await expect(page.locator('[data-message-id="5001"]')).toBeVisible()
  await expect.poll(() => page.locator('[data-message-id]').count()).toBeLessThan(70)
})

test('real group route retains 1200 records across send and reload, without invite checks', async ({ page }) => {
  const errors: string[] = []
  const inviteRequests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') return route.continue()
    if (/invite|fingerprint/i.test(url.href)) inviteRequests.push(url.href)
    // Only local synthetic users: never contact an actual auth server or paid AI API.
    if (url.pathname === '/auth/user') return route.fulfill({ json: { user: { id: 'test-user', email: 'test@example.invalid' } } })
    return route.abort()
  })
  await page.goto('/tests/virtual-list.html')
  await page.evaluate(async () => {
    localStorage.setItem('auth_channel', 'cloudflare')
    localStorage.setItem('cf_auth_token', 'test-only')
    localStorage.setItem('indexeddb_migration_completed', '1.0')
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('DouzhiDB', 4)
      request.onupgradeneeded = () => {
        for (const name of ['messages', 'moments', 'characters', 'userInfo', 'wallet', 'emojis', 'settings', 'misc', 'dmMessages', 'dmConversations']) request.result.createObjectStore(name)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const transaction = db.transaction(['messages', 'misc'], 'readwrite')
    transaction.objectStore('misc').put([{ id: 'test', name: 'Regression Group', memberIds: ['user'], members: [{ id: 'user', role: 'owner' }], owner: 'user', createdAt: new Date().toISOString() }], 'group_chats')
    transaction.objectStore('messages').put(Array.from({ length: 1200 }, (_, i) => ({ id: `msg_${i}`, groupId: 'test', userId: 'user', userName: 'Test', userAvatar: '', content: `history ${i}`, time: '12:00', timestamp: i, type: 'text' })), 'group_test')
    await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error) })
    db.close()
  })
  await page.goto('/group/test')
  await expect(page.getByText('Regression Group', { exact: true })).toBeVisible()
  await expect(page.getByText('history 1199', { exact: true })).toBeVisible()
  expect(await page.locator('[data-message-id]').count()).toBeLessThan(70)
  const input = page.locator('input').first()
  await input.fill('regression durable send')
  await input.press('Enter')
  await expect(page.getByText('regression durable send', { exact: true })).toBeVisible()
  await page.waitForTimeout(300)
  await page.reload()
  await expect(page.getByText('regression durable send', { exact: true })).toBeVisible()
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('DouzhiDB', 4); r.onsuccess = () => resolve(r.result) })
    const result = await new Promise<any[]>(resolve => { const r = db.transaction('messages').objectStore('messages').get('group_test'); r.onsuccess = () => resolve(r.result) })
    db.close()
    return { count: result.length, first: result[0].content }
  })
  expect(stored).toEqual({ count: 1201, first: 'history 0' })
  expect(inviteRequests).toEqual([])
  expect(errors).toEqual([])
})

test('private role histories survive pagination, sending, switching roles and reload', async ({ page }) => {
  test.setTimeout(60000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') return route.continue()
    if (url.pathname === '/auth/user') return route.fulfill({ json: { user: { id: 'test-user', email: 'test@example.invalid' } } })
    return route.abort()
  })
  await page.goto('/tests/virtual-list.html')
  await page.evaluate(async () => {
    localStorage.setItem('auth_channel', 'cloudflare')
    localStorage.setItem('cf_auth_token', 'test-only')
    localStorage.setItem('indexeddb_migration_completed', '1.0')
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('DouzhiDB', 4)
      request.onupgradeneeded = () => {
        for (const name of ['messages', 'moments', 'characters', 'userInfo', 'wallet', 'emojis', 'settings', 'misc', 'dmMessages', 'dmConversations']) request.result.createObjectStore(name)
      }
      request.onsuccess = () => resolve(request.result)
    })
    const transaction = db.transaction(['messages', 'characters'], 'readwrite')
    transaction.objectStore('characters').put(['a', 'b'].map(id => ({ id, realName: `Role ${id}`, createdAt: new Date().toISOString() })), 'all')
    for (const id of ['a', 'b']) transaction.objectStore('messages').put(Array.from({ length: 1200 }, (_, i) => ({ id: i + 1, type: i % 2 ? 'received' : 'sent', content: `${id} private history ${i}`, time: '12:00', timestamp: i + 1 })), id)
    await new Promise<void>(resolve => { transaction.oncomplete = () => resolve() })
    db.close()
  })
  await page.goto('/chat/a')
  await expect(page.getByText('a private history 1199', { exact: true })).toBeVisible()
  await page.getByPlaceholder('发送消息').fill('durable private send')
  await page.getByPlaceholder('发送消息').press('Enter')
  await expect(page.getByText('durable private send', { exact: true })).toBeVisible()
  // React Router route change without a reload exercises in-memory role switching.
  await page.evaluate(() => { history.pushState({}, '', '/chat/b'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.getByText('b private history 1199', { exact: true })).toBeVisible()
  await expect(page.getByText('durable private send', { exact: true })).toHaveCount(0)
  await page.evaluate(() => { history.pushState({}, '', '/chat/a'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.getByText('durable private send', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('durable private send', { exact: true })).toBeVisible()
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('DouzhiDB', 4); r.onsuccess = () => resolve(r.result) })
    const read = (key: string) => new Promise<any[]>(resolve => { const r = db.transaction('messages').objectStore('messages').get(key); r.onsuccess = () => resolve(r.result) })
    const [a, b] = await Promise.all([read('a'), read('b')])
    db.close()
    return { a: a.length, b: b.length, first: a[0].content }
  })
  expect(stored).toEqual({ a: 1201, b: 1200, first: 'a private history 0' })
  expect(errors).toEqual([])
})
