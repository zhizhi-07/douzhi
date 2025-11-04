/**
 * 消息处理工具函数
 */

import type { Message, ChatMessage } from '../types/chat'

/**
 * 配置常量
 */
export const MESSAGE_CONFIG = {
  MAX_HISTORY_COUNT: 20, // 发送给AI的最大历史消息数（增加到20条）
  STORAGE_KEY_PREFIX: 'chat_messages_'
} as const

/**
 * 创建新消息
 */
export const createMessage = (
  content: string,
  type: 'sent' | 'received' | 'system'
): Message => {
  const now = Date.now()
  return {
    id: now,
    type,
    content,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: now
  }
}

/**
 * 创建系统消息
 * 专门用于创建系统提示消息，避免类型转换
 */
export const createSystemMessage = (content: string): Message => {
  const now = Date.now()
  return {
    id: now,
    type: 'system',
    content,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: now,
    messageType: 'system'
  }
}

/**
 * 转换消息为API格式
 */
export const convertToApiMessages = (messages: Message[]): ChatMessage[] => {
  return messages
    .map(msg => {
      // 处理撤回的消息
      if (msg.isRecalled && msg.recalledContent) {
        const isUserRecalled = msg.originalType === 'sent'
        return {
          role: isUserRecalled ? 'user' as const : 'assistant' as const,
          content: isUserRecalled 
            ? `[撤回了消息: "${msg.recalledContent}"]`
            : `[我撤回了消息: "${msg.recalledContent}"]`
        }
      }
      
      // 过滤系统消息
      if (msg.type === 'system') {
        return null
      }
      
      // 转账消息转换为AI可读格式
      if (msg.messageType === 'transfer' && msg.transfer) {
        const isUserSent = msg.type === 'sent'
        const statusText = msg.transfer.status === 'pending' ? '待处理' 
                         : msg.transfer.status === 'received' ? '已收款' 
                         : '已退还'
        
        const transferInfo = isUserSent
          ? `[用户给你发起了转账：¥${msg.transfer.amount.toFixed(2)}，说明：${msg.transfer.message || '无'}，状态：${statusText}]`
          : `[你给用户发起了转账：¥${msg.transfer.amount.toFixed(2)}，说明：${msg.transfer.message || '无'}，状态：${statusText}]`
        
        return {
          role: isUserSent ? 'user' as const : 'assistant' as const,
          content: transferInfo
        }
      }
      
      // 语音消息转换为AI可读格式
      if (msg.messageType === 'voice' && msg.voiceText) {
        const voiceInfo = `[语音: ${msg.voiceText}]`
        return {
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: voiceInfo
        }
      }
      
      // 位置消息转换为AI可读格式
      if (msg.messageType === 'location' && msg.location) {
        const locationInfo = `[位置: ${msg.location.name} - ${msg.location.address}]`
        return {
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: locationInfo
        }
      }
      
      // 照片消息转换为AI可读格式
      if (msg.messageType === 'photo' && msg.photoDescription) {
        const photoInfo = msg.type === 'sent'
          ? `[用户发了照片: ${msg.photoDescription}]`
          : `[你发了照片: ${msg.photoDescription}]`
        return {
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: photoInfo
        }
      }
      
      // 普通文本消息
      return {
        role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }
    })
    .filter((msg): msg is Exclude<typeof msg, null> => msg !== null) as ChatMessage[]
}

/**
 * 获取最近的消息
 */
export const getRecentMessages = (
  messages: Message[],
  count: number = MESSAGE_CONFIG.MAX_HISTORY_COUNT
): Message[] => {
  return messages.slice(-count)
}

/**
 * 加载聊天消息
 */
export const loadChatMessages = (chatId: string): Message[] => {
  try {
    const key = `${MESSAGE_CONFIG.STORAGE_KEY_PREFIX}${chatId}`
    const savedMessages = localStorage.getItem(key)
    return savedMessages ? JSON.parse(savedMessages) : []
  } catch (error) {
    console.error('加载消息失败:', error)
    return []
  }
}

/**
 * 保存聊天消息
 */
export const saveChatMessages = (chatId: string, messages: Message[]): void => {
  try {
    const key = `${MESSAGE_CONFIG.STORAGE_KEY_PREFIX}${chatId}`
    localStorage.setItem(key, JSON.stringify(messages))
  } catch (error) {
    console.error('保存消息失败:', error)
    // 可以在这里添加错误上报或用户提示
  }
}

/**
 * 解析AI回复，支持多条消息（按换行分隔）
 */
export const parseAIMessages = (aiReply: string): string[] => {
  // 按换行符分隔消息
  return aiReply
    .split('\n')
    .map(msg => msg.trim())
    .filter(msg => msg.length > 0)
}
