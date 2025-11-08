/**
 * 群聊管理器
 * 🔥 使用 IndexedDB 存储，解决 localStorage 配额限制
 */

import * as IDB from './indexedDBManager'

export interface GroupChat {
  id: string
  name: string
  avatar?: string
  memberIds: string[]
  createdAt: string
  lastMessage?: string
  lastMessageTime?: string
}

export interface GroupMessage {
  id: string
  groupId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  time: string
  type: 'text' | 'image' | 'voice' | 'emoji' | 'system'
  timestamp?: number
  isRecalled?: boolean  // 是否已撤回
  recalledContent?: string  // 撤回前的原始内容
  quotedMessage?: {  // 引用的消息
    id: string
    content: string
    userName: string
  }
  emojiUrl?: string  // 表情包URL
  emojiDescription?: string  // 表情包描述
}

const GROUP_CHATS_KEY = 'group_chats' // 仅用于迁移
const GROUP_MESSAGES_PREFIX = 'group_messages_' // 仅用于迁移

// 全局计数器，确保同一毫秒内生成的ID也是唯一的
let messageIdCounter = 0

// 内存缓存
let groupsCache: GroupChat[] | null = null
const messagesCache = new Map<string, GroupMessage[]>()

// 启动时从 IndexedDB 加载群聊列表
IDB.getItem<GroupChat[]>(IDB.STORES.MISC, 'group_chats').then(groups => {
  if (groups && groups.length > 0) {
    groupsCache = groups
    console.log(`✅ 已从 IndexedDB 加载 ${groups.length} 个群聊`)
  } else {
    // 尝试从 localStorage 迁移
    try {
      const saved = localStorage.getItem(GROUP_CHATS_KEY)
      if (saved) {
        const localGroups = JSON.parse(saved)
        console.log(`📦 从 localStorage 迁移 ${localGroups.length} 个群聊到 IndexedDB`)
        groupsCache = localGroups
        IDB.setItem(IDB.STORES.MISC, 'group_chats', localGroups)
        localStorage.removeItem(GROUP_CHATS_KEY)
      } else {
        groupsCache = []
      }
    } catch (e) {
      console.error('迁移群聊失败:', e)
      groupsCache = []
    }
  }
})

class GroupChatManager {
  // 获取所有群聊（同步，使用缓存）
  getAllGroups(): GroupChat[] {
    return groupsCache || []
  }

  // 获取单个群聊
  getGroup(groupId: string): GroupChat | null {
    const groups = this.getAllGroups()
    return groups.find(g => g.id === groupId) || null
  }

