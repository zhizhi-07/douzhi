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
import JudgmentCard from '../../../components/JudgmentCard'
import ShopCard from '../../../components/ShopCard'

interface SpecialMessageRendererProps {
  message: Message
  characterId: string
  characterName: string
  characterAvatar?: string
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
  onRequestJudgment?: (messageId: number) => void  // 请求判定
  onRespondToAppeal?: (messageId: number) => void  // 回应AI上诉
  isJudging?: boolean  // 是否正在判定中
}

/**
 * 特殊消息类型渲染器
 * 包括：情侣空间、亲密付、转发、表情包、转账、语音、位置、照片、代付
 */
export const SpecialMessageRenderer: React.FC<SpecialMessageRendererProps> = ({
  message,
  characterId,
  characterName,
  characterAvatar,
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
  onRejectFriendRequest,
  onRequestJudgment,
  onRespondToAppeal,
  isJudging
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

  // 购买消息
  if (message.messageType === 'purchase' && message.purchaseData) {
    return (
      <div className="max-w-[280px] mx-auto my-2">
        <div className="relative bg-[#fffcf9] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-stone-800 font-serif rounded-t-lg overflow-hidden group hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300">
          {/* Paper texture overlay */}
          <div className="absolute inset-0 bg-stone-50 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}></div>

          {/* Top Decoration: Hole for tag */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#f0f2f5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] border border-stone-200 z-20"></div>

          <div className="p-5 pb-6 relative z-10 pt-8">
            {/* Header */}
            <div className="text-center border-b border-dashed border-stone-300 pb-4 mb-4">
              <div className="text-[10px] tracking-[0.2em] text-stone-400 uppercase font-sans mb-1">Receipt</div>
              <div className="text-xl font-bold tracking-wide text-stone-800">购买凭证</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono tracking-wider">NO.{message.id.toString().padStart(8, '0')}</div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-start">
                <span className="text-sm text-stone-700 font-medium leading-tight max-w-[70%]">{message.purchaseData.productName}</span>
                <span className="text-sm font-bold font-mono text-stone-900">¥{message.purchaseData.price}</span>
              </div>

              {message.purchaseData.note && (
                <div className="relative mt-2">
                  <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-stone-200"></div>
                  <div className="text-xs text-stone-500 italic pl-2 leading-relaxed">
                    "{message.purchaseData.note}"
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-dashed border-stone-300 pt-3 mb-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest font-sans">Total Amount</span>
                <span className="text-xl font-bold text-stone-900 font-mono">¥{message.purchaseData.price}</span>
              </div>
            </div>

            {/* Footer Status */}
            <div className="flex items-center justify-center gap-1.5 pt-2 opacity-80">
              <div className="w-4 h-4 rounded-full border border-stone-300 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-stone-300 rounded-full"></div>
              </div>
              <span className="text-[10px] text-stone-400 tracking-[0.1em] font-sans">PAYMENT COMPLETED</span>
            </div>
          </div>

          {/* Bottom Jagged Edge Simulation */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#f0f2f5]" style={{
            maskImage: 'radial-gradient(circle at 50% 100%, transparent 4px, black 4.5px)',
            maskSize: '12px 6px',
            maskRepeat: 'repeat-x',
            WebkitMaskImage: 'radial-gradient(circle at 50% 100%, transparent 4px, black 4.5px)',
            WebkitMaskSize: '12px 6px',
            WebkitMaskRepeat: 'repeat-x',
            maskPosition: 'bottom',
            WebkitMaskPosition: 'bottom'
          }}></div>
        </div>
      </div>
    )
  }

  // 判定对错卡片
  if (message.messageType === 'judgment' && message.judgmentData) {
    return (
      <JudgmentCard
        data={message.judgmentData}
        isFromUser={message.type === 'sent'}
        onRequestJudgment={message.judgmentData.type === 'response' ? () => onRequestJudgment?.(message.id) : undefined}
        onRespondToAppeal={message.judgmentData.type === 'appeal' ? () => onRespondToAppeal?.(message.id) : undefined}
        isJudging={isJudging}
      />
    )
  }

  // 商城分享卡片
  if (message.messageType === 'shop' && message.shopShare) {
    return (
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
    )
  }

  // 忙碌场景消息
  if (message.messageType === 'busy' && message.type === 'system') {
    // 🔥 智能判断是否已查看消息（从场景描述中推断）
    const content = message.content || ''
    const hasSeenKeywords = /看到|看见|注意到|瞥了一眼|扫了一眼|瞄了一眼|亮起|消息提示|不想理|不想搭理|故意|晾着|冷战|生气/.test(content)
    const notSeenKeywords = /没注意|没看到|没听到|静音|勿扰|睡着|关机|没电/.test(content)
    // 如果明确提到看到了，或者提到故意不理，就是已查看；否则默认未查看
    const hasSeen = hasSeenKeywords && !notSeenKeywords

    return (
      <div className="flex justify-center my-4 px-4">
        <div className="bg-white rounded-[20px] shadow-xl shadow-gray-100/50 border border-gray-100 p-5 max-w-sm w-full relative overflow-hidden group">
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

          {/* 头部信息 */}
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              {characterAvatar ? (
                <img
                  src={characterAvatar}
                  alt={characterName}
                  className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-indigo-200 transform -rotate-6 group-hover:rotate-0 transition-all duration-500 ease-out"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 transform -rotate-6 group-hover:rotate-0 transition-all duration-500 ease-out">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              {/* 状态指示灯：已查看=蓝色，未查看=琥珀色 */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <div className={`w-2.5 h-2.5 rounded-full ${hasSeen ? 'bg-blue-500' : 'bg-amber-400 animate-pulse'}`} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base font-bold text-gray-900 truncate">{characterName}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${hasSeen ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {hasSeen ? '已读不回' : '忙碌中'}
                </span>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{hasSeen ? '选择暂时不回复' : '暂时无法回复'}</span>
              </div>
            </div>
          </div>

          {/* 场景描述 */}
          <div className="mt-4 relative z-10">
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100/50">
              <p className="text-[15px] leading-7 text-gray-700 text-justify tracking-wide font-light">
                {message.content}
              </p>
            </div>
          </div>

          {/* 底部状态 */}
          <div className="mt-3 flex items-center justify-end gap-1.5 relative z-10 opacity-60">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-400 font-medium">{hasSeen ? '已查看消息' : '手机未查看'}</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}
