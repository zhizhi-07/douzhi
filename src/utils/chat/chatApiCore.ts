/**
 * AI聊天API调用核心模块
 * 从 chatApi.ts 拆分出来的API调用相关函数
 */

import { STORAGE_KEYS } from '../storage'
import type { ApiSettings, ChatMessage } from '../../types/chat'
import { THEATRE_TOOL } from '../theatreTools'

/**
 * API错误类型
 */
export class ChatApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'ChatApiError'
  }
}

/**
 * API响应结果
 */
export interface ApiResponse {
  content: string
  usage: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  } | null
  finish_reason?: string
  tool_calls?: any[]
  isStream?: boolean
  response?: Response
}

/**
 * 获取API配置
 */
export const getApiSettings = (): ApiSettings | null => {
  try {
    const apiSettings = localStorage.getItem(STORAGE_KEYS.API_SETTINGS)
    if (!apiSettings) {
      console.warn('⚠️ [getApiSettings] localStorage中没有API_SETTINGS')
      return null
    }
    const settings = JSON.parse(apiSettings)
    
    // 🔥 智能检测视觉支持：根据模型名称自动判断
    const modelLower = (settings.model || '').toLowerCase()
    const visionModels = ['gemini', 'gpt-4-vision', 'gpt-4o', 'gpt-4-turbo', 'claude-3', 'claude-opus', 'claude-sonnet']
    const modelSupportsVision = visionModels.some(model => modelLower.includes(model))
    
    // 如果模型本身支持视觉，自动开启
    if (modelSupportsVision && !settings.supportsVision) {
      settings.supportsVision = true
      console.log(`🤖 [getApiSettings] 模型 "${settings.model}" 自动开启视觉识别`)
    }
    
    // 🔥 诊断日志：显示完整的API配置
    console.log('📋 [getApiSettings] 当前API配置:', {
      model: settings.model,
      provider: settings.provider,
      supportsVision: settings.supportsVision,
      baseUrl: settings.baseUrl?.substring(0, 30) + '...'
    })
    
    return settings
  } catch (error) {
    console.error('读取API配置失败:', error)
    return null
  }
}

// 请求节流：记录上次请求时间
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 最小请求间隔1秒

/**
 * 延迟函数
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 调用AI API（内部函数，不包含重试逻辑）
 */
const callAIApiInternal = async (
  messages: ChatMessage[],
  settings: ApiSettings,
  enableTheatreCards: boolean = true
): Promise<ApiResponse> => {
  // 请求节流：确保两次请求之间至少间隔1秒
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    if (import.meta.env.DEV) {
      console.log(`⏱️ 请求节流：等待 ${waitTime}ms`)
    }
    await delay(waitTime)
  }
  lastRequestTime = Date.now()
  
  // 超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 300秒超时（5分钟）

  try {
    // 根据 provider 构建不同的请求
    const isGoogleProvider = settings.provider === 'google'
    const url = isGoogleProvider 
      ? settings.baseUrl // Gemini proxy 直接使用 baseUrl
      : `${settings.baseUrl}/chat/completions`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    // Google provider 可能不需要 Authorization
    if (!isGoogleProvider || settings.apiKey !== 'not-needed') {
      headers['Authorization'] = `Bearer ${settings.apiKey}`
    }
    
    // 🔥 检查当前API是否支持视觉识别
    const modelLower = settings.model.toLowerCase()
    const visionModels = [
      'gemini', 'gpt-4-vision', 'gpt-4o', 'gpt-4-turbo',
      'claude-3', 'claude-opus', 'claude-sonnet'
    ]
    const modelSupportsVision = visionModels.some(model => modelLower.includes(model))
    
    let supportsVision = settings.supportsVision
    if (modelSupportsVision) {
      supportsVision = true
      console.log(`🤖 [智能检测] 模型 "${settings.model}" 支持视觉识别，自动开启`)
    } else if (supportsVision === undefined) {
      supportsVision = false
      console.log(`🤖 [智能检测] 模型 "${settings.model}" 不支持视觉识别`)
    }
    
    // 处理带有图片的消息 - 只发送最近1条图片，旧图片只发描述
    let latestImageIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].imageUrl) {
        latestImageIndex = i
        break
      }
    }
    
    const processedMessages = messages.map((msg, index) => {
      if (msg.imageUrl) {
        const isLatestImage = index === latestImageIndex
        
        if (!isLatestImage) {
          const textContent = typeof msg.content === 'string' ? msg.content : ''
          console.log('📸 [图片优化] 跳过旧图片，使用描述:', textContent.substring(0, 30))
          return {
            role: msg.role,
            content: textContent ? `[之前发的图片] ${textContent}` : '[之前发的图片]'
          }
        }
        
        if (!supportsVision) {
          console.warn('⚠️ 当前API不支持视觉识别，跳过图片，只发送文本')
          return {
            role: msg.role,
            content: msg.content
          }
        }
        
        const textForLog = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        console.log('✅ [图片优化] 发送最新图片，内容:', textForLog.substring(0, 50), '| URL前100字符:', msg.imageUrl.substring(0, 100))
        return {
          role: msg.role,
          content: [
            {
              type: 'text',
              text: msg.content
            },
            {
              type: 'image_url',
              image_url: {
                url: msg.imageUrl
              }
            }
          ]
        }
      }
      return msg
    })
    
    console.log('🚀 发送给AI的消息数量:', processedMessages.length)
    const multimodalMsgs = processedMessages.filter((m: any) => Array.isArray(m.content))
    console.log('🖼️ 包含图片的消息数量:', multimodalMsgs.length)
    if (multimodalMsgs.length > 0) {
      console.log('🖼️ 多模态消息详情:', multimodalMsgs.map((m: any) => ({
        role: m.role,
        contentTypes: m.content.map((c: any) => c.type)
      })))
    }
    
    // 🔥 添加朋友圈速报到消息数组
    try {
      const { formatMomentsNewsForPrompt } = await import('../momentsNewsManager')
      const momentsNews = formatMomentsNewsForPrompt(10)
      if (momentsNews) {
        processedMessages.splice(1, 0, {
          role: 'system',
          content: momentsNews
        })
        console.log('📰 [朋友圈速报] 已作为系统消息插入')
      }
    } catch (err) {
      console.error('❌ 加载朋友圈速报失败:', err)
    }
    
    // 规范化消息角色：仅保留首条 system，其余 system 统一降级为 user
    const normalizedMessages = processedMessages.map((m: any, idx: number) => {
      if (idx === 0) return m
      if (m && m.role === 'system') {
        return { ...m, role: 'user' as const }
      }
      return m
    })

    // 检查是否启用流式（仅线下模式）
    const offlineStreamEnabled = localStorage.getItem('offline-streaming') === 'true'
    const isOfflineRequest = localStorage.getItem('current-scene-mode') === 'offline'
    const useStreaming = offlineStreamEnabled && isOfflineRequest
    
    // 线下模式设置
    let maxTokens: number | undefined
    let temperature = settings.temperature ?? 0.7
    
    if (isOfflineRequest) {
      maxTokens = undefined
      console.log(`📏 [线下模式] 强制不设置max_tokens`)
      
      const userTemperature = localStorage.getItem('offline-temperature')
      if (userTemperature) {
        temperature = parseFloat(userTemperature)
        console.log(`🌡️ [线下模式] 使用用户设置的温度: ${temperature}`)
      }
    } else {
      maxTokens = settings.maxTokens ?? 4000
    }
    
    const requestBody: any = {
      model: settings.model,
      messages: normalizedMessages,
      temperature: temperature,
      ...(useStreaming ? { stream: true } : {})
    }
    
    if (maxTokens !== undefined) {
      requestBody.max_tokens = maxTokens
    }
    
    // 🎭 添加小剧场 Function Calling 工具
    const disableFunctionCalling = localStorage.getItem('disable-function-calling') === 'true'
    
    if (import.meta.env.DEV) {
      console.log('🎭 [小剧场] 检查条件:', {
        isOfflineRequest,
        disableFunctionCalling,
        provider: settings.provider,
        model: settings.model
      })
    }
    
    if (!isOfflineRequest && !disableFunctionCalling) {
      if (enableTheatreCards) {
        if (settings.provider === 'custom') {
          requestBody.tools = [{
            type: 'function',
            function: THEATRE_TOOL
          }]
          if (import.meta.env.DEV) {
            console.log('🎭 [小剧场] Function Calling 已启用 (OpenAI 格式 - custom provider)')
          }
        } else if (settings.provider === 'google') {
          requestBody.tools = [{
            function_declarations: [THEATRE_TOOL]
          }]
          if (import.meta.env.DEV) {
            console.log('🎭 [小剧场] Function Calling 已启用 (Gemini 原生格式)')
          }
        } else if (settings.provider === 'openai') {
          requestBody.tools = [{
            type: 'function',
            function: THEATRE_TOOL
          }]
          if (import.meta.env.DEV) {
            console.log('🎭 [小剧场] Function Calling 已启用 (OpenAI 格式)')
          }
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('🎭 [小剧场] 功能已关闭，不传递 THEATRE_TOOL')
        }
      }
    }
    
    if (import.meta.env.DEV) {
      console.log('📤 API请求配置:', { useStreaming, isOfflineRequest, offlineStreamEnabled, maxTokens })
      console.log('📤 API请求体:', JSON.stringify(requestBody).substring(0, 500))
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // 如果是流式响应，返回特殊标记
    if (useStreaming && response.ok) {
      return {
        content: '',
        usage: null,
        isStream: true,
        response: response
      } as any
    }

    if (!response.ok) {
      let errorDetail = ''
      try {
        const errorText = await response.text()
        errorDetail = errorText.substring(0, 200)
        console.error('❌ API错误详情:', errorDetail)
      } catch (e) {
        // 忽略读取错误的异常
      }
      
      if (response.status === 401) {
        throw new ChatApiError('API密钥无效', 'INVALID_API_KEY', 401)
      } else if (response.status === 403) {
        throw new ChatApiError('API密钥无权限或已过期，请检查API密钥是否正确、是否有余额', 'FORBIDDEN', 403)
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? `${retryAfter}秒` : '几秒钟'
        throw new ChatApiError(`请求过于频繁，${waitTime}后会自动重试`, 'RATE_LIMIT', 429)
      } else if (response.status === 502) {
        throw new ChatApiError('网关错误，正在自动重试...', 'BAD_GATEWAY', 502)
      } else if (response.status === 503) {
        const msg = errorDetail ? `服务暂时不可用: ${errorDetail}` : '服务暂时不可用，正在自动重试...'
        throw new ChatApiError(msg, 'SERVICE_UNAVAILABLE', 503)
      } else if (response.status === 504) {
        throw new ChatApiError('网关超时，正在自动重试...', 'GATEWAY_TIMEOUT', 504)
      } else if (response.status >= 500) {
        throw new ChatApiError('API服务器错误', 'SERVER_ERROR', response.status)
      } else {
        throw new ChatApiError(`API调用失败 (${response.status})`, 'API_ERROR', response.status)
      }
    }

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.error('JSON解析失败，API可能返回了HTML页面')
      throw new ChatApiError('API地址错误：返回的是网页而不是API响应，请检查API地址是否正确（需要包含/v1）', 'INVALID_URL')
    }
    
    if (import.meta.env.DEV) {
      console.log('API返回的完整数据:', JSON.stringify(data, null, 2))
    }
    
    if (data.error) {
      const errorMsg = typeof data.error === 'string' ? data.error : data.error.message || '未知错误'
      throw new ChatApiError(`API错误: ${errorMsg}`, 'API_ERROR')
    }
    
    if (data.choices && Array.isArray(data.choices) && data.choices.length === 0) {
      console.error('API返回空choices，可能原因:', {
        usage: data.usage,
        fullData: data
      })
      throw new ChatApiError(
        'API未返回任何内容，可能原因：1) API密钥无效或过期 2) 配额用尽 3) 内容被过滤。请检查API配置或更换API服务。',
        'EMPTY_RESPONSE'
      )
    }
    
    // 🎭 解析小剧场 tool_calls
    const { parseTheatreToolCalls } = await import('../theatreTools')
    const toolCalls = parseTheatreToolCalls(data)
    
    if (toolCalls.length > 0 && import.meta.env.DEV) {
      console.log('🎭 [小剧场] 检测到 tool_calls:', toolCalls)
    }
    
    // 提取内容
    let content: string | undefined
    
    if (data.choices?.[0]?.message?.content) {
      content = data.choices[0].message.content
    } else if (data.candidates?.[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts
      const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text)
      if (textParts.length > 0) {
        content = textParts.join('')
      }
    } else if (data.text) {
      content = data.text
    } else if (data.response) {
      content = data.response
    } else if (data.content) {
      content = data.content
    }
    
    if (!content && toolCalls.length === 0) {
      const finishReasonCheck = data.choices?.[0]?.finish_reason || data.candidates?.[0]?.finishReason
      if (finishReasonCheck === 'content_filter') {
        console.warn('⚠️ 内容被安全过滤')
        content = '...'
      } else {
        console.error('API响应格式不符合预期，实际结构:', {
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length,
          hasCandidates: !!data.candidates,
          hasToolCalls: toolCalls.length > 0,
          finishReason: finishReasonCheck
        })
        throw new ChatApiError(
          `API响应格式错误或内容为空，请检查API配置`, 
          'INVALID_RESPONSE'
        )
      }
    }
    
    if (!content && toolCalls.length > 0) {
      content = ''
      if (import.meta.env.DEV) {
        console.log('🎭 [小剧场] 纯 Function Calling 响应，content 为空')
      }
    }

    let finishReason: string | undefined
    if (data.choices?.[0]?.finish_reason) {
      finishReason = data.choices[0].finish_reason
    } else if (data.candidates?.[0]?.finishReason) {
      finishReason = data.candidates[0].finishReason
    }
    
    return {
      content,
      usage: data.usage || null,
      finish_reason: finishReason,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined
    } as any

  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof ChatApiError) {
      throw error
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ChatApiError('请求超时，请检查网络连接', 'TIMEOUT')
      }
      throw new ChatApiError(`网络错误: ${error.message}`, 'NETWORK_ERROR')
    }
    
    throw new ChatApiError('未知错误', 'UNKNOWN_ERROR')
  }
}

