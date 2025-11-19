/**
 * 副API管理器 - 用于处理总结等辅助任务
 * 减轻主API负载，支持使用更便宜的模型
 */

import { STORAGE_KEYS } from './storage'
import type { ApiSettings, ChatMessage } from '../types/chat'
import { callAIApi } from './chatApi'

const SUB_API_STORAGE_KEY = 'SUB_API_SETTINGS'

export interface SubApiSettings extends ApiSettings {
  isSubApi: true
  usageScope?: string[] // 使用范围：['summary', 'translation', 'analysis']
}

/**
 * 获取副API配置
 */
export const getSubApiSettings = (): SubApiSettings | null => {
  try {
    const subApiSettings = localStorage.getItem(SUB_API_STORAGE_KEY)
    if (!subApiSettings) {
      return null
    }
    const settings = JSON.parse(subApiSettings)
    return {
      ...settings,
      isSubApi: true
    }
  } catch (error) {
    console.error('Failed to load sub API settings:', error)
    return null
  }
}

/**
 * 保存副API配置
 */
export const saveSubApiSettings = (settings: Partial<SubApiSettings>) => {
  try {
    const current = getSubApiSettings()
    const updated = {
      ...current,
      ...settings,
      isSubApi: true
    }
    localStorage.setItem(SUB_API_STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch (error) {
    console.error('Failed to save sub API settings:', error)
    return false
  }
}

/**
 * 使用副API或主API调用
 * 优先使用副API，如果未配置则使用主API
 */
export const callApiWithFallback = async (
  messages: ChatMessage[],
  options?: {
    preferSubApi?: boolean
    maxTokens?: number
    temperature?: number
  }
): Promise<{ content: string; usedSubApi: boolean }> => {
  const { preferSubApi = true, maxTokens, temperature } = options || {}
  
  // 尝试获取副API设置
  let apiSettings: ApiSettings | null = null
  let usedSubApi = false
  
  if (preferSubApi) {
    const subApi = getSubApiSettings()
    if (subApi) {
      apiSettings = subApi
      usedSubApi = true
      console.log('📡 使用副API进行调用')
    }
  }
  
  // 如果没有副API，使用主API
  if (!apiSettings) {
    const mainApiJson = localStorage.getItem(STORAGE_KEYS.API_SETTINGS)
    if (mainApiJson) {
      apiSettings = JSON.parse(mainApiJson)
      console.log('📡 使用主API进行调用')
    }
  }
  
  if (!apiSettings) {
    throw new Error('未配置API（主API和副API都未设置）')
  }
  
  // 合并选项
  const finalSettings: ApiSettings = {
    ...apiSettings,
    maxTokens: maxTokens || apiSettings.maxTokens || 500,
    temperature: temperature || apiSettings.temperature || 0.7
  }
  
  try {
    const response = await callAIApi(messages, finalSettings)
    return {
      content: response.content,
      usedSubApi
    }
  } catch (error) {
    // 如果副API失败，尝试主API
    if (usedSubApi) {
      console.warn('副API调用失败，尝试使用主API', error)
      const mainApiJson = localStorage.getItem(STORAGE_KEYS.API_SETTINGS)
      if (mainApiJson) {
        const mainApi = JSON.parse(mainApiJson)
        const response = await callAIApi(messages, {
          ...mainApi,
          maxTokens: maxTokens || mainApi.maxTokens || 500,
          temperature: temperature || mainApi.temperature || 0.7
        })
        return {
          content: response.content,
          usedSubApi: false
        }
      }
    }
    throw error
  }
}

/**
 * 生成AI总结（优先使用副API）
 */
export const generateAISummary = async (
  content: string,
  options?: {
    maxLength?: number
    style?: 'brief' | 'detailed' | 'bullet'
  }
): Promise<string> => {
  const { maxLength = 200, style = 'brief' } = options || {}
  
  let prompt = ''
  switch (style) {
    case 'brief':
      prompt = `请为以下内容生成一个简洁的总结（不超过${maxLength}字）：

${content}

要求：
1. 提取关键信息和主要事件
2. 保持客观准确
3. 语言精炼`
      break
      
    case 'detailed':
      prompt = `请为以下内容生成一个详细的总结：

${content}

要求：
1. 完整概括所有重要信息
2. 分析因果关系和发展脉络
3. 总结不超过${maxLength * 2}字`
      break
      
    case 'bullet':
      prompt = `请为以下内容生成要点式总结：

${content}

要求：
1. 用要点形式列出关键信息
2. 每个要点一行
3. 不超过${Math.floor(maxLength / 20)}个要点`
      break
  }
  
  const { content: summary } = await callApiWithFallback(
    [{ role: 'user', content: prompt }],
    {
      preferSubApi: true,
      maxTokens: maxLength * 2,
      temperature: 0.5 // 总结任务使用较低温度
    }
  )
  
  return summary
}

/**
 * 检查副API是否可用
 */
export const isSubApiAvailable = (): boolean => {
  const subApi = getSubApiSettings()
  return subApi !== null && !!subApi.apiKey && !!subApi.baseUrl
}

/**
 * 获取API使用统计
 */
export const getApiUsageStats = () => {
  const stats = {
    mainApiConfigured: false,
    subApiConfigured: false,
    recommendSubApi: false
  }
  
  // 检查主API
  const mainApi = localStorage.getItem(STORAGE_KEYS.API_SETTINGS)
  stats.mainApiConfigured = !!mainApi
  
  // 检查副API
  stats.subApiConfigured = isSubApiAvailable()
  
  // 建议配置副API（如果主API存在但副API不存在）
  stats.recommendSubApi = stats.mainApiConfigured && !stats.subApiConfigured
  
  return stats
}
