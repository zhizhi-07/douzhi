/**
 * 全局美化页面 - 界面图标自定义预览
 * 提供聊天界面和主界面的图标美化功能
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import {
  ChatIcon, MusicIcon, ForumIcon, DecorationIcon, SettingsIcon,
  BookIcon, MemoryIcon, PhoneIcon, CalendarIcon, ImageIcon, GameIcon
} from '../components/Icons'
import {
  saveUIIcon,
  getAllUIIcons,
  deleteUIIcon,
  saveDesktopIcon,
  getAllDesktopIcons,
  deleteDesktopIcon,
  getStorageUsage
} from '../utils/iconStorage'
import { getImage, saveImage } from '../utils/unifiedStorage'

// 图标名称映射表
const iconNameMap: Record<string, string> = {
  'desktop-time-bg': '桌面时间背景',
  'main-topbar-bg': '主界面顶栏',
  'main-bottombar-bg': '主界面底栏',
  'chat-topbar-bg': '聊天顶栏',
  'chat-bottombar-bg': '聊天底栏',
  'avatar-2': '头像2',
  'nav-chat': '微信',
  'nav-contacts': '通讯录',
  'nav-discover': '发现',
  'nav-me': '我',
  'main-group': '群聊',
  'main-add': '添加',
  'avatar-1': '头像1',
  'chat-back': '返回',
  'chat-more': '更多',
  'chat-avatar-1': '对方头像',
  'chat-avatar-2': '我的头像',
  'chat-add-btn': '加号按钮',
  'chat-emoji': '表情',
  'chat-send': '发送',
  'chat-ai': 'AI回复',
  'menu-photo': '相册',
  'menu-camera': '拍摄',
  'menu-video': '视频通话',
  'menu-location': '位置',
  'menu-transfer': '转账',
  'menu-file': '文件',
  'menu-card': '名片',
  'menu-voice': '语音输入',
  'menu-recall': '重回',
  'menu-pay': '亲密付',
  'menu-food': '外卖',
  'menu-music': '一起听',
  'menu-memo': '随笔',
  'menu-offline': '线下',
  'menu-shop': '网购',
  'menu-post': '帖子',
  'menu-fix': '修正',
  'menu-couple': '情侣空间',
  'chat-input-bg': '输入框背景',
  // 桌面应用图标 (第一页)
  'wechat-app': '微信',
  'preset': '预设',
  'worldbook': '世界书',
  'music-app': '音乐',
  'customize': '系统设置',
  'decoration': '美化',
  // 桌面第二页图标
  'desktop-calendar': '日历',
  'desktop-theater': '小剧场',
  'homeland': '行程',
  'desktop-game': '游戏',
  // Dock栏图标
  'api-config': 'API',
  'instagram': 'Forum',
  'global-memory': '记忆',
  'aiphone': '查手机'
}

const GlobalDecoration = () => {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState<'main' | 'chat' | 'desktop' | 'menu'>('main')
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  const [desktopIcons, setDesktopIcons] = useState<Array<{ appId: string, icon: string }>>([])
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5 }) // MB
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentEditingIcon, setCurrentEditingIcon] = useState<string | null>(null)
  
  // 悬浮预览窗口状态
  const [showFloatingPreview, setShowFloatingPreview] = useState(false)
  const [floatingPos, setFloatingPos] = useState({ x: 20, y: 100 })
  const [floatingSize, setFloatingSize] = useState({ width: 180, height: 380 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // 每个图标独立的调整参数缓存
  const [adjustParams, setAdjustParams] = useState<Record<string, { scale: number, x: number, y: number }>>({
    'main-topbar-bg': { scale: 100, x: 0, y: 0 },
    'main-bottombar-bg': { scale: 100, x: 0, y: 0 },
    'chat-topbar-bg': { scale: 100, x: 0, y: 0 },
    'chat-bottombar-bg': { scale: 100, x: 0, y: 0 },
    'desktop-time-bg': { scale: 100, x: 0, y: 0 }
  })

  // 背景状态
  const [desktopBg, setDesktopBg] = useState(() => {
    const preloaded = sessionStorage.getItem('__preloaded_backgrounds__')
    if (preloaded) {
      try {
        const backgrounds = JSON.parse(preloaded)
        return backgrounds.desktop_bg || ''
      } catch { return '' }
    }
    return ''
  })

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

  // 计算存储使用量
  const updateStorageUsage = async () => {
    try {
      const { used, available } = await getStorageUsage()
      const usedMB = used / (1024 * 1024)
      const totalMB = available / (1024 * 1024)
      setStorageUsage({ used: usedMB, total: totalMB || 50 })
    } catch (error) {
      console.error('获取存储使用量失败:', error)
    }
  }

  // 加载已保存的图标配置（UI图标）
  useEffect(() => {
    const loadIcons = async () => {
      try {
        let icons = await getAllUIIcons()
        if (Object.keys(icons).length === 0) {
          const localData = localStorage.getItem('ui_custom_icons')
          if (localData) {
            icons = JSON.parse(localData)
            for (const [key, value] of Object.entries(icons)) {
              await saveUIIcon(key, value)
            }
            localStorage.removeItem('ui_custom_icons')
          }
        }
        setCustomIcons(icons)
        updateStorageUsage()
      } catch (error) {
        console.error('加载UI图标配置失败:', error)
      }
    }
    loadIcons()

    // 加载图标调整参数
    const savedParams = localStorage.getItem('iconAdjustParams')
    if (savedParams) {
      try {
        setAdjustParams(prev => ({ ...prev, ...JSON.parse(savedParams) }))
      } catch (e) {
        console.error('加载图标调整参数失败:', e)
      }
    }
  }, [])

  // 加载桌面应用图标配置
  useEffect(() => {
    const loadIcons = async () => {
      try {
        let icons = await getAllDesktopIcons()
        if (icons.length === 0) {
          const localData = localStorage.getItem('custom_icons')
          if (localData) {
            icons = JSON.parse(localData)
            for (const item of icons) {
              await saveDesktopIcon(item.appId, item.icon)
            }
            localStorage.removeItem('custom_icons')
          }
        }
        setDesktopIcons(icons)
      } catch (error) {
        console.error('加载桌面图标配置失败:', error)
      }
    }
    loadIcons()
  }, [])

  // 加载背景图片
  useEffect(() => {
    const loadBackgrounds = async () => {
      if (!desktopBg) {
        const desktop = await getImage('desktop_bg')
        if (desktop) setDesktopBg(desktop)
      }
      if (!wechatBg) {
        const wechat = await getImage('wechat_bg')
        if (wechat) setWechatBg(wechat)
      }
    }
    loadBackgrounds()
  }, [])

  // 保存UI图标配置到IndexedDB
  const saveIconsToStorage = async (icons: Record<string, string>) => {
    await updateStorageUsage()
    window.dispatchEvent(new Event('uiIconsChanged'))
  }

  // 压缩图片
  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法获取canvas上下文'))
            return
          }

          const isPNG = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')

          if (!isPNG) {
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, width, height)
          }

          ctx.drawImage(img, 0, 0, width, height)

          const outputFormat = isPNG ? 'image/png' : 'image/jpeg'
          const outputQuality = isPNG ? 1.0 : quality

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('图片压缩失败'))
            }
          }, outputFormat, outputQuality)
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  // 处理图标上传
  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file || !currentEditingIcon) return

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('图片文件太大，请选择小于10MB的图片')
      return
    }

    try {
      const isBackground = currentEditingIcon.includes('-bg')
      const maxWidth = isBackground ? 800 : 200
      const maxHeight = isBackground ? 400 : 200
      const quality = 0.8

      const compressedBlob = await compressImage(file, maxWidth, maxHeight, quality)
      const result = URL.createObjectURL(compressedBlob)

      const desktopAppIds = ['wechat-app', 'preset', 'worldbook', 'music-app', 'customize', 'decoration', 'instagram', 'aiphone', 'api-config', 'global-memory', 'desktop-calendar', 'desktop-theater', 'homeland', 'desktop-game']
      const backgroundIds = ['desktop-wallpaper', 'wechat-wallpaper']

      if (backgroundIds.includes(currentEditingIcon)) {
        const key = currentEditingIcon === 'desktop-wallpaper' ? 'desktop_bg' : 'wechat_bg'
        await saveImage(key, compressedBlob)

        if (currentEditingIcon === 'desktop-wallpaper') {
          setDesktopBg(result)
          window.dispatchEvent(new Event('desktopBackgroundUpdate'))
        } else {
          setWechatBg(result)
          window.dispatchEvent(new Event('wechatBackgroundUpdate'))
        }
      } else if (desktopAppIds.includes(currentEditingIcon)) {
        await saveDesktopIcon(currentEditingIcon, compressedBlob)

        const existingIndex = desktopIcons.findIndex(item => item.appId === currentEditingIcon)
        let newDesktopIcons
        if (existingIndex >= 0) {
          newDesktopIcons = [...desktopIcons]
          newDesktopIcons[existingIndex] = { appId: currentEditingIcon, icon: result }
        } else {
          newDesktopIcons = [...desktopIcons, { appId: currentEditingIcon, icon: result }]
        }
        setDesktopIcons(newDesktopIcons)
        window.dispatchEvent(new CustomEvent('iconChanged'))
      } else {
        await saveUIIcon(currentEditingIcon, compressedBlob)

        const newIcons = {
          ...customIcons,
          [currentEditingIcon]: result
        }
        setCustomIcons(newIcons)
        sessionStorage.setItem('__preloaded_icons__', JSON.stringify(newIcons))
        await saveIconsToStorage(newIcons)
        alert(`✅ ${iconNameMap[currentEditingIcon] || currentEditingIcon} 上传成功！`)
      }

      setCurrentEditingIcon(null)
      if (event.target) event.target.value = ''
    } catch (error) {
      console.error('图片处理失败:', error)
      alert(`图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setCurrentEditingIcon(null)
      if (event.target) event.target.value = ''
    }
  }

  // 点击图标：有图标时显示调整面板，无图标时上传
  const handleIconClick = (iconId: string) => {
    setCurrentEditingIcon(iconId)
    // 如果该图标还没有自定义，弹出文件选择器
    if (!customIcons[iconId]) {
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click()
        }
      }, 0)
    } else {
      // 已有图标，打开悬浮调整面板
      setShowFloatingPreview(true)
    }
  }

  // 重新上传图标（从调整面板调用）
  const handleReupload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // 悬浮窗口拖动处理
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragOffset({ x: clientX - floatingPos.x, y: clientY - floatingPos.y })
  }

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    if (isDragging) {
      setFloatingPos({ x: clientX - dragOffset.x, y: clientY - dragOffset.y })
    } else if (isResizing) {
      const deltaX = clientX - dragOffset.x
      // 只调整宽度，高度自动
      setFloatingSize(prev => ({
        ...prev,
        width: Math.max(200, prev.width + deltaX)
      }))
      setDragOffset({ x: clientX, y: clientY })
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  // 监听拖动/调整大小事件
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove)
      window.addEventListener('touchend', handleDragEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, isResizing, dragOffset])

  // 主界面预览（ChatList）
  const MainView = () => (
    <div
      className="w-full h-full bg-slate-50 flex flex-col relative cursor-pointer group overflow-hidden rounded-[40px] border-[6px] border-white/50 shadow-inner"
      onClick={(e) => {
        if ((e.target as HTMLElement).className.includes('bg-slate-50')) {
          e.stopPropagation()
          handleIconClick('wechat-wallpaper')
        }
      }}
      style={wechatBg ? {
        backgroundImage: `url(${wechatBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
      title="点击空白处上传微信背景"
    >
      {/* 顶部栏 */}
      <div
        className="bg-white/80 backdrop-blur-md px-4 pt-10 pb-4 relative cursor-pointer hover:bg-blue-50/50 transition-colors"
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName !== 'DIV' || (e.target as HTMLElement).className.includes('w-6')) return;
          e.stopPropagation()
          handleIconClick('main-topbar-bg')
        }}
        style={customIcons['main-topbar-bg'] ? {
          backgroundImage: `url(${customIcons['main-topbar-bg']})`,
          backgroundSize: `${adjustParams['main-topbar-bg']?.scale || 100}%`,
          backgroundPosition: `calc(50% + ${adjustParams['main-topbar-bg']?.x || 0}px) calc(50% + ${adjustParams['main-topbar-bg']?.y || 0}px)`,
          backgroundRepeat: 'no-repeat'
        } : {}}
      >
        <div className="flex items-center justify-between relative z-10">
          <h1 className="text-lg font-medium text-slate-800">微信</h1>
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                handleIconClick('main-group')
              }}
              style={customIcons['main-group'] ? {
                backgroundImage: `url(${customIcons['main-group']})`,
                backgroundSize: 'cover',
                backgroundColor: 'transparent'
              } : {}}
            />
            <div
              className="w-6 h-6 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                handleIconClick('main-add')
              }}
              style={customIcons['main-add'] ? {
                backgroundImage: `url(${customIcons['main-add']})`,
                backgroundSize: 'cover',
                backgroundColor: 'transparent'
              } : {}}
            />
          </div>
        </div>
      </div>

      {/* 聊天列表 */}
      <div className="flex-1 px-4 pt-3 space-y-2 overflow-auto scrollbar-hide">
        {['联系人 1', '联系人 2'].map((name, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-md rounded-[20px] p-3 flex items-center gap-3 border border-white/40 shadow-sm">
            <div
              className="w-12 h-12 bg-slate-200 rounded-[16px] cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                handleIconClick(`avatar-${i + 1}`)
              }}
              style={customIcons[`avatar-${i + 1}`] ? {
                backgroundImage: `url(${customIcons[`avatar-${i + 1}`]})`,
                backgroundSize: 'cover',
                backgroundColor: 'transparent'
              } : {}}
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-800">{name}</span>
                <span className="text-[10px] text-slate-400 font-light">12:30</span>
              </div>
              <span className="text-xs text-slate-500 font-light">点击头像更换...</span>
            </div>
          </div>
        ))}
      </div>

      {/* 底部导航栏 */}
      <div
        className="bg-white/80 backdrop-blur-md h-20 pb-4 flex items-center justify-around border-t border-white/20 relative cursor-pointer hover:bg-blue-50/50 transition-colors"
        onClick={(e) => {
          if ((e.target as HTMLElement).className.includes('w-6') || (e.target as HTMLElement).className.includes('text-')) return;
          e.stopPropagation()
          handleIconClick('main-bottombar-bg')
        }}
        style={customIcons['main-bottombar-bg'] ? {
          backgroundImage: `url(${customIcons['main-bottombar-bg']})`,
          backgroundSize: `${adjustParams['main-bottombar-bg']?.scale || 100}%`,
          backgroundPosition: `calc(50% + ${adjustParams['main-bottombar-bg']?.x || 0}px) calc(50% + ${adjustParams['main-bottombar-bg']?.y || 0}px)`,
          backgroundRepeat: 'no-repeat'
        } : {}}
      >
        {[
          { id: 'nav-chat', label: '微信' },
          { id: 'nav-contacts', label: '通讯录' },
          { id: 'nav-discover', label: '发现' },
          { id: 'nav-me', label: '我' }
        ].map(item => (
          <div key={item.id} className="flex flex-col items-center gap-1 relative z-10">
            <div
              className="w-6 h-6 bg-slate-200/50 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                handleIconClick(item.id)
              }}
              style={customIcons[item.id] ? {
                backgroundImage: `url(${customIcons[item.id]})`,
                backgroundSize: 'cover',
                backgroundColor: 'transparent'
              } : {}}
            />
            <span className="text-[10px] text-slate-500 font-light">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // 聊天界面预览
  const ChatView = () => (
    <div
      className="w-full h-full bg-slate-100 flex flex-col relative cursor-pointer group overflow-hidden rounded-[40px] border-[6px] border-white/50 shadow-inner"
      style={wechatBg ? {
        backgroundImage: `url(${wechatBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
      {/* 聊天顶栏 */}
      <div
        className="bg-white/80 backdrop-blur-md px-4 pt-10 pb-3 flex items-center justify-between relative cursor-pointer hover:bg-blue-50/50 transition-colors"
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName !== 'DIV' || (e.target as HTMLElement).className.includes('w-6')) return;
          e.stopPropagation()
          handleIconClick('chat-topbar-bg')
        }}
        style={customIcons['chat-topbar-bg'] ? {
          backgroundImage: `url(${customIcons['chat-topbar-bg']})`,
          backgroundSize: `${adjustParams['chat-topbar-bg']?.scale || 100}%`,
          backgroundPosition: `calc(50% + ${adjustParams['chat-topbar-bg']?.x || 0}px) calc(50% + ${adjustParams['chat-topbar-bg']?.y || 0}px)`,
          backgroundRepeat: 'no-repeat'
        } : {}}
      >
        <div
          className="w-6 h-6 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
          onClick={(e) => { e.stopPropagation(); handleIconClick('chat-back') }}
          style={customIcons['chat-back'] ? { backgroundImage: `url(${customIcons['chat-back']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
        />
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-slate-800">联系人</span>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-[10px] text-gray-400">在线</span>
          </div>
        </div>
        <div
          className="w-6 h-6 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
          onClick={(e) => { e.stopPropagation(); handleIconClick('chat-more') }}
          style={customIcons['chat-more'] ? { backgroundImage: `url(${customIcons['chat-more']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
        />
      </div>

      {/* 聊天内容 */}
      <div className="flex-1 p-4 space-y-4 overflow-auto scrollbar-hide">
        {/* 对方消息 */}
        <div className="flex items-start gap-2">
          <div
            className="w-10 h-10 bg-slate-200 rounded-[14px] cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
            onClick={(e) => { e.stopPropagation(); handleIconClick('chat-avatar-1') }}
            style={customIcons['chat-avatar-1'] ? { backgroundImage: `url(${customIcons['chat-avatar-1']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
          />
          <div className="bg-white rounded-[20px] rounded-tl-none p-3 shadow-sm max-w-[70%]">
            <p className="text-sm text-slate-800">你好，这是一条测试消息</p>
          </div>
        </div>

        {/* 我的消息 */}
        <div className="flex items-start gap-2 flex-row-reverse">
          <div
            className="w-10 h-10 bg-slate-200 rounded-[14px] cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
            onClick={(e) => { e.stopPropagation(); handleIconClick('chat-avatar-2') }}
            style={customIcons['chat-avatar-2'] ? { backgroundImage: `url(${customIcons['chat-avatar-2']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
          />
          <div className="bg-green-500 rounded-[20px] rounded-tr-none p-3 shadow-sm max-w-[70%]">
            <p className="text-sm text-white">收到了，正在测试图标替换</p>
          </div>
        </div>
      </div>

      {/* 聊天底栏 */}
      <div
        className="bg-white/80 backdrop-blur-md p-3 pb-6 flex items-center gap-2 border-t border-white/20 relative cursor-pointer hover:bg-blue-50/50 transition-colors"
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName !== 'DIV' || (e.target as HTMLElement).className.includes('w-7')) return;
          e.stopPropagation()
          handleIconClick('chat-bottombar-bg')
        }}
        style={customIcons['chat-bottombar-bg'] ? {
          backgroundImage: `url(${customIcons['chat-bottombar-bg']})`,
          backgroundSize: `${adjustParams['chat-bottombar-bg']?.scale || 100}%`,
          backgroundPosition: `calc(50% + ${adjustParams['chat-bottombar-bg']?.x || 0}px) calc(50% + ${adjustParams['chat-bottombar-bg']?.y || 0}px)`,
          backgroundRepeat: 'no-repeat'
        } : {}}
      >
        {/* 加号按钮 */}
        <div
          className="w-7 h-7 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); handleIconClick('chat-add-btn') }}
          style={customIcons['chat-add-btn'] ? { backgroundImage: `url(${customIcons['chat-add-btn']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
          title="加号按钮"
        >
          {!customIcons['chat-add-btn'] && <span className="text-slate-400 text-xs">+</span>}
        </div>
        {/* 输入框 */}
        <div className="flex-1 h-8 bg-white rounded-full border border-slate-200" />
        {/* 表情按钮 */}
        <div
          className="w-7 h-7 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); handleIconClick('chat-emoji') }}
          style={customIcons['chat-emoji'] ? { backgroundImage: `url(${customIcons['chat-emoji']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
          title="表情"
        >
          {!customIcons['chat-emoji'] && <span className="text-slate-400 text-[10px]">😊</span>}
        </div>
        {/* 发送按钮（输入有内容时显示） */}
        <div
          className="w-7 h-7 bg-gray-800 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); handleIconClick('chat-send') }}
          style={customIcons['chat-send'] ? { backgroundImage: `url(${customIcons['chat-send']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
          title="发送按钮"
        >
          {!customIcons['chat-send'] && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </div>
        {/* AI回复按钮（输入框空时显示） */}
        <div
          className="w-7 h-7 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); handleIconClick('chat-ai') }}
          style={customIcons['chat-ai'] ? { backgroundImage: `url(${customIcons['chat-ai']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
          title="AI回复按钮"
        >
          {!customIcons['chat-ai'] && (
            <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )

  // 加号菜单图标预览
  const MenuView = () => {
    const menuItems = [
      { id: 'menu-recall', label: '重回' },
      { id: 'menu-photo', label: '相册' },
      { id: 'menu-camera', label: '拍照' },
      { id: 'menu-transfer', label: '转账' },
      { id: 'menu-pay', label: '亲密付' },
      { id: 'menu-food', label: '外卖' },
      { id: 'menu-location', label: '位置' },
      { id: 'menu-voice', label: '语音' },
      { id: 'menu-video', label: '视频' },
      { id: 'menu-music', label: '音乐' },
      { id: 'menu-memo', label: '随笔' },
      { id: 'menu-offline', label: '线下' },
      { id: 'menu-shop', label: '网购' },
      { id: 'menu-post', label: '帖子' },
      { id: 'menu-fix', label: '修正' },
      { id: 'menu-couple', label: '情侣' }
    ]

    return (
      <div className="w-full h-full bg-slate-100 flex flex-col relative overflow-hidden rounded-[40px] border-[6px] border-white/50 shadow-inner">
        {/* 标题栏 */}
        <div className="bg-white/80 backdrop-blur-md px-4 pt-10 pb-3">
          <h2 className="text-sm font-medium text-slate-800 text-center">加号菜单图标</h2>
          <p className="text-[10px] text-slate-500 text-center mt-1">点击图标上传自定义图片</p>
        </div>

        {/* 图标网格 */}
        <div className="flex-1 p-3 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-4 gap-2">
            {menuItems.map(item => (
              <div key={item.id} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 bg-white rounded-xl shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all flex items-center justify-center overflow-hidden"
                  onClick={(e) => { e.stopPropagation(); handleIconClick(item.id) }}
                  style={customIcons[item.id] ? { backgroundImage: `url(${customIcons[item.id]})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
                >
                  {!customIcons[item.id] && (
                    <span className="text-slate-300 text-lg">+</span>
                  )}
                </div>
                <span className="text-[9px] text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 提示 */}
        <div className="bg-white/80 backdrop-blur-md px-4 py-3 text-center">
          <p className="text-[10px] text-slate-500">上传的图标将在聊天的+号菜单中显示</p>
        </div>
      </div>
    )
  }

  // 桶面预览
  const DesktopView = () => (
    <div
      className="w-full h-full bg-gradient-to-b from-blue-400 to-purple-500 flex flex-col relative cursor-pointer group overflow-hidden rounded-[40px] border-[6px] border-white/50 shadow-inner"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('desktop-bg-area')) {
          e.stopPropagation()
          handleIconClick('desktop-wallpaper')
        }
      }}
      style={desktopBg ? {
        backgroundImage: `url(${desktopBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
      title="点击空白处上传桶面背景"
    >
      {/* 状态栏占位 */}
      <div className="h-6 w-full" />

      {/* 时间组件 */}
      <div className="px-4 py-4 text-center desktop-bg-area">
        <div className="text-white drop-shadow-lg">
          <div className="text-3xl font-light">12:30</div>
          <div className="text-[10px] opacity-90 mt-0.5">10月24日 星期二</div>
        </div>
      </div>

      {/* 应用图标网格 - 第一页 */}
      <div className="px-3 grid grid-cols-4 gap-x-2 gap-y-2 content-start desktop-bg-area">
        {[
          { id: 'wechat-app', label: '微信', icon: <ChatIcon className="w-5 h-5 text-green-500" /> },
          { id: 'preset', label: '预设', icon: <SettingsIcon className="w-5 h-5 text-slate-500" /> },
          { id: 'worldbook', label: '世界书', icon: <BookIcon className="w-5 h-5 text-amber-600" /> },
          { id: 'music-app', label: '音乐', icon: <MusicIcon className="w-5 h-5 text-pink-500" /> },
          { id: 'customize', label: '系统设置', icon: <SettingsIcon className="w-5 h-5 text-blue-500" /> },
          { id: 'decoration', label: '美化', icon: <DecorationIcon className="w-5 h-5 text-purple-500" /> }
        ].map(app => {
          const customIcon = desktopIcons.find(i => i.appId === app.id)?.icon
          const isPNG = customIcon && (customIcon.includes('image/png') || customIcon.toLowerCase().endsWith('.png'))
          return (
            <div key={app.id} className="flex flex-col items-center gap-0.5">
              <div
                className={`w-10 h-10 ${isPNG ? '' : 'rounded-xl'} bg-white shadow-md cursor-pointer hover:scale-105 transition-transform flex items-center justify-center ${isPNG ? '' : 'overflow-hidden'}`}
                onClick={(e) => { e.stopPropagation(); handleIconClick(app.id) }}
              >
                {customIcon ? <img src={customIcon} alt={app.label} className={`w-full h-full ${isPNG ? 'object-contain' : 'object-cover'}`} /> : app.icon}
              </div>
              <span className="text-[8px] text-white font-medium drop-shadow-md">{app.label}</span>
            </div>
          )
        })}
      </div>

      {/* 分隔线 */}
      <div className="mx-6 my-2 border-t border-white/20 desktop-bg-area" />
      <div className="text-[8px] text-white/60 text-center mb-1 desktop-bg-area">第二页</div>

      {/* 应用图标网格 - 第二页 */}
      <div className="flex-1 px-3 grid grid-cols-4 gap-x-2 gap-y-2 content-start desktop-bg-area">
        {[
          { id: 'desktop-calendar', label: '日历', icon: <CalendarIcon className="w-5 h-5 text-red-500" /> },
          { id: 'desktop-theater', label: '小剧场', icon: <ImageIcon className="w-5 h-5 text-indigo-500" /> },
          { id: 'homeland', label: '行程', icon: <CalendarIcon className="w-5 h-5 text-blue-500" /> },
          { id: 'desktop-game', label: '游戏', icon: <GameIcon className="w-5 h-5 text-emerald-500" /> }
        ].map(app => {
          const customIcon = desktopIcons.find(i => i.appId === app.id)?.icon
          const isPNG = customIcon && (customIcon.includes('image/png') || customIcon.toLowerCase().endsWith('.png'))
          return (
            <div key={app.id} className="flex flex-col items-center gap-0.5">
              <div
                className={`w-10 h-10 ${isPNG ? '' : 'rounded-xl'} bg-white shadow-md cursor-pointer hover:scale-105 transition-transform flex items-center justify-center ${isPNG ? '' : 'overflow-hidden'}`}
                onClick={(e) => { e.stopPropagation(); handleIconClick(app.id) }}
              >
                {customIcon ? <img src={customIcon} alt={app.label} className={`w-full h-full ${isPNG ? 'object-contain' : 'object-cover'}`} /> : app.icon}
              </div>
              <span className="text-[8px] text-white font-medium drop-shadow-md">{app.label}</span>
            </div>
          )
        })}
      </div>

      {/* 底部Dock栏 - 与 dockApps 保持一致 */}
      <div className="mx-3 mb-3 p-2 bg-white/20 backdrop-blur-xl rounded-2xl flex justify-around items-center">
        {[
          { id: 'api-config', label: 'API', icon: <SettingsIcon className="w-5 h-5 text-blue-500" /> },
          { id: 'instagram', label: 'Forum', icon: <ForumIcon className="w-5 h-5 text-orange-500" /> },
          { id: 'global-memory', label: '记忆', icon: <MemoryIcon className="w-5 h-5 text-cyan-500" /> },
          { id: 'aiphone', label: '查手机', icon: <PhoneIcon className="w-5 h-5 text-teal-500" /> }
        ].map(app => {
          const customIcon = desktopIcons.find(i => i.appId === app.id)?.icon
          const isPNG = customIcon && (customIcon.includes('image/png') || customIcon.toLowerCase().endsWith('.png'))
          return (
            <div
              key={app.id}
              className={`w-10 h-10 ${isPNG ? '' : 'rounded-xl'} bg-white shadow-sm cursor-pointer hover:scale-110 transition-transform flex items-center justify-center ${isPNG ? '' : 'overflow-hidden'}`}
              onClick={(e) => { e.stopPropagation(); handleIconClick(app.id) }}
              title={app.label}
            >
              {customIcon ? (
                <img src={customIcon} alt={app.label} className={`w-full h-full ${isPNG ? 'object-contain' : 'object-cover'}`} />
              ) : (
                app.icon
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-transparent relative overflow-hidden font-serif text-[#2C2C2C]">
      <StatusBar />

      {/* 顶部导航栏 */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/decoration')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-[#5A5A5A] hover:bg-white/80 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-5 h-5 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-[#2C2C2C]">全局美化</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 预览窗口按钮 */}
          <button
            onClick={() => setShowFloatingPreview(!showFloatingPreview)}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border border-white/40 transition-all shadow-sm active:scale-95 ${showFloatingPreview ? 'bg-blue-500 text-white' : 'bg-white/60 text-[#5A5A5A] hover:bg-white/80'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <span className="text-[10px] text-[#8C8C8C] font-mono bg-white/40 px-3 py-1 rounded-full border border-white/40 backdrop-blur-sm">
            {storageUsage.used.toFixed(1)}MB / {storageUsage.total.toFixed(0)}MB
          </span>
        </div>
      </div>

      {/* 悬浮调整面板 - 可拖动位置和调整大小 */}
      {showFloatingPreview && currentEditingIcon && customIcons[currentEditingIcon] && (
        <div
          className="fixed z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden"
          style={{ 
            left: floatingPos.x, 
            top: floatingPos.y, 
            width: floatingSize.width,
            minWidth: 200
          }}
        >
          {/* 拖动条 */}
          <div
            className="h-8 bg-gray-700 flex items-center justify-between px-3 cursor-move select-none"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <span className="text-white text-xs font-medium">
              调整: {iconNameMap[currentEditingIcon] || currentEditingIcon}
            </span>
            <button
              onClick={() => setShowFloatingPreview(false)}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-white text-xs hover:bg-white/40"
            >
              ✕
            </button>
          </div>
          
          {/* 调整滑块 */}
          <div className="p-3 space-y-3">
            {/* 缩放 */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>缩放</span>
                <span className="font-mono">{adjustParams[currentEditingIcon]?.scale || 100}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={adjustParams[currentEditingIcon]?.scale || 100}
                onChange={(e) => {
                  const newScale = parseInt(e.target.value)
                  setAdjustParams(prev => ({
                    ...prev,
                    [currentEditingIcon]: { ...prev[currentEditingIcon], scale: newScale }
                  }))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* X位置 */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>水平</span>
                <span className="font-mono">{adjustParams[currentEditingIcon]?.x || 0}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustParams[currentEditingIcon]?.x || 0}
                onChange={(e) => {
                  const newX = parseInt(e.target.value)
                  setAdjustParams(prev => ({
                    ...prev,
                    [currentEditingIcon]: { ...prev[currentEditingIcon], x: newX }
                  }))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Y位置 */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>垂直</span>
                <span className="font-mono">{adjustParams[currentEditingIcon]?.y || 0}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustParams[currentEditingIcon]?.y || 0}
                onChange={(e) => {
                  const newY = parseInt(e.target.value)
                  setAdjustParams(prev => ({
                    ...prev,
                    [currentEditingIcon]: { ...prev[currentEditingIcon], y: newY }
                  }))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleReupload}
                className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
              >
                重新上传
              </button>
              <button
                onClick={() => {
                  if (currentEditingIcon) {
                    deleteUIIcon(currentEditingIcon)
                    setCustomIcons(prev => {
                      const newIcons = { ...prev }
                      delete newIcons[currentEditingIcon]
                      return newIcons
                    })
                    setCurrentEditingIcon(null)
                  }
                }}
                className="flex-1 py-2 bg-red-50 text-red-500 text-xs font-medium rounded-lg hover:bg-red-100"
              >
                删除
              </button>
            </div>
            <button
              onClick={() => {
                const allParams = { ...adjustParams }
                localStorage.setItem('iconAdjustParams', JSON.stringify(allParams))
                window.dispatchEvent(new CustomEvent('iconAdjust', { detail: allParams }))
                setShowFloatingPreview(false)
              }}
              className="w-full py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600"
            >
              保存调整
            </button>
          </div>
          
          {/* 右下角调整大小手柄 */}
          <div
            className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
            onMouseDown={(e) => {
              e.stopPropagation()
              setIsResizing(true)
              setDragOffset({ x: e.clientX, y: e.clientY })
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
              setIsResizing(true)
              setDragOffset({ x: e.touches[0].clientX, y: e.touches[0].clientY })
            }}
          >
            <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22Z" />
            </svg>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入框 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleIconUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 z-0 scrollbar-hide">
        <div className="flex flex-col items-center gap-8">

          {/* 视图切换 */}
          <div className="flex p-1 bg-white/40 backdrop-blur-md rounded-full border border-white/40 shadow-sm">
            {[
              { id: 'main', label: '主界面' },
              { id: 'chat', label: '聊天' },
              { id: 'desktop', label: '桌面' },
              { id: 'menu', label: '菜单' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${currentView === view.id
                  ? 'bg-white text-[#2C2C2C] shadow-sm'
                  : 'text-[#8C8C8C] hover:text-[#5A5A5A]'
                  }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* 预览区域 */}
          <div className="w-[300px] h-[600px] relative shadow-2xl rounded-[44px] border-[8px] border-white/40 overflow-hidden bg-white/20 ring-1 ring-black/5 backdrop-blur-sm">
            {currentView === 'main' && <MainView />}
            {currentView === 'chat' && <ChatView />}
            {currentView === 'desktop' && <DesktopView />}
            {currentView === 'menu' && <MenuView />}
          </div>

          <p className="text-xs text-[#8C8C8C] font-light text-center max-w-xs leading-relaxed">
            点击预览中的元素上传自定义图标
            <br />
            支持透明 PNG 图片
          </p>

        </div>
      </div>
    </div>
  )
}

export default GlobalDecoration
