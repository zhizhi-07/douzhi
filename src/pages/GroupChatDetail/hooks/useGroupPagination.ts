/**
 * 群聊分页Hook - 支持向上加载历史消息
 */

import { useRef, useCallback, useState, useEffect } from 'react'
import type { GroupMessage } from '../../../utils/groupChatManager'

const MESSAGES_PER_PAGE = 30  // 每次加载30条消息
const INITIAL_MESSAGES = 30   // 初始显示30条消息（减少初始渲染压力）

export const useGroupPagination = (
  allMessages: GroupMessage[],
  _isAiTyping: boolean
) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hasScrolledRef = useRef(false)
  const [loadedCount, setLoadedCount] = useState(INITIAL_MESSAGES)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const previousScrollHeight = useRef(0)

  // 重置加载数量当消息列表变化时
  useEffect(() => {
    if (allMessages.length <= INITIAL_MESSAGES) {
      setLoadedCount(allMessages.length)
    }
  }, [allMessages.length])

  // 处理滚动事件，检测是否需要加载更多
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container || isLoadingMore) return

    // 如果滚动到顶部附近（距离顶部小于100px），加载更多
    if (container.scrollTop < 100 && loadedCount < allMessages.length) {
      setIsLoadingMore(true)
      previousScrollHeight.current = container.scrollHeight

      // 延迟加载，避免卡顿
      setTimeout(() => {
        setLoadedCount(prev => Math.min(prev + MESSAGES_PER_PAGE, allMessages.length))
        setIsLoadingMore(false)
      }, 100)
    }
  }, [isLoadingMore, loadedCount, allMessages.length])

  // 🔥 使用 callback ref，在 DOM 挂载后立即滚动到底部
  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // 移除旧的事件监听器
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleScroll)
      }

      // 添加新的事件监听器
      node.addEventListener('scroll', handleScroll, { passive: true })

      // 首次加载时立即滚动到底部（不使用动画，避免闪烁）
      if (!hasScrolledRef.current && allMessages.length > 0) {
        // 🔥 关键修复：等待 DOM 渲染完成后再滚动
        setTimeout(() => {
          const targetScrollTop = Math.max(0, node.scrollHeight - node.clientHeight)
          node.scrollTop = targetScrollTop
          hasScrolledRef.current = true
        }, 100)
      }

      // 加载更多后保持滚动位置
      if (previousScrollHeight.current > 0) {
        const newScrollHeight = node.scrollHeight
        const scrollDiff = newScrollHeight - previousScrollHeight.current
        node.scrollTop = scrollDiff
        previousScrollHeight.current = 0
      }
    }
    containerRef.current = node
  }, [allMessages.length, handleScroll])

  // 计算要显示的消息
  const startIndex = Math.max(0, allMessages.length - loadedCount)
  const displayedMessages = allMessages.slice(startIndex)
  const hasMoreMessages = startIndex > 0

  // 滚动到底部
  const scrollToBottom = useCallback((smooth = true, _force = false) => {
    const container = containerRef.current
    if (!container) return
    
    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    } else {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  const resetPagination = useCallback(() => {
    hasScrolledRef.current = false
    setLoadedCount(INITIAL_MESSAGES)
    previousScrollHeight.current = 0
  }, [])

  return {
    displayedMessages,
    hasMoreMessages,
    isLoadingMore,
    scrollContainerRef,
    isNearBottom: () => {
      const container = containerRef.current
      if (!container) return true
      return container.scrollHeight - container.scrollTop - container.clientHeight < 100
    },
    scrollToBottom,
    loadMoreMessages: () => {},
    resetPagination,
    offsetTop: 0,
    offsetBottom: 0
  }
}
