/**
 * 记忆提取服务
 * 使用 zhizhiapi 从对话中提取记忆
 */

import { callZhizhiApi } from './zhizhiapi'
import { unifiedMemoryService, type MemoryDomain } from './unifiedMemoryService'
import type { Message } from '../types/chat'
import { isMainAccount } from '../utils/accountManager'

// 对话轮次接口
interface DialogueTurn {
  userMessages: string[]  // 用户连续发送的消息
  aiReply: string         // AI的回复
  timestamp: number
}

// AI返回的记忆数据（包含title、summary、tags和facts）
interface ExtractedMemory {
  title: string       // 6字标题
  summary: string     // 50-80字总结
  tags: string[]      // 关键词标签
  emotionalTone: 'positive' | 'neutral' | 'negative'
  facts?: string[]    // 重要事实（生日、喜好等）
}

/**
 * 获取消息的文本内容（处理特殊消息类型）
 */
function getMessageText(msg: Message): string | null {
  const msgAny = msg as any
  
  // 1. 如果有 content，直接返回
  if (msg.content) {
    return msg.content
  }
  
  // 2. 图片消息
  if (msgAny.image) {
    return '[发送了图片]'
  }
  
  // 3. 语音消息
  if (msgAny.voice) {
    return msgAny.voiceText || '[发送了语音]'
  }
  
  // 4. 位置消息
  if (msgAny.location) {
    return `[分享了位置: ${msgAny.location.name || '未知地点'}]`
  }
  
  // 5. 转账、红包等
  if (msgAny.transfer) {
    return `[转账 ¥${msgAny.transfer.amount}]`
  }
  
  // 6. 情侣空间消息
  if (msgAny.coupleSpace) {
    return `[情侣空间: ${msgAny.coupleSpace.type || '互动'}]`
  }
  
  // 7. 系统消息
  if (msgAny.isSystemMessage) {
    return null // 忽略系统消息
  }
  
  return null
}

/**
 * 收集对话轮次
 * 把用户连续的消息和AI的回复合并成一个完整轮次
 */
export function collectDialogueTurns(messages: Message[]): DialogueTurn[] {
  const turns: DialogueTurn[] = []
  let currentUserMsgs: string[] = []
  
  console.log(`🔍 [收集轮次] 开始处理 ${messages.length} 条消息`)
  
  messages.forEach((msg, index) => {
    const text = getMessageText(msg)
    
    if (!text) {
      // 忽略没有内容的消息
      return
    }
    
    if (msg.type === 'sent') {
      // 用户消息，累积
      currentUserMsgs.push(text)
      console.log(`  [${index}] 用户: ${text.substring(0, 50)}`)
    } else if (msg.type === 'received') {
      // AI回复
      if (currentUserMsgs.length > 0) {
        // 有用户消息，形成完整轮次
        turns.push({
          userMessages: currentUserMsgs,
          aiReply: text,
          timestamp: msg.timestamp || Date.now()
        })
        console.log(`  [${index}] AI: ${text.substring(0, 50)} ✅ 形成轮次`)
        currentUserMsgs = [] // 清空
      } else {
        // AI主动发消息，也记录（作为单独轮次）
        turns.push({
          userMessages: ['(AI主动发消息)'],
          aiReply: text,
          timestamp: msg.timestamp || Date.now()
        })
        console.log(`  [${index}] AI主动: ${text.substring(0, 50)} ⚡`)
      }
    }
  })
  
  console.log(`✅ [收集轮次] 共形成 ${turns.length} 个对话轮次`)
  return turns
}

/**
 * 构建记忆提取 prompt
 */
