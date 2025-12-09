/**
 * 情侣空间工具函数
 * 使用 IndexedDB 存储，避免 localStorage 配额问题
 */

import { saveToIndexedDB, getFromIndexedDB, deleteFromIndexedDB } from './unifiedStorage'

export interface CoupleSpaceRelation {
  id: string
  userId: string
  userAvatar?: string
  characterId: string
  characterName: string
  characterAvatar?: string
  status: 'pending' | 'active' | 'rejected' | 'ended'
  sender: 'user' | 'character'  // 谁发起的邀请
  createdAt: number
  acceptedAt?: number
  endedAt?: number
}

const STORAGE_KEY = 'couple_space_relation'
const PRIVACY_KEY = 'couple_space_privacy'

// 内存缓存，避免频繁读取 IndexedDB
let cachedRelation: CoupleSpaceRelation | null | undefined = undefined

/**
 * 初始化：从 IndexedDB 加载数据到缓存，并迁移旧 localStorage 数据
 */
export const initCoupleSpaceStorage = async (): Promise<void> => {
  // 先尝试从 IndexedDB 读取
  const idbData = await getFromIndexedDB('SETTINGS', STORAGE_KEY)
  
  if (idbData) {
    cachedRelation = idbData
    console.log('💕 情侣空间数据已从 IndexedDB 加载')
  } else {
    // 尝试从 localStorage 迁移旧数据
    const localData = localStorage.getItem(STORAGE_KEY)
    if (localData) {
      try {
        const parsed = JSON.parse(localData)
        await saveToIndexedDB('SETTINGS', STORAGE_KEY, parsed)
        localStorage.removeItem(STORAGE_KEY)
        cachedRelation = parsed
        console.log('💕 情侣空间数据已从 localStorage 迁移到 IndexedDB')
      } catch {
        cachedRelation = null
      }
    } else {
      cachedRelation = null
    }
  }
}

/**
 * 获取当前情侣空间关系（同步，从缓存读取）
 */
export const getCoupleSpaceRelation = (): CoupleSpaceRelation | null => {
  if (cachedRelation === undefined) {
    // 缓存未初始化时，尝试同步读取 localStorage 作为后备
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        cachedRelation = JSON.parse(saved)
      } catch {
        cachedRelation = null
      }
    } else {
      cachedRelation = null
    }
  }
  return cachedRelation ?? null
}

/**
 * 保存情侣空间关系（异步保存到 IndexedDB）
 */
const saveCoupleSpaceRelation = async (relation: CoupleSpaceRelation | null): Promise<void> => {
  cachedRelation = relation  // 立即更新缓存
  
  if (relation) {
    await saveToIndexedDB('SETTINGS', STORAGE_KEY, relation)
  } else {
    await deleteFromIndexedDB('SETTINGS', STORAGE_KEY)
  }
  
  // 清理旧的 localStorage 数据
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 忽略错误
  }
}

/**
 * 创建情侣空间邀请
 */
export const createCoupleSpaceInvite = async (
  userId: string,
  characterId: string,
  characterName: string,
  characterAvatar?: string,
  sender: 'user' | 'character' = 'user'
): Promise<CoupleSpaceRelation | null> => {
  const existing = getCoupleSpaceRelation()
  
  // 只有 active 状态才阻止创建新邀请
  if (existing && existing.status === 'active') {
    console.log('已存在活跃的情侣空间关系', existing)
    console.log('🔍 如果这是错误数据，请在控制台运行: localStorage.removeItem("couple_space_relation") 然后刷新')
    return null
  }
  
  // pending/rejected/ended 状态都自动覆盖，允许创建新邀请
  if (existing && existing.status !== 'active') {
    console.log(`🔄 清理旧状态（${existing.status}），创建新邀请`)
  }

  // 获取用户头像
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
  const userAvatar = userInfo.avatar

  const relation: CoupleSpaceRelation = {
    id: Date.now().toString(),
    userId,
    userAvatar,
    characterId,
    characterName,
    characterAvatar,
    status: 'pending',
    sender,
    createdAt: Date.now()
  }

  await saveCoupleSpaceRelation(relation)
  console.log(`✅ 创建新邀请：${sender === 'user' ? '用户' : '角色'}向${characterName}发起情侣空间邀请`)
  return relation
}

/**
 * 接受情侣空间邀请
 */
