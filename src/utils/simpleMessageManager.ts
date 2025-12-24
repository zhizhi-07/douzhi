/**
 * 简单消息管理器
 * 使用IndexedDB提供大内存存储（几百MB到GB）
 */

import type { Message } from '../types/chat'
import * as IDB from './indexedDBManager'
import { getCurrentAccountId } from './accountManager'

// 🔥 保存锁机制，防止并发保存导致数据丢失
const saveLocks = new Map<string, Promise<void>>()
const saveQueue = new Map<string, Message[]>()

// 🔥🔥🔥 addMessage 锁机制，防止竞态条件导致消息丢失
const addMessageLocks = new Map<string, Promise<void>>()

/**
 * 🔥🔥🔥 安全保存消息到 IndexedDB（防止覆盖更多数据）
 * 始终合并数据，确保不丢失任何消息
 */
async function safeSetMessages(storageKey: string, messages: Message[]): Promise<void> {
  try {
    // 先读取 IndexedDB 中的现有数据
    const existing = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, storageKey)
    
    // 🔥🔥🔥 关键修复：始终合并，而不是只在 existing 更多时合并
    // 因为即使传入的消息更多，也可能丢失了中间的消息！
    if (existing && existing.length > 0) {
      // 合并数据：使用 ID 去重，保留所有消息
      const mergedMap = new Map<number, Message>()
      
      // 先添加现有消息
      existing.forEach(m => {
        if (m && m.id != null) mergedMap.set(m.id, m)
      })
      
      // 再添加新消息（会覆盖同ID的旧消息，保留最新内容）
      messages.forEach(m => {
        if (m && m.id != null) mergedMap.set(m.id, m)
      })
      
      const merged = Array.from(mergedMap.values()).sort((a, b) => 
        (a.timestamp || 0) - (b.timestamp || 0)
      )
      
      // 只有合并后数量变化才记录日志
      if (merged.length !== messages.length) {
        console.log(`🔄 [safeSetMessages] 合并: 传入=${messages.length}, 现有=${existing.length}, 合并后=${merged.length}`)
      }
      
      await IDB.setItem(IDB.STORES.MESSAGES, storageKey, merged)
      
      // 同时更新缓存
      messageCache.set(storageKey, merged)
    } else {
      // 没有现有数据，直接保存
      await IDB.setItem(IDB.STORES.MESSAGES, storageKey, messages)
    }
  } catch (e) {
    console.error('❌ [safeSetMessages] 失败:', e)
    // 降级：直接保存
    await IDB.setItem(IDB.STORES.MESSAGES, storageKey, messages)
  }
}

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
 * 🔥 清空所有消息缓存（用于数据导入后刷新）
 * 必须在导入数据后调用，否则旧缓存会覆盖新导入的数据
 */
