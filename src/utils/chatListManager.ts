/**
 * 聊天列表管理器
 * 使用 IndexedDB 存储，解决 localStorage QuotaExceededError 问题
 */

import * as IDB from './indexedDBManager'

export interface Chat {
  id: string
  characterId: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  isGroup?: boolean
  unread?: number
  isPinned?: boolean
}

const CHAT_LIST_KEY = 'chat_list'
let chatListCache: Chat[] | null = null

/**
 * 加载聊天列表
 */
export async function loadChatList(): Promise<Chat[]> {
  // 优先返回缓存
  if (chatListCache !== null) {
    return chatListCache
  }

  try {
    // 从 IndexedDB 读取
    let chats = await IDB.getItem<Chat[]>(IDB.STORES.SETTINGS, CHAT_LIST_KEY)
    
    // 🔥 如果IndexedDB没有数据，尝试从localStorage备份恢复
    if (!chats || chats.length === 0) {
      try {
        const backupKey = 'chat_list_backup'
        const backup = localStorage.getItem(backupKey)
        if (backup) {
          const parsed = JSON.parse(backup)
          chats = parsed.chats
          const backupAge = Date.now() - (parsed.timestamp || 0)
          
          // 只恢复1小时内的备份，防止恢复太旧的数据
          if (backupAge > 60 * 60 * 1000) {
            console.warn(`⚠️ [恢复备份] 聊天列表备份太旧 (${Math.floor(backupAge / 1000 / 60)}分钟)，跳过恢复`)
            localStorage.removeItem(backupKey)
            chats = null
          } else if (chats && chats.length > 0) {
            console.log(`🔄 [恢复备份] 从localStorage恢复聊天列表: ${chats.length} 个`)
            // 恢复到IndexedDB
            await IDB.setItem(IDB.STORES.SETTINGS, CHAT_LIST_KEY, chats)
            localStorage.removeItem(backupKey)
            chatListCache = chats
            return chats
          }
        }
      } catch (e) {
        console.warn('恢复聊天列表备份失败:', e)
      }
    }
    
    if (chats && chats.length > 0) {
      console.log(`📦 [IndexedDB] 加载聊天列表: ${chats.length} 个`)
      chatListCache = chats
      return chats
    }

    // 如果 IndexedDB 和备份都没有数据，尝试从 localStorage 迁移
    const lsData = localStorage.getItem(CHAT_LIST_KEY)
    if (lsData) {
      try {
        const localChats = JSON.parse(lsData)
        if (Array.isArray(localChats) && localChats.length > 0) {
          console.log(`📦 从 localStorage 迁移聊天列表: ${localChats.length} 个`)
          chatListCache = localChats
          
          // 迁移到 IndexedDB
          await IDB.setItem(IDB.STORES.SETTINGS, CHAT_LIST_KEY, localChats)
          console.log('✅ 已迁移到 IndexedDB')
          
          // 迁移后清理 localStorage 释放空间
          localStorage.removeItem(CHAT_LIST_KEY)
          console.log('🗑️ 已清理 localStorage 旧数据')
          
          return localChats
        }
      } catch (parseError) {
        console.error('❌ localStorage 数据解析失败:', parseError)
      }
    }

    // 没有数据，返回空数组
    chatListCache = []
    return []
  } catch (error) {
    console.error('❌ 加载聊天列表失败:', error)
    // 降级到 localStorage
    try {
      const lsData = localStorage.getItem(CHAT_LIST_KEY)
      if (lsData) {
        const localChats = JSON.parse(lsData)
        chatListCache = localChats
        return localChats
      }
    } catch (lsError) {
      console.error('❌ localStorage 降级也失败:', lsError)
    }
    return []
  }
}

/**
 * 保存聊天列表
 */
export async function saveChatList(chats: Chat[]): Promise<void> {
  try {
    // 更新缓存
    chatListCache = chats
    
    // 🔥 手机优化：同步保存到localStorage作为备份（防止页面关闭时IndexedDB保存被中断）
    const backupKey = 'chat_list_backup'
    try {
      localStorage.setItem(backupKey, JSON.stringify({
        chats: chats,
        timestamp: Date.now()
      }))
      console.log(`💾 [localStorage备份] 聊天列表已备份: ${chats.length} 个`)
    } catch (e) {
      console.warn(`⚠️ [localStorage备份] 聊天列表备份失败:`, e)
    }
    
    // 保存到 IndexedDB
    await IDB.setItem(IDB.STORES.SETTINGS, CHAT_LIST_KEY, chats)
    console.log(`✅ [IndexedDB] 保存聊天列表: ${chats.length} 个`)
    
    // IndexedDB保存成功后删除备份
    try {
      localStorage.removeItem(backupKey)
    } catch (e) {
      // 忽略删除失败
    }
    
    // 触发存储事件，通知其他组件
    window.dispatchEvent(new Event('storage'))
  } catch (error) {
    console.error('❌ 保存聊天列表失败:', error)
    
    // 降级到 localStorage（可能会失败）
    try {
      localStorage.setItem(CHAT_LIST_KEY, JSON.stringify(chats))
      console.warn('⚠️ 降级使用 localStorage 保存')
    } catch (lsError) {
      console.error('❌ localStorage 保存也失败:', lsError)
      if (lsError instanceof Error && lsError.name === 'QuotaExceededError') {
        throw new Error('存储空间不足，请尝试删除一些不常用的聊天记录')
      }
      throw lsError
    }
  }
}

/**
 * 同步加载聊天列表（立即返回缓存，异步加载最新数据）
 */
export function loadChatListSync(): Chat[] {
  // 立即返回缓存
  if (chatListCache !== null) {
    return chatListCache
  }

  // 触发异步加载
  loadChatList().catch(err => {
    console.error('异步加载聊天列表失败:', err)
  })

  // 尝试从 localStorage 读取作为临时数据
  try {
    const lsData = localStorage.getItem(CHAT_LIST_KEY)
    if (lsData) {
      const localChats = JSON.parse(lsData)
      chatListCache = localChats
      return localChats
    }
  } catch (error) {
    console.error('从 localStorage 读取失败:', error)
  }

  return []
}

/**
 * 清空缓存（用于强制重新加载）
 */
export function clearChatListCache(): void {
  chatListCache = null
}

