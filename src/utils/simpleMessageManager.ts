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
      
      // 🔥 关键修复：检查localStorage中的备份keys，可能有IndexedDB中不存在的新聊天
      const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('msg_backup_'))
      const backupChatIds = backupKeys.map(key => key.replace('msg_backup_', ''))
      
      // 合并IndexedDB的keys和备份的chatIds（去重）
      const allChatIds = Array.from(new Set([...allKeys, ...backupChatIds]))
      
      if (import.meta.env.DEV) {
        console.log(`📦 预加载消息: IndexedDB=${allKeys.length}个, localStorage备份=${backupChatIds.length}个, 总计=${allChatIds.length}个`)
      }
      
      for (const chatId of allChatIds) {
        let messages = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId)
        
        // 🔥 如果IndexedDB没有数据，尝试从localStorage备份恢复
        if (!messages || messages.length === 0) {
          try {
            const backupKey = `msg_backup_${chatId}`
            const backup = localStorage.getItem(backupKey)
            
            if (backup) {
              const parsed = JSON.parse(backup)
              messages = parsed.messages
              const backupAge = Date.now() - (parsed.timestamp || 0)
              
              // 只恢复1小时内的备份，防止恢复太旧的数据
              if (backupAge > 60 * 60 * 1000) {
                console.warn(`⚠️ [恢复备份] 备份太旧 (${Math.floor(backupAge / 1000 / 60)}分钟)，跳过恢复`)
                localStorage.removeItem(backupKey)
                messages = null
              } else {
                console.log(`🔄 [恢复备份] 从localStorage恢复消息: chatId=${chatId}, count=${messages?.length || 0}, 备份时间=${Math.floor(backupAge / 1000)}秒前`)
                // 恢复到IndexedDB
                if (messages && messages.length > 0) {
                  await IDB.setItem(IDB.STORES.MESSAGES, chatId, messages)
                  console.log(`✅ [恢复备份] 成功恢复${messages.length}条消息到IndexedDB`)
                  localStorage.removeItem(backupKey) // 恢复成功后删除备份
                }
              }
            } else {
              console.log(`ℹ️ [恢复备份] 没有找到localStorage备份: key=${backupKey}`)
            }
          } catch (e) {
            console.error('❌ [恢复备份] 失败:', e)
          }
        }
        
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
    let loaded = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId)
    
    // 🔥 如果IndexedDB也没有，尝试从localStorage备份恢复
    if (!loaded || loaded.length === 0) {
      try {
        const backupKey = `msg_backup_${chatId}`
        const backup = localStorage.getItem(backupKey)
        if (backup) {
          const parsed = JSON.parse(backup)
          loaded = parsed.messages
          const backupAge = Date.now() - (parsed.timestamp || 0)
          
          // 只恢复1小时内的备份，防止恢复太旧的数据
          if (backupAge > 60 * 60 * 1000) {
            if (import.meta.env.DEV) {
              console.warn(`⚠️ [恢复备份] 备份太旧 (${Math.floor(backupAge / 1000 / 60)}分钟)，跳过恢复`)
            }
            localStorage.removeItem(backupKey)
            loaded = null
          } else {
            if (import.meta.env.DEV) {
              console.log(`🔄 [恢复备份] ensureMessagesLoaded从localStorage恢复: chatId=${chatId}, count=${loaded?.length || 0}`)
            }
            // 恢复到IndexedDB
            if (loaded && loaded.length > 0) {
              await IDB.setItem(IDB.STORES.MESSAGES, chatId, loaded)
              localStorage.removeItem(backupKey)
            }
          }
        }
      } catch (e) {
        console.warn('恢复localStorage备份失败:', e)
      }
    }
    
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
 * 清理消息对象，移除不可序列化的属性
 */
function cleanMessageForStorage(message: Message): Message {
  const cleaned = { ...message }
  
  // 移除所有可能的事件对象和DOM引用
  const keysToRemove = Object.keys(cleaned).filter(key => {
    const value = (cleaned as any)[key]
    // 移除事件对象、DOM元素、函数等
    return value instanceof Event || 
           value instanceof Node || 
           typeof value === 'function' ||
           (value && typeof value === 'object' && value.constructor && 
            (value.constructor.name.includes('Event') || value.constructor.name.includes('Element')))
  })
  
  keysToRemove.forEach(key => {
    delete (cleaned as any)[key]
  })
  
  return cleaned
}

/**
 * 保存消息（立即更新缓存和IndexedDB）
 */
