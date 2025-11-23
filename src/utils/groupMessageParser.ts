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
    // 尝试提取JSON（处理markdown代码块）
    let jsonText = aiResponse
    
    // 移除markdown代码块标记
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
    
    // 尝试提取JSON
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ 未找到JSON格式')
      return null
    }
    
    let jsonStr = jsonMatch[0]
    
    // 🔥 修复截断的JSON：如果最后一个action的content不完整，尝试补全
    try {
      JSON.parse(jsonStr)
    } catch (e) {
      console.warn('⚠️ JSON解析失败，尝试修复截断...')
      
      // 策略1: 找到最后一个完整的 action 对象
      const lastCompleteActionMatch = jsonStr.match(/\{[^}]*"actorName"\s*:\s*"[^"]+"\s*,\s*"content"\s*:\s*"[^"]*"\s*\}/g)
      
      if (lastCompleteActionMatch && lastCompleteActionMatch.length > 0) {
        // 找到最后一个完整action的位置
        const lastCompleteAction = lastCompleteActionMatch[lastCompleteActionMatch.length - 1]
        const lastActionEndIndex = jsonStr.lastIndexOf(lastCompleteAction) + lastCompleteAction.length
        
        // 截取到最后一个完整action，然后补全
        jsonStr = jsonStr.substring(0, lastActionEndIndex) + ']}'
        console.log('✅ 策略1: 截取到最后一个完整action并补全')
      } else {
        // 策略2: 查找最后一个 "content": " 并补全
        const lastContentIndex = jsonStr.lastIndexOf('"content"')
        if (lastContentIndex !== -1) {
          // 找到这个content的开始引号
          const contentStartQuote = jsonStr.indexOf('"', lastContentIndex + 10) // 跳过 "content"
          if (contentStartQuote !== -1) {
            const contentEndQuote = jsonStr.indexOf('"', contentStartQuote + 1)
            if (contentEndQuote === -1) {
              // content的结束引号缺失，补全它
              jsonStr = jsonStr.substring(0, jsonStr.length) + '"}]}'
              console.log('✅ 策略2: 补全缺失的content结束引号')
            } else {
              // 有结束引号但后面结构不完整
              jsonStr = jsonStr.substring(0, contentEndQuote + 1) + '}]}'
              console.log('✅ 策略2: 补全action和数组结束')
            }
          }
        } else {
          // 策略3: 最后的兜底，直接截断到最后一个引号
          const lastQuoteIndex = jsonStr.lastIndexOf('"')
          if (lastQuoteIndex !== -1) {
            jsonStr = jsonStr.substring(0, lastQuoteIndex + 1) + '"}]}'
            console.log('✅ 策略3: 兜底修复')
          }
        }
      }
    }
    
    const scriptData = JSON.parse(jsonStr)
    
    // 验证必要字段
    if (!scriptData.actions || !Array.isArray(scriptData.actions)) {
      console.error('❌ JSON格式不正确：缺少actions字段')
      return null
    }
    
    // 处理每个action，解析表情包指令（支持混合消息）
    const processedActions: any[] = []
    
    scriptData.actions.forEach((action: any) => {
      const content = action.content
      
      // 🔥 跳过没有content的action（AI可能错误使用了tool_code等格式）
      if (!content) {
        console.warn('⚠️ [解析器] action缺少content字段，跳过:', action)
        return
      }
      
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
