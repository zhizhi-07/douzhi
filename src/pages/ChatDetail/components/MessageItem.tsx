/**
 * 单个消息项组件
 */

import type { Message, Character } from '../../../types/chat'
import Avatar from '../../../components/Avatar'
import TransferCard from '../../../components/TransferCard'
import VoiceCard from '../../../components/VoiceCard'
import LocationCard from '../../../components/LocationCard'
import FlipPhotoCard from '../../../components/FlipPhotoCard'
import IntimatePayInviteCard from '../../../components/IntimatePayInviteCard'
import CoupleSpaceInviteCard from '../../../components/CoupleSpaceInviteCard'

interface MessageItemProps {
  message: Message
  character: Character
  onLongPressStart: (message: Message, e: React.TouchEvent | React.MouseEvent) => void
  onLongPressEnd: () => void
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

const MessageItem = ({
  message,
  character,
  onLongPressStart,
  onLongPressEnd,
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
}: MessageItemProps) => {
  // 过滤特殊标签的函数
  const filterSpecialTags = (content: string): string => {
    let filtered = content
    // 移除视频通话标签
    filtered = filtered.replace(/[\[【]视频通话[\]】]/g, '')
    // 移除画面描述
    filtered = filtered.replace(/[\[【]画面[:\：][^\]】]+[\]】]/g, '')
    // 移除相册标签
    filtered = filtered.replace(/[\[【]相册[:\：][^\]】]+[\]】]/g, '')
    // 移除纪念日标签
    filtered = filtered.replace(/[\[【]纪念日[:\：][^\]】]+[\]】]/g, '')
    // 移除留言标签
    filtered = filtered.replace(/[\[【]留言[:\：][^\]】]+[\]】]/g, '')
    return filtered.trim()
  }

  // 如果是普通文本消息，检查过滤后是否为空
  if (message.type !== 'system' && 
      !message.coupleSpaceInvite && 
      !message.messageType &&
      message.content) {
    const filteredContent = filterSpecialTags(message.content)
    // 如果过滤后内容为空，不显示这条消息
    if (!filteredContent) {
      return null
    }
  }

  // 系统消息
  if (message.type === 'system') {
    // 撤回消息
    if (message.isRecalled && message.recalledContent) {
      return (
        <div className="flex justify-center my-2">
          <div 
            className="text-xs text-gray-400 px-4 py-1 cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => onViewRecalledMessage(message)}
          >
            {message.content}
          </div>
        </div>
      )
    }
    
    // 视频通话记录
    if (message.messageType === 'video-call-record' && message.videoCallRecord) {
      return (
        <div className="flex justify-center my-2">
          <div 
            className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 shadow-sm cursor-pointer hover:bg-white transition-colors"
            onClick={() => onViewCallRecord(message)}
          >
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M18 10l4-2v8l-4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <span>{message.content}</span>
            </div>
          </div>
        </div>
      )
    }
    
    // AI随笔消息
    if (message.messageType === 'ai-memo' && (message as any).memoContent) {
      return (
        <div className="flex justify-center my-2">
          <div className="bg-amber-50/80 backdrop-blur-sm rounded-xl p-3 border border-amber-200/50 shadow-sm max-w-xs">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-amber-700 font-medium mb-1">随笔</div>
                <div className="text-sm text-gray-700 leading-relaxed break-words">
                  {(message as any).memoContent}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    // 普通系统消息
    return (
      <div className="flex justify-center my-2">
        <div className="text-xs text-gray-400 px-4 py-1">
          {message.content}
        </div>
      </div>
    )
  }

  // 普通消息
  return (
    <div
      className={'message-container flex items-start gap-2 my-2 message-enter ' + (message.type === 'sent' ? 'sent flex-row-reverse message-enter-right' : 'received flex-row message-enter-left')}
    >
      {/* 头像和时间 */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <Avatar 
          type={message.type}
          avatar={character.avatar}
          name={character.realName}
        />
        <div className="text-xs text-gray-400">
          {message.time}
        </div>
      </div>
      
      {/* 消息内容 */}
      <div className={'flex flex-col ' + (message.coupleSpaceInvite ? '' : 'max-w-[70%] ') + (message.type === 'sent' ? 'items-end' : 'items-start')}>
        {/* 引用消息 */}
        {message.quotedMessage && (
          <div className={'mb-1.5 px-2.5 py-1.5 rounded max-w-full ' + (
            message.type === 'sent' 
              ? 'bg-gray-200' 
              : 'bg-gray-200'
          )}>
            <div className={'text-xs font-semibold mb-0.5 ' + (message.type === 'sent' ? 'text-gray-900' : 'text-blue-500')}>
              {message.quotedMessage.senderName}
            </div>
            <div className={'text-xs opacity-80 overflow-hidden text-ellipsis whitespace-nowrap ' + (message.type === 'sent' ? 'text-gray-700' : 'text-gray-600')}>
              {message.quotedMessage.content}
            </div>
          </div>
        )}
        
        {/* 不同类型的消息 */}
        {message.coupleSpaceInvite ? (
          <CoupleSpaceInviteCard
            senderName={message.coupleSpaceInvite.senderName}
            senderAvatar={message.coupleSpaceInvite.senderAvatar}
            status={message.coupleSpaceInvite.status}
            isReceived={message.type === 'received'}
            onAccept={() => onAcceptCoupleSpace(message.id)}
            onReject={() => onRejectCoupleSpace(message.id)}
          />
        ) : message.messageType === 'intimatePay' && message.intimatePay ? (
          <IntimatePayInviteCard
            monthlyLimit={message.intimatePay.monthlyLimit}
            status={message.intimatePay.status}
            characterId={character?.id || ''}
            characterName={character?.nickname || character?.realName || '对方'}
            isSent={message.type === 'sent'}
            messageId={message.id}
            onUpdateStatus={(newStatus) => onUpdateIntimatePayStatus(message.id, newStatus)}
          />
        ) : message.messageType === 'transfer' ? (
          <TransferCard
            message={message}
            onReceive={onReceiveTransfer}
            onReject={onRejectTransfer}
          />
        ) : message.messageType === 'voice' ? (
          <VoiceCard
            message={message}
            isPlaying={playingVoiceId === message.id}
            showText={showVoiceTextMap[message.id]}
            onPlay={onPlayVoice}
            onToggleText={onToggleVoiceText}
          />
        ) : message.messageType === 'location' ? (
          <LocationCard message={message} />
        ) : message.messageType === 'photo' ? (
          <FlipPhotoCard 
            description={message.photoDescription || '照片'}
            messageId={message.id}
            photoBase64={message.photoBase64}
          />
        ) : (
          <div
            className={'message-bubble px-3 py-2 rounded-lg break-words cursor-pointer message-press ' + (
              message.type === 'sent'
                ? 'rounded-tr-none shadow-sm'
                : 'bg-white text-gray-900 rounded-tl-none shadow-sm'
            )}
            onTouchStart={(e) => onLongPressStart(message, e)}
            onTouchEnd={onLongPressEnd}
            onMouseDown={(e) => onLongPressStart(message, e)}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
          >
            <div className="whitespace-pre-wrap">{filterSpecialTags(message.content || '')}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageItem
