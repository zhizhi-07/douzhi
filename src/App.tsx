import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { getAllUIIcons } from './utils/iconStorage'
import DynamicIsland from './components/DynamicIsland'
import { useMusicPlayer } from './context/MusicPlayerContext'
import { needsMigration, migrateAllData } from './utils/migrateToIndexedDB'
import { cleanupOldMessages, checkAndCleanStorage } from './utils/cleanupLocalStorage'
import './utils/storageDiagnostic' // 存储诊断工具（在控制台使用 window.storageDiag）
import { playSystemSound, initSoundSystem } from './utils/soundManager'
import { migrateFromLocalStorage } from './utils/unifiedStorage'
import { initCoupleSpaceStorage } from './utils/coupleSpaceUtils'
import { startActivityTracker } from './services/activityTracker'
import Desktop from './pages/Desktop'
import ChatList from './pages/ChatList'
import Contacts from './pages/Contacts'
import Discover from './pages/Discover'
import Me from './pages/Me'
import CreateCharacter from './pages/CreateCharacter'
import CharacterDetail from './pages/CharacterDetail'
import ApiList from './pages/ApiList'
import AddApi from './pages/AddApi'
import EditApi from './pages/EditApi'
import EditSummaryApi from './pages/EditSummaryApi'
import ChatDetail from './pages/ChatDetail'
import OfflineChat from './pages/OfflineChat'
import ChatSettings from './pages/ChatSettings'
import MemorySummary from './pages/MemorySummary'
import MemoryViewer from './pages/MemoryViewer'
import CoupleSpace from './pages/CoupleSpace'
import CoupleAlbum from './pages/CoupleAlbum'
import CoupleAnniversary from './pages/CoupleAnniversary'
import CoupleMessageBoard from './pages/CoupleMessageBoard'
import { emergencyCleanup } from './utils/emergencyCleanup'
import Wallet from './pages/Wallet'
import WalletTransactions from './pages/WalletTransactions'
import WalletCards from './pages/WalletCards'
import IntimatePayDetail from './pages/IntimatePayDetail'
import Moments from './pages/Moments'
import PublishMoment from './pages/PublishMoment'
import EmojiManagement from './pages/EmojiManagement'
import UserProfile from './pages/UserProfile'
import MusicPlayer from './pages/MusicPlayer'
import MusicSearch from './pages/MusicSearch'
import UploadSong from './pages/UploadSong'
import MusicDecoration from './pages/MusicDecoration'
import DecorationHub from './pages/DecorationHub'
import GlobalDecoration from './pages/GlobalDecoration'
import GlobalColors from './pages/GlobalColors'
import Customize from './pages/Customize'
import DataManager from './pages/DataManager'
import StatusBarCustomize from './pages/StatusBarCustomize'
import FontCustomizer from './pages/FontCustomizer'
import BackgroundCustomizer from './pages/BackgroundCustomizer'
import SoundCustomizer from './pages/SoundCustomizer'
// import IconCustomizer from './pages/IconCustomizer' // 已整合到GlobalDecoration
import GroupChatDetail from './pages/GroupChatDetail'
import GroupChatSettings from './pages/GroupChatSettings'
import VoiceSettings from './pages/VoiceSettings'
import WorldBook from './pages/WorldBook'
import EditWorldBook from './pages/EditWorldBook'
import PresetManager from './pages/PresetManager'
import EditPreset from './pages/EditPreset'
import Forum from './pages/Forum'
import ForumPostDetail from './pages/ForumPostDetail'
import ForumProfile from './pages/ForumProfile'
import CharacterProfile from './pages/CharacterProfile'
import MomentDetail from './pages/MomentDetail'
import ForumMessages from './pages/ForumMessages'
import ForumTopics from './pages/ForumTopics'
import ForumTopicDetail from './pages/ForumTopicDetail'
import InstagramHome from './pages/InstagramHome'
import InstagramProfile from './pages/InstagramProfile'
import InstagramSearch from './pages/InstagramSearch'
import InstagramActivity from './pages/InstagramActivity'
import InstagramCreate from './pages/InstagramCreate'
import InstagramPostDetail from './pages/InstagramPostDetail'
import InstagramDMDetail from './pages/InstagramDMDetail'
import InstagramSettings from './pages/InstagramSettings'
import InstagramTopicDetail from './pages/InstagramTopicDetail'
import Map from './pages/Map'
import LocationHistory from './pages/LocationHistory'
import PaymentRequest from './pages/PaymentRequest'
import OnlineShopping from './pages/OnlineShopping'
import ShoppingCart from './pages/ShoppingCart'
import AIPhoneSelect from './pages/AIPhoneSelect'
import GlobalMemory from './pages/GlobalMemory'
import UnifiedMemory from './pages/UnifiedMemory'
import BubbleEditor from './pages/BubbleEditor'
import TheatreApp from './pages/TheatreApp'
import GameList from './pages/GameList'
import Landlord from './pages/Landlord'
import AITwoAIChat from './pages/AITwoAIChat'
import WerewolfGame from './pages/Werewolf'
import Calendar from './pages/Calendar'
import AISchedule from './pages/AISchedule'
import AIScheduleSelect from './pages/AIScheduleSelect'
import ScreenSettings from './pages/ScreenSettings'
import MemeLibrary from './pages/MemeLibrary'
import AvatarLibrary from './pages/AvatarLibrary'
import SwitchAccount from './pages/SwitchAccount'
import Weather from './pages/Weather'
import ChatHistorySearch from './pages/ChatHistorySearch'
import Envelope from './pages/Envelope'
import Auth from './pages/Auth'
import Admin from './pages/Admin'
import CloudAccount from './pages/CloudAccount'
import BanCheck from './components/BanCheck'
import InviteCodeCheck from './components/InviteCodeCheck'
// import Homeland from './pages/Homeland/index' // 暂时隐藏家园功能
import SimpleNotificationListener from './components/SimpleNotificationListener'
import GlobalMessageMonitor from './components/GlobalMessageMonitor'
import GlobalProactiveMessageManager from './components/GlobalProactiveMessageManager'
import { ContactsProvider } from './context/ContactsContext'
import MainLayout from './components/MainLayout'
import LiveBroadcast from './pages/LiveBroadcast'
import LiveRoom from './pages/LiveRoom'

