/**
 * AI状态管理器
 * 管理AI角色的实时状态（正在做什么、穿着什么、心情如何等）
 */

export interface AIStatus {
  characterId: string
  // 基础状态
  action: string // 正在做什么，如"躺在床上"、"吃火锅"、"思考怎么回复"
  location?: string // 在哪里，如"家里"、"咖啡厅"
  outfit?: string // 穿着，如"睡衣"、"黑色卫衣"
  mood?: string // 心情，如"开心"、"有点累"、"无聊"
  // 时间戳
  updatedAt: number
}

const STORAGE_KEY_PREFIX = 'ai_status_'
const FORCE_UPDATE_FLAG_PREFIX = 'ai_status_force_update_'

/**
 * 获取AI当前状态
 */
export function getAIStatus(characterId: string): AIStatus | null {
  try {
    const key = STORAGE_KEY_PREFIX + characterId
    const data = localStorage.getItem(key)
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.error('获取AI状态失败:', error)
    return null
  }
}

/**
 * 设置AI状态
 */
export function setAIStatus(status: AIStatus): void {
  try {
    const key = STORAGE_KEY_PREFIX + status.characterId
    status.updatedAt = Date.now()
    localStorage.setItem(key, JSON.stringify(status))
    console.log('💫 AI状态已更新:', status)
    
    // 🔥 同时保存到行程历史
    import('./aiScheduleHistory').then(({ saveStatusToSchedule }) => {
      saveStatusToSchedule(status.characterId, status.action)
    }).catch(e => console.error('保存行程历史失败:', e))
  } catch (error) {
    console.error('设置AI状态失败:', error)
  }
}

/**
 * 根据时间和场景生成默认状态
 */
export function generateDefaultStatus(characterId: string, characterName: string): AIStatus {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()

  let action = ''
  let location = '家里'
  let outfit = ''
  let mood = ''

  // 🌙 凌晨 0:00-6:00
  if (hour >= 0 && hour < 6) {
    const actions = ['睡得正香', '翻了个身继续睡', '抱着被子睡觉', '做梦中', '睡得迷迷糊糊']
    action = actions[Math.floor(Math.random() * actions.length)]
    outfit = '睡衣'
    mood = '困死了'
  }
  // 🌅 早上 6:00-9:00
  else if (hour >= 6 && hour < 9) {
    if (hour < 7) {
      const actions = ['刚醒，还躺着', '眯着眼看手机', '不想起床']
      action = actions[Math.floor(Math.random() * actions.length)]
    } else if (hour < 8) {
      const actions = ['在洗漱', '刷牙洗脸', '对着镜子发呆']
      action = actions[Math.floor(Math.random() * actions.length)]
    } else {
      const actions = ['吃早餐', '喝咖啡', '坐在餐桌前']
      action = actions[Math.floor(Math.random() * actions.length)]
    }
    outfit = hour < 7 ? '睡衣' : '居家服'
    mood = '还没完全醒'
  }
  // ☀️ 上午 9:00-12:00
  else if (hour >= 9 && hour < 12) {
    const actions = ['窝在沙发上刷手机', '躺着追剧', '抱着抱枕发呆', '在床上滚来滚去', '看小说看得入迷']
    action = actions[Math.floor(Math.random() * actions.length)]
    outfit = '居家服'
    mood = '悠闲自在'
  }
  // 🍜 中午 12:00-14:00
  else if (hour >= 12 && hour < 14) {
    if (hour === 12 && minute < 30) {
      const actions = ['准备吃午饭', '点外卖中', '在厨房忙活']
      action = actions[Math.floor(Math.random() * actions.length)]
      mood = '饿了'
    } else if (hour === 12 || (hour === 13 && minute < 30)) {
      const actions = ['吃午饭', '大口吃饭', '边吃边看手机']
      action = actions[Math.floor(Math.random() * actions.length)]
      mood = '满足'
    } else {
      const actions = ['吃饱了躺着', '午休中', '困得不行']
      action = actions[Math.floor(Math.random() * actions.length)]
      mood = '犯困'
    }
    outfit = '居家服'
  }
  // 🌤️ 下午 14:00-18:00
  else if (hour >= 14 && hour < 18) {
    const actions = ['窝在沙发上', '躺床上刷视频', '抱着零食看剧', '趴在床上玩手机', '懒洋洋地躺着']
    action = actions[Math.floor(Math.random() * actions.length)]
    outfit = '居家服'
    mood = hour < 16 ? '有点困' : '慢慢清醒了'
  }
  // 🌆 傍晚 18:00-20:00
  else if (hour >= 18 && hour < 20) {
    if (hour === 18 && minute < 30) {
      const actions = ['准备吃晚饭', '在厨房做饭', '点外卖']
      action = actions[Math.floor(Math.random() * actions.length)]
      mood = '饿了'
    } else {
      const actions = ['吃晚饭', '边吃边刷手机', '吃得很香']
      action = actions[Math.floor(Math.random() * actions.length)]
      mood = '开心'
    }
    outfit = '居家服'
  }
  // 🌙 晚上 20:00-23:00
  else if (hour >= 20 && hour < 23) {
    const actions = ['躺床上刷手机', '追剧追得停不下来', '窝在被窝里', '敷着面膜玩手机', '抱着抱枕看视频']
    action = actions[Math.floor(Math.random() * actions.length)]
    outfit = '睡衣'
    mood = hour < 22 ? '放松' : '还不想睡'
  }
  // 🌃 深夜 23:00-24:00
  else {
    const actions = ['躺床上舍不得睡', '刷手机刷到现在', '准备睡了', '困但还在玩手机', '眼皮打架了']
    action = actions[Math.floor(Math.random() * actions.length)]
    outfit = '睡衣'
    mood = '困但不想睡'
  }

  return {
    characterId,
    action,
    location,
    outfit,
    mood,
    updatedAt: Date.now()
  }
}

