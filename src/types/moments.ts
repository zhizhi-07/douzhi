/**
 * 朋友圈相关类型定义
 */

export interface MomentImage {
  id: string
  url: string  // base64 或 URL
  description?: string  // 🔥 AI识别的图片描述（识别后保存，之后不再发送图片）
  recognizedAt?: number  // 识别时间戳
}

export interface MomentComment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: number  // 时间戳
  replyTo?: string   // 回复谁的用户名（如果是回复评论）
}

export interface MomentLike {
  id: string
  userId: string
  userName: string
  userAvatar: string
}

export interface Moment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  images: MomentImage[]
  likes: MomentLike[]
  comments: MomentComment[]
  location?: string
  createdAt: number  // 时间戳
  visibleTo?: string[]  // 仅谁可见（用户ID列表，为空表示公开）
  mentions?: string[]   // @提到了谁（用户ID列表）
  isDeleted?: boolean   // 是否已删除
  deletedAt?: number    // 删除时间戳
}

export interface User {
  id: string
  name: string
  avatar: string
}
