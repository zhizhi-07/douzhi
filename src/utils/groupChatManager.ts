/**
 * 群聊管理器
 */

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
  type: 'text' | 'image' | 'voice'
}

const GROUP_CHATS_KEY = 'group_chats'
const GROUP_MESSAGES_PREFIX = 'group_messages_'

class GroupChatManager {
  // 获取所有群聊
  getAllGroups(): GroupChat[] {
    const data = localStorage.getItem(GROUP_CHATS_KEY)
    return data ? JSON.parse(data) : []
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
    
    const groups = this.getAllGroups()
    groups.push(newGroup)
    localStorage.setItem(GROUP_CHATS_KEY, JSON.stringify(groups))
    
    // 触发更新事件
    window.dispatchEvent(new Event('storage'))
    
    return newGroup
  }

  // 更新群聊
  updateGroup(groupId: string, updates: Partial<GroupChat>): void {
    const groups = this.getAllGroups()
    const index = groups.findIndex(g => g.id === groupId)
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updates }
      localStorage.setItem(GROUP_CHATS_KEY, JSON.stringify(groups))
    }
  }

  // 删除群聊
  deleteGroup(groupId: string): void {
    const groups = this.getAllGroups().filter(g => g.id !== groupId)
    localStorage.setItem(GROUP_CHATS_KEY, JSON.stringify(groups))
    localStorage.removeItem(GROUP_MESSAGES_PREFIX + groupId)
    
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

  // 获取群聊消息
  getMessages(groupId: string): GroupMessage[] {
    const data = localStorage.getItem(GROUP_MESSAGES_PREFIX + groupId)
    return data ? JSON.parse(data) : []
  }

  // 添加消息
  addMessage(groupId: string, message: Omit<GroupMessage, 'id' | 'groupId' | 'time'>): GroupMessage {
    const newMessage: GroupMessage = {
      id: `msg_${Date.now()}`,
      groupId,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      ...message
    }
    
    const messages = this.getMessages(groupId)
    messages.push(newMessage)
    localStorage.setItem(GROUP_MESSAGES_PREFIX + groupId, JSON.stringify(messages))
    
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
    localStorage.removeItem(GROUP_MESSAGES_PREFIX + groupId)
    this.updateGroup(groupId, {
      lastMessage: undefined,
      lastMessageTime: undefined
    })
  }
}

export const groupChatManager = new GroupChatManager()
