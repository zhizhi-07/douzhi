/**
 * 聊天详情页面（重构版）
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import AddMenu from '../components/AddMenu'
import MessageMenu from '../components/MessageMenu.floating'
import TransferSender from '../components/TransferSender'
import TransferCard from '../components/TransferCard'
import VoiceSender from '../components/VoiceSender'
import VoiceCard from '../components/VoiceCard'
import LocationSender from '../components/LocationSender'
import LocationCard from '../components/LocationCard'
import PhotoSender from '../components/PhotoSender'
import FlipPhotoCard from '../components/FlipPhotoCard'
import VideoCallScreen from '../components/VideoCallScreen'
import IncomingCallScreen from '../components/IncomingCallScreen'
import CoupleSpaceInviteCard from '../components/CoupleSpaceInviteCard'
import CoupleSpaceQuickMenu from '../components/CoupleSpaceQuickMenu'
import CoupleSpaceInputModal from '../components/CoupleSpaceInputModal'
import Avatar from '../components/Avatar'
import type { Message } from '../types/chat'
import { useChatState, useChatAI, useAddMenu, useMessageMenu, useLongPress, useTransfer, useVoice, useLocationMsg, usePhoto, useVideoCall, useChatNotifications, useCoupleSpace, useModals, useIntimatePay } from './ChatDetail/hooks'
import ChatModals from './ChatDetail/components/ChatModals'
import IntimatePaySender from './ChatDetail/components/IntimatePaySender'
import IntimatePayInviteCard from '../components/IntimatePayInviteCard'

const ChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const chatState = useChatState(id || '')
  const videoCall = useVideoCall(chatState.character, chatState.messages, chatState.setMessages)
  const chatAI = useChatAI(chatState.character, chatState.messages, chatState.setMessages, chatState.setError, videoCall.receiveIncomingCall)
  const transfer = useTransfer(chatState.setMessages, chatState.character?.nickname || chatState.character?.realName || '未知')
  const voice = useVoice(chatState.setMessages)
  const locationMsg = useLocationMsg(chatState.setMessages)
  const photo = usePhoto(chatState.setMessages)
  const intimatePay = useIntimatePay(chatState.setMessages)
  
  // 通知和未读消息管理
  useChatNotifications({
    chatId: id,
    character: chatState.character ?? undefined,
    messages: chatState.messages
  })
  
  const coupleSpace = useCoupleSpace(id, chatState.character, chatState.setMessages)
  const modals = useModals()
  
  const addMenu = useAddMenu(
    chatAI.handleRegenerate,
    () => transfer.setShowTransferSender(true),
    () => voice.setShowVoiceSender(true),
    () => locationMsg.setShowLocationSender(true),
    () => photo.setShowPhotoSender(true),
    coupleSpace.openMenu,
    () => intimatePay.setShowIntimatePaySender(true)
  )
  const messageMenu = useMessageMenu(chatState.setMessages)
  const longPress = useLongPress((msg, position) => {
    messageMenu.setLongPressedMessage(msg)
    messageMenu.setMenuPosition(position)
    messageMenu.setShowMessageMenu(true)
  })
  
  
  
  // 检测未接来电（用户返回聊天页面时）
  useEffect(() => {
    if (!id || !chatState.character) return
    
    const missedCallKey = `missed_call_${id}`
    const missedCallData = sessionStorage.getItem(missedCallKey)
    
    if (missedCallData) {
      try {
        const missedCall = JSON.parse(missedCallData)
        const timeDiff = Date.now() - missedCall.timestamp
        
        // 如果未接来电在1分钟内，重新触发来电界面
        if (timeDiff < 60000) {
          console.log('📞 检测到未接来电，重新显示来电界面')
          // 清除未接来电记录
          sessionStorage.removeItem(missedCallKey)
          
          // 触发来电界面
          setTimeout(() => {
            videoCall.receiveIncomingCall()
          }, 500)
        } else {
          // 超过1分钟，清除记录并添加未接来电提示
          sessionStorage.removeItem(missedCallKey)
          
          const missedCallMsg: Message = {
            id: Date.now(),
            type: 'system',
            content: `未接来电：${chatState.character.nickname || chatState.character.realName}`,
            time: new Date(missedCall.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            timestamp: missedCall.timestamp,
            messageType: 'system'
          }
          chatState.setMessages(prev => [...prev, missedCallMsg])
        }
      } catch (e) {
        console.error('处理未接来电失败:', e)
        sessionStorage.removeItem(missedCallKey)
      }
    }
  }, [id, chatState.character, videoCall, chatState.setMessages])
  
  const handleRecallMessage = (message: Message) => {
    const isUserMessage = message.type === 'sent'
    const originalMessageType = message.type === 'sent' ? 'sent' as const : 'received' as const
    
    chatState.setMessages(prev => prev.map(msg => 
      msg.id === message.id 
        ? { 
            ...msg, 
            isRecalled: true,
            recalledContent: msg.content || msg.voiceText || msg.photoDescription || msg.location?.name || '特殊消息',
            recallReason: '',
            originalType: originalMessageType,
            content: isUserMessage ? '你撤回了一条消息' : (chatState.character?.realName || '对方') + '撤回了一条消息',
            type: 'system' as const,
            messageType: 'system' as const
          }
        : msg
    ))
  }
  
  const isInitialLoadRef = useRef(true)
  
  useEffect(() => {
    if (isInitialLoadRef.current && chatState.messages.length > 0) {
      requestAnimationFrame(() => {
        chatAI.scrollToBottom(true)
        isInitialLoadRef.current = false
      })
    }
  }, [chatState.messages, chatAI])
  
  useEffect(() => {
    if (!isInitialLoadRef.current && chatState.messages.length > 0) {
      chatAI.scrollToBottom(false)
    }
  }, [chatState.messages.length, chatAI])
  
  useEffect(() => {
    if (chatAI.isAiTyping) {
      chatAI.scrollToBottom(false)
    }
  }, [chatAI.isAiTyping, chatAI])
  
  if (!chatState.character) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f7fa]">
        <p className="text-gray-400">角色不存在</p>
      </div>
    )
  }
  
  const character = chatState.character
  
  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {chatAI.isAiTyping ? '正在输入...' : (character.nickname || character.realName)}
          </h1>
          <button className="text-gray-700">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
      
      {chatState.error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
          {chatState.error}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chatState.messages.map((message) => {
          if (message.type === 'system') {
            if (message.isRecalled && message.recalledContent) {
              return (
                <div key={message.id} className="flex justify-center my-2">
                  <div 
                    className="text-xs text-gray-400 px-4 py-1 cursor-pointer hover:text-gray-600 transition-colors"
                    onClick={() => modals.setViewingRecalledMessage(message)}
                  >
                    {message.content}
                  </div>
                </div>
              )
            }
            
            // 视频通话记录
            if (message.messageType === 'video-call-record' && message.videoCallRecord) {
              return (
                <div key={message.id} className="flex justify-center my-2">
                  <div 
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 shadow-sm cursor-pointer hover:bg-white transition-colors"
                    onClick={() => modals.setViewingCallRecord(message)}
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
            
            return (
              <div key={message.id} className="flex justify-center my-2">
                <div className="text-xs text-gray-400 px-4 py-1">
                  {message.content}
                </div>
              </div>
            )
          }

          return (
            <div
              key={message.id}
              className={'flex items-start gap-2 my-2 ' + (message.type === 'sent' ? 'flex-row-reverse' : 'flex-row')}
            >
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
              
              <div className={'flex flex-col ' + (message.coupleSpaceInvite ? '' : 'max-w-[70%] ') + (message.type === 'sent' ? 'items-end' : 'items-start')}>
                {/* 引用消息（显示在所有消息类型上方） */}
                {message.quotedMessage && (
                  <div className={'mb-1.5 px-2.5 py-1.5 rounded max-w-full ' + (
                    message.type === 'sent' 
                      ? 'bg-green-600/30' 
                      : 'bg-gray-200'
                  )}>
                    <div className={'text-xs font-semibold mb-0.5 ' + (message.type === 'sent' ? 'text-white' : 'text-blue-500')}>
                      {message.quotedMessage.senderName}
                    </div>
                    <div className={'text-xs opacity-80 overflow-hidden text-ellipsis whitespace-nowrap ' + (message.type === 'sent' ? 'text-white' : 'text-gray-600')}>
                      {message.quotedMessage.content}
                    </div>
                  </div>
                )}
                
                {message.coupleSpaceInvite ? (
                  <CoupleSpaceInviteCard
                    senderName={message.coupleSpaceInvite.senderName}
                    senderAvatar={message.coupleSpaceInvite.senderAvatar}
                    status={message.coupleSpaceInvite.status}
                    isReceived={message.type === 'received'}
                    onAccept={() => coupleSpace.acceptInvite(message.id)}
                    onReject={() => coupleSpace.rejectInvite(message.id)}
                  />
                ) : message.messageType === 'intimatePay' && message.intimatePay ? (
                  <IntimatePayInviteCard
                    monthlyLimit={message.intimatePay.monthlyLimit}
                    status={message.intimatePay.status}
                    characterId={chatState.character?.id || ''}
                    characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
                    isSent={message.type === 'sent'}
                    messageId={message.id}
                    onUpdateStatus={(newStatus) => {
                      chatState.setMessages(prev => prev.map(msg =>
                        msg.id === message.id && msg.intimatePay
                          ? { ...msg, intimatePay: { ...msg.intimatePay, status: newStatus } }
                          : msg
                      ))
                    }}
                  />
                ) : message.messageType === 'transfer' ? (
                  <TransferCard
                    message={message}
                    onReceive={transfer.handleReceiveTransfer}
                    onReject={transfer.handleRejectTransfer}
                  />
                ) : message.messageType === 'voice' ? (
                  <VoiceCard
                    message={message}
                    isPlaying={voice.playingVoiceId === message.id}
                    showText={voice.showVoiceTextMap[message.id]}
                    onPlay={voice.handlePlayVoice}
                    onToggleText={voice.handleToggleVoiceText}
                  />
                ) : message.messageType === 'location' ? (
                  <LocationCard message={message} />
                ) : message.messageType === 'photo' ? (
                  <FlipPhotoCard 
                    description={message.photoDescription || '照片'}
                    messageId={message.id}
                  />
                ) : (
                  <div
                    className={'px-3 py-2 rounded-lg break-words cursor-pointer ' + (
                      message.type === 'sent'
                        ? 'bg-green-500 text-white rounded-tr-none'
                        : 'bg-white text-gray-900 rounded-tl-none'
                    )}
                    onTouchStart={(e) => longPress.handleLongPressStart(message, e)}
                    onTouchEnd={longPress.handleLongPressEnd}
                    onMouseDown={(e) => longPress.handleLongPressStart(message, e)}
                    onMouseUp={longPress.handleLongPressEnd}
                    onMouseLeave={longPress.handleLongPressEnd}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {chatAI.isAiTyping && (
          <div className="flex items-start gap-2 my-2">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <Avatar 
                type="received"
                avatar={character.avatar}
                name={character.realName}
              />
            </div>
            
            <div className="flex flex-col items-start">
              <div className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatAI.messagesEndRef} />
      </div>
      
      {/* 底部输入栏 - 玻璃效果 */}
      <div className="glass-effect border-t border-gray-200/50">
        {modals.quotedMessage && (
          <div className="px-3 pt-2 pb-1">
            <div className="bg-gray-100 rounded-xl p-2 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-700 mb-0.5">
                  {modals.quotedMessage.type === 'sent' ? '我' : character.realName}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {modals.quotedMessage.content || modals.quotedMessage.voiceText || modals.quotedMessage.photoDescription || modals.quotedMessage.location?.name || '特殊消息'}
                </div>
              </div>
              <button
                onClick={() => modals.setQuotedMessage(null)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="px-3 py-3 flex items-center gap-2">
          <button 
            onClick={() => addMenu.setShowAddMenu(true)}
            className="w-10 h-10 flex items-center justify-center ios-button text-gray-700"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="flex-1 flex items-center bg-white/90 rounded-full px-4 py-2 shadow-inner">
            <input
              type="text"
              value={chatState.inputValue}
              onChange={(e) => chatState.setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (chatState.inputValue.trim() ? chatAI.handleSend(chatState.inputValue, chatState.setInputValue, modals.quotedMessage, () => modals.setQuotedMessage(null)) : chatAI.handleAIReply())}
              placeholder="发送消息"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
              disabled={chatAI.isAiTyping}
            />
          </div>
          <button className="w-10 h-10 flex items-center justify-center ios-button text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {chatState.inputValue.trim() ? (
            <button
              onClick={() => chatAI.handleSend(chatState.inputValue, chatState.setInputValue, quotedMessage, () => setQuotedMessage(null))}
              disabled={chatAI.isAiTyping}
              className="w-10 h-10 flex items-center justify-center ios-button bg-green-500 text-white rounded-full shadow-lg disabled:opacity-50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={chatAI.handleAIReply}
              disabled={chatAI.isAiTyping}
              className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 disabled:opacity-50 transition-all duration-200"
            >
              {chatAI.isAiTyping ? (
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          )}
        </div>
        <div className="flex justify-center pb-2">
          <div className="w-32 h-1 bg-gray-900 rounded-full opacity-40"></div>
        </div>
      </div>

      <AddMenu
        isOpen={addMenu.showAddMenu}
        onClose={() => addMenu.setShowAddMenu(false)}
        onSelectRecall={addMenu.handlers.handleSelectRecall}
        onSelectImage={addMenu.handlers.handleSelectImage}
        onSelectCamera={addMenu.handlers.handleSelectCamera}
        onSelectTransfer={addMenu.handlers.handleSelectTransfer}
        onSelectIntimatePay={addMenu.handlers.handleSelectIntimatePay}
        onSelectCoupleSpaceInvite={addMenu.handlers.handleSelectCoupleSpace}
        onSelectLocation={addMenu.handlers.handleSelectLocation}
        onSelectVoice={addMenu.handlers.handleSelectVoice}
        onSelectVideoCall={() => videoCall.startCall()}
        onSelectMusicInvite={addMenu.handlers.handleSelectRecall}
      />

      <MessageMenu
        isOpen={messageMenu.showMessageMenu}
        message={messageMenu.longPressedMessage}
        menuPosition={messageMenu.menuPosition}
        onClose={() => {
          messageMenu.setShowMessageMenu(false)
          messageMenu.setLongPressedMessage(null)
        }}
        onCopy={messageMenu.handlers.handleCopyMessage}
        onDelete={messageMenu.handlers.handleDeleteMessage}
        onRecall={() => messageMenu.handlers.handleRecallMessage(handleRecallMessage)}
        onQuote={() => messageMenu.handlers.handleQuoteMessage(modals.setQuotedMessage)}
        onEdit={messageMenu.handlers.handleEditMessage}
        onBatchDelete={messageMenu.handlers.handleBatchDelete}
      />

      <TransferSender
        show={transfer.showTransferSender}
        onClose={() => transfer.setShowTransferSender(false)}
        onSend={transfer.handleSendTransfer}
        characterId={chatState.character?.id}
        characterName={chatState.character?.nickname || chatState.character?.realName}
      />

      <VoiceSender
        show={voice.showVoiceSender}
        onClose={() => voice.setShowVoiceSender(false)}
        onSend={voice.handleSendVoice}
      />

      <LocationSender
        show={locationMsg.showLocationSender}
        onClose={() => locationMsg.setShowLocationSender(false)}
        onSend={locationMsg.handleSendLocation}
      />

      <PhotoSender
        show={photo.showPhotoSender}
        onClose={() => photo.setShowPhotoSender(false)}
        onSend={photo.handleSendPhoto}
      />

      <IntimatePaySender
        show={intimatePay.showIntimatePaySender}
        onClose={() => intimatePay.setShowIntimatePaySender(false)}
        onSend={intimatePay.handleSendIntimatePay}
        characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
      />

      <IncomingCallScreen
        show={videoCall.showIncomingCall}
        character={{
          name: character.nickname || character.realName,
          avatar: character.avatar
        }}
        isVideoCall={true}
        onAccept={videoCall.acceptCall}
        onReject={videoCall.rejectCall}
      />

      <VideoCallScreen
        show={videoCall.isCallActive}
        character={{
          name: character.nickname || character.realName,
          avatar: character.avatar,
          realName: character.realName
        }}
        onEnd={videoCall.endCall}
        onSendMessage={videoCall.sendMessage}
        onRequestAIReply={videoCall.requestAIReply}
        messages={videoCall.callMessages}
        isAITyping={videoCall.isAITyping}
      />

      <CoupleSpaceQuickMenu
        isOpen={coupleSpace.showMenu}
        onClose={() => coupleSpace.setShowMenu(false)}
        onSelectPhoto={() => {
          coupleSpace.setInputType('photo')
          coupleSpace.setShowInput(true)
        }}
        onSelectMessage={() => {
          coupleSpace.setInputType('message')
          coupleSpace.setShowInput(true)
        }}
        onSelectAnniversary={() => coupleSpace.navigate('/couple-anniversary')}
      />

      <CoupleSpaceInputModal
        isOpen={coupleSpace.showInput}
        type={coupleSpace.inputType}
        onClose={() => {
          coupleSpace.setShowInput(false)
          coupleSpace.setInputType(null)
        }}
        onSubmit={coupleSpace.submitContent}
      />

      <ChatModals
        character={character}
        viewingRecalledMessage={modals.viewingRecalledMessage}
        onCloseRecalledMessage={() => modals.setViewingRecalledMessage(null)}
        viewingCallRecord={modals.viewingCallRecord}
        onCloseCallRecord={() => modals.setViewingCallRecord(null)}
      />
    </div>
  )
}

export default ChatDetail
