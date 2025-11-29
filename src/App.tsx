import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { getAllUIIcons } from './utils/iconStorage'
import DynamicIsland from './components/DynamicIsland'
import { useMusicPlayer } from './context/MusicPlayerContext'
import { needsMigration, migrateAllData } from './utils/migrateToIndexedDB'
import { cleanupOldMessages } from './utils/cleanupLocalStorage'
import './utils/storageDiagnostic' // 存储诊断工具（在控制台使用 window.storageDiag）
import { playSystemSound, initSoundSystem } from './utils/soundManager'
import { migrateFromLocalStorage } from './utils/unifiedStorage'
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
import AIPhoneSelect from './pages/AIPhoneSelect'
import GlobalMemory from './pages/GlobalMemory'
import UnifiedMemory from './pages/UnifiedMemory'
import BubbleEditor from './pages/BubbleEditor'
import TheatreApp from './pages/TheatreApp'
import GameList from './pages/GameList'
import Landlord from './pages/Landlord'
import Calendar from './pages/Calendar'
import AISchedule from './pages/AISchedule'
import AIScheduleSelect from './pages/AIScheduleSelect'
import ScreenSettings from './pages/ScreenSettings'
// import Homeland from './pages/Homeland/index' // 暂时隐藏家园功能
import SimpleNotificationListener from './components/SimpleNotificationListener'
import GlobalMessageMonitor from './components/GlobalMessageMonitor'
import GlobalProactiveMessageManager from './components/GlobalProactiveMessageManager'
import { ContactsProvider } from './context/ContactsContext'

function App() {
  const location = useLocation()
  const musicPlayer = useMusicPlayer()
  const [globalBackground, setGlobalBackground] = useState<string>('')
  
  // 屏幕设置（用于解决iOS黑边问题）
  const [screenSettings, setScreenSettings] = useState(() => ({
    topOffset: parseInt(localStorage.getItem('screen_top_offset') || '0'),
    bottomOffset: parseInt(localStorage.getItem('screen_bottom_offset') || '0')
  }))
  
  // 监听屏幕设置变化
  useEffect(() => {
    const handleScreenSettingsChange = () => {
      setScreenSettings({
        topOffset: parseInt(localStorage.getItem('screen_top_offset') || '0'),
        bottomOffset: parseInt(localStorage.getItem('screen_bottom_offset') || '0')
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

  // 🔥 后台静默迁移（不阻塞UI）
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
    const customFont = localStorage.getItem('custom_font')
    if (customFont) {
      try {
        const fontConfig = JSON.parse(customFont)
        if (fontConfig.url) {
          // 判断是CSS链接还是字体文件
          if (fontConfig.url.includes('.css') || fontConfig.url.includes('fonts.googleapis.com')) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = fontConfig.url
            document.head.appendChild(link)
          } else {
            const style = document.createElement('style')
            style.textContent = `
              @font-face {
                font-family: '${fontConfig.name}';
                src: url('${fontConfig.url}');
              }
            `
            document.head.appendChild(style)
          }
          // 延迟应用字体，等待加载
          setTimeout(() => {
            document.body.style.fontFamily = fontConfig.family
          }, 100)
        }
      } catch (err) {
        console.error('❌ 加载字体失败:', err)
      }
    } else {
      // 🔥 没有自定义字体时，加载系统默认字体"喵小九的喵"
      const style = document.createElement('style')
      style.textContent = `
        @font-face {
          font-family: '喵小九的喵';
          src: url('/fonts/喵小九的喵.ttf');
        }
      `
      document.head.appendChild(style)
      
      // 应用默认字体
      setTimeout(() => {
        document.body.style.fontFamily = '"喵小九的喵", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }, 100)
      
      console.log('✅ 已加载系统默认字体：喵小九的喵')
    }
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

  // 应用屏幕偏移设置到CSS变量
  useEffect(() => {
    document.documentElement.style.setProperty('--screen-top-offset', `${screenSettings.topOffset}px`)
    document.documentElement.style.setProperty('--screen-bottom-offset', `${screenSettings.bottomOffset}px`)
  }, [screenSettings.topOffset, screenSettings.bottomOffset])

  // 渲染主内容
  const renderContent = () => (
    <div 
      className="app-container"
      style={globalBackground ? {
        backgroundImage: `url(${globalBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : undefined}
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
      <Route path="/wechat" element={<ChatList />} />
      <Route path="/group/:id" element={<GroupChatDetail />} />
      <Route path="/group/:id/settings" element={<GroupChatSettings />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/moments" element={<Moments />} />
      <Route path="/publish-moment" element={<PublishMoment />} />
      <Route path="/me" element={<Me />} />
      <Route path="/user-profile" element={<UserProfile />} />
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
      <Route path="/ai-phone-select" element={<AIPhoneSelect />} />
      <Route path="/global-memory" element={<UnifiedMemory />} />
      <Route path="/global-memory-old" element={<GlobalMemory />} />
      <Route path="/bubble-editor" element={<BubbleEditor />} />
      <Route path="/theatre" element={<TheatreApp />} />
      <Route path="/game-list" element={<GameList />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/landlord" element={<Landlord />} />
      <Route path="/ai-schedule" element={<AIScheduleSelect />} />
      <Route path="/ai-schedule/:characterId" element={<AISchedule />} />
      {/* <Route path="/homeland" element={<Homeland />} /> 暂时隐藏家园功能 */}
    </Routes>
    </ContactsProvider>
    </div>
  )

  return renderContent()
}

export default App
