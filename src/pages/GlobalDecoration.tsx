/**
 * 全局美化页面 - 界面图标自定义预览
 * 提供聊天界面和主界面的图标美化功能
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import {
  ChatIcon, MusicIcon, ForumIcon, DecorationIcon, SettingsIcon,
  BookIcon, MemoryIcon, CalendarIcon, GameIcon, PhoneIcon, BrowserIcon, ImageIcon
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
  // 桌面应用图标
  'wechat-app': '微信',
  'preset': '预设',
  'worldbook': '世界书',
  'music-app': '音乐',
  'customize': '系统设置',
  'decoration': '美化',
  'instagram': '论坛',
  'aiphone': '查手机',
  'api-config': 'API',
  'global-memory': '记忆',
  // 桌面第二页图标
  'desktop-calendar': '桌面-日历',
  'desktop-theater': '桌面-小剧场',
  'desktop-phone': '桌面-电话',
  'desktop-game': '桌面-游戏'
}

const GlobalDecoration = () => {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState<'main' | 'chat' | 'desktop'>('main')
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  const [desktopIcons, setDesktopIcons] = useState<Array<{ appId: string, icon: string }>>([])
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5 }) // MB
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentEditingIcon, setCurrentEditingIcon] = useState<string | null>(null)

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

      const desktopAppIds = ['wechat-app', 'preset', 'worldbook', 'music-app', 'customize', 'decoration', 'instagram', 'aiphone', 'api-config', 'global-memory', 'desktop-calendar', 'desktop-theater', 'desktop-phone', 'desktop-game']
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

  // 点击图标触发上传
  const handleIconClick = (iconId: string) => {
    setCurrentEditingIcon(iconId)
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }, 0)
  }

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
        <span className="text-sm font-medium text-slate-800">联系人</span>
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
        <div
          className="w-7 h-7 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
          onClick={(e) => { e.stopPropagation(); handleIconClick('chat-voice') }}
          style={customIcons['chat-voice'] ? { backgroundImage: `url(${customIcons['chat-voice']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
        />
        <div className="flex-1 h-9 bg-white rounded-full border border-slate-200" />
        <div
          className="w-7 h-7 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
          onClick={(e) => { e.stopPropagation(); handleIconClick('chat-emoji') }}
          style={customIcons['chat-emoji'] ? { backgroundImage: `url(${customIcons['chat-emoji']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
        />
        <div
          className="w-7 h-7 bg-slate-200/50 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
          onClick={(e) => { e.stopPropagation(); handleIconClick('chat-add-btn') }}
          style={customIcons['chat-add-btn'] ? { backgroundImage: `url(${customIcons['chat-add-btn']})`, backgroundSize: 'cover', backgroundColor: 'transparent' } : {}}
        />
      </div>
    </div>
  )

  // 桌面预览
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
      title="点击空白处上传桌面背景"
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

      {/* 应用图标网格 */}
      <div className="flex-1 px-3 grid grid-cols-4 gap-x-2 gap-y-3 content-start desktop-bg-area">
        {[
          { id: 'wechat-app', label: '微信', icon: <ChatIcon className="w-5 h-5 text-green-500" /> },
          { id: 'music-app', label: '音乐', icon: <MusicIcon className="w-5 h-5 text-pink-500" /> },
          { id: 'instagram', label: '论坛', icon: <ForumIcon className="w-5 h-5 text-orange-500" /> },
          { id: 'decoration', label: '美化', icon: <DecorationIcon className="w-5 h-5 text-purple-500" /> },
          { id: 'api-config', label: 'API', icon: <SettingsIcon className="w-5 h-5 text-blue-500" /> },
          { id: 'customize', label: '设置', icon: <SettingsIcon className="w-5 h-5 text-slate-500" /> },
          { id: 'worldbook', label: '世界书', icon: <BookIcon className="w-5 h-5 text-amber-600" /> },
          { id: 'global-memory', label: '记忆', icon: <MemoryIcon className="w-5 h-5 text-cyan-500" /> },
          { id: 'desktop-calendar', label: '日历', icon: <CalendarIcon className="w-5 h-5 text-red-500" /> },
          { id: 'desktop-theater', label: '小剧场', icon: <GameIcon className="w-5 h-5 text-indigo-500" /> },
          { id: 'desktop-game', label: '游戏', icon: <GameIcon className="w-5 h-5 text-emerald-500" /> },
          { id: 'aiphone', label: '查手机', icon: <PhoneIcon className="w-5 h-5 text-teal-500" /> }
        ].map(app => {
          const customIcon = desktopIcons.find(i => i.appId === app.id)?.icon
          return (
            <div key={app.id} className="flex flex-col items-center gap-0.5">
              <div
                className="w-10 h-10 rounded-xl bg-white shadow-md cursor-pointer hover:scale-105 transition-transform flex items-center justify-center overflow-hidden"
                onClick={(e) => { e.stopPropagation(); handleIconClick(app.id) }}
              >
                {customIcon ? (
                  <img src={customIcon} alt={app.label} className="w-full h-full object-cover" />
                ) : (
                  app.icon
                )}
              </div>
              <span className="text-[8px] text-white font-medium drop-shadow-md">{app.label}</span>
            </div>
          )
        })}
      </div>

      {/* 底部Dock栏 */}
      <div className="mx-3 mb-3 p-2 bg-white/20 backdrop-blur-xl rounded-2xl flex justify-around items-center">
        {[
          { id: 'desktop-phone', icon: <PhoneIcon className="w-5 h-5 text-green-500" /> },
          { id: 'desktop-message', icon: <ChatIcon className="w-5 h-5 text-green-400" /> },
          { id: 'desktop-browser', icon: <BrowserIcon className="w-5 h-5 text-blue-500" /> },
          { id: 'desktop-camera', icon: <ImageIcon className="w-5 h-5 text-slate-600" /> }
        ].map(app => {
          const customIcon = desktopIcons.find(i => i.appId === app.id)?.icon
          return (
            <div
              key={app.id}
              className="w-10 h-10 rounded-xl bg-white shadow-sm cursor-pointer hover:scale-110 transition-transform flex items-center justify-center overflow-hidden"
              onClick={(e) => { e.stopPropagation(); handleIconClick(app.id) }}
            >
              {customIcon ? (
                <img src={customIcon} alt="" className="w-full h-full object-cover" />
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
          <span className="text-[10px] text-[#8C8C8C] font-mono bg-white/40 px-3 py-1 rounded-full border border-white/40 backdrop-blur-sm">
            {storageUsage.used.toFixed(1)}MB / {storageUsage.total.toFixed(0)}MB
          </span>
        </div>
      </div>

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
              { id: 'desktop', label: '桌面' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id as any)}
                className={`px-6 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${currentView === view.id
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
