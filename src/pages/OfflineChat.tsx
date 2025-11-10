/**
 * 线下模式/小说模式页面
 * 独立的剧情叙事界面
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useChatState, useChatAI } from './ChatDetail/hooks'
import Avatar from '../components/Avatar'
import OfflineMessageBubble from './ChatDetail/components/OfflineMessageBubble'

const OfflineChat = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const chatState = useChatState(id || '')
  const [, setError] = useState<string | null>(null)
  
  const chatAI = useChatAI(
    id || '',
    chatState.character,
    chatState.messages,
    chatState.setMessages,
    setError
  )
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  
  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatState.messages])
  
  // 只显示线下模式的消息
  const offlineMessages = chatState.messages.filter(m => m.sceneMode === 'offline')
  
  const handleSend = async () => {
    if (!inputValue.trim() || chatAI.isAiTyping) return
    
    // 发送用户消息
    chatAI.handleSend(inputValue, setInputValue, null, undefined, 'offline')
    setInputValue('')
    
    // 触发AI回复
    setTimeout(() => {
      chatAI.handleAIReply()
    }, 100)
  }
  
  if (!chatState.character) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-3 py-2.5 flex items-center gap-2">
        <button
          onClick={() => navigate(`/chat/${id}`)}
          className="text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2 flex-1">
          <Avatar type="received" avatar={chatState.character.avatar} name={chatState.character.realName} />
          <div className="text-sm font-medium text-gray-900">
            {chatState.character.nickname || chatState.character.realName}
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-4 pt-2">
        {offlineMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8">
            <div className="text-gray-300 mb-3">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 text-center">
              发送消息开始叙事
            </p>
          </div>
        ) : (
          offlineMessages.map(message => (
            <OfflineMessageBubble
              key={message.id}
              message={message}
              characterName={chatState.character!.nickname || chatState.character!.realName}
              characterAvatar={chatState.character!.avatar}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="发送消息"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
          />
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || chatAI.isAiTyping}
            className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded-full disabled:opacity-40"
          >
            {chatAI.isAiTyping ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OfflineChat
