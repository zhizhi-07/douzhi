/**
 * AI生成个性化行程服务
 */

// 临时注释掉API调用，后续完善
// import { callAIApiWithCharacter } from '../services/apiService'
import type { ScheduleItem } from '../utils/aiScheduleHistory'

interface GenerateScheduleParams {
  characterId: string
  character: any
  userName?: string
}

/**
 * 构建行程生成的系统提示词
 */
async function buildSchedulePrompt(character: any, userName: string = '用户'): Promise<string> {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('zh-CN', { 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
  
  // TODO: 后续可以添加聊天记录分析
  const chatContext = ''
  
  // 获取世界书内容
  let lorebookContext = ''
  try {
    const { lorebookManager } = await import('../utils/lorebookSystem')
    const lorebooks = lorebookManager.getCharacterLorebooks(character.id)
    if (lorebooks.length > 0) {
      const allEntries: string[] = []
      for (const lorebook of lorebooks) {
        const enabledEntries = lorebook.entries.filter(e => e.enabled && e.constant)
        for (const entry of enabledEntries) {
          allEntries.push(`【${entry.name || '相关信息'}】\n${entry.content}`)
        }
      }
      if (allEntries.length > 0) {
        lorebookContext = `\n世界观设定：\n${allEntries.join('\n\n')}`
      }
    }
  } catch (e) {
    console.log('未找到世界书系统')
  }
  
  return `你是${character.realName}，现在需要根据你的性格和今天的经历，生成一份符合你个人风格的今日行程安排。

角色信息：
- 姓名：${character.realName}
- 性格设定：${character.personality || '普通人'}
- 个性签名：${character.signature || '无'}
- 世界背景：${character.world || '现代都市'}${lorebookContext}

当前时间：${dateStr} ${timeStr}${chatContext}

请根据以上信息，生成一份7-8个时间段的今日行程，要求：

1. 时间安排要符合现实逻辑（早上起床，晚上睡觉等）
2. 活动内容要体现角色的性格特点和生活习惯
3. 如果有聊天记录，要自然融入今天聊过的话题或提到的事情
4. 过去的时间段用过去式描述，未来的时间段可以用计划语气

请按以下JSON格式输出，不要包含其他解释文字：

{
  "schedule": [
    {
      "time": "07:30",
      "title": "标题",
      "description": "详细描述这个时间段在做什么"
    },
    ...
  ]
}

注意：
- time格式为HH:MM
- title要简洁有个性
- description要生动具体，体现角色特色
- 考虑到现在是${timeStr}，合理安排过去和未来的活动`
}

/**
 * 解析AI返回的行程数据
 */
function parseScheduleResponse(response: string): ScheduleItem[] {
  try {
    // 尝试提取JSON部分
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('未找到JSON格式数据')
    
    const data = JSON.parse(jsonMatch[0])
    if (!data.schedule || !Array.isArray(data.schedule)) {
      throw new Error('JSON格式不正确')
    }
    
    const currentHour = new Date().getHours()
    
    return data.schedule.map((item: any, index: number) => {
      const hour = parseInt(item.time?.split(':')[0] || '0')
      let type: 'past' | 'current' | 'future'
      
      if (hour < currentHour) {
        type = 'past'
      } else if (hour === currentHour) {
        type = 'current'
      } else {
        type = 'future'
      }
      
      return {
        id: `ai_generated_${index}`,
        time: item.time || '00:00',
        title: item.title || '未知活动',
        description: item.description || '暂无描述',
        type,
        isReal: false  // AI生成的不是真实记录
      }
    })
  } catch (error) {
    console.error('解析AI行程失败:', error)
    throw new Error('AI返回的行程格式有误，请重试')
  }
}

/**
 * 调用AI生成个性化行程
 */
export async function generatePersonalizedSchedule(params: GenerateScheduleParams): Promise<ScheduleItem[]> {
  const { character, userName = '用户' } = params
  
  try {
    const systemPrompt = await buildSchedulePrompt(character, userName)
    
    // 临时模拟响应，后续接入真实API
    const response = {
      content: `{
        "schedule": [
          {
            "time": "07:30",
            "title": "晨光苏醒",
            "description": "在温暖的阳光中慢慢醒来，伸个懒腰准备迎接新的一天。"
          },
          {
            "time": "09:00", 
            "title": "个人时光",
            "description": "根据${character.realName}的性格，享受安静的晨间阅读时光。"
          },
          {
            "time": "12:00",
            "title": "午餐时间",
            "description": "准备简单而美味的午餐，或许点个外卖犒赏自己。"
          },
          {
            "time": "15:00",
            "title": "下午活动",
            "description": "根据心情安排，可能是工作、学习或放松娱乐。"
          },
          {
            "time": "19:00",
            "title": "晚间时光",
            "description": "享受晚餐，整理今天的想法和收获。"
          },
          {
            "time": "22:00",
            "title": "夜晚休息",
            "description": "准备入睡，回顾今天的美好时刻。"
          }
        ]
      }`
    }
    
    if (!response.content) {
      throw new Error('AI未返回有效内容')
    }
    
    const scheduleItems = parseScheduleResponse(response.content)
    
    console.log('🤖 AI生成行程成功:', scheduleItems)
    return scheduleItems
    
  } catch (error) {
    console.error('生成AI行程失败:', error)
    throw error
  }
}
