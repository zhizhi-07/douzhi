/**
 * NPC提取器
 * 从AI角色人设中提取NPC信息，让他们也能参与朋友圈互动
 */

import { apiService } from '../services/apiService'

export interface NPCInfo {
  name: string        // NPC名字
  relationship: string // 与AI的关系
  personality: string  // 性格特点简述
  avatar?: string      // 头像emoji（可选）
}

// 缓存，避免重复提取（角色ID -> NPC列表）
const npcCache = new Map<string, NPCInfo[]>()

/**
 * 从角色人设中提取NPC信息
 */
export async function extractNPCsFromPersonality(
  characterId: string,
  characterName: string,
  personality: string,
  world?: string
): Promise<NPCInfo[]> {
  // 检查缓存
  if (npcCache.has(characterId)) {
    return npcCache.get(characterId)!
  }

  // 如果人设太短，可能没有NPC
  if (!personality || personality.length < 50) {
    npcCache.set(characterId, [])
    return []
  }

  const currentId = apiService.getCurrentId()
  const apiConfig = apiService.getById(currentId)
  if (!apiConfig) {
    console.warn('⚠️ 没有API配置，无法提取NPC')
    return []
  }

  const prompt = `# 从人设中提取NPC角色

## 角色信息
角色名：${characterName}
${world ? `世界观：${world}` : ''}

## 人设描述
${personality}

## 任务
请从上面的人设描述中，提取出所有提到的**其他人物**（NPC）。

这些NPC可能是：
- 朋友、同学、同事
- 家人、恋人
- 队友、对手
- 老师、上司
- 任何有名字或明确称呼的人

## 输出要求

⚠️ 重要：直接输出JSON，不要有任何多余的文字！

格式：
\`\`\`json
{
  "npcs": [
    {
      "name": "NPC名字或称呼",
      "relationship": "与${characterName}的关系",
      "personality": "性格特点（一句话概括）",
      "avatar": "合适的emoji头像"
    }
  ]
}
\`\`\`

规则：
1. 只提取明确提到的人物，不要脑补
2. 如果没有提到其他人物，返回 {"npcs": []}
3. 群体可以作为整体（如"篮球队"）
4. avatar用emoji

❌ 不要输出："好的，我来提取..."、"根据人设..."等任何额外文字
✅ 直接输出：{"npcs": [...]}

现在开始提取！`

  try {
    console.log(`🔍 开始从 ${characterName} 的人设中提取NPC...`)
    
    const apiUrl = `${apiConfig.baseUrl}/chat/completions`
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
            content: '你是一个专业的文本分析助手，擅长从角色描述中提取人物信息。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,  // 降低温度，保证提取准确
        max_tokens: 800
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    console.log('🤖 AI原始回复:', content)
    
    // 简化提取：匹配完整的JSON对象（支持嵌套）
    let jsonStr = ''
    
    // 找到第一个{和最后一个}之间的内容
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = content.substring(firstBrace, lastBrace + 1)
      console.log('✅ 提取JSON成功')
    } else {
      console.error('❌ 无法从AI回复中找到JSON对象')
      console.log('完整回复:', content)
      throw new Error('AI回复格式错误，无法找到JSON')
    }
    
    console.log('📝 提取的JSON:', jsonStr.substring(0, 300))
    
    const result = JSON.parse(jsonStr)
    const npcs: NPCInfo[] = result.npcs || []
    
    console.log(`✅ 从 ${characterName} 的人设中提取到 ${npcs.length} 个NPC:`, 
      npcs.map(n => n.name).join('、'))
    
    // 缓存结果
    npcCache.set(characterId, npcs)
    
    return npcs
  } catch (error) {
    console.error(`❌ 提取NPC失败:`, error)
    // 失败时返回空数组并缓存，避免重复尝试
    npcCache.set(characterId, [])
    return []
  }
}

/**
 * 获取角色的所有NPC（从缓存）
 */
export function getCachedNPCs(characterId: string): NPCInfo[] {
  return npcCache.get(characterId) || []
}

/**
 * 清除缓存（当角色人设更新时调用）
 */
export function clearNPCCache(characterId?: string): void {
  if (characterId) {
    npcCache.delete(characterId)
    console.log(`🗑️ 清除 ${characterId} 的NPC缓存`)
  } else {
    npcCache.clear()
    console.log('🗑️ 清除所有NPC缓存')
  }
}

/**
 * 预加载所有角色的NPC
 */
export async function preloadAllNPCs(characters: Array<{
  id: string
  realName: string
  personality?: string
  world?: string
}>): Promise<void> {
  console.log('🔄 开始预加载所有角色的NPC...')
  
  const promises = characters.map(char => 
    extractNPCsFromPersonality(
      char.id,
      char.realName,
      char.personality || '',
      char.world
    )
  )
  
  await Promise.all(promises)
  console.log('✅ NPC预加载完成')
}
