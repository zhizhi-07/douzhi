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
  if (!finalApiKey) throw new Error('未配置API Key\n\n请前往：系统设置 → 语音设置')
  if (!finalGroupId) throw new Error('未配置Group ID\n\n请前往：系统设置 → 语音设置')
  if (!finalVoiceId) throw new Error('未配置Voice ID\n\n请前往：聊天设置 → 语音设置 → 配置音色ID')

  console.log('🎤 调用语音合成:', { 
    voiceId: finalVoiceId, 
    textLength: text.length,
    hasApiKey: !!finalApiKey,
    hasGroupId: !!finalGroupId
  })

  try {
    const baseUrl = config?.baseUrl || 'https://api.minimaxi.com/v1'
    
    // 🔥 判断是否使用代理（部署环境需要代理避免CORS）
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    
    let response: Response
    
    if (isProduction) {
      // 生产环境：使用 Vercel Serverless Function 代理
      console.log('🌐 使用代理调用语音API')
      console.log('📍 代理URL:', '/api/minimax-tts')
      console.log('📦 请求参数:', { textLength: text.length, hasApiKey: !!finalApiKey, hasGroupId: !!finalGroupId, voiceId: finalVoiceId })
      
      try {
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
        })
        console.log('✅ 代理响应状态:', response.status)
      } catch (err: any) {
        console.error('❌ 代理请求失败:', err)
        console.error('❌ 错误详情:', {
          name: err?.name,
          message: err?.message,
          stack: err?.stack
        })
        throw new Error('语音服务请求失败\n\nFailed to fetch\n\n可能原因：\n1. 网络连接问题\n2. 代理服务异常\n3. 请求被浏览器阻止\n\n请检查网络连接或稍后重试')
      }
    } else {
      // 本地开发：直接调用
      console.log('🏠 本地开发，直接调用语音API')
      try {
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
        })
      } catch (err) {
        console.error('❌ 语音API请求失败:', err)
        throw new Error('语音API请求失败\n\n可能原因：\n1. 网络连接问题\n2. CORS跨域限制\n\n请检查网络连接')
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorMsg = '语音合成失败'
      let errorDetails = ''
      
      console.error('❌ 语音API错误:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      })
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMsg = errorJson.error || errorJson.message || errorMsg
        
        // 详细错误处理
        if (errorMsg.includes('not allowed') || errorMsg.includes('permission') || errorMsg.includes('unauthorized')) {
          errorMsg = 'API权限错误'
          errorDetails = '\n\n请检查：\n1. API Key是否正确\n2. Group ID是否正确\n3. 账户余额是否充足\n4. API Key是否已激活'
        } else if (errorMsg.includes('voice_id') || errorMsg.includes('voice')) {
          errorMsg = 'Voice ID错误'
          errorDetails = '\n\n请检查：\n1. Voice ID是否正确\n2. 该音色是否存在\n3. 是否有权限使用该音色'
        } else if (response.status === 400) {
          errorDetails = '\n\n请求参数错误，请检查配置'
        } else if (response.status === 401) {
          errorDetails = '\n\nAPI Key无效或已过期'
        } else if (response.status === 403) {
          errorDetails = '\n\n无权限访问，请检查账户状态'
        } else if (response.status === 429) {
          errorDetails = '\n\n请求过于频繁，请稍后再试'
        } else if (response.status === 500) {
          errorDetails = '\n\nMiniMax服务器错误\n\n可能原因：\n1. Voice ID不存在或无权限\n2. 文本内容有问题\n3. API配置错误\n4. 服务器故障\n\n详细错误：' + errorText.substring(0, 200)
        } else if (response.status >= 500) {
          errorDetails = '\n\nMiniMax服务器错误，请稍后再试'
        }
      } catch {
        errorDetails = `\n\nHTTP ${response.status}: ${errorText.substring(0, 200)}`
      }
      
      throw new Error(errorMsg + errorDetails)
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
