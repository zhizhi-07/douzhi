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
      
      // 视频通话记录转换为AI可读格式
      if (msg.messageType === 'video-call-record' && msg.videoCallRecord) {
        const duration = msg.videoCallRecord.duration
        const durationText = `${Math.floor(duration / 60)}分${duration % 60}秒`
        
        // 提取通话对话内容
        const conversations = msg.videoCallRecord.messages
          .filter(m => m.type !== 'narrator') // 过滤掉旁白
          .map(m => {
            const speaker = m.type === 'user' ? '用户' : '你'
            return `${speaker}: ${m.content}`
          })
          .join('\n')
        
        const callInfo = `[视频通话记录 - 时长${durationText}]\n通话内容:\n${conversations}`
        
        return {
          role: 'system' as const,
          content: callInfo
        }
      }
      
      // 系统消息转换为AI可读格式（保留重要通知）
      if (msg.type === 'system') {
        // 如果是亲密付通知或其他重要系统消息，让AI看到
        if (msg.content.includes('亲密付') || msg.content.includes('情侣空间')) {
          // 格式化亲密付通知，确保AI能理解
          let formattedContent = msg.content
          
          // 解析亲密付使用通知
          if (msg.content.includes('的亲密付被使用了')) {
            const lines = msg.content.split('\n')
            formattedContent = `【重要通知】${lines.join('，')}`
          }
          
          console.log('🔍 AI将看到系统通知:', formattedContent)
          return {
            role: 'system' as const,
            content: formattedContent
          }
        }
        // 其他系统消息过滤掉
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
      
      // 普通文本消息（包含引用信息）
      let textContent = msg.content
      if (msg.quotedMessage && msg.quotedMessage.content) {
        // 简化引用内容显示
        let quotedContent = msg.quotedMessage.content
        // 如果引用内容太长，截取前50字
        if (quotedContent.length > 50) {
          quotedContent = quotedContent.substring(0, 50) + '...'
        }
        const quotedPrefix = `[引用了${msg.quotedMessage.senderName}的消息: "${quotedContent}"] `
        textContent = quotedPrefix + textContent
      }
      return {
        role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
        content: textContent
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
    
    // 触发消息保存事件，供全局监听器检测
    window.dispatchEvent(new CustomEvent('chat-message-saved', {
      detail: { chatId, messageCount: messages.length }
    }))
  } catch (error) {
    console.error('保存消息失败:', error)
    // 可以在这里添加错误上报或用户提示
  }
}

/**
 * 向指定角色的聊天记录添加通知消息
 */
export const addNotificationToChat = (characterId: string, content: string): void => {
  try {
    const key = `${MESSAGE_CONFIG.STORAGE_KEY_PREFIX}${characterId}`
    const saved = localStorage.getItem(key)
    const messages: Message[] = saved ? JSON.parse(saved) : []
    
    // 创建通知消息
    const notificationMsg: Message = {
      id: Date.now(),
      type: 'system',
      content,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'system'
    }
    
    messages.push(notificationMsg)
    localStorage.setItem(key, JSON.stringify(messages))
    
    // 触发消息保存事件
    window.dispatchEvent(new CustomEvent('chat-message-saved', {
      detail: { chatId: characterId, messageCount: messages.length }
    }))
    
    // 触发新通知事件（用于实时更新聊天页面）
    window.dispatchEvent(new CustomEvent('chat-notification-received', {
      detail: { 
        chatId: characterId, 
        message: notificationMsg,
        isIntimatePay: content.includes('亲密付')
      }
    }))
    
    console.log(`📬 已向 ${characterId} 的聊天添加通知:`, content)
  } catch (error) {
    console.error('添加通知消息失败:', error)
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
