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
  } catch (error) {
    console.error('设置AI状态失败:', error)
  }
}

/**
 * 根据时间和场景生成默认状态
 */
export function generateDefaultStatus(characterId: string, characterName: string): AIStatus {
  const hour = new Date().getHours()
  
  let action = ''
  let location = '家里'
  let outfit = ''
  let mood = ''
  
  if (hour >= 0 && hour < 6) {
    // 凌晨
    action = '躺在床上'
    outfit = '睡衣'
    mood = '困倦'
  } else if (hour >= 6 && hour < 9) {
    // 早上
    action = '刚起床，在洗漱'
    outfit = '睡衣'
    mood = '还有点困'
  } else if (hour >= 9 && hour < 12) {
    // 上午
    action = '坐在沙发上玩手机'
    outfit = '居家服'
    mood = '放松'
  } else if (hour >= 12 && hour < 14) {
    // 中午
    action = '吃午饭'
    location = '家里'
    outfit = '居家服'
    mood = '悠闲'
  } else if (hour >= 14 && hour < 18) {
    // 下午
    action = '窝在沙发上'
    outfit = '居家服'
    mood = '有点困'
  } else if (hour >= 18 && hour < 22) {
    // 晚上
    action = '躺在床上刷手机'
    outfit = '睡衣'
    mood = '放松'
  } else {
    // 深夜
    action = '躺在床上'
    outfit = '睡衣'
    mood = '准备睡了'
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
 * 获取或生成AI状态
 */
export function getOrCreateAIStatus(characterId: string, characterName: string): AIStatus {
  let status = getAIStatus(characterId)
  
  // 如果没有状态或状态太旧（超过2小时），生成新的默认状态
  if (!status || Date.now() - status.updatedAt > 2 * 60 * 60 * 1000) {
    status = generateDefaultStatus(characterId, characterName)
    setAIStatus(status)
  }
  
  return status
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