function App() {
  const location = useLocation()
  const musicPlayer = useMusicPlayer()
  const [globalBackground, setGlobalBackground] = useState<string>('')
  const [screenOffsets, setScreenOffsets] = useState({
    top: parseInt(localStorage.getItem('screen_top_offset') || '0'),
    bottom: parseInt(localStorage.getItem('screen_bottom_offset') || '0')
  })

  // 🔥 iOS全屏修复：动态计算真实视口高度
  useEffect(() => {
    const setVH = () => {
      // 获取真实的视口高度（不包含地址栏等）
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
      // 同时直接设置html和body的高度为100vh（让浏览器自动处理）
      document.documentElement.style.height = '100vh'
      document.body.style.height = '100vh'
      // 禁止body的overflow，防止滚动条出现
      document.body.style.overflow = 'hidden'
    }
    
    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)
    // iOS Safari 有时需要延迟执行
    setTimeout(setVH, 100)
    
    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])

  // 监听屏幕设置变化
  useEffect(() => {
    const handleScreenSettingsChange = () => {
      setScreenOffsets({
        top: parseInt(localStorage.getItem('screen_top_offset') || '0'),
        bottom: parseInt(localStorage.getItem('screen_bottom_offset') || '0')
      })
    }

    window.addEventListener('screenSettingsChanged', handleScreenSettingsChange)
    return () => window.removeEventListener('screenSettingsChanged', handleScreenSettingsChange)
  }, [])

  // 加载全局背景和按钮颜色
  useEffect(() => {
    const loadGlobalBackground = async () => {
      try {
        const icons = await getAllUIIcons()
        console.log('🔍 App.tsx - 检查全局背景:', icons['global-background'] ? '存在' : '不存在')

        if (icons['global-background']) {
          setGlobalBackground(icons['global-background'])
          console.log('✅ App.tsx - 全局背景已应用')
        }
      } catch (error) {
        console.error('❌ App.tsx - 加载全局背景失败:', error)
      }
    }

    // 加载按钮颜色设置
    const knobColor = localStorage.getItem('switch_knob_color')
    const activeColor = localStorage.getItem('switch_active_color')
    const buttonColor = localStorage.getItem('global_button_color')
    const sliderThumbColor = localStorage.getItem('slider_thumb_color')

    if (knobColor) {
      document.documentElement.style.setProperty('--switch-knob-color', knobColor)
    }
    if (activeColor) {
      document.documentElement.style.setProperty('--switch-active-color', activeColor)
    }
    if (buttonColor) {
      document.documentElement.style.setProperty('--global-button-color', buttonColor)
    }
    if (sliderThumbColor) {
      document.documentElement.style.setProperty('--slider-thumb-color', sliderThumbColor)
    }

    loadGlobalBackground()

    // 监听全局背景变化
    const handleIconsChange = () => {
      loadGlobalBackground()
    }

    window.addEventListener('uiIconsChanged', handleIconsChange)
    return () => window.removeEventListener('uiIconsChanged', handleIconsChange)
  }, [])

  // � 请求系统通知权限（后台AI消息需要）
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // 延迟请求，避免打断用户首次体验
      const timer = setTimeout(() => {
        Notification.requestPermission().then(permission => {
          console.log('🔔 通知权限:', permission)
        })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  // 📊 启动用户活跃度追踪
  useEffect(() => {
    startActivityTracker()
  }, [])

  // �🔥 后台静默迁移（不阻塞UI）
  useEffect(() => {
    // 🗑️ 注销旧的 Service Worker（残留缓存会导致问题）
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister()
          console.log('🗑️ 已注销 Service Worker')
        })
      })
    }

    // 自动迁移 localStorage 到 IndexedDB
    migrateFromLocalStorage().catch(err => {
      console.error('❌ 迁移失败:', err)
    })

    // 紧急清理localStorage空间（如果满了）
    try {
      emergencyCleanup()
    } catch (e) {
      console.error('紧急清理失败:', e)
    }

    // 初始化情侣空间存储（从IndexedDB加载数据到缓存）
    initCoupleSpaceStorage().catch(err => {
      console.error('❌ 情侣空间存储初始化失败:', err)
    })

    if (needsMigration()) {
      console.log('🚀 开始后台迁移数据到IndexedDB...')
      migrateAllData().then(() => {
        console.log('✅ 数据迁移完成')
        // 迁移后清理 localStorage 中的旧消息数据
        cleanupOldMessages()
      }).catch(err => {
        console.error('❌ 迁移失败:', err)
      })
    } else {
      // 即使不需要迁移，也清理一次旧数据
      cleanupOldMessages()
    }
    
    // 🔥 检查存储空间，不足时自动清理并警告
    checkAndCleanStorage()

    // 🎨 预加载所有自定义图标到内存，避免切换页面时闪烁
    getAllUIIcons().then(icons => {
      if (Object.keys(icons).length > 0) {
        sessionStorage.setItem('__preloaded_icons__', JSON.stringify(icons))
        console.log('✅ 预加载', Object.keys(icons).length, '个自定义图标到缓存')
      }
    }).catch(err => {
      console.error('❌ 预加载图标失败:', err)
    })

    // 🖼️ 预加载背景图片到内存，避免闪烁
    import('./utils/unifiedStorage').then(({ getImage }) => {
      Promise.all([
        getImage('desktop_bg'),
        getImage('wechat_bg')
      ]).then(([desktop, wechat]) => {
        const backgrounds: Record<string, string> = {}
        if (desktop) backgrounds.desktop_bg = desktop
        if (wechat) backgrounds.wechat_bg = wechat
        if (Object.keys(backgrounds).length > 0) {
          sessionStorage.setItem('__preloaded_backgrounds__', JSON.stringify(backgrounds))
          console.log('✅ 预加载', Object.keys(backgrounds).length, '个背景图片到缓存')
        }
      }).catch(err => {
        console.error('❌ 预加载背景失败:', err)
      })
    })

    // 💬 预加载聊天列表到内存，避免进入微信时闪烁
    import('./utils/chatListManager').then(({ loadChatList }) => {
      loadChatList().then(chatList => {
        if (chatList && chatList.length > 0) {
          try {
            // 🔥 只保存最近50个聊天，避免配额超出
            const toCache = chatList.slice(0, 50).map((c: any) => ({
              ...c,
              // 移除大型数据
              lastMessage: c.lastMessage?.substring?.(0, 100) || c.lastMessage
            }))
            sessionStorage.setItem('__preloaded_chatlist__', JSON.stringify(toCache))
            console.log('✅ 预加载', toCache.length, '个聊天到缓存')
          } catch (e) {
            console.warn('⚠️ 预加载缓存失败，跳过')
          }
        }
      }).catch(err => {
        console.error('❌ 预加载聊天列表失败:', err)
      })
    })

    // 🎵 初始化音效系统，预加载常用音效
    initSoundSystem()

    // 🔥 初始化API配置，确保当前API设置是最新的
    import('./services/apiService').then(({ apiService }) => {
      // 先调用getAll()，触发内置API配置的自动更新
      apiService.getAll()

      const currentId = apiService.getCurrentId()
      if (currentId) {
        // 触发setCurrentId，更新localStorage中的API_SETTINGS
        // 这会从更新后的configs中读取最新配置
        apiService.setCurrentId(currentId)
        console.log('✅ API配置已初始化，当前API:', currentId)
      }
    })

    // 🔥 初始化朋友圈AI动作调度器（恢复页面刷新前待执行的动作）
    import('./utils/momentsAI/actionScheduler').then(({ startScheduler, getPendingActionsCount }) => {
      const pendingCount = getPendingActionsCount()
      if (pendingCount > 0) {
        console.log(`📋 发现 ${pendingCount} 个待执行的朋友圈动作，启动调度器...`)
        startScheduler()
      }
    })
  }, [])

  // 🔥 页面卸载时强制备份所有消息到 localStorage
  // 手机端优化：监听多个事件确保备份成功
  useEffect(() => {
    let backupModule: any = null

    // 预加载备份模块
    import('./utils/simpleMessageManager').then((module) => {
      backupModule = module
    })

    const doBackup = () => {
      if (backupModule) {
        backupModule.forceBackupAllMessages()
      } else {
        // 如果模块还没加载，立即加载并备份
        import('./utils/simpleMessageManager').then(({ forceBackupAllMessages }) => {
          forceBackupAllMessages()
        })
      }
    }

    // 1. beforeunload - PC端主要事件
    const handleBeforeUnload = () => {
      doBackup()
    }

    // 2. pagehide - 移动端更可靠的事件
    const handlePageHide = () => {
      console.log('📱 [pagehide] 触发备份')
      doBackup()
    }

    // 3. visibilitychange - 页面切到后台时备份
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 [visibilitychange] 页面隐藏，触发备份')
        doBackup()
        // 🔥 云同步备份（如果已登录）
        import('./services/cloudSyncService').then(({ autoSync }) => {
          autoSync()
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 🎨 加载字体（自定义或系统默认）
  useEffect(() => {
    const loadFont = async () => {
      const customFont = localStorage.getItem('custom_font')
      if (customFont) {
        try {
          const fontConfig = JSON.parse(customFont)
          let fontUrl = fontConfig.url

          console.log('🔤 加载字体配置:', fontConfig.name, '| URL存在:', !!fontUrl)

          // 如果 localStorage 没有 url，尝试从 IndexedDB 加载
          if (!fontUrl && fontConfig.name && fontConfig.name !== '经典衬线') {
            console.log('🔤 尝试从 IndexedDB 加载字体:', fontConfig.name)
            try {
              // 使用更可靠的 IndexedDB 打开方式
              const db = await new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open('FontStorage', 1)

                request.onerror = () => {
                  console.error('❌ 打开字体数据库失败:', request.error)
                  reject(request.error)
                }

                request.onupgradeneeded = (event) => {
                  console.log('🔤 字体数据库升级中...')
                  const db = (event.target as IDBOpenDBRequest).result
                  if (!db.objectStoreNames.contains('fonts')) {
                    db.createObjectStore('fonts', { keyPath: 'name' })
                  }
                }

                request.onsuccess = () => {
                  console.log('✅ 字体数据库打开成功')
                  resolve(request.result)
                }
              })

              // 检查对象存储是否存在
              if (!db.objectStoreNames.contains('fonts')) {
                console.warn('⚠️ fonts 对象存储不存在')
                db.close()
              } else {
                const fontData = await new Promise<{ name: string; family: string; url: string } | null>((resolve, reject) => {
                  const tx = db.transaction('fonts', 'readonly')
                  const req = tx.objectStore('fonts').get(fontConfig.name)
                  req.onsuccess = () => {
                    console.log('🔤 IndexedDB 查询结果:', req.result ? '找到字体' : '未找到字体')
                    resolve(req.result || null)
                  }
                  req.onerror = () => {
                    console.error('❌ 查询字体失败:', req.error)
                    reject(req.error)
                  }
                })
                db.close()

                if (fontData?.url) {
                  fontUrl = fontData.url
                  console.log('✅ 从 IndexedDB 获取字体 URL 成功')
                }
              }
            } catch (err) {
              console.error('❌ 从 IndexedDB 加载字体失败:', err)
            }
          }

          if (fontUrl) {
            console.log('🔤 应用字体:', fontConfig.name)
            // 判断是CSS链接还是字体文件
            if (fontUrl.includes('.css') || fontUrl.includes('fonts.googleapis.com')) {
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.href = fontUrl
              document.head.appendChild(link)
            } else {
              const style = document.createElement('style')
              style.id = 'custom-font-style'
              style.textContent = `
                @font-face {
                  font-family: '${fontConfig.name}';
                  src: url('${fontUrl}');
                  font-display: swap;
                }
              `
              // 先移除旧的样式
              const oldStyle = document.getElementById('custom-font-style')
              if (oldStyle) oldStyle.remove()
              document.head.appendChild(style)
            }
            // 设置 CSS 变量，让全局字体生效
            setTimeout(() => {
              document.documentElement.style.setProperty('--global-font-family', fontConfig.family)
              console.log('✅ 字体已应用:', fontConfig.family)
            }, 100)
          } else if (fontConfig.family) {
            // 有 family 但没有 url，直接设置 CSS 变量（可能是系统字体）
            document.documentElement.style.setProperty('--global-font-family', fontConfig.family)
            console.log('✅ 设置字体 family:', fontConfig.family)
          }
        } catch (err) {
          console.error('❌ 加载字体失败:', err)
        }
      } else {
        // 🔥 没有自定义字体时，使用系统默认衬线字体
        document.documentElement.style.setProperty('--global-font-family', 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif')
        console.log('✅ 已加载系统默认字体：经典衬线')
      }
    }
    loadFont()
  }, [])

  // 路由切换时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // 🎵 全局点击音效
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 获取点击的元素
      const target = e.target as HTMLElement

      // 只对可交互元素播放音效
      const isClickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('clickable') ||
        target.onclick !== null ||
        target.style.cursor === 'pointer' ||
        window.getComputedStyle(target).cursor === 'pointer'

      if (isClickable) {
        playSystemSound()
      }
    }

    // 添加全局点击监听
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])


  // 渲染主内容
  console.log('🎯🎯🎯 [App] renderContent 被调用')
  const renderContent = () => (
    <div
      className="app-container"
      style={{
        ...(globalBackground ? {
          backgroundImage: `url(${globalBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        } : {}),
        // 应用屏幕边距设置，正值向内缩进，负值向外延伸
        paddingTop: screenOffsets.top > 0 ? `${screenOffsets.top}px` : undefined,
        paddingBottom: screenOffsets.bottom > 0 ? `${screenOffsets.bottom}px` : undefined,
        // 负值时使用transform向外延伸，让背景覆盖系统状态栏区域
        transform: (screenOffsets.top < 0 || screenOffsets.bottom < 0) 
          ? `translateY(${screenOffsets.top < 0 ? screenOffsets.top : 0}px)` 
          : undefined,
        // 调整高度以补偿transform的偏移
        height: (screenOffsets.top < 0 || screenOffsets.bottom < 0)
          ? `calc(100% + ${Math.abs(Math.min(screenOffsets.top, 0)) + Math.abs(Math.min(screenOffsets.bottom, 0))}px)`
          : '100%'
      }}
    >
      <ContactsProvider>
        {/* 全局灵动岛 */}
        {musicPlayer.currentSong && musicPlayer.currentSong.id !== 0 && location.pathname !== '/music-player' && (
          <DynamicIsland
            isPlaying={musicPlayer.isPlaying}
            currentSong={musicPlayer.currentSong}
            onPlayPause={musicPlayer.togglePlay}
            onNext={musicPlayer.next}
            onPrevious={musicPlayer.previous}
            currentTime={musicPlayer.currentTime}
            duration={musicPlayer.duration || musicPlayer.currentSong.duration}
          />
        )}

        <SimpleNotificationListener />
        <GlobalMessageMonitor />
        <GlobalProactiveMessageManager />
        <Routes>
          <Route path="/" element={<Desktop />} />

          {/* 主界面布局 */}
          <Route element={<MainLayout />}>
            <Route path="/wechat" element={<ChatList />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/me" element={<Me />} />
          </Route>

          <Route path="/live" element={<LiveBroadcast />} />
          <Route path="/live/:id" element={<LiveRoom />} />

          <Route path="/group/:id" element={<GroupChatDetail />} />
          <Route path="/group/:id/settings" element={<GroupChatSettings />} />
          <Route path="/moments" element={<Moments />} />
          <Route path="/publish-moment" element={<PublishMoment />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/switch-account" element={<SwitchAccount />} />
          <Route path="/create-character" element={<CreateCharacter />} />
          <Route path="/character/:id" element={<CharacterDetail />} />
          <Route path="/api-list" element={<ApiList />} />
          <Route path="/add-api" element={<AddApi />} />
          <Route path="/edit-api/:id" element={<EditApi />} />
          <Route path="/edit-summary-api" element={<EditSummaryApi />} />
          <Route path="/chat/:id" element={<ChatDetail />} />
          <Route path="/chat/:id/offline" element={<OfflineChat />} />
          <Route path="/chat/:id/settings" element={<ChatSettings />} />
          <Route path="/chat/:id/memory-viewer" element={<MemoryViewer />} />
          <Route path="/chat/:id/memory-summary" element={<MemorySummary />} />
          <Route path="/chat/:id/history" element={<ChatHistorySearch />} />
          <Route path="/couple-space" element={<CoupleSpace />} />
          <Route path="/couple-album" element={<CoupleAlbum />} />
          <Route path="/couple-anniversary" element={<CoupleAnniversary />} />
          <Route path="/couple-message-board" element={<CoupleMessageBoard />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/wallet/transactions" element={<WalletTransactions />} />
          <Route path="/wallet/cards" element={<WalletCards />} />
          <Route path="/wallet/intimate-pay/:characterId" element={<IntimatePayDetail />} />
          <Route path="/emoji-management" element={<EmojiManagement />} />
          <Route path="/music-player" element={<MusicPlayer />} />
          <Route path="/music-search" element={<MusicSearch />} />
          <Route path="/upload-song" element={<UploadSong />} />
          <Route path="/decoration" element={<DecorationHub />} />
          <Route path="/decoration/music" element={<MusicDecoration />} />
          <Route path="/decoration/global" element={<GlobalDecoration />} />
          <Route path="/decoration/colors" element={<GlobalColors />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/data-manager" element={<DataManager />} />
          <Route path="/statusbar-customize" element={<StatusBarCustomize />} />
          <Route path="/font-customizer" element={<FontCustomizer />} />
          <Route path="/background-customizer" element={<BackgroundCustomizer />} />
          <Route path="/sound-customizer" element={<SoundCustomizer />} />
          {/* <Route path="/icon-customizer" element={<IconCustomizer />} /> */} {/* 已整合到GlobalDecoration */}
          <Route path="/voice-settings" element={<VoiceSettings />} />
          <Route path="/screen-settings" element={<ScreenSettings />} />
          <Route path="/world-book" element={<WorldBook />} />
          <Route path="/edit-world-book/:id" element={<EditWorldBook />} />
          <Route path="/preset" element={<PresetManager />} />
          <Route path="/edit-preset/:id" element={<EditPreset />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/post/:id" element={<ForumPostDetail />} />
          <Route path="/forum/profile" element={<ForumProfile />} />
          <Route path="/forum/character/:characterId" element={<CharacterProfile />} />
          <Route path="/forum/moment/:momentId" element={<MomentDetail />} />
          <Route path="/forum/messages" element={<ForumMessages />} />
          <Route path="/forum/topics" element={<ForumTopics />} />
          <Route path="/forum/topic/:name" element={<ForumTopicDetail />} />
          <Route path="/instagram" element={<InstagramHome />} />
          <Route path="/instagram/profile" element={<InstagramProfile />} />
          <Route path="/instagram/user/:userId" element={<InstagramProfile />} />
          <Route path="/instagram/search" element={<InstagramSearch />} />
          <Route path="/instagram/activity" element={<InstagramActivity />} />
          <Route path="/instagram/create" element={<InstagramCreate />} />
          <Route path="/instagram/post/:postId" element={<InstagramPostDetail />} />
          <Route path="/instagram/dm/:npcId" element={<InstagramDMDetail />} />
          <Route path="/instagram/settings" element={<InstagramSettings />} />
          <Route path="/instagram/topic/:topicName" element={<InstagramTopicDetail />} />
          <Route path="/map" element={<Map />} />
          <Route path="/location-history/:characterId" element={<LocationHistory />} />
          <Route path="/chat/:id/payment-request" element={<PaymentRequest />} />
          <Route path="/chat/:id/shopping" element={<OnlineShopping />} />
          <Route path="/chat/:id/shopping/cart" element={<ShoppingCart />} />
          <Route path="/ai-phone-select" element={<AIPhoneSelect />} />
          <Route path="/global-memory" element={<UnifiedMemory />} />
          <Route path="/global-memory-old" element={<GlobalMemory />} />
          <Route path="/bubble-editor" element={<BubbleEditor />} />
          <Route path="/theatre" element={<TheatreApp />} />
          <Route path="/game-list" element={<GameList />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/landlord" element={<Landlord />} />
          <Route path="/ai-chat" element={<AITwoAIChat />} />
          <Route path="/werewolf" element={<WerewolfGame />} />
          <Route path="/ai-schedule" element={<AIScheduleSelect />} />
          <Route path="/ai-schedule/:characterId" element={<AISchedule />} />
          <Route path="/meme-library" element={<MemeLibrary />} />
          <Route path="/avatar-library" element={<AvatarLibrary />} />
          <Route path="/chat/:id/weather" element={<Weather />} />
          <Route path="/envelope" element={<Envelope />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cloud-account" element={<CloudAccount />} />
          {/* <Route path="/homeland" element={<Homeland />} /> 暂时隐藏家园功能 */}
        </Routes>
      </ContactsProvider>
    </div>
  )

  return (
    <InviteCodeCheck>
      <BanCheck>
        {renderContent()}
      </BanCheck>
    </InviteCodeCheck>
  )
}

export default App
