// 论坛AI评论生成系统 - 真实调用API（单次调用生成完整评论生态）

import { apiService } from '../services/apiService'
import type { ApiConfig } from '../services/apiService'
import { addComment } from './forumCommentsDB'
import type { Character } from '../services/characterService'

interface CommentActor {
  id: string
  name: string
  avatar: string
  personality?: string
  signature?: string
}

interface GeneratedComment {
  characterId: string
  content: string
}

function buildActorsForPrompt(characters: Character[]): CommentActor[] {
  return characters
    .filter(c => c && c.id && (c.realName || c.nickname))
    .map(c => ({
      id: c.id,
      name: c.nickname || c.realName,
      avatar: c.avatar || '/default-avatar.png',
      personality: c.personality || '',
      signature: c.signature || ''
    }))
}

// 单次调用：批量生成评论列表
async function callAIForCommentsBatch(
  actors: CommentActor[],
  postContent: string,
  apiConfig: ApiConfig
): Promise<GeneratedComment[]> {
  // 构造一个清晰、可解析的JSON协议
  const actorsForPrompt = actors.map(a => ({
    id: a.id,
    name: a.name,
    personality: a.personality,
    signature: a.signature
  }))

  const systemPrompt = `你是一个社交平台的"评论编导"，负责为一条动态生成完整的评论区生态。

要求：
- 把下面提供的角色名单当成真实的人（不是AI），每个人有自己的名字、性格、签名
- **完全根据动态的内容和氛围，自主决定：**
  - 评论数量（**6-12条为佳**，热门话题可以更多）
  - 谁会评论、谁不会评论（不是每个人都必须出现，但至少要有6-8人参与）
  - 评论风格（热情/冷淡/吐槽/安慰/调侃/深度讨论）
- **真实场景举例：**
  - 沉重话题（失恋、压力大）→ 5-7人会安慰，表达关心
  - 有趣八卦（搞笑事件）→ 10+人围观、起哄、热闹
  - 普通日常（吃饭、看电影）→ 6-9人随意点赞或评论
  - 炫耀类（买新车、升职）→ 8-10人祝贺/酸/打趣
- 评论之间可以有轻微的呼应和互动感

**输出格式（纯文本，每行一条评论）：**
名字：评论内容
名字：评论内容
...

例如：
唐秋水：哈哈哈笑死了😂
小美：真好看！
张三：我也觉得不错👍

**重要规则：**
1. 每行格式必须是"名字：评论内容"
2. 名字必须是下面角色列表中的一个
3. 评论内容10-40字，自然口语，可以带表情
4. 不要添加任何解释、序号或其他格式
5. 直接输出评论，不要有任何前言或总结`

  const userPayload = {
    post: {
      content: postContent
    },
    actors: actorsForPrompt
  }

  // 确保URL包含/v1路径
  const url = apiConfig.baseUrl.includes('/v1')
    ? `${apiConfig.baseUrl}/chat/completions`
    : `${apiConfig.baseUrl}/v1/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiConfig.apiKey}`
    },
    body: JSON.stringify({
      model: apiConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPayload, null, 2) }
      ],
      temperature: 0.9,
      max_tokens: 1200
    })
  })

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`)
  }

  const data = await response.json()
  let content = (data as any).choices?.[0]?.message?.content as string | undefined

  if (!content) {
    throw new Error('API返回内容为空')
  }

  content = content.trim()

  // 去除 markdown code block 标记
  content = content.replace(/^```\s*/i, '').replace(/\s*```$/g, '')
  content = content.trim()

  // 解析纯文本格式：每行"名字：评论内容"
  const results: GeneratedComment[] = []
  const lines = content.split('\n')

  // 创建名字到ID的映射
  const nameToId = new Map<string, string>()
  for (const actor of actors) {
    nameToId.set(actor.name, actor.id)
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 匹配格式：名字：评论内容
    const match = trimmed.match(/^(.+?)[:：](.+)$/)
    if (!match) continue

    const name = match[1].trim()
    const commentContent = match[2].trim()

    if (!name || !commentContent) continue

    // 查找对应的角色ID
    const characterId = nameToId.get(name)
    if (!characterId) {
      console.warn(`⚠️ 未找到角色"${name}"`)
      continue
    }

    results.push({
      characterId,
      content: commentContent
    })
  }

  if (results.length === 0) {
    throw new Error('未能解析出任何评论')
  }

  console.log(`✅ 解析成功：${results.length} 条评论`)
  return results
}

// 本地降级：在API失败时，用简单模板撑起最基本的生态
function fallbackComments(actors: CommentActor[], postContent: string): GeneratedComment[] {
  if (actors.length === 0) return []

  const baseTemplates = [
    '这个说得太真实了…',
    '抱抱你 🙏',
    '我也有同感',
    '记得好好休息一下',
    '支持你做自己的决定',
    '哈哈哈太有画面感了',
    '下次带上我一起！',
    '拍得不错，感觉很有氛围'
  ]

  const count = Math.min(6, Math.max(3, Math.floor(actors.length / 2)))
  const shuffled = [...actors].sort(() => Math.random() - 0.5).slice(0, count)

  return shuffled.map((actor, idx) => ({
    characterId: actor.id,
    content: baseTemplates[(idx + postContent.length) % baseTemplates.length]
  }))
}

// 生成AI角色评论（单次API调用）
export async function generateRealAIComments(
  postId: string,
  postContent: string,
  characters: Character[]
) {
  if (!postId || !postContent) {
    console.error('❌ 帖子ID或内容为空')
    return
  }

  const actors = buildActorsForPrompt(characters)
  if (actors.length === 0) {
    console.warn('⚠️ 没有可用的角色/NPC生成评论')
    return
  }

  console.log(`👥 评论候选：${actors.length} 人`)

  // 获取当前API配置
  const apiConfigs = apiService.getAll()
  const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
  const apiConfig = apiConfigs.find(c => c.id === currentId)

  if (!apiConfig) {
    console.error('❌ 没有可用的API配置')
    return
  }

  let generated: GeneratedComment[] = []

  try {
    generated = await callAIForCommentsBatch(actors, postContent, apiConfig)
    console.log(`📝 批量生成评论 ${generated.length} 条`)
  } catch (error) {
    console.error('❌ 批量AI评论生成失败，使用本地模板降级：', error)
    generated = fallbackComments(actors, postContent)
  }

  if (!generated.length) {
    console.warn('⚠️ 没有生成任何评论')
    return
  }

  // 映射 actorId -> actor 信息，方便落盘
  const actorMap = new Map<string, CommentActor>()
  for (const actor of actors) {
    actorMap.set(actor.id, actor)
  }

  // 统一写入评论DB（不再额外请求API）
  for (const item of generated) {
    const actor = actorMap.get(item.characterId)
    if (!actor) continue

    const content = item.content.trim()
    if (!content) continue

    try {
      await addComment(
        postId,
        actor.id,
        actor.name,
        actor.avatar,
        content
      )
    } catch (err) {
      console.error(`❌ 保存评论失败 (${actor.name}):`, err)
    }
  }

  console.log('🎉 评论生态生成完成（单次API + 本地落盘）')
}
