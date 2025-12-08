/**
 * 群聊分页加载Hook
 * 解决消息过多导致页面卡顿的问题
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { GroupMessage } from '../../../utils/groupChatManager'

const PAGE_SIZE = 20 // 每页显示20条消息（减少以提升性能）

export const useGroupPagination = (
  allMessages: GroupMessage[],
  isAiTyping: boolean
) => {
  // 当前显示的消息数量（从最新的开始往前算）
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isInitialLoadRef = useRef(true)
  const isNearBottomRef = useRef(true)
  const previousScrollHeightRef = useRef(0)
  const previousScrollTopRef = useRef(0)
  const loadMoreTriggeredRef = useRef(false)
  const lastMessageIdRef = useRef<string | null>(null)
  const prevMessageCountRef = useRef(allMessages.length) // 🔥 放在这里确保hooks顺序一致

  // 计算当前显示的消息（从后往前取）
  const displayedMessages = allMessages.slice(-displayCount)
  const hasMoreMessages = displayCount < allMessages.length

  // 更新是否接近底部
  const updateNearBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const threshold = 150
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    isNearBottomRef.current = nearBottom
  }, [])

  // 是否接近底部
  const isNearBottom = useCallback(() => {
    return isNearBottomRef.current
  }, [])

  // 滚动到底部
  const scrollToBottom = useCallback((smooth = true, force = false) => {
    const container = scrollContainerRef.current
    if (!container) return

    if (!force && !isNearBottomRef.current) {
      console.log('📜 [群聊滚动] 用户正在查看历史消息，跳过自动滚动')
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

  // 加载更多消息
  const loadMoreMessages = useCallback(() => {
    if (isLoadingMore || !hasMoreMessages) return

    console.log('📜 [群聊分页] 加载更多消息...')
    setIsLoadingMore(true)

    // 使用 requestAnimationFrame 确保不阻塞UI
    requestAnimationFrame(() => {
      setDisplayCount(prev => {
        const newCount = Math.min(prev + PAGE_SIZE, allMessages.length)
        console.log(`📜 [群聊分页] 显示 ${newCount}/${allMessages.length} 条消息`)
        return newCount
      })
      setIsLoadingMore(false)
    })
  }, [isLoadingMore, hasMoreMessages, allMessages.length])

  // 当全部消息变化时（有新消息），重新计算显示数量
  useEffect(() => {
    const prevCount = prevMessageCountRef.current
    const currentCount = allMessages.length
    
    // 🔥 确保 displayCount 始终 >= 当前消息数量的某个合理值
    // 当消息数量增加时，自动扩展 displayCount
    if (currentCount > prevCount && prevCount > 0) {
      // 有新消息到达（非初始加载）
      const newMessagesCount = currentCount - prevCount
      console.log(`📜 [群聊分页] 检测到 ${newMessagesCount} 条新消息`)
      
      setDisplayCount(prev => {
        const newDisplayCount = prev + newMessagesCount
        console.log(`📜 [群聊分页] displayCount: ${prev} -> ${newDisplayCount}`)
        return newDisplayCount
      })
    } else if (prevCount === 0 && currentCount > 0) {
      // 初始加载完成
      console.log(`📜 [群聊分页] 初始加载 ${currentCount} 条消息`)
      // 保持默认的 PAGE_SIZE，用户可以向上滚动加载更多
    }
    
    prevMessageCountRef.current = currentCount
  }, [allMessages.length])

  // 初始加载时立即跳到底部
  useEffect(() => {
    if (isInitialLoadRef.current && displayedMessages.length > 0) {
      scrollToBottom(false, true)
      setTimeout(() => {
        isInitialLoadRef.current = false
        console.log('📜 [群聊初始化] 已滚动到底部，启用加载更多检测')
      }, 100)
    }
  }, [displayedMessages, scrollToBottom])

  // 新消息到达时滚动到底部
  useEffect(() => {
    if (!isInitialLoadRef.current && displayedMessages.length > 0) {
      const lastMessage = displayedMessages[displayedMessages.length - 1]
      const lastMessageId = lastMessage?.id

      if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMessageId
        // 用户自己发的消息强制滚动到底部
        const forceToBottom = lastMessage.userId === 'user'
        setTimeout(() => scrollToBottom(true, forceToBottom), 50)
      }
    }
  }, [displayedMessages, scrollToBottom])

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
      
      // 初始加载期间不触发加载更多
      if (isInitialLoadRef.current) return
      
      const { scrollTop, scrollHeight } = container
      
      // 滚动到顶部附近时触发加载更多
      if (scrollTop < 100 && hasMoreMessages && !isLoadingMore && !loadMoreTriggeredRef.current) {
        loadMoreTriggeredRef.current = true
        previousScrollHeightRef.current = scrollHeight
        previousScrollTopRef.current = scrollTop
        
        console.log('📜 [群聊自动加载] 滚动到顶部，触发加载更多')
        loadMoreMessages()
        
        setTimeout(() => {
          loadMoreTriggeredRef.current = false
        }, 300)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages, updateNearBottom])

  // 加载更多后保持滚动位置不跳动
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    // 检测是否是加载更多的情况（滚动位置在顶部附近）
    if (previousScrollTopRef.current < 200 && previousScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight
      const addedHeight = newScrollHeight - previousScrollHeightRef.current
      
      if (addedHeight > 0) {
        container.scrollTop = previousScrollTopRef.current + addedHeight
        console.log(`📜 [群聊保持位置] 新增高度: ${addedHeight}px, 调整滚动位置`)
      }
      
      // 重置
      previousScrollHeightRef.current = 0
      previousScrollTopRef.current = 0
    }
  }, [displayCount])

  // 重置分页（用于切换群聊时）
  const resetPagination = useCallback(() => {
    setDisplayCount(PAGE_SIZE)
    isInitialLoadRef.current = true
    lastMessageIdRef.current = null
  }, [])

  return {
    displayedMessages,
    hasMoreMessages,
    isLoadingMore,
    scrollContainerRef,
    isNearBottom,
    scrollToBottom,
    loadMoreMessages,
    resetPagination
  }
}
