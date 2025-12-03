import React from 'react'
import { Message } from '../../../types/chat'
import CoupleSpaceInviteCard from '../../../components/CoupleSpaceInviteCard'
import IntimatePayInviteCard from '../../../components/IntimatePayInviteCard'
import ForwardedChatCard from '../../../components/ForwardedChatCard'
import TransferCard from '../../../components/TransferCard'
import VoiceCard from '../../../components/VoiceCard'
import LocationCard from '../../../components/LocationCard'
import FlipPhotoCard from '../../../components/FlipPhotoCard'
import MusicInviteCard from '../../../components/MusicInviteCard'
import MusicShareCard from '../../../components/MusicShareCard'
import PaymentRequestCard from '../../../components/PaymentRequestCard'
import ProductCard from '../../../components/ProductCard'
import PostCard from '../../../components/PostCard'
import TheatreMessage from '../../../components/TheatreMessage'
import RedPacketCard from '../../../components/RedPacketCard'

interface SpecialMessageRendererProps {
  message: Message
  characterId: string
  characterName: string
  onAcceptInvite: (messageId: number) => void
  onRejectInvite: (messageId: number) => void
  onUpdateIntimatePayStatus: (messageId: number, newStatus: 'pending' | 'accepted' | 'rejected') => void
  onViewForwardedChat: (message: Message) => void
  onReceiveTransfer: (messageId: number) => void
  onRejectTransfer: (messageId: number) => void
  onPlayVoice: (messageId: number, duration: number) => void
  onToggleVoiceText: (messageId: number) => void
  playingVoiceId: number | null
  showVoiceTextMap: Record<number, boolean>
  onAcceptMusicInvite?: (messageId: number) => void
  onRejectMusicInvite?: (messageId: number) => void
  onAcceptPayment?: (messageId: number) => void
  onRejectPayment?: (messageId: number) => void
  onOpenRedPacket?: (messageId: number) => void
  onAcceptFriendRequest?: (messageId: number) => void
  onRejectFriendRequest?: (messageId: number) => void
}

/**
 * 特殊消息类型渲染器
 * 包括：情侣空间、亲密付、转发、表情包、转账、语音、位置、照片、代付
 */
