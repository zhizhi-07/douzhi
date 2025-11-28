// 论坛AI评论生成系统 - 类似朋友圈导演的统一调配模式
// NPC网友评论为主（70-80%），AI角色少量参与（20-30%）

import { apiService } from '../services/apiService'
import type { ApiConfig } from '../services/apiService'
import { addComment, addReply } from './forumCommentsDB'
import type { Character } from '../services/characterService'
import { getEmojis } from './emojiStorage'
import { replaceVariables } from './variableReplacer'
import { loadMessages } from './simpleMessageManager'
import type { Message } from '../types/chat'

interface CommentActor {
  id: string
  name: string
  avatar: string
  personality?: string
  signature?: string
  isPublicFigure?: boolean
  publicPersona?: string  // 网络人设（如：全网黑、网红等）
  recentChat?: string  // 🔥 最近聊天记录摘要
  isAICharacter?: boolean  // 是否是AI角色（有人设的）
}

export interface GeneratedComment {
  type: 'main' | 'reply' | 'dm' | 'roast'  // dm = 私聊, roast = 挂人帖子
  characterId: string
  characterName: string  // 记录AI生成的名字
  content: string
  replyToId?: string
  replyToName?: string
}

/**
 * 获取角色的最近聊天记录摘要
 */
function getRecentChatSummary(characterId: string, limit: number = 10): string {
  try {
    const messages = loadMessages(characterId)
    if (!messages || messages.length === 0) return ''
    
    // 只取最近的文本消息
    const textMessages = messages
      .filter((m: Message) => !m.messageType || m.messageType === 'text')
      .slice(-limit)
    
    if (textMessages.length === 0) return ''
    
    return textMessages.map((m: Message) => {
      const sender = m.type === 'sent' ? '用户' : 'AI'
      return `${sender}: ${m.content?.substring(0, 50) || ''}`
    }).join('\n')
  } catch {
    return ''
  }
}

function buildActorsForPrompt(characters: Character[], userName: string = '用户', userInfo?: any): CommentActor[] {
  return characters
    // 过滤掉无效的角色数据（没有名字或名字太短）
    .filter(c => c && c.id && (c.realName || c.nickname) && 
      ((c.realName && c.realName.length > 1) || (c.nickname && c.nickname.length > 1)))
    .map(c => {
      const charName = c.nickname || c.realName
      // 🔥 使用统一的变量替换工具，支持所有变量
      const replacedPersonality = replaceVariables(c.personality || '', {
        charName,
        userName,
        character: c,
        userInfo
      })
      // 🔥 获取最近聊天记录
      const recentChat = getRecentChatSummary(c.id, 10)
      
      return {
        id: c.id,
        name: charName,
        avatar: c.avatar || '/default-avatar.png',
        personality: replacedPersonality,
        signature: c.signature || '',
        isPublicFigure: c.isPublicFigure || false,
        publicPersona: c.publicPersona || '',
        recentChat,
        isAICharacter: true  // 这些都是有人设的AI角色
      }
    })
}

// 公众人物信息
interface PublicFigureInfo {
  name: string
  personality: string
  publicPersona: string  // 网络人设
}

