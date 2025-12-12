import { useNavigate, useOutletContext } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

const Discover = () => {
  const navigate = useNavigate()
  const { customIcons } = useOutletContext<{ customIcons: Record<string, string> }>()

  const menuGroups = [
    {
      id: 1,
      items: [
        {
          id: 11,
          name: '朋友圈',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>,
          path: '/moments',
          enabled: true
        },
        {
          id: 12,
          name: '情侣空间',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>,
          path: '/couple-space',
          enabled: true
        },
      ],
    },
    {
      id: 2,
      items: [
        {
          id: 21,
          name: '直播',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></svg>,
          path: '/live',
          enabled: true
        },
        {
          id: 22,
          name: '梗库',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" /></svg>,
          path: '/meme-library',
          enabled: true
        },
      ],
    },
    {
      id: 3,
      items: [
        {
          id: 31,
          name: '表情',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" /></svg>,
          path: '/emoji-management',
          enabled: true
        },
        {
          id: 32,
          name: '头像库',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>,
          path: '/avatar-library',
          enabled: true
        },
      ],
    },
    {
      id: 4,
      items: [
        {
          id: 41,
          name: '记账',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg>,
          path: '/accounting',
          enabled: false
        },
        {
          id: 42,
          name: '小程序',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>,
          path: '/mini-programs',
          enabled: false
        },
      ],
    },
    {
      id: 5,
      items: [
        {
          id: 51,
          name: '游戏',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" /></svg>,
          path: '/game-list',
          enabled: true
        },
      ],
    },
  ]

  return (
    <div className="h-full flex flex-col font-serif soft-page-enter">
      {/* 顶部：StatusBar + 导航栏一体化 - 玻璃拟态 */}
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
            <h1 className="text-lg font-medium tracking-wide text-[#2C2C2C]">发现</h1>
            <div className="w-5"></div>
          </div>
        </div>
      </div>
      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-20">
        {menuGroups.map((group, groupIndex) => (
          <div
            key={group.id}
            className="mb-4 card-enter"
            style={{ animationDelay: `${groupIndex * 0.1}s` }}
          >
            <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-xl overflow-hidden shadow-sm">
              {group.items.map((item, index) => (
                <div key={item.id}>
                  <div
                    onClick={() => item.enabled && item.path && navigate(item.path)}
                    className={`flex items-center px-4 py-4 transition-all ${item.enabled
                      ? 'cursor-pointer hover:bg-white/50 active:bg-white/60'
                      : 'cursor-not-allowed opacity-50'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.enabled ? 'text-[#5A5A5A]' : 'text-[#8C8C8C]'
                      }`}>
                      {item.icon}
                    </div>
                    <span className={`ml-4 flex-1 text-sm tracking-wide ${item.enabled ? 'text-[#2C2C2C]' : 'text-[#8C8C8C]'
                      }`}>
                      {item.name}
                    </span>
                    <span className="text-[#8C8C8C] text-lg font-light">›</span>
                  </div>
                  {index < group.items.length - 1 && (
                    <div className="mx-4 border-b border-[#2C2C2C]/10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Discover
