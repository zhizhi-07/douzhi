/**
 * 默契游戏判定服务
 * 使用AI来判断猜测是否正确（语义匹配）
 * 
 * 重要：只尝试一次代付API，失败立即本地判定，绝不用用户API
 */

// 单独的代付API配置（只用于游戏判定，避免用callZhizhiApi的重试循环）
const GAME_JUDGE_API = {
  baseUrl: 'https://api.siliconflow.cn/v1',
  apiKey: 'sk-biaugiqxfopyfosfxpggeqcitfwkwnsgkduvjavygdtpoicm',
  model: 'deepseek-ai/DeepSeek-V3'
}

interface JudgeResult {
  isCorrect: boolean
  extractedGuess: string  // 从AI回复中提取的猜测
  confidence: number      // 置信度 0-100
}

/**
 * 使用AI判断猜测是否正确
 * @param topic 正确答案
 * @param aiReply AI的回复内容
 * @param gameType 游戏类型
 */
export const judgeGuess = async (
  topic: string,
  aiReply: string,
  gameType: 'draw' | 'act'
): Promise<JudgeResult> => {
  const gameTypeName = gameType === 'draw' ? '你画我猜' : '你演我猜'
  
  const prompt = `你是一个${gameTypeName}游戏的裁判。

正确答案是：「${topic}」

玩家的回复是：
"${aiReply}"

请判断：
1. 从玩家回复中提取出他们猜测的答案（如果有多个猜测，取最可能的那个）
2. 判断猜测是否正确（允许同义词、近义词、口语化表达，如"猫"="小猫"="猫咪"="喵"）

请用JSON格式回复（不要有其他文字）：
{"guess": "提取的猜测", "correct": true或false, "confidence": 0-100的置信度}`

  try {
    // 直接单次调用代付API，3秒超时，失败立即本地判定
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(`${GAME_JUDGE_API.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GAME_JUDGE_API.apiKey}`
      },
      body: JSON.stringify({
        model: GAME_JUDGE_API.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // 解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      console.log('🎯 [游戏判定] AI判定成功:', result)
      return {
        isCorrect: result.correct === true,
        extractedGuess: result.guess || '',
        confidence: result.confidence || 0
      }
    }
  } catch (e) {
    // 任何错误都直接本地判定，不重试，不用用户API
    console.log('⚡ [游戏判定] API失败，使用本地判定')
  }
  
  // 降级：本地简单判定
  return localJudge(topic, aiReply)
}

/**
 * 本地简单判定（作为降级方案）
 * 从所有AI回复中找到最可能的猜测
 */
const localJudge = (topic: string, aiReply: string): JudgeResult => {
  const normalizedTopic = topic.toLowerCase().trim()
  const normalizedReply = aiReply.toLowerCase()
  
  // 直接检查：回复中是否包含答案
  if (normalizedReply.includes(normalizedTopic)) {
    return {
      isCorrect: true,
      extractedGuess: topic,
      confidence: 90
    }
  }
  
  // 按行分割，逐行检查（AI可能发多条消息）
  const lines = aiReply.split('\n').filter(l => l.trim().length > 0)
  
  // 常见猜测模式
  const patterns = [
    /(?:我猜|应该是|是不是|猜是|看起来像|这是|像是|好像是)[：:]?\s*([^\s，。！？,\.!\?\n]+)/gi,
    /(?:猜|答案)[：:]?\s*([^\s，。！？,\.!\?\n]+)/gi,
    /^([一二三四五六七八九十\d]*[只个条头匹朵棵])?(.{1,6})$/,  // 简短名词（如"一只猫"、"猫"）
  ]
  
  let bestGuess = ''
  
  // 先用模式匹配
  for (const line of lines) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0
      const match = pattern.exec(line)
      if (match) {
        const guess = (match[2] || match[1]).trim()
        if (guess.length >= 1 && guess.length <= 10) {
          // 检查是否匹配答案
          if (guess.toLowerCase().includes(normalizedTopic) || 
              normalizedTopic.includes(guess.toLowerCase())) {
            return {
              isCorrect: true,
              extractedGuess: guess,
              confidence: 85
            }
          }
          if (!bestGuess) bestGuess = guess
        }
      }
    }
  }
  
  // 检查每行是否是简短名词（可能是猜测）
  for (const line of lines) {
    const trimmed = line.trim()
    // 简短的行（1-8字）可能是猜测
    if (trimmed.length >= 1 && trimmed.length <= 8 && !trimmed.includes('？') && !trimmed.includes('?')) {
      // 去掉量词前缀
      const cleanGuess = trimmed.replace(/^[一二三四五六七八九十\d]*[只个条头匹朵棵块片件]/, '')
      if (cleanGuess.toLowerCase().includes(normalizedTopic) || 
          normalizedTopic.includes(cleanGuess.toLowerCase())) {
        return {
          isCorrect: true,
          extractedGuess: trimmed,
          confidence: 80
        }
      }
      if (!bestGuess && cleanGuess.length >= 1) bestGuess = trimmed
    }
  }
  
  // 没找到匹配
  return {
    isCorrect: false,
    extractedGuess: bestGuess || lines[lines.length - 1]?.slice(0, 20) || '',
    confidence: 20
  }
}
