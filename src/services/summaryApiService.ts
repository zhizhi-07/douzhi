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

// 默认副API配置 - 硅基流动（便宜且快速）
const defaultSummaryApi: SummaryApiConfig = {
  baseUrl: 'https://api.siliconflow.cn/v1',
  apiKey: 'sk-biaugiqxfopyfosfxpggeqcitfwkwnsgkduvjavygdtpoicm',
  model: 'deepseek-ai/DeepSeek-V3',
  provider: 'siliconflow'
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
