/**
 * 聊天记录搜索和按日期归档工具
 * 功能：
 * 1. 按日期归档聊天记录
 * 2. 搜索聊天记录（关键词匹配）
 * 3. 按日期范围筛选
 */

import type { Message } from '../types/chat'
import { ensureMessagesLoaded } from './simpleMessageManager'

// 日期格式化工具
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${year}年${month}月${day}日`
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 按日期分组的消息
export interface DateGroupedMessages {
  date: string           // 格式：2024-12-15
  dateDisplay: string    // 格式：2024年12月15日
  messages: Message[]
  messageCount: number
}

// 搜索结果
export interface SearchResult {
  message: Message
  date: string
  dateDisplay: string
  time: string
  matchedText: string    // 匹配的文本片段
  highlightStart: number // 高亮起始位置
  highlightEnd: number   // 高亮结束位置
}

/**
 * 按日期归档聊天记录
 */
export async function getMessagesByDate(chatId: string): Promise<DateGroupedMessages[]> {
  const messages = await ensureMessagesLoaded(chatId)
  
  // 按日期分组
  const dateMap = new Map<string, Message[]>()
  
  messages.forEach(msg => {
    if (!msg.timestamp) return
    const dateKey = formatDate(msg.timestamp)
    
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, [])
    }
    dateMap.get(dateKey)!.push(msg)
  })
  
  // 转换为数组并排序（最新的日期在前）
  const result: DateGroupedMessages[] = []
  
  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a))
  
  sortedDates.forEach(date => {
    const msgs = dateMap.get(date)!
    result.push({
      date,
      dateDisplay: formatDateDisplay(date),
      messages: msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
      messageCount: msgs.length
    })
  })
  
  return result
}

/**
 * 搜索聊天记录
 * @param chatId 聊天ID
 * @param keyword 搜索关键词
 * @param options 搜索选项
 */
export async function searchMessages(
  chatId: string,
  keyword: string,
  options?: {
    startDate?: string  // 开始日期 YYYY-MM-DD
    endDate?: string    // 结束日期 YYYY-MM-DD
    sender?: 'user' | 'ai' | 'all'  // 发送者筛选
    limit?: number      // 结果数量限制
  }
): Promise<SearchResult[]> {
  if (!keyword.trim()) {
    return []
  }
  
  const messages = await ensureMessagesLoaded(chatId)
  const results: SearchResult[] = []
  const searchKeyword = keyword.toLowerCase()
  const limit = options?.limit || 100
  
  for (const msg of messages) {
    if (results.length >= limit) break
    
    // 检查时间范围
    if (msg.timestamp) {
      const msgDate = formatDate(msg.timestamp)
      if (options?.startDate && msgDate < options.startDate) continue
      if (options?.endDate && msgDate > options.endDate) continue
    }
    
    // 检查发送者
    if (options?.sender && options.sender !== 'all') {
      if (options.sender === 'user' && msg.type !== 'sent') continue
      if (options.sender === 'ai' && msg.type !== 'received') continue
    }
    
    // 搜索内容
    const content = msg.content || ''
    const lowerContent = content.toLowerCase()
    const matchIndex = lowerContent.indexOf(searchKeyword)
    
    if (matchIndex !== -1) {
      // 提取匹配的文本片段（前后各取30个字符）
      const start = Math.max(0, matchIndex - 30)
      const end = Math.min(content.length, matchIndex + searchKeyword.length + 30)
      let matchedText = content.substring(start, end)
      
      // 添加省略号
      if (start > 0) matchedText = '...' + matchedText
      if (end < content.length) matchedText = matchedText + '...'
      
      results.push({
        message: msg,
        date: msg.timestamp ? formatDate(msg.timestamp) : '',
        dateDisplay: msg.timestamp ? formatDateDisplay(formatDate(msg.timestamp)) : '',
        time: msg.timestamp ? formatTime(msg.timestamp) : '',
        matchedText,
        highlightStart: start > 0 ? matchIndex - start + 3 : matchIndex - start,
        highlightEnd: start > 0 ? matchIndex - start + 3 + searchKeyword.length : matchIndex - start + searchKeyword.length
      })
    }
  }
  
  // 按时间倒序排列（最新的在前）
  results.sort((a, b) => (b.message.timestamp || 0) - (a.message.timestamp || 0))
  
  return results
}

export type MediaType = 'image' | 'video' | 'file' | 'link' | 'music' | 'transaction'

/**
 * 获取指定类型的消息
 */
export async function getMessagesByMediaType(chatId: string, type: MediaType): Promise<Message[]> {
  const messages = await ensureMessagesLoaded(chatId)
  
  return messages.filter(msg => {
    // 撤回的消息不显示
    if (msg.isRecalled) return false

    switch (type) {
      case 'image':
        return msg.messageType === 'photo' || !!msg.photoBase64
      case 'video':
        // 暂时没有明确的视频文件类型
        return false 
      case 'link':
        // 简单的URL正则，且不是特殊类型的消息
        return (
          msg.type !== 'system' && 
          !msg.messageType && 
          msg.content && 
          /(https?:\/\/[^\s]+)/g.test(msg.content)
        )
      case 'music':
        return msg.messageType === 'musicShare' || msg.messageType === 'musicInvite'
      case 'transaction':
        return [
          'transfer', 'intimatePay', 'paymentRequest', 'shop', 
          'purchase', 'shoppingCart', 'cartPaymentRequest', 'giftCart'
        ].includes(msg.messageType || '')
      default:
        return false
    }
  }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

/**
 * 获取指定日期的聊天记录
 */
export async function getMessagesForDate(chatId: string, date: string): Promise<Message[]> {
  const messages = await ensureMessagesLoaded(chatId)
  
  return messages.filter(msg => {
    if (!msg.timestamp) return false
    return formatDate(msg.timestamp) === date
  }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
}

/**
 * 获取聊天记录统计信息
 */
export async function getChatStats(chatId: string): Promise<{
  totalMessages: number
  userMessages: number
  aiMessages: number
  dateRange: { start: string; end: string } | null
  dailyCounts: { date: string; count: number }[]
}> {
  const messages = await ensureMessagesLoaded(chatId)
  
  let userMessages = 0
  let aiMessages = 0
  let minTimestamp = Infinity
  let maxTimestamp = 0
  const dailyCounts = new Map<string, number>()
  
  messages.forEach(msg => {
    if (msg.type === 'sent') {
      userMessages++
    } else if (msg.type === 'received') {
      aiMessages++
    }
    
    if (msg.timestamp) {
      if (msg.timestamp < minTimestamp) minTimestamp = msg.timestamp
      if (msg.timestamp > maxTimestamp) maxTimestamp = msg.timestamp
      
      const dateKey = formatDate(msg.timestamp)
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1)
    }
  })
  
  const dateRange = messages.length > 0 && minTimestamp !== Infinity
    ? { start: formatDate(minTimestamp), end: formatDate(maxTimestamp) }
    : null
  
  // 转换dailyCounts为数组并排序
  const dailyCountsArray = Array.from(dailyCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
  
  return {
    totalMessages: messages.length,
    userMessages,
    aiMessages,
    dateRange,
    dailyCounts: dailyCountsArray
  }
}

/**
 * 导出指定日期范围的聊天记录
 */
export async function exportMessagesByDateRange(
  chatId: string,
  startDate: string,
  endDate: string
): Promise<{ date: string; messages: Message[] }[]> {
  const dateGrouped = await getMessagesByDate(chatId)
  
  return dateGrouped
    .filter(group => group.date >= startDate && group.date <= endDate)
    .map(group => ({
      date: group.date,
      messages: group.messages
    }))
}
