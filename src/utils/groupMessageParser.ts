/**
 * 群聊消息解析器
 * 解析 [成员名] 内容 格式的AI回复
 */

export interface ParsedGroupMessage {
  actorName: string
  content: string
}

/**
 * 解析AI返回的群聊消息
 * 格式: [成员名] 内容
 * 
 * @param aiResponse - AI的原始回复
 * @returns 解析后的消息数组
 */
export function parseGroupChatResponse(aiResponse: string): ParsedGroupMessage[] {
  const messages: ParsedGroupMessage[] = []
  
  // 按行分割
  const lines = aiResponse.split('\n').map(line => line.trim()).filter(Boolean)
  
  for (const line of lines) {
    // 匹配格式: [成员名] 内容
    const match = line.match(/^\[([^\]]+)\]\s*(.+)$/)
    
    if (match) {
      const actorName = match[1].trim()
      const content = match[2].trim()
      
      if (actorName && content) {
        messages.push({ actorName, content })
      }
    }
  }
  
  return messages
}

/**
 * 从AI回复中提取JSON格式的剧本数据
 * 
 * @param aiResponse - AI的原始回复
 * @returns 解析后的剧本数据，如果解析失败返回null
 */
export interface GroupChatScript {
  relationships: string
  plot: string
  actions: Array<{
    actorName: string
    content: string
    emojiIndex?: number  // 表情包编号（从1开始）
  }>
}

export function extractGroupChatScript(aiResponse: string): GroupChatScript | null {
  try {
    // 尝试提取JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ 未找到JSON格式')
      return null
    }
    
    const scriptData = JSON.parse(jsonMatch[0])
    
    // 验证必要字段
    if (!scriptData.actions || !Array.isArray(scriptData.actions)) {
      console.error('❌ JSON格式不正确：缺少actions字段')
      return null
    }
    
    // 处理每个action，解析表情包指令
    const processedActions = scriptData.actions.map((action: any) => {
      // 检查是否是表情包指令：[表情:编号]
      const emojiMatch = action.content.match(/^\[表情:(\d+)\]$/)
      if (emojiMatch) {
        return {
          actorName: action.actorName,
          content: action.content,
          emojiIndex: parseInt(emojiMatch[1], 10)
        }
      }
      return action
    })
    
    return {
      relationships: scriptData.relationships || '',
      plot: scriptData.plot || '',
      actions: processedActions
    }
  } catch (error) {
    console.error('❌ JSON解析失败:', error)
    return null
  }
}
