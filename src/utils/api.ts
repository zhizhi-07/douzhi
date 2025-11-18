import { getItem, STORAGE_KEYS } from './storage'

export interface ApiSettings {
  baseUrl: string
  apiKey: string
  model: string
  provider: 'google' | 'openai' | 'claude' | 'siliconflow' | 'custom'
  temperature?: number
  maxTokens?: number
}

// 请求去重缓存（防止重复扣费）
const requestCache = new Map<string, Promise<string>>()

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string | MessageContent[]
}

interface MessageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
    detail?: 'low' | 'high' | 'auto'
  }
}

/**
 * 带超时的fetch请求（根据请求类型动态调整超时时间）
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 30000): Promise<Response> {
  // 根据请求体判断是否需要更长的超时时间
  try {
    const body = options.body ? JSON.parse(options.body as string) : {}

    // 如果是生成长文本（max_tokens > 2000），增加超时时间
    if (body.max_tokens && body.max_tokens > 2000) {
      timeout = 180000 // 3 分钟
      console.log(`⏱️ 检测到长文本生成请求，超时时间延长至 ${timeout}ms`)
    }

    // 如果包含图片，也增加超时时间
    if (body.messages && Array.isArray(body.messages)) {
      const hasImage = body.messages.some((msg: any) =>
        Array.isArray(msg.content) && msg.content.some((c: any) => c.type === 'image_url')
      )
      if (hasImage) {
        timeout = 180000 // 3 分钟
        console.log(`⏱️ 检测到图片请求，超时时间延长至 ${timeout}ms`)
      }
    }
  } catch (e) {
    // 解析失败，使用默认超时时间
  }

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
 * OpenAI格式API调用
 */
async function callOpenAIFormatAPI(messages: Message[], settings: ApiSettings): Promise<string> {
  let baseUrl = settings.baseUrl.replace(/\/$/, '')
  const endpoint = baseUrl.endsWith('/v1') ? '/chat/completions' : '/v1/chat/completions'
  const fullUrl = `${baseUrl}${endpoint}`
  
  console.log('📡 请求URL:', fullUrl)
  console.log('🔑 使用API Key:', settings.apiKey.substring(0, 10) + '...')
  
  const response = await fetchWithTimeout(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-3.5-turbo',
      messages,
      temperature: settings.temperature ?? 0.7,
      max_tokens: settings.maxTokens || 2000
    })
  }, 300000)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('API错误响应:', errorText)
    
    if (response.status === 401 || response.status === 403) {
      throw new Error(`API认证失败 (${response.status})，请检查API密钥`)
    }
    
    // 检测是否是Vision模型错误
    if (response.status === 400 && (
      errorText.includes('VLM') || 
      errorText.includes('Vision') ||
      errorText.includes('image') ||
      errorText.includes('multimodal')
    )) {
      throw new Error('VISION_NOT_SUPPORTED')
    }
    
    throw new Error(`API调用失败 (${response.status})`)
  }
  
  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('API响应格式错误')
  }
  
  return data.choices[0].message.content
}

/**
 * Google Gemini API调用
 */
