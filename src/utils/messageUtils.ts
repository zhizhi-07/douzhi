/**
 * 消息处理工具函数
 */

import type { Message, ChatMessage } from '../types/chat'
import { loadMessages, saveMessages } from './simpleMessageManager'

/**
 * 配置常量
 */
export const MESSAGE_CONFIG = {
  MAX_HISTORY_COUNT: 20, // 默认的最大历史消息数
  STORAGE_KEY_PREFIX: 'chat_messages_',
  SETTINGS_KEY_PREFIX: 'chat_settings_'
} as const

/**
 * 获取指定聊天的消息条数设置
 */
export const getMessageLimitSetting = (chatId: string): number => {
  const settingsKey = `${MESSAGE_CONFIG.SETTINGS_KEY_PREFIX}${chatId}`
  const saved = localStorage.getItem(settingsKey)
  
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      return settings.messageLimit ?? MESSAGE_CONFIG.MAX_HISTORY_COUNT
    } catch {
      return MESSAGE_CONFIG.MAX_HISTORY_COUNT
    }
  }
  
  return MESSAGE_CONFIG.MAX_HISTORY_COUNT
}

// 全局计数器，确保同一毫秒内生成的ID也是唯一的
let messageIdCounter = 0

/**
 * 创建新消息
 */
