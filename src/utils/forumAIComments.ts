// 论坛AI评论生成系统 - 真实调用API（单次调用生成完整评论生态）

import { apiService } from '../services/apiService'
import type { ApiConfig } from '../services/apiService'
import { addComment, addReply } from './forumCommentsDB'
import type { Character } from '../services/characterService'

interface CommentActor {
  id: string
  name: string
  avatar: string
  personality?: string
  signature?: string
}

export interface GeneratedComment {
  type: 'main' | 'reply' | 'dm' | 'roast'  // dm = 私聊, roast = 挂人帖子
  characterId: string
  characterName: string  // 记录AI生成的名字
  content: string
  replyToId?: string
  replyToName?: string
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
  apiConfig: ApiConfig,
  userPreviousPosts: string[] = []
): Promise<GeneratedComment[]> {
  // 构造一个清晰、可解析的JSON协议
  const actorsForPrompt = actors.map(a => ({
    id: a.id,
    name: a.name,
    personality: a.personality,
    signature: a.signature
  }))

  let systemPrompt = `你是社交平台评论区生成器。模拟真实网友评论。

**要求：生成至少40条评论（主楼+回复），越多越好**

**评论者都是普通网友：**
- 网名风格：2-4个字（小李、阿明、路人甲、网友A、吃瓜群众等）
- 不要用明星名
- 每个名字只出现一次

**评论风格（真实网友口吻）：**
- 随意、口语化、简短
- 赞同/反对/吐槽/调侃/问问题/围观/歪楼
- 带网络梗、表情、拼音缩写（yyds、绝绝子、笑死、+1等）
${userPreviousPosts.length > 0 ? '\n**可以引用发帖用户的历史：**\n- 下面会提供用户之前发的帖子内容\n- 评论里可以提到"之前你说xxx"、"上次那个xxx"等\n- 但不要每条都提，自然随机地提几次就行' : ''}

**楼中楼规则：**
- 50%的主楼要有1-4条回复
- 回复可以回复主楼，也可以回复楼中楼的其他人（形成对话）
- 例如：A发主楼 → B回复A → C回复B → D回复A

**格式：**
[主楼] 网名：评论内容
[回复] 网名 -> 被回复网名：回复内容

**示例：**
[主楼] 小李：哈哈哈笑死了
[回复] 阿明 -> 小李：确实
[回复] 小王 -> 阿明：+1
[主楼] 路人甲：？？？
[主楼] 网友A：说得对
[回复] 吃瓜群众 -> 网友A：同意
[主楼] 热心市民：有一说一
[回复] 小张 -> 热心市民：没毛病
[回复] 老王 -> 小张：哈哈
[主楼] 匿名用户：yyds

**私聊：**
- 可能有网友想私聊发帖者，用 [私聊] 网名：内容

**挂人帖子：**
- 如果帖子内容有争议或让人不爽，可能有网友发帖挂发帖者
- 用 [挂人] 网名：帖子内容
- 挂人帖子内容可以是：质疑、嘲讽、反驳、截图说明、骂人等
- 挂人帖子也会有评论，但评论由系统另外生成

**重要：**
- 50%主楼有1-4条回复
- 回复要形成连续对话
- 评论5-35字
- 直接输出，不要解释`

  // 获取当前时间
  const now = new Date()
  const currentTime = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  })

  const userPayload = {
    currentTime: currentTime,
    post: {
      content: postContent
    },
    userHistory: userPreviousPosts.length > 0 ? {
      message: '发帖用户的历史帖子（可以在评论里提到）:',
      posts: userPreviousPosts
    } : undefined,
    actors: actorsForPrompt
  }

  // 🔍 打印完整的prompt给用户看
  console.log('='.repeat(60))
  console.log('📋 AI评论生成 - 完整Prompt:')
  console.log('='.repeat(60))
  console.log('【System Prompt】:')
  console.log(systemPrompt)
  console.log('\n' + '='.repeat(60))
  console.log('【User Payload】:')
  console.log(JSON.stringify(userPayload, null, 2))
  console.log('='.repeat(60))

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
      temperature: 0.85,
      max_tokens: 8000  // 增加到8000，支持生成更多评论
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
  
  // 🔍 调试：打印 AI 原始返回内容（完整版）
  console.log('🤖 AI完整返回内容:')
  console.log(content)
  console.log('📊 AI返回总字数:', content.length)
  console.log('📊 返回行数:', content.split('\n').length)

  // 去除 markdown code block 标记
  content = content.replace(/^```\s*/i, '').replace(/\s*```$/g, '')
  content = content.trim()

  // 解析新格式：[主楼] 或 [回复]
  const results: GeneratedComment[] = []
  const lines = content.split('\n')

  // 动态创建名字到ID的映射（AI自己编名字）
  const nameToId = new Map<string, string>()
  
  // 如果传了actors，先加到映射里（但现在可能为空或用不上）
  for (const actor of actors) {
    nameToId.set(actor.name, actor.id)
  }

  // 辅助函数：获取或创建角色ID
  const getOrCreateId = (name: string): string => {
    if (nameToId.has(name)) {
      return nameToId.get(name)!
    }
    // 动态创建ID
    const newId = `ai-npc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    nameToId.set(name, newId)
    console.log(`✨ 创建新角色: ${name} (ID: ${newId})`)
    return newId
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 匹配主楼：[主楼] 名字：评论内容
    const mainMatch = trimmed.match(/^\[主楼\]\s*(.+?)[:：](.+)$/)
    if (mainMatch) {
      const name = mainMatch[1].trim()
      const commentContent = mainMatch[2].trim()
      
      if (name && commentContent) {
        results.push({
          type: 'main',
          characterId: getOrCreateId(name),
          characterName: name,
          content: commentContent
        })
      }
      continue
    }

    // 匹配回复：[回复] 名字 -> 被回复名字：回复内容
    const replyMatch = trimmed.match(/^\[回复\]\s*(.+?)\s*->\s*(.+?)[:：](.+)$/)
    if (replyMatch) {
      const name = replyMatch[1].trim()
      const replyToName = replyMatch[2].trim()
      const commentContent = replyMatch[3].trim()
      
      if (name && commentContent) {
        results.push({
          type: 'reply',
          characterId: getOrCreateId(name),
          characterName: name,
          content: commentContent,
          replyToName
        })
      }
      continue
    }

    // 匹配私聊：[私聊] 名字：内容
    const dmMatch = trimmed.match(/^\[私聊\]\s*(.+?)[:：](.+)$/)
    if (dmMatch) {
      const name = dmMatch[1].trim()
      const dmContent = dmMatch[2].trim()
      
      if (name && dmContent) {
        results.push({
          type: 'dm',
          characterId: getOrCreateId(name),
          characterName: name,
          content: dmContent
        })
      }
      continue
    }

    // 匹配挂人帖子：[挂人] 名字：内容
    const roastMatch = trimmed.match(/^\[挂人\]\s*(.+?)[:：](.+)$/)
    if (roastMatch) {
      const name = roastMatch[1].trim()
      const roastContent = roastMatch[2].trim()
      
      if (name && roastContent) {
        results.push({
          type: 'roast',
          characterId: getOrCreateId(name),
          characterName: name,
          content: roastContent
        })
      }
      continue
    }

    // 兼容旧格式（无标签）
    const oldMatch = trimmed.match(/^(.+?)[:：](.+)$/)
    if (oldMatch) {
      const name = oldMatch[1].trim()
      const commentContent = oldMatch[2].trim()
      
      if (name && commentContent) {
        results.push({
          type: 'main',
          characterId: getOrCreateId(name),
          characterName: name,
          content: commentContent
        })
      }
    }
  }

  if (results.length === 0) {
    console.error('❌ 解析失败，AI返回的内容:', content)
    throw new Error('未能解析出任何评论')
  }

  const mainCount = results.filter(r => r.type === 'main').length
  const replyCount = results.filter(r => r.type === 'reply').length
  const dmCount = results.filter(r => r.type === 'dm').length
  const roastCount = results.filter(r => r.type === 'roast').length
  console.log(`✅ 解析成功：${results.length} 条（${mainCount} 主楼 + ${replyCount} 回复 + ${dmCount} 私聊 + ${roastCount} 挂人帖）`)
  
  if (results.length < 40) {
    console.warn(`⚠️ 评论数量偏少（${results.length}条），要求至少40条`)
  }
  
  return results
}

// 本地降级：在API失败时，用简单模板撑起最基本的生态
function fallbackComments(actors: CommentActor[], postContent: string): GeneratedComment[] {
  if (actors.length === 0) return []

  const mainTemplates = [
    '这个说得太真实了…',
    '抱抱你 🙏',
    '我也有同感',
    '记得好好休息一下',
    '支持你做自己的决定',
    '哈哈哈太有画面感了',
    '下次带上我一起！',
    '拍得不错，感觉很有氛围'
  ]

  const replyTemplates = [
    '同意！',
    '确实是这样',
    '有道理',
    '我也想说这个',
    '哈哈说得对'
  ]

  const count = Math.min(20, Math.max(10, Math.floor(actors.length / 2)))
  const shuffled = [...actors].sort(() => Math.random() - 0.5).slice(0, count)
  
  const results: GeneratedComment[] = []

  // 生成主楼评论
  shuffled.forEach((actor, idx) => {
    results.push({
      type: 'main',
      characterId: actor.id,
      characterName: actor.name,
      content: mainTemplates[(idx + postContent.length) % mainTemplates.length]
    })

    // 30% 概率生成回复
    if (Math.random() < 0.3 && idx > 0) {
      const replyToActor = shuffled[Math.floor(Math.random() * idx)]
      const replyActor = shuffled[(idx + 1) % shuffled.length]
      results.push({
        type: 'reply',
        characterId: replyActor.id,
        characterName: replyActor.name,
        content: replyTemplates[Math.floor(Math.random() * replyTemplates.length)],
        replyToName: replyToActor.name
      })
    }
  })

  return results
}

// 私聊信息类型
export interface DMInfo {
  npcId: string
  npcName: string
  content: string
}

// 挂人帖子类型
export interface RoastPostInfo {
  npcId: string
  npcName: string
  content: string
}

// 生成结果类型
export interface GenerateResult {
  dmList: DMInfo[]
  roastPosts: RoastPostInfo[]
}

// 生成AI角色评论（单次API调用）
// 返回私聊列表和挂人帖子，让调用方处理
export async function generateRealAIComments(
  postId: string,
  postContent: string,
  characters: Character[],
  userPreviousPosts: string[] = []
): Promise<GenerateResult> {
  if (!postId || !postContent) {
    console.error('❌ 帖子ID或内容为空')
    return { dmList: [], roastPosts: [] }
  }

  const actors = buildActorsForPrompt(characters)
  
  if (actors.length === 0) {
    console.log(`🎨 AI自由发挥模式：将自己编造评论者名字`)
  } else {
    console.log(`👥 评论候选：${actors.length} 人`)
  }

  // 获取当前API配置
  const apiConfigs = apiService.getAll()
  const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
  const apiConfig = apiConfigs.find(c => c.id === currentId)

  if (!apiConfig) {
    console.error('❌ 没有可用的API配置')
    return { dmList: [], roastPosts: [] }
  }

  let generated: GeneratedComment[] = []

  try {
    generated = await callAIForCommentsBatch(actors, postContent, apiConfig, userPreviousPosts)
    console.log(`📝 批量生成评论 ${generated.length} 条`)
  } catch (error) {
    console.error('❌ 批量AI评论生成失败，使用本地模板降级：', error)
    generated = fallbackComments(actors, postContent)
  }

  if (!generated.length) {
    console.warn('⚠️ 没有生成任何评论')
    return { dmList: [], roastPosts: [] }
  }

  // 映射 actorId -> actor 信息，方便落盘
  const actorMap = new Map<string, CommentActor>()
  for (const actor of actors) {
    actorMap.set(actor.id, actor)
  }

  // 建立名字到主楼评论ID的映射（用于楼中楼）
  const nameToMainCommentId = new Map<string, string>()
  // 记录每个人最近参与的主楼（用于连续对话）
  const nameToLastMainComment = new Map<string, string>()

  // 统一写入评论DB，区分主楼和回复
  for (const item of generated) {
    const content = item.content.trim()
    if (!content) continue

    // 优先从actorMap获取，否则用动态名字
    const actor = actorMap.get(item.characterId)
    const authorId = actor?.id || item.characterId
    const authorName = actor?.name || item.characterName
    const authorAvatar = actor?.avatar || '/default-avatar.png'

    try {
      if (item.type === 'main') {
        // 主楼评论
        const comment = await addComment(
          postId,
          authorId,
          authorName,
          authorAvatar,
          content
        )
        // 记录这个人发的主楼ID
        nameToMainCommentId.set(authorName, comment.id)
        nameToLastMainComment.set(authorName, comment.id)
        
      } else if (item.type === 'reply' && item.replyToName) {
        // 楼中楼回复
        // 先找被回复人的主楼ID
        let targetMainCommentId = nameToMainCommentId.get(item.replyToName)
        
        // 如果被回复的人没有主楼，说明是回复楼中楼的人
        // 找到那个人最近参与的主楼
        if (!targetMainCommentId) {
          targetMainCommentId = nameToLastMainComment.get(item.replyToName)
        }
        
        if (targetMainCommentId) {
          await addReply(
            targetMainCommentId,
            authorId,
            authorName,
            authorAvatar,
            content,
            item.replyToName
          )
          // 记录这个人参与了这个主楼的讨论
          nameToLastMainComment.set(authorName, targetMainCommentId)
        } else {
          console.warn(`⚠️ 找不到被回复的评论: ${item.replyToName}，降级为主楼`)
          // 如果找不到被回复的评论，降级为主楼
          const comment = await addComment(
            postId,
            authorId,
            authorName,
            authorAvatar,
            content
          )
          nameToMainCommentId.set(authorName, comment.id)
          nameToLastMainComment.set(authorName, comment.id)
        }
      }
    } catch (err) {
      console.error(`❌ 保存评论失败 (${authorName}):`, err)
    }
  }

  // 收集私聊信息返回给调用方
  const dmList: DMInfo[] = generated
    .filter(item => item.type === 'dm')
    .map(item => ({
      npcId: item.characterId,
      npcName: item.characterName,
      content: item.content
    }))

  // 收集挂人帖子
  const roastPosts: RoastPostInfo[] = generated
    .filter(item => item.type === 'roast')
    .map(item => ({
      npcId: item.characterId,
      npcName: item.characterName,
      content: item.content
    }))

  console.log(`🎉 评论生态生成完成（主楼 + 楼中楼），私聊 ${dmList.length} 条，挂人帖 ${roastPosts.length} 条`)
  return { dmList, roastPosts }
}