async function callGoogleAPI(messages: Message[], settings: ApiSettings): Promise<string> {
  let model = settings.model || 'gemini-1.5-flash'
  let baseUrl = settings.baseUrl.replace(/\/$/, '')
  
  // 如果是反代地址，不需要添加版本号
  const isProxy = baseUrl.includes('workers.dev') || baseUrl.includes('cloudflare') || baseUrl.includes('netlify/functions')
  
  // 确保URL包含版本号（官方API需要）
  if (!isProxy && !baseUrl.includes('/v1') && !baseUrl.endsWith('v1beta')) {
    baseUrl = `${baseUrl}/v1beta`
  }
  
  if (model.startsWith('models/')) {
    model = model.replace('models/', '')
  }
  
  // 反代不需要 key 参数，官方 API 需要
  const url = isProxy 
    ? `${baseUrl}/v1beta/models/${model}:generateContent`
    : `${baseUrl}/models/${model}:generateContent?key=${settings.apiKey}`
  
  console.log('📡 请求URL:', `${baseUrl}/models/${model}:generateContent`)
  console.log('🤖 使用模型:', model)
  
  // 转换消息格式为Gemini格式（支持Vision）
  const geminiContents = []
  let systemPrompt = ''
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      // 系统提示词合并到第一条用户消息
      systemPrompt = typeof msg.content === 'string' ? msg.content : ''
      continue
    }
    
    const parts = []
    
    // 如果有系统提示词，添加到第一条用户消息
    if (systemPrompt && msg.role === 'user') {
      parts.push({ text: systemPrompt })
      systemPrompt = '' // 只添加一次
    }
    
    if (typeof msg.content === 'string') {
      // 纯文字消息
      parts.push({ text: msg.content })
    } else if (Array.isArray(msg.content)) {
      // 包含图片的消息
      for (const item of msg.content) {
        if (item.type === 'text' && item.text) {
          parts.push({ text: item.text })
        } else if (item.type === 'image_url' && item.image_url) {
          const imageUrl = item.image_url.url
          // 检查是base64还是URL
          if (imageUrl.startsWith('data:image')) {
            // base64格式
            const matches = imageUrl.match(/data:image\/(\w+);base64,(.+)/)
            if (matches) {
              parts.push({
                inline_data: {
                  mime_type: `image/${matches[1]}`,
                  data: matches[2]
                }
              })
              console.log('📷 添加base64图片到Gemini请求')
            }
          } else if (imageUrl.startsWith('http')) {
            // HTTP URL - Gemini需要先下载转base64
            console.warn('⚠️ Gemini不直接支持HTTP URL图片，需要转换为base64')
            // 暂时跳过HTTP URL图片
            parts.push({
              text: '[图片链接: ' + imageUrl + ']'
            })
          }
        }
      }
    }
    
    geminiContents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: parts
    })
  }
  
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: geminiContents,
      generationConfig: {
        temperature: settings.temperature ?? 0.7,
        maxOutputTokens: settings.maxTokens || 2000
      }
    })
  }, 300000)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Google API错误响应:', errorText)
    
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Google API认证失败 (${response.status})，请检查API密钥`)
    }
    
    if (response.status === 429) {
      throw new Error(`Google API配额超限 (429)`)
    }
    
    throw new Error(`Google API调用失败 (${response.status})`)
  }
  
  const data = await response.json()
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    console.error('Google API响应格式错误:', data)
    throw new Error('Google API响应格式错误')
  }
  
  const parts = data.candidates[0].content.parts
  if (!parts || parts.length === 0) {
    throw new Error('Google API响应内容为空')
  }
  
  return parts[0].text
}

/**
 * 主API调用函数
 */
export async function callAI(messages: Message[] | string, retries = 1, customMaxTokens?: number): Promise<string> {
  const settings = getItem<ApiSettings>(STORAGE_KEYS.API_SETTINGS, {} as ApiSettings)

  // 如果提供了自定义maxTokens，使用它
  if (customMaxTokens) {
    settings.maxTokens = customMaxTokens
  }

  // 生成请求指纹（用于去重）
  const fingerprint = JSON.stringify({
    messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
    maxTokens: customMaxTokens || settings.maxTokens,
    model: settings.model
  })

  // 检查是否有正在进行的相同请求
  if (requestCache.has(fingerprint)) {
    console.log('🔄 检测到重复请求，使用缓存结果（防止重复扣费）')
    return requestCache.get(fingerprint)!
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🚀 开始调用AI API')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (!settings.baseUrl || !settings.apiKey) {
    console.error('❌ API配置未完成')
    throw new Error('请先配置API')
  }

  // 根据baseUrl自动检测provider
  const baseUrl = settings.baseUrl || ''
  let actualProvider = settings.provider || 'custom'

  if (baseUrl.includes('generativelanguage.googleapis.com') ||
      baseUrl.includes('zhizhi.2373922440jhj.workers.dev') ||
      baseUrl.includes('netlify/functions/gemini-proxy')) {
    // Google Gemini 官方 API 或反代
    actualProvider = 'google'
  } else if (baseUrl.includes('api.openai.com')) {
    actualProvider = 'openai'
  } else if (baseUrl.includes('api.anthropic.com')) {
    actualProvider = 'claude'
  } else if (baseUrl.includes('api.siliconflow.cn')) {
    actualProvider = 'siliconflow'
  } else if (baseUrl.includes('hiapi.online') || baseUrl.includes('jiubanai.com')) {
    // OpenAI格式的Gemini代理（HiAPI、九班AI等）
    actualProvider = 'openai'
  }

  settings.provider = actualProvider

  console.log('📋 API配置信息：')
  console.log('  提供商:', actualProvider)
  console.log('  地址:', settings.baseUrl)
  console.log('  模型:', settings.model)
  console.log('  温度:', settings.temperature)
  console.log('  最大Token:', settings.maxTokens)

  // 转换消息格式
  const apiMessages: Message[] = Array.isArray(messages)
    ? messages
    : [{ role: 'user', content: messages }]

  console.log('💬 发送消息数量:', apiMessages.length)
  const lastContent = apiMessages[apiMessages.length - 1]?.content
  const contentPreview = typeof lastContent === 'string'
    ? lastContent.substring(0, 100)
    : '[包含图片]'
  console.log('📝 最后一条消息:', contentPreview + '...')

  let lastError: Error | null = null

  // 创建请求 Promise 并缓存
  const requestPromise = (async () => {
    try {
  
  // 重试机制
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 重试 API 调用 (${attempt}/${retries})...`)
        await new Promise(resolve => setTimeout(resolve, Math.min(attempt * 500, 2000)))
      }
      
      console.log(`⏳ 正在调用 ${actualProvider} API...`)
      const startTime = Date.now()
      
      let result: string
      if (actualProvider === 'google') {
        result = await callGoogleAPI(apiMessages, settings)
      } else {
        result = await callOpenAIFormatAPI(apiMessages, settings)
      }
      
      const duration = Date.now() - startTime
      console.log(`✅ API调用成功！`)
      console.log(`⏱️  耗时: ${duration}ms`)
      console.log(`📊 返回内容长度: ${result.length} 字符`)
      console.log(`💡 返回内容预览: ${result.substring(0, 100)}...`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      return result
      
    } catch (error: any) {
      lastError = error
      console.error(`❌ API调用失败 (尝试 ${attempt + 1}/${retries + 1}):`, error.message)
      
      // 网络错误可以重试
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('请求超时')) {
        console.warn(`⚠️  网络错误: ${error.message}`)
        if (attempt < retries) {
          console.log('🔄 准备重试...')
          continue
        }
      }
      
      // 认证错误直接抛出
      if (error.message.includes('认证失败') || 
          error.message.includes('请先配置API')) {
        console.error('🔒 认证失败，停止重试')
        throw error
      }
    }
  }

  console.error('❌ 所有重试都失败了')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  throw lastError || new Error('API调用失败')
    } finally {
      // 请求完成后清理缓存（无论成功还是失败）
      requestCache.delete(fingerprint)
    }
  })()

  // 缓存请求
  requestCache.set(fingerprint, requestPromise)

  return requestPromise
}

