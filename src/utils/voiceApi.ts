/**
 * 语音API调用工具 - 简化版
 * 统一通过代理调用MiniMax TTS API
 */

import { voiceService } from '../services/voiceService'

export interface TTSResponse {
  audioUrl: string
  duration?: number
}

/**
 * 调用MiniMax语音合成API（统一通过代理）
 */
export async function callMinimaxTTS(
  text: string,
  apiKey?: string,
  groupId?: string,
  voiceId?: string
): Promise<TTSResponse> {
  // 获取配置
  const config = voiceService.getCurrent()
  const finalApiKey = apiKey || config?.apiKey
  const finalGroupId = groupId || config?.groupId
  const finalVoiceId = voiceId || ''

  // 验证必需参数
  if (!finalApiKey) throw new Error('未配置API Key')
  if (!finalGroupId) throw new Error('未配置Group ID')
  if (!finalVoiceId) throw new Error('未配置Voice ID（请在聊天设置中配置角色专属音色）')

  console.log('🎤 调用语音合成:', { voiceId: finalVoiceId, textLength: text.length })

  try {
    const baseUrl = config?.baseUrl || 'https://api.minimaxi.com/v1'
    
    // 🔥 优先使用代理（避免CORS问题）
    const useProxy = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    
    let response: Response
    
    if (useProxy) {
      // 使用Netlify Functions代理
      response = await fetch('/api/minimax-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          apiKey: finalApiKey,
          groupId: finalGroupId,
          voiceId: finalVoiceId,
          baseUrl
        })
      }).catch(err => {
        console.error('代理请求失败:', err)
        throw new Error('语音服务请求失败\n\n可能原因：\n1. 网络连接问题\n2. 代理服务未部署\n3. API配置错误\n\n请检查网络连接或联系管理员')
      })
    } else {
      // 本地开发直接调用（可能有CORS问题）
      response = await fetch(`${baseUrl}/text_to_speech?GroupId=${finalGroupId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalApiKey}`
        },
        body: JSON.stringify({
          text,
          model: 'speech-01',
          voice_id: finalVoiceId,
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
          audio_sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3'
        })
      }).catch(err => {
        console.error('直接请求失败:', err)
        throw new Error('语音API请求失败\n\n本地开发环境可能遇到CORS跨域限制\n建议：\n1. 部署到生产环境使用代理\n2. 或使用浏览器CORS插件')
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorMsg = '语音合成失败'
      try {
        const errorJson = JSON.parse(errorText)
        errorMsg = errorJson.error || errorJson.message || errorMsg
        
        // 特殊错误处理
        if (errorMsg.includes('not allowed') || errorMsg.includes('permission')) {
          errorMsg = 'API权限错误，请检查：\n1. API Key是否正确\n2. Group ID是否正确\n3. 账户余额是否充足'
        }
      } catch {}
      throw new Error(errorMsg)
    }

    // 处理音频响应
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('audio')) {
      const audioBlob = await response.blob()
      
      // 转为base64保存（可持久化到localStorage）
      const reader = new FileReader()
      const audioUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string
          resolve(base64) // 返回 data:audio/mpeg;base64,xxx 格式
        }
        reader.readAsDataURL(audioBlob)
      })
      
      console.log('✅ 语音合成成功，已转为base64')
      return { audioUrl }
    }

    throw new Error('未收到音频数据')
  } catch (error) {
    console.error('❌ 语音合成失败:', error)
    throw error instanceof Error ? error : new Error('语音合成失败')
  }
}


/**
 * 播放音频
 */
export async function playAudio(audioUrl: string): Promise<void> {
  const audio = new Audio(audioUrl)
  await audio.play()
  return new Promise((resolve) => {
    audio.onended = () => resolve()
  })
}

/**
 * 测试语音配置
 */
export async function testVoiceConfig(
  apiKey: string,
  groupId: string,
  voiceId: string
): Promise<void> {
  const result = await callMinimaxTTS('你好，这是语音测试', apiKey, groupId, voiceId)
  await playAudio(result.audioUrl)
}