export function clearMessageCache(): void {
  messageCache.clear()
  preloadPromise = null
  console.log('🗑️ [clearMessageCache] 已清空所有消息缓存')
}

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
        console.log(`📦 预加载消息: ${allKeys.length} 个聊天`, allKeys)
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
              
              // 🔥 备份永久保留，不再删除旧备份
              if (false) {
                // 已禁用：不再因为时间过期而删除备份
                console.warn(`⚠️ [恢复备份] 备份太旧，跳过恢复`)
                localStorage.removeItem(backupKey)
                messages = null
              } else {
                console.log(`🔄 [恢复备份] 从localStorage恢复消息: chatId=${chatId}, count=${messages?.length || 0}, 备份时间=${Math.floor(backupAge / 1000)}秒前`)
                // 🔥 使用安全保存恢复到IndexedDB，防止覆盖更多数据
                if (messages && messages.length > 0) {
                  await safeSetMessages(chatId, messages)
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
          // 🔥🔥🔥 关键修复：使用 chatId 作为缓存key（与loadMessages保持一致）
          // chatId 就是 storageKey（主账号情况下）
          messageCache.set(chatId, fixedMessages)
          
          // 🔥🔥🔥 同时更新 localStorage 备份，确保下次能恢复
          try {
            const backupKey = `msg_backup_${chatId}`
            localStorage.setItem(backupKey, JSON.stringify({ messages: fixedMessages, timestamp: Date.now() }))
          } catch (e) {
            // 静默处理
          }
          
          // 如果修复了ID，保存回数据库（异步执行，不阻塞）
          // 🔥 使用安全保存，防止覆盖更多数据
          if (fixedMessages !== messages) {
            // 使用setTimeout让保存操作异步执行，避免阻塞主线程
            setTimeout(async () => {
              try {
                await safeSetMessages(chatId, fixedMessages)
                if (import.meta.env.DEV) {
                  console.log(`✅ 后台修复消息ID: chatId=${chatId}`)
                }
              } catch (e) {
                console.error('保存修复的消息失败:', e)
              }
            }, 100)
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

// 🔥🔥🔥 紧急修复：导出强制恢复函数，供外部调用
export async function forceRecoverFromIndexedDB(): Promise<void> {
  console.log('🔥 [紧急恢复] 开始从IndexedDB强制恢复所有消息...')
  try {
    const allKeys = await IDB.getAllKeys(IDB.STORES.MESSAGES)
    console.log(`🔥 [紧急恢复] 发现 ${allKeys.length} 个聊天`)
    
    for (const key of allKeys) {
      const messages = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, key)
      if (messages && messages.length > 0) {
        messageCache.set(key, messages)
        // 同步到localStorage备份
        try {
          const backupKey = `msg_backup_${key}`
          localStorage.setItem(backupKey, JSON.stringify({ messages, timestamp: Date.now() }))
        } catch (e) {
          // localStorage满了，忽略
        }
        console.log(`✅ [紧急恢复] ${key}: ${messages.length} 条消息`)
      }
    }
    console.log('🔥 [紧急恢复] 完成')
  } catch (e) {
    console.error('❌ [紧急恢复] 失败:', e)
  }
}

// 🔥 页面卸载时的保护机制
if (typeof window !== 'undefined') {
  // 监听页面卸载事件
  window.addEventListener('beforeunload', () => {
    // 🔥🔥🔥 关键修复：不再在beforeunload时备份缓存到localStorage
    // 因为缓存可能只有分页加载的30条消息，会覆盖掉完整数据！
    // IndexedDB本身就是持久化存储，不需要额外备份
  })
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 🔥🔥🔥 关键修复：不再备份到localStorage
      // 分页加载的缓存只有30条，如果备份会导致数据丢失
    }
  })
}

/**
 * 🔥 强制备份所有缓存的消息到 localStorage
 * 用于页面卸载时防止数据丢失
 */
export function forceBackupAllMessages(): void {
  // IndexedDB 已经是持久化存储，不需要再往 localStorage 备份
}

/**
 * 修复重复的消息ID
 */
