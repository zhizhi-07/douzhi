/**
 * 消息列表组件
 * 🔥 性能优化：超过50条消息时自动启用虚拟化
 */

import { forwardRef } from 'react'
import type { Message, Character } from '../../../types/chat'
import MessageItem from './MessageItem'
import VirtualMessageList from './VirtualMessageList'

interface MessageListProps {
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
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(({
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
  onRejectCoupleSpace
}, ref) => {
  // 🔥 性能优化：超过30条消息时启用虚拟化
  const shouldUseVirtualization = messages.length > 30
  
  console.log(`📊 [MessageList] 消息数量: ${messages.length}, 虚拟化: ${shouldUseVirtualization ? '✅启用' : '❌关闭'}`)
  
  if (shouldUseVirtualization) {
    // 使用虚拟化组件
    return (
      <VirtualMessageList
        messages={messages}
        character={character}
        isAiTyping={isAiTyping}
        onMessageLongPress={onMessageLongPress}
        onMessageLongPressEnd={onMessageLongPressEnd}
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
      />
    )
  }
  
  // 少量消息时使用普通渲染
  return (
    <div 
      ref={ref}
      className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll" 
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {messages.map((message) => (
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
          
          <div className="flex flex-col items-start">
            <div className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm typing-indicator">
              <div className="flex gap-1">
                <span className="dot-pulse"></span>
                <span className="dot-pulse"></span>
                <span className="dot-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

MessageList.displayName = 'MessageList'

export default MessageList
