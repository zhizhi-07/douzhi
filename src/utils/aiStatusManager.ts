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
 * 🔥 不再自动保存到行程历史，由 statusHandler 统一处理，避免重复保存
 */
export function setAIStatus(status: AIStatus): void {
  try {
    const key = STORAGE_KEY_PREFIX + status.characterId
    status.updatedAt = Date.now()
    localStorage.setItem(key, JSON.stringify(status))
    console.log('💫 AI状态已更新:', status)
    
    // 🔥 触发事件通知心声卡片更新
    window.dispatchEvent(new CustomEvent('aiStatusUpdated', {
      detail: { characterId: status.characterId, status }
    }))
  } catch (error) {
    console.error('设置AI状态失败:', error)
  }
}

/**
 * 获取AI状态（不自动生成）
 * 🔥 修改：不再自动生成默认状态，让AI自己决定状态
 * 🔥 修改：不再清空过期状态！即使过了很久，也要让AI知道上一条状态是什么，才能合理过渡
 */
export function getOrCreateAIStatus(characterId: string, characterName: string): AIStatus | null {
  const status = getAIStatus(characterId)
  
  // 如果没有状态，返回 null，不自动生成
  if (!status) {
    return null
  }

  // 🔥 不再清空过期状态！AI需要知道上一条状态才能做合理过渡
  // 时间间隔的处理交给 chatApi.ts 的 lastGapHint 来做
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
 * 支持格式：[状态:地点|服装:xxx|心理:xxx|动作:xxx]
 */
export function extractStatusFromReply(reply: string, characterId: string): AIStatus | null {
  const statusPattern = /\[状态(?:更新)?[:：]([^\]]+)\]/
  const match = reply.match(statusPattern)
  
  if (!match) return null
  
  const fullContent = match[1].trim()
  const currentStatus = getAIStatus(characterId)
  
  // 解析新格式：[状态:地点|服装:xxx|心理:xxx|动作:xxx]
  let location = ''
  let outfit = currentStatus?.outfit || ''
  let mood = '' // 🔥 心理必须每轮更新，不继承旧值
  let action = ''
  
  // 🔥 过滤函数：过滤掉"同上"等无效内容，以及前缀标签
  const filterInvalid = (text: string): string => {
    const invalidPatterns = ['同上', '不变', '同前', '无变化', '保持不变', '如上']
    let trimmed = text.trim()
    
    // 🔥 过滤掉前缀标签（地点:、动作:等）
    const prefixPatterns = ['地点:', '地点：', '动作:', '动作：', '服装:', '服装：', '心理:', '心理：']
    for (const prefix of prefixPatterns) {
      if (trimmed.startsWith(prefix)) {
        trimmed = trimmed.slice(prefix.length).trim()
      }
    }
    
    for (const pattern of invalidPatterns) {
      if (trimmed === pattern || trimmed.includes(pattern)) {
        return ''
      }
    }
    return trimmed
  }
  
  // 按 | 分割
  const parts = fullContent.split('|')
  
  // 第一部分是地点
  if (parts.length > 0) {
    location = filterInvalid(parts[0])
    // 如果地点被过滤了，用旧值
    if (!location) location = currentStatus?.location || ''
  }
  
  // 解析其他部分
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim()
    
    // 服装
    const outfitMatch = part.match(/^服装[:：](.+)$/)
    if (outfitMatch) {
      const newOutfit = filterInvalid(outfitMatch[1])
      if (newOutfit) outfit = newOutfit
      continue
    }
    
    // 心理 - 🔥 必须有新内容
    const moodMatch = part.match(/^心理[:：](.+)$/)
    if (moodMatch) {
      mood = filterInvalid(moodMatch[1])
      continue
    }
    
    // 动作
    const actionMatch = part.match(/^动作[:：](.+)$/)
    if (actionMatch) {
      const newAction = filterInvalid(actionMatch[1])
      if (newAction) action = newAction
      continue
    }
    
    // 兼容旧格式：行程
    const scheduleMatch = part.match(/^行程[:：](.+)$/)
    if (scheduleMatch) {
      const newAction = filterInvalid(scheduleMatch[1])
      if (newAction) action = newAction
      continue
    }
  }
  
  // 如果没有动作，用整个内容作为动作（兼容旧格式）
  if (!action && parts.length === 1) {
    action = filterInvalid(fullContent)
  }
  
  // 🔥 心理为空时，保留旧值但打印警告
  if (!mood) {
    console.warn('⚠️ [AI状态] 心理字段为空或无效，AI没有更新心声！')
    mood = currentStatus?.mood || ''
  }
  
  return {
    characterId,
    location,
    outfit,
    mood,
    action,
    updatedAt: Date.now()
  }
}

