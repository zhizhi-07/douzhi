import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { characterService, Character } from '../services/characterService'
import { getAllUIIcons } from '../utils/iconStorage'
import { getImage } from '../utils/unifiedStorage'

const Contacts = () => {
  const navigate = useNavigate()
  const [wechatBg, setWechatBg] = useState(() => {
    const preloaded = sessionStorage.getItem('__preloaded_backgrounds__')
    if (preloaded) {
      try {
        const backgrounds = JSON.parse(preloaded)
        return backgrounds.wechat_bg || ''
      } catch { return '' }
    }
    return ''
  })
  const [characters, setCharacters] = useState<Character[]>([])
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})

  // 加载微信背景
  useEffect(() => {
    const loadWechatBg = async () => {
      if (wechatBg) return
      const bg = await getImage('wechat_bg')
      if (bg) setWechatBg(bg)
    }
    loadWechatBg()
    
    const handleBgUpdate = async () => {
      console.log('📡 Contacts: 收到背景更新事件')
      const bg = await getImage('wechat_bg')
      setWechatBg(bg || '')
    }
    window.addEventListener('wechatBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('wechatBackgroundUpdate', handleBgUpdate)
  }, [])

  // 从 localStorage加载角色列表
  useEffect(() => {
    const loadCharacters = () => {
      const data = characterService.getAll()
      setCharacters(data)
    }
    
    loadCharacters()
  }, [])

  // 加载自定义图标配置
  useEffect(() => {
    const loadCustomIcons = async () => {
      try {
        // 🔥 优先从 sessionStorage 读取预加载的图标（同步，无延迟）
        const preloaded = sessionStorage.getItem('__preloaded_icons__')
        if (preloaded) {
          const icons = JSON.parse(preloaded)
          setCustomIcons(icons)
          console.log('⚡ 从缓存加载图标', Object.keys(icons).length, '个')
          return
        }
        
        let icons = await getAllUIIcons()
        if (Object.keys(icons).length === 0) {
          const saved = localStorage.getItem('ui_custom_icons')
          if (saved) {
            icons = JSON.parse(saved)
          }
        }
        setCustomIcons(icons)
      } catch (error) {
        console.error('加载自定义图标失败:', error)
      }
    }
    
    loadCustomIcons()
    
    const handleIconsChange = () => {
      loadCustomIcons()
    }
    window.addEventListener('uiIconsChanged', handleIconsChange)
    
    return () => {
      window.removeEventListener('uiIconsChanged', handleIconsChange)
    }
  }, [])

  const specialContacts = [
    { 
      id: 1, 
      name: '创建角色', 
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ), 
      path: '/create-character' 
    },
    { 
      id: 2, 
      name: '群聊', 
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ), 
      path: '/group-list' 
    }
  ]

  return (
    <div
      className="h-screen flex flex-col bg-cover bg-center page-fade-in"
      style={wechatBg ? { 
        backgroundImage: `url(${wechatBg})`,
        backgroundColor: '#f5f7fa'
      } : { 
        backgroundColor: '#f5f7fa' 
      }}>
      {/* 顶部 */}
      <div 
        className="relative"
        style={customIcons['main-topbar-bg'] ? {
          backgroundImage: `url(${customIcons['main-topbar-bg']})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : { 
          background: 'rgba(255, 255, 255, 0.7)', 
          backdropFilter: 'blur(20px) saturate(180%)', 
          WebkitBackdropFilter: 'blur(20px) saturate(180%)' 
        }}
      >
        <StatusBar />
        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate('/')} className="text-gray-700 active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">通讯录</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/create-character')} className="text-gray-700 active:scale-95 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-3 pt-3">
        {/* 特殊联系人 */}
        {specialContacts.map((contact, index) => (
          <div
            key={contact.id}
            onClick={() => contact.path && navigate(contact.path)}
            className="flex items-center px-4 py-3 glass-card mb-2 rounded-[48px] cursor-pointer active:scale-[0.98] transition-transform card-enter"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md border border-gray-200/50 text-gray-600">
              {contact.icon}
            </div>
            <span className="ml-4 text-gray-900 font-medium">{contact.name}</span>
          </div>
        ))}

        {/* 联系人标题 */}
        {characters.length > 0 && (
          <div className="px-4 py-2 mt-2">
            <h3 className="text-xs text-gray-400 font-medium">联系人</h3>
          </div>
        )}

        {/* 联系人列表或空状态 */}
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-base">暂无联系人</p>
            <p className="text-sm mt-2">点击"创建角色"添加AI角色</p>
          </div>
        ) : (
          <div>
            {characters.map((character, index) => (
              <div
                key={character.id}
                onClick={() => navigate(`/character/${character.id}`)}
                className="flex items-center px-4 py-3 glass-card mb-2 rounded-[48px] cursor-pointer active:scale-[0.98] transition-transform card-enter"
                style={{ animationDelay: `${(specialContacts.length + index) * 0.05}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
                  {character.avatar ? (
                    <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-gray-900 font-medium text-sm">{character.nickname || character.realName}</h3>
                  {character.signature && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{character.signature}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部导航栏 */}
      <div className="pb-3 px-4">
        <div 
          className="glass-card rounded-[48px] shadow-lg"
          style={customIcons['main-bottombar-bg'] ? {
            backgroundImage: `url(${customIcons['main-bottombar-bg']})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          <div className="grid grid-cols-4 h-14 px-2">
            <button onClick={() => navigate('/wechat')} className="flex flex-col items-center justify-center text-gray-500 active:scale-95 transition-transform">
              {customIcons['nav-chat'] ? (
                <img src={customIcons['nav-chat']} alt="微信" className="w-6 h-6 mb-0.5 object-cover animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              )}
              <span className="text-xs">微信</span>
            </button>
            <button className="flex flex-col items-center justify-center text-green-600 active:scale-95 transition-transform">
              {customIcons['nav-contacts'] ? (
                <img src={customIcons['nav-contacts']} alt="通讯录" className="w-6 h-6 mb-0.5 object-cover animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/>
                </svg>
              )}
              <span className="text-xs font-medium">通讯录</span>
            </button>
            <button onClick={() => navigate('/discover')} className="flex flex-col items-center justify-center text-gray-500 active:scale-95 transition-transform">
              {customIcons['nav-discover'] ? (
                <img src={customIcons['nav-discover']} alt="发现" className="w-6 h-6 mb-0.5 object-cover animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              )}
              <span className="text-xs">发现</span>
            </button>
            <button onClick={() => navigate('/me')} className="flex flex-col items-center justify-center text-gray-500 active:scale-95 transition-transform">
              {customIcons['nav-me'] ? (
                <img src={customIcons['nav-me']} alt="我" className="w-6 h-6 mb-0.5 object-cover animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
              <span className="text-xs">我</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contacts
