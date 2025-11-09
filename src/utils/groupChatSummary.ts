/**
 * 群聊总结AI
 * 使用便宜的API读取大量信息，生成结构化总结
 */

import { callAIApi } from './chatApi'
import type { ChatMessage, ApiSettings } from '../types/chat'
import type { GroupMember, GroupChatMessage } from './groupChatApi'
import { loadMessages } from './simpleMessageManager'
import { summaryApiService } from '../services/summaryApiService'

export interface GroupChatSummary {
  // 时间段记录
  startTime: string  // 本次总结的起始时间
  endTime: string    // 本次总结的结束时间
  
  // 角色状态表格
  characterStates: {
    name: string
    emotion: string          // 当前情绪
    recentAction: string     // 最近行为
    keyDialogue: string      // 关键台词
  }[]
  
  // 关系矩阵
  relationships: {
    from: string
    to: string
    attitude: string         // 态度（依赖、敌对、暗恋等）
    strength: number         // 关系强度 0-100
  }[]
  
  // 重要事件时间线
  timeline: {
    time: string
    event: string
    impact: string           // 影响
  }[]
  
  // 未解决的冲突
  conflicts: string[]
}

/**
 * 生成群聊总结（支持增量总结）
 */
export async function generateGroupChatSummary(
  groupName: string,
  members: GroupMember[],
  messages: GroupChatMessage[],
  privateChatSync?: { enabled: boolean, messageCount: number },
  lastSummary?: GroupChatSummary  // 上次总结（如果有）
): Promise<GroupChatSummary | null> {
  try {
    console.log('📊 [总结AI] 开始生成群聊总结...')
    console.log(`📊 总消息数: ${messages.length}, 是否增量总结: ${!!lastSummary}`)
    
    // 使用独立的副API配置
    const summaryApiConfig = summaryApiService.get()
    const summarySettings: ApiSettings = {
      baseUrl: summaryApiConfig.baseUrl,
      apiKey: summaryApiConfig.apiKey,
      model: summaryApiConfig.model,
      provider: summaryApiConfig.provider,
      temperature: 0.3,  // 总结用较低温度
      maxTokens: 2000
    }
    
    console.log(`📊 [总结AI] 使用副API: ${summarySettings.model}`)
    
    // 构建总结提示词
    const prompt = buildSummaryPrompt(groupName, members, messages, privateChatSync, lastSummary)
    
    // 输出提示词
    console.group('📊 [总结AI] 提示词')
    console.log(prompt)
    console.log(`\n📏 提示词长度: ${prompt.length}字符`)
    console.groupEnd()
    
    // 调用AI
    const apiMessages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ]
    
    const aiReply = await callAIApi(apiMessages, summarySettings)
    
    console.log('📊 [总结AI] 原始回复:', aiReply)
    
    // 解析JSON
    const summary = parseGroupChatSummary(aiReply)
    
    if (summary) {
      console.group('📊 [总结AI] 解析成功')
      console.log('角色状态:', summary.characterStates)
      console.log('关系网络:', summary.relationships)
      console.log('时间线:', summary.timeline)
      console.log('冲突:', summary.conflicts)
      console.groupEnd()
    }
    
    return summary
  } catch (error) {
    console.error('❌ [总结AI] 生成失败:', error)
    return null
  }
}

/**
 * 构建总结提示词（支持增量总结）
 */