function fixDuplicateMessageIds(messages: Message[]): Message[] {
  // 🔥 先过滤掉 null/undefined 的消息
  const validMessages = messages.filter(msg => msg && msg.id != null)
  
  const idMap = new Map<number, number>() // 旧ID -> 出现次数
  const needsFix = validMessages.some(msg => {
    const count = idMap.get(msg.id) || 0
    idMap.set(msg.id, count + 1)
    return count > 0 // 如果已经存在，说明有重复
  })
  
  if (!needsFix) {
    return validMessages // 没有重复，返回过滤后的消息
  }
  
  if (import.meta.env.DEV) {
    console.log('⚠️ 检测到重复的消息ID，正在修复...')
  }
  const seenIds = new Set<number>()
  
  return validMessages.map(msg => {
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
      // 🔥🔥🔥 紧急修复：缓存未命中时，立即触发IndexedDB异步加载
      // 同时从localStorage备份恢复，确保不丢数据
      
      // 1. 先尝试从localStorage备份恢复（同步）
      try {
        const backupKey = `msg_backup_${storageKey}`
        const backup = localStorage.getItem(backupKey)
        
        if (backup) {
          const parsed = JSON.parse(backup)
          
          if (parsed.messages && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            messages = parsed.messages as Message[]
            messageCache.set(storageKey, messages)
            console.log(`🔄 [loadMessages] 从localStorage备份恢复: ${messages.length}条消息`)
          }
        }
      } catch (e) {
        // 静默处理
      }
      
      // 2. 🔥🔥🔥 关键修复：异步从IndexedDB加载并合并（不阻塞UI）
      // 这确保即使预加载失败，数据也能在后台恢复
      (async () => {
        try {
          const idbMessages = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, storageKey)
          if (idbMessages && idbMessages.length > 0) {
            const cached = messageCache.get(storageKey) || []
            // 合并数据
            const mergedMap = new Map<number, Message>()
            cached.forEach(m => { if (m && m.id != null) mergedMap.set(m.id, m) })
            idbMessages.forEach(m => { if (m && m.id != null) mergedMap.set(m.id, m) })
            const merged = Array.from(mergedMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
            
            if (merged.length > cached.length) {
              messageCache.set(storageKey, merged)
              // 同步到localStorage备份
              const backupKey = `msg_backup_${storageKey}`
              localStorage.setItem(backupKey, JSON.stringify({ messages: merged, timestamp: Date.now() }))
              console.log(`🔥 [loadMessages] IndexedDB异步恢复: ${merged.length}条消息 (原缓存${cached.length}条)`)
            }
          }
        } catch (e) {
          console.error('IndexedDB异步加载失败:', e)
        }
      })()
      
      // 如果还是没有，返回空数组
      if (!messages) {
        messages = []
      }
    } else {
      // 从缓存读取时也检查并修复
      const fixedMessages = fixDuplicateMessageIds(messages)
      if (fixedMessages !== messages) {
        messageCache.set(storageKey, fixedMessages)
        // 🔥 使用安全保存，防止覆盖更多数据
        safeSetMessages(storageKey, fixedMessages)
        messages = fixedMessages
      }
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
      let loaded = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, storageKey)
      
      // 🔥🔥🔥 关键修复：如果 IndexedDB 数据很少，检查 localStorage 备份是否有更多数据
      try {
        const backupKey = `msg_backup_${storageKey}`
        const backup = localStorage.getItem(backupKey)
        if (backup) {
          const parsed = JSON.parse(backup)
          const backupMessages = parsed.messages as Message[] | undefined
          
          // 🔥🔥🔥 关键修复：始终合并，防止丢失中间消息
          if (backupMessages && backupMessages.length > 0) {
            const mergedMap = new Map<number, Message>()
            // 先添加备份
            backupMessages.forEach(m => {
              if (m && m.id != null) mergedMap.set(m.id, m)
            })
            // 再添加 IndexedDB 数据
            if (loaded) {
              loaded.forEach(m => {
                if (m && m.id != null) mergedMap.set(m.id, m)
              })
            }
            const merged = Array.from(mergedMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
            
            // 只有合并后数量变化才保存
            if (merged.length > (loaded?.length || 0)) {
              console.log(`🔄 [分页加载] 合并: IndexedDB=${loaded?.length || 0}, 备份=${backupMessages.length}, 合并后=${merged.length}`)
              loaded = merged
              await safeSetMessages(storageKey, loaded)
            } else if (merged.length > 0 && (!loaded || loaded.length === 0)) {
              loaded = merged
            }
          }
        }
      } catch (e) {
        console.warn('检查 localStorage 备份失败:', e)
      }
      
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
    
    // 🔥🔥🔥 关键修复：直接从IndexedDB读取，不依赖缓存
    // 因为缓存可能还没加载完成
    let count = 0
    
    // 1. 先从IndexedDB读取
    const idbMessages = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, storageKey)
    if (idbMessages && idbMessages.length > 0) {
      count = idbMessages.length
      // 🔥 同时更新缓存，确保后续操作能读到数据
      if (!messageCache.has(storageKey)) {
        messageCache.set(storageKey, idbMessages)
        console.log(`🔥 [getMessageCount] 从IndexedDB加载并缓存: ${storageKey}, ${count}条`)
      }
    }
    
    // 2. 检查缓存是否有更多数据
    const cached = messageCache.get(storageKey)
    if (cached && cached.length > count) {
      count = cached.length
    }
    
    return count
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
  
  // 🔥🔥🔥 关键修复：每次都检查 localStorage 备份，确保数据完整性
  // 不管缓存是否有数据，都要检查备份是否有更多消息
  try {
    const backupKey = `msg_backup_${storageKey}`
    const backup = localStorage.getItem(backupKey)
    if (backup) {
      const parsed = JSON.parse(backup)
      const backupMessages = parsed.messages as Message[] | undefined
      
      if (backupMessages && backupMessages.length > 0) {
        // 获取当前数据源（优先缓存，其次 IndexedDB）
        let currentData = messages
        if (!currentData) {
          try {
            currentData = await Promise.race([
              IDB.getItem<Message[]>(IDB.STORES.MESSAGES, storageKey),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
            ]) || []
          } catch {
            currentData = []
          }
        }
        
        // 🔥🔥🔥 关键修复：始终合并备份和当前数据，防止丢失中间消息
        // 合并数据
        const mergedMap = new Map<number, Message>()
        // 先添加备份（可能有被丢失的消息）
        backupMessages.forEach(m => {
          if (m && m.id != null) mergedMap.set(m.id, m)
        })
        // 再添加当前数据（可能有新消息）
        if (currentData) {
          currentData.forEach(m => {
            if (m && m.id != null) mergedMap.set(m.id, m)
          })
        }
        
        const merged = Array.from(mergedMap.values()).sort((a, b) => 
          (a.timestamp || 0) - (b.timestamp || 0)
        )
        
        // 只有合并后数量增加才记录日志和保存
        const currentCount = currentData?.length || 0
        if (merged.length > currentCount) {
          console.warn(`⚠️ [自动恢复] 检测到数据丢失！当前=${currentCount}条, 备份=${backupMessages.length}条, 合并后=${merged.length}条`)
          
          // 更新缓存
          messageCache.set(storageKey, merged)
          messages = merged
          
          // 保存到 IndexedDB
          await safeSetMessages(storageKey, merged)
        } else if (merged.length > 0 && !messages) {
          // 缓存为空但有数据，更新缓存
          messageCache.set(storageKey, merged)
          messages = merged
        }
      }
    }
  } catch (e) {
    console.warn('检查/合并localStorage备份失败:', e)
  }
  
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
    
    if (loaded && loaded.length > 0) {
      const fixedMessages = fixDuplicateMessageIds(loaded)
      messageCache.set(storageKey, fixedMessages)
      
      // 如果修复了ID，保存回数据库（异步执行）
      // 🔥 使用安全保存，防止覆盖更多数据
      if (fixedMessages !== loaded) {
        setTimeout(async () => {
          try {
            await safeSetMessages(storageKey, fixedMessages)
          } catch (e) {
            console.error('保存修复的消息失败:', e)
          }
        }, 100)
      }
      
      if (import.meta.env.DEV) {
        console.log(`✅ 已加载消息: chatId=${chatId}, storageKey=${storageKey}, count=${fixedMessages.length}`)
      }
      return fixedMessages
    }
    return []
  }
  
  // 关闭调试日志，避免控制台刷屏
  // if (import.meta.env.DEV) {
  //   console.log(`✅ 从缓存返回消息: chatId=${chatId}, storageKey=${storageKey}, count=${messages.length}`)
  // }
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
 * 🔥 增强版：添加并发控制和数据保护
 * 🔥 关键修复：防止分页加载后的不完整列表覆盖完整列表
 */
export function saveMessages(chatId: string, messages: Message[], forceOverwrite: boolean = false): void {
  try {
    // 🔥 使用账号专属的存储key
    const storageKey = getAccountChatKey(chatId)
    
    // 🔥 并发控制：如果正在保存，将消息加入队列
    if (saveLocks.has(storageKey)) {
      console.log(`⏳ [saveMessages] 检测到并发保存，加入队列: storageKey=${storageKey}`)
      saveQueue.set(storageKey, messages)
      return
    }
    
    // 🔥🔥🔥 强制覆盖模式：先更新缓存，用于删除/重回等场景
    if (forceOverwrite) {
      messageCache.set(storageKey, messages)
      console.log(`🔥 [saveMessages] 强制覆盖模式: storageKey=${storageKey}, count=${messages.length}`)
      
      // 🔥🔥🔥 关键修复：强制覆盖模式下，必须同步更新 localStorage 备份
      // 否则页面刷新时会从旧备份恢复被删除的消息
      try {
        const backupKey = `msg_backup_${storageKey}`
        const backup = {
          messages: messages,
          timestamp: Date.now()
        }
        localStorage.setItem(backupKey, JSON.stringify(backup))
        console.log(`🔥 [saveMessages] 已同步更新 localStorage 备份`)
      } catch (e) {
        console.warn('更新 localStorage 备份失败:', e)
      }
    }
    
    // 获取缓存中的消息
    const cachedMessages = messageCache.get(storageKey)
    
    // 🔥 防止保存空数组覆盖已有数据（强制覆盖模式下跳过此检查）
    if (messages.length === 0 && !forceOverwrite) {
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
      console.warn(`⚠️ [saveMessages] 拒绝保存空数组到 storageKey=${storageKey}，可能是数据加载未完成`)
      return
    }
    
    // 🔥🔥🔥 关键修复：始终合并缓存和传入的消息，防止丢失任何消息 🔥🔥🔥
    // 🔥🔥🔥 但是！强制覆盖模式下跳过合并，否则被删除的消息会被合并回来
    let finalMessages = messages
    if (!forceOverwrite && cachedMessages && cachedMessages.length > 0) {
      // 🔥 始终合并，而不是只在缓存更多时合并
      const mergedMap = new Map<number, Message>()
      
      // 先添加缓存中的所有消息
      cachedMessages.forEach(m => {
        if (m && m.id != null) mergedMap.set(m.id, m)
      })
      
      // 再用新消息覆盖（新消息可能有更新的内容）
      messages.forEach(m => {
        if (m && m.id != null) mergedMap.set(m.id, m)
      })
      
      // 按时间戳排序
      finalMessages = Array.from(mergedMap.values()).sort((a, b) => 
        (a.timestamp || 0) - (b.timestamp || 0)
      )
      
      if (finalMessages.length !== messages.length) {
        console.log(`🔄 [saveMessages] 缓存合并: 传入=${messages.length}, 缓存=${cachedMessages.length}, 合并后=${finalMessages.length}`)
      }
    }
    
    // 清理消息，移除不可序列化的对象
    const cleanedMessages = finalMessages.map(cleanMessageForStorage)
    
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
    
    // 🔥 数据验证：确保消息数组有效
    if (!Array.isArray(finalMessages)) {
      console.error(`❌ [saveMessages] 无效的消息数组: storageKey=${storageKey}`)
      return
    }
    
    // 立即更新缓存（使用合并后的消息）
    messageCache.set(storageKey, finalMessages)
    if (import.meta.env.DEV) {
      console.log(`💾 [缓存] 保存消息: chatId=${chatId}, storageKey=${storageKey}, count=${finalMessages.length}`)
    }
    
    // 🔥 创建保存锁，防止并发
    const savePromise = (async () => {
      try {
        // 🔥🔥🔥 关键修复：始终合并，防止丢失中间消息
        let messagesToSave = cleanedMessages
        if (!forceOverwrite) {
          try {
            const existingInDB = await IDB.getItem<Message[]>(IDB.STORES.MESSAGES, storageKey)
            // 🔥 始终合并，而不是只在 existingInDB 更多时合并
            if (existingInDB && existingInDB.length > 0) {
              const mergedMap = new Map<number, Message>()
              // 先添加现有消息
              existingInDB.forEach(m => {
                if (m && m.id != null) mergedMap.set(m.id, m)
              })
              // 再添加新消息
              cleanedMessages.forEach(m => {
                if (m && m.id != null) mergedMap.set(m.id, m)
              })
              messagesToSave = Array.from(mergedMap.values()).sort((a, b) => 
                (a.timestamp || 0) - (b.timestamp || 0)
              )
              // 同步更新缓存
              messageCache.set(storageKey, messagesToSave)
              if (messagesToSave.length !== cleanedMessages.length) {
                console.log(`🔄 [saveMessages] IndexedDB合并: 传入=${cleanedMessages.length}, DB=${existingInDB.length}, 合并后=${messagesToSave.length}`)
              }
            }
          } catch (e) {
            console.warn('读取IndexedDB进行合并失败:', e)
          }
        }
        
        // 保存到IndexedDB
        await IDB.setItem(IDB.STORES.MESSAGES, storageKey, messagesToSave)
        if (import.meta.env.DEV) {
          console.log(`✅ [IndexedDB] 保存成功: storageKey=${storageKey}, count=${messagesToSave.length}`)
        }
        
        // 🔥 检查是否有队列中的消息需要保存
        const queuedMessages = saveQueue.get(storageKey)
        if (queuedMessages) {
          saveQueue.delete(storageKey)
          console.log(`📦 [saveMessages] 处理队列中的消息: count=${queuedMessages.length}`)
          // 递归调用保存队列中的消息
          setTimeout(() => saveMessages(chatId, queuedMessages), 0)
        }
      } catch (err) {
        console.error(`❌ [IndexedDB] 保存失败: storageKey=${storageKey}`, err)
        // 🔥 保存失败时，尝试备份到localStorage
        try {
          const backupKey = `msg_backup_${storageKey}`
          const backup = {
            messages: cleanedMessages,
            timestamp: Date.now()
          }
          localStorage.setItem(backupKey, JSON.stringify(backup))
          console.log(`💾 [备份] 已备份到localStorage: ${cleanedMessages.length}条消息`)
        } catch (e) {
          console.error('备份到localStorage也失败:', e)
        }
      } finally {
        // 清除保存锁
        saveLocks.delete(storageKey)
      }
    })()
    
    // 设置保存锁
    saveLocks.set(storageKey, savePromise)
    
    // 🔥 触发消息保存事件，用于通知和未读标记
    console.log(`🔔 [saveMessages] 触发 chat-message-saved 事件: chatId=${chatId}, 消息数=${messages.length}`)
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
 * 🔥🔥🔥 关键修复：使用锁机制防止竞态条件导致消息丢失
 */
export function addMessage(chatId: string, message: Message): void {
  console.log(`🔥 [addMessage] 开始: chatId=${chatId}, messageId=${message.id}`)
  
  const storageKey = getAccountChatKey(chatId)
  
  // 🔥🔥🔥 关键修复：使用锁机制串行化操作，防止竞态
  const doAdd = async (): Promise<void> => {
    try {
      // 🔥 关键：从缓存读取最新数据，而不是等待异步加载
      // 这样可以避免竞态条件
      let currentMessages = messageCache.get(storageKey)
      
      // 如果缓存为空，才需要异步加载
      if (!currentMessages) {
        currentMessages = await ensureMessagesLoaded(chatId)
      }
      
      console.log(`🔥 [addMessage] 当前消息数: ${currentMessages.length}`)
      
      const existingIndex = currentMessages.findIndex(m => m.id === message.id)
      let newMessages: Message[]
      
      if (existingIndex !== -1) {
        newMessages = [...currentMessages]
        newMessages[existingIndex] = { ...newMessages[existingIndex], ...message }
        console.log(`🔥 [addMessage] 更新已有消息`)
      } else {
        newMessages = [...currentMessages, message]
        console.log(`🔥 [addMessage] 添加新消息，总数: ${newMessages.length}`)
        window.dispatchEvent(new CustomEvent('new-message', {
          detail: { chatId, message }
        }))
      }
      
      // 立即更新缓存
      messageCache.set(storageKey, newMessages)
      
      // 保存到IndexedDB
      saveMessages(chatId, newMessages)
      console.log(`🔥 [addMessage] 完成，总消息数: ${newMessages.length}`)
    } catch (error) {
      console.error('❌ [addMessage] 失败，尝试直接添加:', error)
      // 降级：即使失败，也要确保新消息不丢失
      const cachedMessages = messageCache.get(storageKey) || []
      const newMessages = [...cachedMessages, message]
      messageCache.set(storageKey, newMessages)
      saveMessages(chatId, newMessages)
    }
  }
  
  // 🔥🔥🔥 串行化：等待前一个操作完成后再执行
  const previousLock = addMessageLocks.get(storageKey) || Promise.resolve()
  const currentLock = previousLock.then(doAdd).catch(() => doAdd())
  addMessageLocks.set(storageKey, currentLock)
}

/**
 * 批量添加多条消息（避免竞态条件）
 * 用于一次性发送多张图片等场景
 * 
 * 🔥🔥🔥 关键修复：使用锁机制防止竞态条件
 */
export function addMessages(chatId: string, messagesToAdd: Message[]): void {
  if (messagesToAdd.length === 0) return
  
  const storageKey = getAccountChatKey(chatId)
  
  // 🔥🔥🔥 关键修复：使用锁机制串行化操作，防止竞态
  const doAdd = async (): Promise<void> => {
    try {
      // 🔥 关键：从缓存读取最新数据
      let currentMessages = messageCache.get(storageKey)
      
      // 如果缓存为空，才需要异步加载
      if (!currentMessages) {
        currentMessages = await ensureMessagesLoaded(chatId)
      }
      
      console.log(`🔥 [addMessages] 当前消息数: ${currentMessages.length}`)
      
      let updatedMessages = [...currentMessages]
      
      for (const message of messagesToAdd) {
        const existingIndex = updatedMessages.findIndex(m => m.id === message.id)
        if (existingIndex !== -1) {
          updatedMessages[existingIndex] = { ...updatedMessages[existingIndex], ...message }
        } else {
          updatedMessages.push(message)
          window.dispatchEvent(new CustomEvent('new-message', {
            detail: { chatId, message }
          }))
        }
      }
      
      // 立即更新缓存
      messageCache.set(storageKey, updatedMessages)
      
      // 保存到IndexedDB
      saveMessages(chatId, updatedMessages)
      console.log(`✅ [addMessages] 批量保存成功: 新增${messagesToAdd.length}条，总共${updatedMessages.length}条`)
    } catch (error) {
      console.error('❌ [addMessages] 失败:', error)
      // 降级处理
      const cachedMessages = messageCache.get(storageKey) || []
      const updatedMessages = [...cachedMessages, ...messagesToAdd]
      messageCache.set(storageKey, updatedMessages)
      saveMessages(chatId, updatedMessages)
    }
  }
  
  // 🔥🔥🔥 串行化：等待前一个操作完成后再执行
  const previousLock = addMessageLocks.get(storageKey) || Promise.resolve()
  const currentLock = previousLock.then(doAdd).catch(() => doAdd())
  addMessageLocks.set(storageKey, currentLock)
}

/**
 * 删除一条消息（永久删除）
 */
export function deleteMessage(chatId: string, messageId: number): void {
  // 🔥 关键修复：异步确保消息已加载，防止误删
  ensureMessagesLoaded(chatId).then(messages => {
    const filteredMessages = messages.filter(m => m.id !== messageId)
    
    // 🔥 使用 forceOverwrite=true 跳过智能合并，防止被删的消息恢复
    saveMessages(chatId, filteredMessages, true)
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
