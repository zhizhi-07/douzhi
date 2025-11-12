/**
 * 消息虚拟化Hook
 * 🔥 关键优化：只渲染可见的消息，大幅提升手机性能
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Message } from '../../../types/chat'

interface VirtualizationState {
  visibleStart: number
  visibleEnd: number
  totalCount: number
}

const VISIBLE_WINDOW = 30 // 🔥 一次最多渲染30条消息
const BUFFER_SIZE = 5 // 上下各预加载5条

export function useMessageVirtualization(
  messages: Message[],
  containerRef: React.RefObject<HTMLDivElement>
) {
  const [state, setState] = useState<VirtualizationState>({
    visibleStart: Math.max(0, messages.length - VISIBLE_WINDOW),
    visibleEnd: messages.length,
    totalCount: messages.length
  })

  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 处理滚动
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const { scrollTop, clientHeight, scrollHeight } = containerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    // 如果在底部，显示最新消息
    if (isNearBottom) {
      setState({
        visibleStart: Math.max(0, messages.length - VISIBLE_WINDOW),
        visibleEnd: messages.length,
        totalCount: messages.length
      })
      return
    }

    // 计算可见范围
    const itemHeight = 80 // 平均消息高度
    const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - BUFFER_SIZE)
    const visibleEnd = Math.min(
      messages.length,
      Math.ceil((scrollTop + clientHeight) / itemHeight) + BUFFER_SIZE
    )

    setState({
      visibleStart,
      visibleEnd,
      totalCount: messages.length
    })
  }, [messages.length, containerRef])

  // 防抖滚动处理
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScrollThrottled = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        handleScroll()
      }, 50)
    }

    container.addEventListener('scroll', handleScrollThrottled, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScrollThrottled)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll, containerRef])

  // 当消息数量变化时，滚动到底部
  useEffect(() => {
    setState({
      visibleStart: Math.max(0, messages.length - VISIBLE_WINDOW),
      visibleEnd: messages.length,
      totalCount: messages.length
    })

    // 滚动到底部
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages.length])

  // 返回可见消息
  const visibleMessages = messages.slice(state.visibleStart, state.visibleEnd)
  const offsetTop = state.visibleStart * 80 // 上方占位符高度

  return {
    visibleMessages,
    offsetTop,
    offsetBottom: Math.max(0, (messages.length - state.visibleEnd) * 80),
    visibleStart: state.visibleStart,
    visibleEnd: state.visibleEnd,
    totalCount: state.totalCount
  }
}
