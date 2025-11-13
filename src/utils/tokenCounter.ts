/**
 * Token 计数工具
 * 用于估算文本的 token 数量
 */

/**
 * 估算文本的 token 数量
 * 简单估算：中文约1个字=1 token，英文约1个词=1 token
 */
export function estimateTokens(text: string): number {
  // 🔥 修复：确保text是字符串，否则转换为字符串
  if (!text) return 0
  
  const textStr = typeof text === 'string' ? text : String(text)
  
  // 分离中文和非中文字符
  const chineseChars = textStr.match(/[\u4e00-\u9fa5]/g) || []
  const nonChineseText = textStr.replace(/[\u4e00-\u9fa5]/g, '')
  
  // 中文字符数
  const chineseTokens = chineseChars.length
  
  // 英文按空格分词，标点符号也算1个token
  const englishWords = nonChineseText.trim().split(/\s+/).filter(Boolean)
  const englishTokens = englishWords.length
  
  // 总token数（粗略估算）
  return chineseTokens + englishTokens
}

/**
 * 统计多条消息的 token 数
 */
export interface TokenStats {
  systemPrompt: number
  character: number  // 角色信息占用
  lorebook: number
  memory: number     // 记忆系统占用
  messages: number
  total: number
  remaining: number
  percentage: number
  responseTime?: number  // 响应时间（毫秒）
  outputTokens?: number  // 输出token（AI回复的token数）
  consumedTokens?: number // 实际消费的token（如果API返回）
}

export function calculateContextTokens(
  systemPrompt: string,
  lorebookContext: string,
  memoryContext: string,
  messages: string[],
  contextLimit: number = 8000,
  characterInfo?: string  // 角色信息（personality, scenario等）
): TokenStats {
  const systemTokens = estimateTokens(systemPrompt)
  const characterTokens = characterInfo ? estimateTokens(characterInfo) : 0
  const lorebookTokens = estimateTokens(lorebookContext)
  const memoryTokens = estimateTokens(memoryContext)
  const messageTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg), 0)
  
  const total = systemTokens + characterTokens + lorebookTokens + memoryTokens + messageTokens
  const remaining = Math.max(0, contextLimit - total)
  const percentage = Math.min(100, (total / contextLimit) * 100)
  
  return {
    systemPrompt: systemTokens,
    character: characterTokens,
    lorebook: lorebookTokens,
    memory: memoryTokens,
    messages: messageTokens,
    total,
    remaining,
    percentage
  }
}

/**
 * 格式化 token 数量显示
 */
export function formatTokenCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

/**
 * 格式化响应时间显示
 */
export function formatResponseTime(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${ms}ms`
}
