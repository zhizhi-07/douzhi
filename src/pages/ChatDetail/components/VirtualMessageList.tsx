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
}

const VirtualMessageList = ({
  messages,
  character,
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
}: VirtualMessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState(() => {
    // 简化初始显示：总是显示最后20条消息（或全部如果少于20条）
    const displayCount = Math.min(20, messages.length)
    const start = Math.max(0, messages.length - displayCount)
    return { start, end: messages.length }
  })
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  
  // 估算消息高度（平均值）
  const ESTIMATED_MESSAGE_HEIGHT = 80
  const BUFFER_SIZE = 5 // 上下各预加载5条消息
  
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current
    
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
    console.log('📏 [VirtualMessageList] 可见范围:', { start, end, total: messages.length })
  }, [messages.length])
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  // 当消息数量变化时，智能处理滚动
  useEffect(() => {
    if (!containerRef.current) return
    
    // 如果应该自动滚动（用户在底部），则滚动到底部
    if (shouldAutoScroll) {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
          console.log('🔽 [VirtualMessageList] 自动滚动到底部')
        }
      }, 50)
    }
    
    // 重新计算可见范围
    handleScroll()
  }, [messages.length, shouldAutoScroll, handleScroll])
  
  // 初始化时设置正确的滚动位置
  useEffect(() => {
    if (!containerRef.current || messages.length === 0) return
    
    // 延迟设置滚动位置，确保DOM已经渲染
    const timer = setTimeout(() => {
      if (containerRef.current) {
        // 总是滚动到底部（最新消息）
        containerRef.current.scrollTop = containerRef.current.scrollHeight
        console.log('🔽 [VirtualMessageList] 立即滚动到底部')
      }
    }, 10)
    
    return () => clearTimeout(timer)
  }, [messages.length])
  
  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end)
  const offsetTop = visibleRange.start * ESTIMATED_MESSAGE_HEIGHT
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll" 
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* 上方占位符 */}
      <div style={{ height: offsetTop }} />
      
      {/* 可见消息 */}
      {visibleMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          character={character}
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
        />
      ))}
      
      {/* 下方占位符 */}
      <div style={{ height: Math.max(0, (messages.length - visibleRange.end) * ESTIMATED_MESSAGE_HEIGHT) }} />
    </div>
  )
}

export default VirtualMessageList
