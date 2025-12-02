/**
 * 梗库检索模块
 * 
 * 根据用户消息匹配相关梗，推荐给AI使用
 * 避免AI读取整个梗库浪费token
 */

// 梗库设置
export interface MemeSettings {
  enabled: boolean        // 是否启用梗推荐
  maxRecommend: number    // 最多推荐几条梗
}

export function getMemeSettings(): MemeSettings {
  const saved = localStorage.getItem('meme_settings')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      // ignore
    }
  }
  return { enabled: true, maxRecommend: 3 }
}

export function saveMemeSettings(settings: MemeSettings) {
  localStorage.setItem('meme_settings', JSON.stringify(settings))
}

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
 * @param userMessage 用户最后一条消息（用于精确匹配用户用的梗）
 * @param context 对话上下文（用于关键词匹配推荐梗）
 */
export function getMemesSuggestion(userMessage: string, context: string = ''): string {
  const settings = getMemeSettings()
  
  // 如果用户关闭了梗推荐
  if (!settings.enabled) {
    return ''
  }
  
  const maxRecommend = settings.maxRecommend || 3
  
  const allMemes = getAllMemes()
  if (allMemes.length === 0) return ''
  
  console.log('🔥 [梗库] 总共', allMemes.length, '个梗, 最多推荐', maxRecommend, '条')
  
  // 1. 精确匹配用户用的梗（按梗名称原话匹配）
  const userUsedMemes = allMemes.filter(meme => 
    userMessage.includes(meme.name)
  )
  console.log('🔥 [梗库] 用户用的梗:', userUsedMemes.map(m => m.name))
  
  // 2. 关键词匹配推荐梗（排除用户已用的）
  const usedIds = new Set(userUsedMemes.map(m => m.id))
  const recommendMemes = getRecommendMemes(context || userMessage, maxRecommend, usedIds, allMemes)
  console.log('🔥 [梗库] 推荐的梗:', recommendMemes.map(m => m.name))
  
  if (userUsedMemes.length === 0 && recommendMemes.length === 0) {
    return ''
  }
  
  // 生成提示词
  let prompt = ''
  
  // 用户用的梗 - AI要懂
  if (userUsedMemes.length > 0) {
    prompt += '\n【用户用了这些梗，你要懂】\n'
    userUsedMemes.forEach(meme => {
      prompt += `「${meme.name}」= ${meme.description}\n`
    })
  }
  
  // 推荐的梗 - AI可以用
  if (recommendMemes.length > 0) {
    prompt += '\n【当前网络热梗，可自然使用】\n'
    recommendMemes.forEach(meme => {
      prompt += `「${meme.name}」- ${meme.description}\n`
    })
  }
  
  console.log('🔥 [梗库] 生成提示词:', prompt)
  return prompt
}

/**
 * 获取推荐梗（关键词匹配 + 常用补充）
 */
function getRecommendMemes(context: string, maxCount: number, excludeIds: Set<string>, allMemes: Meme[]): Meme[] {
  const contextLower = context.toLowerCase()
  
  // 关键词匹配
  const memesWithScore: Array<{ meme: Meme; score: number }> = []
  
  for (const meme of allMemes) {
    if (excludeIds.has(meme.id)) continue
    
    let score = 0
    
    // 解析关键词，过滤太短的
    const keywords = (meme.keywords || '').split(/[,，\s]+/).filter(k => k.length >= 2)
    
    keywords.forEach(keyword => {
      if (contextLower.includes(keyword.toLowerCase())) {
        score += 2
      }
    })
    
    if (score > 0) {
      // 优先级加成
      const priorityBonus = (meme.priority || 1) * 0.5
      memesWithScore.push({ meme, score: score + priorityBonus })
    }
  }
  
  // 按匹配度排序
  const matched = memesWithScore
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map(item => item.meme)
  
  // 不够就用常用梗补充
  if (matched.length < maxCount) {
    const matchedIds = new Set(matched.map(m => m.id))
    const remaining = allMemes
      .filter(m => !excludeIds.has(m.id) && !matchedIds.has(m.id))
      .sort((a, b) => (b.priority || 1) - (a.priority || 1))
    
    const needed = maxCount - matched.length
    return [...matched, ...remaining.slice(0, needed)]
  }
  
  return matched
}

/**
 * 带优先级的关键词匹配
 */
function retrieveMemesWithPriority(userMessage: string, maxResults: number): Meme[] {
  if (!userMessage || !userMessage.trim()) return []
  
  const allMemes = getAllMemes()
  if (allMemes.length === 0) return []
  
  const messageLower = userMessage.toLowerCase()
  
  // 计算每个梗的匹配度
  const memesWithScore: Array<{ meme: Meme; score: number }> = []
  
  for (const meme of allMemes) {
    let score = 0
    
    // 解析关键词，过滤掉太短的（至少2个字符）
    const keywords = (meme.keywords || '').split(/[,，\s]+/).filter(k => k.length >= 2)
    
    // 关键词匹配 - 只匹配较长的关键词
    keywords.forEach(keyword => {
      if (messageLower.includes(keyword.toLowerCase())) {
        score += 2
      }
    })
    
    // 梗名称匹配
    if (messageLower.includes(meme.name.toLowerCase())) {
      score += 3
    }
    
    // 只有匹配到关键词才加入结果
    if (score > 0) {
      // 优先级加成
      const priorityBonus = (meme.priority || 1) * 0.5
      memesWithScore.push({ meme, score: score + priorityBonus })
    }
  }
  
  // 按匹配度排序
  return memesWithScore
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.meme)
}
