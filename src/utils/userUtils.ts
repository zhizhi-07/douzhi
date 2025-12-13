/**
 * 用户信息管理工具
 */

import { trackNicknameChange, trackSignatureChange, trackAvatarChange } from './userInfoChangeTracker'
import { getUserAvatar, getAccountAvatar } from './avatarStorage'
import { isMainAccount, getCurrentAccount } from './accountManager'

const USER_INFO_KEY = 'user_info'

export interface UserInfo {
  nickname: string  // 网名/昵称
  realName: string  // 真实姓名（必填）
  signature?: string  // 个性签名
  avatar?: string  // 头像（图片base64或URL）
  persona?: string  // 用户人设（影响AI对用户的态度）
  pokeSuffix?: string  // 拍一拍后缀（如："的小脑袋"）
  isPublicFigure?: boolean  // 是否是公众人物
  publicPersona?: string  // 公众形象/社会印象（公众人物专用）
  allowAvatarRecognition?: boolean  // 是否允许AI识别头像（默认关闭）
}

/**
 * 获取用户信息（同步，不含头像数据）
 */
export const getUserInfo = (): UserInfo => {
  try {
    const saved = localStorage.getItem(USER_INFO_KEY)
    if (saved) {
      const info = JSON.parse(saved)
      // 如果是 IndexedDB 标记，清除它（实际数据需要异步获取）
      if (info.avatar === 'indexeddb://user_avatar') {
        info.avatar = undefined
      }
      return info
    }
  } catch (error) {
    console.error('读取用户信息失败:', error)
  }
  
  // 默认用户信息
  return {
    nickname: '',  // 默认为空，会自动使用realName
    realName: '用户',
    signature: undefined
  }
}

/**
 * 获取用户信息（异步，包含头像数据）
 */
export const getUserInfoWithAvatar = async (): Promise<UserInfo> => {
  const info = getUserInfo()
  
  // 🔥 首先检查 localStorage 是否有直接存储的头像（base64）
  try {
    const saved = localStorage.getItem(USER_INFO_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 如果 localStorage 里直接存的是 base64 头像，直接用
      if (parsed.avatar && parsed.avatar.startsWith('data:')) {
        info.avatar = parsed.avatar
        console.log('✅ [用户头像] 从 localStorage 直接读取 base64')
        return info
      }
      // 记录是否有标记
      if (parsed.avatar === 'indexeddb://user_avatar') {
        console.log('📌 [用户头像] localStorage 有 IndexedDB 标记，尝试从 IndexedDB 加载')
      }
    }
  } catch (e) {
    console.error('读取 localStorage 头像失败:', e)
  }
  
  // 从 IndexedDB 加载头像
  try {
    const avatar = await getUserAvatar()
    if (avatar) {
      info.avatar = avatar
      console.log('✅ [用户头像] 从 IndexedDB 读取成功，长度:', avatar.length)
    } else {
      console.log('⚠️ [用户头像] IndexedDB 中无头像')
    }
  } catch (error) {
    console.error('从 IndexedDB 加载头像失败:', error)
  }
  
  return info
}

/**
 * 检查用户是否有头像
 */
export const hasUserAvatar = (): boolean => {
  try {
    const saved = localStorage.getItem(USER_INFO_KEY)
    if (saved) {
      const info = JSON.parse(saved)
      return info.avatar === 'indexeddb://user_avatar' || (info.avatar && info.avatar.startsWith('data:'))
    }
  } catch (error) {
    console.error('检查用户头像失败:', error)
  }
  return false
}

/**
 * 获取当前账号的用户名（同步，考虑小号）
 * 拍一拍等需要同步获取用户名的场景使用
 */
export const getCurrentUserName = (): string => {
  if (isMainAccount()) {
    const userInfo = getUserInfo()
    return userInfo.nickname || userInfo.realName || '用户'
  }
  
  const account = getCurrentAccount()
  if (account) {
    return account.name || '用户'
  }
  
  const userInfo = getUserInfo()
  return userInfo.nickname || userInfo.realName || '用户'
}

/**
 * 获取当前账号的用户信息（考虑小号）
 * 如果是主账号，返回主账号信息
 * 如果是小号，返回小号的名称和头像
 */
export const getCurrentUserInfoWithAvatar = async (): Promise<UserInfo> => {
  // 检查是否是主账号
  if (isMainAccount()) {
    return getUserInfoWithAvatar()
  }
  
  // 小号：获取小号的信息
  const account = getCurrentAccount()
  if (!account) {
    return getUserInfoWithAvatar()
  }
  
  // 加载小号头像
  let avatar: string | undefined
  if (account.avatar?.startsWith('indexeddb:account_')) {
    avatar = await getAccountAvatar(account.id) || undefined
  } else if (account.avatar?.startsWith('data:')) {
    avatar = account.avatar
  }
  
  // 返回小号信息，但保留主账号的其他设置（如人设等）
  const mainInfo = getUserInfo()
  return {
    ...mainInfo,
    nickname: account.name,
    realName: account.name,
    signature: account.signature,
    avatar: avatar
  }
}

/**
 * 保存用户信息
 */
export const saveUserInfo = (info: UserInfo): void => {
  try {
    // 🔥 先读取旧信息，用于比较变更
    const oldInfo = getUserInfo()
    
    // 🔥 保存前先追踪变更（只追踪网名和签名，不追踪真实名字）
    
    // 只追踪网名变更（且确实发生了变更）
    if (info.nickname && info.nickname !== oldInfo.nickname) {
      trackNicknameChange(info.nickname)
    }

    // 只追踪签名变更（且确实发生了变更）
    if (info.signature !== undefined && info.signature !== oldInfo.signature) {
      trackSignatureChange(info.signature)
    }

    // 🔥 修复：只有头像真的变了才追踪，避免只改人设时误报
    // 不在这里追踪头像变更，改为在 UserProfile.tsx 中手动追踪
    // 因为头像是base64，每次都比较会很慢

    // 真实名字不追踪，AI不需要知道用户改了真名

    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  } catch (error) {
    console.error('保存用户信息失败:', error)
  }
}