export const SpecialMessageRenderer: React.FC<SpecialMessageRendererProps> = ({
  message,
  characterId,
  characterName,
  onAcceptInvite,
  onRejectInvite,
  onUpdateIntimatePayStatus,
  onViewForwardedChat,
  onReceiveTransfer,
  onRejectTransfer,
  onPlayVoice,
  onToggleVoiceText,
  playingVoiceId,
  showVoiceTextMap,
  onAcceptMusicInvite,
  onRejectMusicInvite,
  onAcceptPayment,
  onRejectPayment,
  onOpenRedPacket,
  onAcceptFriendRequest,
  onRejectFriendRequest
}) => {
  // 红包
  if ((message.messageType as any) === 'redPacket' && (message as any).redPacket) {
    return (
      <RedPacketCard
        message={message}
        onOpenRedPacket={onOpenRedPacket}
      />
    )
  }

  // 情侣空间邀请
  if (message.coupleSpaceInvite) {
    return (
      <CoupleSpaceInviteCard
        senderName={message.coupleSpaceInvite.senderName}
        senderAvatar={message.coupleSpaceInvite.senderAvatar}
        status={message.coupleSpaceInvite.status}
        isReceived={message.type === 'received'}
        onAccept={() => onAcceptInvite(message.id)}
        onReject={() => onRejectInvite(message.id)}
      />
    )
  }

  // 好友申请卡片
  if (message.messageType === 'friendRequest' && message.friendRequest) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 max-w-[260px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">请求添加你为好友</div>
            <div className="text-xs text-gray-500 mt-0.5">验证消息：{message.friendRequest.message}</div>
          </div>
        </div>
        {message.friendRequest.status === 'pending' ? (
          <div className="flex gap-2">
            <button
              onClick={() => onRejectFriendRequest?.(message.id)}
              className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
            >
              拒绝
            </button>
            <button
              onClick={() => onAcceptFriendRequest?.(message.id)}
              className="flex-1 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              通过
            </button>
          </div>
        ) : message.friendRequest.status === 'accepted' ? (
          <div className="text-center text-sm text-green-600 py-1">✓ 已通过</div>
        ) : (
          <div className="text-center text-sm text-gray-400 py-1">已拒绝</div>
        )}
      </div>
    )
  }

  // 亲密付
  if (message.messageType === 'intimatePay' && message.intimatePay) {
    return (
      <IntimatePayInviteCard
        monthlyLimit={message.intimatePay.monthlyLimit}
        status={message.intimatePay.status}
        characterId={characterId}
        characterName={characterName}
        isSent={message.type === 'sent'}
        messageId={message.id}
        onUpdateStatus={(newStatus) => onUpdateIntimatePayStatus(message.id, newStatus)}
      />
    )
  }

  // 转发聊天
  if (message.messageType === 'forwarded-chat' && message.forwardedChat) {
    return (
      <ForwardedChatCard
        title={message.forwardedChat.title}
        messages={message.forwardedChat.messages}
        messageCount={message.forwardedChat.messageCount}
        onView={() => onViewForwardedChat(message)}
        isSent={message.type === 'sent'}
      />
    )
  }

  // 表情包
  if (message.messageType === 'emoji' && message.emoji) {
    return (
      <div className="inline-block cursor-pointer active:scale-95 transition-transform">
        <img
          src={message.emoji.url}
          alt={message.emoji.description}
          className="rounded-lg max-w-[160px] max-h-[160px] object-contain"
        />
      </div>
    )
  }

  // 转账
  if (message.messageType === 'transfer') {
    return (
      <TransferCard
        message={message}
        onReceive={onReceiveTransfer}
        onReject={onRejectTransfer}
      />
    )
  }

  // 语音消息
  if (message.messageType === 'voice') {
    return (
      <VoiceCard
        message={message}
        isPlaying={playingVoiceId === message.id}
        showText={showVoiceTextMap[message.id]}
        onPlay={onPlayVoice}
        onToggleText={onToggleVoiceText}
      />
    )
  }

  // 位置
  if (message.messageType === 'location') {
    return <LocationCard message={message} />
  }

  // 照片
  if (message.messageType === 'photo') {
    return (
      <FlipPhotoCard 
        description={message.photoDescription || '照片'}
        messageId={message.id}
        photoBase64={message.photoBase64}
      />
    )
  }

  // 一起听邀请
  if ((message.messageType as any) === 'musicInvite' && (message as any).musicInvite) {
    return (
      <MusicInviteCard
        songTitle={(message as any).musicInvite.songTitle}
        songArtist={(message as any).musicInvite.songArtist}
        songCover={(message as any).musicInvite.songCover}
        inviterName={(message as any).musicInvite.inviterName}
        status={(message as any).musicInvite.status}
        isSent={message.type === 'sent'}
        onAccept={() => onAcceptMusicInvite?.(message.id)}
        onReject={() => onRejectMusicInvite?.(message.id)}
      />
    )
  }

  // 分享音乐
  if (message.messageType === 'musicShare' && message.musicShare) {
    return (
      <MusicShareCard
        songTitle={message.musicShare.songTitle}
        songArtist={message.musicShare.songArtist}
        songCover={message.musicShare.songCover}
        onClick={() => {
          // 触发播放该歌曲
          window.dispatchEvent(
            new CustomEvent('change-song', {
              detail: {
                songTitle: message.musicShare!.songTitle,
                songArtist: message.musicShare!.songArtist
              }
            })
          )
        }}
      />
    )
  }

  // 代付请求
  if (message.messageType === 'paymentRequest' && message.paymentRequest) {
    return (
      <PaymentRequestCard
        message={message}
        isSent={message.type === 'sent'}
        onAccept={onAcceptPayment}
        onReject={onRejectPayment}
      />
    )
  }

  // 商品卡片
  if (message.messageType === 'productCard' && message.productCard) {
    return <ProductCard message={message} />
  }

  // 帖子卡片
  if (message.messageType === 'post' && message.post) {
    return <PostCard message={message} />
  }

  // 小剧场
  if (message.messageType === 'theatre' && message.theatre) {
    return <TheatreMessage message={message} />
  }

  // 拍一拍
  if (message.messageType === 'poke' && message.poke) {
    const suffix = message.poke.suffix ? message.poke.suffix : ''
    return (
      <div className="text-sm text-gray-500 text-center py-1">
        {message.poke.fromName}拍了拍{message.poke.toName}{suffix}
      </div>
    )
  }

  return null
}
