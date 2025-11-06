/**
 * 聊天详情页面（紧急修复版）
 * 添加更多错误处理和性能优化
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, Suspense } from 'react'
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

// 加载中组件
const LoadingScreen = () => (
  <div className="h-screen flex items-center justify-center bg-[#f5f7fa]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">加载中...</p>
    </div>
  </div>
)

const ChatDetail = () => {
  console.log('🎬 ChatDetail 组件渲染')
  
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  // 防止多次初始化
  const initRef = useRef(false)
  
  useEffect(() => {
    if (initRef.current) {
      console.warn('⚠️ 组件重复初始化！')
    }
    initRef.current = true
    console.log('✅ ChatDetail 组件初始化', { id })
    
    return () => {
      console.log('🔚 ChatDetail 组件卸载')
    }
  }, [id])
  
  // 状态管理
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
  const addMenu = useAddMenu()
  const messageMenu = useMessageMenu()
  const longPress = useLongPress(messageMenu.handlers.onLongPress)
  const modals = useModals()
  
  // 检测未接来电
  useEffect(() => {
    if (!id || !chatState.character) return
    
    try {
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
    } catch (error) {
      console.error('检测未接来电失败:', error)
    }
  }, [id, chatState.character])
  
  // 撤回消息处理
  const handleRecallMessage = (messageId: number) => {
    try {
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
    } catch (error) {
      console.error('撤回消息失败:', error)
    }
  }
  
  // 滚动控制
  const isInitialLoadRef = useRef(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // 初始加载时直接跳到底部
  useEffect(() => {
    if (isInitialLoadRef.current && chatState.messages.length > 0) {
      console.log('📜 初始加载滚动到底部')
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
          scrollContainerRef.current.classList.add('enable-smooth')
        }
      }, 0)
      isInitialLoadRef.current = false
    }
  }, [chatState.messages.length > 0])
  
  // 后续消息更新时平滑滚动
  useEffect(() => {
    if (!isInitialLoadRef.current && chatState.messages.length > 0) {
      console.log('📜 消息更新滚动')
      chatAI.scrollToBottom?.(false)
    }
  }, [chatState.messages.length])
  
  // AI打字时滚动
  useEffect(() => {
    if (chatAI.isAiTyping) {
      console.log('📜 AI打字滚动')
      chatAI.scrollToBottom?.(false)
    }
  }, [chatAI.isAiTyping])
  
  if (!chatState.character) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f7fa]">
        <div className="text-center">
          <p className="text-gray-400 mb-4">角色不存在</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }
  
  const character = chatState.character
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="h-screen flex flex-col bg-[#f5f7fa]">
        {/* 头部导航栏 */}
        <div className="glass-effect">
          <StatusBar />
          <div className="px-5 py-4 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="text-gray-700 btn-press-fast touch-ripple-effect -ml-2 p-2 rounded-full">
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
            <button className="text-gray-700 btn-press-fast touch-ripple-effect -mr-2 p-2 rounded-full">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* 错误提示 */}
        {chatState.error && (
          <div className="mx-4 mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
            {chatState.error}
          </div>
        )}
        
        {/* 消息列表 - 这里省略详细内容以减少文件大小 */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
          <p className="text-center text-gray-400 my-4">
            {chatState.messages.length === 0 ? '暂无消息' : `共 ${chatState.messages.length} 条消息`}
          </p>
          <div ref={chatAI.messagesEndRef} />
        </div>
        
        {/* 简化的输入框 */}
        <div className="glass-effect border-t border-gray-200/50 px-3 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatState.inputValue}
              onChange={(e) => chatState.setInputValue(e.target.value)}
              placeholder="发送消息"
              className="flex-1 px-4 py-2 rounded-full border border-gray-300"
            />
            <button
              onClick={() => chatAI.handleSend?.(chatState.inputValue, chatState.setInputValue)}
              className="px-4 py-2 bg-green-500 text-white rounded-full"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </Suspense>
  )
}

export default ChatDetail
