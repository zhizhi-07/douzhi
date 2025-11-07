/**
 * 聊天详情页面（重构版）
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import StatusBar from '../components/StatusBar'
import { getChatWallpaper, getWallpaperStyle } from '../utils/wallpaperManager'
import AddMenu from '../components/AddMenu'
import MessageMenu from '../components/MessageMenu.floating'
import TransferSender from '../components/TransferSender'
import VoiceSender from '../components/VoiceSender'
import LocationSender from '../components/LocationSender'
import PhotoSender from '../components/PhotoSender'
import VideoCallScreen from '../components/VideoCallScreen'
import IncomingCallScreen from '../components/IncomingCallScreen'
import CoupleSpaceQuickMenu from '../components/CoupleSpaceQuickMenu'
import CoupleSpaceInputModal from '../components/CoupleSpaceInputModal'
import Avatar from '../components/Avatar'
import ForwardModal from '../components/ForwardModal'
import ForwardedChatViewer from '../components/ForwardedChatViewer'
import EmojiPanel from '../components/EmojiPanel'
import type { Message } from '../types/chat'
import { addMessage } from '../utils/simpleMessageManager'
import type { Emoji } from '../utils/emojiStorage'
import { blacklistManager } from '../utils/blacklistManager'
import { useChatState, useChatAI, useAddMenu, useMessageMenu, useLongPress, useTransfer, useVoice, useLocationMsg, usePhoto, useVideoCall, useChatNotifications, useCoupleSpace, useModals, useIntimatePay, useMultiSelect } from './ChatDetail/hooks'
import ChatModals from './ChatDetail/components/ChatModals'
import IntimatePaySender from './ChatDetail/components/IntimatePaySender'
import { useChatBubbles } from '../hooks/useChatBubbles'
import { MessageBubble } from './ChatDetail/components/MessageBubble'
import { SpecialMessageRenderer } from './ChatDetail/components/SpecialMessageRenderer'

const ChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  // 壁纸
  const [wallpaper, setWallpaper] = useState(() => 
    id ? getChatWallpaper(id) : null
  )
  
  // 气泡样式
  useChatBubbles(id)
  
  // 监听壁纸变化
  useEffect(() => {
    if (!id) return
    const checkWallpaper = () => {
      setWallpaper(getChatWallpaper(id))
    }
    window.addEventListener('storage', checkWallpaper)
    checkWallpaper()
    return () => window.removeEventListener('storage', checkWallpaper)
  }, [id])
  
  const chatState = useChatState(id || '')
  const videoCall = useVideoCall(id || '', chatState.character, chatState.messages, chatState.setMessages)
  const chatAI = useChatAI(id || '', chatState.character, chatState.messages, chatState.setMessages, chatState.setError, videoCall.receiveIncomingCall, chatState.refreshCharacter)
  const transfer = useTransfer(chatState.setMessages, chatState.character?.nickname || chatState.character?.realName || '未知')
  const voice = useVoice(chatState.setMessages, id || '')
  const locationMsg = useLocationMsg(chatState.setMessages, id || '')
  const photo = usePhoto(chatState.setMessages, id || '')
  const intimatePay = useIntimatePay(chatState.setMessages, id || '')
  
  // 通知和未读消息管理
  useChatNotifications({
    chatId: id
  })
  
  const coupleSpace = useCoupleSpace(id, chatState.character, chatState.setMessages)
  const modals = useModals()
  
  // 转发记录查看
  const [viewingForwardedChat, setViewingForwardedChat] = useState<Message | null>(null)
  
  // 表情包面板
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  
  // 发送表情包
  const handleEmojiSend = useCallback((emoji: Emoji) => {
    // 检查AI是否拉黑了用户
    const isUserBlocked = blacklistManager.isBlockedByMe(`character_${id}`, 'user')
    
    const emojiMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: `[表情包:${emoji.id}]`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'emoji',
      blockedByReceiver: isUserBlocked,  // 🔥 添加拉黑标记
      emoji: {
        id: emoji.id,
        url: emoji.url,
        name: emoji.name,
        description: emoji.description
      }
    }
    
    // 保存到localStorage
    addMessage(id || '', emojiMessage)
    
    // 更新React状态
    chatState.setMessages(prev => [...prev, emojiMessage])
    
    console.log('📤 发送表情包:', emoji.name, isUserBlocked ? '(被AI拉黑)' : '')
  }, [id, chatState])
  
  const addMenu = useAddMenu(
    chatAI.handleRegenerate,
    () => transfer.setShowTransferSender(true),
    () => voice.setShowVoiceSender(true),
    () => locationMsg.setShowLocationSender(true),
    () => photo.setShowPhotoSender(true),
    coupleSpace.openMenu,
    () => intimatePay.setShowIntimatePaySender(true)
  )
  
  // 多选模式
  const multiSelect = useMultiSelect(id || '', chatState.messages, chatState.setMessages)
  
  // 处理转发确认
  const handleForwardConfirm = useCallback((targetCharacterId: string) => {
    const selectedMessages = multiSelect.getSelectedMessages()
    
    // 创建转发消息
    const forwardedMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'forwarded-chat',
      forwardedChat: {
        title: `${chatState.character?.nickname || chatState.character?.realName || '对方'}与我的聊天记录`,
        messages: selectedMessages.map(msg => ({
          senderName: msg.type === 'sent' ? '我' : (chatState.character?.nickname || chatState.character?.realName || '对方'),
          content: msg.content || msg.voiceText || msg.photoDescription || msg.location?.name || '[特殊消息]',
          messageType: msg.messageType,
          time: msg.time
        })),
        messageCount: selectedMessages.length
      }
    }
    
    // 保存到目标聊天
    addMessage(targetCharacterId, forwardedMessage)
    
    console.log('✅ 已转发到:', targetCharacterId)
    
    // 退出多选模式
    multiSelect.exitMultiSelectMode()
  }, [multiSelect, chatState.character])
  
  const messageMenu = useMessageMenu(id || '', chatState.setMessages, multiSelect.enterMultiSelectMode)
  const longPress = useLongPress((msg, position) => {
    // 多选模式下不显示菜单
    if (multiSelect.isMultiSelectMode) return
    
    messageMenu.setLongPressedMessage(msg)
    messageMenu.setMenuPosition(position)
    messageMenu.setShowMessageMenu(true)
  })
  
  
  
  // 检测未接来电（用户返回聊天页面时）
  useEffect(() => {
    // 检查是否从全局弹窗接受来电
    const acceptCallKey = `accept_call_${id}`
    const acceptCallData = sessionStorage.getItem(acceptCallKey)
    if (acceptCallData) {
      console.log('📞 检测到接受来电标记，自动接听')
      sessionStorage.removeItem(acceptCallKey)
      setTimeout(() => {
        videoCall.receiveIncomingCall()
        setTimeout(() => {
          videoCall.acceptCall()
        }, 100)
      }, 500)
      return
    }
    
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // 初始加载时立即跳到底部，不要动画
  useEffect(() => {
    if (isInitialLoadRef.current && chatState.messages.length > 0) {
      // 直接设置scrollTop，不使用scrollIntoView避免动画
      // 使用setTimeout确保DOM已经渲染完成
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
          // 初始加载完成后启用平滑滚动
          scrollContainerRef.current.classList.add('enable-smooth')
        }
      }, 0)
      isInitialLoadRef.current = false
    }
  }, [chatState.messages])
  
  // 后续消息更新时使用平滑滚动
  useEffect(() => {
    if (!isInitialLoadRef.current && chatState.messages.length > 0) {
      chatAI.scrollToBottom(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatState.messages.length])
  
  // AI打字时滚动
  useEffect(() => {
    if (chatAI.isAiTyping) {
      chatAI.scrollToBottom(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatAI.isAiTyping])
  
  if (!chatState.character) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f7fa]">
        <p className="text-gray-400">角色不存在</p>
      </div>
    )
  }
  
  const character = chatState.character
  
  return (
    <div 
      className="h-screen flex flex-col"
      style={wallpaper ? getWallpaperStyle(wallpaper) : { backgroundColor: '#f5f7fa' }}
    >
      <div className="backdrop-blur-sm bg-white/20 border-b border-white/10">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/wechat')} className="text-gray-700 btn-press-fast touch-ripple-effect -ml-2 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 transition-all duration-300">
            {chatAI.isAiTyping ? (
              <span className="flex items-center gap-2">
                正在输入
                <span className="typing-indicator flex gap-1">
                  <span className="dot-pulse bg-gray-600"></span>
                  <span className="dot-pulse bg-gray-600"></span>
                  <span className="dot-pulse bg-gray-600"></span>
                </span>
              </span>
            ) : (
              character.nickname || character.realName
            )}
          </h1>
          <button 
            onClick={() => navigate(`/chat/${id}/settings`)}
            className="text-gray-700 btn-press-fast touch-ripple-effect -mr-2 p-2 rounded-full"
          >
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
      
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll" 
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {chatState.messages.map((message) => {
          if (message.type === 'system') {
            if (message.isRecalled && message.recalledContent) {
              return (
                <div key={message.id} className="flex justify-center my-1">
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
                <div key={message.id} className="flex justify-center my-1">
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
              <div key={message.id} className="flex justify-center my-1">
                <div className="text-xs text-gray-400 px-4 py-1">
                  {message.content}
                </div>
              </div>
            )
          }

          const isSelectable = multiSelect.isMessageSelectable(message)
          const isSelected = multiSelect.selectedMessageIds.has(message.id)
          
          return (
            <div key={message.id} className="flex flex-col gap-0.5">
            <div
              className={'message-container flex items-start gap-1.5 my-1 message-enter ' + (message.type === 'sent' ? 'sent flex-row-reverse message-enter-right' : 'received flex-row message-enter-left')}
            >
              {/* 多选模式下的复选框 */}
              {multiSelect.isMultiSelectMode && (
                <div 
                  className="flex items-center justify-center flex-shrink-0 mt-1"
                  onClick={() => isSelectable && multiSelect.toggleMessageSelection(message.id)}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    !isSelectable
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                      : isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400 bg-white cursor-pointer active:scale-90'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-center flex-shrink-0">
                <Avatar 
                  type={message.type}
                  avatar={character.avatar}
                  name={character.realName}
                />
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
                
                {/* 消息内容和拉黑标记的容器 */}
                <div className="flex items-end gap-2">
                
                {/* 时间戳 - 用户消息在左边，AI消息在右边 */}
                {message.type === 'sent' && (
                  <div className="text-xs text-gray-400 pb-0.5">
                    {message.time}
                  </div>
                )}
                
                {/* 用户被AI拉黑的警告图标（左侧） */}
                {message.blockedByReceiver && message.type === 'sent' && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                
                {/* 消息内容：特殊消息或文本气泡 */}
                {message.coupleSpaceInvite || 
                 message.messageType === 'intimatePay' || 
                 message.messageType === 'forwarded-chat' || 
                 message.messageType === 'emoji' || 
                 message.messageType === 'transfer' || 
                 message.messageType === 'voice' || 
                 message.messageType === 'location' || 
                 message.messageType === 'photo' ? (
                  <SpecialMessageRenderer
                    message={message}
                    characterId={chatState.character?.id || ''}
                    characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
                    onAcceptInvite={coupleSpace.acceptInvite}
                    onRejectInvite={coupleSpace.rejectInvite}
                    onUpdateIntimatePayStatus={(messageId, newStatus) => {
                      chatState.setMessages(prev => prev.map(msg =>
                        msg.id === messageId && msg.intimatePay
                          ? { ...msg, intimatePay: { ...msg.intimatePay, status: newStatus as 'pending' | 'accepted' | 'rejected' } }
                          : msg
                      ))
                    }}
                    onViewForwardedChat={setViewingForwardedChat}
                    onReceiveTransfer={transfer.handleReceiveTransfer}
                    onRejectTransfer={transfer.handleRejectTransfer}
                    onPlayVoice={voice.handlePlayVoice}
                    onToggleVoiceText={voice.handleToggleVoiceText}
                    playingVoiceId={voice.playingVoiceId}
                    showVoiceTextMap={voice.showVoiceTextMap}
                  />
                ) : (
                  <MessageBubble
                    message={message}
                    onLongPressStart={longPress.handleLongPressStart}
                    onLongPressEnd={longPress.handleLongPressEnd}
                  />
                )}
                
                {/* AI被拉黑的警告图标 - 和消息在同一行 */}
                {message.blocked && message.type === 'received' && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                
                {/* 时间戳 - AI消息在右边 */}
                {message.type === 'received' && (
                  <div className="text-xs text-gray-400 pb-0.5">
                    {message.time}
                  </div>
                )}
                
                </div>
                
              </div>
            </div>
            
            {/* 用户被AI拉黑的提示文字 - 独立居中显示 */}
            {message.blockedByReceiver && message.type === 'sent' && (
              <div className="flex justify-center w-full">
                <div className="text-xs text-gray-400">
                  消息已送达但对方拒收了
                </div>
              </div>
            )}
            </div>
          )
        })}
        
        {chatAI.isAiTyping && (
          <div className="flex items-start gap-1.5 my-1 message-enter message-enter-left">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <Avatar 
                type="received"
                avatar={character.avatar}
                name={character.realName}
              />
            </div>
            
            <div className="flex flex-col items-start">
              <div className="bg-white px-3 py-2 rounded-lg rounded-tl-none shadow-sm typing-indicator text-sm">
                <div className="flex gap-1">
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatAI.messagesEndRef} />
      </div>
      
      {/* 多选模式底部操作栏 */}
      {multiSelect.isMultiSelectMode && (
        <div className="backdrop-blur-sm bg-white/90 border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => multiSelect.exitMultiSelectMode()}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <span className="text-sm text-gray-600">
                已选择 {multiSelect.selectedMessageIds.size} 条
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* 转发按钮 */}
              <button
                onClick={multiSelect.openForwardModal}
                disabled={multiSelect.selectedMessageIds.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  multiSelect.selectedMessageIds.size > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                转发
              </button>
              {/* 删除按钮 */}
              <button
                onClick={multiSelect.deleteSelectedMessages}
                disabled={multiSelect.selectedMessageIds.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  multiSelect.selectedMessageIds.size > 0
                    ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 底部输入栏 - 毛玻璃效果 */}
      {!multiSelect.isMultiSelectMode && (
      <div className="bg-[#f5f7fa] border-t border-gray-200/50">
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
            className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="flex-1 flex items-center bg-white rounded-full px-4 py-2 shadow-sm touch-transition focus-within:shadow-md focus-within:scale-[1.01]">
            <input
              type="text"
              value={chatState.inputValue}
              onChange={(e) => chatState.setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !chatAI.isAiTyping && (chatState.inputValue.trim() ? chatAI.handleSend(chatState.inputValue, chatState.setInputValue, modals.quotedMessage, () => modals.setQuotedMessage(null)) : chatAI.handleAIReply())}
              placeholder="发送消息"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
          <button 
            onClick={() => setShowEmojiPanel(true)}
            className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {chatState.inputValue.trim() ? (
            <button
              onClick={() => chatAI.handleSend(chatState.inputValue, chatState.setInputValue, modals.quotedMessage, () => modals.setQuotedMessage(null))}
              disabled={chatAI.isAiTyping}
              className="w-10 h-10 flex items-center justify-center ios-button bg-green-500 text-white rounded-full shadow-lg disabled:opacity-50 ios-spring btn-press-fast"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={chatAI.handleAIReply}
              disabled={chatAI.isAiTyping}
              className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 disabled:opacity-50 btn-press-fast touch-ripple-effect"
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
      )}

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

      {/* 表情包面板 */}
      <EmojiPanel
        show={showEmojiPanel}
        onClose={() => setShowEmojiPanel(false)}
        onSelect={handleEmojiSend}
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
        onAddNarratorMessage={videoCall.addNarratorMessage}
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
        onSelectAnniversary={() => {
          coupleSpace.setInputType('anniversary')
          coupleSpace.setShowInput(true)
        }}
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

      {/* 转发弹窗 */}
      <ForwardModal
        isOpen={multiSelect.showForwardModal}
        onClose={multiSelect.closeForwardModal}
        onConfirm={handleForwardConfirm}
      />

      {/* 查看转发记录弹窗 */}
      {viewingForwardedChat && viewingForwardedChat.forwardedChat && (
        <ForwardedChatViewer
          isOpen={true}
          onClose={() => setViewingForwardedChat(null)}
          title={viewingForwardedChat.forwardedChat.title}
          messages={viewingForwardedChat.forwardedChat.messages}
        />
      )}
    </div>
  )
}

export default ChatDetail
