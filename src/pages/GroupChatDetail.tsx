/**
 * 群聊详情页面
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import Avatar from '../components/Avatar'
import { groupChatManager, GroupMessage } from '../utils/groupChatManager'
import { characterService } from '../services/characterService'

// 获取成员头像
const getMemberAvatar = (userId: string): string => {
  if (userId === 'user') return ''
  const char = characterService.getById(userId)
  return char?.avatar || ''
}


const GroupChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [groupName, setGroupName] = useState('')
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    
    // 加载群聊信息
    const group = groupChatManager.getGroup(id)
    if (group) {
      setGroupName(group.name)
    }
    
    // 加载消息
    const msgs = groupChatManager.getMessages(id)
    setMessages(msgs)
    scrollToBottom()
  }, [id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = () => {
    if (!inputText.trim() || !id) return
    
    // 发送消息
    const newMsg = groupChatManager.addMessage(id, {
      userId: 'user',
      userName: '我',
      userAvatar: getMemberAvatar('user'),
      content: inputText,
      type: 'text'
    })
    
    setMessages(prev => [...prev, newMsg])
    setInputText('')
    setTimeout(scrollToBottom, 100)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="glass-effect border-b border-gray-200/30">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate('/wechat')}
            className="p-1 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-medium text-gray-900">{groupName}</h1>
          <button 
            onClick={() => navigate(`/group/${id}/settings`)}
            className="p-1 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            暂无消息
          </div>
        ) : (
          messages.map((msg) => {
            const isSent = msg.userId === 'user'
            const avatar = msg.userAvatar || getMemberAvatar(msg.userId)
            const char = msg.userId !== 'user' ? characterService.getById(msg.userId) : null
            
            return (
              <div key={msg.id} className={`message-container flex items-start gap-1.5 my-1 ${
                isSent ? 'sent flex-row-reverse' : 'received flex-row'
              }`}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <Avatar 
                    type={isSent ? 'sent' : 'received'}
                    avatar={isSent ? undefined : avatar}
                    name={isSent ? '我' : (char?.realName || msg.userName)}
                  />
                </div>
                
                <div className={`flex flex-col max-w-[70%] ${
                  isSent ? 'items-end' : 'items-start'
                }`}>
                  {!isSent && (
                    <div className="text-xs text-gray-500 mb-1 px-1">{msg.userName}</div>
                  )}
                  <div className={`message-bubble px-3 py-2 rounded-2xl break-words ${
                    isSent 
                      ? 'bg-[#95ec69] text-gray-900' 
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入栏 */}
      <div className="bg-[#f5f7fa] border-t border-gray-200/50">
        <div className="px-3 py-3 flex items-center gap-2">
          <button 
            className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="flex-1 flex items-center bg-white rounded-full px-4 py-2 shadow-sm touch-transition focus-within:shadow-md focus-within:scale-[1.01]">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="发送消息"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
          <button 
            className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {inputText.trim() ? (
            <button
              onClick={handleSend}
              className="w-10 h-10 flex items-center justify-center ios-button bg-green-500 text-white rounded-full shadow-lg ios-spring btn-press-fast"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <button 
              className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupChatDetail
