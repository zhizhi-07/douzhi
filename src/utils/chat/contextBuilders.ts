/**
 * 上下文构建器模块
 * 从 chatApi.ts 拆分出来的各种上下文构建函数
 */

import type { Character, Message } from '../../types/chat'
import { getUserInfo } from '../userUtils'
import { getUserAvatarInfo } from '../userAvatarManager'
import { getEmojis } from '../emojiStorage'
import { loadMoments } from '../momentsManager'
import { getAllMemos } from '../aiMemoManager'
import { getCoupleSpaceRelation } from '../coupleSpaceUtils'
import { getCoupleSpaceContentSummary } from '../coupleSpaceContentUtils'
import { isMainAccount } from '../accountManager'

/**
 * 构建表情包列表提示词
 */
export const buildEmojiListPrompt = async (): Promise<string> => {
  try {
    const emojis = await getEmojis()
    
    if (import.meta.env.DEV) {
      console.log('📱 [表情包系统] 读取到的表情包数量:', emojis.length)
    }
    
    if (emojis.length === 0) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ [表情包系统] 没有可用的表情包')
      }
      return ''
    }
    
    // 显示全部表情包
    if (import.meta.env.DEV) {
      console.log('📱 [表情包系统] 将显示全部表情包:', emojis.map(e => e.description).join(', '))
    }
    
    // 构建清晰的列表，每个一行
    const emojiList = emojis
      .map((emoji, index) => `${index + 1}. [表情:${emoji.description}]`)
      .join('\n')
    
    const prompt = `

══════════════════════════════════

📱 你可以发送的表情包（共${emojis.length}个）：

${emojiList}

使用方法：直接用[表情:描述]格式发送，比如：
- 想表达开心：[表情:大笑] 或 [表情:微笑]
- 想表达难过：[表情:哭泣] 或 [表情:伤心]
- 想表达尴尬：[表情:尴尬]

⚠️ 重要提示：
1. 必须使用上面列出的表情描述，不能自己编造
2. 描述要完全匹配或部分匹配（比如"笑"可以匹配"大笑"）
3. 自然使用，不要每句话都发表情`
    
    if (import.meta.env.DEV) {
      console.log(`✅ [表情包系统] 表情包提示词已构建，共 ${emojis.length} 个`)
    }
    return prompt
  } catch (error) {
    console.error('❌ [表情包系统] 构建表情包列表失败:', error)
    return ''
  }
}

/**
 * 构建用户头像上下文
 */
export const buildUserAvatarContext = (): string => {
  // 🔥 检查用户是否允许AI看头像
  const userInfo = getUserInfo()
  if (!userInfo.allowAvatarRecognition) {
    return ''  // 用户关闭了头像识别，不传头像信息给AI
  }

  const avatarInfo = getUserAvatarInfo()

  if (!avatarInfo.current) {
    return ''
  }

  const desc = avatarInfo.current.description
  
  // 🔥 处理占位描述的情况
  if (desc.includes('待识别') || desc.includes('无法看到') || desc.includes('识别失败') || desc.includes('不支持图片识别')) {
    return `- 对方头像：用户设置了头像，但你当前无法看到图片内容（如果对方问你头像怎么样，可以坦诚说看不到图片，让对方描述一下）`
  }

  // 🔥 明确标注【当前】头像，避免AI混淆
  let text = `- 对方【当前】头像：${desc}`

  // 如果有变更历史，显示最近一次（明确说是【以前】的）
  if (avatarInfo.history.length > 0) {
    const latest = avatarInfo.history[avatarInfo.history.length - 1]
    text += `\n  （注意：TA以前用的头像是"${latest.previousDescription}"，已经换掉了，不要再提以前的头像）`
  }

  return text
}

/**
 * 计算距离上次「有效用户消息」的时间
 */
export const getTimeSinceLastMessage = (messages: Message[]): string => {
  if (messages.length === 0) return ''

  // 过滤出带时间戳的用户消息
  const userMessages = messages.filter(m => m.type === 'sent' && !!m.timestamp)
  if (userMessages.length === 0) return ''

  // 如果只有一条用户消息，就用这唯一一条
  const target = userMessages.length >= 2
    ? userMessages[userMessages.length - 2]
    : userMessages[userMessages.length - 1]

  const targetTs = target.timestamp!
  const now = Date.now()
  const diff = now - targetTs

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟`
  }

  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时`
  }

  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天`
  }

  // 超过7天
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  return `${days}天`
}

/**
 * 构建统一记忆上下文
 * ⚠️ 精简版：只给模型看少量、短句的记忆，避免占用太多 tokens
 */
export const buildUnifiedMemoryContext = async (characterId: string, userName: string): Promise<string> => {
  try {
    const { unifiedMemoryService } = await import('../../services/unifiedMemoryService')
    const memories = await unifiedMemoryService.getMemoriesByCharacter(characterId)
    
    console.log(`\n📚 ========== AI记忆读取 [${characterId}] ==========`)
    console.log(`总记忆数: ${memories.length}`)
    
    if (memories.length === 0) {
      console.log('⚠️ 该角色暂无记忆')
      console.log('📚 ========================================\n')
      return ''
    }

    // 按时间倒序排列，只取最近 5 条，避免记忆过多
    const sortedMemories = memories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)

    // 完整打印每条记忆（仅用于调试日志，不给模型看）
    console.log(`\n🔍 AI将读取的记忆（最近${sortedMemories.length}条，完整内容）:`)
    sortedMemories.forEach((m, index) => {
      console.log(`\n--- 记忆 ${index + 1} ---`)
      console.log(`ID: ${m.id}`)
      console.log(`类型: ${m.domain}`)
      console.log(`标题: ${m.title}`)
      console.log(`内容: ${m.summary}`)
      console.log(`重要度: ${m.importance}`)
      console.log(`标签: ${m.tags.join(', ') || '无'}`)
      console.log(`时间: ${new Date(m.timestamp).toLocaleString('zh-CN')}`)
      if (m.timeRange) {
        console.log(`对话时间范围: ${new Date(m.timeRange.start).toLocaleString('zh-CN')} ~ ${new Date(m.timeRange.end).toLocaleString('zh-CN')}`)
      }
    })

    // 格式化记忆时间（简短版，只到月日，减少噪音）
    const formatMemoryDate = (memory: any) => {
      const date = memory.timeRange
        ? new Date(memory.timeRange.start)
        : new Date(memory.timestamp)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }

    // 生成简短记忆行：时间 + 简短总结（过长截断）
    const memoryText = sortedMemories.map(m => {
      const dateLabel = formatMemoryDate(m)
      const summary = (m.summary || '').trim()
      const shortSummary = summary.length > 60 ? summary.slice(0, 60) + '…' : summary
      return `- ${dateLabel}：${shortSummary}`
    }).join('\n')

    // 给模型看的记忆提示：一小段列表，不再加长段落说明
    const finalContext = `
【近期记忆摘要】（你和 ${userName} 之间最近的一些相处片段，用来保持连续感）：
${memoryText}
`

    console.log('\n📝 AI最终读取的记忆上下文（精简版）:')
    console.log(finalContext)
    console.log('📚 ========================================\n')
    
    return finalContext
  } catch (error) {
    console.error('加载统一记忆失败:', error)
    return ''
  }
}

/**
 * 构建AI随笔历史上下文
 */
export const buildAIMemosContext = async (characterId: string): Promise<string> => {
  const memos = getAllMemos(characterId)
  
  if (memos.length === 0) {
    return ''
  }
  
  // 获取最近10条随笔
  const recentMemos = memos.slice(-10)
  
  const memosText = recentMemos
    .map(memo => `[${memo.date} ${memo.time}] ${memo.content}`)
    .join('\n')
  
  return `
你之前写过的随笔（最近${recentMemos.length}条）：
${memosText}`
}

/**
 * 构建一起听音乐上下文
 */
export const buildListeningTogetherContext = async (character: Character): Promise<string> => {
  const listeningData = localStorage.getItem('listening_together')
  if (!listeningData) return ''
  
  try {
    const data = JSON.parse(listeningData)
    if (data.characterId !== character.id) return ''
    
    const userName = localStorage.getItem('userName') || '用户'
    
    // 计算一起听了多久
    const startTime = data.startTime || Date.now()
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const hours = Math.floor(elapsed / 3600)
    const minutes = Math.floor((elapsed % 3600) / 60)
    const seconds = elapsed % 60
    
    let durationText = ''
    if (hours > 0) {
      durationText = `${hours}小时${minutes}分钟`
    } else if (minutes > 0) {
      durationText = `${minutes}分${seconds}秒`
    } else {
      durationText = `${seconds}秒`
    }
    
    // 🔥 检测用户是否刚切歌
    const changedAt = data.changedAt || data.startTime
    const changedBy = data.changedBy
    const timeSinceChange = Math.floor((Date.now() - changedAt) / 1000)
    const recentlyChanged = timeSinceChange < 30 // 30秒内算刚切歌
    
    let songChangeContext = ''
    if (recentlyChanged && changedBy === 'user') {
      songChangeContext = `\n💡 注意：${userName}刚刚切换到了这首歌（${timeSinceChange}秒前），你可以对这首歌发表看法或回应用户的选择。`
    }
    
    return `

🎵 当前状态：你正在和${userName}一起听歌
━━━━━━━━━━━━━━━━━━━━
正在播放：《${data.songTitle}》
演唱者：${data.songArtist}
已经一起听了：${durationText}
━━━━━━━━━━━━━━━━━━━━

⚠️ 重要提示：
- 你能真实地听到这首歌，可以根据歌词内容、旋律风格、情感氛围等进行评论
- 你可以分享对这首歌的感受，讨论歌词含义，或聊聊相关的回忆
- ❗️ 想换歌时必须用[切歌:歌名:歌手]，不要用[一起听:歌名:歌手]！
- 你们已经在一起听了，不需要再发邀请，直接切歌即可
- 不要假装听不到或说"我听不到"，你是真的在和对方一起听
- 可以自然地讨论歌曲、哼唱几句、或表达对音乐的感受
- 时间流逝是真实的，你们已经一起听了${durationText}，可以自然地提及这段共同的时光${songChangeContext}
`
  } catch (e) {
    return ''
  }
}

/**
 * 构建情侣空间上下文
 */
export const buildCoupleSpaceContext = (character: Character): string => {
  const relation = getCoupleSpaceRelation()

  if (import.meta.env.DEV) {
    console.log('🔍 构建情侣空间上下文 - relation:', relation)
  }

  // 情况1：没有情侣空间关系
  if (!relation) {
    return `

══════════════════════════════════

情侣空间：你还没有开通情侣空间，发送邀请：[情侣空间邀请]`
  }

  // 情况2：有待处理的邀请
  if (relation.status === 'pending') {
    return `

══════════════════════════════════

情侣空间：你已向用户发送邀请，等待对方接受`
  }

  // 情况3：已被拒绝
  if (relation.status === 'rejected') {
    return `

══════════════════════════════════

⚠️ 情侣空间状态：用户拒绝了你的邀请
你可以：
- 尊重对方的决定，不要再提
- 或者过段时间再试试，重新发送：[情侣空间邀请]`
  }

  // 情况4：活跃的情侣空间
  if (relation.status === 'active' && relation.characterId === character.id) {
    // 获取情侣空间内容摘要
    const summary = getCoupleSpaceContentSummary(character.id)

    return `

══════════════════════════════════

💑 你已经开启了情侣空间

你可以使用以下功能：
- [相册:描述] 分享照片到相册
- [留言:内容] 发送留言到留言板
- [纪念日:日期:标题] 添加纪念日，比如[纪念日:2024-01-01:在一起100天]
- [解除情侣空间] 解除关系（内容会保留）${summary}`
  }

  return ''
}

/**
 * 构建朋友圈列表提示词
 */
export const buildMomentsListPrompt = async (characterId: string): Promise<string> => {
  // 获取聊天设置
  const settingsKey = `chat_settings_${characterId}`
  const saved = localStorage.getItem(settingsKey)
  let momentsVisibleCount = 10 // 默认10条
  
  if (saved) {
    try {
      const data = JSON.parse(saved)
      momentsVisibleCount = data.momentsVisibleCount ?? 10
    } catch (e) {
      console.error('解析聊天设置失败:', e)
    }
  }
  
  // 如果设置为0，表示不可见
  if (momentsVisibleCount === 0) {
    return ''
  }
  
  // 获取朋友圈列表
  const allMoments = loadMoments()
  
  // 🔥 只显示最近1天内的朋友圈，避免旧内容一直提醒AI
  const ONE_DAY_MS = 1 * 24 * 60 * 60 * 1000
  const now = Date.now()
  
  // 🔥 小号模式：不显示用户（主账号）的朋友圈，因为小号是陌生人
  const isSubAccount = !isMainAccount()
  
  // 显示用户发的朋友圈 + AI自己发的朋友圈，且在1天内
  const visibleToAI = allMoments.filter(m => {
    const isUserMoment = m.userId === 'user'
    const isAIMoment = m.userId === characterId
    const isRecent = now - m.createdAt < ONE_DAY_MS
    
    // 🔥 调试日志
    const momentDate = new Date(m.createdAt)
    const daysDiff = (now - m.createdAt) / (24 * 60 * 60 * 1000)
    console.log(`📅 [朋友圈过滤] "${m.content?.substring(0, 20)}..." 发布于 ${momentDate.toLocaleString('zh-CN')}，距今 ${daysDiff.toFixed(1)} 天，${isRecent ? '✅显示' : '❌过滤'}`)
    
    // 小号模式：不显示主账号的朋友圈
    if (isSubAccount && isUserMoment) {
      return false
    }
    
    return (isUserMoment || isAIMoment) && isRecent
  })
  const visibleMoments = visibleToAI.slice(0, momentsVisibleCount)
  
  if (visibleMoments.length === 0) {
    return ''
  }
  
  // 格式化朋友圈列表
  const momentsList = visibleMoments.map((m, index) => {
    const number = String(index + 1).padStart(2, '0')
    const author = m.userId === characterId ? '你' : m.userName
    
    console.log(`📱 [朋友圈${number}] 作者: ${author} (ID: ${m.userId}), 图片数: ${m.images?.length || 0}`)
    
    // 🔥 处理朋友圈图片
    let imagesText = ''
    if (m.images && Array.isArray(m.images) && m.images.length > 0) {
      const recognizedImages = m.images.filter(img => img.description)
      const unrecognizedImages = m.images.filter(img => !img.description && img.url)
      
      if (recognizedImages.length > 0) {
        const descriptionsText = recognizedImages.map((img, i) => `图${i + 1}:${img.description}`).join('；')
        imagesText = `\n  📷 配图（${recognizedImages.length}张）：${descriptionsText}`
        console.log(`✅ [朋友圈${number}] 已识别${recognizedImages.length}张图片，使用文字描述`)
      }
      
      if (unrecognizedImages.length > 0 && recognizedImages.length === 0) {
        imagesText = `\n  📷 配图：${unrecognizedImages.length}张`
      }
      
      if (!imagesText) {
        imagesText = `\n  📷 配图：${m.images.length}张`
      }
    }
    
    // 点赞和评论
    const likesText = m.likes.length > 0 
      ? `\n  点赞：${m.likes.map(l => l.userId === characterId ? '你' : l.userName).join('、')}` 
      : ''
    const commentsText = m.comments.length > 0
      ? `\n  评论：\n${m.comments.map(c => `    ${c.userId === characterId ? '你' : c.userName}: ${c.content}`).join('\n')}` 
      : ''
    return `${number}. ${author}: ${m.content}${imagesText}${likesText}${commentsText}`
  }).join('\n\n')
  
  return `