function buildExtractionPrompt(turns: DialogueTurn[], characterName: string, userName: string): string {
  // 格式化对话历史
  const dialogueText = turns.map((turn, index) => {
    const userText = turn.userMessages.join('\n')
    return `【第${index + 1}轮对话】\n${userName}: ${userText}\n${characterName}: ${turn.aiReply}`
  }).join('\n\n')

  return `提取记忆，严格输出JSON。

角色：${characterName}
对方：${userName}

对话：
${dialogueText}

要求：
- title：6字以内标题
- summary：50-80字总结
- tags：2-4个关键词
- emotionalTone：positive/neutral/negative
- facts：长期有效的事实，没有就[]

⚠️ 只输出JSON，不要任何其他文字：
{"title":"标题","summary":"总结","tags":["标签"],"emotionalTone":"neutral","facts":[]}`
}

/**
 * 从AI回复中解析JSON（单个对象）
 */
function parseMemoryFromAI(response: string): ExtractedMemory | null {
  try {
    let jsonStr = response.trim()
    
    // 1. 移除 markdown 代码块
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }
    
    // 2. 尝试提取 JSON 对象（从 { 到 }）
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
    
    // 3. 处理空值
    if (!jsonStr || jsonStr === 'null') {
      return null
    }
    
    const parsed = JSON.parse(jsonStr)
    
    // 4. 验证必要字段
    if (!parsed || !parsed.summary) {
      console.warn('⚠️ [记忆提取] 缺少summary字段，原始回复:', response.substring(0, 200))
      return null
    }
    
    // 5. 返回规范化的结果
    return {
      title: parsed.title || '对话回忆',
      summary: parsed.summary,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      emotionalTone: parsed.emotionalTone || 'neutral',
      facts: Array.isArray(parsed.facts) ? parsed.facts : []
    }
  } catch (error) {
    console.error('❌ [记忆提取] JSON解析失败:', error)
    console.error('  原始回复:', response.substring(0, 300))
    return null
  }
}

// 朋友圈/互动记忆的结构
interface MomentsMemory {
  title: string
  summary: string
  importance: 'high' | 'normal' | 'low'
  tags: string[]
  emotionalTone: 'positive' | 'neutral' | 'negative'
}

/**
 * 从AI回复中解析JSON数组（用于朋友圈/互动记忆）
 */
function parseMemoryArrayFromAI(response: string): MomentsMemory[] {
  try {
    let jsonStr = response.trim()
    
    // 移除 markdown 代码块
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1]
    }
    
    // 处理空返回
    if (jsonStr === '[]' || jsonStr === '' || jsonStr === 'null') {
      return []
    }
    
    const parsed = JSON.parse(jsonStr)
    
    // 确保是数组
    if (!Array.isArray(parsed)) {
      return []
    }
    
    // 过滤有效记忆
    return parsed.filter((m: any) => m && m.title && m.summary)
  } catch (error) {
    console.error('❌ [记忆提取] 数组JSON解析失败:', error)
    return []
  }
}

/**
 * 获取上次提取的时间戳
 */
function getLastExtractTimestamp(characterId: string, domain: MemoryDomain): number {
  const key = `last_extract_${domain}_${characterId}`
  const stored = localStorage.getItem(key)
  return stored ? parseInt(stored, 10) : 0
}

/**
 * 保存本次提取的时间戳
 */
function saveExtractTimestamp(characterId: string, domain: MemoryDomain, timestamp: number): void {
  const key = `last_extract_${domain}_${characterId}`
  localStorage.setItem(key, timestamp.toString())
}

/**
 * 从对话中提取记忆
 * @param characterId 角色ID
 * @param characterName 角色名称
 * @param messages 消息列表
 * @param domain 记忆领域
 */