// 单次调用：批量生成评论列表
async function callAIForCommentsBatch(
  actors: CommentActor[],
  postContent: string,
  apiConfig: ApiConfig,
  userPreviousPosts: string[] = [],
  mentionedPublicFigures: PublicFigureInfo[] = [],
  mentionedUserInfo: string = '',
  postAuthorInfo: PublicFigureInfo | null = null,  // 帖子作者（楼主）信息
  chatContext?: string  // 楼主和用户的聊天记录上下文
): Promise<GeneratedComment[]> {
  // 只传角色名字，不传人设（人设信息只用于检测公众人物）
  const actorsForPrompt = actors.map(a => a.name)

  // 构建楼主信息
  const postAuthorPrompt = postAuthorInfo ? `
**⚠️ 重要：帖子作者（楼主）是「${postAuthorInfo.name}」**
${postAuthorInfo.publicPersona ? `- 公众形象：${postAuthorInfo.publicPersona}（网友都认识TA）` : ''}
${postAuthorInfo.personality ? `- 性格人设：${postAuthorInfo.personality}` : ''}
- 楼主「${postAuthorInfo.name}」发了这个帖子，网友们会围观、评论
- 楼主「${postAuthorInfo.name}」自己也可能在评论区回复网友
- **注意：楼主是发帖的人，不是被@的人！楼主的评论语气应该是回应网友，不是被质问**
- 楼主的评论必须符合TA的性格人设
${chatContext ? `
**楼主最近和用户的聊天记录（上下文）：**
${chatContext}
- 楼主回复评论时可以参考这些对话内容` : ''}
` : ''

  // 构建帖子中@的其他公众人物说明
  const publicFigurePrompt = mentionedPublicFigures.length > 0 ? `
**帖子中提到的公众人物（网友都认识他们）：**
${mentionedPublicFigures.map(pf => {
    const desc = []
    if (pf.publicPersona) desc.push(`网络形象：${pf.publicPersona}`)
    if (pf.personality) desc.push(`性格人设：${pf.personality}`)
    return `- ${pf.name}${desc.length > 0 ? '：' + desc.join('，') : ''}`
  }).join('\n')}

**公众人物互动规则：**
- 网友评论时会针对这些公众人物发表看法（支持/反对/调侃/吐槽）
- 公众人物本人（${mentionedPublicFigures.map(pf => pf.name).join('、')}）也会参与评论，为自己辩解、回应网友、发表观点
- **重要：公众人物的评论必须完全符合他们的性格人设**
- 可能形成公众人物和网友之间的对话
` : ''

  // 🔥 构建AI角色信息（所有有人设的角色都要读，用于扮演语气）
  const aiCharacterInfos = actors.filter(a => a.isAICharacter && a.personality)
  
  // 分开公众人物和普通角色
  const publicFigureCharacters = aiCharacterInfos.filter(a => a.isPublicFigure)
  const normalCharacters = aiCharacterInfos.filter(a => !a.isPublicFigure)
  
  // 🔥 聊天记录适当限制，人设完整读取
  const truncateChat = (c: string, maxLines = 5) => 
    c ? c.split('\n').slice(-maxLines).join('\n') : ''
  
  const aiCharacterPrompt = aiCharacterInfos.length > 0 ? `
## 🎭 AI角色（都有人设，可能参与评论）

${publicFigureCharacters.length > 0 ? `### 公众人物（NPC网友可能会讨论/cue他们）
${publicFigureCharacters.slice(0, 5).map(a => {
    let info = `**${a.name}**【公众人物】`
    if (a.publicPersona) info += `\n- 网络形象：${a.publicPersona}`
    if (a.personality) info += `\n- 人设：${a.personality}`
    if (a.recentChat) info += `\n- 最近聊天：\n${truncateChat(a.recentChat).split('\n').map(l => '  ' + l).join('\n')}`
    return info
  }).join('\n\n')}
` : ''}

${normalCharacters.length > 0 ? `### 普通AI角色（按自己的语气评论）
${normalCharacters.slice(0, 5).map(a => {
    let info = `**${a.name}**`
    if (a.personality) info += `\n- 人设：${a.personality}`
    if (a.recentChat) info += `\n- 最近聊天：\n${truncateChat(a.recentChat).split('\n').map(l => '  ' + l).join('\n')}`
    return info
  }).join('\n\n')}
` : ''}

**AI角色参与规则：**
- AI角色评论必须符合自己的人设和说话风格
- 最多1-3个AI角色参与评论
- 公众人物如果被@或被讨论，必须出来回应
` : ''

  let systemPrompt = `你是论坛评论区的导演，负责生成真实的评论生态。

## 📋 核心规则

**评论占比（非常重要！）：**
- 🟢 **NPC网友**：70-80%（随机编造的路人网友）
- 🟡 **AI角色**：20-30%（只有相关的才评论）

**要求：生成至少40条评论（主楼+回复），越多越好**
${postAuthorPrompt}
${aiCharacterPrompt}
## 👥 NPC网友规则（评论主体）
- 网名风格：2-4个字（小李、阿明、路人甲、网友A、吃瓜群众、热心市民等）
- 不要用明星名或AI角色的名字
- 每个名字只出现一次
- 评论风格：随意、口语化、简短（5-35字）
- 可以有不同立场：赞同/反对/吐槽/调侃/问问题/围观/歪楼

${userPreviousPosts.length > 0 ? `
**楼主的历史帖子（网友可以引用）：**
${userPreviousPosts.map((p, i) => `${i + 1}. ${p}`).join('\n')}
- 评论里可以提到"你之前说xxx"、"上次那个帖子xxx"等
- 但不要每条都提，自然随机地提几次就行` : ''}
${publicFigurePrompt}
${mentionedUserInfo}
## 🏢 公众人物反应规则
如果帖子涉及公众人物（楼主是公众人物、或@了公众人物）：
- NPC网友会对公众人物发表看法（支持/反对/调侃/吐槽/爆料/质疑）
- 公众人物本人可能会下场回应（必须符合人设）
- 可能形成公众人物和网友的对话

## 📝 楼中楼规则
- 50%的主楼要有1-4条回复
- 回复可以回复主楼，也可以回复楼中楼的其他人（形成对话链）
- 例如：A发主楼 → B回复A → C回复B → D回复A

## 📄 输出格式（非常重要！）

**格式规则：**
- **[主楼]** = 独立评论，不回复任何人
- **[回复]** = 回复别人的评论，必须带 ->

✅ 正确格式：
[主楼] 小李：哈哈哈笑死了
[回复] 阿明 -> 小李：确实说得对
[回复] 黄兆宇 -> 唐秋水：你谁啊？

❌ 错误格式（不要这样写）：
[主楼] 黄兆宇 -> 唐秋水：xxx  ← 这应该是[回复]！

**完整示例：**
[主楼] 小李：哈哈哈笑死了
[回复] 阿明 -> 小李：确实 @小李 你说得对
[主楼] 路人甲：@楼主 这也太真实了
[回复] 吃瓜群众 -> 路人甲：同意
[主楼] 汁汁：这个我有话说
[回复] 网友A -> 汁汁：你谁啊
[回复] 汁汁 -> 网友A：关你什么事

**直接输出评论，不要解释！**`

  // 🔥 添加表情包列表（限制数量避免prompt过长）
  try {
    const emojis = await getEmojis()
    if (emojis.length > 0) {
      const emojiList = emojis.slice(0, 20).map(e => `[表情:${e.description}]`).join('、')
      systemPrompt += `

**可用表情包（评论可以使用）：**
${emojiList}
- 使用方法：在评论中插入 [表情:描述]，如"哈哈哈[表情:笑死]"
- 不要每条都用，自然随机使用`
    }
  } catch (e) {
    console.error('获取表情包失败:', e)
  }

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
    // 只传名字列表作为参考，AI主要自己编造评论者名字
    knownNames: actorsForPrompt.length > 0 ? actorsForPrompt : undefined
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

  // 🔥 追踪谁发过主楼（用于处理没有指定回复对象的回复）
  const parseTimeMainCommentMap = new Set<string>()
  let lastSpeaker = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 🔥 先检查：如果是 [主楼] 但包含 ->，其实是回复（AI格式错误）
    const mainAsReplyMatch = trimmed.match(/^\[主楼\]\s*(.+?)\s*->\s*(.+?)[:：](.+)$/)
    if (mainAsReplyMatch) {
      const name = mainAsReplyMatch[1].trim()
      const replyToName = mainAsReplyMatch[2].trim()
      const commentContent = mainAsReplyMatch[3].trim()
      
      if (name && commentContent) {
        results.push({
          type: 'reply',
          characterId: getOrCreateId(name),
          characterName: name,
          content: commentContent,
          replyToName
        })
        lastSpeaker = name
        console.log(`⚠️ 修正格式：[主楼] ${name} -> ${replyToName} 应为 [回复]`)
      }
      continue
    }

    // 匹配主楼：[主楼] 名字：评论内容（不带 ->）
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
        // 记录这个人发过主楼
        parseTimeMainCommentMap.add(name)
        lastSpeaker = name
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
        // 记录这个人最后发言
        lastSpeaker = name
      }
      continue
    }

    // 🔥 匹配没有指定回复对象的回复：[回复] 名字：内容
    // 这种情况通常是同一个人连续发多条，作为对自己上一条的补充
    const replyNoTargetMatch = trimmed.match(/^\[回复\]\s*(.+?)[:：](.+)$/)
    if (replyNoTargetMatch) {
      const name = replyNoTargetMatch[1].trim()
      const commentContent = replyNoTargetMatch[2].trim()
      
      if (name && commentContent) {
        // 如果这个人之前发过主楼，就挂在自己的主楼下
        // 否则挂在上一个发言人的评论下
        const targetName = parseTimeMainCommentMap.has(name) ? name : (lastSpeaker || '楼主')
        results.push({
          type: 'reply',
          characterId: getOrCreateId(name),
          characterName: name,
          content: commentContent,
          replyToName: targetName
        })
        lastSpeaker = name
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
  userPreviousPosts: string[] = [],
  postAuthor?: string,  // 帖子作者名称（如果是公众人物）
  chatContext?: string  // 楼主和用户的聊天记录上下文
): Promise<GenerateResult> {
  if (!postId || !postContent) {
    console.error('❌ 帖子ID或内容为空')
    return { dmList: [], roastPosts: [] }
  }

  console.log('\n' + '🔷'.repeat(30))
  console.log('🚀 开始生成AI评论')
  console.log('🔷'.repeat(30))
  console.log('📄 帖子内容:', postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''))
  console.log('👤 传入角色数量:', characters.length)
  
  // 🔥 先获取用户名，用于替换人设中的变量
  const { getUserInfo } = await import('./userUtils')
  const userInfo = getUserInfo()
  const currentUserName = userInfo.nickname || userInfo.realName || '用户'
  
  const actors = buildActorsForPrompt(characters, currentUserName, userInfo)
  
  // 打印所有角色信息（包含聊天记录状态）
  if (actors.length > 0) {
    console.log('📋 AI角色列表（可能参与评论）:')
    actors.forEach((a, i) => {
      const chatInfo = a.recentChat ? `有${a.recentChat.split('\n').length}条聊天` : '无聊天'
      console.log(`  ${i + 1}. ${a.name} | 公众=${a.isPublicFigure ? '是' : '否'} | ${chatInfo} | 人设=${a.personality ? '有' : '无'}`)
    })
    
    // 统计公众人物
    const publicFigures = actors.filter(a => a.isPublicFigure)
    if (publicFigures.length > 0) {
      console.log(`🌟 公众人物：${publicFigures.map(a => a.name).join('、')}`)
    }
  }
  
  console.log(`👥 AI角色：${actors.length} 人（预计参与20-30%）`)
  console.log(`🎭 NPC网友：将由AI编造（预计占70-80%）`)

  // 检测帖子作者（楼主）信息
  let postAuthorInfo: PublicFigureInfo | null = null
  if (postAuthor) {
    const authorActor = actors.find(a => a.name === postAuthor)
    if (authorActor) {
      postAuthorInfo = {
        name: authorActor.name,
        personality: authorActor.personality || '',
        publicPersona: authorActor.publicPersona || ''
      }
      console.log(`📢 楼主: ${postAuthor}${authorActor.isPublicFigure ? ' (公众人物)' : ''}`)
      console.log(`   性格人设: ${authorActor.personality || '无'}`)
      if (authorActor.isPublicFigure) {
        console.log(`   网络形象: ${authorActor.publicPersona || '无'}`)
      }
    } else {
      // 即使找不到角色信息，也要记录楼主名字
      postAuthorInfo = {
        name: postAuthor,
        personality: '',
        publicPersona: ''
      }
      console.log(`📢 楼主: ${postAuthor}`)
    }
  }

  // 检测帖子中@的其他公众人物（不包括楼主自己）
  const mentionedPublicFigures: PublicFigureInfo[] = []
  for (const actor of actors) {
    if (actor.isPublicFigure && actor.name !== postAuthor) {
      // 检查帖子内容是否提到了这个公众人物（@名字 或 直接提到名字）
      const namePattern = new RegExp(`(@${actor.name}|${actor.name})`, 'i')
      if (namePattern.test(postContent)) {
        mentionedPublicFigures.push({
          name: actor.name,
          personality: actor.personality || '',
          publicPersona: actor.publicPersona || ''
        })
        console.log(`🌟 帖子@了公众人物: ${actor.name}`)
        console.log(`   网络形象: ${actor.publicPersona || '无'}`)
        console.log(`   性格人设: ${actor.personality || '无'}`)
      }
    }
  }
  
  if (mentionedPublicFigures.length > 0) {
    console.log(`🎭 帖子涉及 ${mentionedPublicFigures.length} 个被@的公众人物，他们将参与评论互动`)
  }

  // 检测帖子中是否@了用户，如果是则读取用户信息
  let mentionedUserInfo = ''
  try {
    const { getAllPosts } = await import('./forumNPC')
    
    // 检查帖子是否@了用户（使用前面获取的currentUserName和userInfo）
    if (postContent.includes(`@${currentUserName}`) || postContent.includes(currentUserName)) {
      console.log(`👤 帖子@了用户: ${currentUserName}`)
      
      // 读取用户最近10条帖子（所有用户都读）
      const userPosts = getAllPosts().filter(p => p.npcId === 'user').slice(0, 10)
      const userPostsText = userPosts.length > 0 
        ? userPosts.map((p, i) => `${i + 1}. ${p.content.substring(0, 80)}`).join('\n') 
        : '暂无帖子'
      
      // 公众人物：额外读取公众形象
      const publicFigureText = userInfo.isPublicFigure ? `
**⚠️ 这是公众人物！网友都认识TA：**
- 公众形象：${userInfo.publicPersona || '知名人物'}
- 网友评论时会根据这个公众形象来评论（支持/反对/调侃/吐槽）
- 用户本人（${currentUserName}）也可能在评论区回复
` : ''
      
      mentionedUserInfo = `
**帖子中@了用户（${currentUserName}）：**
- 个性签名：${userInfo.signature || '无'}
- 用户最近发的帖子：
${userPostsText}
${publicFigureText}
- 网友评论时可能会@这个用户，或者提到TA
`
      console.log(`   是否公众人物: ${userInfo.isPublicFigure ? '是' : '否'}`)
      console.log(`   帖子数: ${userPosts.length}`)
    }
  } catch (e) {
    // 忽略错误
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
    generated = await callAIForCommentsBatch(actors, postContent, apiConfig, userPreviousPosts, mentionedPublicFigures, mentionedUserInfo, postAuthorInfo, chatContext)
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
  
  // 建立名字到actor的映射（用于匹配公众人物本人）
  const nameToActor = new Map<string, CommentActor>()
  for (const actor of actors) {
    nameToActor.set(actor.name, actor)
  }
  // 同时用原始角色的nickname和realName建立映射
  // 注意：需要根据名字匹配，而不是索引（因为actors是过滤后的）
  for (const char of characters) {
    if (!char) continue
    // 找到对应的actor（通过名字匹配）
    const actor = actors.find(a => a.name === char.nickname || a.name === char.realName)
    if (actor) {
      if (char.nickname) nameToActor.set(char.nickname, actor)
      if (char.realName) nameToActor.set(char.realName, actor)
    }
  }

  // 建立名字到主楼评论ID的映射（用于楼中楼）
  const nameToMainCommentId = new Map<string, string>()
  // 记录每个人最近参与的主楼（用于连续对话）
  const nameToLastMainComment = new Map<string, string>()

  // 统一写入评论DB，区分主楼和回复
  for (const item of generated) {
    const content = item.content.trim()
    if (!content) continue

    // 优先通过名字匹配角色（特别是公众人物），使用他们的真实头像
    const actorByName = nameToActor.get(item.characterName)
    const actor = actorByName || actorMap.get(item.characterId)
    // 重要：始终使用AI生成的原始名字，只从角色获取ID和头像
    const authorId = actor?.id || item.characterId
    const authorName = item.characterName  // 始终用AI生成的名字！
    const authorAvatar = actor?.avatar || '/default-avatar.png'
    
    // 打印匹配情况
    console.log(`💬 保存评论: "${authorName}" | AI生成名=${item.characterName} | 匹配角色=${actorByName ? actorByName.name : '否'} | 头像=${authorAvatar === '/default-avatar.png' ? '默认' : '有'}`)
    
    // 如果是公众人物本人下场，打印日志
    if (actorByName?.isPublicFigure) {
      console.log(`  🌟 这是公众人物！头像=${actor?.avatar}`)
    }

    // 计算随机点赞数：公众人物的评论点赞更多
    const isPublicFigure = actorByName?.isPublicFigure
    const baseLikes = isPublicFigure 
      ? Math.floor(Math.random() * 500) + 100  // 公众人物：100-600
      : Math.floor(Math.random() * 50) + 5     // 普通网友：5-55

    try {
      if (item.type === 'main') {
        // 主楼评论
        const comment = await addComment(
          postId,
          authorId,
          authorName,
          authorAvatar,
          content,
          baseLikes,
          isPublicFigure  // 公众人物标记
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
          // 楼中楼回复的点赞数较少
          const replyLikes = isPublicFigure 
            ? Math.floor(Math.random() * 200) + 50  // 公众人物回复：50-250
            : Math.floor(Math.random() * 20) + 1    // 普通回复：1-21
          await addReply(
            targetMainCommentId,
            authorId,
            authorName,
            authorAvatar,
            content,
            item.replyToName,
            replyLikes
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
            content,
            baseLikes
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
