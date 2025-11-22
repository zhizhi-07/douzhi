import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StatusBar from '../components/StatusBar'
import { UserInfo, getUserInfo } from '../utils/userUtils'
import { getImage } from '../utils/unifiedStorage'
import { getAllUIIcons } from '../utils/iconStorage'

const Me = () => {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState<UserInfo>(getUserInfo())
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
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})

  // 监听storage变化，实时更新用户信息
  useEffect(() => {
    const handleStorageChange = () => {
      setUserInfo(getUserInfo())
    }
    window.addEventListener('storage', handleStorageChange)
    
    // 页面获得焦点时也更新
    const handleFocus = () => {
      setUserInfo(getUserInfo())
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
  
  // 加载微信背景
  useEffect(() => {
    const loadWechatBg = async () => {
      if (wechatBg) return
      const bg = await getImage('wechat_bg')
      if (bg) setWechatBg(bg)
    }
    loadWechatBg()
    
    const handleBgUpdate = async () => {
      console.log('📡 Me: 收到背景更新事件')
      const bg = await getImage('wechat_bg')
      setWechatBg(bg || '')
    }
    window.addEventListener('wechatBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('wechatBackgroundUpdate', handleBgUpdate)
  }, [])
  
  // 加载自定义图标
  useEffect(() => {
    const loadIcons = async () => {
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
        setCustomIcons(icons)
      } catch (error) {
        console.error('🚨 加载图标失败：', error)
      }
    }
    loadIcons()
    
    const handleIconChange = async () => {
      const icons = await getAllUIIcons()
      setCustomIcons(icons)
    }
    window.addEventListener('iconChanged', handleIconChange)
    return () => window.removeEventListener('iconChanged', handleIconChange)
  }, [])

  const menuGroups = [
    {
      id: 1,
      items: [{ 
        id: 11, 
        name: '零钱', 
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>, 
        path: '/wallet',
        enabled: true
      }],
    },
    {
      id: 2,
      items: [{ 
        id: 21, 
        name: '收藏', 
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>, 
        path: '',
        enabled: false
      }],
    },
    {
      id: 3,
      items: [{ 
        id: 31, 
        name: '设置', 
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>, 
        path: '/customize',
        enabled: true
      }],
    },
  ]

  return (
    <div
      className="h-screen flex flex-col page-fade-in"
      style={wechatBg ? { 
        backgroundImage: `url(${wechatBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
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
            <h1 className="text-lg font-semibold text-gray-900">我</h1>
            <div className="w-5"></div>
          </div>
        </div>
      </div>

      {/* 个人信息卡片 */}
      <div className="px-3 pt-3 mb-3">
        <div className="glass-card rounded-[48px] overflow-hidden">
          <div 
            onClick={() => navigate('/user-profile')}
            className="flex items-center px-5 py-5 cursor-pointer active:opacity-70 transition-opacity"
          >
            {/* 头像 */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shadow-xl overflow-hidden">
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
            
            {/* 用户信息 */}
            <div className="ml-4 flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 mb-0.5 truncate">
                {userInfo.nickname || userInfo.realName}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {userInfo.signature || '这个人很懒，什么都没留下'}
              </p>
            </div>
            
            <span className="text-gray-400 text-2xl ml-2">›</span>
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="flex-1 overflow-y-auto px-3">
        {menuGroups.map((group, groupIndex) => (
          <div
            key={group.id}
            className="mb-3 card-enter"
            style={{ animationDelay: `${groupIndex * 0.1}s` }}
          >
            <div className="glass-card rounded-[48px] overflow-hidden">
              {group.items.map((item, index) => (
                <div key={item.id}>
                  <div 
                    onClick={() => item.enabled && item.path && navigate(item.path)}
                    className={`flex items-center px-4 py-4 transition-opacity ${
                      item.enabled 
                        ? 'cursor-pointer active:opacity-70' 
                        : 'cursor-not-allowed opacity-40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl glass-card flex items-center justify-center shadow-lg ${
                      item.enabled ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {item.icon}
                    </div>
                    <span className={`ml-4 flex-1 font-medium ${
                      item.enabled ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {item.name}
                    </span>
                    <span className="text-gray-400 text-xl">›</span>
                  </div>
                  {index < group.items.length - 1 && (
                    <div className="ml-16 border-b border-gray-100" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 底部导航栏 */}
      <div className="pb-3 px-4">
        <div className="glass-card rounded-[48px] shadow-lg">
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
            <button onClick={() => navigate('/contacts')} className="flex flex-col items-center justify-center text-gray-500 active:scale-95 transition-transform">
              {customIcons['nav-contacts'] ? (
                <img src={customIcons['nav-contacts']} alt="通讯录" className="w-6 h-6 mb-0.5 object-cover animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/>
                </svg>
              )}
              <span className="text-xs">通讯录</span>
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
            <button className="flex flex-col items-center justify-center text-green-600 active:scale-95 transition-transform">
              {customIcons['nav-me'] ? (
                <img src={customIcons['nav-me']} alt="我" className="w-6 h-6 mb-0.5 object-cover animate-fade-in" />
              ) : (
                <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
              <span className="text-xs font-medium">我</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Me