  // 创建群聊
  createGroup(name: string, memberIds: string[]): GroupChat {
    const newGroup: GroupChat = {
      id: `group_${Date.now()}`,
      name,
      memberIds,
      createdAt: new Date().toISOString(),
      lastMessage: '开始聊天吧',
      lastMessageTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    
    if (!groupsCache) groupsCache = []
    groupsCache.push(newGroup)
    
    // 后台异步保存到 IndexedDB
    IDB.setItem(IDB.STORES.MISC, 'group_chats', groupsCache)
    
    // 触发更新事件
    window.dispatchEvent(new Event('storage'))
    
    return newGroup
  }

  // 更新群聊
  updateGroup(groupId: string, updates: Partial<GroupChat>): void {
    if (!groupsCache) return
    const index = groupsCache.findIndex(g => g.id === groupId)
    if (index !== -1) {
      groupsCache[index] = { ...groupsCache[index], ...updates }
      // 后台异步保存
      IDB.setItem(IDB.STORES.MISC, 'group_chats', groupsCache)
    }
  }

  // 删除群聊
  deleteGroup(groupId: string): void {
    if (!groupsCache) return
    groupsCache = groupsCache.filter(g => g.id !== groupId)
    
    // 删除群聊数据和消息
    IDB.setItem(IDB.STORES.MISC, 'group_chats', groupsCache)
    IDB.removeItem(IDB.STORES.MESSAGES, `group_${groupId}`)
    messagesCache.delete(groupId)
    
    // 触发更新事件
    window.dispatchEvent(new Event('storage'))
  }

  // 添加成员
  addMember(groupId: string, userId: string): void {
    const group = this.getGroup(groupId)
    if (group && !group.memberIds.includes(userId)) {
      group.memberIds.push(userId)
      this.updateGroup(groupId, { memberIds: group.memberIds })
    }
  }

  // 移除成员
  removeMember(groupId: string, userId: string): void {
    const group = this.getGroup(groupId)
    if (group) {
      group.memberIds = group.memberIds.filter(id => id !== userId)
      this.updateGroup(groupId, { memberIds: group.memberIds })
    }
  }

  // 获取群聊消息（同步，使用缓存）
  getMessages(groupId: string): GroupMessage[] {
    // 检查缓存
    if (messagesCache.has(groupId)) {
      return messagesCache.get(groupId)!
    }
    
    // 缓存未命中，异步加载
    const storageKey = `group_${groupId}`
    IDB.getItem<GroupMessage[]>(IDB.STORES.MESSAGES, storageKey).then(messages => {
      if (messages && messages.length > 0) {
        messagesCache.set(groupId, messages)
      } else {
        // 尝试从 localStorage 迁移
        const saved = localStorage.getItem(GROUP_MESSAGES_PREFIX + groupId)
        if (saved) {
          const localMessages = JSON.parse(saved)
          console.log(`📦 从 localStorage 迁移群聊消息: ${groupId}, 数量=${localMessages.length}`)
          messagesCache.set(groupId, localMessages)
          IDB.setItem(IDB.STORES.MESSAGES, storageKey, localMessages)
          localStorage.removeItem(GROUP_MESSAGES_PREFIX + groupId)
        } else {
          messagesCache.set(groupId, [])
        }
      }
    })
    
    // 立即返回空数组或缓存
    return messagesCache.get(groupId) || []
  }

  // 添加消息（🔥 使用 IndexedDB）
  addMessage(groupId: string, message: Omit<GroupMessage, 'id' | 'groupId' | 'time'>): GroupMessage {
    // 🔥 使用时间戳 + 计数器生成唯一ID，避免同一毫秒内的冲突
    const now = Date.now()
    const uniqueId = now * 10000 + (messageIdCounter++ % 10000)
    
    const newMessage: GroupMessage = {
      id: `msg_${uniqueId}`,
      groupId,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
      ...message
    }
    
    const messages = this.getMessages(groupId)
    messages.push(newMessage)
    
    // 更新缓存
    messagesCache.set(groupId, messages)
    
    // 异步保存到 IndexedDB（不再使用 localStorage）
    const storageKey = `group_${groupId}`
    IDB.setItem(IDB.STORES.MESSAGES, storageKey, messages).catch(e =>
      console.error('保存群聊消息失败:', e)
    )
    
    // 更新群聊最后消息
    this.updateGroup(groupId, {
      lastMessage: newMessage.content,
      lastMessageTime: newMessage.time
    })
    
    // 触发更新事件
    window.dispatchEvent(new Event('storage'))
    
    return newMessage
  }

  // 清空消息
  clearMessages(groupId: string): void {
    messagesCache.set(groupId, [])
    IDB.removeItem(IDB.STORES.MESSAGES, `group_${groupId}`)
    this.updateGroup(groupId, {
      lastMessage: undefined,
      lastMessageTime: undefined
    })
  }

  // 撤回消息
  recallMessage(groupId: string, messageId: string): void {
    const messages = this.getMessages(groupId)
    const messageIndex = messages.findIndex(m => m.id === messageId)
    
    if (messageIndex !== -1) {
      messages[messageIndex].isRecalled = true
      messages[messageIndex].recalledContent = messages[messageIndex].content
      messages[messageIndex].content = '撤回了一条消息'
      messages[messageIndex].type = 'system'
      
      // 更新缓存和 IndexedDB
      messagesCache.set(groupId, messages)
      IDB.setItem(IDB.STORES.MESSAGES, `group_${groupId}`, messages)
      
      // 触发更新事件
      window.dispatchEvent(new Event('storage'))
    }
  }
}

export const groupChatManager = new GroupChatManager()
