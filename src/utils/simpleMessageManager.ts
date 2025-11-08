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
      console.log(`📦 预加载消息: ${allKeys.length} 个聊天`)
      
      for (const chatId of allKeys) {
        const messages = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId)
        if (messages) {
          // 修复重复ID
          const fixedMessages = fixDuplicateMessageIds(messages)
          messageCache.set(chatId, fixedMessages)
          
          // 如果修复了ID，保存回数据库
          if (fixedMessages !== messages) {
            await IDB.setItem(IDB.STORES.MESSAGES, chatId, fixedMessages)
            console.log(`✅ 预加载时修复消息ID: chatId=${chatId}`)
          }
        }
      }
      
      console.log('✅ 消息预加载完成')
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
  
  console.log('⚠️ 检测到重复的消息ID，正在修复...')
  const seenIds = new Set<number>()
  
  return messages.map(msg => {
    if (seenIds.has(msg.id)) {
      // ID重复，生成新的唯一ID
      const now = msg.timestamp || Date.now()
      const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
      console.log(`🔧 修复重复ID: ${msg.id} -> ${uniqueId}`)
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
    
    // 如果缓存没有，尝试同步从IndexedDB读取（会触发异步加载）
    if (!messages) {
      // 触发异步加载
      IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId).then(loaded => {
        if (loaded && loaded.length > 0) {
          // 修复重复ID
          const fixedMessages = fixDuplicateMessageIds(loaded)
          messageCache.set(chatId, fixedMessages)
          
          // 如果修复了ID，保存回数据库
          if (fixedMessages !== loaded) {
            IDB.setItem(IDB.STORES.MESSAGES, chatId, fixedMessages)
            console.log(`✅ 已修复并保存消息ID: chatId=${chatId}`)
          }
          
          console.log(`📥 异步加载消息: chatId=${chatId}, count=${fixedMessages.length}`)
          // 触发UI更新
          window.dispatchEvent(new CustomEvent('messages-loaded', { detail: { chatId } }))
        }
      })
      messages = []
    } else {
      // 从缓存读取时也检查并修复
      const fixedMessages = fixDuplicateMessageIds(messages)
      if (fixedMessages !== messages) {
        messageCache.set(chatId, fixedMessages)
        // 异步保存修复后的消息
        IDB.setItem(IDB.STORES.MESSAGES, chatId, fixedMessages)
        messages = fixedMessages
        console.log(`✅ 从缓存修复消息ID: chatId=${chatId}`)
      }
    }
    
    console.log(`📦 加载消息: chatId=${chatId}, 总数=${messages.length}`)
    return messages
  } catch (error) {
    console.error('加载消息失败:', error)
    return []
  }
}

/**
 * 保存消息（立即更新缓存和IndexedDB）
 */
export function saveMessages(chatId: string, messages: Message[]): void {
  try {
    // 立即更新缓存
    messageCache.set(chatId, messages)
    console.log(`💾 [缓存] 保存消息: chatId=${chatId}, count=${messages.length}`)
    
    // 立即保存到IndexedDB（不等待）
    IDB.setItem(IDB.STORES.MESSAGES, chatId, messages).then(() => {
      console.log(`✅ [IndexedDB] 保存成功: chatId=${chatId}, count=${messages.length}`)
    }).catch(err => {
      console.error(`❌ [IndexedDB] 保存失败: chatId=${chatId}`, err)
    })
    
    // 🔥 触发消息保存事件，用于通知和未读标记
    console.log(`🔔 [saveMessages] 触发 chat-message-saved 事件: chatId=${chatId}`)
    window.dispatchEvent(new CustomEvent('chat-message-saved', {
      detail: { chatId }
    }))
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

/**
 * 添加一条消息（立即保存）
 */
export function addMessage(chatId: string, message: Message): void {
  const messages = loadMessages(chatId)
  messages.push(message)
  saveMessages(chatId, messages)
  
  // 触发事件通知
  window.dispatchEvent(new CustomEvent('new-message', {
    detail: { chatId, message }
  }))
  console.log(`📡 触发new-message事件: chatId=${chatId}`)
}

/**
 * 删除一条消息（永久删除）
 */
export function deleteMessage(chatId: string, messageId: number): void {
  try {
    const messages = loadMessages(chatId)
    const filteredMessages = messages.filter(m => m.id !== messageId)
    saveMessages(chatId, filteredMessages)
    console.log(`🗑️ 已删除消息: chatId=${chatId}, messageId=${messageId}`)
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
    console.log(`✏️ 已更新消息: chatId=${chatId}, messageId=${updatedMessage.id}`)
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
    console.log(`🗑️ 已清空聊天记录: chatId=${chatId}`)
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