/**
 * 测试API连接
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    await callAI('你好')
    return true
  } catch {
    return false
  }
}

/**
 * 拉取可用模型列表 - 真实API调用
 */
export async function fetchModels(settings: ApiSettings): Promise<string[]> {
  const { baseUrl, apiKey, provider } = settings
  
  if (!baseUrl || !apiKey) {
    throw new Error('请先填写API地址和密钥')
  }

  try {
    if (provider === 'google') {
      // Google Gemini API - 真实拉取
      let cleanBaseUrl = baseUrl.replace(/\/$/, '')
      
      // 确保URL包含版本号
      if (!cleanBaseUrl.includes('/v1') && !cleanBaseUrl.endsWith('v1beta')) {
        cleanBaseUrl = `${cleanBaseUrl}/v1beta`
      }
      
      const url = `${cleanBaseUrl}/models?key=${apiKey}`
      console.log('📡 拉取Google模型列表:', url.replace(apiKey, 'API_KEY_HIDDEN'))
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, 10000)

      if (!response.ok) {
        const errorText = await response.text()
        console.warn('Google API拉取失败:', response.status, errorText)
        
        // 如果是认证错误，抛出明确错误
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Google API认证失败，请检查API密钥是否正确`)
        }
        
        // 其他错误返回预设列表
        console.warn('使用预设模型列表')
        return [
          'gemini-2.0-flash-exp',
          'gemini-1.5-flash',
          'gemini-1.5-flash-8b',
          'gemini-1.5-pro',
          'gemini-pro',
        ]
      }

      const data = await response.json()
      console.log('✅ Google API返回数据:', data)
      
      if (data.models && Array.isArray(data.models)) {
        const models = data.models
          .filter((m: any) => m.name && m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', ''))
        
        console.log(`✅ 成功拉取 ${models.length} 个Google模型`)
        return models.length > 0 ? models : [
          'gemini-2.0-flash-exp',
          'gemini-1.5-flash',
          'gemini-1.5-flash-8b',
          'gemini-1.5-pro',
          'gemini-pro',
        ]
      }
      
      return [
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro',
        'gemini-pro',
      ]
    } else {
      // OpenAI格式API（包括SiliconFlow等）- 真实拉取
      const url = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`
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
        console.log(`成功拉取 ${models.length} 个模型`)
        return models
      }
      
      throw new Error('API响应格式错误')
    }
  } catch (error: any) {
    console.error('拉取模型错误:', error)
    throw new Error(error.message || '拉取模型列表失败')
  }
}

