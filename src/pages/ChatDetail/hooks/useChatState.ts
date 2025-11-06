/**
 * 聊天状态管理Hook
 * 负责：角色信息、消息列表、输入框、错误状态等
 */

import { useState, useEffect } from 'react'
import type { Character, Message } from '../../../types/chat'
import { characterService } from '../../../services/characterService'
import { loadMessages } from '../../../utils/simpleMessageManager'
import { clearUnread } from '../../../utils/simpleNotificationManager'

export const useChatState = (chatId: string) => {
  // 角色信息
  const [character, setCharacter] = useState<Character | null>(null)
  
  // 消息列表
  const [messages, setMessages] = useState<Message[]>([])
  
  // 输入框
  const [inputValue, setInputValue] = useState('')
  
  // 错误状态
  const [error, setError] = useState<string | null>(null)
  
  /**
   * 初始化：加载角色和历史消息
   */
  useEffect(() => {
    if (!chatId) return
    
    const char = characterService.getById(chatId)
    setCharacter(char)
    
    const savedMessages = loadMessages(chatId)
    setMessages(savedMessages)
    
    // 清除未读数
    clearUnread(chatId)
  }, [chatId])
  
  // 消息保存逻辑已移到创建时立即保存，这里不再需要
  
  return {
    character,
    messages,
    setMessages,  // 直接返回原始setMessages，不包装
    inputValue,
    setInputValue,
    error,
    setError
  }
}
