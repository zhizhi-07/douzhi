/**
 * 群聊分页Hook - 超级简化版
 */

import { useRef, useCallback } from 'react'
import type { GroupMessage } from '../../../utils/groupChatManager'

export const useGroupPagination = (
  allMessages: GroupMessage[],
  _isAiTyping: boolean
) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hasScrolledRef = useRef(false)

  // 🔥 使用 callback ref，在 DOM 挂载后立即滚动到底部
  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !hasScrolledRef.current && allMessages.length > 0) {
      // 立即滚动到底部，不等待
      node.scrollTop = node.scrollHeight
      hasScrolledRef.current = true
    }
    containerRef.current = node
  }, [allMessages.length])

  // 🔥 限制显示的消息数量，避免渲染过多导致卡顿
  const MAX_DISPLAY = 50
  const displayedMessages = allMessages.length > MAX_DISPLAY 
    ? allMessages.slice(-MAX_DISPLAY) 
    : allMessages

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
    hasScrolledRef.current = false  // 🔥 重置，下次进入时重新滚动
  }, [])

  return {
    displayedMessages,
    hasMoreMessages: false,
    isLoadingMore: false,
    scrollContainerRef,
    isNearBottom: () => true,
    scrollToBottom,
    loadMoreMessages: () => {},
    resetPagination,
    offsetTop: 0,
    offsetBottom: 0
  }
}