export async function extractMemoryFromChat(
  characterId: string,
  characterName: string,
  messages: Message[],
  domain: MemoryDomain = 'chat'
): Promise<number> {
  // 🔥 小号不记录全局记忆
  if (!isMainAccount()) {
    console.log('⏭️ [记忆提取] 当前是小号，跳过记忆提取')
    return 0
  }
  
  console.log('🧠 [记忆提取] 开始提取记忆...')
  
  // 0. 获取上次提取的时间戳，只分析新消息
  const lastExtractTime = getLastExtractTimestamp(characterId, domain)
  const newMessages = messages.filter(m => (m.timestamp || 0) > lastExtractTime)
  
  if (newMessages.length === 0) {
    console.log('⚠️ [记忆提取] 没有新消息，跳过提取')
    return 0
  }
  
  console.log(`📊 [记忆提取] 总消息数: ${messages.length}, 新消息数: ${newMessages.length}`)
  
  // 1. 收集对话轮次（只从新消息中收集）
  const turns = collectDialogueTurns(newMessages)
  
  if (turns.length === 0) {
    console.log('⚠️ [记忆提取] 没有有效的对话轮次')
    return 0
  }
  
  console.log(`📝 [记忆提取] 找到 ${turns.length} 个对话轮次`)
  
  // 调试：打印对话轮次内容
  turns.forEach((turn, index) => {
    console.log(`[轮次 ${index + 1}]`)
    console.log('  用户:', turn.userMessages.join(' | '))
    console.log('  AI:', turn.aiReply.substring(0, 100) + (turn.aiReply.length > 100 ? '...' : ''))
  })
  
  // 2. 获取用户名
  let userName = '对方'
  try {
    const userInfoStr = localStorage.getItem('user_info')
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr)
      userName = userInfo.nickname || userInfo.realName || '对方'
    }
  } catch (e) {
    console.log('获取用户名失败，使用默认值')
  }
  
  // 3. 构建提取 prompt
  const prompt = buildExtractionPrompt(turns, characterName, userName)
  
  try {
    // 3. 调用 zhizhiapi（代付API）
    console.log('🤖 [记忆提取] 调用AI分析...')
    const response = await callZhizhiApi([
      { role: 'user', content: prompt }
    ])
    
    console.log('📄 [记忆提取] AI原始回复:', response)
    
    // 4. 解析AI返回的记忆数据
    const extractedMemory = parseMemoryFromAI(response)
    
    if (!extractedMemory) {
      console.log('ℹ️ [记忆提取] AI认为没有值得记录的内容')
      return 0
    }
    
    // 5. 计算时间范围
    const timestamps = newMessages.map(m => m.timestamp || 0).filter(t => t > 0)
    const timeRange = timestamps.length > 0 ? {
      start: Math.min(...timestamps),
      end: Math.max(...timestamps)
    } : undefined
    
    let savedCount = 0
    
    // 6. 保存总结（如果有）
    if (extractedMemory.summary) {
      await unifiedMemoryService.addMemory({
        domain: 'chat',  // 总结类型
        characterId,
        characterName,
        title: extractedMemory.title,  // 🔥 使用AI生成的标题
        summary: extractedMemory.summary,
        importance: 'normal',
        tags: extractedMemory.tags,    // 🔥 使用AI生成的标签
        timestamp: Date.now(),
        emotionalTone: extractedMemory.emotionalTone,
        extractedBy: 'auto',
        timeRange
      })
      savedCount++
      console.log(`💾 [记忆提取] 已保存: 「${extractedMemory.title}」 标签: [${extractedMemory.tags.join(', ')}]`)
    }
    
    // 7. 保存重要事实（如果有）- 也带上timeRange
    if (extractedMemory.facts && extractedMemory.facts.length > 0) {
      for (const fact of extractedMemory.facts) {
        await unifiedMemoryService.addMemory({
          domain: 'action',  // 记忆类型
          characterId,
          characterName,
          title: '重要记忆',
          summary: fact,
          importance: 'high',  // 重要事实默认高优先级
          tags: ['事实'],
          timestamp: Date.now(),
          emotionalTone: 'neutral',
          extractedBy: 'auto',
          timeRange  // 也带上时间范围
        })
        savedCount++
        console.log(`💾 [记忆提取] 已保存事实: ${fact}`)
      }
    }
    
    console.log(`✅ [记忆提取] 共保存了 ${savedCount} 条记忆`)
    
    // 保存提取时间戳，避免重复提取
    if (newMessages.length > 0) {
      const latestTimestamp = Math.max(...newMessages.map(m => m.timestamp || 0))
      saveExtractTimestamp(characterId, domain, latestTimestamp)
      console.log(`⏰ [记忆提取] 已更新提取时间戳: ${new Date(latestTimestamp).toLocaleString()}`)
    }
    
    return savedCount
    
  } catch (error) {
    console.error('❌ [记忆提取] 提取失败:', error)
    return 0
  }
}

/**
 * 从朋友圈互动中提取记忆
 * @param characterId 角色ID
 * @param characterName 角色名称
 * @param moments 朋友圈数据（包含发帖、点赞、评论）
 */
export async function extractMemoryFromMoments(
  characterId: string,
  characterName: string,
  moments: any[] // 朋友圈数据
): Promise<number> {
  // 🔥 小号不记录全局记忆
  if (!isMainAccount()) {
    console.log('⏭️ [朋友圈记忆提取] 当前是小号，跳过记忆提取')
    return 0
  }
  
  console.log('🧠 [朋友圈记忆提取] 开始提取...')
  
  if (!moments || moments.length === 0) {
    console.log('⚠️ [朋友圈记忆提取] 没有朋友圈数据')
    return 0
  }
  
  // 获取上次提取时间，只分析新朋友圈
  const lastExtractTime = getLastExtractTimestamp(characterId, 'moments')
  
  // 筛选与该角色相关的朋友圈互动（只要新的）
  const relevantMoments = moments.filter(m => 
    (m.timestamp || 0) > lastExtractTime && (
      m.userId === characterId || // 角色发的
      m.comments?.some((c: any) => c.userId === characterId) || // 角色评论的
      m.likes?.includes(characterId) // 角色点赞的
    )
  ).slice(-10) // 最近10条
  
  if (relevantMoments.length === 0) {
    console.log('⚠️ [朋友圈记忆提取] 没有相关互动')
    return 0
  }
  
  // 构建朋友圈互动摘要
  const momentsSummary = relevantMoments.map(m => {
    let summary = `【朋友圈】`
    if (m.userId === characterId) {
      summary += `我发了："${m.content?.substring(0, 100)}"`
    } else {
      summary += `${m.userName}发了："${m.content?.substring(0, 50)}"`
      const myComments = m.comments?.filter((c: any) => c.userId === characterId) || []
      if (myComments.length > 0) {
        summary += `\n我评论：${myComments.map((c: any) => c.content).join('、')}`
      }
      if (m.likes?.includes(characterId)) {
        summary += `\n我点了赞`
      }
    }
    return summary
  }).join('\n\n')
  
  const prompt = `你是角色【${characterName}】。以下是你最近的朋友圈互动记录。

朋友圈互动：
${momentsSummary}

请提取**有长期价值的洞察**：
- 你发朋友圈的**动机和心情**
- 你对别人朋友圈的**感受和态度**
- 你和用户的**关系变化**（如果用户有互动）
- 有多少值得记录的就提取多少

输出JSON格式：
\`\`\`json
[
  {
    "title": "6字标题",
    "summary": "40-80字，以你的视角描述",
    "importance": "high/normal/low",
    "tags": ["关键词"],
    "emotionalTone": "positive/neutral/negative"
  }
]
\`\`\`

如果没有新洞察，返回 []。直接输出JSON。`
  
  try {
    const response = await callZhizhiApi([
      { role: 'user', content: prompt }
    ])
    
    console.log('📄 [朋友圈记忆提取] AI回复:', response)
    
    const extractedMemories = parseMemoryArrayFromAI(response)
    
    if (extractedMemories.length === 0) {
      console.log('ℹ️ [朋友圈记忆提取] 没有值得记录的内容')
      return 0
    }
    
    console.log(`✅ [朋友圈记忆提取] 提取了 ${extractedMemories.length} 条记忆`)
    
    // 计算时间范围
    const timestamps = relevantMoments.map(m => m.timestamp || 0).filter(t => t > 0)
    const timeRange = timestamps.length > 0 ? {
      start: Math.min(...timestamps),
      end: Math.max(...timestamps)
    } : undefined
    
    // 保存到数据库
    let savedCount = 0
    for (const mem of extractedMemories) {
      await unifiedMemoryService.addMemory({
        domain: 'moments',
        characterId,
        characterName,
        title: mem.title,
        summary: mem.summary,
        importance: mem.importance,
        tags: mem.tags,
        timestamp: Date.now(),
        emotionalTone: mem.emotionalTone,
        extractedBy: 'auto',
        timeRange
      })
      savedCount++
    }
    
    console.log(`💾 [朋友圈记忆提取] 已保存 ${savedCount} 条记忆`)
    
    // 保存提取时间戳
    if (savedCount > 0 && relevantMoments.length > 0) {
      const latestTimestamp = Math.max(...relevantMoments.map(m => m.timestamp || 0))
      saveExtractTimestamp(characterId, 'moments', latestTimestamp)
      console.log(`⏰ [朋友圈记忆提取] 已更新提取时间戳`)
    }
    
    return savedCount
    
  } catch (error) {
    console.error('❌ [朋友圈记忆提取] 提取失败:', error)
    return 0
  }
}

/**
 * 从其他互动中提取记忆（线下模式、情侣空间等）
 * @param characterId 角色ID
 * @param characterName 角色名称
 * @param interactions 互动记录摘要（简单的文本描述）
 * @param interactionType 互动类型描述
 */
export async function extractMemoryFromAction(
  characterId: string,
  characterName: string,
  interactions: string[],
  interactionType: string = '互动'
): Promise<number> {
  console.log(`🧠 [${interactionType}记忆提取] 开始提取...`)
  
  if (!interactions || interactions.length === 0) {
    console.log(`⚠️ [${interactionType}记忆提取] 没有互动记录`)
    return 0
  }
  
  const interactionsSummary = interactions.slice(-10).join('\n\n')
  
  const prompt = `你是角色【${characterName}】。以下是你最近的${interactionType}记录。

${interactionType}记录：
${interactionsSummary}

请提取**有长期价值的洞察**：
- 这些互动反映了什么样的**关系动态**？
- 你在这些互动中的**感受和心情**
- 你和对方的**相处模式**
- 有多少值得记录的就提取多少

输出JSON格式：
\`\`\`json
[
  {
    "title": "6字标题",
    "summary": "40-80字，以你的视角描述",
    "importance": "high/normal/low",
    "tags": ["关键词"],
    "emotionalTone": "positive/neutral/negative"
  }
]
\`\`\`

如果没有新洞察，返回 []。直接输出JSON。`
  
  try {
    const response = await callZhizhiApi([
      { role: 'user', content: prompt }
    ])
    
    console.log(`📄 [${interactionType}记忆提取] AI回复:`, response)
    
    const extractedMemories = parseMemoryArrayFromAI(response)
    
    if (extractedMemories.length === 0) {
      console.log(`ℹ️ [${interactionType}记忆提取] 没有值得记录的内容`)
      return 0
    }
    
    console.log(`✅ [${interactionType}记忆提取] 提取了 ${extractedMemories.length} 条记忆`)
    
    // 保存到数据库
    let savedCount = 0
    for (const mem of extractedMemories) {
      await unifiedMemoryService.addMemory({
        domain: 'action',
        characterId,
        characterName,
        title: mem.title,
        summary: mem.summary,
        importance: mem.importance,
        tags: mem.tags,
        timestamp: Date.now(),
        emotionalTone: mem.emotionalTone,
        extractedBy: 'auto'
      })
      savedCount++
    }
    
    console.log(`💾 [${interactionType}记忆提取] 已保存 ${savedCount} 条记忆`)
    return savedCount
    
  } catch (error) {
    console.error(`❌ [${interactionType}记忆提取] 提取失败:`, error)
    return 0
  }
}

/**
 * 按角色的互动计数器管理
 * 每个角色有独立的计数器
 */