/**
 * 获取AI状态（不自动生成）
 * 🔥 修改：不再自动生成默认状态，让AI自己决定状态
 * 🔥 新增：检查状态是否过期（超过6小时），过期则返回 null
 */
export function getOrCreateAIStatus(characterId: string, characterName: string): AIStatus | null {
  const status = getAIStatus(characterId)
  
  // 如果没有状态，返回 null，不自动生成
  if (!status) {
    return null
  }

  // 🔥 检查状态是否过期（超过6小时）
  const now = Date.now()
  const timeSinceUpdate = now - status.updatedAt
  const SIX_HOURS = 6 * 60 * 60 * 1000
  
  if (timeSinceUpdate > SIX_HOURS) {
    console.log(`💫 [AI状态] 状态已过期（${Math.floor(timeSinceUpdate / 1000 / 60 / 60)}小时前），需要更新`)
    return null // 返回 null，让提示词告诉 AI 必须更新状态
  }

  return status
}

/**
 * 检查状态是否符合当前时间段
 */
function checkStatusTimeAppropriate(status: AIStatus): boolean {
  const hour = new Date().getHours()
  const action = status.action

  // 凌晨0-6点应该是睡觉相关
  if (hour >= 0 && hour < 6) {
    return action.includes('睡') || action.includes('梦')
  }

  // 早上6-9点应该是起床、洗漱、早餐相关
  if (hour >= 6 && hour < 9) {
    return action.includes('醒') || action.includes('起床') || action.includes('洗漱') ||
           action.includes('刷牙') || action.includes('早餐') || action.includes('咖啡')
  }

  // 中午12-14点应该是吃饭相关
  if (hour >= 12 && hour < 14) {
    return action.includes('午饭') || action.includes('吃') || action.includes('午休')
  }

  // 傍晚18-20点应该是晚饭相关
  if (hour >= 18 && hour < 20) {
    return action.includes('晚饭') || action.includes('吃') || action.includes('做饭')
  }

  // 深夜23-24点应该是准备睡觉
  if (hour >= 23) {
    return action.includes('睡') || action.includes('困')
  }

  // 其他时间段比较宽松，只要不是明显不符合就行
  return true
}

/**
 * 格式化状态为显示文本（简短版，显示在名字下方）
 */
export function formatStatusShort(status: AIStatus): string {
  return status.action
}

/**
 * 格式化状态为详细文本（点击状态后显示）
 */
export function formatStatusDetail(status: AIStatus): string {
  const parts: string[] = []
  
  if (status.action) parts.push(`正在：${status.action}`)
  if (status.location) parts.push(`位置：${status.location}`)
  if (status.outfit) parts.push(`穿着：${status.outfit}`)
  if (status.mood) parts.push(`心情：${status.mood}`)
  
  return parts.join('\n')
}

/**
 * 设置强制更新状态标记
 * 用于下一轮对话时强制要求AI更新状态
 */
export function setForceUpdateFlag(characterId: string): void {
  try {
    const key = FORCE_UPDATE_FLAG_PREFIX + characterId
    localStorage.setItem(key, 'true')
    console.log('🔄 [状态修正] 已标记强制更新状态')
  } catch (error) {
    console.error('设置强制更新标记失败:', error)
  }
}

/**
 * 获取强制更新状态标记
 */
export function getForceUpdateFlag(characterId: string): boolean {
  try {
    const key = FORCE_UPDATE_FLAG_PREFIX + characterId
    return localStorage.getItem(key) === 'true'
  } catch (error) {
    console.error('获取强制更新标记失败:', error)
    return false
  }
}

/**
 * 清除强制更新状态标记
 */
export function clearForceUpdateFlag(characterId: string): void {
  try {
    const key = FORCE_UPDATE_FLAG_PREFIX + characterId
    localStorage.removeItem(key)
    console.log('✅ [状态修正] 已清除强制更新标记')
  } catch (error) {
    console.error('清除强制更新标记失败:', error)
  }
}

/**
 * 从AI回复中提取状态更新
 * 支持格式：[状态:正在吃火锅] 或 [状态更新:躺在床上]
 */
export function extractStatusFromReply(reply: string, characterId: string): AIStatus | null {
  const statusPattern = /\[状态(?:更新)?[:：]([^\]]+)\]/
  const match = reply.match(statusPattern)
  
  if (!match) return null
  
  const statusText = match[1].trim()
  const currentStatus = getAIStatus(characterId)
  
  return {
    characterId,
    action: statusText,
    location: currentStatus?.location,
    outfit: currentStatus?.outfit,
    mood: currentStatus?.mood,
    updatedAt: Date.now()
  }
}

