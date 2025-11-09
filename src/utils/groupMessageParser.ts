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
    quotedMessageId?: string  // 引用的消息ID（可选）
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
    
    // 处理每个action，解析表情包指令（支持混合消息）
    const processedActions: any[] = []
    
    scriptData.actions.forEach((action: any) => {
      const content = action.content
      
      // 检查是否包含表情包指令：[表情:编号]
      const emojiRegex = /\[表情:(\d+)\]/g
      const parts: any[] = []
      let lastIndex = 0
      let match: RegExpExecArray | null
      
      while ((match = emojiRegex.exec(content)) !== null) {
        // 添加表情包前的文字
        if (match.index > lastIndex) {
          const textPart = content.substring(lastIndex, match.index).trim()
          if (textPart) {
            parts.push({
              actorName: action.actorName,
              content: textPart
            })
          }
        }
        
        // 添加表情包
        parts.push({
          actorName: action.actorName,
          content: match[0],
          emojiIndex: parseInt(match[1], 10)
        })
        
        lastIndex = emojiRegex.lastIndex
      }
      
      // 添加剩余文字
      if (lastIndex < content.length) {
        const remainingText = content.substring(lastIndex).trim()
        if (remainingText) {
          parts.push({
            actorName: action.actorName,
            content: remainingText
          })
        }
      }
      
      // 如果没有表情包，直接添加原消息
      if (parts.length === 0) {
        parts.push(action)
      }
      
      processedActions.push(...parts)
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
