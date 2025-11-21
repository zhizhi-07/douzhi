/**
 * 朋友圈数据管理器
 * 类似 simpleMessageManager，统一管理朋友圈数据
 */

import type { Moment, MomentImage, User } from '../types/moments'
import * as IDB from './indexedDBManager'

// 内存缓存
let momentsCache: Moment[] | null = null

/**
 * 预加载朋友圈到缓存
 */
async function preloadMoments() {
  try {
    const moments = await IDB.getItem<Moment[]>(IDB.STORES.MOMENTS, 'moments')
    momentsCache = moments || []
    console.log(`📷 预加载朋友圈: ${momentsCache.length} 条`)
  } catch (error) {
    console.error('预加载朋友圈失败:', error)
    momentsCache = []
  }
}

// 启动时预加载
preloadMoments()

/**
 * 加载所有朋友圈（同步，从缓存读取）
 */
export function loadMoments(): Moment[] {
  try {
    // 如果缓存为空，异步加载
    if (!momentsCache) {
      IDB.getItem<Moment[]>(IDB.STORES.MOMENTS, 'moments').then(moments => {
        momentsCache = moments || []
      })
      return []
    }
    return momentsCache
  } catch (error) {
    console.error('加载朋友圈失败:', error)
    return []
  }
}

/**
 * 保存朋友圈（同步更新缓存，异步保存到IndexedDB）
 */
export function saveMoments(moments: Moment[]): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 立即更新缓存
      momentsCache = moments
      
      // 异步保存到IndexedDB
      IDB.setItem(IDB.STORES.MOMENTS, 'moments', moments).then(() => {
        console.log(`💾 保存朋友圈到IndexedDB: ${moments.length} 条`)
        
        // 🔥 触发更新事件，让页面实时刷新
        window.dispatchEvent(new CustomEvent('moments-updated'))
        window.dispatchEvent(new Event('storage'))
        
        resolve()
      }).catch(err => {
        console.error('❌ IndexedDB保存失败:', err)
        
        // 检查是否是存储空间不足
        if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
          const errorMsg = '存储空间不足！请删除一些旧朋友圈或清理浏览器数据。'
          console.error('🚨', errorMsg)
          alert(errorMsg)
          reject(new Error(errorMsg))
        } else {
          const errorMsg = '保存朋友圈失败，请重试'
          console.error('🚨', errorMsg, err)
          alert(errorMsg)
          reject(err)
        }
      })
    } catch (error) {
      console.error('❌ 保存朋友圈失败:', error)
      reject(error)
    }
  })
}

/**
 * 发布朋友圈
 */
export async function publishMoment(
  user: User,
  content: string,
  images: MomentImage[] = [],
  location?: string,
  mentions?: string[]
): Promise<Moment> {
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
    createdAt: Date.now(),
    mentions
  }
  
  console.log('📱 准备发布朋友圈:', content.substring(0, 20) || '[纯图片]')
  console.log('📱 完整朋友圈对象:', newMoment)
  
  const moments = loadMoments()
  moments.unshift(newMoment)  // 添加到开头
  
  try {
    await saveMoments(moments)
    console.log('✅ 朋友圈发布成功')
    return newMoment
  } catch (error) {
    console.error('❌ 朋友圈发布失败:', error)
    // 恢复缓存（移除刚添加的朋友圈）
    momentsCache = loadMoments().filter(m => m.id !== newMoment.id)
    throw error
  }
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
