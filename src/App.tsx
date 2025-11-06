import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
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
import ChatDetail from './pages/ChatDetail'
import ChatSettings from './pages/ChatSettings'
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
import SimpleNotificationListener from './components/SimpleNotificationListener'
import { autoMigrate } from './utils/migrateStorage'

function App() {
  // 应用启动时自动迁移数据
  useEffect(() => {
    autoMigrate()
  }, [])

  return (
    <>
      <SimpleNotificationListener />
      <Routes>
      <Route path="/" element={<Desktop />} />
      <Route path="/wechat" element={<ChatList />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/moments" element={<Moments />} />
      <Route path="/publish-moment" element={<PublishMoment />} />
      <Route path="/me" element={<Me />} />
      <Route path="/create-character" element={<CreateCharacter />} />
      <Route path="/character/:id" element={<CharacterDetail />} />
      <Route path="/api-list" element={<ApiList />} />
      <Route path="/add-api" element={<AddApi />} />
      <Route path="/edit-api/:id" element={<EditApi />} />
      <Route path="/chat/:id" element={<ChatDetail />} />
      <Route path="/chat/:id/settings" element={<ChatSettings />} />
      <Route path="/couple-space" element={<CoupleSpace />} />
      <Route path="/couple-album" element={<CoupleAlbum />} />
      <Route path="/couple-anniversary" element={<CoupleAnniversary />} />
      <Route path="/couple-message-board" element={<CoupleMessageBoard />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/wallet/transactions" element={<WalletTransactions />} />
      <Route path="/wallet/cards" element={<WalletCards />} />
      <Route path="/wallet/intimate-pay/:characterId" element={<IntimatePayDetail />} />
      <Route path="/emoji-management" element={<EmojiManagement />} />
    </Routes>
    </>
  )
}

export default App
