import { ApiConfig } from '../services/apiService'

/**
 * 带超时的fetch请求
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`请求超时 (${timeout}ms)`)
    }
    throw error
  }
}

/**
 * 拉取可用模型列表
 */
export async function fetchModels(settings: Partial<ApiConfig>): Promise<string[]> {
  const { baseUrl, apiKey, provider } = settings
  
  if (!baseUrl || !apiKey) {
    throw new Error('请先填写API地址和密钥')
  }

  try {
    if (provider === 'google') {
      // Google Gemini API
      let cleanBaseUrl = baseUrl.replace(/\/$/, '')
      
      if (!cleanBaseUrl.includes('/v1') && !cleanBaseUrl.endsWith('v1beta')) {
        cleanBaseUrl = `${cleanBaseUrl}/v1beta`
      }
      
      const url = `${cleanBaseUrl}/models?key=${apiKey}`
      console.log('📡 拉取Google模型列表')
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, 10000)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Google API认证失败，请检查API密钥`)
        }
        
        console.warn('使用预设模型列表')
        return [
          'gemini-2.0-flash-exp',
          'gemini-exp-1206',
          'gemini-2.0-flash-thinking-exp-1219',
          'gemini-2.5-pro',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
        ]
      }

      const data = await response.json()
      
      if (data.models && Array.isArray(data.models)) {
        const models = data.models
          .filter((m: any) => m.name && m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', ''))
        
        console.log(`✅ 成功拉取 ${models.length} 个Google模型`)
        return models.length > 0 ? models : [
          'gemini-2.0-flash-exp',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
        ]
      }
      
      return [
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ]
    } else {
      // OpenAI格式API（包括SiliconFlow等）
      const url = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`
      console.log('📡 拉取模型列表:', url)
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }, 10000)

      if (!response.ok) {
        throw new Error(`拉取模型失败 (${response.status})`)
      }

      const data = await response.json()
      if (data.data && Array.isArray(data.data)) {
        const models = data.data.map((model: any) => model.id).sort()
        console.log(`✅ 成功拉取 ${models.length} 个模型`)
        return models
      }
      
      throw new Error('API响应格式错误')
    }
  } catch (error: any) {
    console.error('拉取模型失败:', error)
    throw new Error(error.message || '拉取模型失败，请检查网络连接')
  }
}
