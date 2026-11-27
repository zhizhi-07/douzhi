import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const metrics = { reads: 0, imageWrites: 0 }
    ;(window as any).emojiMetrics = metrics
    const get = IDBObjectStore.prototype.get
    IDBObjectStore.prototype.get = function (key) { if (key === 'custom_emojis') metrics.reads++; return get.call(this, key) }
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) { if (key === 'custom_emojis') metrics.imageWrites++; return key === undefined ? put.call(this, value) : put.call(this, value, key) }
  })
  await page.goto('/tests/emoji-panel.html')
})

test('5000 emojis render only the visible grid, including after scrolling and category switching', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'Open emojis' }).click()
  await expect(page.getByText('emoji 0', { exact: true })).toBeVisible()
  console.log('emoji grid DOM images:', await page.locator('img').count())
  await expect.poll(() => page.locator('img').count()).toBeLessThan(100)
  await page.getByTestId('emoji-grid').evaluate(node => { node.scrollTop = node.scrollHeight })
  await expect(page.getByText('emoji 4999', { exact: true })).toBeInViewport()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'odd', exact: true }).click()
  await expect(page.getByText('emoji 1', { exact: true })).toBeVisible()
  const grid = page.getByTestId('emoji-grid')
  await grid.evaluate(node => { node.scrollTop = node.scrollHeight })
  await expect(page.getByText('emoji 4999', { exact: true })).toBeInViewport()
  await page.screenshot({ path: testInfo.outputPath('emoji-panel-mobile.png') })
  await expect.poll(() => page.locator('img').count()).toBeLessThan(100)
})

test('reopening the picker reuses its decoded library without another full database read', async ({ page }) => {
  await page.getByRole('button', { name: 'Open emojis' }).click()
  await expect(page.getByText('emoji 0', { exact: true })).toBeVisible()
  const reads = await page.evaluate(() => (window as any).emojiMetrics.reads)
  await page.getByRole('button', { name: '×', exact: true }).click()
  await page.getByRole('button', { name: 'Open emojis' }).click()
  await expect(page.getByText('emoji 0', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as any).emojiMetrics.reads)).toBe(reads)
})

test('using an emoji persists its count without rewriting all image payloads', async ({ page }) => {
  await page.getByRole('button', { name: 'Open emojis' }).click()
  await expect(page.getByText('emoji 0', { exact: true })).toBeVisible()
  const writes = await page.evaluate(() => (window as any).emojiMetrics.imageWrites)
  await page.getByText('emoji 0', { exact: true }).click()
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => (window as any).emojiMetrics.imageWrites)).toBe(writes)
  await page.getByRole('button', { name: 'Open emojis' }).click()
  await page.getByRole('button', { name: '常用', exact: true }).click()
  await expect(page.getByTestId('emoji-grid').getByText('emoji 0', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Open emojis' }).click()
  await expect(page.getByTestId('emoji-grid').getByText('emoji 0', { exact: true })).toBeVisible()
})
