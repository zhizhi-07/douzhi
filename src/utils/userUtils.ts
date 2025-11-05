/**
 * 用户信息管理工具
 */

const USER_INFO_KEY = 'user_info'

export interface UserInfo {
  nickname: string
  signature?: string
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
    nickname: '用户',
    signature: undefined
  }
}

/**
 * 保存用户信息
 */
export const saveUserInfo = (info: UserInfo): void => {
  try {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  } catch (error) {
    console.error('保存用户信息失败:', error)
  }
}
