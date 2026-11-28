/**
 * 面具管理系统
 * 面具只改变用户的外在身份（头像、名称、签名），不影响AI记忆
 * 
 * 与小号的区别：
 * - 小号：独立身份，AI不认识你，聊天记录独立
 * - 面具：只是换个外在身份，AI还是认识你，记忆保持
 */

import { saveMaskAvatar, getMaskAvatar, deleteMaskAvatar } from './avatarStorage'

const MASKS_KEY = 'user_masks'
const CURRENT_MASK_KEY = 'current_mask_id'

export interface Mask {
  id: string
  nickname: string      // 网名（显示名称）
  realName?: string     // 真名
  avatar?: string       // 存储为 'indexeddb:mask_xxx' 引用
  signature?: string    // 个性签名
  description?: string  // 面具描述，帮助用户区分不同面具
  persona?: string      // 用户人设（可选）
  createdAt: number
}

/**
 * 获取所有面具
 */
export const getMasks = (): Mask[] => {
  try {
    const saved = localStorage.getItem(MASKS_KEY)
    if (saved) {
      return JSON.parse(saved) as Mask[]
    }
  } catch (error) {
    console.error('读取面具列表失败:', error)
  }
  return []
}

/**
 * 获取当前面具ID（null表示使用主身份）
 */
export const getCurrentMaskId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_MASK_KEY) || null
  } catch {
    return null
  }
}

/**
 * 获取当前面具
 */
export const getCurrentMask = (): Mask | null => {
  const maskId = getCurrentMaskId()
  if (!maskId) return null
  
  const masks = getMasks()
  return masks.find(m => m.id === maskId) || null
}

/**
 * 是否使用面具
 */
export const isUsingMask = (): boolean => {
  return getCurrentMaskId() !== null
}

/**
 * 切换面具
 * @param maskId 面具ID，null表示切换回主身份
 */
export const switchMask = (maskId: string | null): void => {
  if (maskId === null) {
    localStorage.removeItem(CURRENT_MASK_KEY)
    console.log('🎭 切换回主身份')
  } else {
    const masks = getMasks()
    const mask = masks.find(m => m.id === maskId)
    if (!mask) {
      console.error('面具不存在:', maskId)
      return
    }
    localStorage.setItem(CURRENT_MASK_KEY, maskId)
    console.log('🎭 切换面具:', mask.nickname)
  }
  
  // 触发面具切换事件
  window.dispatchEvent(new CustomEvent('maskSwitched', { detail: { maskId } }))
}

/**
 * 创建面具（异步，头像存IndexedDB）
 */
export const createMask = async (data: {
  nickname: string
  realName?: string
  avatar?: string
  signature?: string
  description?: string
  persona?: string
}): Promise<Mask> => {
  const masks = getMasks()
  
  const maskId = `mask_${Date.now()}`
  
  // 如果有头像，保存到IndexedDB
  if (data.avatar && data.avatar.startsWith('data:')) {
    (await saveMaskAvatar(maskId, data.avatar)) || (() => { throw new Error('头像保存失败，资料未更新') })()
  }
  
  const newMask: Mask = {
    id: maskId,
    nickname: data.nickname,
    realName: data.realName,
    avatar: data.avatar ? `indexeddb:mask_${maskId}` : undefined,
    signature: data.signature,
    description: data.description,
    persona: data.persona,
    createdAt: Date.now()
  }
  
  masks.push(newMask)
  localStorage.setItem(MASKS_KEY, JSON.stringify(masks))
  
  console.log('[Mask] 创建面具:', data.nickname)
  return newMask
}

/**
 * 更新面具信息（异步）
 */
export const updateMask = async (maskId: string, updates: Partial<Mask>): Promise<void> => {
  const masks = getMasks()
  const index = masks.findIndex(m => m.id === maskId)
  if (index === -1) return
  
  // 如果更新头像，保存到IndexedDB
  if (updates.avatar && updates.avatar.startsWith('data:')) {
    (await saveMaskAvatar(maskId, updates.avatar)) || (() => { throw new Error('头像保存失败，资料未更新') })()
    updates.avatar = `indexeddb:mask_${maskId}`
  }
  
  masks[index] = { ...masks[index], ...updates }
  localStorage.setItem(MASKS_KEY, JSON.stringify(masks))
  
  // 触发事件通知UI更新
  window.dispatchEvent(new CustomEvent('maskUpdated', { detail: { maskId } }))
}

/**
 * 删除面具
 */
export const deleteMask = async (maskId: string): Promise<void> => {
  // 如果正在使用该面具，先切换回主身份
  if (getCurrentMaskId() === maskId) {
    switchMask(null)
  }
  
  const masks = getMasks()
  const filtered = masks.filter(m => m.id !== maskId)
  localStorage.setItem(MASKS_KEY, JSON.stringify(filtered))
  
  // 删除IndexedDB中的头像
  await deleteMaskAvatar(maskId)
  
  console.log('[Mask] 删除面具:', maskId)
}

/**
 * 获取面具列表（带头像，异步）
 */
export const getMasksWithAvatars = async (): Promise<Mask[]> => {
  const masks = getMasks()
  
  const masksWithAvatars = await Promise.all(
    masks.map(async (mask) => {
      if (mask.avatar?.startsWith('indexeddb:mask_')) {
        const avatar = await getMaskAvatar(mask.id)
        return { ...mask, avatar: avatar || undefined }
      }
      return mask
    })
  )
  
  return masksWithAvatars
}
