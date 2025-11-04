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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Desktop />} />
      <Route path="/wechat" element={<ChatList />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/me" element={<Me />} />
      <Route path="/create-character" element={<CreateCharacter />} />
      <Route path="/character/:id" element={<CharacterDetail />} />
      <Route path="/api-list" element={<ApiList />} />
      <Route path="/add-api" element={<AddApi />} />
      <Route path="/edit-api/:id" element={<EditApi />} />
      <Route path="/chat/:id" element={<ChatDetail />} />
    </Routes>
  )
}

export default App
