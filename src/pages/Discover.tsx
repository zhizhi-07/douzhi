import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'

const Discover = () => {
  const navigate = useNavigate()
  const [wechatBg, setWechatBg] = useState(() => localStorage.getItem('wechat_background') || '')
  
  // 监听背景更新
  useEffect(() => {
    const handleBgUpdate = () => setWechatBg(localStorage.getItem('wechat_background') || '')
    window.addEventListener('wechatBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('wechatBackgroundUpdate', handleBgUpdate)
  }, [])

  const menuGroups = [
    {
      id: 1,
      items: [
        { 
          id: 11, 
          name: '朋友圈', 
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>, 
          path: '/moments' 
        },
        { 
          id: 12, 
          name: '情侣空间', 
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>, 
          path: '/couple-space' 
        },
      ],
    },
    {
      id: 2,
      items: [
        { 
          id: 21, 
          name: '直播', 
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>, 
          path: '/live' 
        },
        { 
          id: 22, 
          name: '摇一摇', 
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 24h2v-2H7v2zm4 0h2v-2h-2v2zm2-22h-2v10h2V2zm3.56 2.44l-1.45 1.45C16.84 6.94 18 8.83 18 11c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-2.17 1.16-4.06 2.88-5.12L7.44 4.44C5.36 5.88 4 8.28 4 11c0 4.42 3.58 8 8 8s8-3.58 8-8c0-2.72-1.36-5.12-3.44-6.56zM15 24h2v-2h-2v2z"/></svg>, 
          path: '/shake-shake' 
        },
      ],
    },
    {
      id: 3,
      items: [
        { 
          id: 31, 
          name: '表情包', 
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>, 
          path: '/emoji-management' 
        },
        { 
          id: 32, 
          name: '搜一搜', 
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>, 
          path: '' 
        },
      ],
    },
    {
      id: 4,
      items: [
        { 
          id: 41, 
          name: '记账本', 
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>, 
          path: '/accounting' 
        },
        { 
          id: 42, 
          name: '小程序', 
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>, 
          path: '/mini-programs' 
        },
      ],
    },
    {
      id: 5,
      items: [
        { 
          id: 51, 
          name: '小游戏', 
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>, 
          path: '/game-list' 
        },
      ],
    },
  ]

  return (
    <div 
      className="h-screen flex flex-col bg-[#f5f7fa] bg-cover bg-center"
      style={wechatBg ? { backgroundImage: `url(${wechatBg})` } : {}}
    >
        {/* 顶部：StatusBar + 导航栏一体化 */}
        <div className="glass-effect">
          <StatusBar />
          <div className="px-5 py-3">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => navigate('/')} className="text-gray-700 active:scale-95 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">发现</h1>
              <div className="w-5"></div>
            </div>
          </div>
        </div>
        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-3 pt-3">
          {menuGroups.map((group) => (
            <div key={group.id} className="mb-3">
              <div className="glass-card rounded-[48px] overflow-hidden">
                {group.items.map((item, index) => (
                  <div key={item.id}>
                    <div 
                      onClick={() => item.path && navigate(item.path)}
                      className="flex items-center px-4 py-4 cursor-pointer active:opacity-70 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shadow-lg text-gray-600">
                        {item.icon}
                      </div>
                      <span className="ml-4 flex-1 text-gray-900 font-medium">
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
              <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              <span className="text-xs">微信</span>
            </button>
            <button onClick={() => navigate('/contacts')} className="flex flex-col items-center justify-center text-gray-500 active:scale-95 transition-transform">
              <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/>
              </svg>
              <span className="text-xs">通讯录</span>
            </button>
            <button className="flex flex-col items-center justify-center text-green-600 active:scale-95 transition-transform">
              <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="text-xs font-medium">发现</span>
            </button>
            <button onClick={() => navigate('/me')} className="flex flex-col items-center justify-center text-gray-500 active:scale-95 transition-transform">
              <svg className="w-6 h-6 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span className="text-xs">我</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Discover
