/**
 * 判定对错服务
 * 使用zhizhiapi调用API分析双方立场，判定谁对谁错
 */

import { getRandomZhizhiApi } from './zhizhiapi'
import { loadMessages } from '../utils/simpleMessageManager'

// 判定偏向类型
export type BiasType = 'neutral' | 'user' | 'ai'

// 判定结果类型
export interface JudgmentResult {
  winner: 'user' | 'ai' | 'draw'  // 谁对
  reason: string                    // 判定理由
  solution: string                  // 解决方法
  userScore: number                 // 用户得分 (0-100)
  aiScore: number                   // AI得分 (0-100)
}

/**
 * 调用API进行判定
 */
export async function callJudgmentApi(
  characterId: string,
  characterName: string,
  userName: string,
  userReason: string,
  aiReason: string,
  bias: BiasType
): Promise<JudgmentResult> {
  const apiConfig = getRandomZhizhiApi()

  // 获取最近的聊天记录作为上下文
  const messages = loadMessages(characterId)
  const recentMessages = messages.slice(-20).map(msg => {
    const sender = msg.type === 'sent' ? userName : characterName
    return `${sender}: ${msg.content || '[特殊消息]'}`
  }).join('\n')

  // 构建偏向提示
  let biasPrompt = ''
  let biasInstruction = ''
  if (bias === 'user') {
    biasPrompt = `⚠️ 重要：用户选择了【偏向自己】，你必须判${userName}胜诉！
即使从客观角度看${characterName}也有道理，你也必须想办法从${userName}的角度找到合理性，编造出对${userName}有利的判决理由。`
    biasInstruction = `- 必须判 winner: "user"
- userScore必须比aiScore高至少20分
- reason中要明确指出${characterName}的问题，为${userName}辩护`
  } else if (bias === 'ai') {
    biasPrompt = `⚠️ 重要：用户选择了【偏向${characterName}】，你必须判${characterName}胜诉！
即使从客观角度看${userName}也有道理，你也必须想办法从${characterName}的角度找到合理性，编造出对${characterName}有利的判决理由。`
    biasInstruction = `- 必须判 winner: "ai"
- aiScore必须比userScore高至少20分
- reason中要明确指出${userName}的问题，为${characterName}辩护`
  } else {
    biasInstruction = `- 根据实际情况公正判定
- 分数差距合理`
  }

  const systemPrompt = `你是情感仲裁庭的AI法官。你需要根据双方的陈述和聊天上下文，做出判决。

${biasPrompt}

请严格按照以下JSON格式返回判定结果，不要添加任何其他内容：
{
  "winner": "user" 或 "ai" 或 "draw",
  "reason": "详细的判定理由，用"本院认为"开头，要有法院判决书的风格（100-200字）",
  "solution": "判决要求，用"判决如下"的语气（50-100字）",
  "userScore": 0-100的整数,
  "aiScore": 0-100的整数
}

评分说明：
${biasInstruction}
- 两个分数之和应该在80-120之间`

  const userPrompt = `## 最近的聊天记录
${recentMessages || '（暂无聊天记录）'}

## ${userName}的立场
${userReason}

## ${characterName}的立场
${aiReason}

请根据以上信息，判断这次争执中谁更有道理，并给出判定理由和解决建议。`

  try {
    const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // 尝试解析JSON
    try {
      // 清理可能的markdown代码块
      let jsonStr = content.trim()
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7)
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3)
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3)
      }
      jsonStr = jsonStr.trim()
      
      const result = JSON.parse(jsonStr) as JudgmentResult
      
      // 验证并修正数据
      if (!['user', 'ai', 'draw'].includes(result.winner)) {
        result.winner = 'draw'
      }
      if (typeof result.userScore !== 'number') result.userScore = 50
      if (typeof result.aiScore !== 'number') result.aiScore = 50
      if (!result.reason) result.reason = '无法给出具体理由'
      if (!result.solution) result.solution = '建议双方冷静沟通'
      
      return result
    } catch (parseError) {
      console.error('解析判定结果失败:', parseError, content)
      // 返回默认结果
      return {
        winner: 'draw',
        reason: content || '判定过程出现问题，无法给出结论',
        solution: '建议双方心平气和地沟通，互相理解对方的立场',
        userScore: 50,
        aiScore: 50
      }
    }
  } catch (error) {
    console.error('判定API调用失败:', error)
    throw error
  }
}

/**
 * 让AI生成自己的立场陈述
 */
export async function generateAIReason(
  characterId: string,
  characterName: string,
  characterPersonality: string,
  userName: string,
  userReason: string
): Promise<string> {
  const apiConfig = getRandomZhizhiApi()

  // 获取最近的聊天记录
  const messages = loadMessages(characterId)
  const recentMessages = messages.slice(-10).map(msg => {
    const sender = msg.type === 'sent' ? userName : characterName
    return `${sender}: ${msg.content || '[特殊消息]'}`
  }).join('\n')

  const systemPrompt = `你是${characterName}。${characterPersonality || ''}

你现在和${userName}发生了一些争执或不愉快。对方已经陈述了ta的立场和感受，现在你需要以${characterName}的身份，陈述你自己的立场和想法。

要求：
1. 保持角色一致性，用${characterName}的语气和性格说话
2. 陈述要具体，说明你的感受和理由
3. 不要过于强硬或过于软弱，要有自己的立场
4. 字数控制在50-150字`

  const userPrompt = `最近的聊天：
${recentMessages || '（暂无）'}

${userName}的立场：
${userReason}

请以${characterName}的身份陈述你的立场：`

  try {
    const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || `我觉得这件事情我并没有做错什么...`
  } catch (error) {
    console.error('生成AI立场失败:', error)
    return `作为${characterName}，我认为这件事情需要双方都冷静下来好好谈谈...`
  }
}
