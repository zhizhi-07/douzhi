/**
 * 单个消息项组件
 */

import type { Message, Character } from '../../../types/chat'
import Avatar from '../../../components/Avatar'
import TransferCard from '../../../components/TransferCard'
import VoiceCard from '../../../components/VoiceCard'
import LocationCard from '../../../components/LocationCard'
import FlipPhotoCard from '../../../components/FlipPhotoCard'
import TacitDrawingCard from '../../../components/TacitDrawingCard'
import IntimatePayInviteCard from '../../../components/IntimatePayInviteCard'
import CoupleSpaceInviteCard from '../../../components/CoupleSpaceInviteCard'
import MusicInviteCard from '../../../components/MusicInviteCard'
import PostCard from '../../../components/PostCard'
import ShopCard from '../../../components/ShopCard'
import OfflineSummaryCard from './OfflineSummaryCard'

// 安全过滤HTML：移除危险标签和属性
const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

// 检测内容是否包含HTML标签
const containsHtml = (content: string): boolean => {
  // 检测完整HTML文档或常见的HTML标签
  const isHtmlDoc = /<!DOCTYPE\s+html/i.test(content) || /<html[\s>]/i.test(content)
  const hasHtmlTags = /<(head|body|div|style|span|p|br|img|a|table|form|input|button)[\s>\/]/i.test(content)
  console.log('🔍 [containsHtml]', { isHtmlDoc, hasHtmlTags, contentStart: content.substring(0, 50) })
  return isHtmlDoc || hasHtmlTags
}

interface MessageItemProps {
  message: Message
  character: Character
  chatId?: string
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
  onAcceptMusicInvite?: (messageId: number) => void
  onRejectMusicInvite?: (messageId: number) => void
  onEditOfflineRecord?: (message: Message) => void  // 新增：编辑线下记录
}

import { memo } from 'react'

