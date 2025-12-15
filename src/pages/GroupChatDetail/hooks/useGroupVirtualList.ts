/**
 * 群聊虚拟列表Hook - 只渲染可视区域的消息，解决大量消息卡顿问题
 */

import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import type { GroupMessage } from '../../../utils/groupChatManager'

// 配置参数
const ITEM_HEIGHT_ESTIMATE = 100  // 预估消息高度
const BUFFER_SIZE = 5              // 上下缓冲区消息数量
const OVERSCAN = 3                 // 额外渲染的消息数量，减少白屏
const SCROLL_DEBOUNCE = 10         // 滚动防抖延迟

interface VirtualListResult {
  displayedMessages: GroupMessage[]
  virtualStyle: {
    paddingTop: number
    paddingBottom: number
  }
  scrollContainerRef: (node: HTMLDivElement | null) => void
  scrollToBottom: (smooth?: boolean) => void
  resetVirtualList: () => void
  isNearBottom: () => boolean
}

export const useGroupVirtualList = (
  allMessages: GroupMessage[]
): VirtualListResult => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const itemHeightsRef = useRef<Map<string, number>>(new Map())
  const scrollPositionRef = useRef(0)
  const isAutoScrollingRef = useRef(false)
  const hasInitialScrollRef = useRef(false)
  
  // 虚拟列表状态
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 })
  const [forceUpdate, setForceUpdate] = useState(0)
  
  // 计算累积高度
  const cumulativeHeights = useMemo(() => {
    const heights: number[] = []
    let total = 0
    
    for (let i = 0; i < allMessages.length; i++) {
      const msg = allMessages[i]
      const height = itemHeightsRef.current.get(msg.id) || ITEM_HEIGHT_ESTIMATE
      total += height
      heights.push(total)
    }
    
    return heights
  }, [allMessages, forceUpdate])
  
  // 获取总高度
  const totalHeight = useMemo(() => {
    return cumulativeHeights[cumulativeHeights.length - 1] || 0
  }, [cumulativeHeights])
  
  // 二分查找可视区域的消息索引
  const findVisibleRange = useCallback((scrollTop: number, containerHeight: number) => {
    const scrollBottom = scrollTop + containerHeight
    
    // 二分查找起始索引
    let start = 0
    let end = cumulativeHeights.length - 1
    
    while (start < end) {
      const mid = Math.floor((start + end) / 2)
      if (cumulativeHeights[mid] < scrollTop) {
        start = mid + 1
      } else {
        end = mid
      }
    }
    
    const startIndex = Math.max(0, start - BUFFER_SIZE)
    
    // 二分查找结束索引
    start = startIndex
    end = cumulativeHeights.length - 1
    
    while (start < end) {
      const mid = Math.floor((start + end) / 2)
      if (cumulativeHeights[mid] < scrollBottom) {
        start = mid + 1
      } else {
        end = mid
      }
    }
    
    const endIndex = Math.min(allMessages.length, end + BUFFER_SIZE + OVERSCAN)
    
    return { start: startIndex, end: endIndex }
  }, [cumulativeHeights, allMessages.length])
  
  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return
    
    const container = containerRef.current
    if (!container) return
    
    scrollPositionRef.current = container.scrollTop
    
    // 防抖处理
    clearTimeout(scrollDebounceTimer.current)
    scrollDebounceTimer.current = setTimeout(() => {
      const newRange = findVisibleRange(container.scrollTop, container.clientHeight)
      setVisibleRange(newRange)
    }, SCROLL_DEBOUNCE)
  }, [findVisibleRange])
  
  const scrollDebounceTimer = useRef<NodeJS.Timeout>()
  
  // 滚动到底部
  const scrollToBottom = useCallback((smooth = true) => {
    const container = containerRef.current
    if (!container) return
    
    isAutoScrollingRef.current = true
    const targetTop = totalHeight - container.clientHeight
    
    if (smooth) {
      container.scrollTo({ top: targetTop, behavior: 'smooth' })
      setTimeout(() => {
        isAutoScrollingRef.current = false
      }, 500)
    } else {
      container.scrollTop = targetTop
      isAutoScrollingRef.current = false
    }
    
    // 更新可视范围到底部
    const bottomRange = findVisibleRange(targetTop, container.clientHeight)
    setVisibleRange(bottomRange)
  }, [totalHeight, findVisibleRange])
  
  // 检查是否在底部附近
  const isNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true
    
    const threshold = 100
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }, [])
  
  // 使用 ResizeObserver 监听消息高度变化
  const observerRef = useRef<ResizeObserver | null>(null)
  
  const measureItem = useCallback((element: HTMLElement | null, messageId: string) => {
    if (!element) return
    
    const height = element.offsetHeight
    const oldHeight = itemHeightsRef.current.get(messageId)
    
    if (height > 0 && height !== oldHeight) {
      itemHeightsRef.current.set(messageId, height)
      // 高度变化时强制更新
      if (oldHeight !== undefined) {
        setForceUpdate(prev => prev + 1)
      }
    }
  }, [])
  
  // Callback ref for scroll container
  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // 清理旧的监听器
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleScroll)
      }
      
      // 设置新的监听器
      node.addEventListener('scroll', handleScroll, { passive: true })
      
      // 初始化可视范围
      const initialRange = findVisibleRange(0, node.clientHeight)
      setVisibleRange(initialRange)
      
      // 首次加载时滚动到底部
      if (!hasInitialScrollRef.current && allMessages.length > 0) {
        setTimeout(() => {
          scrollToBottom(false)
          hasInitialScrollRef.current = true
        }, 100)
      }
    }
    
    containerRef.current = node
  }, [handleScroll, findVisibleRange, scrollToBottom, allMessages.length])
  
  // 重置虚拟列表
  const resetVirtualList = useCallback(() => {
    itemHeightsRef.current.clear()
    scrollPositionRef.current = 0
    hasInitialScrollRef.current = false
    setVisibleRange({ start: 0, end: 0 })
    setForceUpdate(0)
  }, [])
  
  // 消息变化时的处理
  useEffect(() => {
    // 如果在底部附近，新消息时自动滚动到底部
    if (isNearBottom() && allMessages.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottom(true)
      })
    }
  }, [allMessages.length, isNearBottom, scrollToBottom])
  
  // 计算要显示的消息和虚拟样式
  const displayedMessages = useMemo(() => {
    return allMessages.slice(visibleRange.start, visibleRange.end)
  }, [allMessages, visibleRange])
  
  const virtualStyle = useMemo(() => {
    const paddingTop = visibleRange.start > 0 
      ? (cumulativeHeights[visibleRange.start - 1] || 0)
      : 0
      
    const paddingBottom = visibleRange.end < allMessages.length
      ? totalHeight - (cumulativeHeights[visibleRange.end - 1] || 0)
      : 0
    
    return { paddingTop, paddingBottom }
  }, [visibleRange, cumulativeHeights, totalHeight, allMessages.length])
  
  // 为每条消息添加测量回调
  useEffect(() => {
    // 创建一个全局的 ResizeObserver
    if (!observerRef.current) {
      observerRef.current = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const messageId = entry.target.getAttribute('data-message-id')
          if (messageId) {
            measureItem(entry.target as HTMLElement, messageId)
          }
        })
      })
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [measureItem])
  
  return {
    displayedMessages,
    virtualStyle,
    scrollContainerRef,
    scrollToBottom,
    resetVirtualList,
    isNearBottom
  }
}
