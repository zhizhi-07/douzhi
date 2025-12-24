/**
 * 聊天详情页面（重构版 - 精简）
 * 主要负责：状态管理、逻辑协调、子组件组装
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef } from 'react'

// 子组件
import ChatHeader from './components/ChatHeader'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'
import ChatModals from './components/ChatModals'

// 功能组件
import AddMenu from '../../components/AddMenu'
import MessageMenu from '../../components/MessageMenu.floating'
import TransferSender from '../../components/TransferSender'
import VoiceSender from '../../components/VoiceSender'
import LocationSender from '../../components/LocationSender'
import PhotoSender from '../../components/PhotoSender'
import VideoCallScreen from '../../components/VideoCallScreen'
import IncomingCallScreen from '../../components/IncomingCallScreen'
import CoupleSpaceQuickMenu from '../../components/CoupleSpaceQuickMenu'
import CoupleSpaceInputModal from '../../components/CoupleSpaceInputModal'
import IntimatePaySender from './components/IntimatePaySender'

// Hooks
import {
  useChatState,
  useChatAI,
  useAddMenu,
  useMessageMenu,
  useLongPress,
  useTransfer,
  useVoice,
  useLocationMsg,
  usePhoto,
  useVideoCall,
  useChatNotifications,
  useCoupleSpace,
  useModals,
  useIntimatePay
} from './hooks'

const ChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  // ========== 状态管理 ==========
  const chatState = useChatState(id || '')
  const videoCall = useVideoCall(chatState.character, chatState.messages, chatState.setMessages)
  const chatAI = useChatAI(chatState.character, chatState.messages, chatState.setMessages, chatState.setError, videoCall.receiveIncomingCall)
  const transfer = useTransfer(chatState.setMessages, chatState.character?.nickname || chatState.character?.realName || '未知')
  const voice = useVoice(chatState.setMessages)
  const locationMsg = useLocationMsg(chatState.setMessages)
  const photo = usePhoto(chatState.setMessages)
  const intimatePay = useIntimatePay(chatState.setMessages)
  const addMenu = useAddMenu()
  const messageMenu = useMessageMenu()
  const longPress = useLongPress(messageMenu.showMenu)
  const modals = useModals()
  const coupleSpace = useCoupleSpace(id, chatState.character, chatState.setMessages)
  
  // 通知管理
  useChatNotifications({
    chatId: id,
    character: chatState.character ?? undefined,
    messages: chatState.messages
  })
  
  // ========== 滚动控制 ==========
  const isInitialLoadRef = useRef(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // 初始加载时直接跳到底部
  useEffect(() => {
    if (isInitialLoadRef.current && chatState.messages.length > 0) {
      const container = scrollContainerRef.current
      if (!container) return
      
      // 先隐藏，避免闪烁
      container.style.visibility = 'hidden'
      
      const scrollToEnd = () => {
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }
      
      // 等待DOM渲染完成后滚动
      requestAnimationFrame(() => {
        scrollToEnd()
        // 再延迟一次确保图片等异步内容加载
        setTimeout(() => {
          scrollToEnd()
          container.style.visibility = 'visible'
          container.classList.add('enable-smooth')
          isInitialLoadRef.current = false
        }, 100)
      })
    }
  }, [chatState.messages])
  
  // 后续消息更新时平滑滚动
  useEffect(() => {
    if (!isInitialLoadRef.current && chatState.messages.length > 0) {
      chatAI.scrollToBottom(false)
    }
  }, [chatState.messages.length, chatAI])
  
  // AI打字时滚动
  useEffect(() => {
    if (chatAI.isAiTyping) {
      chatAI.scrollToBottom(false)
    }
  }, [chatAI.isAiTyping, chatAI])
  
  // ========== 视频通话检测 ==========
  useEffect(() => {
    if (!id || !chatState.character) return
    
    const missedCallKey = `missed_call_${id}`
    const hasMissedCall = localStorage.getItem(missedCallKey)
    
    if (hasMissedCall === 'true') {
      localStorage.removeItem(missedCallKey)
      const systemMsg = {
        id: Date.now(),
        type: 'system' as const,
        content: `未接来电 - ${chatState.character.realName}`,
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: Date.now(),
        messageType: 'system' as const
      }
      chatState.setMessages(prev => [...prev, systemMsg])
    }
  }, [id, chatState.character])
  
  // ========== 撤回消息处理 ==========
  const handleRecallMessage = (messageId: number) => {
    chatState.setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg
      
      const isUserMessage = msg.type === 'sent'
      const originalMessageType = msg.type
      
      return {
        ...msg,
        isRecalled: true,
        recalledContent: msg.content || msg.voiceText || msg.photoDescription || '特殊消息',
        originalType: originalMessageType,
        content: isUserMessage ? '你撤回了一条消息' : (chatState.character?.realName || '对方') + '撤回了一条消息',
        type: 'system' as const,
        messageType: 'system' as const
      }
    }))
  }
  
  // ========== 亲密付状态更新 ==========
  const handleUpdateIntimatePayStatus = (messageId: number, newStatus: 'accepted' | 'rejected') => {
    chatState.setMessages(prev => prev.map(msg =>
      msg.id === messageId && msg.intimatePay
        ? { ...msg, intimatePay: { ...msg.intimatePay, status: newStatus } }
        : msg
    ))
  }
  
  // ========== 渲染 ==========
  if (!chatState.character) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f7fa]">
        <p className="text-gray-400">角色不存在</p>
      </div>
    )
  }
  
  const character = chatState.character
  
  // 调试：检查角色头像
  console.log('🖼️ [ChatDetail] character.avatar:', character.avatar ? character.avatar.substring(0, 50) + '...' : '无')
  
  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 头部导航栏 */}
      <ChatHeader
        characterName={character.nickname || character.realName}
        characterId={character.id}
        characterAvatar={character.avatar}
        isAiTyping={chatAI.isAiTyping}
      />
      
      {/* 错误提示 */}
      {chatState.error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
          {chatState.error}
        </div>
      )}
      
      {/* 消息列表 */}
      <MessageList
        ref={scrollContainerRef}
        messages={chatState.messages}
        character={character}
        chatId={id}
        isAiTyping={chatAI.isAiTyping}
        onMessageLongPress={longPress.handleLongPressStart}
        onMessageLongPressEnd={longPress.handleLongPressEnd}
        onViewRecalledMessage={modals.setViewingRecalledMessage}
        onViewCallRecord={modals.setViewingCallRecord}
        onReceiveTransfer={transfer.handleReceiveTransfer}
        onRejectTransfer={transfer.handleRejectTransfer}
        onPlayVoice={voice.handlePlayVoice}
        onToggleVoiceText={voice.handleToggleVoiceText}
        playingVoiceId={voice.playingVoiceId}
        showVoiceTextMap={voice.showVoiceTextMap}
        onUpdateIntimatePayStatus={handleUpdateIntimatePayStatus}
        onAcceptCoupleSpace={coupleSpace.acceptInvite}
        onRejectCoupleSpace={coupleSpace.rejectInvite}
      />
      <div ref={chatAI.messagesEndRef} />
      
      {/* 输入框 */}
      <ChatInput
        inputValue={chatState.inputValue}
        isAiTyping={chatAI.isAiTyping}
        quotedMessage={modals.quotedMessage}
        onInputChange={chatState.setInputValue}
        onSend={() => chatAI.handleSend(chatState.inputValue, chatState.setInputValue, modals.quotedMessage, () => modals.setQuotedMessage(null))}
        onAIReply={chatAI.handleAIReply}
        onClearQuote={() => modals.setQuotedMessage(null)}
        onShowAddMenu={() => addMenu.setShowAddMenu(true)}
      />
      
      {/* ========== 功能组件 ========== */}
      
      {/* 添加菜单 */}
      <AddMenu
        isOpen={addMenu.showAddMenu}
        onClose={() => addMenu.setShowAddMenu(false)}
        onTransfer={() => {
          addMenu.setShowAddMenu(false)
          transfer.setShowTransferSender(true)
        }}
        onVoice={() => {
          addMenu.setShowAddMenu(false)
          voice.setShowVoiceSender(true)
        }}
        onLocation={() => {
          addMenu.setShowAddMenu(false)
          locationMsg.setShowLocationSender(true)
        }}
        onPhoto={() => {
          addMenu.setShowAddMenu(false)
          photo.setShowPhotoSender(true)
        }}
        onIntimatePay={() => {
          addMenu.setShowAddMenu(false)
          intimatePay.setShowIntimatePay(true)
        }}
        onCoupleSpace={() => {
          addMenu.setShowAddMenu(false)
          coupleSpace.setShowCoupleSpaceMenu(true)
        }}
      />
      
      {/* 消息菜单 */}
      {messageMenu.menuVisible && messageMenu.selectedMessage && (
        <MessageMenu
          message={messageMenu.selectedMessage}
          position={messageMenu.menuPosition}
          onClose={messageMenu.closeMenu}
          onQuote={(msg) => {
            modals.setQuotedMessage({
              id: msg.id,
              content: msg.content || msg.voiceText || msg.photoDescription || msg.location?.name || '...',
              senderName: msg.type === 'sent' ? '我' : (character.realName || 'AI'),
              type: msg.type
            })
            messageMenu.closeMenu()
          }}
          onRecall={(msg) => {
            handleRecallMessage(msg.id)
            messageMenu.closeMenu()
          }}
        />
      )}
      
      {/* 转账发送器 */}
      {transfer.showTransferSender && (
        <TransferSender
          onClose={() => transfer.setShowTransferSender(false)}
          onSend={transfer.handleSendTransfer}
          characterName={character.nickname || character.realName}
        />
      )}
      
      {/* 语音发送器 */}
      {voice.showVoiceSender && (
        <VoiceSender
          onClose={() => voice.setShowVoiceSender(false)}
          onSend={voice.handleSendVoice}
        />
      )}
      
      {/* 位置发送器 */}
      {locationMsg.showLocationSender && (
        <LocationSender
          onClose={() => locationMsg.setShowLocationSender(false)}
          onSend={locationMsg.handleSendLocation}
        />
      )}
      
      {/* 照片发送器 */}
      {photo.showPhotoSender && (
        <PhotoSender
          onClose={() => photo.setShowPhotoSender(false)}
          onSend={photo.handleSendPhoto}
        />
      )}
      
      {/* 亲密付发送器 */}
      {intimatePay.showIntimatePay && (
        <IntimatePaySender
          characterId={character.id}
          characterName={character.nickname || character.realName}
          onClose={() => intimatePay.setShowIntimatePay(false)}
          onSend={intimatePay.handleSendIntimatePay}
        />
      )}
      
      {/* 情侣空间菜单 */}
      {coupleSpace.showCoupleSpaceMenu && (
        <CoupleSpaceQuickMenu
          onClose={() => coupleSpace.setShowCoupleSpaceMenu(false)}
          onAddPhoto={() => {
            coupleSpace.setShowCoupleSpaceMenu(false)
            coupleSpace.setShowAddPhotoModal(true)
          }}
          onAddMessage={() => {
            coupleSpace.setShowCoupleSpaceMenu(false)
            coupleSpace.setShowAddMessageModal(true)
          }}
          onAddAnniversary={() => {
            coupleSpace.setShowCoupleSpaceMenu(false)
            coupleSpace.setShowAddAnniversaryModal(true)
          }}
        />
      )}
      
      {/* 情侣空间输入模态框 */}
      <CoupleSpaceInputModal
        type="photo"
        isOpen={coupleSpace.showAddPhotoModal}
        onClose={() => coupleSpace.setShowAddPhotoModal(false)}
        onSubmit={coupleSpace.handleAddPhoto}
      />
      
      <CoupleSpaceInputModal
        type="message"
        isOpen={coupleSpace.showAddMessageModal}
        onClose={() => coupleSpace.setShowAddMessageModal(false)}
        onSubmit={coupleSpace.handleAddMessage}
      />
      
      <CoupleSpaceInputModal
        type="anniversary"
        isOpen={coupleSpace.showAddAnniversaryModal}
        onClose={() => coupleSpace.setShowAddAnniversaryModal(false)}
        onSubmit={coupleSpace.handleAddAnniversary}
      />
      
      {/* 视频通话 */}
      {videoCall.isCallActive && (
        <VideoCallScreen
          character={character}
          messages={videoCall.callMessages}
          isAITyping={videoCall.isAITyping}
          onEndCall={videoCall.endCall}
          onSendMessage={videoCall.sendMessage}
          onRequestAIReply={videoCall.requestAIReply}
        />
      )}
      
      {/* 来电屏幕 */}
      {videoCall.showIncomingCall && (
        <IncomingCallScreen
          character={character}
          onAccept={videoCall.acceptCall}
          onReject={videoCall.rejectCall}
        />
      )}
      
      {/* 模态框集合 */}
      <ChatModals
        viewingRecalledMessage={modals.viewingRecalledMessage}
        viewingCallRecord={modals.viewingCallRecord}
        onCloseRecalledMessage={() => modals.setViewingRecalledMessage(null)}
        onCloseCallRecord={() => modals.setViewingCallRecord(null)}
      />
    </div>
  )
}

export default ChatDetail
