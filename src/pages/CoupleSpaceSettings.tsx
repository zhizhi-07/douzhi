import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { 
  getCoupleSpaceRelation, 
  setCoupleSpacePrivacy, 
  getCoupleSpacePrivacy, 
  endCoupleSpaceRelation,
  getFamilyMembers,
  addFamilyMember,
  removeFamilyMember,
  getCoupleSpaceMode,
  setCoupleSpaceMode,
  isCoupleSpaceModeSet,
  CoupleSpaceRelation,
  FamilyMember,
  CoupleSpaceMode
} from '../utils/coupleSpaceUtils'
import { characterService } from '../services/characterService'
import { loadMessages, saveMessages } from '../utils/simpleMessageManager'
import { getCurrentUserName } from '../utils/userUtils'

export default function CoupleSpaceSettings() {
  const navigate = useNavigate()
  const [relation, setRelation] = useState<CoupleSpaceRelation | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>('public')
  const [spaceMode, setSpaceMode] = useState<CoupleSpaceMode>('independent')
  const [isModeSet, setIsModeSet] = useState(false)  // 模式是否已设置（设置后不能更改）
  const [daysCount, setDaysCount] = useState(0)
  const [showAddMember, setShowAddMember] = useState(false)
  const [availableCharacters, setAvailableCharacters] = useState<{id: string, name: string, avatar?: string}[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const rel = getCoupleSpaceRelation()
    setRelation(rel)
    setPrivacyMode(getCoupleSpacePrivacy())
    setSpaceMode(getCoupleSpaceMode())
    setIsModeSet(await isCoupleSpaceModeSet())
    
    if (rel) {
      const start = rel.acceptedAt || rel.createdAt
      const diff = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24))
      setDaysCount(diff)
      
      // 加载成员列表
      await characterService.waitForLoad()
      const familyMembers = getFamilyMembers()
      const updatedMembers = familyMembers.map(m => {
        const char = characterService.getById(m.characterId)
        return { ...m, characterAvatar: char?.avatar || m.characterAvatar }
      })
      setMembers(updatedMembers)
      
      // 加载可邀请的角色（排除已在家庭中的）
      const allChars = characterService.getAll()
      const memberIds = new Set(familyMembers.map(m => m.characterId))
      const available = allChars.filter(c => !memberIds.has(c.id)).map(c => ({
        id: c.id,
        name: c.nickname || c.realName,
        avatar: c.avatar
      }))
      setAvailableCharacters(available)
    }
  }

  const handleTogglePrivacy = () => {
    const newMode = privacyMode === 'public' ? 'private' : 'public'
    setPrivacyMode(newMode)
    setCoupleSpacePrivacy(newMode)
  }

  const handleToggleSpaceMode = async () => {
    if (isModeSet) {
      alert('模式已设置，不能更改。\n\n独立模式和公共模式会影响所有数据的存储方式，一旦选择后不能切换。')
      return
    }
    
    const newMode: CoupleSpaceMode = spaceMode === 'independent' ? 'shared' : 'independent'
    const confirmed = confirm(
      newMode === 'shared' 
        ? '确定切换到公共模式吗？\n\n公共模式：所有成员共享相册、留言、宠物等内容。\n\n⚠️ 注意：模式一旦选择后不能更改！'
        : '确定切换到独立模式吗？\n\n独立模式：你和每个AI各自拥有独立的空间内容。\n\n⚠️ 注意：模式一旦选择后不能更改！'
    )
    
    if (!confirmed) return
    
    const success = await setCoupleSpaceMode(newMode)
    if (success) {
      setSpaceMode(newMode)
      setIsModeSet(true)
    }
  }

  const handleEndRelation = async () => {
    const confirmed = confirm('确定要解除情侣空间吗？\n\n解除后：\n• 情侣空间关系将被清除\n• 照片、留言等内容会保留')
    if (confirmed) {
      await endCoupleSpaceRelation()
      navigate('/')
    }
  }

  const handleAddMember = async (charId: string, charName: string, charAvatar?: string) => {
    const success = await addFamilyMember(charId, charName, charAvatar)
    if (success) {
      setShowAddMember(false)
      loadData()  // 重新加载数据
    }
  }

  const handleRemoveMember = async (charId: string, charName: string) => {
    const confirmed = confirm(`确定要将 ${charName} 移出情侣空间吗？`)
    if (confirmed) {
      const mode = getCoupleSpaceMode()
      const allMembers = getFamilyMembers()
      const userName = getCurrentUserName()
      
      await removeFamilyMember(charId)
      
      // 公共模式下通知其他成员
      if (mode === 'shared') {
        const remainingMembers = allMembers.filter(m => m.characterId !== charId)
        const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        const timestamp = Date.now()
        
        remainingMembers.forEach(member => {
          const memberMessages = loadMessages(member.characterId)
          const notifyMsg = {
            id: timestamp,
            type: 'system' as const,
            content: `${userName}和${charName}解除了情侣空间`,
            aiReadableContent: `（情侣空间通知）${userName}和${charName}解除了情侣空间关系`,
            time: timeStr,
            timestamp,
            messageType: 'system' as const
          }
          saveMessages(member.characterId, [...memberMessages, notifyMsg])
        })
        
        // 也通知被移除的成员
        const removedMemberMessages = loadMessages(charId)
        const removedNotifyMsg = {
          id: timestamp,
          type: 'system' as const,
          content: `${userName}和你解除了情侣空间`,
          aiReadableContent: `（情侣空间通知）${userName}和你解除了情侣空间关系`,
          time: timeStr,
          timestamp,
          messageType: 'system' as const
        }
        saveMessages(charId, [...removedMemberMessages, removedNotifyMsg])
      }
      
      loadData()
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <div className="sticky top-0 bg-[#fdfbf7] border-b border-[#e6e1db] z-10">
        <StatusBar />
        <div className="flex items-center justify-between px-4 h-12">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-[#8b7355]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-[#5d4037]">情侣空间设置</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* 家庭成员 */}
        {relation && (
          <div className="bg-white rounded-2xl border border-[#e6e1db] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f0ebe5] flex items-center justify-between">
              <span className="text-xs font-bold text-[#8b7355] uppercase tracking-wider">
                {members.length > 1 ? '大家庭成员' : '情侣空间'}
              </span>
              <span className="text-xs text-gray-400">已在一起 {daysCount} 天</span>
            </div>
            
            {/* 成员列表 */}
            <div className="p-4 space-y-3">
              {members.map((member) => (
                <div key={member.characterId} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow">
                    {member.characterAvatar ? (
                      <img src={member.characterAvatar} alt={member.characterName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        {member.characterName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#5d4037]">{member.characterName}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(member.joinedAt).toLocaleDateString('zh-CN')} 加入
                    </div>
                  </div>
                  {members.length > 1 && (
                    <button
                      onClick={() => handleRemoveMember(member.characterId, member.characterName)}
                      className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              {/* 邀请新成员按钮 */}
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[#c9b8a8] text-[#8b7355] hover:bg-[#faf8f5] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#f5efe6] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <span className="font-medium">邀请新成员加入</span>
              </button>
            </div>
          </div>
        )}

        {/* 隐私设置区域 */}
        <div className="bg-white rounded-2xl border border-[#e6e1db] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f0ebe5]">
            <span className="text-xs font-bold text-[#8b7355] uppercase tracking-wider">隐私设置</span>
          </div>
          
          {/* 隐私模式开关 */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fff3e0] flex items-center justify-center">
                  {privacyMode === 'private' ? (
                    <svg className="w-5 h-5 text-[#ff9800]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#4caf50]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-bold text-[#5d4037]">隐私模式</div>
                  <div className="text-xs text-gray-500">
                    {privacyMode === 'private' ? '其他AI不知道你有情侣空间' : 'AI可以知道你有情侣空间'}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleTogglePrivacy}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  privacyMode === 'private' ? 'bg-[#ff9800]' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  privacyMode === 'private' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-400 bg-[#f9f7f4] rounded-lg p-3">
              {privacyMode === 'private' 
                ? '开启隐私模式后，其他AI角色在聊天时不会知道你已经有情侣空间了。但TA仍然可以向你发起邀请。'
                : '关闭隐私模式后，其他AI角色可以在聊天中得知你有情侣空间，可能会表达遗憾或减少邀请。'
              }
            </div>
          </div>
        </div>

        {/* 空间模式设置 */}
        <div className="bg-white rounded-2xl border border-[#e6e1db] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f0ebe5]">
            <span className="text-xs font-bold text-[#8b7355] uppercase tracking-wider">空间模式</span>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e3f2fd] flex items-center justify-center">
                  {spaceMode === 'shared' ? (
                    <svg className="w-5 h-5 text-[#2196f3]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#9c27b0]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-bold text-[#5d4037]">
                    {spaceMode === 'shared' ? '公共模式' : '独立模式'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {spaceMode === 'shared' ? '所有成员共享留言、相册等' : '每个AI各自独立的空间'}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleToggleSpaceMode}
                disabled={isModeSet}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  spaceMode === 'shared' ? 'bg-[#2196f3]' : 'bg-gray-300'
                } ${isModeSet ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  spaceMode === 'shared' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-400 bg-[#f9f7f4] rounded-lg p-3">
              {spaceMode === 'shared' 
                ? '公共模式：所有成员共享相册、留言、宠物、打卡、纪念日等内容。'
                : '独立模式：你和每个AI各自拥有独立的相册、留言、宠物、打卡、纪念日等内容。'
              }
              {isModeSet && (
                <div className="mt-2 text-[#ff9800] font-medium">
                  ⚠️ 模式已锁定，不能更改
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 危险操作区域 */}
        <div className="bg-white rounded-2xl border border-[#ffcdd2] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#ffebee] bg-[#fff5f5]">
            <span className="text-xs font-bold text-[#c62828] uppercase tracking-wider">危险操作</span>
          </div>
          
          {/* 解除情侣空间 */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffebee] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#e57373]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    <path d="M4 4L20 20" stroke="white" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-[#c62828]">解除情侣空间</div>
                  <div className="text-xs text-[#e57373]">解除关系，但保留照片、留言等内容</div>
                </div>
              </div>
              <button 
                onClick={handleEndRelation}
                className="px-4 py-2 bg-[#ffcdd2] text-[#c62828] rounded-lg text-sm font-bold hover:bg-[#ef9a9a] active:scale-95 transition-all"
              >
                解除
              </button>
            </div>
          </div>
        </div>

        </div>

      {/* 邀请新成员弹窗 */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowAddMember(false)}>
          <div 
            className="w-full max-h-[70vh] bg-white rounded-t-3xl overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b border-[#f0ebe5] flex items-center justify-between">
              <h3 className="font-bold text-[#5d4037]">选择要邀请的角色</h3>
              <button 
                onClick={() => setShowAddMember(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {availableCharacters.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🎭</div>
                  <div>没有可邀请的角色</div>
                  <div className="text-xs mt-1">所有角色都已在情侣空间中</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCharacters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => handleAddMember(char.id, char.name, char.avatar)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#faf8f5] hover:bg-[#f5efe6] transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                        {char.avatar ? (
                          <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {char.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-[#5d4037]">{char.name}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#8b7355] flex items-center justify-center text-white">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
