/**
 * 情侣空间工具函数
 */

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(relation))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage 配额已满，尝试清理旧数据...')
        
        // 紧急清理：删除所有消息相关的旧数据
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('chat_messages_') || key.startsWith('group_messages_') || key.startsWith('chat_settings_'))) {
            keysToRemove.push(key)
          }
        }
        
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key)
            console.log(`  🗑️ 紧急清理: ${key}`)
          } catch (err) {
            console.error(`清理失败: ${key}`, err)
          }
        })
        
        console.log(`🧹 紧急清理完成，删除了 ${keysToRemove.length} 个旧消息键`)
        
        // 重试保存
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(relation))
          console.log('✅ 重试保存成功')
        } catch (retryError) {
          console.error('❌ 重试保存仍然失败:', retryError)
          throw new Error('localStorage 空间不足，请手动清理浏览器缓存')
        }
      } else {
        throw e
      }
    }
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
  characterAvatar?: string,
  sender: 'user' | 'character' = 'user'
): CoupleSpaceRelation | null => {
  // 检查是否已有活跃的情侣空间（只有active状态才阻止）
  const existing = getCoupleSpaceRelation()
  if (existing && existing.status === 'active') {
    console.log('已存在活跃的情侣空间关系')
    return null
  }
  
  // 如果有pending状态的邀请
  if (existing && existing.status === 'pending') {
    // 如果是同一方再次发送，覆盖旧邀请
    // 如果是对方发送，也覆盖（用户可以反向发邀请）
    console.log(`覆盖旧邀请（旧: ${existing.sender}, 新: ${sender}）`)
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
