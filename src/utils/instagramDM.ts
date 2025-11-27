// Instagram 私聊系统

export interface DMMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: number
  time: string
  isFromUser: boolean  // 是否是用户发的
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

const STORAGE_KEY_DM_CONVERSATIONS = 'instagram_dm_conversations'
const STORAGE_KEY_DM_MESSAGES = 'instagram_dm_messages'

// 获取所有私聊会话
export function getDMConversations(): DMConversation[] {
  const data = localStorage.getItem(STORAGE_KEY_DM_CONVERSATIONS)
  if (!data) return []
  try {
    const conversations = JSON.parse(data) as DMConversation[]
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

// 保存会话列表
export function saveDMConversations(conversations: DMConversation[]) {
  localStorage.setItem(STORAGE_KEY_DM_CONVERSATIONS, JSON.stringify(conversations))
}

// 获取所有消息
function getAllDMMessages(): Record<string, DMMessage[]> {
  const data = localStorage.getItem(STORAGE_KEY_DM_MESSAGES)
  if (!data) return {}
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}

// 保存所有消息
function saveAllDMMessages(messages: Record<string, DMMessage[]>) {
  localStorage.setItem(STORAGE_KEY_DM_MESSAGES, JSON.stringify(messages))
}

// 获取与某人的聊天记录
export function getDMMessages(npcId: string): DMMessage[] {
  const all = getAllDMMessages()
  return all[npcId] || []
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
  
  // 保存消息
  const allMessages = getAllDMMessages()
  if (!allMessages[npcId]) {
    allMessages[npcId] = []
  }
  allMessages[npcId].push(message)
  saveAllDMMessages(allMessages)
  
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
  
  // 保存消息
  const allMessages = getAllDMMessages()
  if (!allMessages[npcId]) {
    allMessages[npcId] = []
  }
  allMessages[npcId].push(message)
  saveAllDMMessages(allMessages)
  
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
