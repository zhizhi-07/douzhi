/**
 * 简单消息管理器
 * 直接操作localStorage，不依赖React状态
 */

import type { Message } from '../types/chat'

const MESSAGE_KEY_PREFIX = 'chat_messages_'

/**
 * 加载消息
 */
export function loadMessages(chatId: string): Message[] {
  try {
    const key = MESSAGE_KEY_PREFIX + chatId
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('加载消息失败:', error)
    return []
  }
}

/**
 * 保存消息
 */
export function saveMessages(chatId: string, messages: Message[]): void {
  try {
    const key = MESSAGE_KEY_PREFIX + chatId
    localStorage.setItem(key, JSON.stringify(messages))
    console.log(`💾 保存消息: chatId=${chatId}, count=${messages.length}`)
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

/**
 * 添加一条消息（立即保存）
 */
export function addMessage(chatId: string, message: Message): void {
  const messages = loadMessages(chatId)
  messages.push(message)
  saveMessages(chatId, messages)
  
  // 触发事件通知
  window.dispatchEvent(new CustomEvent('new-message', {
    detail: { chatId, message }
  }))
  console.log(`📡 触发new-message事件: chatId=${chatId}`)
}

/**
 * 删除一条消息（永久删除）
 */
export function deleteMessage(chatId: string, messageId: number): void {
  try {
    const messages = loadMessages(chatId)
    const filteredMessages = messages.filter(m => m.id !== messageId)
    saveMessages(chatId, filteredMessages)
    console.log(`🗑️ 已删除消息: chatId=${chatId}, messageId=${messageId}`)
  } catch (error) {
    console.error('删除消息失败:', error)
  }
}

/**
 * 更新一条消息（永久修改）
 */
export function updateMessage(chatId: string, updatedMessage: Message): void {
  try {
    const messages = loadMessages(chatId)
    const updatedMessages = messages.map(m => 
      m.id === updatedMessage.id ? updatedMessage : m
    )
    saveMessages(chatId, updatedMessages)
    console.log(`✏️ 已更新消息: chatId=${chatId}, messageId=${updatedMessage.id}`)
  } catch (error) {
    console.error('更新消息失败:', error)
  }
}

/**
 * 创建文本消息
 */
export function createTextMessage(content: string, type: 'sent' | 'received'): Message {
  return {
    id: Date.now(),
    type,
    content,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    messageType: 'text'
  }
}
