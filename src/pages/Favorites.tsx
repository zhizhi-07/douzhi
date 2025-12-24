/**
 * 收藏页面
 * 展示用户收藏的聊天记录（仿真聊天界面样式）
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { getFavorites, deleteFavorite, formatMessageContent, type FavoriteItem } from '../utils/favoriteManager'
import { getUserInfo } from '../utils/userUtils'
import type { Message } from '../types/chat'

const Favorites = () => {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string>('')

  useEffect(() => {
    setFavorites(getFavorites())
    // 获取用户头像
    const info = getUserInfo()
    setUserAvatar(info.avatar || '')
  }, [])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这条收藏吗？')) {
      deleteFavorite(id)
      setFavorites(getFavorites())
      if (expandedId === id) setExpandedId(null)
    }
  }

  const handleGoToChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/chat/${chatId}`)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - timestamp

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return days[date.getDay()]
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }

  // 判断是否需要显示时间分隔
  const shouldShowTimestamp = (messages: Message[], index: number): boolean => {
    if (index === 0) return true
    const current = messages[index]
    const prev = messages[index - 1]
    if (!current.timestamp || !prev.timestamp) return false
    return current.timestamp - prev.timestamp > 5 * 60 * 1000 // 5分钟间隔
  }

  // 格式化消息时间戳
  const formatMessageTimestamp = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  // 渲染单条消息（仿聊天界面）
  const renderMessage = (msg: Message, fav: FavoriteItem, showTimestamp: boolean) => {
    const isSent = msg.type === 'sent'
    const isSystem = msg.type === 'system'

    return (
      <div className="w-full">
        {/* 时间戳分隔 */}
        {showTimestamp && msg.timestamp && (
          <div className="flex justify-center my-3">
            <span className="text-xs text-gray-400 bg-black/5 px-3 py-1 rounded-full">
              {formatMessageTimestamp(msg.timestamp)}
            </span>
          </div>
        )}

        {/* 系统消息 */}
        {isSystem ? (
          <div className="flex justify-center my-2">
            <span className="text-xs text-gray-400 bg-black/5 px-3 py-1 rounded-full max-w-[80%] text-center">
              {formatMessageContent(msg)}
            </span>
          </div>
        ) : (
          /* 普通消息 */
          <div className={`flex items-end gap-2 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* 头像 */}
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
              {isSent ? (
                userAvatar ? (
                  <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-500">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )
              ) : (
                fav.characterAvatar ? (
                  <img src={fav.characterAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-400">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )
              )}
            </div>

            {/* 气泡 */}
            <div className={`max-w-[70%] relative ${isSent ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-3 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                  isSent
                    ? 'bg-[#95EC69] text-black rounded-br-md'
                    : 'bg-white text-[#2C2C2C] rounded-bl-md'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {formatMessageContent(msg)}
                </div>
              </div>
              {/* 时间 */}
              <div className={`text-[10px] text-gray-400 mt-1 ${isSent ? 'text-right mr-1' : 'text-left ml-1'}`}>
                {msg.time}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 头部 */}
      <div className="relative z-10 bg-white/70 backdrop-blur-md border-b border-white/40">
        <StatusBar />
        <div className="px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-medium tracking-wide text-[#2C2C2C]">收藏</h1>
          <div className="w-5" />
        </div>
      </div>

      {/* 收藏列表 */}
      <div className="flex-1 overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p>暂无收藏</p>
            <p className="text-sm mt-2 text-center">长按聊天消息选择多选，即可收藏</p>
          </div>
        ) : (
          <div className="pb-4">
            {favorites.map((fav) => (
              <div key={fav.id} className="border-b border-gray-100 last:border-b-0">
                {/* 收藏头部 - 点击展开/收起 */}
                <div
                  className="flex items-center px-4 py-3 bg-white/50 cursor-pointer hover:bg-white/70 active:bg-white/80 transition-colors"
                  onClick={() => setExpandedId(expandedId === fav.id ? null : fav.id)}
                >
                  {/* 头像 */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 shadow-sm">
                    {fav.characterAvatar ? (
                      <img src={fav.characterAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-400">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#2C2C2C] truncate">{fav.characterName}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(fav.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>{fav.messages.length} 条消息</span>
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">已收藏</span>
                    </div>
                  </div>

                  {/* 展开箭头 */}
                  <svg
                    className={`w-5 h-5 text-gray-400 ml-2 transition-transform duration-200 ${expandedId === fav.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* 展开内容 - 聊天记录 */}
                {expandedId === fav.id && (
                  <div className="bg-[#EDEDED]">
                    {/* 聊天记录区域 */}
                    <div className="max-h-[60vh] overflow-y-auto px-3 py-4">
                      {fav.messages.map((msg, idx) => (
                        <div key={idx}>
                          {renderMessage(msg, fav, shouldShowTimestamp(fav.messages, idx))}
                        </div>
                      ))}
                    </div>

                    {/* 底部操作栏 */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white/80 border-t border-gray-200">
                      <button
                        onClick={(e) => handleGoToChat(fav.chatId, e)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        跳转到聊天
                      </button>
                      <button
                        onClick={(e) => handleDelete(fav.id, e)}
                        className="flex items-center gap-1 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites
