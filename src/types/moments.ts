/**
 * 朋友圈相关类型定义
 */

export interface MomentImage {
  id: string
  url: string  // base64 或 URL
}

export interface MomentComment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: number  // 时间戳
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
}

export interface User {
  id: string
  name: string
  avatar: string
}