/**
 * 调用AI API（带自动重试）
 */
export const callAIApi = async (
  messages: ChatMessage[],
  settings: ApiSettings,
  enableTheatreCards: boolean = true
): Promise<ApiResponse> => {
  const MAX_RETRIES = 3
  let lastError: ChatApiError | null = null
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callAIApiInternal(messages, settings, enableTheatreCards)
    } catch (error) {
      if (error instanceof ChatApiError) {
        lastError = error
        
        const shouldRetry = (
          error.statusCode === 429 || 
          error.statusCode === 502 || 
          error.statusCode === 503 || 
          error.statusCode === 504
        ) && attempt < MAX_RETRIES - 1
        
        if (shouldRetry) {
          const waitTime = Math.pow(2, attempt) * 1000
          const errorMsg = error.statusCode === 429 ? '频率限制' : 
                          error.statusCode === 503 ? '服务暂时不可用' :
                          error.statusCode === 502 ? '网关错误' : '网关超时'
          if (import.meta.env.DEV) {
            console.log(`⚠️ 遇到${errorMsg}，${waitTime/1000}秒后重试 (${attempt + 1}/${MAX_RETRIES})`)
          }
          await delay(waitTime)
          continue
        }
        
        throw error
      }
      
      throw error
    }
  }
  
  throw lastError || new ChatApiError('未知错误', 'UNKNOWN_ERROR')
}
