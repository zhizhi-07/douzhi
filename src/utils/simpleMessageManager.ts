/**
 * 简单消息管理器
 * 使用IndexedDB提供大内存存储（几百MB到GB）
 */

import type { Message } from '../types/chat'
import * as IDB from './indexedDBManager'

// 内存缓存，用于同步读取
const messageCache = new Map<string, Message[]>()

// 预加载Promise，用于等待预加载完成
let preloadPromise: Promise<void> | null = null

/**
 * 预加载所有聊天消息到缓存
 */
async function preloadMessages() {
  if (preloadPromise) return preloadPromise
  
  preloadPromise = (async () => {
    try {
      const allKeys = await IDB.getAllKeys(IDB.STORES.MESSAGES)
      if (import.meta.env.DEV) {
        console.log(`📦 预加载消息: ${allKeys.length} 个聊天`)
      }
      
      for (const chatId of allKeys) {
        const messages = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId)
        if (messages) {
          // 修复重复ID
          const fixedMessages = fixDuplicateMessageIds(messages)
          messageCache.set(chatId, fixedMessages)
          
          // 如果修复了ID，保存回数据库
          if (fixedMessages !== messages) {
            await IDB.setItem(IDB.STORES.MESSAGES, chatId, fixedMessages)
            if (import.meta.env.DEV) {
              console.log(`✅ 预加载时修复消息ID: chatId=${chatId}`)
            }
          }
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ 消息预加载完成')
      }
    } catch (error) {
      console.error('预加载消息失败:', error)
    }
  })()
  
  return preloadPromise
}

// 启动时预加载
preloadMessages()

/**
 * 修复重复的消息ID
 */
function fixDuplicateMessageIds(messages: Message[]): Message[] {
  const idMap = new Map<number, number>() // 旧ID -> 出现次数
  const needsFix = messages.some(msg => {
    const count = idMap.get(msg.id) || 0
    idMap.set(msg.id, count + 1)
    return count > 0 // 如果已经存在，说明有重复
  })
  
  if (!needsFix) {
    return messages // 没有重复，直接返回
  }
  
  if (import.meta.env.DEV) {
    console.log('⚠️ 检测到重复的消息ID，正在修复...')
  }
  const seenIds = new Set<number>()
  
  return messages.map(msg => {
    if (seenIds.has(msg.id)) {
      // ID重复，生成新的唯一ID
      const now = msg.timestamp || Date.now()
      const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
      if (import.meta.env.DEV) {
        console.log(`🔧 修复重复ID: ${msg.id} -> ${uniqueId}`)
      }
      seenIds.add(uniqueId)
      return { ...msg, id: uniqueId }
    }
    seenIds.add(msg.id)
    return msg
  })
}

/**
 * 加载消息（同步，从缓存读取）
 */
export function loadMessages(chatId: string): Message[] {
  try {
    // 从缓存读取
    let messages = messageCache.get(chatId)

    if (!messages) {
      // 缓存未命中，但预加载可能还在进行
      // 如果预加载还未完成，这里会返回空数组
      // 但预加载完成后会自动触发事件更新UI
      if (import.meta.env.DEV) {
        console.log(`⏳ 消息缓存未命中: chatId=${chatId}，等待预加载...`)
      }
      messages = []
    } else {
      // 从缓存读取时也检查并修复
      const fixedMessages = fixDuplicateMessageIds(messages)
      if (fixedMessages !== messages) {
        messageCache.set(chatId, fixedMessages)
        // 异步保存修复后的消息
        IDB.setItem(IDB.STORES.MESSAGES, chatId, fixedMessages)
        messages = fixedMessages
        if (import.meta.env.DEV) {
          console.log(`✅ 从缓存修复消息ID: chatId=${chatId}`)
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log(`📦 加载消息: chatId=${chatId}, 总数=${messages.length}`)
    }
    return messages
  } catch (error) {
    console.error('加载消息失败:', error)
    return []
  }
}

/**
 * 🔥 分页加载消息（性能优化）
 * @param chatId 聊天ID
 * @param limit 加载数量（默认50条）
 * @param offset 偏移量（从后往前数，0表示最新的消息）
 * @returns 消息数组和总数
 */
export async function loadMessagesPaginated(
  chatId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ messages: Message[], total: number, hasMore: boolean }> {
  try {
    // 先等待预加载完成
    if (preloadPromise) {
      await preloadPromise
    }

    // 从缓存或IndexedDB获取所有消息
    let allMessages = messageCache.get(chatId)

    if (!allMessages) {
      const loaded = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId)
      if (loaded && loaded.length > 0) {
        const fixedMessages = fixDuplicateMessageIds(loaded)
        messageCache.set(chatId, fixedMessages)
        allMessages = fixedMessages
      } else {
        allMessages = []
      }
    }

    const total = allMessages.length

    // 🔥 从后往前取消息（最新的消息在数组末尾）
    const startIndex = Math.max(0, total - offset - limit)
    const endIndex = total - offset
    const messages = allMessages.slice(startIndex, endIndex)

    const hasMore = startIndex > 0

    if (import.meta.env.DEV) {
      console.log(`📄 [分页加载] chatId=${chatId}, limit=${limit}, offset=${offset}, 返回=${messages.length}, 总数=${total}, 还有更多=${hasMore}`)
    }

    return { messages, total, hasMore }
  } catch (error) {
    console.error('分页加载消息失败:', error)
    return { messages: [], total: 0, hasMore: false }
  }
}

/**
 * 🔥 获取消息总数（不加载消息内容）
 */
export async function getMessageCount(chatId: string): Promise<number> {
  try {
    // 先检查缓存
    const cached = messageCache.get(chatId)
    if (cached) {
      return cached.length
    }

    // 从IndexedDB读取
    const messages = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId)
    return messages ? messages.length : 0
  } catch (error) {
    console.error('获取消息数量失败:', error)
    return 0
  }
}

