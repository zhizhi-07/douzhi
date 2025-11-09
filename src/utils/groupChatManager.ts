/**
 * 群聊管理器
 * 🔥 使用 IndexedDB 存储，解决 localStorage 配额限制
 */

import * as IDB from './indexedDBManager'

export interface GroupMember {
  id: string
  role: 'owner' | 'admin' | 'member'  // 角色：群主、管理员、普通成员
  title?: string  // 自定义头衔
}

export interface GroupChat {
  id: string
  name: string
  avatar?: string
  memberIds: string[]
  members?: GroupMember[]  // 成员详细信息
  owner?: string  // 群主ID
  createdAt: string
  lastMessage?: string
  lastMessageTime?: string
  announcement?: string  // 群公告
  privateChatSync?: {
    enabled: boolean  // 是否启用私聊同步
    messageCount: number  // 同步私聊消息条数（默认10条）
  }
  smartSummary?: {
    enabled: boolean  // 是否启用智能总结
    triggerInterval?: number  // 每隔多少轮对话触发一次总结（默认10轮）
    lastSummary?: string  // 最后一次总结的JSON字符串
    lastSummaryTime?: string  // 最后一次总结的时间
    lastSummaryMessageCount?: number  // 上次总结时的消息总数（已废弃）
    lastSummaryUserMessageCount?: number  // 上次总结时用户发送的消息数（按轮数计算）
  }
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
    const group = groups.find(g => g.id === groupId) || null
    
    // 🔥 兼容旧数据：如果members不存在，自动初始化
    if (group && !group.members && group.memberIds) {
      group.members = group.memberIds.map((id, index) => ({
        id,
        role: index === 0 ? 'owner' : 'member'
      }))
      group.owner = group.memberIds[0]
      // 保存更新
      this.updateGroup(groupId, { members: group.members, owner: group.owner })
    }
    
    return group
  }

  // 创建群聊
  createGroup(name: string, memberIds: string[], creatorName: string = '你', memberNames: string[] = []): GroupChat {
    const groupId = `group_${Date.now()}`
    
    // 初始化成员角色，第一个成员(user)为群主
    const members: GroupMember[] = memberIds.map((id, index) => ({
      id,
      role: index === 0 ? 'owner' : 'member'
    }))
    
    const newGroup: GroupChat = {
      id: groupId,
      name,
      memberIds,
      members,
      owner: memberIds[0], // 第一个成员为群主
      createdAt: new Date().toISOString(),
      lastMessage: '开始聊天吧',
      lastMessageTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    
    if (!groupsCache) groupsCache = []
    groupsCache.push(newGroup)
    
    // 后台异步保存到 IndexedDB
    IDB.setItem(IDB.STORES.MISC, 'group_chats', groupsCache)
    
    // 🎉 添加系统消息：创建群聊
    const otherMembers = memberNames.filter((_, idx) => memberIds[idx] !== 'user')
    if (otherMembers.length > 0) {
      const membersText = otherMembers.join('、')
      this.addMessage(groupId, {
        userId: 'system',
        userName: '系统',
        userAvatar: '',
        content: `${creatorName}邀请${membersText}加入了群聊`,
        type: 'system'
      })
    }
    
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

  // 更新群公告（带系统消息）
  updateAnnouncement(groupId: string, announcement: string, userName: string = '你'): void {
    // 更新群聊信息
    this.updateGroup(groupId, { announcement })
    
    // 添加系统消息
    this.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content: `${userName}修改了群公告`,
      type: 'system'
    })
  }

  // 设置/取消管理员（带系统消息）
  setAdmin(groupId: string, memberId: string, isAdmin: boolean, userName: string = '你'): void {
    const group = this.getGroup(groupId)
    if (!group || !group.members) return
    
    const memberIndex = group.members.findIndex(m => m.id === memberId)
    if (memberIndex === -1) return
    
    // 更新成员角色
    group.members[memberIndex].role = isAdmin ? 'admin' : 'member'
    this.updateGroup(groupId, { members: group.members })
    
    // 获取成员名称
    const memberName = this.getMemberName(memberId)
    
    // 添加系统消息
    const content = isAdmin 
      ? `${userName}设置${memberName}为管理员 🛡️`
      : `${userName}取消了${memberName}的管理员身份`
    
    this.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content,
      type: 'system'
    })
  }

  // 设置头衔（带系统消息）
  setTitle(groupId: string, memberId: string, title: string, userName: string = '你'): void {
    const group = this.getGroup(groupId)
    if (!group || !group.members) return
    
    const memberIndex = group.members.findIndex(m => m.id === memberId)
    if (memberIndex === -1) return
    
    const oldTitle = group.members[memberIndex].title
    
    // 更新头衔
    if (title) {
      group.members[memberIndex].title = title
    } else {
      delete group.members[memberIndex].title
    }
    this.updateGroup(groupId, { members: group.members })
    
    // 获取成员名称
    const memberName = this.getMemberName(memberId)
    
    // 添加系统消息
    let content = ''
    if (title && !oldTitle) {
      content = `${userName}给${memberName}设置了头衔：✨${title}`
    } else if (title && oldTitle) {
      content = `${userName}修改了${memberName}的头衔：✨${title}`
    } else if (!title && oldTitle) {
      content = `${userName}取消了${memberName}的头衔`
    }
    
    if (content) {
      this.addMessage(groupId, {
        userId: 'system',
        userName: '系统',
        userAvatar: '',
        content,
        type: 'system'
      })
    }
  }

  // 获取成员名称的辅助方法
  private getMemberName(memberId: string): string {
    if (memberId === 'user') return '我'
    // 这里可以从characterService获取，但为了避免循环依赖，先返回ID
    return memberId
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

  // 移除成员（退出或被踢）
  removeMember(groupId: string, memberId: string, isKicked: boolean = false, operatorName: string = '你'): void {
    const group = this.getGroup(groupId)
    if (!group) return
    
    // 移除成员ID
    group.memberIds = group.memberIds.filter(id => id !== memberId)
    
    // 移除成员详情
    if (group.members) {
      group.members = group.members.filter(m => m.id !== memberId)
    }
    
    // 保存更新
    this.updateGroup(groupId, { 
      memberIds: group.memberIds,
      members: group.members
    })
    
    // 获取成员名称
    const memberName = this.getMemberName(memberId)
    
    // 添加系统消息
    const content = isKicked 
      ? `${operatorName}将${memberName}移出了群聊`
      : `${memberName}退出了群聊`
    
    this.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content,
      type: 'system'
    })
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

  // 🔥 替换所有消息（用于重新生成AI回复）
  replaceAllMessages(groupId: string, messages: GroupMessage[]): void {
    // 更新缓存
    messagesCache.set(groupId, messages)
    
    // 保存到 IndexedDB
    const storageKey = `group_${groupId}`
    IDB.setItem(IDB.STORES.MESSAGES, storageKey, messages).catch(e =>
      console.error('替换消息失败:', e)
    )
    
    // 更新最后一条消息
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      this.updateGroup(groupId, {
        lastMessage: lastMsg.content,
        lastMessageTime: lastMsg.time
      })
    } else {
      this.updateGroup(groupId, {
        lastMessage: undefined,
        lastMessageTime: undefined
      })
    }
    
    // 触发更新事件
    window.dispatchEvent(new Event('storage'))
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
