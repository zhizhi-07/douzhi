/**
 * 虚拟消息列表组件
 * 🔥 性能优化：只渲染可见的消息，大幅减少DOM节点数量
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Message, Character } from '../../../types/chat'
import MessageItem from './MessageItem'

interface VirtualMessageListProps {
  messages: Message[]
  character: Character
  chatId?: string
  isAiTyping: boolean
  onMessageLongPress: (message: Message, e: React.TouchEvent | React.MouseEvent) => void
  onMessageLongPressEnd: () => void
  onViewRecalledMessage: (message: Message) => void
  onViewCallRecord: (message: Message) => void
  onReceiveTransfer: (messageId: number) => void
  onRejectTransfer: (messageId: number) => void
  onPlayVoice: (messageId: number) => void
  onToggleVoiceText: (messageId: number) => void
  playingVoiceId: number | null
  showVoiceTextMap: Record<number, boolean>
  onUpdateIntimatePayStatus: (messageId: number, newStatus: 'accepted' | 'rejected') => void
  onAcceptCoupleSpace: (messageId: number) => void
  onRejectCoupleSpace: (messageId: number) => void
  onAcceptMusicInvite?: (messageId: number) => void
  onRejectMusicInvite?: (messageId: number) => void
  onEditOfflineRecord?: (message: Message) => void  // 新增：编辑线下记录
  // 🔥 分页加载相关
  hasMoreMessages?: boolean
  isLoadingMessages?: boolean
  onLoadMore?: () => void
  // 时间戳刷新key
  timestampRefreshKey?: number
}

const VirtualMessageList = ({
  messages,
  character,
  chatId,
  isAiTyping,
  onMessageLongPress,
  onMessageLongPressEnd,
  onViewRecalledMessage,
  onViewCallRecord,
  onReceiveTransfer,
  onRejectTransfer,
  onPlayVoice,
  onToggleVoiceText,
  playingVoiceId,
  showVoiceTextMap,
  onUpdateIntimatePayStatus,
  onAcceptCoupleSpace,
  onRejectCoupleSpace,
  onAcceptMusicInvite,
  onRejectMusicInvite,
  onEditOfflineRecord,
  hasMoreMessages = false,
  isLoadingMessages = false,
  onLoadMore,
  timestampRefreshKey = 0,
}: VirtualMessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState(() => {
    // 简化初始显示：总是显示最后20条消息（或全部如果少于20条）
    const displayCount = Math.min(20, messages.length)
    const start = Math.max(0, messages.length - displayCount)
    return { start, end: messages.length }
  })
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const loadMoreTriggeredRef = useRef(false)
  const isInitializedRef = useRef(false) // 🔥 标记是否已初始化
  const previousMessageCountRef = useRef(messages.length) // 🔥 记录上次的消息数量
  const previousScrollHeightRef = useRef(0) // 🔥 记录加载前的scrollHeight
  
  // 估算消息高度（平均值）
  const ESTIMATED_MESSAGE_HEIGHT = 80
  const BUFFER_SIZE = 5 // 上下各预加载5条消息
  
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const { scrollTop, clientHeight, scrollHeight } = containerRef.current

    // 🔥 检测是否滚动到顶部（加载更多历史消息）
    // 提高阈值到200px，更容易触发
    if (scrollTop < 200 && hasMoreMessages && !isLoadingMessages && !loadMoreTriggeredRef.current) {
      loadMoreTriggeredRef.current = true
      // 🔥 在触发加载前记录当前状态
      previousScrollHeightRef.current = scrollHeight
      console.log('📜 [VirtualMessageList] 🔥触发加载更多历史消息🔥', {
        scrollTop,
        scrollHeight,
        hasMoreMessages,
        isLoadingMessages
      })
      onLoadMore?.()
      // 1000ms后重置标志，避免重复触发
      setTimeout(() => {
        loadMoreTriggeredRef.current = false
      }, 1000)
    }

    // 检测是否接近底部（距离底部小于100px）
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100
    setShouldAutoScroll(isNearBottom)

    // 计算可见范围
    const start = Math.max(0, Math.floor(scrollTop / ESTIMATED_MESSAGE_HEIGHT) - BUFFER_SIZE)
    const end = Math.min(
      messages.length,
      Math.ceil((scrollTop + clientHeight) / ESTIMATED_MESSAGE_HEIGHT) + BUFFER_SIZE
    )

    setVisibleRange({ start, end })

    // 只在开发模式下打印详细日志
    if (import.meta.env.DEV && Math.random() < 0.1) { // 10%概率打印，减少刷屏
      console.log('📏 [VirtualMessageList] 可见范围:', { start, end, total: messages.length, scrollTop, hasMoreMessages })
    }
  }, [messages.length, hasMoreMessages, isLoadingMessages, onLoadMore])
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  // 🔥 优化：统一的滚动控制，避免跳动
  useEffect(() => {
    if (!containerRef.current || messages.length === 0) return

    const container = containerRef.current
    const previousCount = previousMessageCountRef.current
    const currentCount = messages.length

    // 初次加载：直接滚动到底部，不要延迟
    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      previousMessageCountRef.current = currentCount
      // 使用requestAnimationFrame确保DOM已渲染
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight
          previousScrollHeightRef.current = container.scrollHeight // 记录初始高度
          console.log('🔽 [VirtualMessageList] 初次加载，滚动到底部', {
            scrollHeight: container.scrollHeight,
            messageCount: currentCount
          })
        }
      })
      return
    }

    // 🔥 检测是否是加载更多（消息增加且不在底部）
    const isLoadingMore = currentCount > previousCount && container.scrollTop < 500

    if (isLoadingMore) {
      // 加载更多历史消息：保持滚动位置
      const previousScrollHeight = previousScrollHeightRef.current
      const previousScrollTop = container.scrollTop
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (container && previousScrollHeight > 0) {
            const newScrollHeight = container.scrollHeight
            const heightDiff = newScrollHeight - previousScrollHeight
            // 保持原来的滚动位置 + 新增内容的高度
            container.scrollTop = previousScrollTop + heightDiff
            console.log('📜 [VirtualMessageList] 加载更多，保持位置', {
              previousScrollTop,
              heightDiff,
              newScrollTop: container.scrollTop
            })
          }
        })
      })
    } else if (shouldAutoScroll) {
      // 新消息且用户在底部：滚动到底部
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight
          if (import.meta.env.DEV) {
            console.log('🔽 [VirtualMessageList] 新消息，自动滚动到底部')
          }
        }
      })
    }

    // 更新记录
    previousMessageCountRef.current = currentCount
    previousScrollHeightRef.current = container.scrollHeight
  }, [messages.length, shouldAutoScroll])
  
  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end)
  const offsetTop = visibleRange.start * ESTIMATED_MESSAGE_HEIGHT
  
  // 检查最后一条消息是否是帖子
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.messageType === 'post') {
    console.log('📋 [VirtualMessageList] 最后一条是帖子消息:', {
      messageId: lastMessage.id,
      inVisibleRange: visibleMessages.some(m => m.id === lastMessage.id),
      visibleRange,
      totalMessages: messages.length
    })
  }
  
  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* 🔥 加载更多指示器 */}
      {hasMoreMessages && (
        <div className="flex justify-center py-3">
          {isLoadingMessages ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span>加载中...</span>
            </div>
          ) : (
            <button
              onClick={() => {
                if (containerRef.current) {
                  // 🔥 点击前记录当前滚动状态
                  previousScrollHeightRef.current = containerRef.current.scrollHeight
                  console.log('📜 [VirtualMessageList] 点击加载更多，记录状态', {
                    scrollHeight: containerRef.current.scrollHeight,
                    scrollTop: containerRef.current.scrollTop
                  })
                }
                onLoadMore?.()
              }}
              className="text-sm text-blue-500 hover:text-blue-600 px-4 py-1 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              点击加载更多历史消息
            </button>
          )}
        </div>
      )}

      {/* 上方占位符 */}
      <div style={{ height: offsetTop }} />

      {/* 可见消息 */}
      {visibleMessages.map((message) => (
        <MessageItem
          key={`${message.id}-${timestampRefreshKey}`}
          message={message}
          character={character}
          chatId={chatId}
          onLongPressStart={onMessageLongPress}
          onLongPressEnd={onMessageLongPressEnd}
          onViewRecalledMessage={onViewRecalledMessage}
          onViewCallRecord={onViewCallRecord}
          onReceiveTransfer={onReceiveTransfer}
          onRejectTransfer={onRejectTransfer}
          onPlayVoice={onPlayVoice}
          onToggleVoiceText={onToggleVoiceText}
          playingVoiceId={playingVoiceId}
          showVoiceTextMap={showVoiceTextMap}
          onUpdateIntimatePayStatus={onUpdateIntimatePayStatus}
          onAcceptCoupleSpace={onAcceptCoupleSpace}
          onRejectCoupleSpace={onRejectCoupleSpace}
          onAcceptMusicInvite={onAcceptMusicInvite}
          onRejectMusicInvite={onRejectMusicInvite}
          onEditOfflineRecord={onEditOfflineRecord}
        />
      ))}
      
      {/* 下方占位符 */}
      <div style={{ height: Math.max(0, (messages.length - visibleRange.end) * ESTIMATED_MESSAGE_HEIGHT) }} />
    </div>
  )
}

export default VirtualMessageList
