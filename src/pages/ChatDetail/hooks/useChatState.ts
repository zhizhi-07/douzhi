/**
 * 聊天状态管理Hook
 * 负责：角色信息、消息列表、输入框、错误状态等
 */

import { useState, useEffect } from 'react'
import type { Character, Message } from '../../../types/chat'
import { characterService } from '../../../services/characterService'
import { loadChatMessages, saveChatMessages } from '../../../utils/messageUtils'

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
    
    const savedMessages = loadChatMessages(chatId)
    setMessages(savedMessages)
  }, [chatId])
  
  /**
   * 自动保存消息到localStorage
   */
  useEffect(() => {
    if (chatId && messages.length > 0) {
      saveChatMessages(chatId, messages)
    }
  }, [messages, chatId])
  
  return {
    character,
    messages,
    setMessages,
    inputValue,
    setInputValue,
    error,
    setError
  }
}
