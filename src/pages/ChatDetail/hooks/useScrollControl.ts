/**
 * 滚动控制Hook
 */

import { useRef, useCallback, useEffect } from 'react'

export const useScrollControl = (
  messages: any[],
  isAiTyping: boolean,
  hasMoreMessages: boolean,
  isLoadingMessages: boolean,
  loadMoreMessages: () => void,
  chatId?: string
) => {
  const isInitialLoadRef = useRef(true)
  const currentChatIdRef = useRef(chatId)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isNearBottomRef = useRef(true)
  const previousMessageCountRef = useRef(messages.length)
  const previousScrollHeightRef = useRef(0)
  const previousScrollTopRef = useRef(0)
  const loadMoreTriggeredRef = useRef(false)
  const lastMessageIdRef = useRef<number | null>(null)

  const updateNearBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const threshold = 150
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    isNearBottomRef.current = nearBottom
  }, [])

  const isNearBottom = useCallback(() => {
    return isNearBottomRef.current
  }, [])

  const scrollToBottom = useCallback((smooth = true, force = false) => {
    const container = scrollContainerRef.current
    if (!container) return

    if (!force && !isNearBottomRef.current) {
      console.log('📜 [滚动] 用户正在查看历史消息，跳过自动滚动')
      return
    }

    // 🔥 计算正确的滚动位置
    const targetScrollTop = container.scrollHeight - container.clientHeight
    
    if (import.meta.env.DEV) {
      console.log('📜 [scrollToBottom] 滚动到底部', {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        targetScrollTop,
        currentScrollTop: container.scrollTop
      })
    }

    if (smooth) {
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })
    } else {
      container.scrollTop = targetScrollTop
    }
  }, [])

  // 🔥 聊天ID变化时重置初始加载标记
  useEffect(() => {
    if (chatId && chatId !== currentChatIdRef.current) {
      console.log('📜 [滚动] 聊天ID变化，重置初始加载标记', { old: currentChatIdRef.current, new: chatId })
      isInitialLoadRef.current = true
      currentChatIdRef.current = chatId
    }
  }, [chatId])

  // 初始加载时立即跳到底部
  useEffect(() => {
    if (!isInitialLoadRef.current || messages.length === 0) return
    
    const container = scrollContainerRef.current
    if (!container) return
    
    // 🔥 关键修复：使用 visibility 而不是 opacity，避免触发重排
    container.style.visibility = 'hidden'
    
    // 🔥 等待图片和头像加载完成
    const waitForImages = () => {
      return new Promise<void>((resolve) => {
        const images = container.querySelectorAll('img')
        if (images.length === 0) {
          resolve()
          return
        }
        
        let loadedCount = 0
        const totalImages = images.length
        
        const checkComplete = () => {
          loadedCount++
          if (loadedCount >= totalImages) {
            resolve()
          }
        }
        
        images.forEach(img => {
          if (img.complete) {
            checkComplete()
          } else {
            img.addEventListener('load', checkComplete, { once: true })
            img.addEventListener('error', checkComplete, { once: true })
          }
        })
        
        // 最多等待 300ms
        setTimeout(() => resolve(), 300)
      })
    }
    
    // 🔥 强制滚动到底部的函数
    const forceScrollToBottom = () => {
      if (!container) return
      const targetScrollTop = Math.max(0, container.scrollHeight - container.clientHeight)
      container.scrollTop = targetScrollTop
      
      if (import.meta.env.DEV) {
        console.log('📜 [初始化] 滚动到底部', {
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          targetScrollTop,
          finalScrollTop: container.scrollTop
        })
      }
    }
    
    // 🔥 等待 DOM 渲染和图片加载
    const scrollTimer = setTimeout(async () => {
      if (!container) return
      
      // 等待图片加载
      await waitForImages()
      
      // 🔥 关键修复：使用 requestAnimationFrame 确保 DOM 完全渲染
      requestAnimationFrame(() => {
        forceScrollToBottom()
        
        // 🔥 多次延迟滚动，确保各种异步内容渲染后滚动位置正确
        setTimeout(() => {
          forceScrollToBottom()
          
          setTimeout(() => {
            forceScrollToBottom()
            
            // 显示容器
            container.style.visibility = 'visible'
            container.classList.add('enable-smooth')
            
            // 标记初始化完成
            isInitialLoadRef.current = false
            console.log('📜 [初始化] 完成，启用加载更多检测')
          }, 150)
        }, 100)
      })
    }, 80)
    
    return () => clearTimeout(scrollTimer)
  }, [messages.length]) // 🔥 只依赖消息数量，避免频繁触发

  // 后续消息更新时使用平滑滚动
  useEffect(() => {
    if (!isInitialLoadRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const lastMessageId = lastMessage?.id

      // 🔥 关键修复：只有当最后一条消息ID变化时才滚动（新消息）
      // 如果只是消息数量增加但最后一条消息ID没变，说明是加载历史消息，不应该滚动
      if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
        const previousLastMessageId = lastMessageIdRef.current
        lastMessageIdRef.current = lastMessageId
        
        // 只有当之前有消息ID时才检查（避免初始加载时触发）
        if (previousLastMessageId !== null) {
          const forceToBottom = lastMessage.type === 'sent'
          setTimeout(() => scrollToBottom(true, forceToBottom), 50)
        }
      }
    }
  }, [messages, scrollToBottom])

  // AI打字时滚动
  useEffect(() => {
    if (isAiTyping) {
      setTimeout(() => scrollToBottom(true, false), 50)
    }
  }, [isAiTyping, scrollToBottom])

  // 滚动检测和自动加载更多
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      updateNearBottom()
      
      // 🔥 初始加载期间不触发加载更多，等滚动到底部后再启用
      if (isInitialLoadRef.current) return
      
      const { scrollTop, scrollHeight } = container
      if (scrollTop < 100 && hasMoreMessages && !isLoadingMessages && !loadMoreTriggeredRef.current) {
        loadMoreTriggeredRef.current = true
        previousScrollHeightRef.current = scrollHeight
        previousScrollTopRef.current = scrollTop
        
        console.log('📜 [自动加载] 滚动到顶部，触发加载更多')
        loadMoreMessages()
        
        setTimeout(() => {
          loadMoreTriggeredRef.current = false
        }, 500)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, isLoadingMessages, loadMoreMessages, updateNearBottom])

  // 加载更多后保持滚动位置不跳动
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    // 🔥 关键修复：只有在加载更多时才调整滚动位置
    // 检查是否是加载历史消息（消息数量增加 + 之前的滚动位置在顶部）
    if (previousMessageCountRef.current > 0 && messages.length > previousMessageCountRef.current) {
      const isLoadMore = previousScrollTopRef.current < 200
      
      if (isLoadMore && previousScrollHeightRef.current > 0) {
        // 使用 requestAnimationFrame 确保 DOM 已更新
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight
          const addedHeight = newScrollHeight - previousScrollHeightRef.current
          
          if (addedHeight > 0) {
            // 调整滚动位置以补偿新增的内容高度
            const newScrollTop = previousScrollTopRef.current + addedHeight
            container.scrollTop = newScrollTop
            console.log(`📜 [保持位置] 新增高度: ${addedHeight}px, 从 ${previousScrollTopRef.current}px 调整到 ${newScrollTop}px`)
          }
          
          // 重置记录
          previousScrollHeightRef.current = 0
          previousScrollTopRef.current = 0
        })
      }
    }
    
    previousMessageCountRef.current = messages.length
  }, [messages])

  return {
    scrollContainerRef,
    isNearBottom,
    scrollToBottom
  }
}