export const createMessage = (
  content: string,
  type: 'sent' | 'received' | 'system'
): Message => {
  const now = Date.now()
  // 组合时间戳和计数器，确保ID唯一
  const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
  return {
    id: uniqueId,
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
  // 使用计数器确保ID唯一
  const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
  return {
    id: uniqueId,
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
        
        // 提取通话对话内容（包括旁白）
        const conversations = msg.videoCallRecord.messages
          .map(m => {
            if (m.type === 'narrator') {
              return `[画面: ${m.content}]` // 保留旁白（画面描述）
            }
            const speaker = m.type === 'user' ? '用户' : '你'
            return `${speaker}: ${m.content}`
          })
          .join('\n')
        
        const callInfo = `[视频通话记录 - 时长${durationText}]\n通话内容:\n${conversations}`
        
        console.log('📞 [messageUtils] 视频通话记录已转换为AI可读格式', {
          时长: durationText,
          消息数: msg.videoCallRecord.messages.length,
          对话行数: conversations.split('\n').length
        })
        console.log('转换后的内容：', callInfo)
        
        return {
          role: 'system' as const,
          content: callInfo
        }
      }
      
      // 转发的聊天记录转换为AI可读格式
      if (msg.messageType === 'forwarded-chat' && msg.forwardedChat) {
        const title = msg.forwardedChat.title
        const messageCount = msg.forwardedChat.messageCount
        
        // 提取聊天记录内容
        const chatContent = msg.forwardedChat.messages
          .map(m => {
            // 处理特殊消息类型
            let content = m.content
            if (m.messageType === 'photo') content = '[图片]'
            else if (m.messageType === 'voice') content = '[语音]'
            else if (m.messageType === 'location') content = '[位置]'
            else if (m.messageType === 'transfer') content = '[转账]'
            else if (m.messageType === 'video-call-record') content = '[视频通话]'
            else if (m.messageType === 'emoji') content = '[表情包]'
            
            return `${m.senderName}: ${content}`
          })
          .join('\n')
        
        const forwardedInfo = msg.type === 'sent'
          ? `[用户转发了聊天记录]\n标题: ${title}\n共${messageCount}条消息\n聊天内容:\n${chatContent}`
          : `[对方转发了聊天记录]\n标题: ${title}\n共${messageCount}条消息\n聊天内容:\n${chatContent}`
        
        console.log('💬 [messageUtils] 转发记录已转换为AI可读格式', {
          标题: title,
          消息数: messageCount
        })
        console.log('转换后的内容：', forwardedInfo)
        
        return {
          role: msg.type === 'sent' ? ('user' as const) : ('assistant' as const),
          content: forwardedInfo
        }
      }
      
      // 系统消息转换为AI可读格式（保留重要通知）
      if (msg.type === 'system') {
        console.log('🔍 检查系统消息:', msg.content)
        
        // 重要系统消息列表（这些消息需要让AI看到）
        const importantKeywords = [
          '亲密付',
          '情侣空间',
          '拒绝了',
          '驳回',
          '修改了',
          '视频通话',
          '拉黑',
          '解除拉黑',
          '拨打',
          '未接通',
          '取消了'
        ]
        
        // 使用 aiReadableContent（如果有）或 content 来检查
        const checkContent = msg.aiReadableContent || msg.content || ''
        const isImportant = importantKeywords.some(keyword => checkContent.includes(keyword))
        
        console.log('  - 是否重要:', isImportant)
        
        if (isImportant) {
          // 优先使用 aiReadableContent，如果没有则使用 content
          let formattedContent = msg.aiReadableContent || msg.content || ''
          
          // 格式化亲密付使用通知
          if (formattedContent.includes('的亲密付被使用了')) {
            const lines = formattedContent.split('\n')
            formattedContent = `【重要通知】${lines.join('，')}`
          }
          
          console.log('  ✅ AI将看到系统通知:', formattedContent)
          return {
            role: 'system' as const,
            content: formattedContent
          }
        }
        
        console.log('  ❌ 系统消息被过滤')
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
        // 🔥 添加消息ID，让AI能够引用这张图片（用于换头像等功能）
        const photoInfo = msg.type === 'sent'
          ? `[用户发了照片: ${msg.photoDescription}] (消息ID: ${msg.id})`
          : `[你发了照片: ${msg.photoDescription}]`
        
        // 如果有base64编码且是用户发送的照片，添加imageUrl字段供视觉识别API使用
        const chatMessage: ChatMessage = {
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: photoInfo
        }
        
        if (msg.photoBase64 && msg.type === 'sent') {
          console.log('📸 照片消息转换: photoBase64长度=', msg.photoBase64.length)
          chatMessage.imageUrl = `data:image/jpeg;base64,${msg.photoBase64}`
          console.log('✅ 已添加imageUrl到ChatMessage')
        } else {
          console.log('⚠️ 照片消息没有photoBase64数据')
        }
        
        return chatMessage
      }
      
      // 表情包消息转换为AI可读格式
      if (msg.messageType === 'emoji' && msg.emoji) {
        // 🔥 修复：让AI看到的格式和AI应该使用的格式一致，避免AI混淆
        // AI看到：[表情:描述] → AI学会：也要用[表情:描述]格式发送
        const emojiInfo = msg.type === 'sent'
          ? `[用户发了表情包] [表情:${msg.emoji.description}]`
          : `[表情:${msg.emoji.description}]`  // AI自己发的，直接显示指令格式
        return {
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: emojiInfo
        }
      }
      
      // 普通文本消息（包含引用信息）
      // 🔥 优先使用aiReadableContent（包含朋友圈等上下文），如果没有则使用content
      let textContent = msg.aiReadableContent || msg.content
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
 * @param messages 消息列表
 * @param chatId 聊天ID，用于读取用户设置的消息条数
 * @param count 手动指定的消息条数（优先级更高）
 */
export const getRecentMessages = (
  messages: Message[],
  chatId?: string,
  count?: number
): Message[] => {
  // 优先使用手动指定的count，否则从设置中读取，最后使用默认值
  let limit = count
  
  if (limit === undefined && chatId) {
    limit = getMessageLimitSetting(chatId)
  }
  
  if (limit === undefined) {
    limit = MESSAGE_CONFIG.MAX_HISTORY_COUNT
  }
  
  // 0 表示全部消息
  if (limit === 0) {
    return messages
  }
  
  return messages.slice(-limit)
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
 * 保存聊天消息（使用统一的存储管理器）
 */
export const saveChatMessages = (chatId: string, msgs: Message[]): void => {
  // 🔥 使用simpleMessageManager统一管理（已升级到IndexedDB）
  saveMessages(chatId, msgs)
}

/**
 * 向指定角色的聊天记录添加通知消息
 */
export const addNotificationToChat = (characterId: string, content: string): void => {
  // 🔥 使用simpleMessageManager统一管理
  const messages = loadMessages(characterId)
  
  // 创建通知消息
  const now = Date.now()
  const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
  const notificationMsg: Message = {
    id: uniqueId,
    type: 'system',
    content,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: now,
    messageType: 'system'
  }
  
  messages.push(notificationMsg)
  saveMessages(characterId, messages)
  
  // 触发新通知事件（用于实时更新聊天页面）
  window.dispatchEvent(new CustomEvent('chat-notification-received', {
    detail: { 
      chatId: characterId, 
      message: notificationMsg,
      isIntimatePay: content.includes('亲密付')
    }
  }))
  
  console.log(`📬 已向 ${characterId} 的聊天添加通知:`, content)
}

/**
 * 解析AI回复，支持多条消息（按换行分隔）
 * 特殊处理：[视频通话]指令会把它和后面的开场白合并成一条（遇到空行分隔）
 */
export const parseAIMessages = (aiReply: string): string[] => {
  // 检测视频通话指令
  const videoCallMatch = aiReply.match(/[\[【]视频通话[\]】]/)
  
  if (videoCallMatch) {
    // 找到[视频通话]的位置
    const parts = aiReply.split(videoCallMatch[0])
    const beforeCall = parts[0]?.trim() || ''
    const afterCall = parts[1] || ''
    
    const messages: string[] = []
    
    // [视频通话]前面的内容按正常方式分割（这些是普通消息）
    if (beforeCall) {
      const beforeMessages = beforeCall
        .split('\n')
        .map(msg => msg.trim())
        .filter(msg => msg.length > 0)
      messages.push(...beforeMessages)
    }
    
    // 🔥 修复：只把紧跟在[视频通话]后的连续内容当作开场白，遇到空行就分隔
    // 按双换行符（空行）分段
    const afterCallParts = afterCall.split(/\n\s*\n/)
    
    // 第一段是开场白（可能包含多行）
    const openingLines = afterCallParts[0]?.trim() || ''
    const videoCallMessage = openingLines 
      ? `${videoCallMatch[0]}\n${openingLines}`
      : videoCallMatch[0]
    messages.push(videoCallMessage)
    
    // 后面的段落作为普通消息
    for (let i = 1; i < afterCallParts.length; i++) {
      const segment = afterCallParts[i]?.trim()
      if (segment) {
        // 每个段落可能包含多行，按行分割
        const segmentLines = segment
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
        messages.push(...segmentLines)
      }
    }
    
    return messages
  }
  
  // 🔥 特殊处理：如果整个消息以引用指令开头，保持完整不拆分
  // （这些消息已经被多引用预处理拆分过了）
  const quotePattern = /^[\[【]?(?:引用了?(?:你的消息)?[:\：]|回复[:\：])/
  if (quotePattern.test(aiReply.trim())) {
    return [aiReply.trim()]
  }
  
  // 普通消息：按换行符分隔
  return aiReply
    .split('\n')
    .map(msg => msg.trim())
    .filter(msg => msg.length > 0)
}