/**
 * 等待消息加载完成（用于关键路径）
 * 🔥 新增：在进入聊天时调用，确保消息已加载
 */
export async function ensureMessagesLoaded(chatId: string): Promise<Message[]> {
  // 先等待预加载完成
  if (preloadPromise) {
    await preloadPromise
  }
  
  // 再次尝试从缓存读取
  let messages = messageCache.get(chatId)
  
  if (!messages) {
    // 如果还是没有，直接从IndexedDB读取
    const loaded = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId)
    if (loaded && loaded.length > 0) {
      const fixedMessages = fixDuplicateMessageIds(loaded)
      messageCache.set(chatId, fixedMessages)
      
      // 如果修复了ID，保存回数据库
      if (fixedMessages !== loaded) {
        await IDB.setItem(IDB.STORES.MESSAGES, chatId, fixedMessages)
      }
      
      if (import.meta.env.DEV) {
        console.log(`✅ 已加载消息: chatId=${chatId}, count=${fixedMessages.length}`)
      }
      return fixedMessages
    }
    return []
  }
  
  if (import.meta.env.DEV) {
    console.log(`✅ 从缓存返回消息: chatId=${chatId}, count=${messages.length}`)
  }
  return messages
}

/**
 * 保存消息（立即更新缓存和IndexedDB）
 */
export function saveMessages(chatId: string, messages: Message[]): void {
  try {
    // 立即更新缓存
    messageCache.set(chatId, messages)
    if (import.meta.env.DEV) {
      console.log(`💾 [缓存] 保存消息: chatId=${chatId}, count=${messages.length}`)
    }
    
    // 立即保存到IndexedDB（不等待）
    IDB.setItem(IDB.STORES.MESSAGES, chatId, messages).then(() => {
      if (import.meta.env.DEV) {
        console.log(`✅ [IndexedDB] 保存成功: chatId=${chatId}, count=${messages.length}`)
      }
    }).catch(err => {
      console.error(`❌ [IndexedDB] 保存失败: chatId=${chatId}`, err)
    })
    
    // 🔥 触发消息保存事件，用于通知和未读标记
    if (import.meta.env.DEV) {
      console.log(`🔔 [saveMessages] 触发 chat-message-saved 事件: chatId=${chatId}`)
    }
    window.dispatchEvent(new CustomEvent('chat-message-saved', {
      detail: { chatId }
    }))
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

/**
 * 添加一条消息（立即保存）
 * 如果消息已存在，则更新它
 */
export function addMessage(chatId: string, message: Message): void {
  const messages = loadMessages(chatId)
  
  // 🔥 检查消息是否已存在
  const existingIndex = messages.findIndex(m => m.id === message.id)
  
  let newMessages: Message[]
  if (existingIndex !== -1) {
    // 消息已存在，更新它（保留voiceUrl等字段）
    if (import.meta.env.DEV) {
      console.log(`🔄 [addMessage] 更新已存在的消息: id=${message.id}`)
    }
    newMessages = [...messages]
    newMessages[existingIndex] = { ...newMessages[existingIndex], ...message }
  } else {
    // 新消息，添加
    newMessages = [...messages, message]
    
    // 触发事件通知（仅新消息）
    window.dispatchEvent(new CustomEvent('new-message', {
      detail: { chatId, message }
    }))
    if (import.meta.env.DEV) {
      console.log(`📡 触发new-message事件: chatId=${chatId}, messageId=${message.id}`)
    }
  }
  
  saveMessages(chatId, newMessages)
}

/**
 * 删除一条消息（永久删除）
 */
export function deleteMessage(chatId: string, messageId: number): void {
  try {
    const messages = loadMessages(chatId)
    const filteredMessages = messages.filter(m => m.id !== messageId)
    saveMessages(chatId, filteredMessages)
    if (import.meta.env.DEV) {
      console.log(`🗑️ 已删除消息: chatId=${chatId}, messageId=${messageId}`)
    }
  } catch (error) {
    console.error('删除消息失败:', error)
  }
}

/**
 * 更新一条消息（永久修改）
 */
export function updateMessage(chatId: string, updatedMessage: Message): void {
  try {
    const messages = loadMessages(chatId)
    const updatedMessages = messages.map(m => 
      m.id === updatedMessage.id ? updatedMessage : m
    )
    saveMessages(chatId, updatedMessages)
    if (import.meta.env.DEV) {
      console.log(`✏️ 已更新消息: chatId=${chatId}, messageId=${updatedMessage.id}`)
    }
  } catch (error) {
    console.error('更新消息失败:', error)
  }
}

// 全局计数器，确保同一毫秒内生成的ID也是唯一的
let messageIdCounter = 0

/**
 * 清空聊天记录
 */
export async function clearMessages(chatId: string): Promise<void> {
  try {
    // 清空缓存
    messageCache.delete(chatId)
    // 删除IndexedDB中的数据
    await IDB.removeItem(IDB.STORES.MESSAGES, chatId)
    if (import.meta.env.DEV) {
      console.log(`🗑️ 已清空聊天记录: chatId=${chatId}`)
    }
  } catch (error) {
    console.error('清空聊天记录失败:', error)
    throw error
  }
}

/**
 * 创建文本消息
 */
export function createTextMessage(content: string, type: 'sent' | 'received'): Message {
  const now = Date.now()
  const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
  return {
    id: uniqueId,
    type,
    content,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    timestamp: now,
    messageType: 'text'
  }
}
