import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import StatusBar from '../components/StatusBar'
import { characterService } from '../services/characterService'
import { loadMessages } from '../utils/simpleMessageManager'
import { getUnreadCount } from '../utils/simpleNotificationManager'

interface Chat {
  id: string
  characterId: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread?: number
}

const CHAT_LIST_KEY = 'chat_list'

const ChatList = () => {
  const navigate = useNavigate()
  const [chats, setChats] = useState<Chat[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableCharacters, setAvailableCharacters] = useState<any[]>([])
  const [wechatBg, setWechatBg] = useState(() => localStorage.getItem('wechat_background') || '')

  // 更新聊天列表的最新消息和头像
  const updateChatsWithLatestMessages = useCallback((chatList: Chat[]) => {
    return chatList.map(chat => {
      // 获取角色最新信息（包括头像）
      const character = characterService.getById(chat.characterId)
      
      // 读取未读数
      const unread = getUnreadCount(chat.characterId)
      
      const messages = loadMessages(chat.characterId)
      if (messages.length === 0) {
        return {
          ...chat,
          avatar: character?.avatar || chat.avatar,
          name: character ? (character.nickname || character.realName) : chat.name,
          unread
        }
      }

      // 找到最后一条非系统消息
      const lastMessage = [...messages].reverse().find(msg => {
        if (msg.type === 'system') {
          // 视频通话记录显示在列表
          if (msg.messageType === 'video-call-record') {
            return true
          }
          return false
        }
        return true
      })

      if (!lastMessage) {
        return {
          ...chat,
          avatar: character?.avatar || chat.avatar,
          name: character ? (character.nickname || character.realName) : chat.name
          // 保留 unread 字段
        }
      }

      // 格式化最后一条消息
      let lastMessageText = '开始聊天吧'
      if (lastMessage.messageType === 'transfer' && lastMessage.transfer) {
        lastMessageText = `[转账] ¥${lastMessage.transfer.amount}`
      } else if (lastMessage.messageType === 'voice') {
        lastMessageText = '[语音]'
      } else if (lastMessage.messageType === 'location') {
        lastMessageText = '[位置]'
      } else if (lastMessage.messageType === 'photo') {
        lastMessageText = '[照片]'
      } else if (lastMessage.messageType === 'video-call-record') {
        lastMessageText = '[视频通话]'
      } else if (lastMessage.content) {
        lastMessageText = lastMessage.content
      }

      return {
        ...chat,
        avatar: character?.avatar || chat.avatar,
        name: character ? (character.nickname || character.realName) : chat.name,
        lastMessage: lastMessageText,
        time: lastMessage.time,
        unread
      }
    })
  }, [])

  // 统一的聊天列表刷新函数
  const refreshChatList = useCallback(() => {
    const savedChats = localStorage.getItem(CHAT_LIST_KEY)
    if (savedChats) {
      const chatList = JSON.parse(savedChats)
      const updatedChats = updateChatsWithLatestMessages(chatList)
      setChats(updatedChats)
    }
  }, [updateChatsWithLatestMessages])

  // 加载聊天列表
  useEffect(() => {
    refreshChatList()
    loadCharacters()
  }, [refreshChatList])

  // 监听未读数更新事件
  useEffect(() => {
    const handleUnreadUpdate = () => {
      refreshChatList()
    }

    window.addEventListener('unread-updated', handleUnreadUpdate)
    window.addEventListener('new-message', handleUnreadUpdate)
    
    return () => {
      window.removeEventListener('unread-updated', handleUnreadUpdate)
      window.removeEventListener('new-message', handleUnreadUpdate)
    }
  }, [refreshChatList])

  // 监听页面可见性，当返回页面时更新消息
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshChatList()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshChatList])

  // 注意：不要自动保存 chats 到 localStorage
  // 因为 unread 字段由 unreadMessages.ts 管理
  // 只在添加/删除聊天时手动保存

  const loadCharacters = () => {
    const allCharacters = characterService.getAll()
    // 过滤出未添加到聊天列表的角色
    const available = allCharacters.filter(
      c => !chats.some(chat => chat.characterId === c.id)
    )
    setAvailableCharacters(available)
  }

  const handleAddCharacter = (characterId: string) => {
    const character = availableCharacters.find(c => c.id === characterId)
    if (!character) return

    const newChat: Chat = {
      id: characterId,
      characterId: characterId,
      name: character.nickname || character.realName,
      avatar: character.avatar || '',
      lastMessage: '开始聊天吧',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const updatedChats = [newChat, ...chats]
    setChats(updatedChats)
    localStorage.setItem(CHAT_LIST_KEY, JSON.stringify(updatedChats))
    setShowAddModal(false)
    loadCharacters() // 重新加载可用角色
  }

  // 监听背景更新
  useEffect(() => {
    const handleBgUpdate = () => {
      setWechatBg(localStorage.getItem('wechat_background') || '')
    }
    window.addEventListener('wechatBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('wechatBackgroundUpdate', handleBgUpdate)
  }, [])

  return (
    <div 
      className="h-screen flex flex-col bg-[#f5f7fa] page-enter bg-cover bg-center"
      style={wechatBg ? { backgroundImage: `url(${wechatBg})` } : {}}
    >
      {/* 顶部 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">微信</h1>
          <div className="flex items-center gap-3">
            <button className="text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button 
              onClick={() => {
                loadCharacters()
                setShowAddModal(true)
              }}
              className="text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 聊天列表 */}
      <div className="flex-1 overflow-y-auto pt-3">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-base mb-2">暂无聊天</p>
            <p className="text-sm">点击右上角 + 添加角色开始聊天</p>
          </div>
        ) : (
          chats.map((chat, index) => (
            <div
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="flex items-center px-5 py-4 glass-card mb-2 mx-3 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform list-item-enter"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* 头像 */}
              <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
              </div>

              {/* 消息内容 */}
              <div className="flex-1 ml-4 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{chat.name}</span>
                  <span className="text-xs text-gray-400">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 truncate flex-1">{chat.lastMessage}</p>
                  {(chat.unread ?? 0) > 0 && (
                    <span className="ml-2 px-2 min-w-[20px] h-5 rounded-full text-xs text-white flex items-center justify-center bg-red-500 shadow-md badge-pop">
                      {(chat.unread ?? 0) > 99 ? '99+' : chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部导航栏 */}
      <div className="glass-effect border-t border-gray-200">
        <div className="grid grid-cols-4 h-16">
          <button className="flex flex-col items-center justify-center text-green-600">
            <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className="text-xs">微信</span>
          </button>
          <button onClick={() => navigate('/contacts')} className="flex flex-col items-center justify-center text-gray-500">
            <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/>
            </svg>
            <span className="text-xs">通讯录</span>
          </button>
          <button onClick={() => navigate('/discover')} className="flex flex-col items-center justify-center text-gray-500">
            <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-xs">发现</span>
          </button>
          <button onClick={() => navigate('/me')} className="flex flex-col items-center justify-center text-gray-500">
            <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="text-xs">我</span>
          </button>
        </div>
      </div>

      {/* 添加角色弹窗 */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="glass-card rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">添加角色</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              {availableCharacters.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-gray-500 mb-4">暂无可添加的角色</p>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      navigate('/create-character')
                    }}
                    className="px-6 py-2 bg-green-500 text-white rounded-full active:scale-95 transition-transform"
                  >
                    创建新角色
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCharacters.map(character => (
                    <div
                      key={character.id}
                      onClick={() => handleAddCharacter(character.id)}
                      className="flex items-center p-4 glass-card rounded-2xl cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-transform"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                        {character.avatar ? (
                          <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        )}
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <h3 className="font-medium text-gray-900">{character.nickname || character.realName}</h3>
                        {character.signature && (
                          <p className="text-sm text-gray-500 truncate">{character.signature}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatList
