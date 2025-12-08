import { useNavigate, useOutletContext } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { characterService, Character } from '../services/characterService'

const Contacts = () => {
  const navigate = useNavigate()
  const { customIcons } = useOutletContext<{ customIcons: Record<string, string> }>()
  
  // 🔥 直接从localStorage同步初始化，避免空状态闪烁
  const [characters, setCharacters] = useState<Character[]>(() => characterService.getAll())
  // 追踪是否完成首次加载
  const [isInitialLoaded, setIsInitialLoaded] = useState(false)

  // 从 localStorage加载角色列表
  useEffect(() => {
    const loadCharacters = () => {
      const data = characterService.getAll()
      setCharacters(data)
      setIsInitialLoaded(true)
    }

    loadCharacters()
  }, [])

  const specialContacts = [
    {
      id: 1,
      name: '新的朋友',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      path: '/create-character'
    },
    {
      id: 2,
      name: '群聊',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      path: '/group-list'
    }
  ]

  return (
    <div className="h-full flex flex-col font-serif">
      {/* 顶部 - 玻璃拟态 */}
      <div
        className="relative z-10"
        style={customIcons['main-topbar-bg'] ? {
          backgroundImage: `url(${customIcons['main-topbar-bg']})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.4)'
        }}
      >
        <StatusBar />
        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate('/')} className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform">
              <svg className="w-5 h-5 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-medium tracking-wide text-[#2C2C2C]">通讯录</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/create-character')} className="text-[#5A5A5A] hover:text-[#2C2C2C] active:scale-95 transition-transform">
                <svg className="w-5 h-5 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-20">
        {/* 特殊联系人 */}
        {specialContacts.map((contact, index) => (
          <div
            key={contact.id}
            onClick={() => contact.path && navigate(contact.path)}
            className="flex items-center px-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 shadow-sm mb-2 rounded-xl cursor-pointer hover:bg-white/70 active:scale-[0.98] transition-all card-enter"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/40 flex items-center justify-center shadow-sm border border-white/40 text-[#5A5A5A]">
              {contact.icon}
            </div>
            <span className="ml-4 text-[#2C2C2C] font-medium tracking-wide">{contact.name}</span>
          </div>
        ))}

        {/* 联系人标题 */}
        {characters.length > 0 && (
          <div className="px-2 py-2 mt-4 mb-1">
            <h3 className="text-xs text-[#8C8C8C] font-medium tracking-widest">我的好友</h3>
          </div>
        )}

        {/* 联系人列表或空状态 */}
        {characters.length === 0 && isInitialLoaded ? (
          <div className="flex flex-col items-center justify-center mt-20 text-[#8C8C8C]">
            <svg className="w-16 h-16 mb-4 stroke-[1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm tracking-widest mb-2">暂无联系人</p>
            <p className="text-xs font-light">添加AI角色开始聊天</p>
          </div>
        ) : characters.length > 0 ? (
          <div className="space-y-2">
            {characters.map((character, index) => (
              <div
                key={character.id}
                onClick={() => navigate(`/character/${character.id}`)}
                className="flex items-center px-4 py-3 bg-white/40 backdrop-blur-md border border-white/30 shadow-sm rounded-xl cursor-pointer hover:bg-white/50 active:scale-[0.98] transition-all card-enter"
                style={{ animationDelay: `${(specialContacts.length + index) * 0.05}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center shadow-sm overflow-hidden border border-white/30">
                  {character.avatar ? (
                    <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-[#8C8C8C]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className="text-[#2C2C2C] font-medium text-sm tracking-wide truncate">{character.nickname || character.realName}</h3>
                  {character.signature && (
                    <p className="text-xs text-[#8C8C8C] truncate mt-0.5 font-light">{character.signature}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Contacts
