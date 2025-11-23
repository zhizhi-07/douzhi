/**
 * 全局美化页面 - 界面图标自定义预览
 * 提供聊天界面和主界面的图标美化功能
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { 
  saveUIIcon, 
  getAllUIIcons, 
  deleteUIIcon, 
  clearAllUIIcons,
  saveDesktopIcon,
  getAllDesktopIcons,
  deleteDesktopIcon,
  clearAllDesktopIcons,
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
  'nav-chat': '微信',
  'nav-contacts': '通讯录',
  'nav-discover': '发现',
  'nav-me': '我',
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
  'chat-topbar-bg': '聊天顶栏背景',
  'chat-bottombar-bg': '聊天底栏背景',
  'chat-input-bg': '输入框背景',
  'main-topbar-bg': '主界面顶栏背景',
  'main-bottombar-bg': '主界面底栏背景',
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
  const [desktopIcons, setDesktopIcons] = useState<Array<{appId: string, icon: string}>>([])
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5 }) // MB
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentEditingIcon, setCurrentEditingIcon] = useState<string | null>(null)
  const [isAdjustingPosition, setIsAdjustingPosition] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [iconScale, setIconScale] = useState(100)
  const [iconX, setIconX] = useState(0)
  const [iconY, setIconY] = useState(0)
  
  // 每个图标独立的调整参数缓存
  const [adjustParams, setAdjustParams] = useState<Record<string, {scale: number, x: number, y: number}>>({
    'main-topbar-bg': {scale: 100, x: 0, y: 0},
    'main-bottombar-bg': {scale: 100, x: 0, y: 0},
    'chat-topbar-bg': {scale: 100, x: 0, y: 0},
    'chat-bottombar-bg': {scale: 100, x: 0, y: 0},
    'desktop-time-bg': {scale: 100, x: 0, y: 0}
  })
  const [hasInput, setHasInput] = useState(false) // 控制发送/AI按钮状态
  const [showAddMenu, setShowAddMenu] = useState(true) // 控制加号菜单显示，默认显示
  
  // 背景状态 - 从缓存同步初始化，避免闪烁
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
      console.log(`📊 存储使用: ${usedMB.toFixed(2)}MB / ${(totalMB || 50).toFixed(0)}MB`)
    } catch (error) {
      console.error('获取存储使用量失败:', error)
    }
  }

  // 加载已保存的图标配置（UI图标）
  useEffect(() => {
    const loadIcons = async () => {
      try {
        // 先从IndexedDB加载
        let icons = await getAllUIIcons()
        
        // 如果IndexedDB是空的，从localStorage恢复
        if (Object.keys(icons).length === 0) {
          console.log('📦 IndexedDB为空，从localStorage恢复...')
          const localData = localStorage.getItem('ui_custom_icons')
          if (localData) {
            icons = JSON.parse(localData)
            // 迁移到IndexedDB
            for (const [key, value] of Object.entries(icons)) {
              await saveUIIcon(key, value)
            }
            console.log('✅ 已从localStorage恢复', Object.keys(icons).length, '个UI图标')
            // 迁移完成后删除localStorage数据，释放空间
            localStorage.removeItem('ui_custom_icons')
            console.log('🗑️ 已清理localStorage备份，释放空间')
          }
        }
        
        setCustomIcons(icons)
        
        // 加载调整参数
        const newAdjustParams = {
          'main-topbar-bg': {
            scale: parseInt(localStorage.getItem('main-topbar-bg-scale') || '100'),
            x: parseInt(localStorage.getItem('main-topbar-bg-x') || '0'),
            y: parseInt(localStorage.getItem('main-topbar-bg-y') || '0')
          },
          'main-bottombar-bg': {
            scale: parseInt(localStorage.getItem('main-bottombar-bg-scale') || '100'),
            x: parseInt(localStorage.getItem('main-bottombar-bg-x') || '0'),
            y: parseInt(localStorage.getItem('main-bottombar-bg-y') || '0')
          },
          'chat-topbar-bg': {
            scale: parseInt(localStorage.getItem('chat-topbar-bg-scale') || '100'),
            x: parseInt(localStorage.getItem('chat-topbar-bg-x') || '0'),
            y: parseInt(localStorage.getItem('chat-topbar-bg-y') || '0')
          },
          'chat-bottombar-bg': {
            scale: parseInt(localStorage.getItem('chat-bottombar-bg-scale') || '100'),
            x: parseInt(localStorage.getItem('chat-bottombar-bg-x') || '0'),
            y: parseInt(localStorage.getItem('chat-bottombar-bg-y') || '0')
          },
          'desktop-time-bg': {
            scale: parseInt(localStorage.getItem('desktop-time-bg-scale') || '100'),
            x: parseInt(localStorage.getItem('desktop-time-bg-x') || '0'),
            y: parseInt(localStorage.getItem('desktop-time-bg-y') || '0')
          }
        }
        setAdjustParams(newAdjustParams)
        console.log('✅ 已加载UI图标配置:', Object.keys(icons).length, '个')
        
        updateStorageUsage()
      } catch (error) {
        console.error('❌ 加载UI图标配置失败:', error)
        // 出错时从localStorage加载
        try {
          const localData = localStorage.getItem('ui_custom_icons')
          if (localData) {
            const icons = JSON.parse(localData)
            setCustomIcons(icons)
            console.log('✅ 从localStorage备份恢复:', Object.keys(icons).length, '个')
          }
        } catch (err) {
          console.error('备份恢复也失败:', err)
        }
      }
    }
    loadIcons()
  }, [])

  // 加载桌面应用图标配置
  useEffect(() => {
    const loadIcons = async () => {
      try {
        let icons = await getAllDesktopIcons()
        
        // 如果IndexedDB是空的，从localStorage恢复
        if (icons.length === 0) {
          console.log('📦 IndexedDB为空，从localStorage恢复桌面图标...')
          const localData = localStorage.getItem('custom_icons')
          if (localData) {
            icons = JSON.parse(localData)
            // 迁移到IndexedDB
            for (const item of icons) {
              await saveDesktopIcon(item.appId, item.icon)
            }
            console.log('✅ 已从localStorage恢复', icons.length, '个桌面图标')
            // 迁移完成后删除localStorage数据，释放空间
            localStorage.removeItem('custom_icons')
            console.log('🗑️ 已清理localStorage备份，释放空间')
          }
        }
        
        setDesktopIcons(icons)
        console.log('✅ 已加载桌面图标配置:', icons.length, '个')
      } catch (error) {
        console.error('❌ 加载桌面图标配置失败:', error)
        // 出错时从localStorage加载
        try {
          const localData = localStorage.getItem('custom_icons')
          if (localData) {
            const icons = JSON.parse(localData)
            setDesktopIcons(icons)
            console.log('✅ 从localStorage备份恢复桌面图标:', icons.length, '个')
          }
        } catch (err) {
          console.error('备份恢复也失败:', err)
        }
      }
    }
    loadIcons()
  }, [])

  // 加载背景图片（仅在缓存不存在时）
  useEffect(() => {
    const loadBackgrounds = async () => {
      // 只在当前状态为空时才异步加载
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
    // 不再需要，已经在上传时单独保存
    console.log('📝 图标已通过IndexedDB单独保存')
    
    // 更新存储使用量显示
    await updateStorageUsage()
    
    // 触发自定义事件，通知其他页面更新
    window.dispatchEvent(new Event('uiIconsChanged'))
  }

  // 保存桌面图标配置到IndexedDB
  const saveDesktopIconsToStorage = async () => {
    // 不再需要，已经在上传时单独保存
    console.log('📝 桌面图标已通过IndexedDB单独保存')
    
    // 触发自定义事件，通知Desktop页面更新
    window.dispatchEvent(new CustomEvent('iconChanged'))
  }

  // 压缩图片（返回Blob，节省30%存储空间）
  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // 计算缩放比例
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

          // 检查是否是PNG（同时检查MIME类型和文件扩展名）
          const isPNG = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
          console.log(`🔍 透明度检查: file.type=${file.type}, file.name=${file.name}, isPNG=${isPNG}`)
          
          if (!isPNG) {
            // 非PNG图片，填充白色背景
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, width, height)
            console.log('⚪ 填充白色背景（非PNG图片）')
          } else {
            console.log('✨ 保持透明背景（PNG图片）')
          }

          ctx.drawImage(img, 0, 0, width, height)
          
          // 根据原始格式选择输出格式
          // PNG保留透明通道，其他格式转JPEG
          const outputFormat = isPNG ? 'image/png' : 'image/jpeg'
          // PNG使用1.0质量保持透明度，避免黑底
          const outputQuality = isPNG ? 1.0 : quality
          console.log(`🖼️ 图片压缩: 原格式=${file.type}, 输出=${outputFormat}, 质量=${outputQuality}`)
          canvas.toBlob((blob) => {
            if (blob) {
              console.log(`✅ Blob生成成功: type=${blob.type}, size=${blob.size}字节`)
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
    console.log('上传文件:', file?.name, file?.size, '字节')
    
    if (!file) {
      console.log('没有选择文件')
      return
    }
    
    if (!currentEditingIcon) {
      console.log('没有设置当前编辑的图标')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) {
      alert('图片文件太大，请选择小于10MB的图片')
      return
    }

    try {
      console.log('🔄 正在压缩图片...')
      
      // 根据图标类型选择不同的压缩参数
      const isBackground = currentEditingIcon.includes('-bg')
      const maxWidth = isBackground ? 800 : 200
      const maxHeight = isBackground ? 400 : 200
      const quality = 0.8
      
      const compressedBlob = await compressImage(file, maxWidth, maxHeight, quality)
      const compressedSize = compressedBlob.size
      const compressionRatio = ((1 - compressedSize / file.size) * 100).toFixed(1)
      
      console.log(`✅ 压缩完成: ${(file.size / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (减少${compressionRatio}%)`)  
      console.log(`💾 使用Blob存储，相比base64节省约30%空间`)
      
      // 创建预览URL
      const result = URL.createObjectURL(compressedBlob)
      console.log('✅ 文件读取成功，更新图标:', currentEditingIcon)
      
      // 判断是背景、桌面应用图标还是UI图标
      const desktopAppIds = ['wechat-app', 'preset', 'worldbook', 'music-app', 'customize', 'decoration', 'instagram', 'aiphone', 'api-config', 'global-memory', 'desktop-calendar', 'desktop-theater', 'desktop-phone', 'desktop-game']
      const backgroundIds = ['desktop-wallpaper', 'wechat-wallpaper']
      
      if (backgroundIds.includes(currentEditingIcon)) {
        // 背景图片 - 直接存储Blob
        const key = currentEditingIcon === 'desktop-wallpaper' ? 'desktop_bg' : 'wechat_bg'
        await saveImage(key, compressedBlob)
        
        if (currentEditingIcon === 'desktop-wallpaper') {
          setDesktopBg(result)
          window.dispatchEvent(new Event('desktopBackgroundUpdate'))
        } else {
          setWechatBg(result)
          window.dispatchEvent(new Event('wechatBackgroundUpdate'))
        }
        console.log('✅ 背景图片已上传:', currentEditingIcon)
      } else if (desktopAppIds.includes(currentEditingIcon)) {
        // 桌面应用图标 - 直接存储Blob
        await saveDesktopIcon(currentEditingIcon, compressedBlob)
        
        // 更新state（使用ObjectURL作为预览）
        const existingIndex = desktopIcons.findIndex(item => item.appId === currentEditingIcon)
        let newDesktopIcons
        if (existingIndex >= 0) {
          newDesktopIcons = [...desktopIcons]
          newDesktopIcons[existingIndex] = { appId: currentEditingIcon, icon: result }
        } else {
          newDesktopIcons = [...desktopIcons, { appId: currentEditingIcon, icon: result }]
        }
        setDesktopIcons(newDesktopIcons)
        
        // 不再备份到localStorage，已经通过IndexedDB存储
        
        // 触发事件通知Desktop更新
        window.dispatchEvent(new CustomEvent('iconChanged'))
        console.log('✅ 桌面图标已上传并触发事件:', currentEditingIcon)
      } else {
        // UI图标 - 直接存储Blob
        await saveUIIcon(currentEditingIcon, compressedBlob)
        
        // 更新state
        const newIcons = {
          ...customIcons,
          [currentEditingIcon]: result
        }
        setCustomIcons(newIcons)
        
        // 🔥 同时更新 sessionStorage 缓存，确保其他页面能立即看到
        sessionStorage.setItem('__preloaded_icons__', JSON.stringify(newIcons))
        
        // 触发事件
        await saveIconsToStorage(newIcons)
        console.log('✅ UI图标已上传:', iconNameMap[currentEditingIcon] || currentEditingIcon)
        
        // 🔥 显示成功提示
        alert(`✅ ${iconNameMap[currentEditingIcon] || currentEditingIcon} 上传成功！\n返回主界面即可看到效果。`)
      }
      
      setCurrentEditingIcon(null)
      // 重置input，允许重复上传同一文件
      if (event.target) {
        event.target.value = ''
      }
    } catch (error) {
      console.error('图片处理失败:', error)
      alert(`图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setCurrentEditingIcon(null)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  // 点击图标触发上传
  const handleIconClick = (iconId: string) => {
    console.log('🖱️ 点击图标:', iconNameMap[iconId] || iconId, '| ID:', iconId)
    console.log('📁 fileInputRef:', fileInputRef.current ? '已找到' : '❌ 未找到')
    setCurrentEditingIcon(iconId)
    
    // 延迟一下再触发，确保state更新
    setTimeout(() => {
      if (fileInputRef.current) {
        console.log('✅ 正在打开文件选择器...')
        fileInputRef.current.click()
      } else {
        console.error('❌ 文件输入框不存在！')
      }
    }, 0)
  }

  // 删除单个UI图标
  const handleDeleteIcon = async (iconId: string) => {
    await deleteUIIcon(iconId)
    const newIcons = { ...customIcons }
    delete newIcons[iconId]
    setCustomIcons(newIcons)
    
    await saveIconsToStorage(newIcons)
  }

  // 删除单个桌面图标
  const handleDeleteDesktopIcon = async (appId: string) => {
    await deleteDesktopIcon(appId)
    const newDesktopIcons = desktopIcons.filter(item => item.appId !== appId)
    setDesktopIcons(newDesktopIcons)
    
    await saveDesktopIconsToStorage()
  }

  // 主界面预览（ChatList）
  const MainView = () => (
    <div 
      className="w-full h-full bg-gray-100 flex flex-col relative cursor-pointer group"
      onClick={(e) => {
        // 只有点击空白区域才上传背景
        if ((e.target as HTMLElement).className.includes('bg-gray-100')) {
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
        className="bg-white px-4 pt-8 pb-5 relative cursor-pointer hover:ring-2 hover:ring-inset hover:ring-blue-400"
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName !== 'DIV' || (e.target as HTMLElement).className.includes('w-5')) return;
          e.stopPropagation()
          if (customIcons['main-topbar-bg']) {
            setSelectedIcon('main-topbar-bg')
            const scale = localStorage.getItem('main-topbar-bg-scale')
            const x = localStorage.getItem('main-topbar-bg-x')
            const y = localStorage.getItem('main-topbar-bg-y')
            setIconScale(scale ? parseInt(scale) : 100)
            setIconX(x ? parseInt(x) : 0)
            setIconY(y ? parseInt(y) : 0)
          } else {
            handleIconClick('main-topbar-bg')
          }
        }}
        style={customIcons['main-topbar-bg'] ? {
          backgroundImage: `url(${customIcons['main-topbar-bg']})`,
          backgroundSize: `${adjustParams['main-topbar-bg']?.scale || 100}%`,
          backgroundPosition: `calc(50% + ${adjustParams['main-topbar-bg']?.x || 0}px) calc(50% + ${adjustParams['main-topbar-bg']?.y || 0}px)`,
          backgroundRepeat: 'no-repeat'
        } : {}}
        title="点击空白处更换顶栏背景"
      >
        <div className="flex items-center justify-between relative z-10">
          <h1 className="text-xl font-semibold text-gray-900" style={{textShadow: '0 1px 2px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6)'}}>微信</h1>
          <div className="flex items-center gap-3">
            {/* 群聊按钮 */}
            <div 
              className="w-5 h-5 bg-gray-300 rounded cursor-pointer hover:ring-2 hover:ring-blue-400"
              onClick={(e) => {
                e.stopPropagation()
                handleIconClick('main-group')
              }}
              style={customIcons['main-group'] ? {
                backgroundImage: `url(${customIcons['main-group']})`,
                backgroundSize: 'cover',
                backgroundColor: 'transparent'
              } : {}}
              title="点击更换群聊图标"
            />
            {/* 加号按钮 */}
            <div 
              className="w-5 h-5 bg-gray-300 rounded cursor-pointer hover:ring-2 hover:ring-blue-400"
              onClick={(e) => {
                e.stopPropagation()
                handleIconClick('main-add')
              }}
              style={customIcons['main-add'] ? {
                backgroundImage: `url(${customIcons['main-add']})`,
                backgroundSize: 'cover',
                backgroundColor: 'transparent'
              } : {}}
              title="点击更换加号图标"
            />
          </div>
        </div>
      </div>

      {/* 聊天列表 */}
      <div className="flex-1 px-4 pt-3 space-y-2 overflow-auto">
        {['联系人 1', '联系人 2'].map((name, i) => (
          <div key={i} className="glass-card rounded-2xl p-3 flex items-center gap-3">
            <div 
              className="w-12 h-12 bg-gray-200 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400"
              onClick={(e) => {
                e.stopPropagation()
                handleIconClick(`avatar-${i + 1}`)
              }}
              style={customIcons[`avatar-${i + 1}`] ? {
                backgroundImage: `url(${customIcons[`avatar-${i + 1}`]})`,
                backgroundSize: 'cover',
                backgroundColor: 'transparent'
              } : {}}
              title="点击更换头像"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-800">{name}</span>
                <span className="text-xs text-gray-400">12:30</span>
              </div>
              <span className="text-xs text-gray-500">最后一条消息...</span>
            </div>
          </div>
        ))}
      </div>

      {/* 底部导航栏 */}
      <div 
        className="bg-white h-14 flex items-center justify-around border-t border-gray-100 relative cursor-pointer hover:ring-2 hover:ring-inset hover:ring-blue-400"
        onClick={(e) => {
          if ((e.target as HTMLElement).className.includes('w-6') || (e.target as HTMLElement).className.includes('text-')) return;
          e.stopPropagation()
          if (customIcons['main-bottombar-bg']) {
            setSelectedIcon('main-bottombar-bg')
            const scale = localStorage.getItem('main-bottombar-bg-scale')
            const x = localStorage.getItem('main-bottombar-bg-x')
            const y = localStorage.getItem('main-bottombar-bg-y')
            setIconScale(scale ? parseInt(scale) : 100)
            setIconX(x ? parseInt(x) : 0)
            setIconY(y ? parseInt(y) : 0)
          } else {
            handleIconClick('main-bottombar-bg')
          }
        }}
        style={customIcons['main-bottombar-bg'] ? {
          backgroundImage: `url(${customIcons['main-bottombar-bg']})`,
          backgroundSize: `${adjustParams['main-bottombar-bg']?.scale || 100}%`,
          backgroundPosition: `calc(50% + ${adjustParams['main-bottombar-bg']?.x || 0}px) calc(50% + ${adjustParams['main-bottombar-bg']?.y || 0}px)`,
          backgroundRepeat: 'no-repeat'
        } : {}}
        title="点击空白处更换底栏背景"
      >
        {[
          { id: 'nav-chat', label: '聊天' },
          { id: 'nav-contacts', label: '通讯录' },
          { id: 'nav-discover', label: '发现' },
          { id: 'nav-me', label: '我' }
        ].map(item => (
          <div key={item.id} className="flex flex-col items-center gap-1 relative z-10">
            <div 
              className="w-6 h-6 bg-gray-300 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-400"
              onClick={(e) => {
                e.stopPropagation()
                handleIconClick(item.id)
              }}
              style={customIcons[item.id] ? {
                backgroundImage: `url(${customIcons[item.id]})`,
                backgroundSize: 'cover',
                backgroundColor: 'transparent'
              } : {}}
              title={`点击更换${item.label}图标`}
            />
            <span className="text-[10px] text-gray-600" style={{textShadow: '0 1px 2px rgba(255,255,255,0.8)'}}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // 聊天界面预览
  const ChatView = () => (
    <div className="w-full h-full bg-gray-100 flex flex-col">
      {/* 顶部栏 - 增加高度匹配实际（StatusBar + 内容） */}
      <div 
        className="bg-white relative cursor-pointer hover:ring-2 hover:ring-inset hover:ring-blue-400"
        onClick={(e) => {
          // 检查是否点击了子元素（返回按钮、更多按钮）
          const target = e.target as HTMLElement
          if (target.className.includes('w-6 h-6') || target.closest('.w-6.h-6')) {
            return // 点击了按钮，不处理
          }
          e.stopPropagation()
          if (customIcons['chat-topbar-bg']) {
            setSelectedIcon('chat-topbar-bg')
            const scale = localStorage.getItem('chat-topbar-bg-scale')
            const x = localStorage.getItem('chat-topbar-bg-x')
            const y = localStorage.getItem('chat-topbar-bg-y')
            setIconScale(scale ? parseInt(scale) : 100)
            setIconX(x ? parseInt(x) : 0)
            setIconY(y ? parseInt(y) : 0)
          } else {
            handleIconClick('chat-topbar-bg')
          }
        }}
        style={customIcons['chat-topbar-bg'] ? {
          backgroundImage: `url(${customIcons['chat-topbar-bg']})`,
          backgroundSize: `${adjustParams['chat-topbar-bg']?.scale || 100}%`,
          backgroundPosition: `calc(50% + ${adjustParams['chat-topbar-bg']?.x || 0}px) calc(50% + ${adjustParams['chat-topbar-bg']?.y || 0}px)`,
          backgroundRepeat: 'no-repeat'
        } : {}}
        title="点击空白处更换顶栏背景"
      >
        {/* StatusBar占位 */}
        <div className="h-6 bg-transparent"></div>
        {/* 实际内容区 */}
        <div className="flex items-center px-4 gap-3 py-3 relative z-10">
          <div 
          className="w-6 h-6 bg-gray-300 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400"
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick('chat-back')
          }}
          style={customIcons['chat-back'] ? {
            backgroundImage: `url(${customIcons['chat-back']})`,
            backgroundSize: 'cover',
            backgroundColor: 'transparent'
          } : {}}
          title="点击更换返回按钮"
        />
        <div className="flex-1 text-center">
          <span className="text-sm font-medium text-gray-700" style={{textShadow: '0 1px 2px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6)'}}>联系人名称</span>
        </div>
        <div 
          className="w-6 h-6 bg-gray-300 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400"
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick('chat-more')
          }}
          style={customIcons['chat-more'] ? {
            backgroundImage: `url(${customIcons['chat-more']})`,
            backgroundSize: 'cover',
            backgroundColor: 'transparent'
          } : {}}
          title="点击更换更多按钮"
        />
        </div>
      </div>

      {/* 聊天内容区 */}
      <div 
        className="flex-1 bg-gray-50 p-4 space-y-3 relative cursor-pointer"
        onClick={(e) => {
          // 只有点击空白区域才上传背景
          if ((e.target as HTMLElement).className.includes('bg-gray-50')) {
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
        <div className="flex gap-2">
          <div 
            className="w-10 h-10 bg-gray-200 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400"
            onClick={(e) => {
              e.stopPropagation()
              handleIconClick('chat-avatar-1')
            }}
            style={customIcons['chat-avatar-1'] ? {
              backgroundImage: `url(${customIcons['chat-avatar-1']})`,
              backgroundSize: 'cover',
              backgroundColor: 'transparent'
            } : {}}
            title="对方头像"
          />
          <div className="glass-card rounded-2xl rounded-tl-none px-4 py-2 max-w-[70%]">
            <span className="text-sm">你好，这是一条消息</span>
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-[70%]">
            <span className="text-sm">这是回复消息</span>
          </div>
          <div 
            className="w-10 h-10 bg-gray-200 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400"
            onClick={(e) => {
              e.stopPropagation()
              handleIconClick('chat-avatar-2')
            }}
            style={customIcons['chat-avatar-2'] ? {
              backgroundImage: `url(${customIcons['chat-avatar-2']})`,
              backgroundSize: 'cover',
              backgroundColor: 'transparent'
            } : {}}
            title="我的头像"
          />
        </div>
      </div>

      {/* 底部输入栏 */}
      <div 
        className="bg-white h-14 flex items-center px-3 gap-2 border-t border-gray-100 relative cursor-pointer hover:ring-2 hover:ring-inset hover:ring-blue-400"
        onClick={(e) => {
          // 检查是否点击了按钮
          const target = e.target as HTMLElement
          if (target.closest('.w-7') || target.closest('.flex-1')) {
            return
          }
          e.stopPropagation()
          if (customIcons['chat-bottombar-bg']) {
            setSelectedIcon('chat-bottombar-bg')
            const scale = localStorage.getItem('chat-bottombar-bg-scale')
            const x = localStorage.getItem('chat-bottombar-bg-x')
            const y = localStorage.getItem('chat-bottombar-bg-y')
            setIconScale(scale ? parseInt(scale) : 100)
            setIconX(x ? parseInt(x) : 0)
            setIconY(y ? parseInt(y) : 0)
          } else {
            handleIconClick('chat-bottombar-bg')
          }
        }}
        style={customIcons['chat-bottombar-bg'] ? {
          backgroundImage: `url(${customIcons['chat-bottombar-bg']})`,
          backgroundSize: `${adjustParams['chat-bottombar-bg']?.scale || 100}%`,
          backgroundPosition: `calc(50% + ${adjustParams['chat-bottombar-bg']?.x || 0}px) calc(50% + ${adjustParams['chat-bottombar-bg']?.y || 0}px)`,
          backgroundRepeat: 'no-repeat'
        } : {}}
        title="点击空白处更换底栏背景"
      >
        {/* 加号按钮 */}
        <div 
          className="w-7 h-7 bg-gray-300 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400 flex items-center justify-center relative z-10"
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick('chat-add-btn')
          }}
          style={customIcons['chat-add-btn'] ? {
            backgroundImage: `url(${customIcons['chat-add-btn']})`,
            backgroundSize: 'cover',
            backgroundColor: 'transparent'
          } : {}}
          title="点击更换加号按钮"
        >
          {!customIcons['chat-add-btn'] && (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
        
        {/* 输入框 */}
        <div 
          className="flex-1 bg-gray-100 rounded-full h-9 px-3 flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-blue-400 relative group z-10"
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick('chat-input-bg')
          }}
          style={customIcons['chat-input-bg'] ? {
            backgroundImage: `url(${customIcons['chat-input-bg']})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
          title="点击更换输入框背景"
        >
          <span className="text-sm text-gray-400">输入消息...</span>
          <span className="text-[10px] text-blue-500 opacity-60 group-hover:opacity-100">换背景</span>
        </div>
        
        {/* 底栏背景上传按钮 */}
        <div
          className="w-7 h-7 bg-blue-50 rounded-full cursor-pointer hover:bg-blue-100 flex items-center justify-center relative z-10"
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick('chat-bottombar-bg')
          }}
          title="点击更换底栏背景"
        >
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* 表情按钮 */}
        <div 
          className="w-7 h-7 bg-gray-300 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400 relative z-10"
          onClick={(e) => {
            e.stopPropagation()
            handleIconClick('chat-emoji')
          }}
          style={customIcons['chat-emoji'] ? {
            backgroundImage: `url(${customIcons['chat-emoji']})`,
            backgroundSize: 'cover',
            backgroundColor: 'transparent'
          } : {}}
          title="点击更换表情图标"
        />
        
        {/* 发送按钮/AI回复按钮 - 根据输入状态切换 */}
        {hasInput ? (
          // 发送按钮（有输入时）
          <div 
            className="w-8 h-8 bg-gray-900 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400 flex items-center justify-center relative z-10"
            onClick={(e) => {
              e.stopPropagation()
              handleIconClick('chat-send')
            }}
            style={customIcons['chat-send'] ? {
              backgroundImage: `url(${customIcons['chat-send']})`,
              backgroundSize: 'cover',
              backgroundColor: 'transparent'
            } : {}}
            title="点击更换发送图标（有输入时）"
          >
            {!customIcons['chat-send'] && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </div>
        ) : (
          // AI回复按钮（无输入时）
          <div 
            className="w-8 h-8 bg-gray-300 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400 flex items-center justify-center relative z-10"
            onClick={(e) => {
              e.stopPropagation()
              handleIconClick('chat-ai')
            }}
            style={customIcons['chat-ai'] ? {
              backgroundImage: `url(${customIcons['chat-ai']})`,
              backgroundSize: 'cover',
              backgroundColor: 'transparent'
            } : {}}
            title="点击更换AI回复图标（无输入时）"
          >
            {!customIcons['chat-ai'] && (
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </div>
        )}
      </div>
      
      {/* 加号菜单（可见） */}
      {showAddMenu && (
        <div className="absolute bottom-16 right-4 glass-card rounded-xl shadow-lg p-3 grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
          {[
            { id: 'menu-recall', label: '重回' },
            { id: 'menu-photo', label: '相册' },
            { id: 'menu-camera', label: '拍摄' },
            { id: 'menu-transfer', label: '转账' },
            { id: 'menu-pay', label: '亲密付' },
            { id: 'menu-food', label: '外卖' },
            { id: 'menu-location', label: '位置' },
            { id: 'menu-voice', label: '语音输入' },
            { id: 'menu-video', label: '视频通话' },
            { id: 'menu-music', label: '一起听' },
            { id: 'menu-memo', label: '随笔' },
            { id: 'menu-offline', label: '线下' },
            { id: 'menu-shop', label: '网购' },
            { id: 'menu-post', label: '帖子' },
            { id: 'menu-fix', label: '修正' },
            { id: 'menu-couple', label: '情侣空间' }
          ].map(item => (
            <div key={item.id} className="flex flex-col items-center gap-1">
              <div 
                className="w-10 h-10 bg-gray-200 rounded-xl cursor-pointer hover:ring-2 hover:ring-blue-400 flex items-center justify-center overflow-hidden"
                onClick={(e) => {
                  e.stopPropagation()
                  handleIconClick(item.id)
                }}
                title={`点击更换${item.label}图标`}
              >
                {customIcons[item.id] ? (
                  <img src={customIcons[item.id]} alt={item.label} className="w-full h-full object-contain" />
                ) : null}
              </div>
              <span className="text-[10px] text-gray-600" style={{textShadow: '0 1px 2px rgba(255,255,255,0.8)'}}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // 桌面预览
  const DesktopView = () => {
    const apps = [
      { id: 'wechat-app', name: '微信' },
      { id: 'preset', name: '预设' },
      { id: 'worldbook', name: '世界书' },
      { id: 'music-app', name: '音乐' },
      { id: 'customize', name: '系统设置' },
      { id: 'decoration', name: '美化' },
      { id: 'instagram', name: '论坛' },
      { id: 'aiphone', name: '查手机' },
      { id: 'api-config', name: 'API' },
      { id: 'global-memory', name: '记忆' },
      { id: 'desktop-calendar', name: '桌面-日历' },
      { id: 'desktop-theater', name: '桌面-小剧场' },
      { id: 'desktop-phone', name: '桌面-电话' },
      { id: 'desktop-game', name: '桌面-游戏' },
    ]
    
    const getDesktopIcon = (appId: string) => {
      const icon = desktopIcons.find(item => item.appId === appId)?.icon
      if (icon) {
        console.log('🎨 桌面预览找到图标:', appId)
      }
      return icon
    }
    
    return (
      <div 
        className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col p-4 relative cursor-pointer"
        onClick={(e) => {
          // 只有点击空白区域才上传背景
          const target = e.target as HTMLElement
          if (target.className.includes('from-blue-50') || target.className.includes('text-center')) {
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
        {/* 时间显示区域 */}
        <div 
          className="relative mb-4 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            // 如果已有背景图，则选中进行调整；否则上传
            if (customIcons['desktop-time-bg']) {
              setSelectedIcon('desktop-time-bg')
              const scale = localStorage.getItem('desktop-time-bg-scale')
              const x = localStorage.getItem('desktop-time-bg-x')
              const y = localStorage.getItem('desktop-time-bg-y')
              setIconScale(scale ? parseInt(scale) : 100)
              setIconX(x ? parseInt(x) : 0)
              setIconY(y ? parseInt(y) : 0)
            } else {
              handleIconClick('desktop-time-bg')
            }
          }}
          style={customIcons['desktop-time-bg'] ? {
            backgroundImage: `url(${customIcons['desktop-time-bg']})`,
            backgroundSize: `${adjustParams['desktop-time-bg']?.scale || 100}%`,
            backgroundPosition: `calc(50% + ${adjustParams['desktop-time-bg']?.x || 0}px) calc(50% + ${adjustParams['desktop-time-bg']?.y || 0}px)`,
            backgroundRepeat: 'no-repeat'
          } : {}}
          title={customIcons['desktop-time-bg'] ? "点击选择调整" : "点击上传时间背景图"}
        >
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-gray-900">
              {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </div>
        
        <div className="text-center mb-4">
          <h3 className="text-sm font-medium text-gray-700">桌面应用 ({desktopIcons.length}个已自定义)</h3>
        </div>
        <div className="grid grid-cols-4 gap-4 flex-1 content-start">
          {apps.map(app => {
            const hasIcon = !!getDesktopIcon(app.id)
            return (
            <div key={`${app.id}-${hasIcon}`} className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 bg-white/80 backdrop-blur rounded-2xl cursor-pointer hover:ring-2 hover:ring-blue-400 flex items-center justify-center shadow-lg transition-all active:scale-95"
                onClick={(e) => {
                  e.stopPropagation()
                  console.log('🖱️ 点击桌面图标:', app.name, '| ID:', app.id)
                  handleIconClick(app.id)
                }}
                title={`点击更换${app.name}图标`}
              >
                {getDesktopIcon(app.id) ? (
                  <img src={getDesktopIcon(app.id)!} alt={app.name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-700 text-center">{app.name}</span>
            </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 状态栏 */}
      <StatusBar />
      
      {/* 顶部工具栏 - 适配手机端 */}
      <div className="bg-white shadow-sm px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-base md:text-lg font-medium text-gray-800">界面美化</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* 视图切换 */}
          <div className="flex bg-gray-100 rounded-xl p-0.5 md:p-1">
            <button
              onClick={() => setCurrentView('main')}
              className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                currentView === 'main' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              主界面
            </button>
            <button
              onClick={() => setCurrentView('chat')}
              className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                currentView === 'chat' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              聊天界面
            </button>
            <button
              onClick={() => setCurrentView('desktop')}
              className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                currentView === 'desktop' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              桌面
            </button>
          </div>

          {/* 调整按钮 */}
          <button
            onClick={() => {
              setSelectedIcon('desktop-time-bg')
              const scale = localStorage.getItem('desktop-time-bg-scale')
              const x = localStorage.getItem('desktop-time-bg-x')
              const y = localStorage.getItem('desktop-time-bg-y')
              setIconScale(scale ? parseInt(scale) : 100)
              setIconX(x ? parseInt(x) : 0)
              setIconY(y ? parseInt(y) : 0)
            }}
            className="text-xs md:text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            调整位置
          </button>
        </div>
      </div>

      {/* 主要内容 - 适配手机端 */}
      <div className="flex-1 flex items-start justify-center p-4 md:p-8 overflow-auto">
        <div className="glass-card rounded-3xl shadow-xl p-4 md:p-8 w-full max-w-4xl lg:flex lg:gap-8">
          {/* 手机预览框 */}
          <div data-preview-phone className="w-[320px] h-[568px] md:w-[375px] md:h-[667px] bg-white border-2 border-gray-300 rounded-[3rem] p-3 shadow-2xl mx-auto lg:mx-0 mb-6 lg:mb-0 flex-shrink-0">
            <div className="w-full h-full glass-card rounded-[2.5rem] overflow-hidden">
              {currentView === 'main' ? <MainView /> : currentView === 'chat' ? <ChatView /> : <DesktopView />}
            </div>
          </div>

          {/* 说明文字 - 手机端居中 */}
          <div className="text-center lg:text-left max-w-xs mx-auto lg:mx-0 flex flex-col">
            <div className="flex-shrink-0">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">自定义图标</h2>
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                点击预览中的<strong>灰色图标</strong>或<strong>空白背景</strong>即可上传图片。支持 PNG、JPG、GIF 格式。
              </p>
              
              {/* 控制按钮 */}
              {currentView === 'chat' && (
                <div className="mb-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="hasInput"
                      checked={hasInput}
                      onChange={(e) => setHasInput(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="hasInput" className="text-xs text-gray-600">
                      切换为发送按钮（有输入时）
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 ml-5">
                    未勾选时显示AI回复按钮
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="showMenu"
                      checked={showAddMenu}
                      onChange={(e) => setShowAddMenu(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="showMenu" className="text-xs text-gray-600">
                      显示加号功能菜单
                    </label>
                  </div>
                </div>
              )}
              <div className="space-y-1.5 text-left mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded"></div>
                  <span className="text-xs md:text-sm text-gray-600">可点击替换的图标</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-300 rounded"></div>
                  <span className="text-xs md:text-sm text-gray-600">默认图标样式</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 pt-3 border-t flex flex-col min-h-0">
              {(() => {
                // 根据当前视图过滤图标
                let filteredUIIcons: string[] = []
                let filteredDesktopIcons = desktopIcons
                
                if (currentView === 'desktop') {
                  // 桌面视图只显示桌面图标
                  filteredUIIcons = []
                } else if (currentView === 'main') {
                  // 主界面视图只显示主界面相关的UI图标
                  filteredUIIcons = Object.keys(customIcons).filter(key => 
                    key.startsWith('main-') || key.startsWith('avatar-') || key.startsWith('nav-')
                  )
                  filteredDesktopIcons = []
                } else if (currentView === 'chat') {
                  // 聊天界面视图只显示聊天界面相关的UI图标
                  filteredUIIcons = Object.keys(customIcons).filter(key => 
                    key.startsWith('chat-') || key.startsWith('menu-')
                  )
                  filteredDesktopIcons = []
                }
                
                const totalCount = filteredUIIcons.length + filteredDesktopIcons.length
                
                return totalCount > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <p className="text-xs md:text-sm font-medium text-gray-700">
                        已自定义 {totalCount} 个图标
                      </p>
                      <div className="text-xs text-gray-500">
                        存储: {storageUsage.used.toFixed(2)}MB / {storageUsage.total}MB
                        <span className={`ml-1 ${storageUsage.used / storageUsage.total > 0.8 ? 'text-red-500' : 'text-green-500'}`}>
                          ({((storageUsage.used / storageUsage.total) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    <div className="text-xs space-y-2 flex-1 min-h-0 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {/* UI图标 */}
                      {filteredUIIcons.map(key => (
                      <div key={`ui-${key}`} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2 flex-1">
                          <img src={customIcons[key]} alt={key} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                          <span className="text-gray-700 font-medium">{iconNameMap[key] || key}</span>
                          <span className="text-[10px] text-gray-400 bg-blue-100 px-1.5 py-0.5 rounded">UI</span>
                        </div>
                        <button
                          onClick={() => handleDeleteIcon(key)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      ))}
                      {/* 桌面图标 */}
                      {filteredDesktopIcons.map(item => {
                        const appNames: Record<string, string> = {
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
                          'desktop-calendar': '桌面-日历',
                          'desktop-theater': '桌面-小剧场',
                          'desktop-phone': '桌面-电话',
                          'desktop-game': '桌面-游戏'
                        }
                        return (
                          <div key={`desktop-${item.appId}`} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2 flex-1">
                              <img src={item.icon} alt={item.appId} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                              <span className="text-gray-700 font-medium">{appNames[item.appId] || item.appId}</span>
                              <span className="text-[10px] text-gray-400 bg-purple-100 px-1.5 py-0.5 rounded">桌面</span>
                            </div>
                            <button
                              onClick={() => handleDeleteDesktopIcon(item.appId)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                              title="删除"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-8">
                    暂无自定义图标
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 底部调整控制面板 */}
      {selectedIcon && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-700">调整: {selectedIcon ? iconNameMap[selectedIcon] || selectedIcon : ''}</span>
                <button 
                  onClick={() => setSelectedIcon(null)} 
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors font-medium"
                >
                  关闭调整
                </button>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem(`${selectedIcon}-scale`)
                  localStorage.removeItem(`${selectedIcon}-x`)
                  localStorage.removeItem(`${selectedIcon}-y`)
                  setIconScale(100)
                  setIconX(0)
                  setIconY(0)
                  window.dispatchEvent(new Event('iconAdjust'))
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                重置
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">大小 {iconScale}%</label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={iconScale}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setIconScale(val)
                    if (selectedIcon) {
                      localStorage.setItem(`${selectedIcon}-scale`, val.toString())
                      setAdjustParams(prev => ({
                        ...prev,
                        [selectedIcon]: { ...prev[selectedIcon], scale: val }
                      }))
                    }
                    window.dispatchEvent(new Event('iconAdjust'))
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">左右 {iconX}px</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={iconX}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setIconX(val)
                    if (selectedIcon) {
                      localStorage.setItem(`${selectedIcon}-x`, val.toString())
                      setAdjustParams(prev => ({
                        ...prev,
                        [selectedIcon]: { ...prev[selectedIcon], x: val }
                      }))
                    }
                    window.dispatchEvent(new Event('iconAdjust'))
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">上下 {iconY}px</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={iconY}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setIconY(val)
                    if (selectedIcon) {
                      localStorage.setItem(`${selectedIcon}-y`, val.toString())
                      setAdjustParams(prev => ({
                        ...prev,
                        [selectedIcon]: { ...prev[selectedIcon], y: val }
                      }))
                    }
                    window.dispatchEvent(new Event('iconAdjust'))
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleIconUpload}
        className="hidden"
      />
    </div>
  )
}

export default GlobalDecoration
