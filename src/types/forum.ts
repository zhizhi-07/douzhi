// 论坛帖子类型定义
export interface ForumPost {
  id: string
  author: string
  authorAvatar?: string
  time: string
  title: string
  content: string
  tags: string[]
  images?: string[]
  views: number
  replies: number
  likes: number
  isHighlight?: boolean
  isHot?: boolean
  category?: string
  createdAt: number
  updatedAt: number
}

// 评论类型定义
export interface ForumComment {
  id: string
  postId: string
  author: string
  authorAvatar?: string
  time: string
  content: string
  likes: number
  replyTo?: string
  parentId?: string
  replies?: ForumComment[]
  createdAt: number
}

// 话题类型定义
export interface ForumTopic {
  id: string
  name: string
  description?: string
  postCount: number
  hot?: boolean
  createdAt: number
}

// 帖子分类
export type PostCategory = '推荐' | '主页' | '话题' | '通知'

// 私信消息类型
export interface ForumMessage {
  id: string
  fromUser: string
  fromAvatar?: string
  toUser: string
  content: string
  time: string
  read: boolean
  createdAt: number
}

// 会话类型
export interface ForumConversation {
  id: string
  user: string
  userAvatar?: string
  lastMessage: string
  lastTime: string
  unreadCount: number
  isNPC?: boolean
  characterId?: string
  updatedAt: number
}
