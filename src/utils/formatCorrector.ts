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
  
  // 🔥 放宽规则：只要中括号里包含"引用"就修正
  // 匹配：[引用xxx] 或 [xxx引用xxx] 等各种变体
  fixed = fixed.replace(/\[([^[\]]*?引用[^[\]]*?)\]/g, (match, content) => {
    // 提取引用内容：去掉"引用了xx消息"之类的前缀，提取核心内容
    let cleaned = content
      .replace(/引用了?(?:我|你)的?消息[:\：]?\s*/g, '')
      .replace(/^引用[:\：]?\s*/g, '')
      .replace(/[""]([^""]+)[""]/, '$1')  // 去掉引号
      .trim()
    
    if (cleaned) {
      corrections.push(`引用格式：统一为标准格式`)
      return `[引用:${cleaned}]`
    }
    return match
  })

  // 🔥 全角：【引用xxx】
  fixed = fixed.replace(/【([^【】]*?引用[^【】]*?)】/g, (match, content) => {
    let cleaned = content
      .replace(/引用了?(?:我|你)的?消息[:\：]?\s*/g, '')
      .replace(/^引用[:\：]?\s*/g, '')
      .replace(/[""]([^""]+)[""]/, '$1')
      .trim()
    
    if (cleaned) {
      corrections.push(`引用格式：统一为标准格式（全角）`)
      return `【引用：${cleaned}】`
    }
    return match
  })

  // 修正：[引用:xxx]\n文本 → [引用:xxx 回复:文本]
  // 匹配：[引用:关键词] 后跟换行或空白，再跟非括号文本
  fixed = fixed.replace(/(\[引用[:\：]\s*[^\]]+\])[\s\n]+([^\[]+?)(?=\n\[|$)/g, (_match, quote, reply) => {
    const trimmedReply = reply.trim()
    if (trimmedReply) {
      corrections.push(`引用格式：将分离的引用和回复合并`)
      // 提取引用内容，插入" 回复:"
      const quoteContent = quote.slice(1, -1)  // 去掉括号
      return `[${quoteContent} 回复:${trimmedReply}]`
    }
    return quote + '\n' + reply
  })

  // 修正：【引用：xxx】\n文本 → 【引用：xxx 回复：文本】
  fixed = fixed.replace(/(【引用[:\：]\s*[^】]+】)[\s\n]+([^【]+?)(?=\n【|$)/g, (_match, quote, reply) => {
    const trimmedReply = reply.trim()
    if (trimmedReply) {
      corrections.push(`引用格式：将分离的引用和回复合并（全角）`)
      const quoteContent = quote.slice(1, -1)
      return `【${quoteContent} 回复：${trimmedReply}】`
    }
    return quote + '\n' + reply
  })

  // ========== 2. 状态格式修正 ==========
  
  // 🔥 只要包含"状态"就修正
  fixed = fixed.replace(/\[([^\[\]]*?状态[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content.replace(/^状态[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`状态格式：统一为标准格式`)
      return `[状态:${cleaned}]`
    }
    return match
  })

  fixed = fixed.replace(/【([^【】]*?状态[^【】]*?)】/g, (match, content) => {
    let cleaned = content.replace(/^状态[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`状态格式：统一为标准格式（全角）`)
      return `【状态：${cleaned}】`
    }
    return match
  })

  // ========== 3. 语音格式修正 ==========
  
  // 🔥 只要包含"语音"就修正
  fixed = fixed.replace(/\[([^\[\]]*?语音[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content.replace(/^语音[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`语音格式：统一为标准格式`)
      return `[语音:${cleaned}]`
    }
    return match
  })

  // ========== 4. 照片格式修正 ==========
  
  // 🔥 只要包含"照片"就修正
  fixed = fixed.replace(/\[([^\[\]]*?照片[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content
      .replace(/(?:你|我)发了?照片[:\：]?\s*/g, '')
      .replace(/^照片[:\：]?\s*/g, '')
      .trim()
    if (cleaned) {
      corrections.push(`照片格式：统一为标准格式`)
      return `[照片:${cleaned}]`
    }
    return match
  })

  // ========== 5. 位置格式修正 ==========
  
  // 🔥 只要包含"位置"就修正
  fixed = fixed.replace(/\[([^\[\]]*?位置[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content.replace(/^位置[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`位置格式：统一为标准格式`)
      return `[位置:${cleaned}]`
    }
    return match
  })

  // ========== 6. 表情格式修正 ==========
  
  // 🔥 只要包含"表情"就修正
  fixed = fixed.replace(/\[([^\[\]]*?表情(?:包)?[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content
      .replace(/(?:你|我)发了?表情(?:包)?[:\：]?\s*/g, '')
      .replace(/^表情(?:包)?[:\：]?\s*/g, '')
      .trim()
    if (cleaned) {
      corrections.push(`表情格式：统一为标准格式`)
      return `[表情:${cleaned}]`
    }
    return match
  })

  // ========== 7. 转账格式修正 ==========
  
  // 🔥 宽松匹配：只要包含"转账"就尝试修正
  fixed = fixed.replace(/\[([^\[\]]*?转账[^\[\]]*?)\]/g, (match, content) => {
    // 如果已经是标准格式（转账:数字:说明），跳过
    if (/^转账[:\：]\s*[¥￥]?\s*\d+\.?\d*/.test(content)) {
      return match
    }
    
    // 提取金额（支持：转账123、转账¥123、转账 123元等）
    const amountMatch = content.match(/转账[^0-9]*?([¥￥]?\s*\d+\.?\d*)\s*元?/)
    if (amountMatch) {
      const amount = amountMatch[1].replace(/[¥￥\s]/g, '')
      // 提取说明（金额后面的内容）
      const noteMatch = content.match(/转账[^0-9]*?[¥￥]?\s*\d+\.?\d*\s*元?[:\：]?\s*(.+)/)
      const note = noteMatch ? noteMatch[1].trim() : ''
      corrections.push(`转账格式：统一为标准格式`)
      return `[转账:${amount}:${note}]`
    }
    
    // 如果只有"转账"二字，可能是其他指令的一部分，保持原样
    return match
  })
  
  // 修正：[转账123说明] → [转账:123:说明]（缺冒号）
  fixed = fixed.replace(/\[转账([0-9.]+)([^\]:\：]*)\]/g, (_match, amount, note) => {
    corrections.push(`转账格式：补充冒号`)
    return `[转账:${amount}:${note.trim() || ''}]`
  })

  // ========== 7.5. 亲密付格式修正 ==========
  
  // 修正：[亲密付3000] → [亲密付:3000]（缺冒号）
  // 支持：[亲密付:月额度3000] → [亲密付:月额度:3000]
  fixed = fixed.replace(/\[亲密付([^\]:\：]*?)(\d+\.?\d*)\]/g, (_match, prefix, amount) => {
    const trimmedPrefix = prefix.trim()
    if (trimmedPrefix) {
      // 有前缀（如"月额度"），确保两个冒号都存在
      corrections.push(`亲密付格式：补充冒号`)
      return `[亲密付:${trimmedPrefix}:${amount}]`
    } else {
      // 无前缀，只需一个冒号
      corrections.push(`亲密付格式：补充冒号`)
      return `[亲密付:${amount}]`
    }
  })
  
  // 修正：【亲密付3000】 → 【亲密付：3000】
  fixed = fixed.replace(/【亲密付([^】:\：]*?)(\d+\.?\d*)】/g, (_match, prefix, amount) => {
    const trimmedPrefix = prefix.trim()
    if (trimmedPrefix) {
      corrections.push(`亲密付格式：补充冒号（全角）`)
      return `【亲密付：${trimmedPrefix}：${amount}】`
    } else {
      corrections.push(`亲密付格式：补充冒号（全角）`)
      return `【亲密付：${amount}】`
    }
  })

  // ========== 8. 随笔格式修正 ==========
  
  // 🔥 只要包含"随笔"就修正
  fixed = fixed.replace(/\[([^\[\]]*?随笔[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content.replace(/^随笔[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`随笔格式：统一为标准格式`)
      return `[随笔:${cleaned}]`
    }
    return match
  })

  fixed = fixed.replace(/【([^【】]*?随笔[^【】]*?)】/g, (match, content) => {
    let cleaned = content.replace(/^随笔[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`随笔格式：统一为标准格式（全角）`)
      return `【随笔：${cleaned}】`
    }
    return match
  })

  // ========== 9. 外卖格式修正 ==========
  
  // 🔥 只要包含"外卖"就修正
  fixed = fixed.replace(/\[([^\[\]]*?外卖[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content.replace(/^外卖[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`外卖格式：统一为标准格式`)
      return `[外卖:${cleaned}]`
    }
    return match
  })

  fixed = fixed.replace(/【([^【】]*?外卖[^【】]*?)】/g, (match, content) => {
    let cleaned = content.replace(/^外卖[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`外卖格式：统一为标准格式（全角）`)
      return `【外卖：${cleaned}】`
    }
    return match
  })

  // ========== 10. 代付格式修正 ==========
  
  // 🔥 只要包含"代付"就修正
  fixed = fixed.replace(/\[([^\[\]]*?代付[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content.replace(/^代付[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`代付格式：统一为标准格式`)
      return `[代付:${cleaned}]`
    }
    return match
  })

  fixed = fixed.replace(/【([^【】]*?代付[^【】]*?)】/g, (match, content) => {
    let cleaned = content.replace(/^代付[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`代付格式：统一为标准格式（全角）`)
      return `【代付：${cleaned}】`
    }
    return match
  })

  // ========== 11. 网名格式修正 ==========
  
  fixed = fixed.replace(/\[网名([^\]:\：]+)\]/g, (_match, name) => {
    if (name.trim()) {
      corrections.push(`网名格式：补充冒号`)
      return `[网名:${name.trim()}]`
    }
    return `[网名${name}]`
  })

  // ========== 12. 个性签名格式修正 ==========
  
  fixed = fixed.replace(/\[个性签名([^\]:\：]+)\]/g, (_match, sign) => {
    if (sign.trim()) {
      corrections.push(`个性签名格式：补充冒号`)
      return `[个性签名:${sign.trim()}]`
    }
    return `[个性签名${sign}]`
  })

  // ========== 13. 换头像格式修正 ==========
  
  // 修正：[换头像生成描述] → [换头像:生成:描述]
  fixed = fixed.replace(/\[换头像生成([^\]:\：]+)\]/g, (_match, desc) => {
    if (desc.trim()) {
      corrections.push(`换头像格式：补充冒号`)
      return `[换头像:生成:${desc.trim()}]`
    }
    return `[换头像生成${desc}]`
  })

  // ========== 14. 一起听格式修正 ==========
  
  // 修正：[一起听歌名-歌手] → [一起听:歌名:歌手]
  fixed = fixed.replace(/\[一起听([^-:\：\]]+)-([^\]]+)\]/g, (_match, song, artist) => {
    corrections.push(`一起听格式：补充冒号`)
    return `[一起听:${song.trim()}:${artist.trim()}]`
  })

  // ========== 15. 切歌格式修正 ==========
  
  // 修正：[切歌歌名-歌手] → [切歌:歌名:歌手]
  fixed = fixed.replace(/\[切歌([^-:\：\]]+)-([^\]]+)\]/g, (_match, song, artist) => {
    corrections.push(`切歌格式：补充冒号`)
    return `[切歌:${song.trim()}:${artist.trim()}]`
  })

  // ========== 16. 帖子格式修正 ==========
  
  // 🔥 只要包含"帖子"就修正
  fixed = fixed.replace(/\[([^\[\]]*?帖子[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content.replace(/^帖子[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`帖子格式：统一为标准格式`)
      return `[帖子:${cleaned}]`
    }
    return match
  })

  fixed = fixed.replace(/【([^【】]*?帖子[^【】]*?)】/g, (match, content) => {
    let cleaned = content.replace(/^帖子[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`帖子格式：统一为标准格式（全角）`)
      return `【帖子：${cleaned}】`
    }
    return match
  })

  // ========== 17. 相册格式修正 ==========
  
  // 🔥 只要包含"相册"就修正
  fixed = fixed.replace(/\[([^\[\]]*?相册[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content.replace(/^相册[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`相册格式：统一为标准格式`)
      return `[相册:${cleaned}]`
    }
    return match
  })

  fixed = fixed.replace(/【([^【】]*?相册[^【】]*?)】/g, (match, content) => {
    let cleaned = content.replace(/^相册[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`相册格式：统一为标准格式（全角）`)
      return `【相册：${cleaned}】`
    }
    return match
  })

  // ========== 18. 留言格式修正 ==========
  
  // 🔥 只要包含"留言"就修正
  fixed = fixed.replace(/\[([^\[\]]*?留言[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content.replace(/^留言[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`留言格式：统一为标准格式`)
      return `[留言:${cleaned}]`
    }
    return match
  })

  fixed = fixed.replace(/【([^【】]*?留言[^【】]*?)】/g, (match, content) => {
    let cleaned = content.replace(/^留言[:\：]?\s*/g, '').trim()
    if (cleaned) {
      corrections.push(`留言格式：统一为标准格式（全角）`)
      return `【留言：${cleaned}】`
    }
    return match
  })

  // ========== 19. 撤回消息格式修正 ==========
  
  // 🔥 只要包含"撤回"就修正
  fixed = fixed.replace(/\[([^\[\]]*?撤回[^\[\]]*?)\]/g, (match, content) => {
    let cleaned = content
      .replace(/(?:我)?撤回(?:了)?(?:一条)?消息[:\：]?\s*/g, '')
      .replace(/^撤回消息[:\：]?\s*/g, '')
      .replace(/[""]/g, '')
      .trim()
    if (cleaned) {
      corrections.push(`撤回消息格式：统一为标准格式`)
      return `[撤回消息:${cleaned}]`
    }
    return match
  })

  fixed = fixed.replace(/【([^【】]*?撤回[^【】]*?)】/g, (match, content) => {
    let cleaned = content
      .replace(/(?:我)?撤回(?:了)?(?:一条)?消息[:\：]?\s*/g, '')
      .replace(/^撤回消息[:\：]?\s*/g, '')
      .replace(/[""]/g, '')
      .trim()
    if (cleaned) {
      corrections.push(`撤回消息格式：统一为标准格式（全角）`)
      return `【撤回消息：${cleaned}】`
    }
    return match
  })

  // ========== 20. 接收转账格式修正 ==========
  
  // 🔥 宽松匹配：接收转账、收款、收下转账等
  fixed = fixed.replace(/\[([^\[\]]*?(?:接收|收下|收款)[^\[\]]*?转账[^\[\]]*?)\]/g, () => {
    corrections.push(`接收转账格式：统一为标准格式`)
    return `[接收转账]`
  })
  
  fixed = fixed.replace(/\[([^\[\]]*?转账[^\[\]]*?(?:接收|接受|收下)[^\[\]]*?)\]/g, () => {
    corrections.push(`接收转账格式：统一为标准格式`)
    return `[接收转账]`
  })
  
  // ========== 21. 退还转账格式修正 ==========
  
  // 🔥 宽松匹配：退还、拒绝转账等
  fixed = fixed.replace(/\[([^\[\]]*?(?:退还|拒绝)[^\[\]]*?(?:转账)?[^\[\]]*?)\]/g, (match, content) => {
    // 避免误匹配其他内容
    if (content.includes('转账') || /^(?:退还|拒绝)$/.test(content.trim())) {
      corrections.push(`退还转账格式：统一为标准格式`)
      return `[退还转账]`
    }
    return match
  })
  
  fixed = fixed.replace(/\[([^\[\]]*?转账[^\[\]]*?(?:退还|拒绝|退回)[^\[\]]*?)\]/g, () => {
    corrections.push(`退还转账格式：统一为标准格式`)
    return `[退还转账]`
  })
  
  // ========== 22. 情侣空间格式修正 ==========
  
  // 🔥 宽松匹配：情侣空间相关指令
  fixed = fixed.replace(/\[([^\[\]]*?(?:接受|同意|拒绝|驳回)[^\[\]]*?情侣空间[^\[\]]*?)\]/g, (match, content) => {
    if (content.includes('接受') || content.includes('同意')) {
      corrections.push(`情侣空间格式：统一为标准格式`)
      return `[接受情侣空间]`
    } else if (content.includes('拒绝') || content.includes('驳回')) {
      corrections.push(`情侣空间格式：统一为标准格式`)
      return `[拒绝情侣空间]`
    }
    return match
  })
  
  fixed = fixed.replace(/\[([^\[\]]*?情侣空间[^\[\]]*?(?:接受|同意|拒绝|驳回)[^\[\]]*?)\]/g, (match, content) => {
    if (content.includes('接受') || content.includes('同意')) {
      corrections.push(`情侣空间格式：统一为标准格式`)
      return `[接受情侣空间]`
    } else if (content.includes('拒绝') || content.includes('驳回')) {
      corrections.push(`情侣空间格式：统一为标准格式`)
      return `[拒绝情侣空间]`
    }
    return match
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
