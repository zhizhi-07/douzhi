import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import DynamicIsland from './components/DynamicIsland'
import { useMusicPlayer } from './context/MusicPlayerContext'
import { needsMigration, migrateAllData } from './utils/migrateToIndexedDB'
import { cleanupOldMessages } from './utils/cleanupLocalStorage'
import { playSystemSound } from './utils/soundManager'
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
import Customize from './pages/Customize'
import DataManager from './pages/DataManager'
import StatusBarCustomize from './pages/StatusBarCustomize'
import FontCustomizer from './pages/FontCustomizer'
import BackgroundCustomizer from './pages/BackgroundCustomizer'
import SoundCustomizer from './pages/SoundCustomizer'
import IconCustomizer from './pages/IconCustomizer'
import GroupChatDetail from './pages/GroupChatDetail'
import GroupChatSettings from './pages/GroupChatSettings'
import SimpleNotificationListener from './components/SimpleNotificationListener'
import GlobalMessageMonitor from './components/GlobalMessageMonitor'

function App() {
  const location = useLocation()
  const musicPlayer = useMusicPlayer()
  
  // 🔥 后台静默迁移（不阻塞UI）
  useEffect(() => {
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
  }, [])
  
  // 🎨 加载自定义字体
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

  return (
    <>
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
      <Route path="/customize" element={<Customize />} />
      <Route path="/data-manager" element={<DataManager />} />
      <Route path="/statusbar-customize" element={<StatusBarCustomize />} />
      <Route path="/font-customizer" element={<FontCustomizer />} />
      <Route path="/background-customizer" element={<BackgroundCustomizer />} />
      <Route path="/sound-customizer" element={<SoundCustomizer />} />
      <Route path="/icon-customizer" element={<IconCustomizer />} />
    </Routes>
    </>
  )
}

export default App
