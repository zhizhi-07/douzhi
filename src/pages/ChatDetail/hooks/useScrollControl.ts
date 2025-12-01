/**
 * 滚动控制Hook
 */

import { useRef, useCallback, useEffect } from 'react'

export const useScrollControl = (
  messages: any[],
  isAiTyping: boolean,
  hasMoreMessages: boolean,
  isLoadingMessages: boolean,
  loadMoreMessages: () => void
) => {
  const isInitialLoadRef = useRef(true)
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

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  // 初始加载时立即跳到底部
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      // 🔥 延迟更长时间确保滚动到底部后再允许加载更多
      setTimeout(() => {
        scrollToBottom(false, true)
        if (scrollContainerRef.current) {
          scrollContainerRef.current.classList.add('enable-smooth')
        }
        // 🔥 滚动到底部后才允许检测滚动加载更多
        setTimeout(() => {
          isInitialLoadRef.current = false
          console.log('📜 [初始化] 已滚动到底部，启用加载更多检测')
        }, 200)
      }, 100)
    }
  }, [messages, scrollToBottom])

  // 后续消息更新时使用平滑滚动
  useEffect(() => {
    if (!isInitialLoadRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const lastMessageId = lastMessage?.id

      if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMessageId
        const forceToBottom = lastMessage.type === 'sent'
        setTimeout(() => scrollToBottom(true, forceToBottom), 50)
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
    
    if (previousMessageCountRef.current > 0 && messages.length > previousMessageCountRef.current) {
      const isLoadMore = previousScrollTopRef.current < 200
      
      if (isLoadMore && previousScrollHeightRef.current > 0) {
        const newScrollHeight = container.scrollHeight
        const addedHeight = newScrollHeight - previousScrollHeightRef.current
        
        if (addedHeight > 0) {
          container.scrollTop = previousScrollTopRef.current + addedHeight
          console.log(`📜 [保持位置] 新增高度: ${addedHeight}px, 调整滚动位置`)
        }
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
