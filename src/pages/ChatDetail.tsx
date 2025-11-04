/**
 * 聊天详情页面（重构版）
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
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
import Avatar from '../components/Avatar'
import type { Message } from '../types/chat'
import { useChatState, useChatAI, useAddMenu, useMessageMenu, useLongPress, useTransfer, useVoice, useLocationMsg, usePhoto } from './ChatDetail/hooks'

const ChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const chatState = useChatState(id || '')
  const chatAI = useChatAI(chatState.character, chatState.messages, chatState.setMessages, chatState.setError)
  const transfer = useTransfer(chatState.setMessages)
  const voice = useVoice(chatState.setMessages)
  const location = useLocationMsg(chatState.setMessages)
  const photo = usePhoto(chatState.setMessages)
  const addMenu = useAddMenu(
    chatAI.handleRegenerate,
    () => transfer.setShowTransferSender(true),
    () => voice.setShowVoiceSender(true),
    () => location.setShowLocationSender(true),
    () => photo.setShowPhotoSender(true)
  )
  const messageMenu = useMessageMenu(chatState.setMessages)
  const longPress = useLongPress((msg, position) => {
    messageMenu.setLongPressedMessage(msg)
    messageMenu.setMenuPosition(position)
    messageMenu.setShowMessageMenu(true)
  })
  
  const [viewingRecalledMessage, setViewingRecalledMessage] = useState<Message | null>(null)
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null)
  
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
                    onClick={() => setViewingRecalledMessage(message)}
                  >
                    {message.content}
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
              
              <div className={'flex flex-col max-w-[70%] ' + (message.type === 'sent' ? 'items-end' : 'items-start')}>
                {message.messageType === 'transfer' ? (
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
                    {message.quotedMessage && (
                      <div className="mb-2 px-2.5 py-1.5 rounded bg-black/10">
                        <div className={'text-xs font-semibold mb-0.5 ' + (message.type === 'sent' ? 'text-white' : 'text-blue-500')}>
                          {message.quotedMessage.senderName}
                        </div>
                        <div className="text-xs opacity-80 overflow-hidden text-ellipsis whitespace-nowrap">
                          {message.quotedMessage.content}
                        </div>
                      </div>
                    )}
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
      
      <div className="glass-effect border-t border-gray-200">
        {quotedMessage && (
          <div className="px-3 pt-2 pb-1">
            <div className="bg-gray-100 rounded-xl p-2 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-700 mb-0.5">
                  {quotedMessage.type === 'sent' ? '我' : character.realName}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {quotedMessage.content || quotedMessage.voiceText || quotedMessage.photoDescription || quotedMessage.location?.name || '特殊消息'}
                </div>
              </div>
              <button
                onClick={() => setQuotedMessage(null)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="px-4 py-3 flex items-center gap-2">
          <button 
            onClick={() => addMenu.setShowAddMenu(true)}
            className="text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <input
            type="text"
            value={chatState.inputValue}
            onChange={(e) => chatState.setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (chatState.inputValue.trim() ? chatAI.handleSend(chatState.inputValue, chatState.setInputValue, quotedMessage, () => setQuotedMessage(null)) : chatAI.handleAIReply())}
            placeholder="发送消息..."
            className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-green-500"
            disabled={chatAI.isAiTyping}
          />
          <button className="text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button 
            onClick={chatState.inputValue.trim() ? () => chatAI.handleSend(chatState.inputValue, chatState.setInputValue, quotedMessage, () => setQuotedMessage(null)) : chatAI.handleAIReply}
            disabled={chatAI.isAiTyping}
            className={'w-10 h-10 flex items-center justify-center rounded-full transition-colors ' + (
              !chatState.inputValue.trim() || chatAI.isAiTyping
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            ) + (chatAI.isAiTyping ? ' opacity-50' : '')}
          >
            {chatAI.isAiTyping ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <AddMenu
        isOpen={addMenu.showAddMenu}
        onClose={() => addMenu.setShowAddMenu(false)}
        onSelectRecall={addMenu.handlers.handleSelectRecall}
        onSelectImage={addMenu.handlers.handleSelectImage}
        onSelectCamera={addMenu.handlers.handleSelectCamera}
        onSelectTransfer={addMenu.handlers.handleSelectTransfer}
        onSelectIntimatePay={addMenu.handlers.handleSelectCoupleSpace}
        onSelectCoupleSpaceInvite={addMenu.handlers.handleSelectCoupleSpace}
        onSelectLocation={addMenu.handlers.handleSelectLocation}
        onSelectVoice={addMenu.handlers.handleSelectVoice}
        onSelectVideoCall={addMenu.handlers.handleSelectRecall}
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
        onQuote={() => messageMenu.handlers.handleQuoteMessage(setQuotedMessage)}
        onEdit={messageMenu.handlers.handleEditMessage}
        onBatchDelete={messageMenu.handlers.handleBatchDelete}
      />

      <TransferSender
        show={transfer.showTransferSender}
        onClose={() => transfer.setShowTransferSender(false)}
        onSend={transfer.handleSendTransfer}
      />

      <VoiceSender
        show={voice.showVoiceSender}
        onClose={() => voice.setShowVoiceSender(false)}
        onSend={voice.handleSendVoice}
      />

      <LocationSender
        show={location.showLocationSender}
        onClose={() => location.setShowLocationSender(false)}
        onSend={location.handleSendLocation}
      />

      <PhotoSender
        show={photo.showPhotoSender}
        onClose={() => photo.setShowPhotoSender(false)}
        onSend={photo.handleSendPhoto}
      />

      {viewingRecalledMessage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setViewingRecalledMessage(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-gray-900 mb-4">撤回的消息</div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {viewingRecalledMessage.recalledContent}
              </div>
            </div>
            {viewingRecalledMessage.recallReason && (
              <div className="text-xs text-gray-500 mb-4">
                撤回理由：{viewingRecalledMessage.recallReason}
              </div>
            )}
            <button
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              onClick={() => setViewingRecalledMessage(null)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatDetail
