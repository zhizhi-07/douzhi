/**
 * 情侣空间工具函数
 */

export interface CoupleSpaceRelation {
  id: string
  userId: string
  characterId: string
  characterName: string
  characterAvatar?: string
  status: 'pending' | 'active' | 'rejected' | 'ended'
  createdAt: number
  acceptedAt?: number
  endedAt?: number
}

const STORAGE_KEY = 'couple_space_relation'
const PRIVACY_KEY = 'couple_space_privacy'

/**
 * 获取当前情侣空间关系
 */
export const getCoupleSpaceRelation = (): CoupleSpaceRelation | null => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

/**
 * 保存情侣空间关系
 */
const saveCoupleSpaceRelation = (relation: CoupleSpaceRelation | null): void => {
  if (relation) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(relation))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * 创建情侣空间邀请
 */
export const createCoupleSpaceInvite = (
  userId: string,
  characterId: string,
  characterName: string,
  characterAvatar?: string
): CoupleSpaceRelation | null => {
  // 检查是否已有活跃的情侣空间
  const existing = getCoupleSpaceRelation()
  if (existing && (existing.status === 'pending' || existing.status === 'active')) {
    console.log('已存在活跃的情侣空间关系')
    return null
  }

  const relation: CoupleSpaceRelation = {
    id: Date.now().toString(),
    userId,
    characterId,
    characterName,
    characterAvatar,
    status: 'pending',
    createdAt: Date.now()
  }

  saveCoupleSpaceRelation(relation)
  return relation
}

/**
 * 接受情侣空间邀请
 */
export const acceptCoupleSpaceInvite = (characterId: string): boolean => {
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
  saveCoupleSpaceRelation(relation)
  
  console.log('情侣空间已激活')
  return true
}

/**
 * 拒绝情侣空间邀请
 */
export const rejectCoupleSpaceInvite = (characterId: string): boolean => {
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
  saveCoupleSpaceRelation(relation)
  
  console.log('已拒绝情侣空间邀请')
  return true
}

/**
 * 取消情侣空间邀请（发送者主动取消）
 */
export const cancelCoupleSpaceInvite = (): boolean => {
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
  localStorage.removeItem(STORAGE_KEY)
  
  console.log('✅ 已取消情侣空间邀请')
  return true
}

/**
 * 结束情侣空间关系（只清除关系，保留内容数据供下次绑定使用）
 */
export const endCoupleSpaceRelation = (): boolean => {
  const relation = getCoupleSpaceRelation()

  if (!relation || relation.status !== 'active') {
    console.log('没有活跃的情侣空间')
    return false
  }

  // 只清除关系状态，保留照片、留言、纪念日等内容
  localStorage.removeItem('couple_space_relation')

  console.log('✅ 情侣空间关系已解除，内容数据已保留')
  return true
}

/**
 * 彻底清空情侣空间（包括所有内容数据）
 */
export const clearAllCoupleSpaceData = (): boolean => {
  // 清理所有情侣空间相关数据
  localStorage.removeItem('couple_space_relation')
  localStorage.removeItem('couple_photos')
  localStorage.removeItem('couple_messages')
  localStorage.removeItem('couple_anniversaries')
  localStorage.removeItem('couple_space_privacy')

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
  
  if (relation.status === 'pending' || relation.status === 'active' || relation.status === 'rejected') {
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
