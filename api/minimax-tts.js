/**
 * MiniMax TTS API 代理
 * 解决浏览器CORS跨域问题
 * 部署到 Vercel Serverless Functions
 */

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

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
    const minimaxUrl = `${baseUrl || 'https://api.minimaxi.com/v1'}/text_to_speech?GroupId=${groupId}`

    // 请求体
    const requestBody = {
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
    }

    console.log('🎤 [Proxy] 调用MiniMax TTS:', {
      url: minimaxUrl,
      voiceId,
      textLength: text.length
    })

    // 调用MiniMax API
    const response = await fetch(minimaxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    const contentType = response.headers.get('content-type') || ''

    // 检查是否返回音频文件（二进制）
    if (contentType.includes('audio') || contentType.includes('octet-stream')) {
      console.log('✅ [Proxy] 收到音频数据')
      
      // 将音频数据转为Buffer
      const audioBuffer = await response.arrayBuffer()
      
      // 设置响应头
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Length', audioBuffer.byteLength)
      
      // 返回音频数据
      return res.status(200).send(Buffer.from(audioBuffer))
    }

    // 否则当作JSON处理
    const result = await response.json()
    
    console.log('📦 [Proxy] API返回:', {
      status: response.status,
      hasError: result.base_resp?.status_code !== 0
    })

    // 检查MiniMax业务错误
    if (result.base_resp?.status_code !== undefined && result.base_resp.status_code !== 0) {
      const errorCode = result.base_resp.status_code
      const errorMsg = result.base_resp.status_msg || '未知错误'
      
      console.error('❌ [Proxy] MiniMax API错误:', { errorCode, errorMsg })
      
      return res.status(400).json({
        error: `MiniMax API错误 (${errorCode}): ${errorMsg}`,
        code: errorCode
      })
    }

    // 成功返回JSON数据
    return res.status(200).json(result)

  } catch (error) {
    console.error('❌ [Proxy] 代理错误:', error)
    
    return res.status(500).json({
      error: error.message || '代理服务器错误'
    })
  }
}
