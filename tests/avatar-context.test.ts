import { beforeEach, expect, it, vi } from 'vitest'
import type { ChatMessage } from '../src/types/chat'

const data = new Map<string, string>()
const api = vi.hoisted(() => ({
  getApiSettings: vi.fn(() => ({ supportsVision: true, model: 'test-vision' })),
  callAIApi: vi.fn(async () => ({ content: '橘猫趴在窗台' })),
}))
vi.mock('../src/utils/chatApi', () => api)
vi.stubGlobal('localStorage', {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => data.set(key, value),
  removeItem: (key: string) => data.delete(key),
})

beforeEach(() => { data.clear(); vi.resetModules() })

it('refreshes a description without inventing an avatar change', async () => {
  const avatar = await import('../src/utils/userAvatarManager')
  avatar.setUserAvatarDescription('头像待识别（无法看到具体内容）', 'same.png')
  expect(avatar.hasAvatarChanged('same.png')).toBe(true)
  avatar.setUserAvatarDescription('一只橘猫', 'same.png')
  avatar.setUserAvatarDescription('橘猫趴在窗台', 'same.png')
  expect(avatar.getUserAvatarInfo().history).toEqual([])
  expect(avatar.hasAvatarChanged('same.png')).toBe(false)
  expect(avatar.getUserAvatarInfo().current?.description).toBe('橘猫趴在窗台')
})

it('records one real change, not another event on recognition retry', async () => {
  const avatar = await import('../src/utils/userAvatarManager')
  avatar.setUserAvatarDescription('橘猫', 'old.png')
  expect(avatar.hasAvatarChanged('new.png')).toBe(true)
  avatar.setUserAvatarDescription('头像待识别（无法看到具体内容）', 'new.png')
  avatar.setUserAvatarDescription('黑猫', 'new.png')
  expect(avatar.getUserAvatarInfo().history).toHaveLength(1)
  expect(avatar.getUserAvatarInfo().history[0].previousDescription).toBe('橘猫')
  expect(avatar.getUserAvatarInfo().history[0].description).toBe('黑猫')
})

it.each(['待识别', '未识别', '无法看到', '识别失败', '不支持图片识别', ''])('retries an unusable description: %s', async description => {
  const avatar = await import('../src/utils/userAvatarManager')
  avatar.setUserAvatarDescription(description, 'same.png')
  expect(avatar.hasAvatarChanged('same.png')).toBe(true)
})

it('does not turn a nickname or signature update into an avatar suggestion', async () => {
  const tracker = await import('../src/utils/userInfoChangeTracker')
  tracker.trackNicknameChange('旧网名')
  tracker.trackNicknameChange('新网名')
  tracker.trackSignatureChange('旧签名')
  tracker.trackSignatureChange('新签名')
  const context = tracker.getUserInfoChangeContext(true)
  expect(context).toContain('新网名')
  expect(context).toContain('新签名')
  expect(context).not.toContain('头像')
})

it('keeps real avatar notices bounded and respects recognition consent', async () => {
  const tracker = await import('../src/utils/userInfoChangeTracker')
  tracker.trackAvatarChange('old.png')
  expect(tracker.trackAvatarChange('old.png')).toBe(false)
  expect(tracker.getUserInfoChangeContext(true)).toBe('')
  expect(tracker.trackAvatarChange('new.png')).toBe(true)
  expect(tracker.getUserInfoChangeContext(false)).toBe('')
  expect(tracker.getUserInfoChangeContext(true)).toContain('用户换了新头像')
  expect(tracker.getUserInfoChangeContext(true)).toContain('用户换了新头像')
  expect(tracker.getUserInfoChangeContext(true)).toBe('')
})

it('attaches a labeled current avatar without replacing the user photo or text', async () => {
  const avatar = await import('../src/utils/userAvatarManager')
  const parts = [{ type: 'text' as const, text: '看看这张照片' }, { type: 'image_url' as const, image_url: { url: 'photo.png' } }]
  const messages: ChatMessage[] = [{ role: 'user', content: parts }, { role: 'assistant', content: '好' }]
  const request = avatar.addAvatarRecognitionRequest(messages, 'avatar.png')
  expect(request).toContain('当前头像')
  expect(request).not.toContain('用户换了头像')
  expect(messages[0].content).toEqual([...parts,
    { type: 'text', text: '【系统附加图片：用户当前头像，非用户本次发送的照片】' },
    { type: 'image_url', image_url: { url: 'avatar.png' } },
  ])
  expect(parts).toHaveLength(2)
  expect(messages[1]).toEqual({ role: 'assistant', content: '好' })
})

it('does not request recognition when there is no user message to attach to', async () => {
  const avatar = await import('../src/utils/userAvatarManager')
  const messages: ChatMessage[] = [{ role: 'system', content: '继续' }]
  expect(avatar.addAvatarRecognitionRequest(messages, 'avatar.png')).toBe('')
  expect(messages).toEqual([{ role: 'system', content: '继续' }])
})

it('preserves photos supplied through the actual message converter imageUrl field', async () => {
  const avatar = await import('../src/utils/userAvatarManager')
  const messages: ChatMessage[] = [{ role: 'user', content: '用户发了照片', imageUrl: 'photo.png' }]
  avatar.addAvatarRecognitionRequest(messages, 'avatar.png')
  expect(messages[0].imageUrl).toBeUndefined()
  expect(messages[0].content).toEqual([
    { type: 'text', text: '用户发了照片' },
    { type: 'image_url', image_url: { url: 'photo.png' } },
    { type: 'text', text: '【系统附加图片：用户当前头像，非用户本次发送的照片】' },
    { type: 'image_url', image_url: { url: 'avatar.png' } },
  ])
})

it('uses the same API configuration as chat instead of the obsolete api_settings key', async () => {
  const avatar = await import('../src/utils/userAvatarManager')
  expect(await avatar.recognizeUserAvatar('data:image/png;base64,test')).toBe('橘猫趴在窗台')
  expect(api.getApiSettings).toHaveBeenCalled()
  expect(api.callAIApi).toHaveBeenCalled()
})
