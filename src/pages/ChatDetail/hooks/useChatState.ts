/**
 * 聊天状态管理Hook
 * 负责：角色信息、消息列表、输入框、错误状态等
 */

import { useState, useEffect, useCallback } from 'react'
import type { Character, Message } from '../../../types/chat'
import { characterService } from '../../../services/characterService'
import { loadMessages } from '../../../utils/simpleMessageManager'
import { clearUnread } from '../../../utils/simpleNotificationManager'

export const useChatState = (chatId: string) => {
  // 角色信息
  const [character, setCharacter] = useState<Character | null>(null)
  
  // 消息列表（React状态）
  const [messages, setMessagesState] = useState<Message[]>([])
  
  // 包装setMessages：仅更新React状态
  const setMessages = useCallback((fn: ((prev: Message[]) => Message[]) | Message[]) => {
    console.log(`📞 [useChatState] setMessages 被调用`)
    setMessagesState(fn)
  }, [])
  
  // 🔥 禁用自动保存，改为手动控制保存
  // 原因：避免重复保存导致的问题，现在由各个Hook手动调用saveMessages
  // useEffect(() => {
  //   if (messages.length > 0 && chatId) {
  //     console.log(`💾 [useChatState] 监听到消息变化，保存: chatId=${chatId}, count=${messages.length}`)
  //     saveMessages(chatId, messages)
  //   }
  // }, [messages, chatId])
  
  // 输入框
  const [inputValue, setInputValue] = useState('')
  
  // 错误状态
  const [error, setError] = useState<string | null>(null)
  
  /**
   * 刷新角色信息
   */
  const refreshCharacter = useCallback(() => {
    if (!chatId) return
    const char = characterService.getById(chatId)
    setCharacter(char)
    console.log('🔄 角色信息已刷新:', char?.nickname || char?.realName)
  }, [chatId])
  
  /**
   * 加载消息（提取为函数，便于复用）
   */
  const loadChatMessages = useCallback(() => {
    if (!chatId) return
    
    const savedMessages = loadMessages(chatId)
    console.log(`📨 [useChatState] 加载消息: chatId=${chatId}, 总数=${savedMessages.length}`)
    const systemMessages = savedMessages.filter(m => m.type === 'system')
    console.log(`📨 [useChatState] 系统消息数: ${systemMessages.length}`)
    if (systemMessages.length > 0) {
      console.table(systemMessages.map(m => ({
        id: m.id,
        content: m.content,
        messageType: m.messageType,
        timestamp: m.timestamp
      })))
    }
    // 直接设置状态，不触发保存（因为是从IndexedDB加载的）
    setMessagesState(savedMessages)
    
    // 清除未读数
    clearUnread(chatId)
  }, [chatId])

  /**
   * 初始化：加载角色和历史消息
   */
  useEffect(() => {
    if (!chatId) return
    
    const char = characterService.getById(chatId)
    setCharacter(char)
    
    loadChatMessages()
  }, [chatId])
  
  /**
   * 监听页面可见性和焦点，当返回聊天窗口时重新加载消息
   * 解决：在其他页面时AI回复了消息，返回时需要自动显示
   */
  useEffect(() => {
    if (!chatId) return
    
    // 页面可见性变化时重新加载
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 [useChatState] 页面重新可见，重新加载消息')
        loadChatMessages()
        refreshCharacter()  // 同时刷新角色信息
      }
    }
    
    // 窗口获得焦点时重新加载
    const handleFocus = () => {
      console.log('📱 [useChatState] 窗口获得焦点，重新加载消息')
      loadChatMessages()
      refreshCharacter()  // 同时刷新角色信息
    }
    
    // 🔥 监听异步加载完成事件
    const handleMessagesLoaded = (e: CustomEvent) => {
      if (e.detail.chatId === chatId) {
        // 🔥 AI回复期间不响应加载事件，避免消息一次性显示
        if ((window as any).__AI_REPLYING__) {
          console.log('🚫 [useChatState] AI回复中，忽略messages-loaded事件')
          return
        }
        console.log('📥 [useChatState] 异步加载完成，刷新UI')
        loadChatMessages()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('messages-loaded', handleMessagesLoaded as EventListener)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('messages-loaded', handleMessagesLoaded as EventListener)
    }
  }, [chatId, loadChatMessages, refreshCharacter])
  
  return {
    character,
    messages,
    setMessages,  // 直接返回原始setMessages，不包装
    inputValue,
    setInputValue,
    error,
    setError,
    refreshCharacter
  }
}
