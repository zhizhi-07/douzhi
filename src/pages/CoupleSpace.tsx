import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCoupleSpaceRelation, CoupleSpaceRelation } from '../utils/coupleSpaceUtils'
import { getCheckInStats } from '../utils/coupleSpaceCheckInUtils'
import { characterService } from '../services/characterService'
import { getCouplePhotos, getCoupleMessages, type CoupleAlbumPhoto, type CoupleMessage } from '../utils/coupleSpaceContentUtils'

// 心情图标映射
const MOOD_IMAGES: Record<string, string> = {
  happy: '/moods/开心.png',
  love: '/moods/心动.png',
  awkward: '/moods/无语尴尬.png',
  calm: '/moods/平静.png',
  sad: '/moods/伤心.png',
  angry: '/moods/生气.png',
}

// -----------------------------------------------------------------------------
// Icons (Brown color, Grid Menu uses filled style)
// -----------------------------------------------------------------------------
const Icons = {
  Home: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
    </svg>
  ),
  Shop: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
    </svg>
  ),
  Calendar: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
    </svg>
  ),
  Star: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
  Bell: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  ),
  Settings: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  ),
  QnA: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-2v2H9v-2H7v-2h2V7h2v2h2v2zm-3 8H8v-2h2v2zm6-12V3.5L18.5 9H14z" />
    </svg>
  ),
  HeartFilled: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  ChatDots: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-9 9H9V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" />
    </svg>
  ),
  // Grid Menu Icons (FILLED style - no strokes)
  Book: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
    </svg>
  ),
  Album: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  ),
  Flower: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 3.62 13.38 2.5 12 2.5S9.5 3.62 9.5 5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8s1.12-2.5 2.5-2.5zM3 13c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9z" />
    </svg>
  ),
  PeriodCalendar: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
      <circle cx="12" cy="14" r="3" />
    </svg>
  ),
  Close: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  ),
  Fire: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
    </svg>
  )
}

// -----------------------------------------------------------------------------
// Component Implementation
// -----------------------------------------------------------------------------

