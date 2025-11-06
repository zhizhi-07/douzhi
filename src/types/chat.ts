/**
 * 聊天相关类型定义
 */

export interface Message {
  id: number
  type: 'sent' | 'received' | 'system'
  content?: string
  aiReadableContent?: string  // AI读取的内容（如果与用户看到的不同）
  time: string
  timestamp: number
  messageType?: 'text' | 'voice' | 'location' | 'photo' | 'transfer' | 'video-call-record' | 'system' | 'intimatePay' | 'forwarded-chat' | 'emoji'
  blocked?: boolean  // 是否被拉黑（AI消息显示警告图标）
  blockedByReceiver?: boolean  // 用户被AI拉黑（用户消息显示警告图标和拒收提示）
  transfer?: {
    amount: number
    message: string
    status?: 'pending' | 'received' | 'expired'
    paidByIntimatePay?: boolean  // 是否使用亲密付支付
    intimatePayCharacterName?: string  // 亲密付支付人名称
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
    type: 'received' | 'sent' | 'system'
  }
  videoCallRecord?: {         // 视频通话记录
    duration: number          // 通话时长（秒）
    messages: Array<{
      id: number
      type: 'user' | 'ai' | 'narrator'
      content: string
      time: string
    }>
  }
  coupleSpaceInvite?: {       // 情侣空间邀请
    status: 'pending' | 'accepted' | 'rejected'
    senderName: string
    senderAvatar?: string
  }
  intimatePay?: {             // 亲密付
    monthlyLimit: number
    status: 'pending' | 'accepted' | 'rejected'
    characterName: string
  }
  forwardedChat?: {           // 转发的聊天记录
    title: string             // 标题
    messages: Array<{
      senderName: string
      content: string
      messageType?: string
      time?: string
    }>
    messageCount: number      // 消息数量
  }
  emoji?: {                   // 表情包
    id: number
    url: string
    name: string
    description: string
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
