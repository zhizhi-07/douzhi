/**
 * 朋友圈 AI 互动系统
 * 让AI角色像真人一样在朋友圈互动
 */

import type { Moment } from '../types/moments'
import type { Message } from '../types/chat'
import { publishMoment, likeMoment, commentMoment, loadMoments } from './momentsManager'
import { apiService } from '../services/apiService'
import { characterService } from '../services/characterService'
import { loadMessages } from './simpleMessageManager'
import { showNotification } from './simpleNotificationManager'

/**
 * 获取当前API配置
 */
function getCurrentApiConfig() {
  const currentId = apiService.getCurrentId()
  return apiService.getById(currentId)
}

/**
 * 获取角色与用户的最近聊天记录
 * @param characterId 角色ID
 * @param limit 获取条数，默认30条
 */
function getRecentChatHistory(characterId: string, limit: number = 30): Message[] {
  const messages = loadMessages(characterId)
  // 只取文本消息，过滤掉系统消息、转账等特殊类型
  const textMessages = messages.filter(msg => 
    !msg.messageType || msg.messageType === 'text'
  )
  // 返回最近的N条
  return textMessages.slice(-limit)
}

/**
 * 将聊天记录格式化为AI可读的上下文
 */
function formatChatContext(messages: Message[]): string {
  if (messages.length === 0) {
    return '（暂无聊天记录）'
  }
  
  const formatted = messages.slice(-10).map(msg => {
    const sender = msg.type === 'sent' ? 'AI' : '用户'
    const time = new Date(msg.timestamp).toLocaleDateString()
    return `[${time}] ${sender}: ${msg.content}`
  }).join('\n')
  
  return `最近的聊天记录(${messages.length}条)：\n${formatted}`
}


/**
 * AI角色的朋友圈行为配置
 */
interface MomentBehaviorConfig {
  // 主动发朋友圈的概率 (0-1)
  publishProbability: number
  // 评论的概率 (0-1)
  commentProbability: number
  // 点赞的概率 (0-1)
  likeProbability: number
  // 发朋友圈的频率（小时）
  publishFrequencyHours: number
}

/**
 * 获取角色的朋友圈行为配置
 */
