/**
 * MiniMax TTS API 代理 - 简化版
 * 解决CORS跨域问题
 */
const https = require('https')

module.exports = async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' })

  try {
    const { text, apiKey, groupId, voiceId, baseUrl = 'https://api.minimaxi.com/v1' } = req.body

    // 验证参数
    if (!text || !apiKey || !groupId || !voiceId) {
      return res.status(400).json({ error: '缺少必需参数' })
    }

    const minimaxUrl = `${baseUrl}/text_to_speech?GroupId=${groupId}`
    const requestBody = JSON.stringify({
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

    // 调用MiniMax API
    const result = await new Promise((resolve, reject) => {
      const urlMatch = minimaxUrl.match(/^https?:\/\/([^\/]+)(.*)$/)
      if (!urlMatch) return reject(new Error('Invalid URL'))
      
      const [, hostname, path = '/'] = urlMatch

      const request = https.request({
        hostname,
        port: 443,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }, (response) => {
        const chunks = []
        response.on('data', chunk => chunks.push(chunk))
        response.on('end', () => {
          const buffer = Buffer.concat(chunks)
          const contentType = response.headers['content-type'] || ''

          if (contentType.includes('audio') || contentType.includes('octet-stream')) {
            resolve({ type: 'audio', buffer })
          } else {
            try {
              const data = JSON.parse(buffer.toString())
              resolve({ type: 'json', data })
            } catch {
              reject(new Error('解析响应失败'))
            }
          }
        })
      })

      request.on('error', reject)
      request.write(requestBody)
      request.end()
    })

    // 处理响应
    if (result.type === 'audio') {
      res.setHeader('Content-Type', 'audio/mpeg')
      return res.status(200).send(result.buffer)
    }

    // 检查错误
    const { base_resp } = result.data
    if (base_resp?.status_code && base_resp.status_code !== 0) {
      return res.status(400).json({
        error: base_resp.status_msg || 'MiniMax API错误',
        code: base_resp.status_code
      })
    }

    return res.status(200).json(result.data)
  } catch (error) {
    return res.status(500).json({
      error: error.message || '代理服务器错误'
    })
  }
}
