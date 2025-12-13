/**
 * 消息列表组件
 * 🔥 性能优化：超过50条消息时自动启用虚拟化
 */

import { forwardRef } from 'react'
import type { Message, Character } from '../../../types/chat'
import MessageItem from './MessageItem'
import VirtualMessageList from './VirtualMessageList'
import Avatar from '../../../components/Avatar'

interface MessageListProps {
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
  // 分页加载相关
  hasMoreMessages?: boolean
  isLoadingMessages?: boolean
  onLoadMore?: () => void
  // 时间戳刷新key
  timestampRefreshKey?: number
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(({ 
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
  hasMoreMessages,
  isLoadingMessages,
  onLoadMore,
  timestampRefreshKey = 0
}, ref) => {
  // 性能优化：超过30条消息时启用虚拟化
  const shouldUseVirtualization = messages.length > 30

  console.log(` [MessageList] 消息数量: ${messages.length}, 虚拟化: ${shouldUseVirtualization ? '启用' : '关闭'}`)

  if (shouldUseVirtualization) {
    // 使用虚拟化组件
    return (
      <VirtualMessageList
        messages={messages}
        character={character}
        chatId={chatId}
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
        hasMoreMessages={hasMoreMessages}
        isLoadingMessages={isLoadingMessages}
        onLoadMore={onLoadMore}
        timestampRefreshKey={timestampRefreshKey}
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
        />
      ))}
      
      {/* AI打字指示器 */}
      {isAiTyping && (
        <div className="flex items-start gap-2 my-2 message-enter message-enter-left">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <Avatar 
              type="received"
              avatar={character.avatar}
              name={character.realName}
              chatId={chatId}
            />
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
