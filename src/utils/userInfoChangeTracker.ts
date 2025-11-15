/**
 * 用户信息变更追踪系统
 * 追踪用户网名、个性签名、头像的变更历史，全局共享给所有AI
 */

export interface UserInfoChange {
  type: 'nickname' | 'signature' | 'avatar'
  previousValue: string
  newValue: string
  changedAt: number
  reminderCount?: number
}

export interface UserInfoChangeHistory {
  nickname: {
    current: string
    history: UserInfoChange[]
  }
  signature: {
    current: string
    history: UserInfoChange[]
  }
  avatar: {
    current: string
    history: UserInfoChange[]
  }
}

const STORAGE_KEY = 'user_info_change_history'

/**
 * 获取用户信息变更历史
 */
export function getUserInfoChangeHistory(): UserInfoChangeHistory {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      // 🔥 兼容旧数据：如果没有 avatar 字段，自动补上
      if (!data.avatar) {
        data.avatar = {
          current: '',
          history: []
        }
      }
      return data
    }
  } catch (error) {
    console.error('读取用户信息变更历史失败:', error)
  }
  
  return {
    nickname: {
      current: '',
      history: []
    },
    signature: {
      current: '',
      history: []
    },
    avatar: {
      current: '',
      history: []
    }
  }
}

/**
 * 保存用户信息变更历史
 */
function saveUserInfoChangeHistory(history: UserInfoChangeHistory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('保存用户信息变更历史失败:', error)
  }
}

/**
 * 检查并记录用户网名变更
 */
export function trackNicknameChange(newNickname: string): boolean {
  const history = getUserInfoChangeHistory()
  
  // 首次设置
  if (!history.nickname.current) {
    history.nickname.current = newNickname
    saveUserInfoChangeHistory(history)
    console.log('✨ 首次设置用户网名:', newNickname)
    return false
  }
  
  // 检查是否变更
  if (history.nickname.current !== newNickname) {
    const change: UserInfoChange = {
      type: 'nickname',
      previousValue: history.nickname.current,
      newValue: newNickname,
      changedAt: Date.now()
    }
    
    history.nickname.history.push(change)
    history.nickname.current = newNickname
    saveUserInfoChangeHistory(history)
    
    console.log('🔄 用户网名已变更:', {
      from: change.previousValue,
      to: newNickname
    })
    
    return true
  }
  
  return false
}

/**
 * 检查并记录用户个性签名变更
 */
export function trackSignatureChange(newSignature: string): boolean {
  const history = getUserInfoChangeHistory()
  
  // 首次设置
  if (!history.signature.current) {
    history.signature.current = newSignature
    saveUserInfoChangeHistory(history)
    console.log('✨ 首次设置用户签名:', newSignature)
    return false
  }
  
  // 检查是否变更
  if (history.signature.current !== newSignature) {
    const change: UserInfoChange = {
      type: 'signature',
      previousValue: history.signature.current,
      newValue: newSignature,
      changedAt: Date.now()
    }
    
    history.signature.history.push(change)
    history.signature.current = newSignature
    saveUserInfoChangeHistory(history)
    
    console.log('🔄 用户签名已变更:', {
      from: change.previousValue,
      to: newSignature
    })
    
    return true
  }
  
  return false
}

/**
 * 检查并记录用户头像变更
 */
export function trackAvatarChange(newAvatar: string): boolean {
  const history = getUserInfoChangeHistory()
  
  // 首次设置
  if (!history.avatar.current) {
    history.avatar.current = newAvatar
    saveUserInfoChangeHistory(history)
    console.log('✨ 首次设置用户头像')
    return false
  }
  
  // 检查是否变更
  if (history.avatar.current !== newAvatar) {
    const change: UserInfoChange = {
      type: 'avatar',
      previousValue: history.avatar.current,
      newValue: newAvatar,
      changedAt: Date.now()
    }
    
    history.avatar.history.push(change)
    history.avatar.current = newAvatar
    saveUserInfoChangeHistory(history)
    
    console.log('🔄 用户头像已变更')
    
    return true
  }
  
  return false
}

/**
 * 获取用户信息变更提示文本（用于系统提示词）
 */
export function getUserInfoChangeContext(): string {
  const history = getUserInfoChangeHistory()
  const changes: string[] = []
  let shouldSave = false

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const now = Date.now()
  const maxAge = 3 * 24 * 60 * 60 * 1000
  const maxReminders = 2

  // 显示最近的网名变更（每次变更最多提醒两次，且仅在最近几天内提醒）
  if (history.nickname.history.length > 0) {
    const latestIndex = history.nickname.history.length - 1
    const latest = history.nickname.history[latestIndex] as UserInfoChange
    const age = now - latest.changedAt
    const count = latest.reminderCount ?? 0

    if (age <= maxAge && count < maxReminders) {
      changes.push(` ${formatTime(latest.changedAt)}: 用户把网名从"${latest.previousValue}"改成了"${latest.newValue}"`)
      history.nickname.history[latestIndex] = { ...latest, reminderCount: count + 1 }
      shouldSave = true
    }
  }

  // 显示最近的签名变更
  if (history.signature.history.length > 0) {
    const latestIndex = history.signature.history.length - 1
    const latest = history.signature.history[latestIndex] as UserInfoChange
    const age = now - latest.changedAt
    const count = latest.reminderCount ?? 0

    if (age <= maxAge && count < maxReminders) {
      changes.push(` ${formatTime(latest.changedAt)}: 用户把个性签名从"${latest.previousValue}"改成了"${latest.newValue}"`)
      history.signature.history[latestIndex] = { ...latest, reminderCount: count + 1 }
      shouldSave = true
    }
  }

  // 显示最近的头像变更
  if (history.avatar.history.length > 0) {
    const latestIndex = history.avatar.history.length - 1
    const latest = history.avatar.history[latestIndex] as UserInfoChange
    const age = now - latest.changedAt
    const count = latest.reminderCount ?? 0

    if (age <= maxAge && count < maxReminders) {
      changes.push(` ${formatTime(latest.changedAt)}: 用户换了新头像`)
      history.avatar.history[latestIndex] = { ...latest, reminderCount: count + 1 }
      shouldSave = true
    }
  }

  if (shouldSave) {
    saveUserInfoChangeHistory(history)
  }

  if (changes.length === 0) {
    return ''
  }

  return `

 提示：用户最近有一些个人信息上的小改动。
${changes.join('\n')}
你可以注意到这些变化，并在接下来1-2次合适的回复里自然地提一下（比如"咦？你换头像/改名了？""你签名怎么改成这个了"），如果当下话题不合适，也可以先不提。不要在每一轮都重复强调，更不需要专门为此写随笔。`
}
