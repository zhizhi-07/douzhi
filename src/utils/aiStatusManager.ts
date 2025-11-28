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
  } catch (error) {
    console.error('设置AI状态失败:', error)
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
 * 支持格式：[状态:正在吃火锅] 或 [状态:在图书馆|行程:详细描述]
 * 🔥 只返回简略状态部分，行程部分由 statusHandler 处理
 */
export function extractStatusFromReply(reply: string, characterId: string): AIStatus | null {
  const statusPattern = /\[状态(?:更新)?[:：]([^\]]+)\]/
  const match = reply.match(statusPattern)
  
  if (!match) return null
  
  const fullContent = match[1].trim()
  
  // 🔥 解析格式：[状态:在哪|行程:详细场景]
  let location = ''   // 简略位置（绿色点后面）
  let action = ''     // 完整行程（"正在做什么"）
  
  // 检查是否有行程部分
  const pipeMatch = fullContent.match(/^(.+?)\|行程[:：](.+)$/)
  if (pipeMatch) {
    location = pipeMatch[1].trim()  // 在哪（如"在家"）
    action = pipeMatch[2].trim()    // 详细行程
  } else {
    // 🔥 AI 没按格式写，尝试智能提取位置
    // 常见位置关键词
    const locationKeywords = ['在家', '家里', '公司', '学校', '图书馆', '咖啡厅', '咖啡店', 
      '地铁', '公交', '车上', '床上', '沙发', '书桌', '餐厅', '超市', '商场', '医院',
      '公园', '健身房', '办公室', '宿舍', '厨房', '卫生间', '阳台', '客厅', '卧室']
    
    // 尝试从内容开头提取位置
    let foundLocation = ''
    for (const kw of locationKeywords) {
      if (fullContent.includes(kw)) {
        foundLocation = kw
        break
      }
    }
    
    location = foundLocation || '未知'  // 找不到就显示"未知"
    action = fullContent                 // 整个内容作为行程
  }
  
  const currentStatus = getAIStatus(characterId)
  
  return {
    characterId,
    action,      // 完整行程描述
    location,    // 简略位置
    outfit: currentStatus?.outfit,
    mood: currentStatus?.mood,
    updatedAt: Date.now()
  }
}

