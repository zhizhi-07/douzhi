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
   * 🔥 分页加载消息（初次加载所有消息，不再分页）
   */
  const loadChatMessagesInitial = useCallback(async () => {
    if (!chatId) return

    setIsLoadingMessages(true)

    try {
      // 🔥 关键修复：先确保消息已预加载，防止返回空数组
      await ensureMessagesLoaded(chatId)
      
      // 获取总数
      const total = await getMessageCount(chatId)
      setTotalMessageCount(total)

      // 🔥 修复：刷新后加载所有消息，而不是只加载最近30条
      // 这样用户刷新后不会丢失之前看到的消息
      const { messages: initialMessages, hasMore } = await loadMessagesPaginated(
        chatId,
        total, // 加载所有消息
        0
      )

      console.log(`📨 [分页加载] 初次加载所有消息: chatId=${chatId}, 加载=${initialMessages.length}, 总数=${total}, 还有更多=${hasMore}`)

      // 🔥 关键修复：只有当加载到消息时才设置状态，防止空数组覆盖
      if (initialMessages.length > 0 || total === 0) {
        setMessagesState(initialMessages)
        setHasMoreMessages(hasMore)
        setCurrentOffset(initialMessages.length)
      } else {
        console.warn(`⚠️ [分页加载] 加载到空数组但总数不为0，不更新状态`)
      }

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
    if (!chatId || !hasMoreMessages || isLoadingMessages) {
      console.log('🚫 [加载更多] 跳过:', { chatId, hasMoreMessages, isLoadingMessages })
      return
    }

    console.log('📥 [加载更多] 开始加载...', { chatId, currentOffset, hasMoreMessages })
    setIsLoadingMessages(true)

    try {
      const LOAD_MORE_COUNT = 30
      const { messages: moreMessages, hasMore } = await loadMessagesPaginated(
        chatId,
        LOAD_MORE_COUNT,
        currentOffset
      )

      console.log(`📨 [加载更多] 加载完成:`, {
        chatId,
        新增消息数: moreMessages.length,
        当前偏移: currentOffset,
        还有更多: hasMore,
        新消息预览: moreMessages.slice(0, 3).map(m => ({ id: m.id, content: m.content?.substring(0, 20) }))
      })

      // 🔥 只有在有新消息时才更新状态
      if (moreMessages.length > 0) {
        setMessagesState(prev => {
          const newMessages = [...moreMessages, ...prev]
          console.log(`✅ [加载更多] 消息状态更新: ${prev.length} -> ${newMessages.length}`)
          return newMessages
        })
        setCurrentOffset(prev => {
          const newOffset = prev + moreMessages.length
          // 🔥 保存加载进度到 localStorage，刷新后可以恢复
          localStorage.setItem(`chat_offset_${chatId}`, newOffset.toString())
          console.log(`💾 [加载更多] 保存偏移量: ${newOffset}`)
          return newOffset
        })
      } else {
        console.warn('⚠️ [加载更多] 没有加载到新消息')
      }
      
      setHasMoreMessages(hasMore)
    } catch (error) {
      console.error('❌ [加载更多] 失败:', error)
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
   * 🔥 手机端优化：避免频繁重新加载导致消息丢失
   */
  useEffect(() => {
    if (!chatId) return
    
    let lastHiddenTime = 0
    
    // 页面可见性变化时重新加载
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 记录页面隐藏时间
        lastHiddenTime = Date.now()
        if (import.meta.env.DEV) {
          console.log('📱 [useChatState] 页面隐藏，记录时间')
        }
      } else if (document.visibilityState === 'visible') {
        // 🔥 手机端优化：只有在页面隐藏超过3秒后才重新加载
        // 避免快速切换应用时覆盖React状态中的最新消息
        const hiddenDuration = Date.now() - lastHiddenTime
        if (hiddenDuration > 3000) {
          if (import.meta.env.DEV) {
            console.log(`📱 [useChatState] 页面重新可见（隐藏了${Math.floor(hiddenDuration/1000)}秒），重新加载消息`)
          }
          loadChatMessages()
          refreshCharacter()  // 同时刷新角色信息
        } else {
          if (import.meta.env.DEV) {
            console.log(`📱 [useChatState] 页面重新可见（仅隐藏${Math.floor(hiddenDuration/1000)}秒），跳过重新加载`)
          }
        }
      }
    }
    
    // 🔥 手机端优化：移除focus事件监听，避免过度重新加载
    // focus事件在手机端会频繁触发，导致消息丢失
    // const handleFocus = () => {
    //   if (import.meta.env.DEV) {
    //     console.log('📱 [useChatState] 窗口获得焦点，重新加载消息')
    //   }
    //   loadChatMessages()
    //   refreshCharacter()  // 同时刷新角色信息
    // }
    
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
    // 🔥 手机端优化：移除focus事件监听
    // window.addEventListener('focus', handleFocus)
    window.addEventListener('messages-loaded', handleMessagesLoaded as EventListener)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // window.removeEventListener('focus', handleFocus)
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
