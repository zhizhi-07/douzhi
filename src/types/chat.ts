/**
 * 聊天相关类型定义
 */

export interface Message {
  id: number
  type: 'received' | 'sent' | 'system'
  content: string
  time: string
  timestamp: number
  messageType?: 'text' | 'transfer' | 'system' | 'voice' | 'location' | 'photo'
  transfer?: {
    amount: number
    message: string
    status?: 'pending' | 'received' | 'expired'
  }
  voiceText?: string  // 语音消息的文本内容
  location?: {        // 位置消息
    name: string      // 地点名称
    address: string   // 详细地址
  }
  photoDescription?: string  // 照片描述
  isRecalled?: boolean        // 是否已撤回
  recalledContent?: string    // 撤回前的原始内容（供AI查看）
  recallReason?: string       // 撤回理由
  originalType?: 'received' | 'sent'  // 撤回前的原始消息类型
  quotedMessage?: {           // 引用的消息
    id: number
    content: string
    senderName: string
    type: 'received' | 'sent'
  }
}

export interface Character {
  id: string
  realName: string
  nickname?: string
  signature?: string
  avatar?: string
  personality?: string  // 人设描述/性格
  world?: string        // 世界观
}

export interface ApiSettings {
  baseUrl: string
  apiKey: string
  model: string
  provider: string
  temperature?: number
  maxTokens?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
