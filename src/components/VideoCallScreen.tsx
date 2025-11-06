/**
 * 视频通话界面组件
 */

import { useState, useEffect, useRef } from 'react'

interface CallMessage {
  id: number
  type: 'user' | 'ai' | 'narrator'
  content: string
  time: string
}

interface VideoCallScreenProps {
  show: boolean
  character: {
    name: string
    avatar?: string
    realName: string
  }
  onEnd: () => void
  onSendMessage: (message: string) => void
  onRequestAIReply: () => void
  onAddNarratorMessage: (content: string) => void
  messages: CallMessage[]
  isAITyping: boolean
}

const VideoCallScreen = ({
  show,
  character,
  onEnd,
  onSendMessage,
  onRequestAIReply,
  onAddNarratorMessage,
  messages,
  isAITyping
}: VideoCallScreenProps) => {
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 计时器
  useEffect(() => {
    if (!show) {
      setDuration(0)
      setIsMinimized(false)
      return
    }

    const timer = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [show])

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) {
      onRequestAIReply()
      return
    }

    onSendMessage(inputValue)
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!show) return null

  return (
    <>
      {/* 全屏视频通话界面 */}
      {!isMinimized && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
          {/* 大视频区域（对方） */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            {character.avatar ? (
              <img
                src={character.avatar}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-48 h-48 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-white text-6xl">{character.name.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* 小窗口（自己） */}
          <div className="absolute top-4 right-4 w-24 h-32 bg-gray-900 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl">
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <span className="text-white text-2xl">我</span>
            </div>
          </div>

          {/* 顶部信息栏 */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-10 bg-gradient-to-b from-black/60 to-transparent">
            {/* 最小化按钮 */}
            <button
              onClick={() => setIsMinimized(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 13H5v-2h14v2z" fill="white"/>
              </svg>
            </button>

            {/* 角色信息 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm">
                {character.avatar ? (
                  <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm">{character.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white drop-shadow-lg">{character.name}</span>
                <span className="text-sm text-white/80 drop-shadow">{formatDuration(duration)}</span>
              </div>
            </div>

            {/* 视频图标 */}
            <div className="w-10 h-10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <rect x="2" y="5" width="16" height="14" rx="2" stroke="white" strokeWidth="2" fill="none"/>
                <path d="M18 10l4-2v8l-4-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
          </div>

          {/* 对话区域 */}
          <div className="absolute left-0 right-0 bottom-48 max-h-[40%] overflow-y-auto px-4 py-4 hide-scrollbar z-10 bg-gradient-to-t from-black/60 to-transparent">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-white/60">开始对话...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  // 旁白消息（画面描述）
                  if (msg.type === 'narrator') {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <p className="text-xs italic px-4 py-1 text-center max-w-[80%] text-white/70 drop-shadow">
                          {msg.content}
                        </p>
                      </div>
                    )
                  }

                  // 普通消息
                  return (
                    <div
                      key={msg.id}
                      className={'flex ' + (msg.type === 'user' ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={'max-w-[70%] px-4 py-2 rounded-2xl shadow-lg ' + (
                          msg.type === 'user'
                            ? 'bg-green-500 text-white'
                            : 'bg-white/90 backdrop-blur-sm text-gray-900'
                        )}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                      </div>
                    </div>
                  )
                })}

                {/* AI正在输入 */}
                {isAITyping && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 底部输入和控制区域 */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 z-20 bg-gradient-to-t from-black/90 via-black/80 to-transparent pt-8">
            {/* 输入框 */}
            <div className="rounded-full px-4 py-2 flex items-center gap-2 mb-4 bg-white/20 backdrop-blur-md border border-white/30">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="说点什么..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/60"
              />
              <button
                onClick={handleSendMessage}
                className={'w-8 h-8 rounded-full flex items-center justify-center transition-all ' + (inputValue.trim() ? 'bg-green-500' : 'bg-blue-500')}
                title={inputValue.trim() ? '发送消息' : 'AI回复'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>

            {/* 控制按钮 */}
            <div className="flex justify-center items-center gap-8">
              {/* 静音 */}
              <button
                onClick={() => {
                  const newMuted = !isMuted
                  setIsMuted(newMuted)
                  const message = newMuted ? '你静音了' : '你取消静音了'
                  console.log('🎙️ 用户切换静音:', message)
                  onAddNarratorMessage(message)
                }}
                className={'w-16 h-16 rounded-full flex items-center justify-center transition-all ' + (isMuted ? 'bg-red-500 shadow-2xl' : 'bg-white/20 backdrop-blur-md')}
              >
                {isMuted ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                )}
              </button>

              {/* 挂断 */}
              <button
                onClick={onEnd}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl hover:bg-red-600 transition-colors"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white" transform="rotate(135)">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </button>

              {/* 摄像头 */}
              <button
                onClick={() => {
                  const newCameraOff = !isCameraOff
                  setIsCameraOff(newCameraOff)
                  const message = newCameraOff ? '你关闭了摄像头' : '你打开了摄像头'
                  console.log('📹 用户切换摄像头:', message)
                  onAddNarratorMessage(message)
                }}
                className={'w-16 h-16 rounded-full flex items-center justify-center transition-all ' + (isCameraOff ? 'bg-red-500 shadow-2xl' : 'bg-white/20 backdrop-blur-md')}
              >
                {isCameraOff ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <rect x="2" y="5" width="16" height="14" rx="2" stroke="white" strokeWidth="2" fill="none"/>
                    <path d="M18 10l4-2v8l-4-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2.5"/>
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <rect x="2" y="5" width="16" height="14" rx="2" stroke="white" strokeWidth="2" fill="none"/>
                    <path d="M18 10l4-2v8l-4-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 最小化悬浮窗 */}
      {isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className="fixed top-20 right-4 z-[9999] bg-white rounded-2xl shadow-2xl p-3 flex items-center gap-3 cursor-pointer border border-gray-200"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {character.avatar ? (
              <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-700 text-sm">{character.name.charAt(0)}</span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-gray-900 text-sm font-medium">{character.name}</span>
            <span className="text-gray-500 text-xs">{formatDuration(duration)}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onEnd()
            }}
            className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center ml-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" transform="rotate(135)">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </button>
        </div>
      )}
    </>
  )
}

export default VideoCallScreen