class InteractionCounter {
  private threshold = 15 // 每15次互动提取一次
  
  private getStorageKey(characterId: string): string {
    return `interaction_counter_${characterId}`
  }
  
  /**
   * 获取角色的当前计数
   */
  getCount(characterId: string): number {
    const stored = localStorage.getItem(this.getStorageKey(characterId))
    return stored ? parseInt(stored, 10) : 0
  }
  
  /**
   * 增加角色计数
   * @returns 是否达到阈值（需要提取记忆）
   */
  increment(characterId: string): boolean {
    const current = this.getCount(characterId)
    const newCount = current + 1
    
    console.log(`📊 [互动计数] ${characterId}: ${newCount}/${this.threshold}`)
    
    if (newCount >= this.threshold) {
      // 达到阈值，重置计数
      localStorage.setItem(this.getStorageKey(characterId), '0')
      return true
    } else {
      // 更新计数
      localStorage.setItem(this.getStorageKey(characterId), newCount.toString())
      return false
    }
  }
  
  /**
   * 重置角色计数
   */
  reset(characterId: string): void {
    localStorage.setItem(this.getStorageKey(characterId), '0')
  }
  
  /**
   * 获取阈值
   */
  getThreshold(): number {
    return this.threshold
  }
}

export const interactionCounter = new InteractionCounter()

/**
 * 触发单个角色的记忆提取（所有来源）
 * 包括：私聊、群聊（该角色参与的）、朋友圈、论坛、线下记录
 */
