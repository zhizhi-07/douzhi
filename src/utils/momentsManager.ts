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
    const moments = await IDB.getItem<Moment[]>(IDB.STORES.MOMENTS, 'moments', true)
    momentsCache = moments || []
    console.log(`📷 预加载朋友圈: ${momentsCache.length} 条`)
  } catch (error) {
    console.error('预加载朋友圈失败:', error)
    throw error
  }
}

// 启动时预加载
const momentsReady = preloadMoments()
void momentsReady.catch(() => {})

/**
 * 加载所有朋友圈（同步，从缓存读取）
 */
export function loadMoments(): Moment[] {
  try {
    if (!momentsCache) return []
    return momentsCache
  } catch (error) {
    console.error('加载朋友圈失败:', error)
    return []
  }
}

/**
 * 保存朋友圈（同步更新缓存，异步保存到IndexedDB）
 */
export async function ensureMomentsLoaded(): Promise<Moment[]> {
  await momentsReady
  return momentsCache || []
}

export async function updateMoments(update: (current: Moment[]) => Moment[]): Promise<Moment[]> {
  await momentsReady
  const saved = await IDB.updateItem<Moment[]>(IDB.STORES.MOMENTS, 'moments', current => update(current || []))
  momentsCache = saved
  window.dispatchEvent(new CustomEvent('moments-updated'))
  window.dispatchEvent(new Event('storage'))
  return saved
}

export async function saveMoments(moments: Moment[]): Promise<void> {
  await updateMoments(() => structuredClone(moments))
}

/**
 * 发布朋友圈
 */
export async function publishMoment(
  user: User,
  content: string,
  images: MomentImage[] = [],
  location?: string,
  mentions?: string[],
  privacy: 'public' | 'private' | 'selected' | 'group' = 'public',
  visibleTo?: string[],
  groupId?: string
): Promise<Moment> {
  const newMoment: Moment = {
    id: crypto.randomUUID(),
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content,
    images,
    likes: [],
    comments: [],
    location,
    createdAt: Date.now(),
    mentions,
    privacy,
    visibleTo: privacy === 'selected' ? visibleTo : (privacy === 'group' && groupId ? visibleTo : undefined),
    groupId: privacy === 'group' ? groupId : undefined
  }
  
  console.log('📱 准备发布朋友圈:', content.substring(0, 20) || '[纯图片]')
  console.log('📱 完整朋友圈对象:', newMoment)
  
  await updateMoments(current => [newMoment, ...current])
  return newMoment
}

/**
 * 删除朋友圈
 */
export async function deleteMoment(momentId: string): Promise<void> {
  await updateMoments(current => current.filter(m => m.id !== momentId))
}

/**
 * 点赞朋友圈
 */
export async function likeMoment(momentId: string, user: User): Promise<void> {
  await updateMoments(moments => moments.map(moment => {
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
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar
          }
        ]
      }
    }
    return moment
  }))
  console.log('👍 点赞朋友圈:', momentId)
  
  // 触发更新事件
  window.dispatchEvent(new CustomEvent('moments-updated'))
}

/**
 * 取消点赞
 */
export async function unlikeMoment(momentId: string, userId: string): Promise<void> {
  await updateMoments(moments => moments.map(moment => {
    if (moment.id === momentId) {
      return {
        ...moment,
        likes: moment.likes.filter(like => like.userId !== userId)
      }
    }
    return moment
  }))
  console.log('👎 取消点赞:', momentId)
}

/**
 * 评论朋友圈
 */
export async function commentMoment(
  momentId: string,
  user: User,
  content: string,
  replyTo?: string  // 回复谁
): Promise<void> {
  let updatedMoment: Moment | null = null
  
  await updateMoments(moments => moments.map(moment => {
    if (moment.id === momentId) {
      const newMoment = {
        ...moment,
        comments: [
          ...moment.comments,
          {
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            content,
            createdAt: Date.now(),
            replyTo  // 回复谁
          }
        ]
      }
      updatedMoment = newMoment
      return newMoment
    }
    return moment
  }))
  console.log('💬 评论朋友圈:', content.substring(0, 20))
  
  // 触发更新事件
  window.dispatchEvent(new CustomEvent('moments-updated'))
  
  // 🔥 如果是用户评论，触发AI导演重新编排互动
  if (user.id === 'user' && updatedMoment) {
    console.log('🎬 用户发表评论，触发AI导演重新编排互动...')
    
    // 动态导入，避免循环依赖
    const { triggerAIMomentsInteraction } = await import('./momentsAI/director')
    
    // 延迟一下，让评论先显示出来
    setTimeout(() => {
      triggerAIMomentsInteraction(updatedMoment!)
    }, 500)
  }
}

/**
 * 删除评论
 */
export async function deleteComment(momentId: string, commentId: string): Promise<void> {
  await updateMoments(moments => moments.map(moment => moment.id === momentId
    ? { ...moment, comments: moment.comments.filter(c => c.id !== commentId) } : moment))
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

/**
 * 🔥 更新朋友圈图片的AI识别描述
 * @param momentId 朋友圈ID
 * @param imageId 图片ID
 * @param description AI识别的描述
 */
export async function updateMomentImageDescription(momentId: string, imageId: string, description: string): Promise<boolean> {
  return (await updateMomentImageDescriptions([{ momentId, imageId, description }])) > 0
}

export async function updateMomentImageDescriptions(updates: Array<{ momentId: string; imageId: string; description: string }>): Promise<number> {
  let count = 0
  await updateMoments(moments => moments.map(moment => ({ ...moment, images: moment.images?.map(image => {
    const update = updates.find(u => u.momentId === moment.id && u.imageId === image.id)
    if (!update || image.description) return image
    count++
    return { ...image, description: update.description, recognizedAt: Date.now() }
  }) })))
  return count
}
