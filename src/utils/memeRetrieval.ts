/**
 * 梗库检索模块
 * 
 * 根据用户消息匹配相关梗，推荐给AI使用
 * 避免AI读取整个梗库浪费token
 */

export interface Meme {
  id: string
  name: string
  keywords: string
  description: string
  createdAt: number
  priority?: number // 优先级 1-3，3最高，默认1
}

/**
 * 获取所有梗
 */
export function getAllMemes(): Meme[] {
  const saved = localStorage.getItem('meme_library_data')
  if (!saved) return []
  
  try {
    return JSON.parse(saved)
  } catch (error) {
    console.error('加载梗库失败:', error)
    return []
  }
}

/**
 * 检索匹配的梗
 * @param userMessage 用户消息
 * @param maxResults 最多返回数量（默认3个）
 */
export function retrieveMemes(userMessage: string, maxResults: number = 3): Meme[] {
  if (!userMessage || !userMessage.trim()) return []
  
  const allMemes = getAllMemes()
  if (allMemes.length === 0) return []
  
  const messageLower = userMessage.toLowerCase()
  
  // 计算每个梗的匹配度
  const memesWithScore: Array<{ meme: Meme; score: number }> = []
  
  for (const meme of allMemes) {
    let score = 0
    
    // 解析关键词（支持逗号、中文逗号、空格分隔）
    const keywords = (meme.keywords || '').split(/[,，\s]+/).filter(Boolean)
    
    // 关键词匹配
    keywords.forEach(keyword => {
      if (messageLower.includes(keyword.toLowerCase())) {
        score += 2 // 关键词匹配权重高
      }
    })
    
    // 梗名称匹配
    if (messageLower.includes(meme.name.toLowerCase())) {
      score += 3 // 名称完全匹配权重最高
    }
    
    if (score > 0) {
      memesWithScore.push({ meme, score })
    }
  }
  
  // 按匹配度排序，返回前N个
  return memesWithScore
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.meme)
}

/**
 * 随机获取几个梗（用于推荐）
 */
export function getRandomMemes(count: number = 2): Meme[] {
  const allMemes = getAllMemes()
  if (allMemes.length === 0) return []
  
  const shuffled = [...allMemes].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, allMemes.length))
}

/**
 * 生成梗提示词（给AI用）
 * @param matchedMemes 用户用到的梗（AI需要理解）
 * @param suggestedMemes 推荐AI使用的梗
 */
export function generateMemesPrompt(matchedMemes: Meme[], suggestedMemes: Meme[]): string {
  if (matchedMemes.length === 0 && suggestedMemes.length === 0) return ''
  
  let prompt = ''
  
  // 用户用的梗 - 帮AI理解
  if (matchedMemes.length > 0) {
    prompt += '\n【用户用了这些梗，你要懂】\n'
    matchedMemes.forEach(meme => {
      prompt += `「${meme.name}」= ${meme.description}\n`
    })
  }
  
  // 推荐AI用的梗
  if (suggestedMemes.length > 0) {
    prompt += '\n【你可以用的梗】\n'
    suggestedMemes.forEach(meme => {
      prompt += `「${meme.name}」- ${meme.description}\n`
    })
    prompt += '（自然使用，不要生硬）\n'
  }
  
  return prompt
}

/**
 * 一键检索并生成提示词
 */
export function getMemesSuggestion(userMessage: string, maxMatch: number = 3): string {
  const allMemes = getAllMemes()
  console.log('🔥 [梗库] 总共', allMemes.length, '个梗')
  console.log('🔥 [梗库] 用户消息:', userMessage)
  
  // 1. 匹配用户消息中的梗
  const matchedMemes = retrieveMemes(userMessage, maxMatch)
  console.log('🔥 [梗库] 匹配到', matchedMemes.length, '个梗:', matchedMemes.map(m => m.name))
  
  // 2. 推荐梗给AI用（排除已匹配的，按优先级排序）
  const matchedIds = new Set(matchedMemes.map(m => m.id))
  const candidates = allMemes.filter(m => !matchedIds.has(m.id))
  
  // 按优先级分组，高优先级的更容易被选中
  const highPriority = candidates.filter(m => (m.priority || 1) >= 3)
  const midPriority = candidates.filter(m => (m.priority || 1) === 2)
  const lowPriority = candidates.filter(m => (m.priority || 1) <= 1)
  
  // 优先从高优先级选，不够再从低的补
  const pool = [
    ...highPriority.sort(() => Math.random() - 0.5),
    ...midPriority.sort(() => Math.random() - 0.5),
    ...lowPriority.sort(() => Math.random() - 0.5)
  ]
  const suggestedMemes = pool.slice(0, 2)
  console.log('🔥 [梗库] 推荐', suggestedMemes.length, '个梗:', suggestedMemes.map(m => m.name))
  
  const result = generateMemesPrompt(matchedMemes, suggestedMemes)
  console.log('🔥 [梗库] 生成提示词:', result || '(空)')
  return result
}
