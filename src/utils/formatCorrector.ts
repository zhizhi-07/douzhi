/**
 * AI消息格式修正器
 * 自动修正AI输出的常见格式错误，让非标准格式也能正常解析
 */

/**
 * 修正结果
 */
export interface CorrectionResult {
  corrected: boolean  // 是否进行了修正
  original: string    // 原始文本
  fixed: string       // 修正后的文本
  corrections: string[]  // 修正项列表
}

/**
 * 自动修正AI消息格式
 * @param text AI原始输出
 * @returns 修正结果
 */
export const correctAIMessageFormat = (text: string): CorrectionResult => {
  const corrections: string[] = []
  let fixed = text

  // ========== 1. 引用格式修正 ==========
  
  // 修正：[引用:xxx]\n文本 → [引用:xxx 回复:文本]
  // 匹配：[引用:关键词] 后跟换行或空白，再跟非括号文本
  const quoteOnlyPattern = /(\[引用[:\：]\s*[^\]]+\])[\s\n]+([^\[]+?)(?=\n\[|$)/g
  if (quoteOnlyPattern.test(fixed)) {
    fixed = fixed.replace(quoteOnlyPattern, (match, quote, reply) => {
      const trimmedReply = reply.trim()
      if (trimmedReply) {
        corrections.push(`引用格式：将分离的引用和回复合并`)
        // 提取引用内容，插入" 回复:"
        const quoteContent = quote.slice(1, -1)  // 去掉括号
        return `[${quoteContent} 回复:${trimmedReply}]`
      }
      return match
    })
  }

  // 修正：【引用：xxx】\n文本 → 【引用：xxx 回复：文本】
  const quoteOnlyPatternFull = /(【引用[:\：]\s*[^】]+】)[\s\n]+([^【]+?)(?=\n【|$)/g
  if (quoteOnlyPatternFull.test(fixed)) {
    fixed = fixed.replace(quoteOnlyPatternFull, (match, quote, reply) => {
      const trimmedReply = reply.trim()
      if (trimmedReply) {
        corrections.push(`引用格式：将分离的引用和回复合并（全角）`)
        const quoteContent = quote.slice(1, -1)
        return `【${quoteContent} 回复：${trimmedReply}】`
      }
      return match
    })
  }

  // ========== 2. 状态格式修正 ==========
  
  // 修正：[状态xxx] → [状态:xxx]（缺冒号）
  fixed = fixed.replace(/\[状态([^\]:\：]+)\]/g, (match, status) => {
    if (status.trim()) {
      corrections.push(`状态格式：补充冒号`)
      return `[状态:${status.trim()}]`
    }
    return match
  })

  // 修正：【状态xxx】 → 【状态：xxx】
  fixed = fixed.replace(/【状态([^】:\：]+)】/g, (match, status) => {
    if (status.trim()) {
      corrections.push(`状态格式：补充冒号（全角）`)
      return `【状态：${status.trim()}】`
    }
    return match
  })

  // ========== 3. 语音格式修正 ==========
  
  // 修正：[语音xxx] → [语音:xxx]
  fixed = fixed.replace(/\[语音([^\]:\：]+)\]/g, (match, content) => {
    if (content.trim()) {
      corrections.push(`语音格式：补充冒号`)
      return `[语音:${content.trim()}]`
    }
    return match
  })

  // ========== 4. 照片格式修正 ==========
  
  // 修正：[照片xxx] → [照片:xxx]
  fixed = fixed.replace(/\[照片([^\]:\：]+)\]/g, (match, desc) => {
    if (desc.trim()) {
      corrections.push(`照片格式：补充冒号`)
      return `[照片:${desc.trim()}]`
    }
    return match
  })

  // ========== 5. 位置格式修正 ==========
  
  // 修正：[位置xxx] → [位置:xxx]
  fixed = fixed.replace(/\[位置([^\]:\：]+)\]/g, (match, place) => {
    if (place.trim()) {
      corrections.push(`位置格式：补充冒号`)
      return `[位置:${place.trim()}]`
    }
    return match
  })

  // ========== 6. 表情格式修正 ==========
  
  // 修正：[表情xxx] → [表情:xxx]
  fixed = fixed.replace(/\[表情([^\]:\：]+)\]/g, (match, desc) => {
    if (desc.trim()) {
      corrections.push(`表情格式：补充冒号`)
      return `[表情:${desc.trim()}]`
    }
    return match
  })

  // ========== 7. 转账格式修正 ==========
  
  // 修正：[转账123说明] → [转账:123:说明]（缺冒号）
  fixed = fixed.replace(/\[转账([0-9.]+)([^\]:\：]*)\]/g, (match, amount, note) => {
    corrections.push(`转账格式：补充冒号`)
    return `[转账:${amount}:${note.trim() || ''}]`
  })

  // ========== 8. 随笔格式修正 ==========
  
  // 修正：[随笔xxx] → [随笔:xxx]
  fixed = fixed.replace(/\[随笔([^\]:\：]+)\]/g, (match, content) => {
    if (content.trim()) {
      corrections.push(`随笔格式：补充冒号`)
      return `[随笔:${content.trim()}]`
    }
    return match
  })

  // ========== 9. 外卖格式修正 ==========
  
  // 修正：[外卖商品,价格备注] → [外卖:商品,价格:备注]
  // 注意：这个比较复杂，先简单处理缺冒号的情况
  fixed = fixed.replace(/\[外卖([^\]:\：]+)\]/g, (match, content) => {
    if (content.includes(',') && !content.includes(':')) {
      corrections.push(`外卖格式：补充冒号`)
      // 尝试将第一个逗号之前的内容作为商品列表
      const firstCommaIndex = content.indexOf(',')
      if (firstCommaIndex > 0) {
        return `[外卖:${content}]`
      }
    }
    return match
  })

  // ========== 10. 代付格式修正 ==========
  
  // 类似外卖
  fixed = fixed.replace(/\[代付([^\]:\：]+)\]/g, (match, content) => {
    if (content.includes(',') && !content.includes(':')) {
      corrections.push(`代付格式：补充冒号`)
      return `[代付:${content}]`
    }
    return match
  })

  // ========== 11. 网名格式修正 ==========
  
  fixed = fixed.replace(/\[网名([^\]:\：]+)\]/g, (match, name) => {
    if (name.trim()) {
      corrections.push(`网名格式：补充冒号`)
      return `[网名:${name.trim()}]`
    }
    return match
  })

  // ========== 12. 个性签名格式修正 ==========
  
  fixed = fixed.replace(/\[个性签名([^\]:\：]+)\]/g, (match, sign) => {
    if (sign.trim()) {
      corrections.push(`个性签名格式：补充冒号`)
      return `[个性签名:${sign.trim()}]`
    }
    return match
  })

  // ========== 13. 换头像格式修正 ==========
  
  // 修正：[换头像生成描述] → [换头像:生成:描述]
  fixed = fixed.replace(/\[换头像生成([^\]:\：]+)\]/g, (match, desc) => {
    if (desc.trim()) {
      corrections.push(`换头像格式：补充冒号`)
      return `[换头像:生成:${desc.trim()}]`
    }
    return match
  })

  // ========== 14. 一起听格式修正 ==========
  
  // 修正：[一起听歌名-歌手] → [一起听:歌名:歌手]
  fixed = fixed.replace(/\[一起听([^-:\：\]]+)-([^\]]+)\]/g, (match, song, artist) => {
    corrections.push(`一起听格式：补充冒号`)
    return `[一起听:${song.trim()}:${artist.trim()}]`
  })

  // ========== 15. 切歌格式修正 ==========
  
  // 修正：[切歌歌名-歌手] → [切歌:歌名:歌手]
  fixed = fixed.replace(/\[切歌([^-:\：\]]+)-([^\]]+)\]/g, (match, song, artist) => {
    corrections.push(`切歌格式：补充冒号`)
    return `[切歌:${song.trim()}:${artist.trim()}]`
  })

  // ========== 完成修正 ==========
  
  return {
    corrected: corrections.length > 0,
    original: text,
    fixed,
    corrections
  }
}

/**
 * 手动修正最后一条AI消息格式（用于UI按钮）
 * @param lastAIMessage 最后一条AI消息内容
 * @returns 修正结果
 */
export const manualCorrectLastMessage = (lastAIMessage: string): CorrectionResult => {
  // 调用自动修正
  const result = correctAIMessageFormat(lastAIMessage)
  
  // 如果有修正，在控制台输出详细信息
  if (result.corrected) {
    console.log('🔧 [格式修正] 手动修正完成')
    console.log('📝 修正项:', result.corrections)
    console.log('📥 修正前:', result.original)
    console.log('📤 修正后:', result.fixed)
  } else {
    console.log('✅ [格式修正] 无需修正，格式正确')
  }
  
  return result
}

/**
 * 批量修正消息列表
 * @param messages 消息内容数组
 * @returns 修正结果数组
 */
export const batchCorrectMessages = (messages: string[]): CorrectionResult[] => {
  return messages.map(msg => correctAIMessageFormat(msg))
}
