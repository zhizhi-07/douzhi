/**
 * 聊天详情页面（重构版）
 * 使用Custom Hooks拆分逻辑，大幅简化组件
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import StatusBar from '../../components/StatusBar'
import AddMenu from '../../components/AddMenu'
import MessageMenu from '../../components/MessageMenu.floating'
import { useChatState, useChatAI, useAddMenu, useMessageMenu, useLongPress } from './hooks'

const ChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  // 使用Custom Hooks
  const chatState = useChatState(id || '')
  const chatAI = useChatAI(chatState.character, chatState.messages, chatState.setMessages, chatState.setError)
  const addMenu = useAddMenu()
  const messageMenu = useMessageMenu(chatState.setMessages)
  const longPress = useLongPress((msg, position) => {
    messageMenu.setLongPressedMessage(msg)
    messageMenu.setMenuPosition(position)
    messageMenu.setShowMessageMenu(true)
  })
  
  // 自动滚动
  useEffect(() => {
    chatAI.scrollToBottom()
  }, [chatState.messages, chatAI.isAiTyping, chatAI.scrollToBottom])
  
  // 角色不存在
  if (!chatState.character) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f7fa]">
        <p className="text-gray-400">角色不存在</p>
      </div>
    )
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
            {chatAI.isAiTyping ? '正在输入...' : (chatState.character.nickname || chatState.character.realName)}
          </h1>
          <button className="text-gray-700">
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
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chatState.messages.map((message) => (
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
                  {chatState.character.avatar ? (
                    <img src={chatState.character.avatar} alt={chatState.character.realName} className="w-full h-full object-cover" />
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
                onTouchStart={(e) => longPress.handleLongPressStart(message, e)}
                onTouchEnd={longPress.handleLongPressEnd}
                onMouseDown={(e) => longPress.handleLongPressStart(message, e)}
                onMouseUp={longPress.handleLongPressEnd}
                onMouseLeave={longPress.handleLongPressEnd}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          </div>
        ))}
        
        {/* AI正在输入 */}
        {chatAI.isAiTyping && (
          <div className="flex items-start gap-2 my-2">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                {chatState.character.avatar ? (
                  <img src={chatState.character.avatar} alt={chatState.character.realName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
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
      
      {/* 输入栏 */}
      <div className="glass-effect border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
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
            onKeyPress={(e) => e.key === 'Enter' && (chatState.inputValue.trim() ? chatAI.handleSend(chatState.inputValue, chatState.setInputValue) : chatAI.handleAIReply())}
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
            onClick={chatState.inputValue.trim() ? () => chatAI.handleSend(chatState.inputValue, chatState.setInputValue) : chatAI.handleAIReply}
            disabled={chatAI.isAiTyping}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              !chatState.inputValue.trim() || chatAI.isAiTyping
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            } ${chatAI.isAiTyping ? 'opacity-50' : ''}`}
          >
            {chatAI.isAiTyping ? (
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
        onSelectVideoCall={addMenu.handlers.handleSelectVideoCall}
        onSelectMusicInvite={addMenu.handlers.handleSelectMusicInvite}
        hasCoupleSpaceActive={false}
      />
      
      {/* 长按消息菜单 - 悬浮气泡 */}
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
        onRecall={messageMenu.handlers.handleRecallMessage}
        onQuote={messageMenu.handlers.handleQuoteMessage}
        onEdit={messageMenu.handlers.handleEditMessage}
        onBatchDelete={messageMenu.handlers.handleBatchDelete}
      />
    </div>
  )
}

export default ChatDetail
