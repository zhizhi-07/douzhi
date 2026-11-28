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
 * 🔥 迁移：清理旧的大数据（完整base64）
 */
function migrateOldData(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    
    const size = saved.length * 2
    // 如果数据超过100KB，说明有旧的base64数据，需要清理
    if (size > 100 * 1024) {
      console.warn(`⚠️ [用户信息追踪] 检测到旧数据过大 (${(size / 1024).toFixed(1)}KB)，正在清理...`)
      
      const data = JSON.parse(saved)
      
      // 清理头像历史中的base64
      if (data.avatar) {
        data.avatar.history = data.avatar.history.slice(-3).map((h: any) => ({
          ...h,
          previousValue: '[头像]',
          newValue: '[新头像]'
        }))
        // 如果current是完整base64，转为指纹
        if (data.avatar.current && data.avatar.current.length > 200) {
          const len = data.avatar.current.length
          data.avatar.current = `fp:${len}:migrated`
        }
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log('✅ [用户信息追踪] 旧数据已清理')
    }
  } catch (e) {
    console.error('迁移旧数据失败:', e)
  }
}

// 启动时执行迁移
migrateOldData()

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
 * 生成头像指纹（避免存储完整base64）
 */
function getAvatarFingerprint(avatar: string): string {
  if (!avatar || avatar.length < 100) return avatar
  // 使用长度 + 前50字符 + 后50字符作为指纹
  return `fp:${avatar.length}:${avatar.substring(0, 50)}:${avatar.substring(avatar.length - 50)}`
}

/**
 * 检查并记录用户头像变更
 */
export function trackAvatarChange(newAvatar: string): boolean {
  const history = getUserInfoChangeHistory()
  
  // 🔥 使用指纹而不是完整base64
  const newFingerprint = getAvatarFingerprint(newAvatar)
  const currentFingerprint = history.avatar.current
  
  // 首次设置
  if (!currentFingerprint) {
    history.avatar.current = newFingerprint
    saveUserInfoChangeHistory(history)
    console.log('✨ 首次设置用户头像')
    return false
  }
  
  // 检查是否变更（比较指纹）
  if (currentFingerprint !== newFingerprint) {
    const change: UserInfoChange = {
      type: 'avatar',
      previousValue: '[头像]',  // 🔥 不存储完整base64
      newValue: '[新头像]',
      changedAt: Date.now()
    }
    
    // 🔥 只保留最近3次头像变更记录
    if (history.avatar.history.length >= 3) {
      history.avatar.history = history.avatar.history.slice(-2)
    }
    
    history.avatar.history.push(change)
    history.avatar.current = newFingerprint
    saveUserInfoChangeHistory(history)
    
    console.log('🔄 用户头像已变更')
    
    return true
  }
  
  return false
}

/**
 * 获取用户信息变更提示文本（用于系统提示词）
 * @param allowAvatarRecognition 是否开启了头像识别（如果没开启，不提示头像变更）
 */
export function getUserInfoChangeContext(allowAvatarRecognition: boolean = false): string {
  if ((localStorage.getItem('current_account_id') || 'main') !== 'main') return ''
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

  // 🔥 只有开启了头像识别才显示头像变更
  if (allowAvatarRecognition && history.avatar.history.length > 0) {
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
⚠️ **【重要】检测到用户更改了个人信息**：
${changes.join('\n')}

以上仅为所列时间发生的变更记录，不代表本轮刚刚发生，也不代表其他资料发生变化。只有对话相关时才自然回应，不必主动提起或跟随修改自己的资料。
`
}
