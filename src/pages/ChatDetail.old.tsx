import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import StatusBar from '../components/StatusBar'
import AddMenu from '../components/AddMenu'
import MessageMenu from '../components/MessageMenu.floating'
import { characterService } from '../services/characterService'
import { 
  getApiSettings, 
  buildSystemPrompt, 
  callAIApi, 
  ChatApiError 
} from '../utils/chatApi'
import {
  createMessage,
  convertToApiMessages,
  getRecentMessages,
  loadChatMessages,
  saveChatMessages,
  parseAIMessages
} from '../utils/messageUtils'
import type { Message, Character } from '../types/chat'

/**
 * 聊天详情页面
 */
const ChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  // 状态管理
  const [character, setCharacter] = useState<Character | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  // 长按消息菜单相关
  const [showMessageMenu, setShowMessageMenu] = useState(false)
  const [longPressedMessage, setLongPressedMessage] = useState<Message | null>(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const longPressTimerRef = useRef<number | null>(null)

  /**
   * 初始化：加载角色和历史消息
   */
  useEffect(() => {
    if (!id) return
    
    const char = characterService.getById(id)
    setCharacter(char)
    
    const savedMessages = loadChatMessages(id)
    setMessages(savedMessages)
  }, [id])

  /**
   * 自动保存消息到localStorage
   */
  useEffect(() => {
    if (id && messages.length > 0) {
      saveChatMessages(id, messages)
    }
  }, [messages, id])

  /**
   * 滚动到消息底部
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isAiTyping, scrollToBottom])

  /**
   * 发送用户消息
   */
  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isAiTyping) return

    const newMessage = createMessage(inputValue, 'sent')
    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setError(null)
  }, [inputValue, isAiTyping])

  /**
   * 触发AI回复
   */
  const handleAIReply = useCallback(async () => {
    if (isAiTyping || !character) return
    
    setIsAiTyping(true)
    setError(null)
    
    try {
      // 获取API配置
      const settings = getApiSettings()
      if (!settings) {
        throw new ChatApiError('请先配置API', 'NO_API_SETTINGS')
      }

      // 构建消息历史
      const recentMessages = getRecentMessages(messages)
      const apiMessages = convertToApiMessages(recentMessages)
      
      // 构建系统提示词
      const systemPrompt = buildSystemPrompt(character, '用户')
      
      // 调试：打印系统提示词
      console.log('━━━━━━ 系统提示词 ━━━━━━')
      console.log(systemPrompt)
      console.log('━━━━━━━━━━━━━━━━━━━━')
      
      // 调用AI API
      const aiReply = await callAIApi(
        [
          { role: 'system', content: systemPrompt },
          ...apiMessages
        ],
        settings
      )
      
      // 解析AI回复（支持多条消息）
      const aiMessagesList = parseAIMessages(aiReply)
      
      // 分段发送AI消息
      const newAiMessages: Message[] = []
      for (const content of aiMessagesList) {
        const aiMessage = createMessage(content, 'received')
        newAiMessages.push(aiMessage)
        // 模拟分段发送的延迟
        await new Promise(resolve => setTimeout(resolve, 300))
        setMessages(prev => [...prev, aiMessage])
      }
      
    } catch (error) {
      console.error('AI回复失败:', error)
      
      if (error instanceof ChatApiError) {
        setError(error.message)
      } else {
        setError('AI回复失败，请稍后重试')
      }
    } finally {
      setIsAiTyping(false)
    }
  }, [isAiTyping, character, messages])

  /**
   * 加号菜单功能处理（暂时只是提示，后续实现具体逻辑）
   */
  const handleSelectRecall = useCallback(() => {
    console.log('重新生成AI回复')
    // TODO: 实现重新生成功能
  }, [])

  const handleSelectImage = useCallback(() => {
    console.log('选择相册')
    // TODO: 实现相册选择功能
  }, [])

  const handleSelectCamera = useCallback(() => {
    console.log('拍照')
    // TODO: 实现拍照功能
  }, [])

  const handleSelectTransfer = useCallback(() => {
    console.log('转账')
    // TODO: 实现转账功能
  }, [])

  const handleSelectIntimatePay = useCallback(() => {
    console.log('亲密付')
    // TODO: 实现亲密付功能
  }, [])

  const handleSelectCoupleSpace = useCallback(() => {
    console.log('情侣空间')
    // TODO: 实现情侣空间功能
  }, [])

  const handleSelectLocation = useCallback(() => {
    console.log('发送位置')
    // TODO: 实现位置功能
  }, [])

  const handleSelectVoice = useCallback(() => {
    console.log('语音消息')
    // TODO: 实现语音功能
  }, [])

  const handleSelectVideoCall = useCallback(() => {
    console.log('视频通话')
    // TODO: 实现视频通话功能
  }, [])

  const handleSelectMusicInvite = useCallback(() => {
    console.log('一起听音乐')
    // TODO: 实现一起听功能
  }, [])

  /**
   * 长按消息开始
   */
  const handleLongPressStart = useCallback((message: Message, event: React.TouchEvent | React.MouseEvent) => {
    // 获取点击位置
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressedMessage(message)
      setMenuPosition({ x: clientX, y: clientY })
      setShowMessageMenu(true)
      // 振动反馈
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 长按500ms触发
  }, [])

  /**
   * 长按消息结束
   */
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  /**
   * 消息菜单操作处理
   */
  const handleCopyMessage = useCallback(() => {
    if (!longPressedMessage) return
    navigator.clipboard.writeText(longPressedMessage.content)
    console.log('已复制:', longPressedMessage.content)
    // TODO: 显示复制成功提示
  }, [longPressedMessage])

  const handleDeleteMessage = useCallback(() => {
    if (!longPressedMessage) return
    console.log('删除消息:', longPressedMessage.id)
    // TODO: 实现删除功能
  }, [longPressedMessage])

  const handleRecallMessage = useCallback(() => {
    if (!longPressedMessage) return
    console.log('撤回消息:', longPressedMessage.id)
    // TODO: 实现撤回功能
  }, [longPressedMessage])

  const handleQuoteMessage = useCallback(() => {
    if (!longPressedMessage) return
    console.log('引用消息:', longPressedMessage.id)
    // TODO: 实现引用功能
  }, [longPressedMessage])

  const handleEditMessage = useCallback(() => {
    if (!longPressedMessage) return
    console.log('编辑消息:', longPressedMessage.id)
    // TODO: 实现编辑功能
  }, [longPressedMessage])

  const handleBatchDelete = useCallback(() => {
    console.log('批量删除')
    // TODO: 实现批量删除功能
  }, [])

  if (!character) {
    return <div className="h-screen flex items-center justify-center bg-[#f5f7fa]">
      <p className="text-gray-400">角色不存在</p>
    </div>
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {isAiTyping ? '正在输入...' : (character.nickname || character.realName)}
          </h1>
          <button className="text-gray-700">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 my-2 ${message.type === 'sent' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* 头像和时间 */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              {message.type === 'sent' ? (
                <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center overflow-hidden">
                  <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                  {character.avatar ? (
                    <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
              )}
              <div className="text-xs text-gray-400">
                {message.time}
              </div>
            </div>

            {/* 消息内容 */}
            <div className={`flex flex-col ${message.type === 'sent' ? 'items-end' : 'items-start'} max-w-[70%]`}>
              <div
                className={`px-3 py-2 rounded-lg break-words cursor-pointer ${
                  message.type === 'sent'
                    ? 'bg-green-500 text-white rounded-tr-none'
                    : 'bg-white text-gray-900 rounded-tl-none'
                }`}
                onTouchStart={(e) => handleLongPressStart(message, e)}
                onTouchEnd={handleLongPressEnd}
                onMouseDown={(e) => handleLongPressStart(message, e)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          </div>
        ))}
        
        {/* AI正在输入 */}
        {isAiTyping && (
          <div className="flex items-start gap-2 my-2">
            {/* 头像和时间 */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                {character.avatar ? (
                  <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
            </div>

            {/* 三个跳动的点 */}
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
        <div ref={messagesEndRef} />
      </div>

      {/* 输入栏 */}
      <div className="glass-effect border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddMenu(true)}
            className="text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (inputValue.trim() ? handleSend() : handleAIReply())}
            placeholder="发送消息..."
            className="flex-1 bg-white rounded-full px-4 py-2 outline-none border border-gray-200 text-sm"
            disabled={isAiTyping}
          />
          <button className="text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button 
            onClick={inputValue.trim() ? handleSend : handleAIReply}
            disabled={isAiTyping}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              !inputValue.trim() || isAiTyping
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            } ${isAiTyping ? 'opacity-50' : ''}`}
          >
            {isAiTyping ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 加号菜单 */}
      <AddMenu
        isOpen={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        onSelectRecall={handleSelectRecall}
        onSelectImage={handleSelectImage}
        onSelectCamera={handleSelectCamera}
        onSelectTransfer={handleSelectTransfer}
        onSelectIntimatePay={handleSelectIntimatePay}
        onSelectCoupleSpaceInvite={handleSelectCoupleSpace}
        onSelectLocation={handleSelectLocation}
        onSelectVoice={handleSelectVoice}
        onSelectVideoCall={handleSelectVideoCall}
        onSelectMusicInvite={handleSelectMusicInvite}
        hasCoupleSpaceActive={false}
      />

      {/* 长按消息菜单 - 悬浮气泡 */}
      <MessageMenu
        isOpen={showMessageMenu}
        message={longPressedMessage}
        menuPosition={menuPosition}
        onClose={() => {
          setShowMessageMenu(false)
          setLongPressedMessage(null)
        }}
        onCopy={handleCopyMessage}
        onDelete={handleDeleteMessage}
        onRecall={handleRecallMessage}
        onQuote={handleQuoteMessage}
        onEdit={handleEditMessage}
        onBatchDelete={handleBatchDelete}
      />
    </div>
  )
}

export default ChatDetail
