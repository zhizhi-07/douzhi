// 闲聊区消息类型
export interface ChatMessage {
  id: string
  npcId: string
  name: string
  avatar: string
  content: string
  time: number
  isMe?: boolean
  hasPrivateMsg?: boolean
  hasNewPost?: boolean
  memeUrls?: string[]
}

// 管理员类型
export interface TopicAdmin {
  id: string
  name: string
  avatar?: string
  role: string
}

// 角色类型（简化版）
export interface SimpleCharacter {
  id: string
  realName: string
  avatar?: string
  worldBook?: string
}
