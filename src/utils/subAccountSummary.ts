/**
 * 小号聊天总结管理
 * 记录小号和角色的聊天总结，作为主账号的"小插曲"
 */

import type { Message } from '../types/chat'

export interface SubAccountChatSummary {
  accountId: string      // 小号ID
  accountName: string    // 小号名字
  characterId: string    // 角色ID
  summary: string        // 总结内容
  timestamp: number      // 总结时间
  messageCount: number   // 消息数量
  startTime?: number     // 对话开始时间
  endTime?: number       // 对话结束时间
}

const STORAGE_KEY = 'sub_account_summaries'

/**
 * 获取所有小号聊天总结
 */
export function getAllSummaries(): SubAccountChatSummary[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * 获取某角色的所有小号聊天总结
 */
export function getSummariesByCharacter(characterId: string): SubAccountChatSummary[] {
  return getAllSummaries().filter(s => s.characterId === characterId)
}

/**
 * 保存小号聊天总结
 */
export function saveSummary(summary: SubAccountChatSummary): void {
  const summaries = getAllSummaries()
  
  // 查找是否已存在该小号和角色的总结
  const existingIndex = summaries.findIndex(
    s => s.accountId === summary.accountId && s.characterId === summary.characterId
  )
  
  if (existingIndex >= 0) {
    // 更新已有总结
    summaries[existingIndex] = summary
  } else {
    // 添加新总结
    summaries.push(summary)
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(summaries))
  console.log('💾 保存小号聊天总结:', summary.accountName, '->', summary.characterId)
}

/**
 * 调用zhizhiapi生成聊天总结
 */
export async function generateSummary(
  _characterId: string,
  characterName: string,
  _accountId: string,
  accountName: string,
  messages: Message[]
): Promise<string> {
  if (messages.length === 0) {
    return '暂无聊天记录'
  }

  // 构建聊天内容
  const chatContent = messages.slice(-50).map(m => {
    const sender = m.type === 'sent' ? accountName : characterName
    return `${sender}: ${m.content || ''}`
  }).join('\n')

  // 使用 zhizhiapi
  const { callZhizhiApi } = await import('../services/zhizhiapi')
  
  const prompt = `总结以下聊天记录，用一句话描述这个人来找${characterName}聊了什么。
要求：简洁、口语化、不要emoji、不要分点。

聊天记录：
${chatContent}

用一句话总结（格式：有个叫${accountName}的人来找我聊天，xxx）：`

  const result = await callZhizhiApi([{ role: 'user', content: prompt }], { 
    temperature: 0.7, 
    max_tokens: 300 
  })
  
  return result || '总结生成失败'
}

/**
 * 格式化小号总结供AI阅读
 */
export function formatSummariesForPrompt(characterId: string): string {
  const summaries = getSummariesByCharacter(characterId)
  
  if (summaries.length === 0) {
    return ''
  }

  const summaryTexts = summaries.map(s => {
    const date = new Date(s.timestamp).toLocaleDateString('zh-CN')
    return `- 【${date}】有个叫「${s.accountName}」的陌生人来找你聊过天：${s.summary}`
  }).join('\n')

  return `
# 📝 小插曲（你和陌生人的交流记录）
以下是一些陌生人来找你聊天的记录，你可以当作生活中的小插曲：

${summaryTexts}

这些人你都不认识，只是偶然来找你聊天的路人。
`
}
