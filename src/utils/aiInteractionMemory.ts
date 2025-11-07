/**
 * AI互动记忆系统
 * 记录所有AI的互动行为，供下次AI导演编排时参考
 */

export interface AIInteractionRecord {
  id: string
  timestamp: number
  characterId: string
  characterName: string
  actionType: 'like' | 'comment' | 'dm' | 'post'
  targetId?: string  // 朋友圈ID或聊天对象ID
  targetName?: string  // 目标名称
  content?: string  // 评论内容或私信内容
  context?: string  // 上下文（朋友圈内容等）
}

const MEMORY_KEY = 'ai_interaction_memory'
const MAX_RECORDS = 200  // 最多保存200条记录

/**
 * 加载AI互动记忆
 */
export function loadAIMemory(): AIInteractionRecord[] {
  try {
    const saved = localStorage.getItem(MEMORY_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('❌ 加载AI互动记忆失败:', error)
  }
  return []
}

/**
 * 保存AI互动记忆
 */
export function saveAIMemory(records: AIInteractionRecord[]): void {
  try {
    // 只保存最近的记录
    const toSave = records.slice(-MAX_RECORDS)
    localStorage.setItem(MEMORY_KEY, JSON.stringify(toSave))
  } catch (error) {
    console.error('❌ 保存AI互动记忆失败:', error)
  }
}

/**
 * 记录AI互动
 */
export function recordAIInteraction(record: Omit<AIInteractionRecord, 'id' | 'timestamp'>): void {
  const newRecord: AIInteractionRecord = {
    id: `${Date.now()}-${record.characterId}`,
    timestamp: Date.now(),
    ...record
  }
  
  const records = loadAIMemory()
  records.push(newRecord)
  saveAIMemory(records)
  
  console.log(`📝 记录AI互动: ${record.characterName} - ${record.actionType}`)
}

/**
 * 获取最近的AI互动记录（格式化为可读文本）
 */
export function getRecentAIInteractions(limit: number = 30): string {
  const records = loadAIMemory().slice(-limit)
  
  if (records.length === 0) {
    return '（暂无AI互动记录）'
  }
  
  const formatted = records.map(record => {
    const time = new Date(record.timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    let action = ''
    switch (record.actionType) {
      case 'like':
        action = `给"${record.targetName}"的朋友圈点赞`
        break
      case 'comment':
        action = `评论"${record.targetName}"的朋友圈: ${record.content}`
        break
      case 'dm':
        action = `私信用户: ${record.content?.substring(0, 30)}${(record.content?.length || 0) > 30 ? '...' : ''}`
        break
      case 'post':
        action = `发布朋友圈: ${record.content?.substring(0, 30)}${(record.content?.length || 0) > 30 ? '...' : ''}`
        break
    }
    
    return `[${time}] ${record.characterName}: ${action}`
  }).join('\n')
  
  return `最近${records.length}条AI互动:\n${formatted}`
}

/**
 * 获取某个角色的最近互动
 */
export function getCharacterRecentActions(characterId: string, limit: number = 10): AIInteractionRecord[] {
  const records = loadAIMemory()
  return records.filter(r => r.characterId === characterId).slice(-limit)
}

/**
 * 清理过期记录（超过30天）
 */
export function cleanOldMemory(): void {
  const records = loadAIMemory()
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const cleaned = records.filter(r => r.timestamp > thirtyDaysAgo)
  
  if (cleaned.length < records.length) {
    saveAIMemory(cleaned)
    console.log(`🧹 清理了 ${records.length - cleaned.length} 条过期AI互动记录`)
  }
}
