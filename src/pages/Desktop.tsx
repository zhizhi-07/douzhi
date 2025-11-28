import { useNavigate } from 'react-router-dom'
import React, { useState, useRef, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import MusicPlayerCard from '../components/MusicPlayerCard'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import { page1Apps, dockApps } from '../config/apps'
import { AppItem } from '../components/AppGrid'
import { getCustomIcon, preloadDesktopIcons } from '../utils/iconManager'
import { playSystemSound } from '../utils/soundManager'
import { getImage, getFromIndexedDB } from '../utils/unifiedStorage'
import { CalendarIcon, ImageIcon, GameIcon, ContactIcon } from '../components/Icons'
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
  
  // 桌面背景 - 在初始化时同步读取缓存
  const [desktopBg, setDesktopBg] = useState<string | null>(() => {
    const preloaded = sessionStorage.getItem('__preloaded_backgrounds__')
    if (preloaded) {
      try {
        const backgrounds = JSON.parse(preloaded)
        if (backgrounds.desktop_bg) {
          console.log('⚡ 桌面: 初始化时从缓存加载背景 (同步)')
          return backgrounds.desktop_bg
        }
      } catch (err) {
        console.error('解析缓存失败:', err)
      }
    }
    return null
  })
  
  // 加载桌面背景
  useEffect(() => {
    const loadDesktopBg = async () => {
      // 如果已经有缓存，跳过
      if (desktopBg) return
      
      // 从 IndexedDB 加载
      const bg = await getImage('desktop_bg')
      if (bg) setDesktopBg(bg)
    }
    loadDesktopBg()
    
    // 监听背景更新事件
    const handleBgUpdate = async () => {
      const bg = await getImage('desktop_bg')
      setDesktopBg(bg || null)
      // 更新缓存
      const preloaded = sessionStorage.getItem('__preloaded_backgrounds__')
      if (preloaded) {
        const backgrounds = JSON.parse(preloaded)
        backgrounds.desktop_bg = bg || ''
        sessionStorage.setItem('__preloaded_backgrounds__', JSON.stringify(backgrounds))
      }
    }
    window.addEventListener('desktopBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('desktopBackgroundUpdate', handleBgUpdate)
  }, [])
  
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
  const memoLongPressTimer = useRef<number | null>(null)

  // 第二页状态
  const [bubble1Text, setBubble1Text] = useState(() => {
    return localStorage.getItem('desktop_bubble1') || ''
  })
  const [bubble2Text, setBubble2Text] = useState(() => {
    return localStorage.getItem('desktop_bubble2') || ''
  })
  const [isEditingBubble1, setIsEditingBubble1] = useState(false)
  const [isEditingBubble2, setIsEditingBubble2] = useState(false)
  const bubble1Ref = useRef<HTMLTextAreaElement>(null)
  const bubble2Ref = useRef<HTMLTextAreaElement>(null)
  const [avatarImage, setAvatarImage] = useState(() => {
    return localStorage.getItem('desktop_page2_avatar') || ''
  })
  const [labelText, setLabelText] = useState(() => {
    return localStorage.getItem('desktop_label_text') || '𓋫 ˚ ⑅₊⁺₊☆✞𓋫⁺𓏴𓏴𓏴✞𓏴𓏵𓏴☆₊⁺♬ᐝ๑𓋫 ˚ ⑅₊⁺₊☆✞𓋫⁺𓏴𓏴𓏴✞𓏴𓏵𓏴'
  })
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const labelRef = useRef<HTMLInputElement>(null)
  const [gridPhoto, setGridPhoto] = useState('')
  
  // 从IndexedDB加载网格照片
  useEffect(() => {
    const loadGridPhoto = async () => {
      try {
        const { getImage } = await import('../utils/unifiedStorage')
        const photo = await getImage('desktop_grid_photo')
        if (photo) {
          setGridPhoto(photo)
          console.log('✅ 网格照片已从IndexedDB加载')
        }
      } catch (error) {
        console.error('❌ 加载网格照片失败:', error)
      }
    }
    loadGridPhoto()
  }, [])
  const [bubble1BgImage, setBubble1BgImage] = useState('')
  const [bubble2BgImage, setBubble2BgImage] = useState('')
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  const [timeScale, setTimeScale] = useState(100)
  const [timeX, setTimeX] = useState(0)
  const [timeY, setTimeY] = useState(0)

  // 加载UI图标（时间背景等）
  useEffect(() => {
    const loadUIIcons = async () => {
      try {
        const { getAllUIIcons } = await import('../utils/iconStorage')
        const icons = await getAllUIIcons()
        setCustomIcons(icons)
        console.log('✅ Desktop加载UI图标:', Object.keys(icons).length, '个')
      } catch (error) {
        console.error('❌ 加载UI图标失败:', error)
      }
    }
    loadUIIcons()
    
    // 加载缩放和位置参数
    const loadParams = () => {
      const scale = localStorage.getItem('desktop-time-bg-scale')
      const x = localStorage.getItem('desktop-time-bg-x')
      const y = localStorage.getItem('desktop-time-bg-y')
      if (scale) setTimeScale(parseInt(scale))
      if (x) setTimeX(parseInt(x))
      if (y) setTimeY(parseInt(y))
      console.log('📐 加载时间调整参数:', { scale, x, y })
    }
    loadParams()
    
    // 监听图标更新
    const handleIconsChange = () => {
      loadUIIcons()
    }
    const handleAdjust = () => {
      console.log('🔄 收到调整事件，重新加载参数')
      loadParams()
    }
    window.addEventListener('uiIconsChanged', handleIconsChange)
    window.addEventListener('iconAdjust', handleAdjust)
    return () => {
      window.removeEventListener('uiIconsChanged', handleIconsChange)
      window.removeEventListener('iconAdjust', handleAdjust)
    }
  }, [])

  // 加载气泡背景
  useEffect(() => {
    const loadBubbleBackgrounds = async () => {
      const bg1 = await getImage('desktop_bubble1_bg')
      const bg2 = await getImage('desktop_bubble2_bg')
      if (bg1) setBubble1BgImage(bg1)
      if (bg2) setBubble2BgImage(bg2)
    }
    loadBubbleBackgrounds()
    
    const handleBubbleBgUpdate = async () => {
      const bg1 = await getImage('desktop_bubble1_bg')
      const bg2 = await getImage('desktop_bubble2_bg')
      setBubble1BgImage(bg1 || '')
      setBubble2BgImage(bg2 || '')
    }
    window.addEventListener('bubbleBackgroundUpdate', handleBubbleBgUpdate)
    return () => window.removeEventListener('bubbleBackgroundUpdate', handleBubbleBgUpdate)
  }, [])
  
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
      const bg = await getFromIndexedDB('IMAGES', 'memo_bg')
      console.log('📝 Desktop加载备忘录背景:', bg ? '有数据' : '无数据', typeof bg)
      if (bg) {
        if (typeof bg === 'string') {
          setMemoBg(bg)
        } else if (bg instanceof Blob) {
          // 兼容旧的Blob数据
          setMemoBg(URL.createObjectURL(bg))
        }
      }
    }
    loadMemoBg()
    
    const handleBgUpdate = async () => {
      const bg = await getFromIndexedDB('IMAGES', 'memo_bg')
      if (bg) {
        if (typeof bg === 'string') {
          setMemoBg(bg)
        } else if (bg instanceof Blob) {
          setMemoBg(URL.createObjectURL(bg))
        }
      } else {
        setMemoBg('')
      }
    }
    window.addEventListener('memoBackgroundUpdate', handleBgUpdate)
    return () => window.removeEventListener('memoBackgroundUpdate', handleBgUpdate)
  }, [])
  
  // 预加载桌面图标
  useEffect(() => {
    preloadDesktopIcons()
  }, [])
  
  // 监听图标变化
  useEffect(() => {
    const handleIconChange = () => {
      setIconRefresh(prev => prev + 1)
      // 重新预加载图标
      preloadDesktopIcons()
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
    const diffX = touchStartX.current - touchEndX.current
    const diffY = Math.abs(touchEndY.current - touchStartY.current)
    const minSwipeDistance = 50

    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffX) > diffY) {
      if (diffX > 0 && currentPage < 1) {
        setCurrentPage(1)
      } else if (diffX < 0 && currentPage > 0) {
        setCurrentPage(0)
      }
    }
  }

  return (
    <div className="h-screen w-full relative overflow-hidden page-fade-in" style={{ touchAction: 'pan-y pinch-zoom' }}>
      {/* 背景 - 只在有单独桌面背景时显示 */}
      {desktopBg && (
        <div 
          className="desktop-background absolute inset-0 bg-cover bg-center transition-opacity duration-300"
          style={{ 
            backgroundImage: `url(${desktopBg})`,
            opacity: 1
          }}
        />
      )}
      
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
                <div 
                  className="text-center p-6 rounded-3xl relative"
                  style={customIcons['desktop-time-bg'] ? {
                    backgroundImage: `url(${customIcons['desktop-time-bg']})`,
                    backgroundSize: `${timeScale}%`,
                    backgroundPosition: `calc(50% + ${timeX}px) calc(50% + ${timeY}px)`,
                    backgroundRepeat: 'no-repeat'
                  } : {}}
                >
                  <div className="text-8xl font-bold text-gray-900 mb-1 relative z-10">
                    {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-base font-medium text-gray-600 relative z-10">
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
                  const hasCustomIcon = getCustomIcon(app.id)
                  
                  return (
                    <div
                      key={app.id}
                      className="flex flex-col items-center gap-2"
                    >
                      {hasCustomIcon ? (
                        <div 
                          className="w-16 h-16 rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                          style={{
                            backgroundColor: 'transparent'
                          }}
                          onClick={(e) => handleAppClick(e, app)}
                        >
                          <img src={getCustomIcon(app.id)!} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : isImageIcon ? (
                        <div 
                          className="w-16 h-16 rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                          style={{
                            backgroundColor: 'transparent'
                          }}
                          onClick={(e) => handleAppClick(e, app)}
                        >
                          <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div 
                          className={`w-16 h-16 ${app.color} rounded-2xl flex items-center justify-center border border-white/30 cursor-pointer hover:scale-105 transition-transform`}
                          onClick={(e) => handleAppClick(e, app)}
                        >
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
                  className="w-full h-full rounded-2xl overflow-hidden flex flex-col relative"
                  style={{
                    // 有背景图时，主要通过下面的 <img> 显示，这里只保留透明底
                    backgroundColor: memoBg ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: memoBg ? 'none' : 'blur(20px)',
                    WebkitBackdropFilter: memoBg ? 'none' : 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseDown={() => {
                    memoLongPressTimer.current = setTimeout(() => {
                      const newValue = !showMemoHeader
                      setShowMemoHeader(newValue)
                      localStorage.setItem('show_memo_header', String(newValue))
                    }, 500)
                  }}
                  onMouseUp={() => {
                    if (memoLongPressTimer.current) {
                      clearTimeout(memoLongPressTimer.current)
                    }
                  }}
                  onMouseLeave={() => {
                    if (memoLongPressTimer.current) {
                      clearTimeout(memoLongPressTimer.current)
                    }
                  }}
                  onTouchStart={() => {
                    memoLongPressTimer.current = setTimeout(() => {
                      const newValue = !showMemoHeader
                      setShowMemoHeader(newValue)
                      localStorage.setItem('show_memo_header', String(newValue))
                    }, 500)
                  }}
                  onTouchEnd={() => {
                    if (memoLongPressTimer.current) {
                      clearTimeout(memoLongPressTimer.current)
                    }
                  }}
                >
                  {/* 背景图层：只要有memoBg就一定能看到 */}
                  {memoBg && (
                    <img
                      src={memoBg}
                      alt="memo background"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}

                  {/* 顶部标题栏 - 可通过长按切换显示 */}
                  {showMemoHeader && (
                    <div 
                      className="flex items-center justify-between px-3 py-2 border-b cursor-pointer transition-colors"
                      style={{
                        // 有背景图时完全透明，不再叠加白底；无背景时保留浅灰分割线
                        backgroundColor: memoBg ? 'transparent' : 'rgba(255, 255, 255, 0.85)',
                        borderColor: memoBg ? 'transparent' : '#E5E7EB'
                      }}
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
                    style={{
                      // 有背景图时不再加任何底色，直接在图片上写字
                      backgroundColor: memoBg ? 'transparent' : 'rgba(255, 255, 255, 0.85)'
                    }}
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
                        className="w-full h-full text-xs text-gray-700 leading-relaxed resize-none bg-transparent outline-none"
                        placeholder="今天要做的事情..."
                      />
                    ) : (
                      <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
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

            {/* ========== 第二页 ========== */}
            <div className="min-w-full h-full relative overflow-hidden pb-20">
              {/* 红色圆形头像 - 左上 */}
              <div 
                className="absolute cursor-pointer"
                style={{ top: '2%', left: '17%' }}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e: Event) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const result = e.target?.result as string
                        setAvatarImage(result)
                        localStorage.setItem('desktop_page2_avatar', result)
                      }
                      reader.readAsDataURL(file)
                    }
                  }
                  input.click()
                }}
              >
                <div 
                  className="w-18 h-18 rounded-full overflow-hidden flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: avatarImage ? 'transparent' : '#FFFFFF',
                    backgroundImage: avatarImage ? `url(${avatarImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    width: '72px',
                    height: '72px'
                  }}
                >
                  {!avatarImage && (
                    <ContactIcon size={36} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* 气泡1 - 右上，与头像同行 */}
              <div 
                className="absolute rounded-full px-4 py-2 cursor-text overflow-hidden"
                style={{
                  top: '8%',
                  left: '42%',
                  backgroundColor: bubble1BgImage ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
                  backgroundImage: bubble1BgImage ? `url(${bubble1BgImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '38px',
                  width: '170px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
                onClick={() => {
                  setIsEditingBubble1(true)
                  setTimeout(() => bubble1Ref.current?.focus(), 0)
                }}
              >
                {isEditingBubble1 ? (
                  <textarea
                    ref={bubble1Ref}
                    value={bubble1Text}
                    onChange={(e) => setBubble1Text(e.target.value)}
                    onBlur={() => {
                      setIsEditingBubble1(false)
                      localStorage.setItem('desktop_bubble1', bubble1Text)
                    }}
                    className="w-full h-full bg-transparent text-gray-900 text-xs leading-relaxed resize-none outline-none placeholder-gray-500"
                    placeholder="写点什么..."
                    rows={1}
                    style={{ overflow: 'hidden' }}
                  />
                ) : (
                  <div className="text-gray-900 text-xs leading-relaxed whitespace-pre-wrap overflow-hidden">
                    {bubble1Text || '写点什么...'}
                  </div>
                )}
              </div>

              {/* 气泡2 - 错位到下方 */}
              <div 
                className="absolute rounded-full px-4 py-2 cursor-text overflow-hidden"
                style={{
                  top: '16%',
                  left: '24%',
                  backgroundColor: bubble2BgImage ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
                  backgroundImage: bubble2BgImage ? `url(${bubble2BgImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '38px',
                  width: '180px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
                onClick={() => {
                  setIsEditingBubble2(true)
                  setTimeout(() => bubble2Ref.current?.focus(), 0)
                }}
              >
                {isEditingBubble2 ? (
                  <textarea
                    ref={bubble2Ref}
                    value={bubble2Text}
                    onChange={(e) => setBubble2Text(e.target.value)}
                    onBlur={() => {
                      setIsEditingBubble2(false)
                      localStorage.setItem('desktop_bubble2', bubble2Text)
                    }}
                    className="w-full h-full bg-transparent text-gray-900 text-xs leading-relaxed resize-none outline-none placeholder-gray-500"
                    placeholder="写点什么..."
                    rows={1}
                    style={{ overflow: 'hidden' }}
                  />
                ) : (
                  <div className="text-gray-900 text-xs leading-relaxed whitespace-pre-wrap overflow-hidden">
                    {bubble2Text || '写点什么...'}
                  </div>
                )}
              </div>

              {/* 纯文字标注 - 靠左上方 */}
              <div 
                className="absolute cursor-text"
                style={{ top: '25%', left: '10%' }}
                onClick={() => {
                  setIsEditingLabel(true)
                  setTimeout(() => labelRef.current?.focus(), 0)
                }}
              >
                {isEditingLabel ? (
                  <input
                    ref={labelRef}
                    type="text"
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    onBlur={() => {
                      setIsEditingLabel(false)
                      localStorage.setItem('desktop_label_text', labelText)
                    }}
                    className="text-xs text-gray-700 bg-transparent outline-none border-b border-gray-300"
                    style={{ width: '200px' }}
                  />
                ) : (
                  <div className="text-xs text-gray-700">
                    {labelText}
                  </div>
                )}
              </div>

              {/* 底部区域：4个应用图标 + 4x4照片网格 */}
              <div className="absolute bottom-[30%] left-[6%] right-[6%] flex items-start justify-between gap-4">
                {/* 左侧：2x2 应用图标 */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'desktop-calendar', Icon: CalendarIcon, label: '日历', route: '/calendar' },
                    { id: 'desktop-theater', Icon: ImageIcon, label: '小剧场', route: '/theatre' },
                    { id: 'homeland', Icon: CalendarIcon, label: '行程', route: '/ai-schedule' },
                    { id: 'desktop-game', Icon: GameIcon, label: '游戏', route: '/game-list' },
                    // { id: 'world-map', Icon: MapIcon, label: '世界地图', route: '/map' }  // 已隐藏
                  ].map((app, index) => {
                    const customIcon = getCustomIcon(app.id)
                    return (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <div 
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform ${customIcon ? '' : 'glass-card border border-white/30'}`}
                          onClick={() => app.route && navigate(app.route)}
                        >
                          {customIcon ? (
                            <img src={customIcon} alt={app.label} className="w-full h-full object-contain rounded-2xl" />
                          ) : (
                            <app.Icon className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        <span className="text-xs text-gray-700 text-center font-medium">
                          {app.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* 右侧：4x4照片网格 */}
                <div 
                  className="cursor-pointer"
                  style={{
                    width: '140px',
                    height: '140px',
                    border: gridPhoto ? 'none' : '2px dashed #ccc',
                    backgroundColor: gridPhoto ? 'transparent' : 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '16px',
                    padding: gridPhoto ? '0' : '4px',
                    marginTop: '16px',
                    overflow: 'hidden'
                  }}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e: Event) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = async (e) => {
                          const result = e.target?.result as string
                          setGridPhoto(result)
                          // 🔥 改用IndexedDB存储，避免localStorage超出配额
                          try {
                            const { saveImage } = await import('../utils/unifiedStorage')
                            await saveImage('desktop_grid_photo', result)
                            console.log('✅ 网格照片已保存到IndexedDB')
                          } catch (error) {
                            console.error('❌ 保存网格照片失败:', error)
                          }
                        }
                        reader.readAsDataURL(file)
                      }
                    }
                    input.click()
                  }}
                >
                  {gridPhoto ? (
                    <div className="w-full h-full relative rounded-2xl">
                      <img src={gridPhoto} alt="" className="absolute inset-0 w-full h-full object-contain rounded-2xl" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 页面指示器 */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {[0, 1].map((page) => (
            <div
              key={page}
              className="w-2 h-2 rounded-full transition-all duration-300 cursor-pointer active:scale-125"
              style={{
                backgroundColor: currentPage === page ? '#666' : '#CCC'
              }}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentPage(page)
                playSystemSound()
              }}
            />
          ))}
        </div>

        {/* Dock 栏 */}
        <div className="pb-6 px-4 safe-area-bottom">
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