export function saveMessages(chatId: string, messages: Message[]): void {
  try {
    // 🔥 防止保存空数组覆盖已有数据
    if (messages.length === 0) {
      // 检查缓存
      const cachedMessages = messageCache.get(chatId)
      if (cachedMessages && cachedMessages.length > 0) {
        console.warn(`⚠️ [saveMessages] 阻止保存空数组，当前缓存有 ${cachedMessages.length} 条消息`)
        return
      }
      
      // 🔥 关键修复：检查localStorage备份
      try {
        const backupKey = `msg_backup_${chatId}`
        const backup = localStorage.getItem(backupKey)
        if (backup) {
          const parsed = JSON.parse(backup)
          if (parsed.messages && parsed.messages.length > 0) {
            console.error(`🚫 [saveMessages] 阻止保存空数组！localStorage备份中有 ${parsed.messages.length} 条消息`)
            alert(`🚫 阻止数据丢失！\n检测到尝试保存空数组\n但localStorage备份中有${parsed.messages.length}条消息\n已阻止覆盖`)
            return
          }
        }
      } catch (e) {
        console.error('检查localStorage备份失败:', e)
      }
      
      // 异步检查IndexedDB
      IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId).then(dbMessages => {
        if (dbMessages && dbMessages.length > 0) {
          console.warn(`⚠️ [saveMessages] IndexedDB中有 ${dbMessages.length} 条消息，不保存空数组`)
          // 恢复缓存
          messageCache.set(chatId, dbMessages)
        }
      })
    }
    
    // 清理消息，移除不可序列化的对象
    const cleanedMessages = messages.map(cleanMessageForStorage)
    
    // 立即更新缓存（使用原始消息）
    messageCache.set(chatId, messages)
    if (import.meta.env.DEV) {
      console.log(`💾 [缓存] 保存消息: chatId=${chatId}, count=${messages.length}`)
    }
    
    // 🔥 手机优化：同步保存到localStorage作为备份（防止页面关闭时IndexedDB保存被中断）
    try {
      const backupKey = `msg_backup_${chatId}`
      localStorage.setItem(backupKey, JSON.stringify({
        messages: cleanedMessages,
        timestamp: Date.now()
      }))
      if (import.meta.env.DEV) {
        console.log(`💾 [localStorage备份] 已保存: chatId=${chatId}`)
      }
    } catch (e) {
      console.warn(`⚠️ [localStorage备份] 保存失败（可能空间不足）:`, e)
    }
    
    // 立即保存到IndexedDB（使用清理后的消息）
    IDB.setItem(IDB.STORES.MESSAGES, chatId, cleanedMessages).then(() => {
      if (import.meta.env.DEV) {
        console.log(`✅ [IndexedDB] 保存成功: chatId=${chatId}, count=${cleanedMessages.length}`)
      }
      // 保存成功后可以删除备份
      try {
        localStorage.removeItem(`msg_backup_${chatId}`)
      } catch (e) {
        // 忽略删除失败
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
 * 
 * 🔥 重要：这是一个同步包装器，内部会异步确保消息已加载
 */
export function addMessage(chatId: string, message: Message): void {
  // 🔥 关键修复：异步确保消息已加载，防止覆盖历史消息
  ensureMessagesLoaded(chatId).then(messages => {
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
  }).catch(error => {
    console.error('❌ [addMessage] 添加消息失败:', error)
  })
}

/**
 * 删除一条消息（永久删除）
 */
export function deleteMessage(chatId: string, messageId: number): void {
  // 🔥 关键修复：异步确保消息已加载，防止误删
  ensureMessagesLoaded(chatId).then(messages => {
    const filteredMessages = messages.filter(m => m.id !== messageId)
    saveMessages(chatId, filteredMessages)
    if (import.meta.env.DEV) {
      console.log(`🗑️ 已删除消息: chatId=${chatId}, messageId=${messageId}`)
    }
  }).catch(error => {
    console.error('❌ [deleteMessage] 删除消息失败:', error)
  })
}

/**
 * 更新一条消息（永久修改）
 */
export function updateMessage(chatId: string, updatedMessage: Message): void {
  // 🔥 关键修复：异步确保消息已加载，防止丢失数据
  ensureMessagesLoaded(chatId).then(messages => {
    const updatedMessages = messages.map(m => 
      m.id === updatedMessage.id ? updatedMessage : m
    )
    saveMessages(chatId, updatedMessages)
    if (import.meta.env.DEV) {
      console.log(`✏️ 已更新消息: chatId=${chatId}, messageId=${updatedMessage.id}`)
    }
  }).catch(error => {
    console.error('❌ [updateMessage] 更新消息失败:', error)
  })
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
    
    // 🔥 关键修复：同时删除localStorage备份，防止误恢复
    try {
      const backupKey = `msg_backup_${chatId}`
      localStorage.removeItem(backupKey)
      if (import.meta.env.DEV) {
        console.log(`🗑️ 已删除localStorage备份: ${backupKey}`)
      }
    } catch (e) {
      console.warn('删除localStorage备份失败:', e)
    }
    
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
