/**
 * 聊天状态管理Hook
 * 负责：角色信息、消息列表、输入框、错误状态等
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Character, Message } from '../../../types/chat'
import { characterService } from '../../../services/characterService'
import { ensureMessagesLoaded, loadMessagesPaginated, loadMessages } from '../../../utils/simpleMessageManager'
import { clearUnread } from '../../../utils/simpleNotificationManager'
import { getCurrentAccountId } from '../../../utils/accountManager'
import { mergeMessages } from '../../../utils/mergeMessages'

export const useChatState = (chatId: string) => {
  // 角色信息
  const [character, setCharacter] = useState<Character | null>(null)

  // 消息列表（React状态）
  const [messages, setMessagesState] = useState<Message[]>([])

  // 🔥 当前账号ID（用于监听账号切换）
  const [accountId, setAccountId] = useState(() => getCurrentAccountId())

  const activeContext = useRef('')
  activeContext.current = `${chatId}:${accountId}`
  const loadRequest = useRef(0)

  // 🔥 分页加载状态
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [totalMessageCount, setTotalMessageCount] = useState(0)
  const [currentOffset, setCurrentOffset] = useState(0)

  // 包装setMessages：仅更新React状态
  const setMessages = useCallback((fn: ((prev: Message[]) => Message[]) | Message[]) => {
    // 关闭调试日志，避免控制台刷屏
    // if (import.meta.env.DEV) {
    //   console.log(`📂 [useChatState] setMessages 被调用`)
    // }
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
  const refreshCharacter = useCallback(async () => {
    if (!chatId) return
    
    // 等待加载完成
    await characterService.waitForLoad()
    
    let char = characterService.getById(chatId)
    
    // 🔥🔥🔥 关键修复：如果角色不存在，尝试强制重新加载
    if (!char) {
      console.warn(`⚠️ 刷新角色时不存在，尝试强制重新加载，ID: ${chatId}`)
      await characterService.forceReload()
      char = characterService.getById(chatId)
    }
    
    if (char) {
      setCharacter(char)
      if (import.meta.env.DEV) {
        console.log('🔄 角色信息已刷新:', char.nickname || char.realName)
      }
    } else {
      console.warn(`⚠️ 刷新角色失败（重新加载后仍不存在），ID: ${chatId}`)
    }
  }, [chatId])
  
  /**
   * 🔥 分页加载消息（初次加载所有消息，不再分页）
   * 注意：这个函数不使用 useCallback，避免依赖问题
   */
  const loadChatMessagesInitial = async () => {
    if (!chatId) return
    const context = activeContext.current
    const request = ++loadRequest.current
    const isCurrent = () => activeContext.current === context && loadRequest.current === request
    setIsLoadingMessages(true)
    setMessagesState([])
    setHasMoreMessages(false)
    setCurrentOffset(0)
    setTotalMessageCount(0)
    try {
      const result = await loadMessagesPaginated(chatId, 30)
      if (!isCurrent()) return
      setMessagesState(previous => mergeMessages(result.messages, previous))
      setTotalMessageCount(result.total)
      setHasMoreMessages(result.hasMore)
      setCurrentOffset(result.messages.length)
      clearUnread(chatId)
    } catch (error) {
      if (isCurrent()) setError('聊天记录加载失败，原数据未删除，请重试')
      console.error('加载消息失败:', error)
    } finally {
      if (isCurrent()) setIsLoadingMessages(false)
    }
  }

  /**
   * 🔥 加载更多历史消息
   */
  const loadMoreMessages = useCallback(async () => {
    if (!chatId || !hasMoreMessages || isLoadingMessages) {
      console.log('🚫 [加载更多] 跳过:', { chatId, hasMoreMessages, isLoadingMessages })
      return
    }

    const context = activeContext.current
    console.log('📥 [加载更多] 开始加载...', { chatId, currentOffset, hasMoreMessages })
    setIsLoadingMessages(true)

    try {
      const LOAD_MORE_COUNT = 30
      const { messages: moreMessages, hasMore } = await loadMessagesPaginated(
        chatId,
        LOAD_MORE_COUNT,
        currentOffset
      )

      if (activeContext.current !== context) return
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
          // 合并消息：历史消息在前，当前消息在后
          const merged = [...moreMessages, ...prev]
          
          // 简化去重逻辑
          const seenIds = new Set<number>()
          const deduplicated: Message[] = []
          
          for (const msg of merged) {
            if (!seenIds.has(msg.id)) {
              seenIds.add(msg.id)
              deduplicated.push(msg)
            }
          }
          
          // ⚠️ 注意：这里只更新显示状态，不要调用saveMessages！
          // 缓存中的完整消息不应被分页后的消息覆盖
          
          console.log(`✅ [加载更多] 消息状态更新: ${prev.length} -> ${deduplicated.length}${merged.length !== deduplicated.length ? ` (去重: ${merged.length - deduplicated.length})` : ''}`)
          return deduplicated
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
      // 🔥 关键修复：捕获异常时保持现有消息列表不变
      // 不调用 setMessagesState，消息列表保持原样
      if (activeContext.current !== context) return
      setError('加载历史消息失败，请重试')
      // 3秒后自动清除错误提示
      setTimeout(() => setError(null), 3000)
    } finally {
      if (activeContext.current === context) setIsLoadingMessages(false)
    }
  }, [chatId, hasMoreMessages, isLoadingMessages, currentOffset])

  /**
   * 加载消息（提取为函数，便于复用 - 兼容旧代码）
   */
  const loadChatMessages = useCallback(async () => {
    if (!chatId) return

    // 🔥 防止AI回复时重新加载消息导致数据丢失
    if ((window as any).__AI_REPLYING__) {
      // console.log('🚫 [useChatState] AI正在回复，跳过消息加载')
      return
    }

    // 🔥 防止消息已存在时重复加载
    if (messages.length > 0) {
      // console.log(`ℹ️ [useChatState] 消息已存在(${messages.length}条)，跳过加载`)
      return
    }

    try {
      // 等待消息加载完成
      const loadedMessages = await ensureMessagesLoaded(chatId)

      // 🔥 再次检查是否正在AI回复（异步加载期间可能状态改变）
      if ((window as any).__AI_REPLYING__) {
        // console.log('🚫 [useChatState] 加载完成但AI正在回复，跳过设置')
        return
      }

      setMessages(loadedMessages)

      // 🔥 移除事件触发，避免循环
      // window.dispatchEvent(new CustomEvent('messages-loaded', {
      //   detail: { chatId, messageCount: loadedMessages.length }
      // }))
    } catch (error) {
      console.error('加载消息失败:', error)
      // 降级到同步加载
      const messages = loadMessages(chatId)
      setMessages(messages)
    }
  }, [chatId])

  // 删除重复的useEffect，这个逻辑已经在下面的useEffect中处理了

  /**
   * 🔥 监听账号切换事件
   */
  useEffect(() => {
    const handleAccountSwitch = (e: CustomEvent) => {
      const newAccountId = e.detail.accountId
      console.log('🔄 [useChatState] 账号切换事件:', newAccountId)
      setAccountId(newAccountId)
      // 切换账号后清空当前消息，等待重新加载
      setMessagesState([])
    }
    
    window.addEventListener('accountSwitched', handleAccountSwitch as EventListener)
    return () => {
      window.removeEventListener('accountSwitched', handleAccountSwitch as EventListener)
    }
  }, [])

  /**
   * 🔥 监听后台新消息事件
   * 解决：后台AI主动发消息后，点进聊天看不到消息的问题
   */
  useEffect(() => {
    if (!chatId) return

    const handleNewMessage = (e: CustomEvent) => {
      const { chatId: msgChatId, message } = e.detail
      // 只处理当前聊天的消息
      if (msgChatId !== chatId) return

      console.log('📬 [useChatState] 收到后台新消息:', message?.content?.substring(0, 30))
      
      // 🔥 将新消息添加到状态中（去重）
      setMessagesState(prev => {
        // 检查消息是否已存在
        if (prev.some(m => m.id === message.id)) {
          console.log('ℹ️ [useChatState] 消息已存在，跳过')
          return prev
        }
        console.log('✅ [useChatState] 添加新消息到状态')
        return [...prev, message]
      })
    }

    // 监听 new-message 事件（由 addMessage 触发）
    window.addEventListener('new-message', handleNewMessage as EventListener)
    
    return () => {
      window.removeEventListener('new-message', handleNewMessage as EventListener)
    }
  }, [chatId])

  /**
   * 初始化：加载角色和历史消息
   * 🔥 优化：使用分页加载，避免卡顿
   * 🔥 添加accountId依赖：账号切换时重新加载
   */
  useEffect(() => {
    if (!chatId) return

    // 🔥 防止重复加载
    let mounted = true
    setCharacter(null)
    setInputValue('')
    setError(null)

    // console.log(`📂 [useChatState] 加载消息: chatId=${chatId}, accountId=${accountId}`)

    // 🔥 等待IndexedDB加载完成后再获取角色
    const loadCharacter = async () => {
      // 先等待characterService加载完成
      await characterService.waitForLoad()
      
      if (!mounted) return // 组件已卸载，停止执行
      
      let char = characterService.getById(chatId)
      
      // 🔥🔥🔥 关键修复：如果角色不存在，尝试强制重新加载
      if (!char) {
        console.warn(`⚠️ 角色不存在，尝试强制重新加载，ID: ${chatId}`)
        await characterService.forceReload()
        char = characterService.getById(chatId)
      }
      
      if (!mounted) return
      if (char) {
        setCharacter(char)
        // if (import.meta.env.DEV) {
        //   console.log('✅ 角色加载成功:', char.nickname || char.realName)
        // }
      } else {
        console.error(`❌ 角色不存在（重新加载后仍不存在），ID: ${chatId}`)
        setError(`角色不存在: ${chatId}`)
      }
    }

    loadCharacter()

    // 🔥 使用分页加载，初次只加载最近50条消息
    if (mounted) {
      loadChatMessagesInitial()
    }

    return () => {
      mounted = false // 清理标记
      loadRequest.current++
    }
  }, [chatId, accountId]) // 移除 loadChatMessagesInitial 依赖，避免循环
  
  /**
   * 监听页面可见性和焦点，当返回聊天窗口时重新加载消息
   * 解决：在其他页面时AI回复了消息，返回时需要自动显示
   * 🔥 手机端优化：避免频繁重新加载导致消息丢失
   */
  useEffect(() => {
    if (!chatId) return
    
    let lastHiddenTime = 0
    let mounted = true // 防止组件卸载后继续执行
    
    // 页面可见性变化时重新加载
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 记录页面隐藏时间
        lastHiddenTime = Date.now()
        if (import.meta.env.DEV) {
          console.log('📱 [useChatState] 页面隐藏，记录时间')
        }
      } else if (document.visibilityState === 'visible') {
        // 🔥 关键修复：如果正在分页加载，不触发全量重新加载
        if (isLoadingMessages) {
          if (import.meta.env.DEV) {
            console.log('🚫 [useChatState] 分页加载中，跳过全量重新加载')
          }
          return
        }
        
        // 🔥 手机端优化：只有在页面隐藏超过3秒后才重新加载
        // 避免快速切换应用时覆盖React状态中的最新消息
        const hiddenDuration = Date.now() - lastHiddenTime
        if (hiddenDuration > 3000 && mounted) {
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
    
    // 🔥 移除messages-loaded事件监听，避免无限循环
    // 这个事件会导致loadChatMessages被重复调用
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // 🔥 手机端优化：移除focus事件监听
    // window.addEventListener('focus', handleFocus)
    // 🔥 移除messages-loaded监听，避免无限循环
    // window.addEventListener('messages-loaded', handleMessagesLoaded as EventListener)
    
    return () => {
      mounted = false // 清理标记
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // window.removeEventListener('focus', handleFocus)
      // window.removeEventListener('messages-loaded', handleMessagesLoaded as EventListener)
    }
  }, [chatId, loadChatMessages, refreshCharacter, isLoadingMessages])
  
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
