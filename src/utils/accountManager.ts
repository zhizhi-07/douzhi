/**
 * 账号管理系统
 * 支持主账号和小号切换
 * 
 * 核心逻辑：
 * - 主账号：保留与AI角色的所有记忆和聊天记录
 * - 小号：AI不认识这个人，聊天记录独立存储
 */

import { getUserInfo, getUserInfoWithAvatar } from './userUtils'

const ACCOUNTS_KEY = 'user_accounts'
const CURRENT_ACCOUNT_KEY = 'current_account_id'
const MAIN_ACCOUNT_ID = 'main'

export interface Account {
  id: string
  name: string
  avatar?: string
  signature?: string
  isMain: boolean
  createdAt: number
}

export interface AccountsData {
  accounts: Account[]
  currentAccountId: string
}

/**
 * 获取所有账号
 */
export const getAccounts = (): Account[] => {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY)
    if (saved) {
      const data = JSON.parse(saved) as Account[]
      // 确保主账号存在
      if (!data.find(a => a.id === MAIN_ACCOUNT_ID)) {
        const mainInfo = getUserInfo()
        data.unshift({
          id: MAIN_ACCOUNT_ID,
          name: mainInfo.nickname || mainInfo.realName || '主账号',
          avatar: mainInfo.avatar,
          signature: mainInfo.signature,
          isMain: true,
          createdAt: Date.now()
        })
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(data))
      }
      return data
    }
  } catch (error) {
    console.error('读取账号列表失败:', error)
  }
  
  // 默认只有主账号
  const mainInfo = getUserInfo()
  const defaultAccounts: Account[] = [{
    id: MAIN_ACCOUNT_ID,
    name: mainInfo.nickname || mainInfo.realName || '主账号',
    avatar: mainInfo.avatar,
    signature: mainInfo.signature,
    isMain: true,
    createdAt: Date.now()
  }]
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaultAccounts))
  return defaultAccounts
}

/**
 * 获取当前账号ID
 */
export const getCurrentAccountId = (): string => {
  try {
    return localStorage.getItem(CURRENT_ACCOUNT_KEY) || MAIN_ACCOUNT_ID
  } catch {
    return MAIN_ACCOUNT_ID
  }
}

/**
 * 获取当前账号
 */
export const getCurrentAccount = (): Account | undefined => {
  const accounts = getAccounts()
  const currentId = getCurrentAccountId()
  return accounts.find(a => a.id === currentId)
}

/**
 * 是否是主账号
 */
export const isMainAccount = (): boolean => {
  return getCurrentAccountId() === MAIN_ACCOUNT_ID
}

/**
 * 切换账号
 * 注意：不修改 user_info，只切换账号ID
 * chatApi 会根据当前账号自动使用不同的用户名
 */
export const switchAccount = (accountId: string): void => {
  const accounts = getAccounts()
  const account = accounts.find(a => a.id === accountId)
  if (!account) {
    console.error('账号不存在:', accountId)
    return
  }
  
  // 只保存当前账号ID，不修改user_info
  localStorage.setItem(CURRENT_ACCOUNT_KEY, accountId)
  
  // 🔥 验证写入成功
  const saved = localStorage.getItem(CURRENT_ACCOUNT_KEY)
  console.log('🔄 切换账号:', account.name, account.isMain ? '(主账号)' : '(小号)')
  console.log('🔑 [账号切换] 已保存账号ID:', saved, '期望:', accountId)
  
  // 触发账号切换事件
  window.dispatchEvent(new CustomEvent('accountSwitched', { detail: { accountId } }))
}

/**
 * 创建小号
 */
export const createSubAccount = (name: string, avatar?: string, signature?: string): Account => {
  const accounts = getAccounts()
  
  const newAccount: Account = {
    id: `sub_${Date.now()}`,
    name,
    avatar,
    signature,
    isMain: false,
    createdAt: Date.now()
  }
  
  accounts.push(newAccount)
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  
  console.log('✨ 创建小号:', name)
  return newAccount
}

/**
 * 更新账号信息
 */
export const updateAccount = (accountId: string, updates: Partial<Account>): void => {
  const accounts = getAccounts()
  const index = accounts.findIndex(a => a.id === accountId)
  if (index === -1) return
  
  accounts[index] = { ...accounts[index], ...updates }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  
  // 触发事件通知UI更新
  window.dispatchEvent(new CustomEvent('accountUpdated', { detail: { accountId } }))
}

/**
 * 删除小号
 */
export const deleteSubAccount = (accountId: string): void => {
  if (accountId === MAIN_ACCOUNT_ID) {
    console.error('不能删除主账号')
    return
  }
  
  // 如果正在使用该账号，先切换到主账号
  if (getCurrentAccountId() === accountId) {
    switchAccount(MAIN_ACCOUNT_ID)
  }
  
  const accounts = getAccounts()
  const filtered = accounts.filter(a => a.id !== accountId)
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered))
  
  // 删除该小号的聊天记录
  // 聊天记录key格式: `messages_${chatId}_${accountId}`
  // 这里不删除，保留以防用户后悔
  
  console.log('🗑️ 删除小号:', accountId)
}

/**
 * 同步主账号信息（当用户在UserProfile修改信息时调用）
 * 同步版本，不包含头像
 */
export const syncMainAccountInfo = (): void => {
  const accounts = getAccounts()
  const mainAccount = accounts.find(a => a.isMain)
  if (!mainAccount) return
  
  const userInfo = getUserInfo()
  mainAccount.name = userInfo.nickname || userInfo.realName || '主账号'
  mainAccount.signature = userInfo.signature
  
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

/**
 * 同步主账号信息（异步版本，包含头像）
 */
export const syncMainAccountInfoWithAvatar = async (): Promise<void> => {
  const accounts = getAccounts()
  const mainAccount = accounts.find(a => a.isMain)
  if (!mainAccount) return
  
  const userInfo = await getUserInfoWithAvatar()
  mainAccount.name = userInfo.nickname || userInfo.realName || '主账号'
  mainAccount.avatar = userInfo.avatar
  mainAccount.signature = userInfo.signature
  
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

/**
 * 获取聊天记录的存储key
 * 小号的聊天记录与主账号分开存储
 */
export const getChatStorageKey = (chatId: string): string => {
  const currentAccountId = getCurrentAccountId()
  if (currentAccountId === MAIN_ACCOUNT_ID) {
    return `messages_${chatId}` // 主账号使用原有key
  }
  return `messages_${chatId}_${currentAccountId}` // 小号使用独立key
}

/**
 * 判断当前是否应该使用历史记忆
 * 小号不继承主账号的记忆
 */
export const shouldUseMemory = (): boolean => {
  return isMainAccount()
}
