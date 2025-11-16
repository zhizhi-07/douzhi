/**
 * 聊天状态管理Hook
 * 负责：角色信息、消息列表、输入框、错误状态等
 */

import { useState, useEffect, useCallback } from 'react'
import type { Character, Message } from '../../../types/chat'
import { characterService } from '../../../services/characterService'
import { ensureMessagesLoaded, loadMessagesPaginated, getMessageCount } from '../../../utils/simpleMessageManager'
import { clearUnread } from '../../../utils/simpleNotificationManager'

export const useChatState = (chatId: string) => {
  // 角色信息
  const [character, setCharacter] = useState<Character | null>(null)

  // 消息列表（React状态）
  const [messages, setMessagesState] = useState<Message[]>([])

  // 🔥 分页加载状态
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [totalMessageCount, setTotalMessageCount] = useState(0)
  const [currentOffset, setCurrentOffset] = useState(0)

  // 包装setMessages：仅更新React状态
  const setMessages = useCallback((fn: ((prev: Message[]) => Message[]) | Message[]) => {
    if (import.meta.env.DEV) {
      console.log(`📂 [useChatState] setMessages 被调用`)
    }
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
   * 刷新角色信息（带重试机制）
   */
  const refreshCharacter = useCallback(() => {
    if (!chatId) return
    
    const loadCharacterWithRetry = (retryCount = 0) => {
      const char = characterService.getById(chatId)
      
      if (char) {
        setCharacter(char)
        if (import.meta.env.DEV) {
          console.log('🔄 角色信息已刷新:', char.nickname || char.realName)
        }
      } else if (retryCount < 2) {
        // 最多重试2次
        setTimeout(() => loadCharacterWithRetry(retryCount + 1), 50)
      } else {
        console.warn(`⚠️ 刷新角色失败，ID: ${chatId}`)
      }
    }
    
    loadCharacterWithRetry()
  }, [chatId])
  
  /**
   * 🔥 分页加载消息（初次加载最近50条）
   */
  const loadChatMessagesInitial = useCallback(async () => {
    if (!chatId) return

    setIsLoadingMessages(true)

    try {
      // 获取总数
      const total = await getMessageCount(chatId)
      setTotalMessageCount(total)

      // 🔥 初次只加载最近30条消息（减少初始加载，提升性能）
      const INITIAL_LOAD_COUNT = 30
      const { messages: initialMessages, hasMore } = await loadMessagesPaginated(
        chatId,
        INITIAL_LOAD_COUNT,
        0
      )

      if (import.meta.env.DEV) {
        console.log(`📨 [分页加载] 初次加载: chatId=${chatId}, 加载=${initialMessages.length}, 总数=${total}, 还有更多=${hasMore}`)
      }

      setMessagesState(initialMessages)
      setHasMoreMessages(hasMore)
      setCurrentOffset(initialMessages.length)

      // 清除未读数
      clearUnread(chatId)
    } catch (error) {
      console.error('加载消息失败:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [chatId])

  /**
   * 🔥 加载更多历史消息
   */
  const loadMoreMessages = useCallback(async () => {
    if (!chatId || !hasMoreMessages || isLoadingMessages) return

    setIsLoadingMessages(true)

    try {
      const LOAD_MORE_COUNT = 30
      const { messages: moreMessages, hasMore } = await loadMessagesPaginated(
        chatId,
        LOAD_MORE_COUNT,
        currentOffset
      )

      if (import.meta.env.DEV) {
        console.log(`📨 [加载更多] chatId=${chatId}, 新增=${moreMessages.length}, 偏移=${currentOffset}, 还有更多=${hasMore}`)
      }

      // 🔥 将新消息添加到前面（因为是历史消息）
      setMessagesState(prev => [...moreMessages, ...prev])
      setHasMoreMessages(hasMore)
      setCurrentOffset(prev => prev + moreMessages.length)
    } catch (error) {
      console.error('加载更多消息失败:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [chatId, hasMoreMessages, isLoadingMessages, currentOffset])

  /**
   * 加载消息（提取为函数，便于复用 - 兼容旧代码）
   */
  const loadChatMessages = useCallback(async () => {
    if (!chatId) return

    // 🔥 确保预加载完成后再加载消息，避免返回空数组
    const savedMessages = await ensureMessagesLoaded(chatId)
    
    // 🔥 优化：移除console.table，避免性能问题
    if (import.meta.env.DEV) {
      console.log(`📨 [useChatState] 加载消息: chatId=${chatId}, 总数=${savedMessages.length}`)
    }
    // 直接设置状态，不触发保存（因为是从IndexedDB加载的）
    setMessagesState(savedMessages)

    // 清除未读数
    clearUnread(chatId)
  }, [chatId])

  /**
   * 初始化：加载角色和历史消息
   * 🔥 优化：使用分页加载，避免卡顿
   */
  useEffect(() => {
    if (!chatId) return

    // 🔥 修复：角色加载重试机制，解决刷新后"角色不存在"问题
    const loadCharacterWithRetry = (retryCount = 0) => {
      const char = characterService.getById(chatId)

      if (char) {
        setCharacter(char)
        if (import.meta.env.DEV) {
          console.log('✅ 角色加载成功:', char.nickname || char.realName)
        }
      } else if (retryCount < 3) {
        // 角色可能还在异步加载中，等待100ms后重试
        if (import.meta.env.DEV) {
          console.log(`⏳ 角色未找到，${100}ms后重试 (${retryCount + 1}/3)`)
        }
        setTimeout(() => loadCharacterWithRetry(retryCount + 1), 100)
      } else {
        console.error(`❌ 角色加载失败，ID: ${chatId}`)
        setError(`角色不存在: ${chatId}`)
      }
    }

    loadCharacterWithRetry()

    // 🔥 使用分页加载，初次只加载最近50条消息
    loadChatMessagesInitial()
  }, [chatId, loadChatMessagesInitial])
  
  /**
   * 监听页面可见性和焦点，当返回聊天窗口时重新加载消息
   * 解决：在其他页面时AI回复了消息，返回时需要自动显示
   */
  useEffect(() => {
    if (!chatId) return
    
    // 页面可见性变化时重新加载
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (import.meta.env.DEV) {
          console.log('📱 [useChatState] 页面重新可见，重新加载消息')
        }
        loadChatMessages()
        refreshCharacter()  // 同时刷新角色信息
      }
    }
    
    // 窗口获得焦点时重新加载
    const handleFocus = () => {
      if (import.meta.env.DEV) {
        console.log('📱 [useChatState] 窗口获得焦点，重新加载消息')
      }
      loadChatMessages()
      refreshCharacter()  // 同时刷新角色信息
    }
    
    // 🔥 监听异步加载完成事件
    const handleMessagesLoaded = (e: CustomEvent) => {
      if (e.detail.chatId === chatId) {
        // 🔥 AI回复期间不响应加载事件，避免消息一次性显示
        if ((window as any).__AI_REPLYING__) {
          if (import.meta.env.DEV) {
            console.log('🚫 [useChatState] AI回复中，忽略messages-loaded事件')
          }
          return
        }
        if (import.meta.env.DEV) {
          console.log('📥 [useChatState] 异步加载完成，刷新UI')
        }
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
    refreshCharacter,
    // 🔥 分页加载相关
    isLoadingMessages,
    hasMoreMessages,
    totalMessageCount,
    loadMoreMessages
  }
}