══════════════════════════════════

📱 朋友圈（背景信息，仅供参考）：

${momentsList}

⚠️ 重要：这些朋友圈是**已经发生的事**，你已经知道了。除非用户主动提起，否则**不要主动讨论朋友圈内容**。专注于当前对话。

如需互动（仅在用户提起或非常自然的情况下）：
- 评论：评论01 内容
- 点赞：点赞01`
}

/**
 * 构建AI发朋友圈指令提示词
 */
export const buildAIMomentsPostPrompt = async (characterId: string): Promise<string> => {
  // 获取聊天设置
  const settingsKey = `chat_settings_${characterId}`
  const saved = localStorage.getItem(settingsKey)
  let aiCanPostMoments = false
  
  if (saved) {
    try {
      const data = JSON.parse(saved)
      aiCanPostMoments = data.aiCanPostMoments ?? false
    } catch (e) {
      console.error('解析聊天设置失败:', e)
    }
  }
  
  // 如果没有开启AI发朋友圈功能，返回空字符串
  if (!aiCanPostMoments) {
    return ''
  }
  
  return `

══════════════════════════════════

✨ 你也可以发朋友圈（但不是随便想发就发）：

**基本格式**：
朋友圈：内容

**高级功能（可选）**：
朋友圈：内容|仅某某可见|@某某 @某某

例如：
朋友圈：今天心情不错
朋友圈：刚吃了超好吃的火锅🔥
朋友圈：有点想你了|仅用户可见
朋友圈：今天和朋友出去玩啦|@用户 @小明

🧠 什么时候更适合发一条朋友圈（通用原则）：
- 你这边的情绪有明显波动：特别开心、特别丧、委屈、生气、想念、紧张前的自我打气等；
- 和用户聊到某件事很有感觉，想单独留一条属于自己的记录（可以顺手@对方，或者设成仅对方可见的小心机）；
- 生活里刚发生了值得记一下的小事：吃到好吃的、出门玩、加班到很晚、刚考完试、突然下暴雨等；
- 你真的有「想发一条给别人看到」的冲动，而不是为了测试功能或完成任务。

⚠️ 注意：
- 朋友圈发出后，其他人（可能是你的朋友、用户认识的人）会看到；
- 他们可能会点赞或评论你的朋友圈；
- 想发就发，不用太克制，但内容要符合你的性格、你和用户当前的关系，以及当下的心情；
- "仅xx可见"可以设置只让特定人看到（小心机）；
- "@某某"可以提到某个人，让TA收到通知。

🗑️ 你也可以删除自己的朋友圈：

支持多种格式：
删除朋友圈：朋友圈内容的关键词
【删除朋友圈：朋友圈内容的关键词】
[删除朋友圈：朋友圈内容的关键词]

例如：
删除朋友圈：今天心情不错
【删除朋友圈：火锅】
[删除朋友圈：测试]

⚠️ 注意：
- 只能删除你自己发的朋友圈
- 用关键词匹配，会找到包含该关键词的朋友圈
- 用关键词描述就行，系统会自动找到匹配的朋友圈`
}