const CoupleSpace = () => {
  const navigate = useNavigate()
  const [relation, setRelation] = useState<CoupleSpaceRelation | null>(null)
  const [daysCount, setDaysCount] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [characterAvatar, setCharacterAvatar] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [photos, setPhotos] = useState<CoupleAlbumPhoto[]>([])
  const [latestMessage, setLatestMessage] = useState<CoupleMessage | null>(null)
  const [petStatus, setPetStatus] = useState<'none' | 'naming' | 'waitingAI' | 'egg' | 'hatched'>('none')
  const [petName, setPetName] = useState('')
  const [checkInStreak, setCheckInStreak] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
    loadPhotos()
    loadMessages()
    loadPetData()
    // Load check-in stats
    getCheckInStats().then(stats => setCheckInStreak(stats.currentStreak))
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

  // Auto-scrolling carousel logic - smooth infinite scroll
  useEffect(() => {
    let animationId: number
    let lastTime = 0
    const speed = 30 // pixels per second

    const animate = (currentTime: number) => {
      const container = carouselRef.current
      if (!container) {
        animationId = requestAnimationFrame(animate)
        return
      }

      if (lastTime === 0) lastTime = currentTime
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      // Don't scroll if hovering
      if (!container.matches(':hover')) {
        container.scrollLeft += speed * deltaTime

        // Calculate one set width based on actual rendered elements
        const cardWidth = 144 + 16 // w-36 (144px) + gap-4 (16px)
        const oneSetWidth = cardWidth * 4

        // Seamless loop - reset when we've scrolled past the first set
        if (container.scrollLeft >= oneSetWidth) {
          container.scrollLeft = container.scrollLeft - oneSetWidth
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [])

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
      if (rel.characterId) {
        await characterService.waitForLoad()
        const char = characterService.getById(rel.characterId)
        if (char?.avatar) {
          rel.characterAvatar = char.avatar
          setCharacterAvatar(char.avatar)
        }
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

  // ---------------------------------------------------------------------------
  // Sub-components
  // ---------------------------------------------------------------------------

  const TopBar = () => (
    <div className="absolute top-0 left-0 w-full z-10 pt-[env(safe-area-inset-top)]">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Character Status */}
        <div className="flex items-center gap-2 bg-[#f8f5f2] rounded-full pl-1 pr-3 py-1 shadow-sm border border-[#e6e1db] ml-12">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-white">
             {characterAvatar ? (
               <img src={characterAvatar} alt="char" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">AI</div>
             )}
          </div>
          <span className="text-sm font-medium text-gray-700">{relation?.characterName || 'AI伴侣'}</span>
        </div>

        {/* Right: Days Counter - 简单文字 */}
        <div className="flex items-center gap-1.5">
          <Icons.HeartFilled className="w-5 h-5 text-[#ff6b6b]" />
          <span className="font-bold text-lg text-[#5d4037]">在一起 {daysCount} 天</span>
        </div>
      </div>
    </div>
  )

  const RoomView = () => (
    <div className="w-full h-full bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-100 relative flex flex-col">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-30 pt-[env(safe-area-inset-top)]">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#8b7355] hover:bg-white transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center pt-20 pb-24">
        {/* Title */}
        <div className="px-6 mb-6">
          <h2 className="text-white/90 font-serif text-2xl tracking-wider italic drop-shadow-sm">Sweet Moments</h2>
        </div>

        {/* Horizontal Scrolling Carousel */}
        <div 
          ref={carouselRef} 
          className="flex overflow-x-auto pb-6 px-6 hide-scrollbar gap-4"
        >
          {/* First set: photos + upload placeholder */}
          {[0, 1, 2, 3].map((i) => {
            const photo = photos[i]
            const rotation = (i % 2 === 0 ? 1 : -1) * (i % 3 + 1)
            if (photo) {
              return (
                <div
                  key={photo.id}
                  onClick={() => navigate('/couple-album')}
                  className="shrink-0 w-36 aspect-square bg-white/90 p-1.5 pb-5 shadow-lg hover:rotate-0 transition-transform duration-300 cursor-pointer rounded-sm"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  {photo.imageUrl ? (
                    <img src={photo.imageUrl} alt={photo.description} className="w-full h-full object-cover rounded-sm" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 rounded-sm flex items-center justify-center">
                      <Icons.HeartFilled className="w-8 h-8 text-pink-300" />
                    </div>
                  )}
                </div>
              )
            } else {
              return (
                <div
                  key={`upload-${i}`}
                  onClick={() => navigate('/couple-album')}
                  className="shrink-0 w-36 aspect-square bg-white/90 p-2 pb-6 shadow-lg hover:rotate-0 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-sm"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <Icons.Album className="w-5 h-5" />
                  </div>
                  <div className="text-gray-400 text-[10px] font-medium">上传照片</div>
                </div>
              )
            }
          })}
          {/* Second set: duplicate for infinite scroll effect */}
          {[0, 1, 2, 3].map((i) => {
            const photo = photos[i]
            const rotation = (i % 2 === 0 ? 1 : -1) * (i % 3 + 1)
            if (photo) {
              return (
                <div
                  key={`copy-${photo.id}`}
                  onClick={() => navigate('/couple-album')}
                  className="shrink-0 w-36 aspect-square bg-white/90 p-1.5 pb-5 shadow-lg hover:rotate-0 transition-transform duration-300 cursor-pointer rounded-sm"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  {photo.imageUrl ? (
                    <img src={photo.imageUrl} alt={photo.description} className="w-full h-full object-cover rounded-sm" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 rounded-sm flex items-center justify-center">
                      <Icons.HeartFilled className="w-8 h-8 text-pink-300" />
                    </div>
                  )}
                </div>
              )
            } else {
              return (
                <div
                  key={`upload-copy-${i}`}
                  onClick={() => navigate('/couple-album')}
                  className="shrink-0 w-36 aspect-square bg-white/90 p-2 pb-6 shadow-lg hover:rotate-0 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-sm"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <Icons.Album className="w-5 h-5" />
                  </div>
                  <div className="text-gray-400 text-[10px] font-medium">上传照片</div>
                </div>
              )
            }
          })}
        </div>

        {/* 3. 心情日记便利贴 */}
        <div 
          className="relative mx-6 mb-8 mt-2 h-44 cursor-pointer"
          onClick={() => navigate('/couple-message-board')}
        >
           {/* Layer 1 (Bottom) */}
           <div className="absolute top-4 left-2 w-[92%] h-36 bg-[#fff8e1] rounded-lg shadow-sm transform -rotate-3 border border-[#f5e6ca]"></div>
           {/* Layer 2 (Middle) */}
           <div className="absolute top-2 left-4 w-[92%] h-36 bg-[#e1f5fe] rounded-lg shadow-sm transform rotate-2 border border-[#b3e5fc]"></div>
           {/* Layer 3 (Top - Main Content) */}
           <div className="absolute top-0 left-3 w-[94%] h-40 bg-white rounded-lg shadow-md transform -rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all duration-300 border border-[#e0e0e0] group p-4 flex flex-col justify-between">
              {/* Tape Decoration */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-sm border border-gray-100 shadow-sm opacity-60"></div>
              
              {/* 内容区域 - 左边心情图标，右边文字 */}
              <div className="flex gap-3 items-start flex-1">
                {/* 心情图标 */}
                {latestMessage?.mood && MOOD_IMAGES[latestMessage.mood] && (
                  <div className="shrink-0">
                    <img 
                      src={MOOD_IMAGES[latestMessage.mood]} 
                      alt="mood" 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                )}
                {/* 日记内容 */}
                <div className="flex-1 font-serif text-[#5d4037]/80 leading-relaxed text-sm italic line-clamp-3">
                  "{latestMessage?.content || '记录今天的心情...'}"
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-[#f5f5f5] pt-2 mt-2">
                 <div className="text-[10px] text-gray-400">点击查看更多</div>
                 <div className="flex items-center gap-1.5">
                   <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden">
                     {latestMessage?.characterName === '我' ? (
                       <div className="w-full h-full bg-gray-300 flex items-center justify-center text-[8px] text-white">我</div>
                     ) : characterAvatar ? (
                       <img src={characterAvatar} alt="avatar" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full bg-gray-200" />
                     )}
                   </div>
                   <span className="text-xs font-bold text-[#8b7355]">
                     {latestMessage?.characterName || relation?.characterName || 'AI伴侣'}
                   </span>
                 </div>
              </div>

              {/* Corner Fold Effect */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-tl from-gray-200 to-white transform shadow-sm rounded-tl-sm"></div>
           </div>
        </div>

      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )

  const BottomNav = () => (
    <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)] z-20">
      <div className="flex justify-around items-center h-20 px-6">
        {/* Q&A */}
        <button className="flex flex-col items-center gap-1 text-[#8b7355] opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-xl border-2 border-[#8b7355] flex items-center justify-center bg-white">
            <Icons.QnA className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold tracking-wide">占位</span>
        </button>

        {/* Couple Space (Center) */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center gap-1 transform -translate-y-1"
        >
          <div className="w-12 h-12 rounded-full bg-[#fceee9] border-2 border-[#8b7355] flex items-center justify-center shadow-sm">
            <Icons.HeartFilled className="w-6 h-6 text-[#ffb7b2]" />
          </div>
          <span className="text-xs font-bold tracking-wide text-[#8b7355]">情侣空间</span>
        </button>

        {/* Chat */}
        <button 
           onClick={() => relation?.characterId && navigate(`/chat/${relation.characterId}`)}
           className="flex flex-col items-center gap-1 text-[#8b7355] opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="w-10 h-8 rounded-xl border-2 border-[#8b7355] flex items-center justify-center bg-white">
             <Icons.ChatDots className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold tracking-wide">聊天</span>
        </button>
      </div>
    </div>
  )

  const SpaceMenuOverlay = () => {
    if (!isMenuOpen) return null

    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-[#fffbf5] animate-fade-in font-sans">
        {/* Header - Uploadable Background Area (Curved) */}
        <div className="relative w-full h-[35%]">
           {/* The Curved Container */}
           <div className="absolute inset-0 overflow-hidden" 
                style={{ borderRadius: '0 0 50% 50% / 0 0 20% 20%' }}>
              <div className="w-full h-full bg-[#ffeff2] relative border-b-2 border-[#c9b8a8]">
                 {coverImage ? (
                   <img src={coverImage} alt="cover" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-[#c9b8a8] gap-2">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#c9b8a8]/50 flex items-center justify-center">
                        <Icons.Album className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium">点击上传背景</span>
                   </div>
                 )}
                 {/* File Input */}
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                   onChange={handleImageUpload}
                 />
              </div>
           </div>
           
           {/* Title Overlay (Bottom of header) */}
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-white/80 px-4 py-1.5 rounded-full backdrop-blur-sm shadow-sm border border-[#c9b8a8]/30">
             <Icons.HeartFilled className="w-5 h-5 text-[#ffb7b2]" />
             <span className="text-lg font-bold text-[#8b7355] tracking-widest">情侣空间</span>
           </div>
        </div>

        {/* Menu Content */}
        <div className="flex-1 px-5 overflow-y-auto pb-20 pt-6 relative z-10">
          {/* Grid Menu (No borders, just icon + text) */}
          <div className="grid grid-cols-4 gap-6 mb-8">
             {[
               { name: '心情日记', icon: Icons.Book, route: '/couple-message-board', color: '#e8f5e9' },
               { name: '恋爱相册', icon: Icons.Album, route: '/couple-album', color: '#fff3e0' },
               { name: '纪念日', icon: Icons.Flower, route: '/couple-anniversary', color: '#fce4ec' },
               { name: '经期记录', icon: Icons.PeriodCalendar, route: '/couple-period', color: '#ffebee' }
             ].map((item, idx) => (
               <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => item.route && navigate(item.route)}>
                 <div 
                   className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-active:scale-95"
                   style={{ backgroundColor: item.color }}
                 >
                   <item.icon className="w-7 h-7 text-[#8b7355]" />
                 </div>
                 <span className="text-xs text-[#8b7355] font-bold tracking-wide">{item.name}</span>
               </div>
             ))}
          </div>

          {/* Cards Grid (Light brown borders) */}
          <div className="grid grid-cols-2 gap-4">
             {/* Card 1 - 心情日记 */}
             <div 
               onClick={() => navigate('/couple-message-board')}
               className="bg-white border-2 border-[#c9b8a8]/60 rounded-2xl p-4 shadow-sm relative h-28 flex flex-col justify-between overflow-hidden group active:scale-[0.98] transition-transform cursor-pointer"
             >
               <div className="flex flex-col z-10">
                 <span className="text-sm font-bold text-[#8b7355]">心情日记</span>
                 <span className="text-xs text-gray-500 mt-1">
                   {latestMessage?.mood ? `今日: ${latestMessage.mood === 'happy' ? '开心' : latestMessage.mood === 'love' ? '心动' : latestMessage.mood === 'calm' ? '平静' : latestMessage.mood === 'sad' ? '难过' : latestMessage.mood === 'angry' ? '生气' : '无语'}` : '记录今天的心情'}
                 </span>
               </div>
               <div className="absolute right-[-10px] bottom-[-10px] opacity-80">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center rotate-[-12deg]">
                    <Icons.Book className="w-8 h-8 text-green-300" />
                  </div>
               </div>
             </div>
             
             {/* Card 2 - Couple Pet */}
             <div 
               onClick={() => navigate('/couple-pet')}
               className="bg-white border-2 border-[#c9b8a8]/60 rounded-2xl p-4 shadow-sm relative h-28 flex flex-col justify-between overflow-hidden group active:scale-[0.98] transition-transform cursor-pointer"
             >
               <div className="flex flex-col z-10">
                 <span className="text-sm font-bold text-[#8b7355]">我的宠物</span>
                 <span className="text-xs text-gray-500 mt-1">
                   {petStatus === 'none' ? '去领养一只吧' : 
                    petStatus === 'naming' || petStatus === 'waitingAI' ? '领养中...' :
                    petName || '小蛋蛋'}
                 </span>
               </div>
               <div className="absolute right-1 bottom-1">
                  <div className="w-12 h-14 bg-orange-50 rotate-[10deg] flex items-center justify-center rounded-lg">
                    {petStatus === 'none' ? (
                      <svg viewBox="0 0 24 24" className="w-7 h-7 text-orange-300" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                    ) : petStatus === 'egg' || petStatus === 'naming' || petStatus === 'waitingAI' ? (
                      <svg viewBox="0 0 60 75" className="w-8 h-10">
                        <defs><radialGradient id="eggG" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="#fff9f0" /><stop offset="100%" stopColor="#f3e5d8" /></radialGradient></defs>
                        <path d="M30 5 C 50 5, 58 30, 58 45 C 58 65, 45 72, 30 72 C 15 72, 2 65, 2 45 C 2 30, 10 5, 30 5 Z" fill="url(#eggG)" stroke="#d7ccc8" strokeWidth="1.5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 200 200" className="w-10 h-10">
                        <circle cx="100" cy="110" r="55" fill="#fff" stroke="#8b7355" strokeWidth="3" />
                        <path d="M55 75 Q 35 25, 70 55 Z" fill="#fff" stroke="#8b7355" strokeWidth="2" />
                        <path d="M145 75 Q 165 25, 130 55 Z" fill="#fff" stroke="#8b7355" strokeWidth="2" />
                        <circle cx="85" cy="105" r="4" fill="#5d4037" />
                        <circle cx="115" cy="105" r="4" fill="#5d4037" />
                        <path d="M95 118 Q100 123, 105 118" fill="none" stroke="#5d4037" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
               </div>
             </div>

             {/* Card 3 - 情侣打卡 */}
             <div 
               onClick={() => navigate('/couple-check-in')}
               className="bg-white border-2 border-[#c9b8a8]/60 rounded-2xl p-4 shadow-sm relative h-28 flex flex-col justify-between overflow-hidden group active:scale-[0.98] transition-transform cursor-pointer"
             >
               <div className="flex flex-col z-10">
                 <span className="text-sm font-bold text-[#8b7355]">情侣打卡</span>
                 <span className="text-xs text-gray-500 mt-1">已连续 {checkInStreak} 天</span>
               </div>
               <div className="absolute right-[-5px] bottom-[-5px]">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center rotate-[15deg]">
                    <Icons.Fire className="w-8 h-8 text-orange-400" />
                  </div>
               </div>
             </div>

             {/* Card 4 - 占位 */}
             <div className="bg-white border-2 border-[#c9b8a8]/60 rounded-2xl p-4 shadow-sm relative h-28 flex flex-col justify-between overflow-hidden group active:scale-[0.98] transition-transform opacity-50">
               <div className="flex flex-col z-10">
                 <span className="text-sm font-bold text-[#8b7355]">占位</span>
                 <span className="text-xs text-gray-500 mt-1">敬请期待</span>
               </div>
               <div className="absolute right-[-5px] bottom-[-5px]">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                     <Icons.HeartFilled className="w-8 h-8 text-gray-300" />
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Close Button - 放在右上角避免挡住头像 */}
        <div className="absolute top-6 right-6 z-50 pt-[env(safe-area-inset-top)]">
           <button 
             onClick={() => setIsMenuOpen(false)}
             className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-[#c9b8a8] flex items-center justify-center shadow-sm hover:bg-white transition-colors"
           >
             <Icons.Close className="w-5 h-5 text-[#8b7355]" />
           </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full relative overflow-hidden font-sans">
      <TopBar />
      <RoomView />
      <BottomNav />
      <SpaceMenuOverlay />
    </div>
  )
}

export default CoupleSpace
