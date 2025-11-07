/**
 * AI响应解析器
 * 负责解析AI返回的文本格式，转换为结构化数据
 */

import type { AIScene, AIAction, AIActionType } from '../../types/momentsAI'

/**
 * 解析AI导演的文本响应
 */
export function parseDirectorResponse(content: string): AIScene | null {
  try {
    const lines = content.trim().split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      console.error('❌ AI返回空内容')
      return null
    }
    
    // 第一行是场景描述
    const firstLine = lines[0].trim()
    let scene = '未知场景'
    if (firstLine.startsWith('场景:') || firstLine.startsWith('场景：')) {
      scene = firstLine.replace(/^场景[:：]/, '').trim()
    }
    
    const actions: AIAction[] = []
    
    // 解析每一行动作
    for (let i = 1; i < lines.length; i++) {
      const action = parseActionLine(lines[i])
      if (action) {
        actions.push(action)
      }
    }
    
    return {
      scene,
      dramatic_analysis: scene,
      actions
    }
  } catch (error) {
    console.error('❌ 解析AI响应失败:', error)
    return null
  }
}

/**
 * 解析单行动作
 */
function parseActionLine(line: string): AIAction | null {
  const parts = line.trim().split('|')
  
  if (parts.length < 4) {
    return null
  }
  
  const actionType = parts[0].trim()
  const characterId = parts[1].trim()
  const characterName = parts[2].trim()
  const delay = parseInt(parts[3].trim()) || 0
  const content = parts[4]?.trim() || ''
  const replyTo = parts[5]?.trim() || ''
  
  // 映射动作类型
  const actionMap: Record<string, AIActionType> = {
    '点赞': 'like',
    '评论': 'comment',
    '私聊': 'dm',
    '沉默': 'none'
  }
  
  const action = actionMap[actionType]
  if (!action) {
    console.warn(`⚠️ 未知动作类型: ${actionType}`)
    return null
  }
  
  const result: AIAction = {
    characterId,
    characterName,
    action,
    delay,
    reason: actionType
  }
  
  // 根据动作类型添加额外字段
  if (action === 'comment') {
    result.commentContent = content
    result.replyTo = replyTo
  } else if (action === 'dm') {
    result.dmContent = content
  }
  
  return result
}
