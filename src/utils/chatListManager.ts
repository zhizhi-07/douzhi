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
    const chats = await IDB.getItem<Chat[]>(IDB.STORES.SETTINGS, CHAT_LIST_KEY)
    
    if (chats && chats.length > 0) {
      console.log(`📦 [IndexedDB] 加载聊天列表: ${chats.length} 个`)
      chatListCache = chats
      return chats
    }

    // 如果 IndexedDB 没有数据，尝试从 localStorage 迁移
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
    
    // 保存到 IndexedDB
    await IDB.setItem(IDB.STORES.SETTINGS, CHAT_LIST_KEY, chats)
    console.log(`✅ [IndexedDB] 保存聊天列表: ${chats.length} 个`)
    
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

