import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMusicPlayer } from '../context/MusicPlayerContext'

interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  timestamp: number
}

interface MusicTogetherState {
  song: {
    title: string
    artist: string
    cover?: string
  }
  characterId: string
  characterName: string
  characterAvatar?: string
}

const MusicTogetherChat = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const musicPlayer = useMusicPlayer()
  const [showChat, setShowChat] = useState(true)
  
  const inviteData = location.state as MusicTogetherState | null
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentSong = musicPlayer.currentSong
  
  // 自动播放邀请的歌曲
  useEffect(() => {
    if (inviteData?.song && musicPlayer.playlist.length > 0) {
      const matchedSongIndex = musicPlayer.playlist.findIndex(s => 
        s.title.toLowerCase().includes(inviteData.song.title.toLowerCase()) ||
        inviteData.song.title.toLowerCase().includes(s.title.toLowerCase())
      )
      
      if (matchedSongIndex !== -1) {
        const matchedSong = musicPlayer.playlist[matchedSongIndex]
        if (musicPlayer.currentSong?.id !== matchedSong.id) {
          console.log('🎵 找到匹配的歌曲，开始播放:', matchedSong.title)
          musicPlayer.setCurrentSong(matchedSong, matchedSongIndex)
          musicPlayer.play()
        }
      }
    }
  }, [inviteData, musicPlayer.playlist])
  
  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      const songTitle = currentSong?.title || inviteData?.song.title || '这首歌'
      
      setMessages([{
        id: Date.now(),
        type: 'ai',
        content: `嘿！我们正在一起听《${songTitle}》~ 这首歌怎么样？想聊点什么吗？🎵`,
        timestamp: Date.now()
      }])
    }
  }, [currentSong, inviteData, messages.length])

  // 发送消息
  const handleSend = async () => {
    const text = inputText.trim()
    if (!text) return

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // 简单的AI回复
    setIsAiTyping(true)
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now(),
        type: 'ai',
        content: '听着这首歌，感觉真好~ 🎵',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsAiTyping(false)
    }, 1000)
  }

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 关闭半屏
  const handleClose = () => {
    setShowChat(false)
    setTimeout(() => {
      navigate(-1)
    }, 300)
  }

  if (!showChat) return null

  return (
    <>
      {/* 半透明背景遮罩 */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" onClick={handleClose} />
      
      {/* 半屏聊天界面 */}
      <div 
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 flex flex-col"
        style={{ 
          height: '70vh',
          transform: showChat ? 'translateY(0)' : 'translateY(100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部拖动条 + 标题 */}
        <div className="flex flex-col items-center pt-3 pb-2 border-b border-gray-100">
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-3" />
          <div className="text-center px-4 pb-2">
            <div className="text-sm font-medium text-gray-900">
              {inviteData?.characterName ? `正在和 ${inviteData.characterName} 一起听` : '一起听'}
            </div>
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {currentSong?.title || inviteData?.song.title} - {currentSong?.artist || inviteData?.song.artist}
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 mb-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* 头像 */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                message.type === 'user'
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                  : 'bg-gradient-to-br from-red-400 to-pink-500 text-white'
              }`}>
                {message.type === 'user' ? '我' : '🎵'}
              </div>

              {/* 消息气泡 */}
              <div style={{ maxWidth: '70%', display: 'inline-block' }}>
                <div
                  className="message-bubble px-3 py-2"
                  style={{
                    backgroundColor: message.type === 'user' ? '#95EC69' : '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                >
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {isAiTyping && (
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                🎵
              </div>
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="说点什么..."
              className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-0"
            />
            
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isAiTyping}
              className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full shadow-lg disabled:opacity-50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default MusicTogetherChat
