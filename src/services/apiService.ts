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
  supportsVision?: boolean  // 是否支持视觉识别（图片理解）
}

// 内置API配置
const BUILT_IN_CONFIGS: ApiConfig[] = [
  {
    id: 'built-in-gemini-2.5-pro',
    name: 'Gemini 2.5 Pro（内置）',
    baseUrl: 'https://xy.xiaoxu030.xyz:8888/v1',  // custom provider会添加/chat/completions
    apiKey: 'sk-9M5Ji34noQ3AiXYeFPv6bI0DrSomsP0MfOTKSvwTleGPNuVS',
    model: 'gemini-2.5-pro(满血250w上下文cli3)',
    provider: 'custom',  // 自定义API端点，最终URL: baseUrl + /chat/completions
    temperature: 0.7,
    maxTokens: 8000,
    createdAt: new Date().toISOString(),
    isBuiltIn: true,
    supportsVision: true  // Gemini支持视觉识别
  }
]

export const apiService = {
  // 获取所有API配置
  getAll: (): ApiConfig[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.API_CONFIGS)
      if (saved) {
        let configs = JSON.parse(saved)
        let needsUpdate = false
        
        // 🔥 关键修复：自动更新内置API配置，确保字段是最新的
        configs = configs.map((c: ApiConfig) => {
          const builtInConfig = BUILT_IN_CONFIGS.find(b => b.id === c.id)
          if (builtInConfig) {
            // 如果是内置API，强制更新所有字段（包括apiKey）
            const updated = {
              ...builtInConfig,
              temperature: c.temperature ?? builtInConfig.temperature,
              maxTokens: c.maxTokens ?? builtInConfig.maxTokens
            }
            // 检查 apiKey 是否不同，强制更新
            if (c.apiKey !== builtInConfig.apiKey) {
              needsUpdate = true
              console.log(`🔄 更新内置API的apiKey: ${c.name}`)
            }
            if (JSON.stringify(c) !== JSON.stringify(updated)) {
              needsUpdate = true
              console.log(`🔄 更新内置API配置: ${c.name}`)
            }
            return updated
          }
          return c
        })
        
        // 检查是否已经包含所有内置API
        const hasAllBuiltIn = BUILT_IN_CONFIGS.every(b => 
          configs.some((c: ApiConfig) => c.id === b.id)
        )
        
        if (!hasAllBuiltIn) {
          // 添加缺失的内置API到列表开头
          const missingBuiltIn = BUILT_IN_CONFIGS.filter(b =>
            !configs.some((c: ApiConfig) => c.id === b.id)
          )
          configs = [...missingBuiltIn, ...configs]
          needsUpdate = true
          console.log('✅ 已自动添加内置API配置')
        }
        
        // 如果有更新，保存回localStorage
        if (needsUpdate) {
          localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(configs))
        }
        
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
    // 如果没有保存的配置，返回第一个可用配置的ID
    if (!saved) {
      const configs = apiService.getAll()
      return configs.length > 0 ? configs[0].id : ''
    }
    return saved
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
        maxTokens: currentConfig.maxTokens,
        supportsVision: currentConfig.supportsVision
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
