import { useNavigate } from 'react-router-dom'
import React, { useState, useRef, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import MusicPlayerCard from '../components/MusicPlayerCard'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import { page1Apps, dockApps } from '../config/apps'
import { AppItem } from '../components/AppGrid'
import { getCustomIcon } from '../utils/iconManager'
import { playSystemSound } from '../utils/soundManager'
import { getBackground } from '../utils/backgroundStorage'
import '../css/character-card.css'

const Desktop = () => {
  const navigate = useNavigate()
  const musicPlayer = useMusicPlayer()
  const [currentPage, setCurrentPage] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 桌面背景
  const [desktopBg, setDesktopBg] = useState(() => {
    return localStorage.getItem('desktop_background') || null
  })
  
  // 强制刷新图标
  const [iconRefresh, setIconRefresh] = useState(0)
  
  // 备忘录状态
  const [memoText, setMemoText] = useState(() => {
    return localStorage.getItem('desktop_memo') || '今天要做的事情...'
  })
  const [memoBg, setMemoBg] = useState('')
  const [showMemoHeader, setShowMemoHeader] = useState(() => {
    return localStorage.getItem('show_memo_header') !== 'false'
  })
  const [isEditingMemo, setIsEditingMemo] = useState(false)
  const memoTextareaRef = useRef<HTMLTextAreaElement>(null)

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  // 加载备忘录背景
  useEffect(() => {
    const loadMemoBg = async () => {
      const bg = await getBackground('memo')
      if (bg) setMemoBg(bg)
    }
    loadMemoBg()
    
    const handleBgUpdate = async () => {
      const bg = await getBackground('memo')
      setMemoBg(bg || '')
    }
    window.addEventListener('memoBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('memoBackgroundUpdate', handleBgUpdate)
  }, [])
  
  // 监听图标变化
  useEffect(() => {
    const handleIconChange = () => {
      setIconRefresh(prev => prev + 1)
    }
    window.addEventListener('iconChanged', handleIconChange)
    return () => window.removeEventListener('iconChanged', handleIconChange)
  }, [])

  const handleAppClick = (e: React.MouseEvent, app: AppItem) => {
    e.preventDefault()
    e.stopPropagation()

    // 播放全局点击音效
    playSystemSound()

    if (app.onClick) {
      app.onClick()
    } else if (app.route) {
      navigate(app.route)
    }
  }

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }

  // 触摸结束
  const handleTouchEnd = () => {
    // 暂时禁用第二页，不响应滑动
    return
    // const diffX = touchStartX.current - touchEndX.current
    // const diffY = Math.abs(touchEndY.current - touchStartY.current)
    // const minSwipeDistance = 50

    // if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffX) > diffY) {
    //   if (diffX > 0 && currentPage < 1) {
    //     setCurrentPage(1)
    //   } else if (diffX < 0 && currentPage > 0) {
    //     setCurrentPage(0)
    //   }
    // }
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#f5f7fa]" style={{ touchAction: 'pan-y pinch-zoom' }}>
      {/* 背景 */}
      <div 
        className="desktop-background absolute inset-0 bg-gradient-to-b from-white/50 to-gray-100/30 bg-cover bg-center"
        style={desktopBg ? { backgroundImage: `url(${desktopBg})` } : {}}
      />
      
      {/* 内容容器 */}
      <div className="relative h-full flex flex-col">
        <div style={{ background: 'transparent', position: 'relative', zIndex: 1 }}>
          <StatusBar />
        </div>

        {/* 主要内容区域 - 整页滑动 */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="h-full flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {/* ========== 第一页 ========== */}
            <div className="min-w-full h-full relative overflow-hidden pb-20">
              {/* 黄色 - 时间widget (顶部横条) */}
              <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[90%] z-20">
                <div className="text-center">
                  <div className="text-8xl font-bold text-gray-900 mb-1">
                    {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-base font-medium text-gray-600">
                    {currentTime.toLocaleDateString('zh-CN', { 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </div>
                </div>
              </div>

              {/* 红色 - 音乐播放器 (左侧) */}
              <div className="absolute z-10" style={{ top: '35%', left: '6%', width: '160px', height: '160px' }}>
                <MusicPlayerCard
                  currentSong={musicPlayer.currentSong ? {
                    title: musicPlayer.currentSong.title,
                    artist: musicPlayer.currentSong.artist,
                    cover: musicPlayer.currentSong.cover
                  } : undefined}
                  isPlaying={musicPlayer.isPlaying}
                  onTogglePlay={() => musicPlayer.togglePlay()}
                  onNext={() => musicPlayer.next()}
                  onClick={() => navigate('/music-player')}
                />
              </div>

              {/* 绿色 - 应用图标 (分散布局) */}
              {/* 右上区域 - 2x2网格 */}
              <div className="absolute grid grid-cols-2 gap-4 z-10" style={{ top: '35%', right: '6%' }}>
                {page1Apps.slice(0, 4).map((app) => {
                  const isImageIcon = typeof app.icon === 'string'
                  const customIcon = getCustomIcon(app.id)
                  
                  return (
                    <div
                      key={`${app.id}-${iconRefresh}`}
                      onClick={(e) => handleAppClick(e, app)}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      {customIcon ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden">
                          <img src={customIcon} alt={app.name} className="w-full h-full object-cover" />
                        </div>
                      ) : isImageIcon ? (
                        <div className="w-16 h-16 flex items-center justify-center">
                          <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className={`w-16 h-16 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                          {React.createElement(app.icon as React.ComponentType<any>, { className: "w-8 h-8 text-gray-300" })}
                        </div>
                      )}
                      <span className="text-xs text-gray-700 text-center font-medium">
                        {app.name}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* 蓝色 - 备忘录widget (右下角) */}
              <div className="absolute z-10" style={{ bottom: '13.5%', right: '6%', width: '150px', height: '140px' }}>
                <div 
                  className="w-full h-full flex flex-col"
                  style={{
                    backgroundImage: memoBg ? `url(${memoBg})` : 'none',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: memoBg ? 'transparent' : 'rgba(255, 255, 255, 0.95)'
                  }}
                  onDoubleClick={() => {
                    const newValue = !showMemoHeader
                    setShowMemoHeader(newValue)
                    localStorage.setItem('show_memo_header', String(newValue))
                  }}
                >
                  {/* 顶部标题栏 - 可通过双击切换显示 */}
                  {showMemoHeader && (
                    <div 
                      className="flex items-center justify-between px-3 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setIsEditingMemo(true)
                        setTimeout(() => memoTextareaRef.current?.focus(), 0)
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-900">
                          {currentTime.toLocaleDateString('zh-CN', { weekday: 'long' })}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                      <span className="text-xs text-blue-500 font-medium">Edit</span>
                    </div>
                  )}
                  
                  {/* 内容区域 */}
                  <div 
                    className="flex-1 px-3 py-2 cursor-text"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isEditingMemo) {
                        setIsEditingMemo(true)
                        setTimeout(() => memoTextareaRef.current?.focus(), 0)
                      }
                    }}
                  >
                    {isEditingMemo ? (
                      <textarea
                        ref={memoTextareaRef}
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        onBlur={() => {
                          setIsEditingMemo(false)
                          localStorage.setItem('desktop_memo', memoText)
                        }}
                        className="w-full h-full text-xs text-gray-600 leading-relaxed resize-none bg-transparent outline-none"
                        placeholder="今天要做的事情..."
                      />
                    ) : (
                      <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {memoText}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 左下角 - 播放进度组件 */}
              <div className="absolute z-10 flex flex-col gap-2" style={{ bottom: '29%', left: '6%', width: '42%' }}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate" style={{ maxWidth: '60%' }}>
                    {musicPlayer.currentSong ? musicPlayer.currentSong.title : '暂无播放'}
                  </span>
                  <span className="text-gray-500">
                    {musicPlayer.currentSong 
                      ? `${Math.floor(musicPlayer.currentTime / 60)}:${String(Math.floor(musicPlayer.currentTime % 60)).padStart(2, '0')} / ${Math.floor(musicPlayer.duration / 60)}:${String(Math.floor(musicPlayer.duration % 60)).padStart(2, '0')}`
                      : '--:--'
                    }
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#E0E0E0' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: musicPlayer.duration > 0 ? `${(musicPlayer.currentTime / musicPlayer.duration) * 100}%` : '0%',
                      background: '#6B7280'
                    }}
                  />
                </div>
              </div>

              {/* 左下区域 - 图标 */}
              <div className="absolute flex gap-6 z-10" style={{ bottom: '13.5%', left: '6%' }}>
                {page1Apps.slice(4, 5).map((app) => {
                  const isImageIcon = typeof app.icon === 'string'
                  const customIcon = getCustomIcon(app.id)
                  
                  return (
                    <div
                      key={`${app.id}-${iconRefresh}`}
                      onClick={(e) => handleAppClick(e, app)}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      {customIcon ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden">
                          <img src={customIcon} alt={app.name} className="w-full h-full object-cover" />
                        </div>
                      ) : isImageIcon ? (
                        <div className="w-16 h-16 flex items-center justify-center">
                          <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className={`w-16 h-16 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                          {React.createElement(app.icon as React.ComponentType<any>, { className: "w-8 h-8 text-gray-300" })}
                        </div>
                      )}
                      <span className="text-xs text-gray-700 text-center font-medium">
                        {app.name}
                      </span>
                    </div>
                  )
                })}
                
                {/* 美化图标 */}
                <div 
                  key={`decoration-${iconRefresh}`}
                  className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => navigate('/decoration')}
                >
                  {getCustomIcon('decoration') ? (
                    <div className="w-16 h-16 flex items-center justify-center">
                      <img src={getCustomIcon('decoration')!} alt="美化" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                  )}
                  <span className="text-xs text-gray-700 text-center font-medium">
                    美化
                  </span>
                </div>
              </div>
            </div>

            {/* 第二页暂时禁用 */}
          </div>
        </div>

        {/* 页面指示器暂时禁用 */}

        {/* Dock 栏 */}
        <div className="pb-6 px-4">
          <div 
            className="rounded-3xl p-3"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}
          >
            <div className="grid grid-cols-4 gap-3">
              {dockApps.map((app) => {
                const isImageIcon = typeof app.icon === 'string'
                const customIcon = getCustomIcon(app.id)
                return (
                  <div
                    key={`${app.id}-${iconRefresh}`}
                    onClick={(e) => handleAppClick(e, app)}
                    className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                  >
                    {customIcon ? (
                      <div className="w-14 h-14 flex items-center justify-center">
                        <img src={customIcon} alt={app.name} className="w-full h-full object-contain" />
                      </div>
                    ) : isImageIcon ? (
                      <div className="w-14 h-14 flex items-center justify-center">
                        <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                        {React.createElement(app.icon as React.ComponentType<any>, { className: "w-7 h-7 text-gray-300" })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Desktop