function buildSummaryPrompt(
  groupName: string,
  members: GroupMember[],
  messages: GroupChatMessage[],
  privateChatSync?: { enabled: boolean, messageCount: number },
  lastSummary?: GroupChatSummary
): string {
  // AI成员信息
  const aiMembers = members.filter(m => m.type === 'character')
  const aiMembersInfo = aiMembers.map(m => 
    `- **${m.name}**：${m.description}`
  ).join('\n')
  
  // 时间段
  const startTime = messages[0]?.time || messages[0]?.timestamp?.toString() || new Date().toISOString()
  const endTime = messages[messages.length - 1]?.time || messages[messages.length - 1]?.timestamp?.toString() || new Date().toISOString()
  const formatTime = (ts: string | number | undefined) => {
    if (!ts) return ''
    const d = new Date(ts)
    return `${d.getMonth()+1}.${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`
  }
  
  // 群聊记录
  const messageHistory = messages.map(msg => 
    `[${formatTime(msg.time || msg.timestamp)}] [${msg.userName}] ${msg.content}`
  ).join('\n')
  
  // 私聊记录
  let privateChatInfo = ''
  if (privateChatSync && privateChatSync.enabled) {
    privateChatInfo = '\n\n### 私聊记录\n\n'
    aiMembers.forEach(member => {
      const privateMsgs = loadMessages(member.id) || []
      const recentMsgs = privateMsgs.slice(-privateChatSync.messageCount)
      
      if (recentMsgs.length > 0) {
        privateChatInfo += `**${member.name} 与用户的私聊**：\n`
        recentMsgs.forEach(msg => {
          const sender = msg.type === 'sent' ? '用户' : member.name
          privateChatInfo += `[${sender}] ${msg.content}\n`
        })
        privateChatInfo += '\n'
      }
    })
  }
  
  // 上次总结信息
  let previousSummaryInfo = ''
  if (lastSummary) {
    previousSummaryInfo = `
## 上次总结（${formatTime(lastSummary.startTime)} - ${formatTime(lastSummary.endTime)}）

**角色状态：**
${lastSummary.characterStates.map(cs => `- ${cs.name}: ${cs.emotion}, ${cs.recentAction}`).join('\n')}

**关系网络：**
${lastSummary.relationships.map(r => `- ${r.from}→${r.to}: ${r.attitude}(${r.strength}%)`).join('\n')}

**重要事件：**
${lastSummary.timeline.map(t => `- ${t.event}`).join('\n')}

---

**现在请基于上次总结，分析本次新对话（${formatTime(startTime)} - ${formatTime(endTime)}），更新总结。**
`
  }
  
  return `# 群聊总结任务

你是一个专业的群聊总结助手。${lastSummary ? '这是一次增量总结，请基于上次总结，分析本次新对话内容。' : '这是第一次总结。'}

## 基本信息
- 群名：${groupName}
- 成员：${members.map(m => m.name).join('、')}
- 时间段：${formatTime(startTime)} - ${formatTime(endTime)}

## 成员人设
${aiMembersInfo}
${previousSummaryInfo}
## 本次对话记录（${messages.length}条）
${messageHistory}
${privateChatInfo}

---

## 总结要求

${lastSummary ? '**重要：这是增量总结！请只关注本次新对话的内容，不要重复上次的总结。**' : ''}

请生成JSON格式的总结，注意：

1. **时间段必填**：startTime和endTime记录本次总结的时间范围
2. **角色状态**：记录每个AI角色在**本次对话后**的最新状态
3. **关系变化**：记录本次对话中关系的**变化**（如果没变化就保持上次的）
4. **重要事件**：只记录**本次对话中**发生的重要事件，格式："HH:MM 发生了什么"
5. **具体细节**：keyDialogue要引用实际对话，event要具体（不要泛泛而谈）

\`\`\`json
{
  "startTime": "${startTime}",
  "endTime": "${endTime}",
  "characterStates": [
    {
      "name": "角色名",
      "emotion": "具体情绪（开心/生气/紧张等）",
      "recentAction": "本次对话中做了什么",
      "keyDialogue": "实际说过的一句话"
    }
  ],
  "relationships": [
    {
      "from": "角色A",
      "to": "角色B",
      "attitude": "态度描述",
      "strength": 0-100数字
    }
  ],
  "timeline": [
    {
      "time": "HH:MM",
      "event": "具体发生了什么事",
      "impact": "造成了什么影响"
    }
  ],
  "conflicts": ["未解决的具体冲突"]
}
\`\`\`

只输出JSON，不要其他内容。`
}

/**
 * 解析总结JSON
 */
function parseGroupChatSummary(aiReply: string): GroupChatSummary | null {
  try {
    // 提取JSON
    const jsonMatch = aiReply.match(/```json\s*([\s\S]*?)\s*```/) || 
                     aiReply.match(/```\s*([\s\S]*?)\s*```/) ||
                     [null, aiReply]
    
    if (!jsonMatch || !jsonMatch[1]) {
      console.error('❌ 无法提取JSON')
      return null
    }
    
    const jsonStr = jsonMatch[1].trim()
    const summary = JSON.parse(jsonStr) as GroupChatSummary
    
    // 验证必需字段
    if (!summary.characterStates || !summary.relationships || !summary.timeline) {
      console.error('❌ 缺少必需字段')
      return null
    }
    
    return summary
  } catch (error) {
    console.error('❌ 解析总结失败:', error)
    return null
  }
}

/**
 * 将总结转换为可读的Markdown文本（显示给用户）
 */
export function formatSummaryForDisplay(summary: GroupChatSummary): string {
  // 格式化时间
  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`
  }
  
  let text = `**时间段：${formatTime(summary.startTime)} - ${formatTime(summary.endTime)}**\n\n`
  
  // 角色状态表
  text += '### 角色当前状态\n\n'
  text += '| 角色 | 情绪 | 最近行为 | 关键台词 |\n'
  text += '|------|------|---------|----------|\n'
  summary.characterStates.forEach(cs => {
    text += `| ${cs.name} | ${cs.emotion} | ${cs.recentAction} | "${cs.keyDialogue}" |\n`
  })
  
  // 关系网络
  text += '\n### 关系网络\n\n'
  summary.relationships.forEach(rel => {
    const strengthBar = '='.repeat(Math.floor(rel.strength / 10))
    text += `- ${rel.from} → ${rel.to}：${rel.attitude} [${strengthBar} ${rel.strength}%]\n`
  })
  
  // 时间线
  text += '\n### 重要事件\n\n'
  summary.timeline.forEach((event, i) => {
    text += `${i + 1}. [${event.time}] ${event.event}\n   → ${event.impact}\n`
  })
  
  // 冲突
  if (summary.conflicts.length > 0) {
    text += '\n### 未解决的冲突\n\n'
    summary.conflicts.forEach((conflict, i) => {
      text += `${i + 1}. ${conflict}\n`
    })
  }
  
  return text
}