export const acceptCoupleSpaceInvite = async (characterId: string): Promise<boolean> => {
  const relation = getCoupleSpaceRelation()
  
  if (!relation) {
    console.log('没有找到邀请')
    return false
  }

  if (relation.characterId !== characterId) {
    console.log('角色ID不匹配')
    return false
  }

  if (relation.status !== 'pending') {
    console.log('邀请状态不是pending')
    return false
  }

  relation.status = 'active'
  relation.acceptedAt = Date.now()
  await saveCoupleSpaceRelation(relation)
  
  console.log('情侣空间已激活')
  return true
}

/**
 * 拒绝情侣空间邀请
 */
export const rejectCoupleSpaceInvite = async (characterId: string): Promise<boolean> => {
  const relation = getCoupleSpaceRelation()
  
  if (!relation) {
    console.log('没有找到邀请')
    return false
  }

  if (relation.characterId !== characterId) {
    console.log('角色ID不匹配')
    return false
  }

  if (relation.status !== 'pending') {
    console.log('邀请状态不是pending')
    return false
  }

  relation.status = 'rejected'
  await saveCoupleSpaceRelation(relation)
  
  console.log('已拒绝情侣空间邀请')
  return true
}

/**
 * 取消情侣空间邀请（发送者主动取消）
 */
export const cancelCoupleSpaceInvite = async (): Promise<boolean> => {
  const relation = getCoupleSpaceRelation()
  
  if (!relation) {
    console.log('没有找到邀请')
    return false
  }

  if (relation.status !== 'pending') {
    console.log('邀请状态不是pending，无法取消')
    return false
  }

  // 清除邀请
  await saveCoupleSpaceRelation(null)
  
  console.log('✅ 已取消情侣空间邀请')
  return true
}

/**
 * 结束情侣空间关系（只清除关系，保留内容数据供下次绑定使用）
 * 支持清除任何状态的关系（active、pending、rejected）
 */
export const endCoupleSpaceRelation = async (): Promise<boolean> => {
  const relation = getCoupleSpaceRelation()

  if (!relation) {
    console.log('没有情侣空间关系')
    return false
  }

  // 只清除关系状态，保留照片、留言、纪念日等内容
  await saveCoupleSpaceRelation(null)

  console.log(`✅ 情侣空间关系已解除（原状态: ${relation.status}），内容数据已保留`)
  return true
}

/**
 * 彻底清空情侣空间（包括所有内容数据）
 */
export const clearAllCoupleSpaceData = async (): Promise<boolean> => {
  // 清理 IndexedDB 中的数据
  await saveCoupleSpaceRelation(null)
  
  // 清理 localStorage 中的旧数据（兼容）
  try {
    localStorage.removeItem('couple_space_relation')
    localStorage.removeItem('couple_photos')
    localStorage.removeItem('couple_messages')
    localStorage.removeItem('couple_anniversaries')
    localStorage.removeItem('couple_space_privacy')
  } catch {
    // 忽略错误
  }

  console.log('✅ 情侣空间所有数据已清空')
  return true
}

/**
 * 检查是否有与指定角色的活跃情侣空间
 */
export const hasActiveCoupleSpace = (characterId: string): boolean => {
  const relation = getCoupleSpaceRelation()
  return !!(relation && relation.characterId === characterId && relation.status === 'active')
}

/**
 * 检查是否有待处理的邀请
 */
export const hasPendingInvite = (characterId?: string): boolean => {
  const relation = getCoupleSpaceRelation()
  if (!relation || relation.status !== 'pending') return false
  
  if (characterId) {
    return relation.characterId === characterId
  }
  
  return true
}

/**
 * 设置情侣空间隐私模式
 */
export const setCoupleSpacePrivacy = (mode: 'public' | 'private'): void => {
  localStorage.setItem(PRIVACY_KEY, mode)
}

/**
 * 获取情侣空间隐私模式
 */
export const getCoupleSpacePrivacy = (): 'public' | 'private' => {
  const saved = localStorage.getItem(PRIVACY_KEY)
  return (saved === 'private' ? 'private' : 'public') as 'public' | 'private'
}

/**
 * 检查是否可以向某人发送情侣空间邀请
 */
export const canSendCoupleSpaceInvite = (): boolean => {
  const relation = getCoupleSpaceRelation()
  
  if (!relation) return true
  
  // 只有active状态才阻止发送邀请
  // pending状态：如果是对方发的，用户可以反向发邀请（会覆盖）
  // rejected状态：可以重新发送
  if (relation.status === 'active') {
    return false
  }
  
  return true
}

/**
 * 检查用户是否公开了情侣空间状态
 */
export const isUserCoupleSpacePublic = (): boolean => {
  const relation = getCoupleSpaceRelation()
  if (!relation || relation.status === 'ended') return false
  
  const privacy = getCoupleSpacePrivacy()
  return privacy === 'public'
}
