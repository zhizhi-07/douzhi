/**
 * 本地开发代理服务器
 * 用于转发MiniMax TTS请求，解决CORS问题
 * 使用：node dev-proxy.js
 */

const http = require('http')
const https = require('https')

const PORT = 3001

const server = http.createServer(async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end('Method not allowed')
    return
  }

  // 读取请求体
  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', async () => {
    try {
      const { text, apiKey, groupId, voiceId, baseUrl = 'https://api.minimaxi.com/v1' } = JSON.parse(body)

      if (!text || !apiKey || !groupId || !voiceId) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: '缺少必需参数' }))
        return
      }

      console.log('🎤 转发TTS请求:', { voiceId, textLength: text.length })

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
      const urlMatch = minimaxUrl.match(/^https?:\/\/([^\/]+)(.*)$/)
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
        // 转发响应
        res.writeHead(response.statusCode, {
          'Content-Type': response.headers['content-type'],
          'Access-Control-Allow-Origin': '*'
        })
        response.pipe(res)
      })

      request.on('error', (error) => {
        console.error('❌ 请求错误:', error)
        res.writeHead(500)
        res.end(JSON.stringify({ error: error.message }))
      })

      request.write(requestBody)
      request.end()

    } catch (error) {
      console.error('❌ 处理错误:', error)
      res.writeHead(500)
      res.end(JSON.stringify({ error: error.message }))
    }
  })
})

server.listen(PORT, () => {
  console.log(`✅ 本地代理服务器运行在: http://localhost:${PORT}`)
  console.log(`   前端请求会转发到MiniMax API`)
})
