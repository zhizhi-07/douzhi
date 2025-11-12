/**
 * 朋友圈 AI 互动系统 - 主入口
 * 
 * 架构说明：
 * - types/momentsAI.ts: 类型定义
 * - momentsAI/dataCollector.ts: 数据收集（聊天记录、朋友圈历史）
 * - momentsAI/promptTemplate.ts: 提示词模板
 * - momentsAI/responseParser.ts: 响应解析器
 * - momentsAI/actionExecutor.ts: 动作执行器（点赞、评论、私聊）
 * - momentsAI/director.ts: 主控制器
 * 
 * 保持向后兼容，只导出必要的函数
 */

export { triggerAIMomentsInteraction } from './momentsAI/director'

// 以下代码保留用于AI主动发朋友圈（未来功能）
import type { Moment } from '../types/moments'
import { publishMoment } from './momentsManager'
import { apiService } from '../services/apiService'
import { characterService } from '../services/characterService'
import { getRecentChatHistory, formatChatContext } from './momentsAI/dataCollector'

/**
 * 获取当前API配置
 */
function getCurrentApiConfig() {
  const currentId = apiService.getCurrentId()
  return apiService.getById(currentId)
}

/**
 * AI角色主动发朋友圈
 */
export async function aiPublishMoment(characterId: string): Promise<Moment | null> {
  const character = characterService.getById(characterId)
  if (!character) return null

  const apiConfig = getCurrentApiConfig()
  if (!apiConfig) return null

  // 读取聊天记录，了解最近的状态和话题
  const chatHistory = getRecentChatHistory(characterId, 30)
  const chatContext = formatChatContext(chatHistory)

  const prompt = `# 🎭 创作一条朋友圈

## 你的身份
- 名字：${character.realName}
- 性格：${character.personality || '温柔体贴'}
- 当前心情：自然随性

## 最近的生活状态
${chatContext}

## 创作思路
<thinking>
今天我想分享点什么呢？

1. **最近状态** (根据聊天记录，我最近的生活如何？)
   - 聊天话题、情绪状态
   - 可能想分享的事情

2. **灵感来源** (什么触发了我想发朋友圈？)
   - 可以延续聊天中的话题
   - 或者分享新的生活片段

3. **情感基调** (我想表达什么情绪？)
   - 开心、感动、思考、吐槽、分享...
   - 符合最近的心情

4. **内容构思** (我要怎么表达？)
   - 真实自然，不做作
   - 符合我的性格
   - 可能会让用户感兴趣
</thinking>

## 输出要求
请用JSON格式输出：
{
  "content": "朋友圈文字内容(20-80字，真实自然，像真人发的)",
  "emotion": "情感基调",
  "hasImage": false,
  "location": "位置(可选，如：家里/公司/某个地点)"
}

注意：
- 内容要有生活气息，不要假大空
- 可以用emoji但别太多
- 像真人一样随意自然
- 可以是日常碎碎念、心情感悟、生活分享等`

  try {
    const apiUrl = `${apiConfig.baseUrl}/chat/completions`
    console.log(`🚀 开始调用API: ${apiUrl}`)
    
    // 完整的系统提示词
    const systemPrompt = `你是一个有灵魂、有生活、有情感的真实个体。你会像普通人一样在朋友圈分享生活点滴和内心感受。

## 创作指南

1. **真实自然**
   - 像真人一样随意自然，不做作
   - 可以是日常碎碎念、心情感悟、生活分享等
   - 有生活气息，不要假大空

2. **符合性格**
   - 内容要符合你的性格和说话风格
   - 考虑最近的心情和生活状态
   - 延续聊天中的话题或分享新的生活片段

3. **表达方式**
   - 可以用emoji但别太多
   - 20-80字为佳，简洁有力
   - 可以是文字、感悟、吐槽等多种形式

4. **情感基调**
   - 开心、感动、思考、吐槽、分享都可以
   - 符合最近的心情
   - 让用户感到真实和亲近`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 1.3,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    console.log('💬 AI发朋友圈回复:', content)
    
    // 提取JSON - 支持markdown格式
    let jsonStr = content
    const markdownMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (markdownMatch) {
      jsonStr = markdownMatch[1]
    } else {
      const directMatch = content.match(/\{[\s\S]*\}/)
      if (directMatch) {
        jsonStr = directMatch[0]
      }
    }
    
    try {
      const result = JSON.parse(jsonStr)
      
      // 发布朋友圈
      const moment = publishMoment(
        {
          id: characterId,
          name: character.nickname || character.realName,
          avatar: character.avatar || '🤖'
        },
        result.content,
        [],
        result.location
      )

      console.log(`📱 ${character.realName} 发布了朋友圈:`, result.content)
      console.log(`💭 情感基调: ${result.emotion}`)
      if (result.location) {
        console.log(`📍 位置: ${result.location}`)
      }
      return moment
    } catch (e) {
      console.error('⚠️ JSON解析失败:', e)
      return null
    }
  } catch (error) {
    console.error('AI发朋友圈失败:', error)
    return null
  }
}

/**
 * 定期让AI角色主动发朋友圈
 */
export function startAIMomentsSchedule(): void {
  const characters = characterService.getAll()
  
  // 每小时检查一次，每个角色有一定概率发朋友圈
  setInterval(() => {
    for (const character of characters) {
      // 每小时约1.25%的概率发朋友圈 (每天约30%概率)
      if (Math.random() < 0.0125) {
        aiPublishMoment(character.id)
      }
    }
  }, 3600000)  // 每小时
}
