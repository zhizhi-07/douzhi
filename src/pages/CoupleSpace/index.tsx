/**
 * 情侣空间 - 主入口
 */

import { useState, useEffect } from 'react'
import { getCoupleSpaceRelation, CoupleSpaceRelation, getCoupleSpacePrivacy, getFamilyMembers, type FamilyMember } from '../../utils/coupleSpaceUtils'
import { getCheckInStats } from '../../utils/coupleSpaceCheckInUtils'
import { getUserInfoWithAvatar } from '../../utils/userUtils'
import { characterService } from '../../services/characterService'
import { getCouplePhotos, getCoupleMessages, type CoupleAlbumPhoto, type CoupleMessage } from '../../utils/coupleSpaceContentUtils'

import { RoomView } from './RoomView'
import { BottomNav } from './BottomNav'
import { SpaceMenuOverlay } from './SpaceMenuOverlay'

const CoupleSpace = () => {
  const [relation, setRelation] = useState<CoupleSpaceRelation | null>(null)
  const [userAvatar, setUserAvatar] = useState('')
  const [daysCount, setDaysCount] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0)  // 当前选中的成员
  const [coverImage, setCoverImage] = useState('')
  const [photos, setPhotos] = useState<CoupleAlbumPhoto[]>([])
  const [latestMessage, setLatestMessage] = useState<CoupleMessage | null>(null)
  const [petStatus, setPetStatus] = useState<'none' | 'naming' | 'waitingAI' | 'egg' | 'hatched'>('none')
  const [petName, setPetName] = useState('')
  const [checkInStreak, setCheckInStreak] = useState(0)
  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>('public')

  useEffect(() => {
    loadData()
    loadPhotos()
    loadMessages()
    loadPetData()
    // Load user avatar
    getUserInfoWithAvatar().then(info => setUserAvatar(info.avatar || ''))
    // Load check-in stats
    getCheckInStats().then(stats => setCheckInStreak(stats.currentStreak))
    // Load privacy mode
    setPrivacyMode(getCoupleSpacePrivacy())
    const savedCover = localStorage.getItem('couple_space_cover')
    if (savedCover) {
      setCoverImage(savedCover)
    }
  }, [])

  const loadPetData = () => {
    const saved = localStorage.getItem('couple_pet_data')
    if (saved) {
      const data = JSON.parse(saved)
      setPetStatus(data.status || 'none')
      setPetName(data.name || '')
    }
  }

  const loadPhotos = async () => {
    try {
      const allPhotos = await getCouplePhotos()
      setPhotos(allPhotos.slice(0, 6)) // Show max 6 recent photos
    } catch (error) {
      console.error('加载相册失败:', error)
    }
  }

  const loadData = async () => {
    const rel = getCoupleSpaceRelation()
    if (rel) {
      await characterService.waitForLoad()
      
      // 加载所有成员并更新头像
      const familyMembers = getFamilyMembers()
      const updatedMembers = familyMembers.map(member => {
        const char = characterService.getById(member.characterId)
        return {
          ...member,
          characterAvatar: char?.avatar || member.characterAvatar
        }
      })
      setMembers(updatedMembers)
      
      // 更新主要角色头像（兼容旧代码）
      if (updatedMembers.length > 0) {
        rel.characterAvatar = updatedMembers[0].characterAvatar
      }
      
      setRelation(rel)
      const start = rel.acceptedAt || rel.createdAt
      const diff = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24))
      setDaysCount(diff)
    }
  }

  const loadMessages = () => {
    try {
      const messages = getCoupleMessages()
      if (messages.length > 0) {
        setLatestMessage(messages[0])
      }
    } catch (error) {
      console.error('加载留言失败:', error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setCoverImage(result)
        localStorage.setItem('couple_space_cover', result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="h-screen w-full relative overflow-hidden font-sans">
      <RoomView 
        userAvatar={userAvatar}
        members={members}
        daysCount={daysCount}
        photos={photos}
        latestMessage={latestMessage}
        relation={relation}
        selectedMemberIndex={selectedMemberIndex}
        onSelectMember={setSelectedMemberIndex}
      />
      <BottomNav 
        relation={relation}
        onOpenMenu={() => setIsMenuOpen(true)}
      />
      <SpaceMenuOverlay 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        relation={relation}
        coverImage={coverImage}
        onCoverUpload={handleImageUpload}
        latestMessage={latestMessage}
        petStatus={petStatus}
        petName={petName}
        checkInStreak={checkInStreak}
        privacyMode={privacyMode}
      />
    </div>
  )
}

export default CoupleSpace
