import { setItem, STORAGE_KEYS } from '../utils/storage'

export interface ApiConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  provider: 'google' | 'openai' | 'claude' | 'siliconflow' | 'custom'
  temperature?: number
  maxTokens?: number
  createdAt: string
  isBuiltIn?: boolean
}

// 内置API配置 - 九班AI（主力）
const jiubanApiConfig: ApiConfig = {
  id: 'default-jiuban',
  name: '九班AI (Gemini 2.5 Pro)',
  baseUrl: 'https://gy.jiubanai.com/v1',
  apiKey: 'sk-NqOuYUHhjx8qWOjZCdA34XTMvJ7PXsxoHRQLNQDg3xyMYfJk',
  model: 'gemini-2.5-pro',
  provider: 'openai',
  temperature: 0.7,
  maxTokens: 8000,
  createdAt: new Date().toISOString(),
  isBuiltIn: true
}

// 内置API配置 - HiAPI
const hiApiConfig: ApiConfig = {
  id: 'default-hiapi',
  name: 'HiAPI (Gemini 2.5 Pro)',
  baseUrl: 'https://hiapi.online/v1',
  apiKey: 'sk-D3TeNLaMBIYW9QN4AguxWucHo4zTWRhcr4V1EZ3OaVTPSjSB',
  model: 'gemini-2.5-pro',
  provider: 'openai',
  temperature: 0.7,
  maxTokens: 8000,
  createdAt: new Date().toISOString(),
  isBuiltIn: true
}

// 内置API配置 - Gemini反代
const geminiProxyConfig: ApiConfig = {
  id: 'default-gemini-proxy',
  name: 'Gemini 反代（备用）',
  baseUrl: 'https://zhizhi-ai.netlify.app/.netlify/functions/gemini-proxy',
  apiKey: 'not-needed',
  model: 'gemini-2.5-pro',
  provider: 'google',
  temperature: 0.7,
  maxTokens: 8000,
  createdAt: new Date().toISOString(),
  isBuiltIn: true
}

// 内置API配置 - 硅基流动（备用）
const siliconflowApiConfig: ApiConfig = {
  id: 'default-siliconflow',
  name: '硅基流动（备用）',
  baseUrl: 'https://api.siliconflow.cn/v1',
  apiKey: 'sk-dfyuqxuizfdxqjlbovnaeebcvptbqzzvqcdahtggzrovktmo',
  model: 'deepseek-ai/DeepSeek-V3',
  provider: 'siliconflow',
  temperature: 0.7,
  maxTokens: 8000,
  createdAt: new Date().toISOString(),
  isBuiltIn: true
}

const BUILT_IN_CONFIGS = [jiubanApiConfig, hiApiConfig, geminiProxyConfig, siliconflowApiConfig]

export const apiService = {
  // 获取所有API配置
  getAll: (): ApiConfig[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.API_CONFIGS)
      if (saved) {
        const configs = JSON.parse(saved)
        // 如果本地没有保存任何配置，返回内置配置
        if (configs.length === 0) {
          return BUILT_IN_CONFIGS
        }
        // 返回本地保存的所有配置（包括已编辑的内置配置）
        return configs
      }
      // 首次使用，返回并保存内置配置
      localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(BUILT_IN_CONFIGS))
      return BUILT_IN_CONFIGS
    } catch (error) {
      console.error('读取API配置失败:', error)
      return BUILT_IN_CONFIGS
    }
  },

  // 获取当前API配置ID
  getCurrentId: (): string => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_API_ID)
    return saved || 'default-jiuban'
  },

  // 设置当前API配置
  setCurrentId: (id: string): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_API_ID, id)
    
    // 更新API设置到localStorage供API调用使用
    const configs = apiService.getAll()
    const currentConfig = configs.find(api => api.id === id)
    if (currentConfig) {
      setItem(STORAGE_KEYS.API_SETTINGS, {
        baseUrl: currentConfig.baseUrl,
        apiKey: currentConfig.apiKey,
        model: currentConfig.model,
        provider: currentConfig.provider,
        temperature: currentConfig.temperature,
        maxTokens: currentConfig.maxTokens
      })
    }
  },

  // 添加API配置
  add: (config: Omit<ApiConfig, 'id' | 'createdAt'>): ApiConfig => {
    const newConfig: ApiConfig = {
      ...config,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    
    const configs = apiService.getAll()
    configs.push(newConfig)
    localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(configs))
    
    // 自动切换到新添加的API
    apiService.setCurrentId(newConfig.id)
    
    return newConfig
  },

  // 更新API配置
  update: (id: string, updates: Partial<ApiConfig>): ApiConfig | null => {
    const configs = apiService.getAll()
    const index = configs.findIndex(c => c.id === id)
    
    if (index === -1) return null
    
    configs[index] = { ...configs[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(configs))
    
    // 如果是当前使用的API，更新localStorage
    if (apiService.getCurrentId() === id) {
      apiService.setCurrentId(id)
    }
    
    return configs[index]
  },

  // 删除API配置
  delete: (id: string): void => {
    const configs = apiService.getAll()
    const filtered = configs.filter(c => c.id !== id)
    localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(filtered))
    
    // 如果删除的是当前API，切换到第一个可用API
    if (apiService.getCurrentId() === id) {
      const remaining = apiService.getAll()
      if (remaining.length > 0) {
        apiService.setCurrentId(remaining[0].id)
      }
    }
  },

  // 根据ID获取API配置
  getById: (id: string): ApiConfig | null => {
    const configs = apiService.getAll()
    return configs.find(c => c.id === id) || null
  }
}
