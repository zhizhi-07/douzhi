/**
 * 数据收集器
 * 负责收集角色信息、聊天记录、朋友圈历史等数据供AI分析
 */

import type { CharacterInfo } from '../../types/momentsAI'
import type { Message } from '../../types/chat'
import { loadMoments } from '../momentsManager'
import { loadMessages } from '../simpleMessageManager'
import { getRecentAIInteractions } from '../aiInteractionMemory'
import { extractNPCsFromPersonality, type NPCInfo } from '../npcExtractor'

/**
 * 获取角色的最近聊天记录
 */
export function getRecentChatHistory(characterId: string, limit: number = 30): Message[] {
  const messages = loadMessages(characterId)
  
  // 只取文本消息，过滤掉系统消息、转账等特殊类型
  const textMessages = messages.filter(msg => 
    !msg.messageType || msg.messageType === 'text'
  )
  
  return textMessages.slice(-limit)
}

/**
 * 将聊天记录格式化为AI可读的上下文
 */
export function formatChatContext(messages: Message[]): string {
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
 * 收集所有角色信息
 */
export function collectCharactersInfo(characters: any[]): CharacterInfo[] {
  return characters.map(char => {
    const chatHistory = getRecentChatHistory(char.id, 30)
    return {
      id: char.id,
      name: char.realName,
      personality: char.personality || '温柔体贴',
      chatCount: chatHistory.length,
      recentChat: formatChatContext(chatHistory)
    }
  })
}

/**
 * 格式化朋友圈历史供AI阅读
 */
export function formatMomentsHistory(): string {
  const moments = loadMoments().slice(0, 10)
  
  if (moments.length === 0) {
    return '还没有朋友圈历史'
  }
  
  return moments.map((m, i) => {
    const time = new Date(m.createdAt).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const likesText = m.likes.length > 0 
      ? `\n  点赞：${m.likes.map(l => l.userName).join('、')}` 
      : ''
    
    const commentsText = m.comments.length > 0
      ? `\n  评论：\n${m.comments.map(c => `    ${c.userName}: ${c.content}`).join('\n')}`
      : ''
    
    return `${i + 1}. [${time}] ${m.userName}: ${m.content}${likesText}${commentsText}`
  }).join('\n\n')
}

/**
 * 获取AI互动记忆（供AI导演参考）
 */
export function formatAIMemory(): string {
  return getRecentAIInteractions(30)
}

/**
 * 收集单个角色的NPC信息（用于AI发朋友圈时）
 * @param characterId 角色ID
 * @param characterName 角色名
 * @param personality 人设
 * @param world 世界观
 * @returns NPC信息数组
 */
export async function collectCharacterNPCs(
  characterId: string,
  characterName: string,
  personality: string,
  world?: string
): Promise<Array<NPCInfo & { ownerId: string, ownerName: string }>> {
  const npcs = await extractNPCsFromPersonality(
    characterId,
    characterName,
    personality,
    world
  )
  
  const npcList = npcs.map(npc => ({
    ...npc,
    ownerId: characterId,
    ownerName: characterName
  }))
  
  console.log(`📋 收集到 ${characterName} 的 ${npcList.length} 个NPC`)
  return npcList
}

/**
 * 格式化NPC信息供AI导演阅读
 */
export function formatNPCsInfo(npcs: Array<NPCInfo & { ownerName: string }>): string {
  if (npcs.length === 0) {
    return '（没有检测到NPC角色）'
  }
  
  // 按所属角色分组
  const grouped = npcs.reduce((acc, npc) => {
    if (!acc[npc.ownerName]) {
      acc[npc.ownerName] = []
    }
    acc[npc.ownerName].push(npc)
    return acc
  }, {} as Record<string, Array<NPCInfo & { ownerName: string }>>)
  
  const formatted = Object.entries(grouped).map(([ownerName, npcList]) => {
    const npcText = npcList.map(npc => 
      `  - ${npc.name}${npc.avatar ? ' ' + npc.avatar : ''}: ${npc.relationship}，${npc.personality}`
    ).join('\n')
    
    return `${ownerName}的世界里的人物:\n${npcText}`
  }).join('\n\n')
  
  return `## 虚拟NPC角色（可以参与互动）\n${formatted}`
}
