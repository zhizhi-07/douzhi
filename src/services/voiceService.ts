/**
 * 语音服务配置管理
 * 支持MiniMax、OpenAI等语音API
 */

export interface VoiceConfig {
  id: string
  name: string
  provider: 'minimax' | 'openai' | 'custom'
  apiKey: string
  baseUrl?: string
  groupId?: string  // MiniMax需要的group_id
  voiceId?: string  // 声音ID
  model?: string    // 模型名称
  createdAt: string
}

const STORAGE_KEY = 'voice_configs'
const CURRENT_VOICE_ID_KEY = 'current_voice_id'

// 内置配置
const BUILT_IN_MINIMAX: VoiceConfig = {
  id: 'built-in-minimax',
  name: 'MiniMax语音',
  provider: 'minimax',
  apiKey: '',
  baseUrl: 'https://api.minimaxi.com/v1',  // 国际版，支持声音克隆
  groupId: '',
  voiceId: '',  // 用户自己输入
  model: 'speech-01',
  createdAt: new Date().toISOString()
}

export const voiceService = {
  // 获取所有配置
  getAll: (): VoiceConfig[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const userConfigs = stored ? JSON.parse(stored) : []
      
      // 加载内置配置的override
      const builtInOverrideStr = localStorage.getItem('built_in_minimax_override')
      const builtInWithOverride = builtInOverrideStr 
        ? { ...BUILT_IN_MINIMAX, ...JSON.parse(builtInOverrideStr) }
        : BUILT_IN_MINIMAX
      
      return [builtInWithOverride, ...userConfigs]
    } catch {
      return [BUILT_IN_MINIMAX]
    }
  },

  // 获取当前选中的配置ID
  getCurrentId: (): string => {
    return localStorage.getItem(CURRENT_VOICE_ID_KEY) || 'built-in-minimax'
  },

  // 设置当前配置
  setCurrentId: (id: string): void => {
    localStorage.setItem(CURRENT_VOICE_ID_KEY, id)
  },

  // 根据ID获取配置
  getById: (id: string): VoiceConfig | null => {
    const configs = voiceService.getAll()
    return configs.find(c => c.id === id) || null
  },

  // 获取当前配置
  getCurrent: (): VoiceConfig | null => {
    const currentId = voiceService.getCurrentId()
    return voiceService.getById(currentId)
  },

  // 添加新配置
  add: (config: Omit<VoiceConfig, 'id' | 'createdAt'>): VoiceConfig => {
    const newConfig: VoiceConfig = {
      ...config,
      id: `voice-${Date.now()}`,
      createdAt: new Date().toISOString()
    }

    const configs = voiceService.getAll().filter(c => !c.id.startsWith('built-in-'))
    configs.push(newConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
    
    // 自动切换到新配置
    voiceService.setCurrentId(newConfig.id)
    return newConfig
  },

  // 更新配置
  update: (id: string, updates: Partial<VoiceConfig>): VoiceConfig | null => {
    // 如果是内置配置，保存到单独的key
    if (id === 'built-in-minimax') {
      const builtInOverride: Partial<VoiceConfig> = {}
      if (updates.apiKey !== undefined) builtInOverride.apiKey = updates.apiKey
      if (updates.groupId !== undefined) builtInOverride.groupId = updates.groupId
      if (updates.voiceId !== undefined) builtInOverride.voiceId = updates.voiceId
      
      localStorage.setItem('built_in_minimax_override', JSON.stringify(builtInOverride))
      
      // 返回更新后的配置
      return {
        ...BUILT_IN_MINIMAX,
        ...builtInOverride
      } as VoiceConfig
    }

    const configs = voiceService.getAll().filter(c => !c.id.startsWith('built-in-'))
    const index = configs.findIndex(c => c.id === id)
    
    if (index === -1) return null

    configs[index] = { ...configs[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
    
    return configs[index]
  },

  // 删除配置
  delete: (id: string): void => {
    if (id.startsWith('built-in-')) return // 不能删除内置配置

    const configs = voiceService.getAll().filter(c => !c.id.startsWith('built-in-') && c.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
    
    // 如果删除的是当前配置，切换回内置
    if (voiceService.getCurrentId() === id) {
      voiceService.setCurrentId('built-in-minimax')
    }
  }
}
