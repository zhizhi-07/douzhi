// Instagram 私聊系统 - 使用 IndexedDB 存储（支持大量消息）

import * as IDB from './indexedDBManager'

export interface DMMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: number
  time: string
  isFromUser: boolean  // 是否是用户发的
  type?: 'text' | 'emoji'  // 消息类型
  emojiUrl?: string  // 表情包URL
}

export interface DMConversation {
  id: string  // NPC ID
  name: string
  avatar?: string
  lastMessage: string
  lastTime: string
  unreadCount: number
  updatedAt: number
}

// 内存缓存
let conversationsCache: DMConversation[] | null = null
let messagesCache: Record<string, DMMessage[]> = {}

// 获取所有私聊会话（同步返回缓存，异步更新）
export function getDMConversations(): DMConversation[] {
  // 优先返回缓存
  if (conversationsCache !== null) {
    return conversationsCache.sort((a, b) => b.updatedAt - a.updatedAt)
  }
  
  // 首次加载时尝试从localStorage读取（兼容旧数据）
  try {
    const oldData = localStorage.getItem('instagram_dm_conversations')
    if (oldData) {
      conversationsCache = JSON.parse(oldData)
      // 迁移到IndexedDB
      IDB.setItem(IDB.STORES.DM_CONVERSATIONS, 'all', conversationsCache)
      localStorage.removeItem('instagram_dm_conversations')
      console.log('📦 私聊会话已迁移到IndexedDB')
    }
  } catch {}
  
  // 异步从IndexedDB加载
  IDB.getItem<DMConversation[]>(IDB.STORES.DM_CONVERSATIONS, 'all').then(data => {
    if (data) conversationsCache = data
  })
  
  return conversationsCache || []
}

// 保存会话列表
export function saveDMConversations(conversations: DMConversation[]) {
  conversationsCache = conversations
  IDB.setItem(IDB.STORES.DM_CONVERSATIONS, 'all', conversations).catch(e => {
    console.error('保存私聊会话失败:', e)
  })
}

// 获取与某人的聊天记录（同步返回缓存）
export function getDMMessages(npcId: string): DMMessage[] {
  // 优先返回缓存
  if (messagesCache[npcId]) {
    return messagesCache[npcId]
  }
  
  // 首次加载时尝试从localStorage读取（兼容旧数据）
  try {
    const oldData = localStorage.getItem('instagram_dm_messages')
    if (oldData) {
      const allOld = JSON.parse(oldData) as Record<string, DMMessage[]>
      messagesCache = allOld
      // 迁移到IndexedDB
      for (const id in allOld) {
        IDB.setItem(IDB.STORES.DM_MESSAGES, id, allOld[id])
      }
      localStorage.removeItem('instagram_dm_messages')
      console.log('📦 私聊消息已迁移到IndexedDB')
    }
  } catch {}
  
  // 异步从IndexedDB加载
  IDB.getItem<DMMessage[]>(IDB.STORES.DM_MESSAGES, npcId).then(data => {
    if (data) messagesCache[npcId] = data
  })
  
  return messagesCache[npcId] || []
}

// NPC发送私聊消息给用户
export function sendDMToUser(
  npcId: string, 
  npcName: string, 
  npcAvatar: string | undefined, 
  content: string
) {
  const now = Date.now()
  const time = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const message: DMMessage = {
    id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
    senderId: npcId,
    senderName: npcName,
    senderAvatar: npcAvatar,
    content,
    timestamp: now,
    time,
    isFromUser: false
  }
  
  // 保存消息到缓存和IndexedDB
  const currentMessages = getDMMessages(npcId)
  currentMessages.push(message)
  messagesCache[npcId] = currentMessages
  IDB.setItem(IDB.STORES.DM_MESSAGES, npcId, currentMessages)
  
  // 更新会话列表
  const conversations = getDMConversations()
  const existingIndex = conversations.findIndex(c => c.id === npcId)
  
  if (existingIndex >= 0) {
    conversations[existingIndex].lastMessage = content
    conversations[existingIndex].lastTime = time
    conversations[existingIndex].unreadCount += 1
    conversations[existingIndex].updatedAt = now
  } else {
    conversations.push({
      id: npcId,
      name: npcName,
      avatar: npcAvatar,
      lastMessage: content,
      lastTime: time,
      unreadCount: 1,
      updatedAt: now
    })
  }
  
  saveDMConversations(conversations)
  console.log(`💬 [私聊] ${npcName} 给你发了消息: "${content}"`)
  
  return message
}

// 用户发送消息给NPC
export function sendDMFromUser(
  npcId: string,
  npcName: string,
  npcAvatar: string | undefined,
  content: string
) {
  const now = Date.now()
  const time = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const message: DMMessage = {
    id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
    senderId: 'user',
    senderName: '我',
    content,
    timestamp: now,
    time,
    isFromUser: true
  }
  
  // 保存消息到缓存和IndexedDB
  const currentMessages = getDMMessages(npcId)
  currentMessages.push(message)
  messagesCache[npcId] = currentMessages
  IDB.setItem(IDB.STORES.DM_MESSAGES, npcId, currentMessages)
  
  // 更新会话列表
  const conversations = getDMConversations()
  const existingIndex = conversations.findIndex(c => c.id === npcId)
  
  if (existingIndex >= 0) {
    conversations[existingIndex].lastMessage = content
    conversations[existingIndex].lastTime = time
    conversations[existingIndex].updatedAt = now
  } else {
    conversations.push({
      id: npcId,
      name: npcName,
      avatar: npcAvatar,
      lastMessage: content,
      lastTime: time,
      unreadCount: 0,
      updatedAt: now
    })
  }
  
  saveDMConversations(conversations)
  
  return message
}

// 标记会话已读
export function markDMAsRead(npcId: string) {
  const conversations = getDMConversations()
  const conv = conversations.find(c => c.id === npcId)
  if (conv) {
    conv.unreadCount = 0
    saveDMConversations(conversations)
  }
}

// 获取未读消息总数
export function getTotalUnreadDM(): number {
  const conversations = getDMConversations()
  return conversations.reduce((sum, c) => sum + c.unreadCount, 0)
}
