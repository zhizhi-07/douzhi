/**
 * 群聊消息项组件
 */

import React from 'react'
import Avatar from '../../../components/Avatar'
import { SpecialMessageRenderer } from '../../ChatDetail/components/SpecialMessageRenderer'
import type { GroupMessage } from '../../../utils/groupChatManager'
import { characterService } from '../../../services/characterService'

interface GroupMessageItemProps {
  message: GroupMessage
  isSent: boolean
  displayName: string
  onLongPressStart: (msg: GroupMessage, e: React.TouchEvent | React.MouseEvent) => void
  onLongPressEnd: () => void
  onQuoteMessage: (msg: GroupMessage) => void
  onOpenRedPacket: (messageId: number) => void
  renderMessageContent: (content: string) => React.ReactNode
  playingVoiceId?: number | null
  showVoiceTextMap?: Record<number, boolean>
  onPlayVoice?: (messageId: number, duration: number) => void
  onToggleVoiceText?: (messageId: number) => void
}

// 获取成员头像
const getMemberAvatar = (userId: string): string => {
  if (userId === 'user') return ''
  const char = characterService.getById(userId)
  return char?.avatar || ''
}

const GroupMessageItem: React.FC<GroupMessageItemProps> = ({
  message: msg,
  isSent,
  displayName,
  onLongPressStart,
  onLongPressEnd,
  onQuoteMessage,
  onOpenRedPacket,
  renderMessageContent,
  playingVoiceId,
  showVoiceTextMap = {},
  onPlayVoice,
  onToggleVoiceText
}) => {
  const avatar = msg.userAvatar || getMemberAvatar(msg.userId)
  
  return (
    <div className={`message-container flex items-start gap-1.5 my-1 ${
      isSent ? 'sent flex-row-reverse' : 'received flex-row'
    }`}>
      <div className="flex flex-col items-center flex-shrink-0">
        <Avatar 
          type={isSent ? 'sent' : 'received'}
          avatar={isSent ? undefined : avatar}
          name={displayName}
        />
        <div className="text-xs text-gray-400">
          {msg.time}
        </div>
      </div>
      
      <div className={`flex flex-col max-w-[70%] ${
        isSent ? 'items-end' : 'items-start'
      }`}>
        {!isSent && (
          <div className="text-xs text-gray-500 mb-1 px-1">{displayName}</div>
        )}
        
        {/* 引用消息 - 在消息容器内顶部 */}
        {msg.quotedMessage && (
          <div className={'mb-1.5 px-2.5 py-1.5 rounded max-w-full ' + (
            isSent 
              ? 'bg-gray-200' 
              : 'bg-gray-200'
          )}>
            <div className={'text-xs font-semibold mb-0.5 ' + (isSent ? 'text-gray-900' : 'text-blue-500')}>
              {msg.quotedMessage.userName}
            </div>
            <div className={'text-xs opacity-80 overflow-hidden text-ellipsis whitespace-nowrap ' + (isSent ? 'text-gray-700' : 'text-gray-600')}>
              {msg.quotedMessage.content}
            </div>
          </div>
        )}
        
        <div
          onTouchStart={(e) => onLongPressStart(msg, e)}
          onTouchEnd={onLongPressEnd}
          onMouseDown={(e) => onLongPressStart(msg, e)}
          onMouseUp={onLongPressEnd}
          onMouseLeave={onLongPressEnd}
        >
          {/* 特殊消息类型：转账、语音、位置、图片、红包等 */}
          {(msg.messageType === 'transfer' || 
            msg.messageType === 'voice' || 
            msg.messageType === 'location' || 
            msg.messageType === 'photo' ||
            msg.messageType === 'redPacket' ||
            (msg as any).redPacket) ? (
            <div onClick={(e) => {
              // 红包点击事件阻止冒泡
              const isRedPacket = msg.messageType === 'redPacket' || (msg as any).redPacket
              if (isRedPacket) {
                e.stopPropagation()
              }
            }}>
              <SpecialMessageRenderer
                message={{
                  ...msg,
                  id: parseInt(msg.id.replace(/[^0-9]/g, '')) || Date.now(),
                  type: msg.userId === 'user' ? 'sent' : 'received',
                  time: msg.time,
                  timestamp: msg.timestamp || Date.now(),
                  content: msg.content
                } as any}
                characterId={msg.userId}
                characterName={displayName}
                onAcceptInvite={() => {}}
                onRejectInvite={() => {}}
                onUpdateIntimatePayStatus={() => {}}
                onViewForwardedChat={() => {}}
                onReceiveTransfer={() => {}}
                onRejectTransfer={() => {}}
                onPlayVoice={onPlayVoice || (() => {})}
                onToggleVoiceText={onToggleVoiceText || (() => {})}
                playingVoiceId={playingVoiceId || null}
                showVoiceTextMap={showVoiceTextMap}
                onOpenRedPacket={onOpenRedPacket}
              />
            </div>
          ) : msg.type === 'emoji' && msg.emojiUrl ? (
            /* 表情包消息 */
            <img
              src={msg.emojiUrl}
              alt={msg.emojiDescription || msg.content}
              className="w-24 h-24 object-cover rounded-lg"
            />
          ) : (
            /* 文本消息 */
            <div 
              className={`message-bubble px-3 py-2 break-words ${
                isSent 
                  ? 'bg-[#95ec69] text-gray-900' 
                  : 'bg-white text-gray-900 shadow-sm'
              }`}
              style={{
                borderRadius: isSent 
                  ? '18px 18px 4px 18px'  // 水滴形状：右下角小圆角
                  : '18px 18px 18px 4px'  // 水滴形状：左下角小圆角
              }}>
              <div className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupMessageItem
