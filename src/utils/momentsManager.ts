/**
 * 朋友圈数据管理器
 * 类似 simpleMessageManager，统一管理朋友圈数据
 */

import type { Moment, MomentImage, User } from '../types/moments'

const MOMENTS_KEY = 'moments'
const MAX_MOMENTS = 100  // 最多保存100条朋友圈

/**
 * 加载朋友圈列表
 */
export function loadMoments(): Moment[] {
  try {
    const saved = localStorage.getItem(MOMENTS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载朋友圈失败:', error)
  }
  return []
}

/**
 * 保存朋友圈列表
 */
export function saveMoments(moments: Moment[]): void {
  try {
    // 只保存最近的朋友圈
    let momentsToSave = moments.slice(0, MAX_MOMENTS)
    
    // 压缩数据
    let compressed = momentsToSave.map(moment => ({
      ...moment,
      comments: moment.comments.slice(-50),  // 最多50条评论
      likes: moment.likes.slice(-100)  // 最多100个点赞
    }))
    
    try {
      localStorage.setItem(MOMENTS_KEY, JSON.stringify(compressed))
    } catch (quotaError) {
      // 如果空间不足，尝试更激进的清理
      if (quotaError instanceof Error && quotaError.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage空间不足，开始清理旧数据...')
        
        // 第一次清理：只保留最近50条
        momentsToSave = moments.slice(0, 50)
        compressed = momentsToSave.map(moment => ({
          ...moment,
          comments: moment.comments.slice(-30),  // 最多30条评论
          likes: moment.likes.slice(-50)  // 最多50个点赞
        }))
        
        try {
          localStorage.setItem(MOMENTS_KEY, JSON.stringify(compressed))
          console.log('✅ 清理后保存成功，保留了50条朋友圈')
        } catch (secondError) {
          // 第二次清理：只保留最近20条
          console.warn('⚠️ 仍然空间不足，进行更激进的清理...')
          momentsToSave = moments.slice(0, 20)
          compressed = momentsToSave.map(moment => ({
            ...moment,
            comments: moment.comments.slice(-10),  // 最多10条评论
            likes: moment.likes.slice(-20)  // 最多20个点赞
          }))
          
          localStorage.setItem(MOMENTS_KEY, JSON.stringify(compressed))
          console.log('✅ 激进清理后保存成功，保留了20条朋友圈')
        }
      } else {
        throw quotaError
      }
    }
  } catch (error) {
    console.error('保存朋友圈失败:', error)
  }
}

/**
 * 发布朋友圈
 */
export function publishMoment(
  user: User,
  content: string,
  images: MomentImage[] = [],
  location?: string
): Moment {
  const newMoment: Moment = {
    id: Date.now().toString(),
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content,
    images,
    likes: [],
    comments: [],
    location,
    createdAt: Date.now()
  }
  
  const moments = loadMoments()
  moments.unshift(newMoment)  // 添加到开头
  saveMoments(moments)
  
  console.log('📱 发布朋友圈:', content.substring(0, 20))
  return newMoment
}

/**
 * 删除朋友圈
 */
export function deleteMoment(momentId: string): void {
  const moments = loadMoments()
  const filtered = moments.filter(m => m.id !== momentId)
  saveMoments(filtered)
  console.log('🗑️ 删除朋友圈:', momentId)
}

/**
 * 点赞朋友圈
 */
export function likeMoment(momentId: string, user: User): void {
  const moments = loadMoments()
  const updated = moments.map(moment => {
    if (moment.id === momentId) {
      // 检查是否已点赞
      const hasLiked = moment.likes.some(like => like.userId === user.id)
      if (hasLiked) {
        return moment
      }
      
      return {
        ...moment,
        likes: [
          ...moment.likes,
          {
            id: `${Date.now()}-${user.id}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar
          }
        ]
      }
    }
    return moment
  })
  
  saveMoments(updated)
  console.log('👍 点赞朋友圈:', momentId)
  
  // 触发更新事件
  window.dispatchEvent(new CustomEvent('moments-updated'))
}

/**
 * 取消点赞
 */
export function unlikeMoment(momentId: string, userId: string): void {
  const moments = loadMoments()
  const updated = moments.map(moment => {
    if (moment.id === momentId) {
      return {
        ...moment,
        likes: moment.likes.filter(like => like.userId !== userId)
      }
    }
    return moment
  })
  
  saveMoments(updated)
  console.log('👎 取消点赞:', momentId)
}

/**
 * 评论朋友圈
 */
export function commentMoment(
  momentId: string,
  user: User,
  content: string
): void {
  const moments = loadMoments()
  const updated = moments.map(moment => {
    if (moment.id === momentId) {
      return {
        ...moment,
        comments: [
          ...moment.comments,
          {
            id: `${Date.now()}-${user.id}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            content,
            createdAt: Date.now()
          }
        ]
      }
    }
    return moment
  })
  
  saveMoments(updated)
  console.log('💬 评论朋友圈:', content.substring(0, 20))
  
  // 触发更新事件
  window.dispatchEvent(new CustomEvent('moments-updated'))
}

/**
 * 删除评论
 */
export function deleteComment(momentId: string, commentId: string): void {
  const moments = loadMoments()
  const updated = moments.map(moment => {
    if (moment.id === momentId) {
      return {
        ...moment,
        comments: moment.comments.filter(c => c.id !== commentId)
      }
    }
    return moment
  })
  
  saveMoments(updated)
  console.log('🗑️ 删除评论:', commentId)
}

/**
 * 获取单条朋友圈
 */
export function getMoment(momentId: string): Moment | null {
  const moments = loadMoments()
  return moments.find(m => m.id === momentId) || null
}

/**
 * 获取用户发布的朋友圈
 */
export function getUserMoments(userId: string): Moment[] {
  const moments = loadMoments()
  return moments.filter(m => m.userId === userId)
}
