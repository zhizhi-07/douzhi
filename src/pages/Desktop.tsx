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
  
  // 桌面时间颜色
  const [desktopTimeColor, setDesktopTimeColor] = useState(() => {
    return localStorage.getItem('desktop_time_color') || '#FFFFFF'
  })
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
  // 备忘录显示模式: 0=全部显示, 1=隐藏文字, 2=隐藏header, 3=完全隐藏
  const [memoDisplayMode, setMemoDisplayMode] = useState(() => {
    const saved = localStorage.getItem('memo_display_mode')
    return saved ? parseInt(saved) : 0
  })
  const [isEditingMemo, setIsEditingMemo] = useState(false)
  const memoTextareaRef = useRef<HTMLTextAreaElement>(null)
  const memoLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  const [avatarImage, setAvatarImage] = useState('')
  const [labelText, setLabelText] = useState(() => {
    return localStorage.getItem('desktop_label_text') || '𓋫 ˚ ⑅₊⁺₊☆✞𓋫⁺𓏴𓏴𓏴✞𓏴𓏵𓏴☆₊⁺♬ᐝ๑𓋫 ˚ ⑅₊⁺₊☆✞𓋫⁺𓏴𓏴𓏴✞𓏴𓏵𓏴'
  })
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const labelRef = useRef<HTMLInputElement>(null)
  const [gridPhoto, setGridPhoto] = useState('')

  // 从IndexedDB加载网格照片和第二页头像
  useEffect(() => {
    const loadPage2Images = async () => {
      try {
        const { getImage } = await import('../utils/unifiedStorage')
        // 加载网格照片
        const photo = await getImage('desktop_grid_photo')
        if (photo) {
          setGridPhoto(photo)
          console.log('✅ 网格照片已从IndexedDB加载')
        }
        // 🔥 加载第二页头像（改用IndexedDB）
        const avatar = await getImage('desktop_page2_avatar')
        if (avatar) {
          setAvatarImage(avatar)
          console.log('✅ 第二页头像已从IndexedDB加载')
        }
      } catch (error) {
        console.error('❌ 加载图片失败:', error)
      }
    }
    loadPage2Images()
  }, [])
  const [bubble1BgImage, setBubble1BgImage] = useState('')
  const [bubble2BgImage, setBubble2BgImage] = useState('')
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  const [timeScale, setTimeScale] = useState(100)
  const [timeX, setTimeX] = useState(0)
  const [timeY, setTimeY] = useState(0)

  // 自适应桌面模式
  const [adaptiveDesktop, setAdaptiveDesktop] = useState(() => {
    return localStorage.getItem('adaptive_desktop') === 'true'
  })

  // 监听自适应桌面设置变化
  useEffect(() => {
    const handleAdaptiveChange = () => {
      setAdaptiveDesktop(localStorage.getItem('adaptive_desktop') === 'true')
    }
    window.addEventListener('adaptiveDesktopChanged', handleAdaptiveChange)
    return () => window.removeEventListener('adaptiveDesktopChanged', handleAdaptiveChange)
  }, [])

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
  
  // 监听时间颜色更新
  useEffect(() => {
    const handleTimeColorUpdate = () => {
      const newColor = localStorage.getItem('desktop_time_color') || '#FFFFFF'
      setDesktopTimeColor(newColor)
    }
    window.addEventListener('desktopTimeColorUpdate', handleTimeColorUpdate)
    return () => window.removeEventListener('desktopTimeColorUpdate', handleTimeColorUpdate)
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

  // 页面退出动画状态
  const [isExiting, setIsExiting] = useState(false)

  const handleAppClick = (e: React.MouseEvent, app: AppItem) => {
    e.preventDefault()
    e.stopPropagation()

    // 预设软件暂时禁用点击
    if (app.id === 'preset') {
      return
    }

    // 播放全局点击音效
    playSystemSound()

    if (app.onClick) {
      app.onClick()
    } else if (app.route) {
      // 添加退出动画后再导航
      setIsExiting(true)
      setTimeout(() => {
        navigate(app.route!)
      }, 200) // 动画持续200ms
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

  // 获取屏幕边距设置
  const [screenOffsets] = useState(() => ({
    top: parseInt(localStorage.getItem('screen_top_offset') || '0'),
    bottom: parseInt(localStorage.getItem('screen_bottom_offset') || '0')
  }))

  return (
    <div className={`fixed inset-0 overflow-hidden ${isExiting ? 'desktop-exit' : 'page-fade-in'}`} style={{ touchAction: 'pan-y pinch-zoom' }}>
      {/* 背景 - 延伸到safe area，并根据负值偏移延伸 */}
      {desktopBg && (
        <div
          className="desktop-background fixed bg-cover bg-center transition-opacity duration-300"
          style={{
            backgroundImage: `url(${desktopBg})`,
            opacity: 1,
            // 根据屏幕边距设置调整背景位置和大小
            top: screenOffsets.top < 0 ? `${screenOffsets.top}px` : 0,
            bottom: screenOffsets.bottom < 0 ? `${screenOffsets.bottom}px` : 'calc(-1 * env(safe-area-inset-bottom, 0px))',
            left: 0,
            right: 0,
            // 如果有负值偏移，需要增加高度
            height: (screenOffsets.top < 0 || screenOffsets.bottom < 0) 
              ? `calc(100% + ${Math.abs(Math.min(screenOffsets.top, 0)) + Math.abs(Math.min(screenOffsets.bottom, 0))}px)`
              : '100%'
          }}
        />
      )}

      {/* 内容容器 - 应用顶部边距 */}
      <div className="relative h-full flex flex-col" style={{
        // 正值时添加顶部内边距，负值时内容保持原位（背景已经延伸）
        paddingTop: screenOffsets.top > 0 ? `${screenOffsets.top}px` : 0,
        paddingBottom: screenOffsets.bottom > 0 ? `${screenOffsets.bottom}px` : 0
      }}>
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
            <div className="min-w-full h-full relative overflow-hidden">
              {/* 黄色 - 时间widget (顶部横条) */}
              <div className={adaptiveDesktop ? "w-[90%] mx-auto pt-[6%] z-20" : "absolute top-[6%] left-1/2 -translate-x-1/2 w-[90%] z-20"}>
                <div
                  className="text-center p-6 rounded-3xl relative"
                  style={customIcons['desktop-time-bg'] ? {
                    backgroundImage: `url(${customIcons['desktop-time-bg']})`,
                    backgroundSize: `${timeScale}%`,
                    backgroundPosition: `calc(50% + ${timeX}px) calc(50% + ${timeY}px)`,
                    backgroundRepeat: 'no-repeat'
                  } : {}}
                >
                  <div className="text-8xl font-bold mb-1 relative z-10" style={{ color: desktopTimeColor }}>
                    {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-base font-medium relative z-10" style={{ color: desktopTimeColor, opacity: 0.8 }}>
                    {currentTime.toLocaleDateString('zh-CN', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </div>
                </div>
              </div>

              {/* 自适应模式：保持原有布局，使用相对尺寸 */}
              {adaptiveDesktop ? (
                <>
                  {/* 音乐播放器 - 使用vw单位自适应 */}
                  <div className="absolute z-10" style={{ top: '35%', left: '6%', width: '38vw', height: '38vw', maxWidth: '160px', maxHeight: '160px' }}>
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

                  {/* 应用图标(2x2) - 使用较小的图标 */}
                  <div className="absolute grid grid-cols-2 gap-3 z-10" style={{ top: '35%', right: '6%' }}>
                    {page1Apps.slice(0, 4).map((app) => {
                      const isImageIcon = typeof app.icon === 'string'
                      const customIcon = getCustomIcon(app.id)
                      const isPNG = customIcon && (customIcon.includes('image/png') || customIcon.toLowerCase().endsWith('.png'))
                      return (
                        <div key={app.id} className="flex flex-col items-center gap-1">
                          {customIcon ? (
                            <div
                              className={`w-14 h-14 ${isPNG ? '' : 'rounded-2xl overflow-hidden'} cursor-pointer hover:scale-105 transition-transform`}
                              onClick={(e) => handleAppClick(e, app)}
                            >
                              <img src={customIcon} alt={app.name} className={`w-full h-full ${isPNG ? 'object-contain' : 'object-cover'}`} />
                            </div>
                          ) : isImageIcon ? (
                            <div className="w-14 h-14 rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform" onClick={(e) => handleAppClick(e, app)}>
                              <img src={app.icon as string} alt={app.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center border border-white/30 cursor-pointer hover:scale-105 transition-transform`} onClick={(e) => handleAppClick(e, app)}>
                              {React.createElement(app.icon as React.ComponentType<any>, { className: "w-7 h-7 text-gray-300" })}
                            </div>
                          )}
                          <span className="text-[10px] text-gray-700 text-center font-medium">{app.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* 固定布局模式（原有逻辑） */}
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
                      const isPNG = customIcon && (customIcon.includes('image/png') || customIcon.toLowerCase().endsWith('.png'))

                      return (
                        <div
                          key={app.id}
                          className="flex flex-col items-center gap-2"
                        >
                          {customIcon ? (
                            // PNG图标不包裹圆角，其他格式包裹圆角
                            <div
                              className={`w-16 h-16 ${isPNG ? '' : 'rounded-2xl overflow-hidden'} cursor-pointer hover:scale-105 transition-transform`}
                              style={{ backgroundColor: 'transparent' }}
                              onClick={(e) => handleAppClick(e, app)}
                            >
                              <img src={customIcon} alt={app.name} className={`w-full h-full ${isPNG ? 'object-contain' : 'object-cover'}`} />
                            </div>
                          ) : isImageIcon ? (
                            <div
                              className="w-16 h-16 rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                              style={{ backgroundColor: 'transparent' }}
                              onClick={(e) => handleAppClick(e, app)}
                            >
                              <img src={app.icon as string} alt={app.name} className="w-full h-full object-cover" />
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
                </>
              )}

              {/* 蓝色 - 备忘录widget (右下角) - 长按切换4种模式 */}
              <div 
                className="absolute z-10" 
                style={{ 
                  bottom: adaptiveDesktop ? '15%' : '13.5%', 
                  right: '6%', 
                  width: adaptiveDesktop ? '35vw' : '150px', 
                  height: adaptiveDesktop ? '28vw' : '140px',
                  maxWidth: adaptiveDesktop ? '150px' : undefined,
                  maxHeight: adaptiveDesktop ? '120px' : undefined
                }}
                onMouseDown={() => {
                  memoLongPressTimer.current = setTimeout(() => {
                    const newMode = (memoDisplayMode + 1) % 4
                    console.log('📝 备忘录模式切换:', memoDisplayMode, '->', newMode)
                    setMemoDisplayMode(newMode)
                    localStorage.setItem('memo_display_mode', String(newMode))
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
                    const newMode = (memoDisplayMode + 1) % 4
                    setMemoDisplayMode(newMode)
                    localStorage.setItem('memo_display_mode', String(newMode))
                  }, 500)
                }}
                onTouchEnd={() => {
                  if (memoLongPressTimer.current) {
                    clearTimeout(memoLongPressTimer.current)
                  }
                }}
              >
                {/* 模式3时完全隐藏内容，但保留长按区域 */}
                {memoDisplayMode !== 3 && (
                <div
                  className="w-full h-full rounded-2xl overflow-hidden flex flex-col relative"
                  style={{
                    backgroundColor: memoBg ? 'transparent' : 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: memoBg ? 'none' : 'blur(20px)',
                    WebkitBackdropFilter: memoBg ? 'none' : 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }}
                >
                  {/* 背景图层 */}
                  {memoBg && (
                    <img
                      src={memoBg}
                      alt="memo background"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}

                  {/* 顶部标题栏 - 模式0和1显示 */}
                  {(memoDisplayMode === 0 || memoDisplayMode === 1) && (
                    <div
                      className="flex items-center justify-between px-3 py-2 border-b cursor-pointer transition-colors"
                      style={{
                        backgroundColor: memoBg ? 'transparent' : 'rgba(255, 255, 255, 0.5)',
                        borderColor: memoBg ? 'transparent' : 'rgba(255, 255, 255, 0.3)'
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

                  {/* 内容区域 - 模式0和2显示文字 */}
                  {(memoDisplayMode === 0 || memoDisplayMode === 2) && (
                    <div
                      className="flex-1 px-3 py-2 cursor-text"
                      style={{
                        backgroundColor: memoBg ? 'transparent' : 'rgba(255, 255, 255, 0.5)'
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
                  )}
                </div>
                )}
              </div>

              {/* 左下角 - 播放进度组件 */}
              <div className="absolute z-10 flex flex-col gap-2" style={{ 
                bottom: adaptiveDesktop ? '30%' : '29%', 
                left: '6%', 
                width: adaptiveDesktop ? '38vw' : '42%',
                maxWidth: adaptiveDesktop ? '160px' : undefined
              }}>
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
                  const isPNG = customIcon && (customIcon.includes('image/png') || customIcon.toLowerCase().endsWith('.png'))

                  return (
                    <div
                      key={`${app.id}-${iconRefresh}`}
                      onClick={(e) => handleAppClick(e, app)}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      {customIcon ? (
                        // PNG图标不包裹圆角，其他格式包裹圆角
                        <div className={`w-16 h-16 ${isPNG ? '' : 'rounded-2xl overflow-hidden'}`}>
                          <img src={customIcon} alt={app.name} className={`w-full h-full ${isPNG ? 'object-contain' : 'object-cover'}`} />
                        </div>
                      ) : isImageIcon ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center">
                          <img src={app.icon as string} alt={app.name} className="w-full h-full object-cover" />
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
                {(() => {
                  const decorationIcon = getCustomIcon('decoration')
                  const isPNG = decorationIcon && (decorationIcon.includes('image/png') || decorationIcon.toLowerCase().endsWith('.png'))
                  return (
                    <div
                      key={`decoration-${iconRefresh}`}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                      onClick={() => navigate('/decoration')}
                    >
                      {decorationIcon ? (
                        // PNG图标不包裹圆角，其他格式包裹圆角
                        <div className={`w-16 h-16 ${isPNG ? '' : 'rounded-2xl overflow-hidden'} flex items-center justify-center`}>
                          <img src={decorationIcon} alt="美化" className={`w-full h-full ${isPNG ? 'object-contain' : 'object-cover'}`} />
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
                  )
                })()}
              </div>
            </div>

            {/* ========== 第二页 ========== */}
            <div className="min-w-full h-full relative overflow-hidden">
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
                      reader.onload = async (e) => {
                        const result = e.target?.result as string
                        setAvatarImage(result)
                        // 🔥 改用IndexedDB存储，避免localStorage超出配额
                        try {
                          const { saveImage } = await import('../utils/unifiedStorage')
                          await saveImage('desktop_page2_avatar', result)
                          console.log('✅ 第二页头像已保存到IndexedDB')
                        } catch (error) {
                          console.error('❌ 保存第二页头像失败:', error)
                        }
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
                  backgroundColor: bubble1BgImage ? 'transparent' : 'rgba(255, 255, 255, 0.65)',
                  backgroundImage: bubble1BgImage ? `url(${bubble1BgImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '38px',
                  width: '170px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
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
                  backgroundColor: bubble2BgImage ? 'transparent' : 'rgba(255, 255, 255, 0.65)',
                  backgroundImage: bubble2BgImage ? `url(${bubble2BgImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '38px',
                  width: '180px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
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
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 页面指示器 */}
        <div className="absolute left-1/2 -translate-x-1/2 flex gap-2 z-20" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' }}>
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
        <div className="px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
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
                const isPNG = customIcon && (customIcon.includes('image/png') || customIcon.toLowerCase().endsWith('.png'))
                return (
                  <div
                    key={`${app.id}-${iconRefresh}`}
                    onClick={(e) => handleAppClick(e, app)}
                    className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                  >
                    {customIcon ? (
                      // PNG图标不包裹圆角，其他格式包裹圆角
                      isPNG ? (
                        <div className="w-14 h-14 flex items-center justify-center">
                          <img src={customIcon} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center">
                          <img src={customIcon} alt={app.name} className="w-full h-full object-cover" />
                        </div>
                      )
                    ) : isImageIcon ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center">
                        <img src={app.icon as string} alt={app.name} className="w-full h-full object-cover" />
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
