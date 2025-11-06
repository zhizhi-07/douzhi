/**
 * 简单通知管理器
 */

interface UnreadCount {
  [chatId: string]: number
}

const UNREAD_KEY = 'unread_counts'
const NOTIFIED_KEY = 'notified_messages'

/**
 * 获取未读数
 */
export function getUnreadCount(chatId: string): number {
  try {
    const data = localStorage.getItem(UNREAD_KEY)
    const counts: UnreadCount = data ? JSON.parse(data) : {}
    return counts[chatId] || 0
  } catch {
    return 0
  }
}

/**
 * 设置未读数
 */
export function setUnreadCount(chatId: string, count: number): void {
  try {
    const data = localStorage.getItem(UNREAD_KEY)
    const counts: UnreadCount = data ? JSON.parse(data) : {}
    counts[chatId] = count
    localStorage.setItem(UNREAD_KEY, JSON.stringify(counts))
    
    // 触发更新事件
    window.dispatchEvent(new CustomEvent('unread-updated', {
      detail: { chatId, count }
    }))
  } catch (error) {
    console.error('设置未读数失败:', error)
  }
}

/**
 * 清除未读数
 */
export function clearUnread(chatId: string): void {
  setUnreadCount(chatId, 0)
}

/**
 * 增加未读数
 */
export function incrementUnread(chatId: string): void {
  const current = getUnreadCount(chatId)
  setUnreadCount(chatId, current + 1)
}

/**
 * 检查消息是否已通知过
 */
export function isMessageNotified(messageId: number): boolean {
  try {
    const data = localStorage.getItem(NOTIFIED_KEY)
    const notified: number[] = data ? JSON.parse(data) : []
    return notified.includes(messageId)
  } catch {
    return false
  }
}

/**
 * 标记消息已通知
 */
export function markMessageNotified(messageId: number): void {
  try {
    const data = localStorage.getItem(NOTIFIED_KEY)
    const notified: number[] = data ? JSON.parse(data) : []
    if (!notified.includes(messageId)) {
      notified.push(messageId)
      // 只保留最近1000条
      if (notified.length > 1000) {
        notified.splice(0, notified.length - 1000)
      }
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified))
    }
  } catch (error) {
    console.error('标记通知失败:', error)
  }
}

/**
 * 显示通知
 */
export function showNotification(chatId: string, title: string, message: string, avatar?: string): void {
  window.dispatchEvent(new CustomEvent('show-notification', {
    detail: { chatId, title, message, avatar }
  }))
}
