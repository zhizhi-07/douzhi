/**
 * 用户信息管理工具
 */

import { trackNicknameChange, trackSignatureChange, trackAvatarChange } from './userInfoChangeTracker'

const USER_INFO_KEY = 'user_info'

export interface UserInfo {
  nickname: string  // 网名/昵称
  realName: string  // 真实姓名（必填）
  signature?: string  // 个性签名
  avatar?: string  // 头像（图片base64或URL）
}

/**
 * 获取用户信息
 */
export const getUserInfo = (): UserInfo => {
  try {
    const saved = localStorage.getItem(USER_INFO_KEY)
    if (saved) {
      return JSON.parse(saved)
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
 * 保存用户信息
 */
export const saveUserInfo = (info: UserInfo): void => {
  try {
    // 🔥 保存前先追踪变更（只追踪网名和签名，不追踪真实名字）
    
    // 只追踪网名变更
    if (info.nickname) {
      trackNicknameChange(info.nickname)
    }

    // 只追踪签名变更
    if (info.signature !== undefined) {  // 允许空字符串
      trackSignatureChange(info.signature)
    }

    // 只追踪头像变更
    if (info.avatar) {
      trackAvatarChange(info.avatar)
    }

    // 真实名字不追踪，AI不需要知道用户改了真名

    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  } catch (error) {
    console.error('保存用户信息失败:', error)
  }
}
