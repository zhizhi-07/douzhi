/**
 * MiniMax TTS API 代理 - Vercel 版本
 * 使用 fetch API 避免兼容性问题
 */
export default async function handler(req, res) {
  const origin = req.headers?.origin
  const host = req.headers?.host
  const trusted = new Set((process.env.TTS_ALLOWED_ORIGINS || '').split(',').filter(Boolean))
  if (origin && origin !== `https://${host}` && origin !== `http://${host}` && !trusted.has(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' })
  }
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' })

  try {
    const { text, apiKey, groupId, voiceId, baseUrl = 'https://api.minimaxi.com/v1' } = req.body || {}

    // 验证参数
    if (![text, apiKey, groupId, voiceId].every(value => typeof value === 'string' && value.trim()) || text.length > 10000 || apiKey.length > 4096 || groupId.length > 200 || voiceId.length > 200) {
      return res.status(400).json({ error: '缺少必需参数' })
    }

    if (baseUrl !== 'https://api.minimaxi.com/v1') {
      return res.status(400).json({ error: '不支持的语音服务地址' })
    }
    const minimaxUrl = `${baseUrl}/text_to_speech?GroupId=${encodeURIComponent(groupId)}`
    
    // 调用 MiniMax API
    const response = await fetch(minimaxUrl, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(30000),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        text,
        model: 'speech-01',
        voice_id: voiceId,
        speed: 1.0,
        vol: 1.0,
        pitch: 0,
        audio_sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3'
      })
    })

    // 检查响应类型
    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.includes('audio') || contentType.includes('octet-stream')) {
      // 返回音频数据
      const audioBuffer = await response.arrayBuffer()
      res.setHeader('Content-Type', 'audio/mpeg')
      return res.status(200).send(Buffer.from(audioBuffer))
    }

    // 返回 JSON 响应
    const data = await response.json()
    
    // 检查错误
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || data.message || 'MiniMax API错误',
        details: data
      })
    }

    const { base_resp } = data
    if (base_resp?.status_code && base_resp.status_code !== 0) {
      return res.status(400).json({
        error: base_resp.status_msg || 'MiniMax API错误',
        code: base_resp.status_code
      })
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('代理错误:', error)
    return res.status(500).json({
      error: error.message || '代理服务器错误'
    })
  }
}
