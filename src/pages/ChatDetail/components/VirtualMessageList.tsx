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
}

const VirtualMessageList = ({
  messages,
  character,
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
}: VirtualMessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 15 })
  
  // 估算消息高度（平均值）
  const ESTIMATED_MESSAGE_HEIGHT = 80
  const BUFFER_SIZE = 3 // 上下各预加载3条消息
  
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    
    const { scrollTop, clientHeight } = containerRef.current
    
    // 计算可见范围
    const start = Math.max(0, Math.floor(scrollTop / ESTIMATED_MESSAGE_HEIGHT) - BUFFER_SIZE)
    const end = Math.min(
      messages.length,
      Math.ceil((scrollTop + clientHeight) / ESTIMATED_MESSAGE_HEIGHT) + BUFFER_SIZE
    )
    
    setVisibleRange({ start, end })
  }, [messages.length])
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  // 当消息数量变化时，重新计算可见范围并滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      // 强制滚动到底部
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }, 100)
      
      setVisibleRange({ 
        start: Math.max(0, messages.length - 15), 
        end: messages.length 
      })
    }
  }, [messages.length])
  
  // 初始化时滚动到底部
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
          console.log('🔽 [VirtualMessageList] 已滚动到底部')
        }
      }, 200)
    }
  }, [])
  
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
      
      {/* AI打字指示器 */}
      {isAiTyping && (
        <div className="flex items-start gap-2 my-2 message-enter message-enter-left">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-400 flex-shrink-0">
              {character.avatar && (
                <img 
                  src={character.avatar} 
                  alt={character.realName}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-2xl px-3 py-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      
      {/* 下方占位符 */}
      <div style={{ height: Math.max(0, (messages.length - visibleRange.end) * ESTIMATED_MESSAGE_HEIGHT) }} />
    </div>
  )
}

export default VirtualMessageList