const MessageItemContent = ({
  message,
  character,
  chatId,
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
  onRejectCoupleSpace,
  onAcceptMusicInvite,
  onRejectMusicInvite,
  onEditOfflineRecord
}: MessageItemProps) => {
  // 直接从 localStorage 读取时间戳设置（每次渲染时读取，确保实时生效）
  const hideTimestamp = localStorage.getItem('hide_message_timestamp') === 'true'
  const timestampInBubble = localStorage.getItem('timestamp_in_bubble') === 'true'
  const globalButtonColor = localStorage.getItem('global_button_color') || '#475569'

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

  // 如果是普通文本消息（没有messageType），检查过滤后是否为空
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

  // 如果有messageType但content为空，允许渲染（特殊消息类型如帖子）
  if (message.messageType && !message.content) {
    console.log('🎯 [MessageItem] 特殊消息类型:', message.messageType, message)
  }

  // 系统消息
  if (message.type === 'system') {
    // 🔥 如果是只给AI看的消息，不在界面显示
    if (message.aiOnly) {
      return null
    }

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
                <rect x="2" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M18 10l4-2v8l-4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span>{message.content}</span>
            </div>
          </div>
        </div>
      )
    }

    // 线下记录
    if (message.messageType === 'offline-summary' && message.offlineSummary) {
      return <OfflineSummaryCard message={message} onEdit={onEditOfflineRecord} />
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
      className={'message-container flex items-start gap-3 my-3 message-enter ' + (message.type === 'sent' ? 'sent flex-row-reverse message-enter-right' : 'received flex-row message-enter-left')}
    >
      {/* 头像和时间 */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 p-1">
        <Avatar
          type={message.type}
          avatar={character.avatar}
          name={character.realName}
          chatId={chatId}
        />
        {!hideTimestamp && !timestampInBubble && (
          <div className="text-xs text-gray-400">
            {message.time}
          </div>
        )}
      </div>

      {/* 消息内容 */}
      <div className={'flex flex-col ' + (message.coupleSpaceInvite || containsHtml(message.content || '') ? '' : 'max-w-[70%] ') + (message.type === 'sent' ? 'items-end' : 'items-start')}>
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
          // 检查是否是你画我猜游戏的画作（通过content或photoDescription判断）
          (message.content?.includes('[你画我猜:') || message.photoDescription?.includes('你画我猜')) && message.photoBase64 ? (
            <TacitDrawingCard
              imageData={message.photoBase64}
              topic={message.content?.match(/\[你画我猜:\s*(.+?)\]/)?.[1] || ''}
            />
          ) : (
            <FlipPhotoCard
              description={message.photoDescription || '照片'}
              messageId={message.id}
              photoBase64={message.photoBase64}
            />
          )
        ) : message.messageType === 'musicInvite' && message.musicInvite ? (
          <MusicInviteCard
            inviterName={message.musicInvite.inviterName}
            songTitle={message.musicInvite.songTitle}
            songArtist={message.musicInvite.songArtist}
            songCover={message.musicInvite.songCover}
            status={message.musicInvite.status}
            isSent={message.type === 'sent'}
            onAccept={() => onAcceptMusicInvite?.(message.id)}
            onReject={() => onRejectMusicInvite?.(message.id)}
          />
        ) : message.messageType === 'post' && message.post ? (
          <PostCard message={message} />
        ) : message.messageType === 'shop' && message.shopShare ? (
          <ShopCard
            shopName={message.shopShare.shopName}
            productCount={message.shopShare.productCount}
            previewProducts={message.shopShare.previewProducts}
            onClick={() => {
              // 触发查看店铺事件
              window.dispatchEvent(new CustomEvent('view-shop', {
                detail: { shopId: message.shopShare!.shopId }
              }))
            }}
          />
        ) : containsHtml(message.content || '') ? (
          // 🔥 HTML内容直接渲染，不用消息气泡包裹
          (() => {
            const htmlContent = message.content || ''
            const isFullHtmlDoc = /<!DOCTYPE\s+html/i.test(htmlContent) || /<html[\s>]/i.test(htmlContent)
            const safeHtml = sanitizeHtml(htmlContent)
            console.log('🎯 [HTML渲染]', { isFullHtmlDoc, length: htmlContent.length })
            
            if (isFullHtmlDoc) {
              return (
                <div className="html-message-content">
                  <iframe
                    srcDoc={safeHtml}
                    style={{
                      width: '280px',
                      height: '420px',
                      border: 'none',
                      borderRadius: '12px',
                      background: '#000'
                    }}
                    sandbox="allow-same-origin"
                    title="HTML内容"
                  />
                </div>
              )
            }
            // 普通HTML片段
            return (
              <div 
                className="html-message-content bg-white rounded-xl p-2 shadow-sm"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
            )
          })()
        ) : (
          <div
            className={'message-bubble px-3 py-2 break-words cursor-pointer message-press ' + (
              message.type === 'sent'
                ? 'shadow-sm mr-2'
                : 'bg-white text-gray-900 shadow-sm ml-2'
            )}
            style={{
              borderRadius: message.type === 'sent'
                ? '18px 18px 4px 18px'  // 水滴形状：右下角小圆角
                : '18px 18px 18px 4px'  // 水滴形状：左下角小圆角
            }}
            onTouchStart={(e) => onLongPressStart(message, e)}
            onTouchEnd={onLongPressEnd}
            onMouseDown={(e) => onLongPressStart(message, e)}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
          >
            {(() => {
              const filteredContent = filterSpecialTags(message.content || '')
              
              // 普通文本内容
              return timestampInBubble && !hideTimestamp ? (
                <div className="flex items-end gap-2">
                  <div className="whitespace-pre-wrap flex-1">{filteredContent}</div>
                  <span style={{ color: globalButtonColor, opacity: 0.7, fontSize: '10px' }}>
                    {message.time}
                  </span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{filteredContent}</div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

// 🔥 使用React.memo优化，避免不必要的重新渲染
const MessageItem = memo(MessageItemContent)

export default MessageItem