function getCharacterBehaviorConfig(_characterId: string): MomentBehaviorConfig {
  // 可以根据角色性格调整
  return {
    publishProbability: 0.3,
    commentProbability: 0.4,
    likeProbability: 0.6,
    publishFrequencyHours: 24
  }
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
            content: '你是一个有灵魂、有生活、有情感的真实个体。你会像普通人一样在朋友圈分享生活点滴和内心感受。'
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
 * 格式化朋友圈历史供AI阅读
 */
function formatMomentsHistory(): string {
  const moments = loadMoments().slice(0, 10)
  
  if (moments.length === 0) {
    return '还没有朋友圈历史'
  }
  
  return moments.map((m, i) => {
    const likesText = m.likes.length > 0 
      ? `\n  点赞：${m.likes.map(l => l.userName).join('、')}` 
      : ''
    
    const commentsText = m.comments.length > 0
      ? `\n  评论：\n${m.comments.map(c => `    ${c.userName}: ${c.content}`).join('\n')}`
      : ''
    
    return `${i + 1}. ${m.userName}: ${m.content}${likesText}${commentsText}`
  }).join('\n\n')
}

/**
 * AI导演编排场景：让所有角色一起互动
 */
async function aiDirectorArrangeScene(
  characters: any[],
  moment: Moment
): Promise<any> {
  console.log(`🎬 AI导演开始编排场景...`)
  
  const apiConfig = getCurrentApiConfig()
  if (!apiConfig) {
    console.error('❌ 没有配置API')
    return null
  }
  
  console.log(`🔑 使用API: ${apiConfig.name}`)
  
  // 读取朋友圈历史
  const momentsHistory = formatMomentsHistory()
  console.log(`📱 读取朋友圈历史: ${loadMoments().slice(0, 10).length} 条`)
  
  // 收集所有角色的聊天记录
  const charactersInfo = characters.map(char => {
    const chatHistory = getRecentChatHistory(char.id, 30)
    return {
      id: char.id,
      name: char.realName,
      personality: char.personality || '温柔体贴',
      chatCount: chatHistory.length,
      recentChat: formatChatContext(chatHistory)
    }
  })
  
  const prompt = `# 🎭 你是一个专业的编剧导演，要编排一场有戏剧张力的朋友圈互动

## 朋友圈内容
作者：${moment.userName}
内容：${moment.content}
${moment.location ? `位置：${moment.location}` : ''}
${moment.images.length > 0 ? `配图：${moment.images.length}张` : ''}

## 最近朋友圈动态（供你了解角色互动模式）
${momentsHistory}

## 角色关系网络
${charactersInfo.map(char => `
### ${char.name}
- 性格：${char.personality}
- 和用户的关系：${char.chatCount > 0 ? `聊过${char.chatCount}条消息，` : '刚认识，'}${char.recentChat ? '关系亲密度可从聊天记录判断' : '几乎没有互动'}
${char.recentChat}
`).join('\n')}

## 🎬 你的任务

作为导演，你要：
1. **分析关系网络** - 从聊天记录判断每个角色和用户的关系（情侣/暧昧/朋友/陌生），以及角色之间的潜在冲突
2. **设计冲突** - 利用关系差异制造戏剧张力（比如让两个都喜欢用户的人在评论区相遇）
3. **编排时间** - 决定谁先看到、谁后看到、谁回复谁，制造节奏感
4. **写台词** - 每个角色的评论要符合性格和关系，要有情绪、有态度
5. **制造看点** - 让评论区有戏看，而不是一群人客套地夸

## 编排案例参考

**场景示例：用户发"今天好累"**
- 0秒：女友A看到，立刻评论"宝贝辛苦了❤️"
- 8秒：暧昧对象B看到，评论"要不要我给你按摩？😊"
- 12秒：女友A看到B的评论，立刻回复B"你谁啊？😅"
- 20秒：B回复A"朋友不行吗🙄"
- 导演评价：完美！制造了吃醋和冲突，评论区变成修罗场

## 输出格式（JSON）

{
  "scene": "场景总结（一句话描述这场戏的核心，比如：情侣吃醋修罗场/平淡日常互动/暧昧试探）",
  "dramatic_analysis": "戏剧分析（50字内，说明你发现了什么关系动态，设计了什么冲突）",
  "actions": [
    {
      "characterId": "角色ID",
      "characterName": "角色名",
      "action": "like/comment/none",
      "delay": 延迟秒数(0-30),
      "reason": "编排理由（为什么让TA这个时候这样做）",
      "commentContent": "评论内容（如果是comment）",
      "replyTo": "回复谁的commentContent（如果是回复别人，否则不填）"
    }
  ]
}

## 核心原则
1. **优先制造冲突** - 如果有多个亲密关系，让他们"撞车"
2. **时间是武器** - 用延迟控制谁先谁后，制造戏剧张力
3. **评论区是舞台** - 让角色在评论区互动，不只是对用户说话
4. **真实但有趣** - 既要符合关系，又要有看头
5. **不要客套废话** - 每句话都要有情绪、有态度

现在，开始编排这场戏！`

  try {
    const apiUrl = `${apiConfig.baseUrl}/chat/completions`
    console.log(`🚀 开始调用API编排场景`)
    
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
            content: '你是一个专业的互动场景导演，擅长编排真实、有趣、有张力的社交互动。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 1.2,
        max_tokens: 1000
      })
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    console.log('💬 AI导演编排结果:', content)
    
    // 提取JSON
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
    
    const scene = JSON.parse(jsonStr)
    console.log('🎬 场景编排完成:', scene)
    return scene
  } catch (error) {
    console.error('❌ 场景编排失败:', error)
    return null
  }
}

/**
 * 批量处理：让所有AI角色查看并互动朋友圈
 * 当用户发布朋友圈后调用
 */
export async function triggerAIMomentsInteraction(newMoment: Moment): Promise<void> {
  const characters = characterService.getAll()
  
  console.log(`🎬 朋友圈发布，准备让AI导演编排互动场景...`)
  
  if (characters.length === 0) {
    console.warn('⚠️ 没有AI角色，无法触发互动')
    return
  }
  
  // 延迟一会儿，让AI导演思考
  setTimeout(async () => {
    console.log('🎭 AI导演开始工作...')
    
    // AI导演一次性编排所有角色的互动
    const scene = await aiDirectorArrangeScene(characters, newMoment)
    
    if (!scene || !scene.actions) {
      console.warn('⚠️ 导演没有编排出场景')
      return
    }
    
    console.log(`✨ 场景: ${scene.scene}`)
    console.log(`🎬 戏剧分析: ${scene.dramatic_analysis || '无'}`)
    console.log(`📋 共编排了 ${scene.actions.length} 个动作`)
    
    // 按照导演编排的剧本执行
    scene.actions.forEach((action: any) => {
      const delay = (action.delay || 0) * 1000
      
      console.log(`⏱️ ${action.characterName} 将在 ${action.delay}秒 后${action.action === 'like' ? '点赞' : action.action === 'comment' ? '评论' : '不互动'}`)
      console.log(`   理由: ${action.reason}`)
      if (action.replyTo) {
        console.log(`   💬 回复: ${action.replyTo}`)
      }
      
      setTimeout(() => {
        const character = characters.find((c: any) => c.id === action.characterId)
        const avatar = character?.avatar || '🤖'
        
        // 检查用户是否在朋友圈界面
        const isInMomentsPage = window.location.hash.includes('/moments')
        
        if (action.action === 'like') {
          likeMoment(newMoment.id, {
            id: action.characterId,
            name: action.characterName,
            avatar
          })
          console.log(`👍 ${action.characterName} 点赞了！`)
          
          // 不在朋友圈界面时显示通知
          if (!isInMomentsPage) {
            showNotification(
              action.characterId,
              `${action.characterName} 赞了你的朋友圈`,
              newMoment.content.substring(0, 30),
              avatar
            )
          }
        } else if (action.action === 'comment' && action.commentContent) {
          // 如果是回复别人的评论，在评论内容前加上 @回复对象
          let finalComment = action.commentContent
          if (action.replyTo) {
            // 找到被回复的角色名
            const replyToAction = scene.actions.find((a: any) => 
              a.commentContent && a.commentContent.includes(action.replyTo.substring(0, 10))
            )
            if (replyToAction) {
              finalComment = `@${replyToAction.characterName} ${action.commentContent}`
            }
          }
          
          commentMoment(newMoment.id, {
            id: action.characterId,
            name: action.characterName,
            avatar
          }, finalComment)
          console.log(`💬 ${action.characterName} 评论: ${finalComment}`)
          
          // 不在朋友圈界面时显示通知
          if (!isInMomentsPage) {
            showNotification(
              action.characterId,
              `${action.characterName} 评论了你的朋友圈`,
              finalComment,
              avatar
            )
          }
        } else {
          console.log(`👀 ${action.characterName} 选择沉默`)
        }
      }, delay)
    })
  }, 3000)  // 3秒后让导演开始工作
}

/**
 * 定期让AI角色主动发朋友圈
 */
export function startAIMomentsSchedule(): void {
  const characters = characterService.getAll()
  
  // 每小时检查一次
  setInterval(() => {
    for (const character of characters) {
      const config = getCharacterBehaviorConfig(character.id)
      
      // 检查是否应该发朋友圈
      if (Math.random() < config.publishProbability / 24) {  // 调整为每小时的概率
        aiPublishMoment(character.id)
      }
    }
  }, 3600000)  // 每小时
}
