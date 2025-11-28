import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Plus, X, Search, ArrowLeft } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import { getDMConversations, type DMConversation, saveDMConversations } from '../utils/instagramDM'
import { getAllCharacters } from '../utils/characterManager'
import type { Character } from '../services/characterService'

/**
 * 论坛私聊列表页面 - 现代简约设计
 */
const InstagramActivity = () => {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<DMConversation[]>([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    setConversations(getDMConversations())
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    const chars = await getAllCharacters()
    setCharacters(chars)
  }

  // 根据名字生成头像渐变色
  const getAvatarGradient = (name: string) => {
    const hue = name.charCodeAt(0) * 37 % 360
    return `linear-gradient(135deg, hsl(${hue}, 70%, 60%) 0%, hsl(${(hue + 40) % 360}, 70%, 50%) 100%)`
  }

  // 开始和角色私聊
  const startChatWithCharacter = (char: Character) => {
    const name = char.nickname || char.realName || ''
    
    // 检查是否已有会话
    const existing = conversations.find(c => c.id === char.id)
    if (!existing) {
      // 创建新会话
      const newConv: DMConversation = {
        id: char.id,
        name,
        avatar: char.avatar,
        lastMessage: '',
        lastTime: '',
        unreadCount: 0,
        updatedAt: Date.now()
      }
      const updated = [newConv, ...conversations]
      try {
        saveDMConversations(updated)
        setConversations(updated)
      } catch (e) {
        console.warn('保存会话失败，直接导航', e)
      }
    }
    
    setShowNewChat(false)
    navigate(`/instagram/dm/${char.id}`)
  }

  // 过滤角色
  const filteredCharacters = characters.filter(char => {
    const name = char.nickname || char.realName || ''
    return name.toLowerCase().includes(searchText.toLowerCase())
  })

  // 未在会话列表中的角色
  const availableCharacters = filteredCharacters.filter(
    char => !conversations.some(c => c.id === char.id)
  )

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部导航 */}
      <div className="bg-white sticky top-0 z-10">
        <StatusBar />
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate('/instagram')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">私信</h1>
          <button
            onClick={() => setShowNewChat(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm active:bg-blue-600"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 私聊列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/instagram/dm/${conv.id}`)}
                className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm active:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* 头像 */}
                <div className="relative">
                  {conv.avatar ? (
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm"
                      style={{ background: getAvatarGradient(conv.name) }}
                    >
                      {conv.name[0]}
                    </div>
                  )}
                  {/* 未读红点 */}
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                      <span className="text-xs text-white font-medium">{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
                    </div>
                  )}
                </div>
                
                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[15px] text-gray-900">{conv.name}</span>
                    <span className="text-xs text-gray-400">{conv.lastTime}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conv.lastMessage || '开始聊天吧~'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div 
              className="w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">还没有私信</h3>
            <p className="text-sm text-gray-400 mb-6">
              点击右上角 + 开始和角色聊天
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-6 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-full shadow-sm active:bg-blue-600 transition-colors"
            >
              发起私聊
            </button>
          </div>
        )}
      </div>

      {/* 新建聊天弹窗 */}
      {showNewChat && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowNewChat(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl max-h-[80vh] flex flex-col animate-slide-up" style={{ backgroundColor: '#ffffff' }}>
            {/* 头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">发起私聊</h2>
              <button
                onClick={() => setShowNewChat(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* 搜索框 */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索角色..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
            
            {/* 角色列表 */}
            <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ backgroundColor: '#ffffff' }}>
              {/* 已有会话的角色 */}
              {conversations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs text-gray-400 font-medium mb-3 px-1">最近聊天</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {conversations.slice(0, 8).map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setShowNewChat(false)
                          navigate(`/instagram/dm/${conv.id}`)
                        }}
                        className="flex flex-col items-center gap-2 p-2 rounded-xl cursor-pointer"
                        style={{ backgroundColor: '#f9fafb' }}
                      >
                        {conv.avatar ? (
                          <img src={conv.avatar} alt="" className="w-14 h-14 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div 
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-medium shadow-sm"
                            style={{ background: getAvatarGradient(conv.name) }}
                          >
                            {conv.name[0]}
                          </div>
                        )}
                        <span className="text-xs text-gray-700 text-center truncate w-full">{conv.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 可用角色 */}
              {availableCharacters.length > 0 && (
                <div>
                  <h3 className="text-xs text-gray-400 font-medium mb-3 px-1">我的角色</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {availableCharacters.map((char) => (
                      <div
                        key={char.id}
                        onClick={() => startChatWithCharacter(char)}
                        className="flex flex-col items-center gap-2 p-2 rounded-xl cursor-pointer"
                        style={{ backgroundColor: '#f9fafb' }}
                      >
                        {char.avatar ? (
                          <img src={char.avatar} alt="" className="w-14 h-14 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div 
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-medium shadow-sm"
                            style={{ background: getAvatarGradient(char.nickname || char.realName) }}
                          >
                            {(char.nickname || char.realName)[0]}
                          </div>
                        )}
                        <span className="text-xs text-gray-700 text-center truncate w-full">
                          {char.nickname || char.realName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 没有角色 */}
              {characters.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400">还没有创建角色</p>
                  <p className="text-xs text-gray-300 mt-1">先去创建一个角色吧</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default InstagramActivity
