/**
 * 副API服务（专门用于智能总结等功能）
 */

const SUMMARY_API_KEY = 'summary_api_config'

export interface SummaryApiConfig {
  baseUrl: string
  apiKey: string
  model: string
  provider: 'google' | 'openai' | 'claude' | 'siliconflow' | 'custom'
}

// 默认副API配置已移除，用户需要自行配置
// 示例配置格式：
// {
//   baseUrl: 'https://your-api-endpoint.com/v1',
//   apiKey: 'your-api-key',
//   model: 'your-model-name',
//   provider: 'openai' // 或 'google', 'claude', 'siliconflow', 'custom'
// }
const defaultSummaryApi: SummaryApiConfig = {
  baseUrl: '',
  apiKey: '',
  model: '',
  provider: 'custom'
}

export const summaryApiService = {
  // 获取副API配置
  get(): SummaryApiConfig {
    const saved = localStorage.getItem(SUMMARY_API_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (error) {
        console.error('解析副API配置失败:', error)
      }
    }
    return defaultSummaryApi
  },

  // 保存副API配置
  save(config: SummaryApiConfig): void {
    localStorage.setItem(SUMMARY_API_KEY, JSON.stringify(config))
  },

  // 重置为默认配置
  reset(): void {
    localStorage.setItem(SUMMARY_API_KEY, JSON.stringify(defaultSummaryApi))
  },

  // 获取默认配置
  getDefault(): SummaryApiConfig {
    return { ...defaultSummaryApi }
  }
}
