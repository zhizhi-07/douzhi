/**
 * 聊天状态管理Hook
 * 负责：角色信息、消息列表、输入框、错误状态等
 */

import { useState, useEffect, useRef } from 'react'
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
   * 自动保存消息到localStorage（防抖500ms）
   */
  const saveTimeoutRef = useRef<number>()
  
  useEffect(() => {
    if (chatId && messages.length > 0) {
      // 清除之前的定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      // 延迟保存
      saveTimeoutRef.current = setTimeout(() => {
        saveChatMessages(chatId, messages)
      }, 500)
    }
    
    // 清理函数
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [messages, chatId])
  
  /**
   * 监听其他聊天的通知消息（例如亲密付通知）
   */
  useEffect(() => {
    console.log(`🎧 [${chatId}] 开始监听实时通知`)
    
    const handleNotification = (event: CustomEvent) => {
      const { chatId: notificationChatId, message } = event.detail
      
      console.log(`📡 收到通知事件: 目标=${notificationChatId}, 当前=${chatId}`, message.content)
      
      // 如果通知是给当前聊天的，添加到消息列表
      if (notificationChatId === chatId) {
        console.log('✅ 通知匹配，添加到消息列表')
        setMessages(prev => {
          console.log(`📝 当前消息数: ${prev.length}, 新增后: ${prev.length + 1}`)
          return [...prev, message]
        })
      } else {
        console.log('❌ 通知不匹配，跳过')
      }
    }
    
    window.addEventListener('chat-notification-received', handleNotification as EventListener)
    
    return () => {
      console.log(`🔌 [${chatId}] 停止监听实时通知`)
      window.removeEventListener('chat-notification-received', handleNotification as EventListener)
    }
  }, [chatId])
  
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
