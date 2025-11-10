/**
 * 语音服务配置管理 - 简化版
 */

export interface VoiceConfig {
  apiKey: string
  groupId: string
  baseUrl?: string
}

const STORAGE_KEY = 'minimax_voice_config'

// 默认配置
const DEFAULT_CONFIG: VoiceConfig = {
  apiKey: '',
  groupId: '',
  baseUrl: 'https://api.minimaxi.com/v1'
}

export const voiceService = {
  // 获取配置
  getCurrent(): VoiceConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const config = JSON.parse(stored)
        return { ...DEFAULT_CONFIG, ...config }
      }
    } catch (error) {
      console.error('读取语音配置失败:', error)
    }
    return { ...DEFAULT_CONFIG }
  },

  // 保存配置
  save(config: VoiceConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      console.log('✅ 语音配置已保存')
    } catch (error) {
      console.error('保存语音配置失败:', error)
      throw new Error('保存配置失败')
    }
  },

  // 检查配置是否完整
  isConfigured(): boolean {
    const config = this.getCurrent()
    return !!(config.apiKey && config.groupId)
  },

  // 清空配置
  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
    console.log('✅ 语音配置已清空')
  }
}
