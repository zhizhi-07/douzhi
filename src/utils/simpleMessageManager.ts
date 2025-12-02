/**
 * 简单消息管理器
 * 使用IndexedDB提供大内存存储（几百MB到GB）
 */

import type { Message } from '../types/chat'
import * as IDB from './indexedDBManager'
import { getCurrentAccountId } from './accountManager'

/**
 * 获取账号专属的聊天存储key
 * 主账号使用原有key，小号使用独立key
 */
function getAccountChatKey(chatId: string): string {
  // 🔥 页面显示用：小号有独立的聊天记录（UI上不显示主账号的）
  const accountId = getCurrentAccountId()
  if (accountId === 'main') {
    return chatId
  }
  return `${chatId}_${accountId}`
}

/**
 * 获取主账号的聊天记录key（用于AI提示词）
 * AI需要通过主账号的聊天记录来认识主账号那个人
 */
export function getMainAccountChatKey(chatId: string): string {
  return chatId // 主账号的key就是chatId本身
}

/**
 * 🔥 加载主账号的聊天记录（用于AI提示词）
 * 小号模式下，AI需要看到主账号的聊天记录来认识主账号
 */
export function loadMainAccountMessages(chatId: string): Message[] {
  const mainKey = chatId // 主账号的key
  
  // 从缓存读取
  let messages = messageCache.get(mainKey)
  if (messages) {
    return messages
  }
  
  // 尝试从localStorage备份恢复
  try {
    const backupKey = `msg_backup_${mainKey}`
    const backup = localStorage.getItem(backupKey)
    if (backup) {
      const parsed = JSON.parse(backup)
      if (parsed.messages && Array.isArray(parsed.messages)) {
        return parsed.messages as Message[]
      }
    }
  } catch (e) {
    console.error('加载主账号消息失败:', e)
  }
  
  return []
}

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
      // 🔥 关键修复：先扫描所有 localStorage 备份，防止数据丢失
      const backupKeys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('msg_backup_')) {
          backupKeys.push(key)
        }
      }
      
      if (backupKeys.length > 0 && import.meta.env.DEV) {
        console.log(`🔍 [预加载] 发现 ${backupKeys.length} 个 localStorage 备份`)
      }
      
      // 🔥 加超时保护，防止 IndexedDB 卡死
      let allKeys: string[] = []
      try {
        allKeys = await Promise.race([
          IDB.getAllKeys(IDB.STORES.MESSAGES),
          new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 3000))
        ])
      } catch {
        console.warn('⚠️ [预加载] IndexedDB getAllKeys 超时')
      }
      if (import.meta.env.DEV) {
        console.log(`📦 预加载消息: ${allKeys.length} 个聊天`)
      }
      
      // 🔥 关键修复：合并 IndexedDB keys 和 localStorage 备份 keys
      const allChatIds = new Set<string>(allKeys)
      backupKeys.forEach(key => {
        const chatId = key.replace('msg_backup_', '')
        allChatIds.add(chatId)
      })
      
      for (const chatId of allChatIds) {
        // 🔥 单个聊天加载加超时
        let messages: Message[] | null = null
        try {
          messages = await Promise.race([
            IDB.getItem<Message[]>(IDB.STORES.MESSAGES, chatId),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
          ])
        } catch {
          console.warn(`⚠️ [预加载] chatId=${chatId} 加载超时`)
        }
        
        // 🔥 如果IndexedDB没有数据，尝试从 localStorage备份恢复
        if (!messages || messages.length === 0) {
          try {
            const backupKey = `msg_backup_${chatId}`
            const backup = localStorage.getItem(backupKey)
            
            if (backup) {
              const parsed = JSON.parse(backup)
              messages = parsed.messages
              const backupAge = Date.now() - (parsed.timestamp || 0)
              
              // 🔥 手机端优化：延长备份保留时间到24小时
              if (backupAge > 24 * 60 * 60 * 1000) {
                console.warn(`⚠️ [恢复备份] 备份太旧 (${Math.floor(backupAge / 1000 / 60 / 60)}小时)，跳过恢复`)
                localStorage.removeItem(backupKey)
                messages = null
              } else {
                console.log(`🔄 [恢复备份] 从localStorage恢复消息: chatId=${chatId}, count=${messages?.length || 0}, 备份时间=${Math.floor(backupAge / 1000)}秒前`)
                // 恢复到IndexedDB
                if (messages && messages.length > 0) {
                  await IDB.setItem(IDB.STORES.MESSAGES, chatId, messages)
                  console.log(`✅ [恢复备份] 成功恢复${messages.length}条消息到IndexedDB`)
                  // 🔥 关键修复：不要删除localStorage备份！保留24小时作为安全网
                  // localStorage.removeItem(backupKey)  // 已禁用
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
 * 🔥 强制备份所有缓存的消息到 localStorage
 * 用于页面卸载时防止数据丢失
 */
export function forceBackupAllMessages(): void {
  try {
    console.log(`🔄 [强制备份] 开始备份所有消息到 localStorage`)
    let backupCount = 0
    
    messageCache.forEach((messages, chatId) => {
      if (messages.length > 0) {
        try {
          const backupKey = `msg_backup_${chatId}`
          const seen = new WeakSet()
          const jsonString = JSON.stringify({
            messages,
            timestamp: Date.now()
          }, (_key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (value instanceof Node || value instanceof Window || value instanceof Document || value instanceof Event) {
                return undefined
              }
              if (seen.has(value)) return undefined
              seen.add(value)
            }
            if (typeof value === 'function') return undefined
            return value
          })
          
          localStorage.setItem(backupKey, jsonString)
          backupCount++
        } catch (e) {
          console.error(`❌ [强制备份] 备份失败: chatId=${chatId}`, e)
        }
      }
    })
    
    console.log(`✅ [强制备份] 完成，共备份 ${backupCount} 个聊天`)
  } catch (error) {
    console.error('❌ [强制备份] 失败:', error)
  }
}

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
 * 🔥 手机端强化：缓存未命中时立即从localStorage备份恢复
 */
export function loadMessages(chatId: string): Message[] {
  try {
    // 🔥 使用账号专属的存储key
    const storageKey = getAccountChatKey(chatId)
    
    // 从缓存读取
    let messages = messageCache.get(storageKey)

    if (!messages) {
      // 🔥 关键修复：缓存未命中时，立即尝试从localStorage备份恢复
      // 这解决了手机端刷新时IndexedDB预加载失败导致的消息丢失
      if (import.meta.env.DEV) {
        console.log(`⏳ 消息缓存未命中: chatId=${chatId}，尝试从localStorage恢复...`)
      }
      
      try {
        const backupKey = `msg_backup_${storageKey}`
        const backup = localStorage.getItem(backupKey)
        
        if (backup) {
          const parsed = JSON.parse(backup)
          const backupAge = Date.now() - (parsed.timestamp || 0)
          
          // 备份在24小时内有效
          if (backupAge < 24 * 60 * 60 * 1000 && parsed.messages && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            messages = parsed.messages as Message[]
            messageCache.set(storageKey, messages)
            console.log(`✅ [立即恢复] 从localStorage恢复消息: storageKey=${storageKey}, count=${messages.length}, 备份时间=${Math.floor(backupAge / 1000)}秒前`)
          } else if (backupAge >= 24 * 60 * 60 * 1000) {
            console.warn(`⚠️ [立即恢复] 备份太旧 (${Math.floor(backupAge / 1000 / 60 / 60)}小时)，跳过恢复`)
            localStorage.removeItem(backupKey)
          }
        }
      } catch (e) {
        console.error('❌ [立即恢复] 从localStorage恢复失败:', e)
      }
      
      // 如果还是没有，返回空数组
      if (!messages) {
        messages = []
      }
    } else {
      // 从缓存读取时也检查并修复
      const fixedMessages = fixDuplicateMessageIds(messages)
      if (fixedMessages !== messages) {
        messageCache.set(storageKey, fixedMessages)
        // 异步保存修复后的消息
        IDB.setItem(IDB.STORES.MESSAGES, storageKey, fixedMessages)
        messages = fixedMessages
        if (import.meta.env.DEV) {
          console.log(`✅ 从缓存修复消息ID: storageKey=${storageKey}`)
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log(`📦 加载消息: chatId=${chatId}, storageKey=${storageKey}, 总数=${messages.length}, 来源=${messageCache.has(storageKey) ? '缓存' : 'localStorage备份'}`)
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
    // 🔥 使用账号专属的存储key
    const storageKey = getAccountChatKey(chatId)
    
    // 先等待预加载完成
    if (preloadPromise) {
      await preloadPromise
    }

    // 从缓存或IndexedDB获取所有消息
    let allMessages = messageCache.get(storageKey)

    if (!allMessages) {
      const loaded = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, storageKey)
      if (loaded && loaded.length > 0) {
        const fixedMessages = fixDuplicateMessageIds(loaded)
        messageCache.set(storageKey, fixedMessages)
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
      console.log(`📄 [分页加载] chatId=${chatId}, storageKey=${storageKey}, limit=${limit}, offset=${offset}, 返回=${messages.length}, 总数=${total}, 还有更多=${hasMore}`)
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
    // 🔥 使用账号专属的存储key
    const storageKey = getAccountChatKey(chatId)
    
    // 先检查缓存
    const cached = messageCache.get(storageKey)
    if (cached) {
      return cached.length
    }

    // 从IndexedDB读取
    const messages = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, storageKey)
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
  // 🔥 使用账号专属的存储key
  const storageKey = getAccountChatKey(chatId)
  
  // 🔥 加超时，防止永久卡住
  if (preloadPromise) {
    try {
      await Promise.race([
        preloadPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('预加载超时')), 3000))
      ])
    } catch (e) {
      console.warn('⚠️ 预加载超时，继续执行')
    }
  }
  
  // 再次尝试从缓存读取
  let messages = messageCache.get(storageKey)
  
  if (!messages) {
    // 如果还是没有，直接从IndexedDB读取（加超时）
    let loaded: Message[] | null = null
    try {
      loaded = await Promise.race([
        IDB.getItem<Message[]>(IDB.STORES.MESSAGES, storageKey),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
      ])
    } catch (e) {
      console.warn('⚠️ IndexedDB读取超时')
    }
    
    // 🔥 如果IndexedDB也没有，尝试从localStorage备份恢复
    if (!loaded || loaded.length === 0) {
      try {
        const backupKey = `msg_backup_${storageKey}`
        const backup = localStorage.getItem(backupKey)
        if (backup) {
          const parsed = JSON.parse(backup)
          loaded = parsed.messages
          const backupAge = Date.now() - (parsed.timestamp || 0)
          
          // 🔥 手机端优化：延长备份保留时间到24小时
          if (backupAge > 24 * 60 * 60 * 1000) {
            if (import.meta.env.DEV) {
              console.warn(`⚠️ [恢复备份] 备份太旧 (${Math.floor(backupAge / 1000 / 60 / 60)}小时)，跳过恢复`)
            }
            localStorage.removeItem(backupKey)
            loaded = null
          } else {
            if (import.meta.env.DEV) {
              console.log(`🔄 [恢复备份] ensureMessagesLoaded从localStorage恢复: storageKey=${storageKey}, count=${loaded?.length || 0}`)
            }
            // 恢复到IndexedDB
            if (loaded && loaded.length > 0) {
              await IDB.setItem(IDB.STORES.MESSAGES, storageKey, loaded)
              // 🔥 关键修复：不要删除localStorage备份！
              // 保留24小时作为安全网，防止IndexedDB保存失败导致数据丢失
              // localStorage.removeItem(backupKey)  // 已禁用
              if (import.meta.env.DEV) {
                console.log(`💾 [恢复备份] 已恢复到IndexedDB，保留localStorage备份作为安全网`)
              }
            }
          }
        }
      } catch (e) {
        console.warn('恢复localStorage备份失败:', e)
      }
    }
    
    if (loaded && loaded.length > 0) {
      const fixedMessages = fixDuplicateMessageIds(loaded)
      messageCache.set(storageKey, fixedMessages)
      
      // 如果修复了ID，保存回数据库
      if (fixedMessages !== loaded) {
        await IDB.setItem(IDB.STORES.MESSAGES, storageKey, fixedMessages)
      }
      
      if (import.meta.env.DEV) {
        console.log(`✅ 已加载消息: chatId=${chatId}, storageKey=${storageKey}, count=${fixedMessages.length}`)
      }
      return fixedMessages
    }
    return []
  }
  
  if (import.meta.env.DEV) {
    console.log(`✅ 从缓存返回消息: chatId=${chatId}, storageKey=${storageKey}, count=${messages.length}`)
  }
  return messages
}

/**
 * 清理消息对象，移除不可序列化的属性
 * 🔥 强化版：使用JSON序列化彻底清理，防止PointerEvent等对象导致IndexedDB保存失败
 */
function cleanMessageForStorage(message: Message): Message {
  try {
    // 🔥 使用JSON序列化来彻底清理不可序列化的对象
    // 这会自动移除：Event、PointerEvent、DOM元素、函数、循环引用等
    const seen = new WeakSet()
    const jsonString = JSON.stringify(message, (_key, value) => {
      // 跳过不可序列化的对象
      if (typeof value === 'object' && value !== null) {
        // 检测循环引用
        if (seen.has(value)) {
          return undefined
        }
        seen.add(value)
        
        // 移除Event对象（包括PointerEvent、MouseEvent等）
        if (value instanceof Event || 
            value instanceof Node || 
            value instanceof Window || 
            value instanceof Document) {
          return undefined
        }
        
        // 检查构造函数名称
        if (value.constructor) {
          const constructorName = value.constructor.name
          if (constructorName.includes('Event') || 
              constructorName.includes('Element') ||
              constructorName === 'Window' ||
              constructorName === 'Document') {
            return undefined
          }
        }
      }
      
      // 移除函数
      if (typeof value === 'function') {
        return undefined
      }
      
      return value
    })
    
    // 解析回对象
    return JSON.parse(jsonString) as Message
  } catch (error) {
    console.error('❌ [cleanMessageForStorage] 清理失败，使用原始消息:', error)
    // 降级：如果清理失败，至少移除顶层的危险属性
    const cleaned = { ...message }
    Object.keys(cleaned).forEach(key => {
      const value = (cleaned as any)[key]
      if (value instanceof Event || 
          value instanceof Node || 
          typeof value === 'function') {
        delete (cleaned as any)[key]
      }
    })
    return cleaned
  }
}

/**
 * 保存消息（立即更新缓存和IndexedDB）
 */
export function saveMessages(chatId: string, messages: Message[]): void {
  try {
    // 🔥 使用账号专属的存储key
    const storageKey = getAccountChatKey(chatId)
    
    // 🔥 防止保存空数组覆盖已有数据
    if (messages.length === 0) {
      // 1. 检查缓存
      const cachedMessages = messageCache.get(storageKey)
      if (cachedMessages && cachedMessages.length > 0) {
        console.warn(`⚠️ [saveMessages] 阻止保存空数组，当前缓存有 ${cachedMessages.length} 条消息`)
        return
      }
      
      // 2. 检查localStorage备份
      try {
        const backupKey = `msg_backup_${storageKey}`
        const backup = localStorage.getItem(backupKey)
        if (backup) {
          const parsed = JSON.parse(backup)
          if (parsed.messages && parsed.messages.length > 0) {
            console.warn(`⚠️ [saveMessages] localStorage备份中有 ${parsed.messages.length} 条消息，阻止保存空数组`)
            // 🔥 关键修复：立即从备份恢复到缓存，防止数据丢失
            messageCache.set(storageKey, parsed.messages)
            return
          }
        }
      } catch (e) {
        console.error('检查localStorage备份失败:', e)
      }
      
      // 3. 🔥 关键修复：如果缓存和备份都没有，直接拒绝保存空数组
      // 不再异步检查 IndexedDB，因为异步检查无法阻止后续代码执行
      console.warn(`⚠️ [saveMessages] 拒绝保存空数组到 storageKey=${storageKey}，可能是数据加载未完成`)
      return
    }
    
    // 清理消息，移除不可序列化的对象
    const cleanedMessages = messages.map(cleanMessageForStorage)
    
    // 🔍 调试：检查最后一条消息的messageType
    const lastMsg = messages[messages.length - 1]
    const lastCleanedMsg = cleanedMessages[cleanedMessages.length - 1]
    if (lastMsg?.messageType === 'post' || lastCleanedMsg?.messageType === 'post') {
      console.log('🔍 [saveMessages] 帖子消息检查:', {
        原始messageType: lastMsg?.messageType,
        清理后messageType: lastCleanedMsg?.messageType,
        原始post字段: !!lastMsg?.post,
        清理后post字段: !!lastCleanedMsg?.post
      })
    }
    
    // 立即更新缓存（使用原始消息）
    messageCache.set(storageKey, messages)
    if (import.meta.env.DEV) {
      console.log(`💾 [缓存] 保存消息: chatId=${chatId}, storageKey=${storageKey}, count=${messages.length}`)
    }
    
    // 🔥 手机优化：同步保存到localStorage作为备份（防止页面关闭时IndexedDB保存被中断）
    // 限制：只保存最近50条消息的备份，避免localStorage空间不足
    try {
      const backupKey = `msg_backup_${storageKey}`
      const recentMessages = cleanedMessages.slice(-50) // 只备份最近50条
      localStorage.setItem(backupKey, JSON.stringify({
        messages: recentMessages,
        timestamp: Date.now(),
        totalCount: cleanedMessages.length // 记录总数，用于恢复时判断
      }))
      if (import.meta.env.DEV) {
        console.log(`💾 [localStorage备份] 已保存: storageKey=${storageKey}, backup=${recentMessages.length}/${cleanedMessages.length}`)
      }
    } catch {
      // 空间不足，直接放弃备份，IndexedDB会保存完整数据
    }
    
    // 立即保存到IndexedDB（使用清理后的消息）
    IDB.setItem(IDB.STORES.MESSAGES, storageKey, cleanedMessages).then(() => {
      if (import.meta.env.DEV) {
        console.log(`✅ [IndexedDB] 保存成功: storageKey=${storageKey}, count=${cleanedMessages.length}`)
      }
      // 🔥 手机端优化：延迟删除备份，给IndexedDB更多时间完成写入
      setTimeout(() => {
        try {
          const backupKey = `msg_backup_${storageKey}`
          const backup = localStorage.getItem(backupKey)
          if (backup) {
            const parsed = JSON.parse(backup)
            // 只删除5秒前的备份，确保是已经成功保存的
            if (Date.now() - parsed.timestamp > 5000) {
              localStorage.removeItem(backupKey)
              if (import.meta.env.DEV) {
                console.log(`🗑️ [localStorage备份] 已删除旧备份: storageKey=${storageKey}`)
              }
            }
          }
        } catch (e) {
          // 忽略删除失败
        }
      }, 5000) // 5秒后再删除
    }).catch(err => {
      console.error(`❌ [IndexedDB] 保存失败: storageKey=${storageKey}`, err)
      // IndexedDB保存失败时，保留localStorage备份
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
  // 🔥 使用账号专属的存储key
  const storageKey = getAccountChatKey(chatId)
  
  // 🔥 立即同步备份到localStorage（最高优先级，确保不丢失）
  // 限制：只保存最近50条消息的备份
  try {
    const backupKey = `msg_backup_${storageKey}`
    const cachedMessages = messageCache.get(storageKey) || []
    const updatedMessages = [...cachedMessages, message]
    const recentMessages = updatedMessages.slice(-50) // 只备份最近50条
    
    const seen = new WeakSet()
    const jsonString = JSON.stringify({
      messages: recentMessages,
      timestamp: Date.now(),
      totalCount: updatedMessages.length
    }, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (value instanceof Node || value instanceof Window || value instanceof Document || value instanceof Event) {
          return undefined
        }
        if (seen.has(value)) return undefined
        seen.add(value)
      }
      if (typeof value === 'function') return undefined
      return value
    })
    
    localStorage.setItem(backupKey, jsonString)
    if (import.meta.env.DEV) {
      console.log(`💾 [addMessage] 立即备份: storageKey=${storageKey}, backup=${recentMessages.length}条`)
    }
  } catch {
    // 空间不足，静默失败，IndexedDB会保存完整数据
  }
  
  // 异步保存到IndexedDB（可以慢慢来）
  ensureMessagesLoaded(chatId).then(messages => {
    const existingIndex = messages.findIndex(m => m.id === message.id)
    
    let newMessages: Message[]
    if (existingIndex !== -1) {
      newMessages = [...messages]
      newMessages[existingIndex] = { ...newMessages[existingIndex], ...message }
    } else {
      newMessages = [...messages, message]
      window.dispatchEvent(new CustomEvent('new-message', {
        detail: { chatId, message }
      }))
    }
    
    saveMessages(chatId, newMessages)
  }).catch(error => {
    console.error('❌ [addMessage] IndexedDB保存失败:', error)
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
    // 🔥 使用账号专属的存储key
    const storageKey = getAccountChatKey(chatId)
    
    // 清空缓存
    messageCache.delete(storageKey)
    
    // 🔥 关键修复：同时删除localStorage备份，防止误恢复
    try {
      const backupKey = `msg_backup_${storageKey}`
      localStorage.removeItem(backupKey)
      if (import.meta.env.DEV) {
        console.log(`🗑️ 已删除localStorage备份: ${backupKey}`)
      }
    } catch (e) {
      console.warn('删除localStorage备份失败:', e)
    }
    
    // 删除IndexedDB中的数据
    await IDB.removeItem(IDB.STORES.MESSAGES, storageKey)
    if (import.meta.env.DEV) {
      console.log(`🗑️ 已清空聊天记录: chatId=${chatId}, storageKey=${storageKey}`)
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
