/**
 * MiniMax TTS API 代理
 * 解决浏览器CORS跨域问题
 * 部署到 Vercel Serverless Functions
 */

const https = require('https')

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, apiKey, groupId, voiceId, baseUrl } = req.body

    // 验证必需参数
    if (!text || !apiKey || !groupId || !voiceId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: text, apiKey, groupId, voiceId' 
      })
    }

    // 构建MiniMax API URL
    const apiBaseUrl = baseUrl || 'https://api.minimaxi.com/v1'
    const minimaxUrl = `${apiBaseUrl}/text_to_speech?GroupId=${groupId}`

    // 请求体
    const requestBody = JSON.stringify({
      text: text,
      model: 'speech-01',
      voice_id: voiceId,
      speed: 1.0,
      vol: 1.0,
      pitch: 0,
      timber_weights: null,
      audio_sample_rate: 32000,
      bitrate: 128000,
      format: 'mp3'
    })

    console.log('🎤 [Proxy] 调用MiniMax TTS:', { voiceId, textLength: text.length })

    // 使用Promise包装https请求
    const result = await new Promise((resolve, reject) => {
      // 手动解析URL
      const urlMatch = minimaxUrl.match(/^https?:\/\/([^\/]+)(.*)$/)
      if (!urlMatch) {
        return reject(new Error('Invalid URL'))
      }
      
      const hostname = urlMatch[1]
      const path = urlMatch[2] || '/'

      const options = {
        hostname: hostname,
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }

      const request = https.request(options, (response) => {
        const chunks = []
        
        response.on('data', (chunk) => {
          chunks.push(chunk)
        })

        response.on('end', () => {
          const buffer = Buffer.concat(chunks)
          const contentType = response.headers['content-type'] || ''

          // 检查是否是音频
          if (contentType.includes('audio') || contentType.includes('octet-stream')) {
            console.log('✅ [Proxy] 收到音频数据')
            resolve({ type: 'audio', buffer })
          } else {
            // JSON响应
            try {
              const jsonResult = JSON.parse(buffer.toString())
              resolve({ type: 'json', data: jsonResult })
            } catch (e) {
              reject(new Error('解析响应失败'))
            }
          }
        })
      })

      request.on('error', (error) => {
        console.error('❌ [Proxy] 请求错误:', error)
        reject(error)
      })

      request.write(requestBody)
      request.end()
    })

    // 处理结果
    if (result.type === 'audio') {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Length', result.buffer.length)
      return res.status(200).send(result.buffer)
    }

    // JSON响应
    if (result.data.base_resp?.status_code !== undefined && result.data.base_resp.status_code !== 0) {
      const errorCode = result.data.base_resp.status_code
      const errorMsg = result.data.base_resp.status_msg || '未知错误'
      
      console.error('❌ [Proxy] MiniMax API错误:', { errorCode, errorMsg })
      
      return res.status(400).json({
        error: `MiniMax API错误 (${errorCode}): ${errorMsg}`,
        code: errorCode
      })
    }

    return res.status(200).json(result.data)

  } catch (error) {
    console.error('❌ [Proxy] 代理错误:', error)
    
    return res.status(500).json({
      error: error.message || '代理服务器错误',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
