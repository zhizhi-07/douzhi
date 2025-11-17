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
    baseUrl: 'https://xy.xiaoxu030.xyz:8888/v1',
    apiKey: 'sk-P3jVxHNx7YvU07J0w818ZUHoiSPGaKDdhb7kNMxFhAPjM13s',
    model: 'gemini-2.5-pro',
    provider: 'custom',  // 自定义API端点
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
        const configs = JSON.parse(saved)
        
        // 🔥 关键修复：自动合并内置API到用户配置列表
        // 检查是否已经包含内置API
        const hasBuiltIn = configs.some((c: ApiConfig) => 
          BUILT_IN_CONFIGS.some(b => b.id === c.id)
        )
        
        if (!hasBuiltIn && BUILT_IN_CONFIGS.length > 0) {
          // 如果没有内置API，添加到列表开头
          const mergedConfigs = [...BUILT_IN_CONFIGS, ...configs]
          // 保存合并后的配置
          localStorage.setItem(STORAGE_KEYS.API_CONFIGS, JSON.stringify(mergedConfigs))
          console.log('✅ 已自动添加内置API配置')
          return mergedConfigs
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
