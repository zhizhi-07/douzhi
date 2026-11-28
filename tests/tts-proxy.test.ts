import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
// The deployed function is JavaScript; Vite executes the same module under test.
// @ts-ignore
import handler from '../api/minimax-tts.js'
function response() {
  const result: any = { headers: {}, code: 0, data: null }
  result.setHeader = (key: string, value: string) => { result.headers[key] = value }
  result.status = (code: number) => { result.code = code; return result }
  result.json = result.send = (value: unknown) => { result.data = value; return result }
  result.end = () => result
  return result
}
const payload = { text: '合成文本', apiKey: 'fake', groupId: 'test&injected=1', voiceId: 'test' }
beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"base_resp":{"status_code":0}}', { headers: { 'Content-Type': 'application/json' } }))))
afterEach(() => vi.unstubAllGlobals())
describe('TTS proxy trust boundary', () => {
  it.each(['http://127.0.0.1:80', 'https://127.0.0.1/v1', 'https://api.minimaxi.com.attacker.invalid/v1', 'https://api.minimaxi.com:444/v1', 'https://user@api.minimaxi.com/v1'])('rejects untrusted URL %s before any fetch', async baseUrl => {
    const res = response(); await handler({ method: 'POST', headers: { host: 'app.invalid' }, body: { ...payload, baseUrl } }, res)
    expect(res.code).toBe(400); expect(fetch).not.toHaveBeenCalled()
  })
  it('does not allow an arbitrary web origin', async () => {
    const res = response(); await handler({ method: 'POST', headers: { host: 'app.invalid', origin: 'https://evil.invalid' }, body: payload }, res)
    expect(res.code).toBe(403); expect(fetch).not.toHaveBeenCalled()
  })
  it('encodes query parameters, rejects redirects and limits upstream time', async () => {
    const res = response(); await handler({ method: 'POST', headers: { host: 'app.invalid', origin: 'https://app.invalid' }, body: payload }, res)
    expect(res.code).toBe(200); expect(fetch).toHaveBeenCalledOnce()
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toBe('https://api.minimaxi.com/v1/text_to_speech?GroupId=test%26injected%3D1')
    expect(init?.redirect).toBe('error'); expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://app.invalid')
  })
  it('rejects invalid payload types', async () => {
    const res = response(); await handler({ method: 'POST', headers: {}, body: { ...payload, text: {} } }, res)
    expect(res.code).toBe(400); expect(fetch).not.toHaveBeenCalled()
  })
})