export async function triggerCharacterMemoryExtraction(
  characterId: string,
  characterName: string
): Promise<{
  privateChat: number
  groupChat: number
  moments: number
  forum: number
  offline: number
}> {
  console.log(`🎯 [角色记忆提取] ${characterName} 达到15次互动，开始提取记忆...`)
  
  const results = { privateChat: 0, groupChat: 0, moments: 0, forum: 0, offline: 0 }
  
  try {
    // 1. 提取该角色的私聊记忆
    try {
      const { loadMessages } = await import('../utils/simpleMessageManager')
      const chatMessages = loadMessages(characterId)
      if (chatMessages.length > 0) {
        results.privateChat = await extractMemoryFromChat(characterId, characterName, chatMessages, 'chat')
        if (results.privateChat > 0) {
          console.log(`  📱 [私聊] 提取了 ${results.privateChat} 条记忆`)
        }
      }
    } catch (e) {
      console.log(`  ⚠️ [私聊] 提取失败`)
    }
    
    // 2. 提取该角色参与的群聊记忆
    try {
      const { groupChatManager } = await import('../utils/groupChatManager')
      const groups = groupChatManager.getAllGroups()
      
      for (const group of groups) {
        // 检查该角色是否是群成员
        if (!group.members?.some(m => m.id === characterId)) continue
        
        const groupMessages = groupChatManager.getMessages(group.id)
        // 筛选该角色发的消息
        const charMessages = groupMessages.filter(m => m.userId === characterId)
        if (charMessages.length > 0) {
          const formattedMessages: Message[] = charMessages.map((msg, idx) => ({
            id: idx,
            content: msg.content,
            type: 'received' as const,
            timestamp: msg.timestamp || Date.now(),
            time: new Date(msg.timestamp || Date.now()).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          }))
          
          const count = await extractMemoryFromChat(
            characterId,
            `${characterName}在群聊「${group.name}」`,
            formattedMessages,
            'chat'
          )
          results.groupChat += count
          if (count > 0) {
            console.log(`  👥 [群聊] ${group.name}: 提取了 ${count} 条记忆`)
          }
        }
      }
    } catch (e) {
      console.log('  ⚠️ [群聊] 模块加载失败')
    }
    
    // 3. 提取该角色的朋友圈记忆
    try {
      const { loadMoments } = await import('../utils/momentsManager')
      const moments = loadMoments()
      
      if (moments.length > 0) {
        results.moments = await extractMemoryFromMoments(characterId, characterName, moments)
        if (results.moments > 0) {
          console.log(`  📸 [朋友圈] 提取了 ${results.moments} 条记忆`)
        }
      }
    } catch (e) {
      console.log('  ⚠️ [朋友圈] 模块加载失败')
    }
    
    // 4. 提取该角色的论坛互动记忆
    try {
      const postsData = localStorage.getItem('instagram_posts')
      if (postsData) {
        const posts = JSON.parse(postsData)
        
        // 筛选该角色参与的帖子
        const relevantPosts = posts.filter((p: any) => 
          p.userId === characterId || 
          p.comments?.some((c: any) => c.userId === characterId) ||
          p.likes?.includes(characterId)
        )
        
        if (relevantPosts.length > 0) {
          const interactions = relevantPosts.map((p: any) => {
            let summary = `【论坛帖子】`
            if (p.userId === characterId) {
              summary += `我发了："${p.content?.substring(0, 50)}"`
            } else {
              summary += `${p.userName}发了帖子`
              const myComments = p.comments?.filter((c: any) => c.userId === characterId) || []
              if (myComments.length > 0) {
                summary += `，我评论：${myComments.map((c: any) => c.content).join('、')}`
              }
              if (p.likes?.includes(characterId)) {
                summary += `，我点了赞`
              }
            }
            return summary
          })
          
          results.forum = await extractMemoryFromAction(characterId, characterName, interactions, '论坛互动')
          if (results.forum > 0) {
            console.log(`  📝 [论坛] 提取了 ${results.forum} 条记忆`)
          }
        }
      }
    } catch (e) {
      console.log('  ⚠️ [论坛] 模块加载失败')
    }
    
    // 5. 提取该角色的线下记录
    try {
      const { loadMessages } = await import('../utils/simpleMessageManager')
      const allMessages = loadMessages(characterId)
      const offlineRecords = allMessages.filter(m => m.messageType === 'offline-summary')
      
      if (offlineRecords.length > 0) {
        const interactions = offlineRecords.map(r => 
          `【线下记录】${r.offlineSummary?.title || ''}：${r.offlineSummary?.summary || ''}`
        )
        
        results.offline = await extractMemoryFromAction(characterId, characterName, interactions, '线下记录')
        if (results.offline > 0) {
          console.log(`  🏠 [线下] 提取了 ${results.offline} 条记忆`)
        }
      }
    } catch (e) {
      console.log('  ⚠️ [线下] 模块加载失败')
    }
    
    const total = results.privateChat + results.groupChat + results.moments + results.forum + results.offline
    console.log(`✅ [角色记忆提取] ${characterName} 提取完成，共 ${total} 条记忆`)
    return results
    
  } catch (error) {
    console.error(`❌ [角色记忆提取] ${characterName} 提取失败:`, error)
    return results
  }
}

/**
 * 兼容旧接口
 */
export async function triggerMemoryExtraction(
  characterId: string,
  characterName: string
): Promise<{ chat: number; moments: number; action: number }> {
  const results = await triggerCharacterMemoryExtraction(characterId, characterName)
  return {
    chat: results.privateChat + results.groupChat,
    moments: results.moments,
    action: results.forum + results.offline
  }
}

/**
 * 便捷函数：增加角色计数并在达到阈值时自动触发该角色的记忆提取
 * @param characterId 角色ID（必填）
 * @param characterName 角色名称（必填）
 * @returns 是否触发了提取
 */
export async function recordInteraction(
  characterId: string,
  characterName: string
): Promise<boolean> {
  if (!characterId || !characterName) {
    console.warn('⚠️ [记忆计数] 缺少角色信息，跳过计数')
    return false
  }
  
  if (interactionCounter.increment(characterId)) {
    // 达到阈值，异步触发该角色的记忆提取（不阻塞当前操作）
    triggerCharacterMemoryExtraction(characterId, characterName).catch(err => {
      console.error(`❌ [角色记忆提取] ${characterName} 后台提取失败:`, err)
    })
    return true
  }
  return false
}
