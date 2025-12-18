/**
 * 群聊虚拟列表Hook - 只渲染可视区域的消息，解决大量消息卡顿问题
 */

import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import type { GroupMessage } from '../../../utils/groupChatManager'

// 配置参数
const ITEM_HEIGHT_ESTIMATE = 100  // 预估消息高度
const BUFFER_SIZE = 20             // 🔥 增大缓冲区，减少白屏
const SCROLL_DEBOUNCE = 16         // 滚动防抖延迟
const MAX_RENDER_ALL = 300         // 🔥 提高阈值，避免虚拟滚动计算开销导致卡顿

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
    
    const endIndex = Math.min(allMessages.length, end + BUFFER_SIZE)
    
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
  
  // 消息变化时的处理 - 🔥 简化逻辑，避免循环触发
  const prevMessageCountRef = useRef(allMessages.length)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    // 消息数量增加时（新消息）
    if (allMessages.length > prevMessageCountRef.current) {
      if (isNearBottom()) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
          }
        })
      }
    }
    // 🔥 消息数量减少时（重回/删除）- 保持当前滚动位置，重新计算可视范围
    else if (allMessages.length < prevMessageCountRef.current && allMessages.length > 0) {
      // 确保 visibleRange 不超出消息数组范围
      const safeEnd = Math.min(visibleRange.end, allMessages.length)
      const safeStart = Math.min(visibleRange.start, Math.max(0, safeEnd - 10))
      if (safeStart !== visibleRange.start || safeEnd !== visibleRange.end) {
        setVisibleRange({ start: safeStart, end: safeEnd })
      }
    }
    
    prevMessageCountRef.current = allMessages.length
  }, [allMessages.length, isNearBottom, visibleRange])
  
  // 🔥 极简模式：消息少于阈值时直接返回，不做任何计算
  const displayedMessages = allMessages.length <= MAX_RENDER_ALL 
    ? allMessages 
    : allMessages.slice(visibleRange.start, visibleRange.end)
  
  const virtualStyle = useMemo(() => {
    // 🔥 消息数量较少时不使用虚拟滚动
    if (allMessages.length <= MAX_RENDER_ALL) {
      return { paddingTop: 0, paddingBottom: 0 }
    }
    
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
