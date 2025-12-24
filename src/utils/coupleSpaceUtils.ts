/**
 * 情侣空间工具函数
 * 使用 IndexedDB 存储，避免 localStorage 配额问题
 */

import { saveToIndexedDB, getFromIndexedDB, deleteFromIndexedDB } from './unifiedStorage'

// 家庭成员接口
export interface FamilyMember {
  characterId: string
  characterName: string
  characterAvatar?: string
  joinedAt: number
  role?: string  // 可选的角色标签，如 "恋人"、"闺蜜"、"兄弟" 等
}

export interface CoupleSpaceRelation {
  id: string
  userId: string
  userAvatar?: string
  // 兼容旧数据的单人字段
  characterId: string
  characterName: string
  characterAvatar?: string
  // 新增：多成员支持
  members?: FamilyMember[]
  status: 'pending' | 'active' | 'rejected' | 'ended'
  sender: 'user' | 'character'  // 谁发起的邀请
  createdAt: number
  acceptedAt?: number
  endedAt?: number
}

const STORAGE_KEY = 'couple_space_relation'
const PRIVACY_KEY = 'couple_space_privacy'
const MODE_KEY = 'couple_space_mode'

// 情侣空间模式
export type CoupleSpaceMode = 'independent' | 'shared'
// independent: 独立模式 - 每个AI和用户各自独立的情侣空间
// shared: 公共模式 - 所有AI共享一个情侣空间，内容互相可见

// 内存缓存，避免频繁读取 IndexedDB
let cachedRelation: CoupleSpaceRelation | null | undefined = undefined
let cachedMode: CoupleSpaceMode = 'independent'  // 默认独立模式

/**
 * 初始化：从 IndexedDB 加载数据到缓存，并迁移旧 localStorage 数据
 */
export const initCoupleSpaceStorage = async (): Promise<void> => {
  // 加载模式设置
  await initCoupleSpaceMode()
  
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

/**
 * 获取所有家庭成员（兼容旧数据）
 */
export const getFamilyMembers = (): FamilyMember[] => {
  const relation = getCoupleSpaceRelation()
  if (!relation || relation.status !== 'active') return []
  
  // 如果有 members 数组，直接返回
  if (relation.members && relation.members.length > 0) {
    return relation.members
  }
  
  // 兼容旧数据：将单个角色转换为成员数组
  return [{
    characterId: relation.characterId,
    characterName: relation.characterName,
    characterAvatar: relation.characterAvatar,
    joinedAt: relation.acceptedAt || relation.createdAt
  }]
}

/**
 * 添加新成员到情侣空间
 */
export const addFamilyMember = async (
  characterId: string,
  characterName: string,
  characterAvatar?: string,
  role?: string
): Promise<boolean> => {
  const relation = getCoupleSpaceRelation()
  
  if (!relation || relation.status !== 'active') {
    console.log('没有活跃的情侣空间')
    return false
  }
  
  // 检查是否已存在
  const members = getFamilyMembers()
  if (members.some(m => m.characterId === characterId)) {
    console.log('该成员已在情侣空间中')
    return false
  }
  
  // 添加新成员
  const newMember: FamilyMember = {
    characterId,
    characterName,
    characterAvatar,
    joinedAt: Date.now(),
    role
  }
  
  // 更新 relation
  if (!relation.members) {
    // 迁移旧数据：将原来的单人也加入 members
    relation.members = [{
      characterId: relation.characterId,
      characterName: relation.characterName,
      characterAvatar: relation.characterAvatar,
      joinedAt: relation.acceptedAt || relation.createdAt
    }]
  }
  
  relation.members.push(newMember)
  await saveCoupleSpaceRelation(relation)
  
  console.log(`✅ ${characterName} 已加入情侣空间`)
  return true
}

/**
 * 从情侣空间移除成员
 */
export const removeFamilyMember = async (characterId: string): Promise<boolean> => {
  const relation = getCoupleSpaceRelation()
  
  if (!relation || relation.status !== 'active') {
    console.log('没有活跃的情侣空间')
    return false
  }
  
  if (!relation.members || relation.members.length === 0) {
    // 旧数据格式，只有一个成员
    if (relation.characterId === characterId) {
      // 移除唯一成员等于解散空间
      await saveCoupleSpaceRelation(null)
      console.log('✅ 情侣空间已解散')
      return true
    }
    return false
  }
  
  const memberIndex = relation.members.findIndex(m => m.characterId === characterId)
  if (memberIndex === -1) {
    console.log('该成员不在情侣空间中')
    return false
  }
  
  relation.members.splice(memberIndex, 1)
  
  // 如果没有成员了，解散空间
  if (relation.members.length === 0) {
    await saveCoupleSpaceRelation(null)
    console.log('✅ 情侣空间已解散（无成员）')
    return true
  }
  
  // 更新主要成员信息（用于兼容旧代码）
  const firstMember = relation.members[0]
  relation.characterId = firstMember.characterId
  relation.characterName = firstMember.characterName
  relation.characterAvatar = firstMember.characterAvatar
  
  await saveCoupleSpaceRelation(relation)
  console.log(`✅ 已从情侣空间移除成员`)
  return true
}

/**
 * 检查某角色是否在情侣空间中
 */
export const isMemberInFamily = (characterId: string): boolean => {
  const members = getFamilyMembers()
  return members.some(m => m.characterId === characterId)
}

/**
 * 获取情侣空间模式
 */
export const getCoupleSpaceMode = (): CoupleSpaceMode => {
  return cachedMode
}

/**
 * 设置情侣空间模式（只能设置一次）
 */
export const setCoupleSpaceMode = async (mode: CoupleSpaceMode): Promise<boolean> => {
  // 检查是否已经设置过模式
  const existing = await getFromIndexedDB('SETTINGS', MODE_KEY)
  if (existing) {
    console.log('⚠️ 情侣空间模式已经设置过，不能更改')
    return false
  }
  
  cachedMode = mode
  await saveToIndexedDB('SETTINGS', MODE_KEY, mode)
  console.log(`💕 情侣空间模式已设置为: ${mode === 'independent' ? '独立模式' : '公共模式'}`)
  return true
}

/**
 * 检查模式是否已经设置过
 */
export const isCoupleSpaceModeSet = async (): Promise<boolean> => {
  const existing = await getFromIndexedDB('SETTINGS', MODE_KEY)
  return !!existing
}

/**
 * 初始化时加载模式设置
 */
export const initCoupleSpaceMode = async (): Promise<void> => {
  const savedMode = await getFromIndexedDB('SETTINGS', MODE_KEY)
  if (savedMode === 'independent' || savedMode === 'shared') {
    cachedMode = savedMode
  }
}
