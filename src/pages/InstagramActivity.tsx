import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X, Search, ArrowLeft } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import InstagramLayout from '../components/InstagramLayout'
import { getDMConversations, type DMConversation, saveDMConversations } from '../utils/instagramDM'
import { getAllCharacters } from '../utils/characterManager'
import type { Character } from '../services/characterService'

/**
 * 论坛私聊列表页面 - 文艺复古版
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
    const colors = ['#8C8C8C', '#5A5A5A', '#2C2C2C', '#D4D4D4', '#e5e5e5']
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
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
    <InstagramLayout showHeader={false}>
      <div className="h-full flex flex-col bg-white soft-page-enter">
        {/* 顶部导航（包含状态栏） */}
        <div className="bg-white/95 sticky top-0 z-10 backdrop-blur-xl">
          <StatusBar />
          <div className="flex items-center justify-between px-5 pb-4 relative">
            <button
              onClick={() => navigate('/instagram')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 -ml-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 stroke-[2]" />
            </button>
            <h1 className="text-base font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">私信</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* 私聊列表 */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {conversations.length > 0 ? (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/instagram/dm/${conv.id}`)}
                  className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors"
                >
                  {/* 头像 */}
                  <div className="relative shrink-0">
                    {conv.avatar ? (
                      <img
                        src={conv.avatar}
                        alt={conv.name}
                        className="w-14 h-14 rounded-full object-cover bg-gray-100"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: getAvatarGradient(conv.name) }}
                      >
                        {conv.name[0]}
                      </div>
                    )}
                    {/* 未读红点 */}
                    {conv.unreadCount > 0 && (
                      <div className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
                        <span className="text-[10px] text-white font-bold">{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900">{conv.name}</span>
                      <span className="text-xs text-gray-400 font-medium">{conv.lastTime}</span>
                    </div>
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {conv.lastMessage || '开始聊天...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full border border-[#e5e5e5] flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#D4D4D4] stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-medium text-[#5A5A5A] mb-2">暂无消息</h3>
              <p className="text-[10px] text-[#8C8C8C] tracking-wider mb-6">
                和你的角色聊天吧
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-6 py-2 bg-[#2C2C2C] text-[white] text-xs tracking-widest uppercase rounded-sm hover:bg-black transition-colors"
              >
                新建消息
              </button>
            </div>
          )}
        </div>

        {/* 新建聊天弹窗 */}
        {showNewChat && (
          <>
            <div
              className="fixed inset-0 bg-[#2C2C2C]/20 backdrop-blur-sm z-50"
              onClick={() => setShowNewChat(false)}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] max-h-[80vh] flex flex-col animate-slide-up bg-[white] font-serif">
              {/* 头部 */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e5e5]">
                <h2 className="text-sm font-medium text-[#2C2C2C]">新建消息</h2>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e5e5e5] transition-colors"
                >
                  <X className="w-5 h-5 text-[#5A5A5A] stroke-[1.5]" />
                </button>
              </div>

              {/* 搜索框 */}
              <div className="px-6 py-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C8C]" />
                  <input
                    type="text"
                    placeholder="搜索角色..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e5e5e5] rounded-sm text-sm outline-none text-[#2C2C2C] placeholder-[#C0C0C0] font-serif tracking-wide focus:border-[#8C8C8C] transition-colors"
                  />
                </div>
              </div>

              {/* 角色列表 */}
              <div className="flex-1 overflow-y-auto px-6 pb-8 bg-[white]">
                {/* 已有会话的角色 */}
                {conversations.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-[10px] text-[#8C8C8C] mb-4 px-1">最近</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {conversations.slice(0, 8).map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setShowNewChat(false)
                            navigate(`/instagram/dm/${conv.id}`)
                          }}
                          className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                          {conv.avatar ? (
                            <img src={conv.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-[#D4D4D4] group-hover:border-[#8C8C8C] transition-colors" />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xs"
                              style={{ background: getAvatarGradient(conv.name) }}
                            >
                              {conv.name[0]}
                            </div>
                          )}
                          <span className="text-[10px] text-[#5A5A5A] text-center truncate w-full tracking-wide">{conv.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 可用角色 */}
                {availableCharacters.length > 0 && (
                  <div>
                    <h3 className="text-[10px] text-[#8C8C8C] mb-4 px-1">所有角色</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {availableCharacters.map((char) => (
                        <div
                          key={char.id}
                          onClick={() => startChatWithCharacter(char)}
                          className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                          {char.avatar ? (
                            <img src={char.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-[#D4D4D4] group-hover:border-[#8C8C8C] transition-colors" />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xs"
                              style={{ background: getAvatarGradient(char.nickname || char.realName) }}
                            >
                              {(char.nickname || char.realName)[0]}
                            </div>
                          )}
                          <span className="text-[10px] text-[#5A5A5A] text-center truncate w-full tracking-wide">
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
                    <p className="text-xs text-[#8C8C8C]">没有找到角色</p>
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
            animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
        `}</style>
      </div>
    </InstagramLayout>
  )
}

export default InstagramActivity
