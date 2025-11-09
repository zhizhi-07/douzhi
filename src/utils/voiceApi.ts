/**
 * 语音API调用工具
 * 支持MiniMax TTS API
 */

import { voiceService } from '../services/voiceService'

export interface TTSRequest {
  text: string
  voiceId?: string
  speed?: number
  vol?: number
  pitch?: number
  audioSampleRate?: number
  bitrate?: number
}

export interface TTSResponse {
  audioUrl: string
  duration: number
}

/**
 * 调用MiniMax语音合成API
 */
export async function callMinimaxTTS(
  text: string,
  apiKey?: string,
  groupId?: string,
  voiceId?: string
): Promise<TTSResponse> {
  // 如果没有传入配置，使用当前配置
  const config = voiceService.getCurrent()
  const finalApiKey = apiKey || config?.apiKey
  const finalGroupId = groupId || config?.groupId
  const finalVoiceId = voiceId || config?.voiceId || ''

  if (!finalApiKey) {
    throw new Error('未配置API Key')
  }

  if (!finalGroupId) {
    throw new Error('未配置Group ID')
  }

  // 使用Serverless代理避免CORS跨域问题
  // 本地开发: /api/minimax-tts
  // 生产环境: https://your-domain.vercel.app/api/minimax-tts
  const proxyUrl = '/api/minimax-tts'
  const baseUrl = config?.baseUrl || 'https://api.minimaxi.com/v1'

  const requestBody = {
    text: text,
    apiKey: finalApiKey,
    groupId: finalGroupId,
    voiceId: finalVoiceId,
    baseUrl: baseUrl
  }

  console.log('🎤 [MiniMax TTS] 通过代理调用语音合成API')
  console.log('- Proxy URL:', proxyUrl)
  console.log('- Base URL:', baseUrl)
  console.log('- API Key前8位:', finalApiKey.substring(0, 8))
  console.log('- Group ID:', finalGroupId)
  console.log('- Voice ID:', finalVoiceId)

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 [MiniMax TTS] API响应状态:', response.status)
    const contentType = response.headers.get('content-type') || ''
    console.log('📡 [MiniMax TTS] 响应类型:', contentType)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [MiniMax TTS] API错误:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.message || errorJson.error || '语音合成失败')
      } catch {
        throw new Error(`API错误 (${response.status}): ${errorText}`)
      }
    }

    // 检查是否返回音频文件（二进制）
    if (contentType.includes('audio') || contentType.includes('octet-stream')) {
      console.log('🎵 [MiniMax TTS] 收到二进制音频数据')
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      return {
        audioUrl,
        duration: 0
      }
    }

    // 否则当作JSON处理
    const result = await response.json()
    console.log('✅ [MiniMax TTS] API成功返回')
    console.log('📦 返回数据结构:', result)
    console.log('📦 返回数据字段:', Object.keys(result))

    // 检查MiniMax的业务错误码
    if (result.base_resp?.status_code !== undefined && result.base_resp.status_code !== 0) {
      const errorCode = result.base_resp.status_code
      const errorMsg = result.base_resp.status_msg || '未知错误'
      
      // 特殊错误处理
      if (errorCode === 1008) {
        throw new Error('余额不足！请前往MiniMax控制台充值。\n访问：https://platform.minimaxi.com')
      }
      
      throw new Error(`MiniMax API错误 (${errorCode}): ${errorMsg}`)
    }

    // MiniMax可能返回不同的字段
    // 尝试多种可能的字段名
    const audioData = result.audio_file || result.data || result.audio || result.base_resp?.audio_file
    
    if (audioData) {
      console.log('🎵 找到音频数据，类型:', typeof audioData)
      
      // 将base64转为blob URL
      const audioBlob = base64ToBlob(audioData, 'audio/mp3')
      const audioUrl = URL.createObjectURL(audioBlob)
      
      return {
        audioUrl,
        duration: result.duration || result.audio_time || 0
      }
    }

    // 如果是URL直接返回
    if (result.audio_url || result.url) {
      return {
        audioUrl: result.audio_url || result.url,
        duration: result.duration || 0
      }
    }

    console.error('❌ 无法找到音频数据，完整返回:', JSON.stringify(result, null, 2))
    throw new Error('API返回格式错误，请查看控制台了解详情')
  } catch (error) {
    console.error('❌ [MiniMax TTS] 调用失败:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('语音合成失败，请检查网络连接')
  }
}

/**
 * 将base64转换为Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * 播放音频URL
 */
export function playAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl)
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      resolve()
    }
    
    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl)
      reject(new Error('音频播放失败'))
    }
    
    audio.play().catch(reject)
  })
}

/**
 * 测试语音配置
 */
export async function testVoiceConfig(
  apiKey: string,
  groupId: string,
  voiceId: string
): Promise<boolean> {
  try {
    const result = await callMinimaxTTS(
      '你好，这是语音测试。',
      apiKey,
      groupId,
      voiceId
    )
    
    await playAudio(result.audioUrl)
    return true
  } catch (error) {
    console.error('语音测试失败:', error)
    throw error
  }
}
