/**
 * 情侣空间 - 主视图
 */

import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../../components/StatusBar'
import { Icons, MOOD_IMAGES } from './Icons'
import type { CoupleAlbumPhoto, CoupleMessage } from '../../utils/coupleSpaceContentUtils'
import type { FamilyMember } from '../../utils/coupleSpaceUtils'

interface RoomViewProps {
  userAvatar: string
  members: FamilyMember[]  // 成员数组
  daysCount: number
  photos: CoupleAlbumPhoto[]
  latestMessage: CoupleMessage | null
  relation: { characterName?: string } | null
  selectedMemberIndex: number  // 当前选中的成员索引
  onSelectMember: (index: number) => void  // 切换成员回调
}

export const RoomView = ({
  userAvatar,
  members,
  daysCount,
  photos,
  latestMessage,
  relation,
  selectedMemberIndex,
  onSelectMember
}: RoomViewProps) => {
  // 获取当前选中的成员
  const selectedMember = members[selectedMemberIndex] || members[0]
  const characterAvatar = selectedMember?.characterAvatar || ''
  const navigate = useNavigate()
  const carouselRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="w-full h-full bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-100 relative flex flex-col">
      {/* Status Bar + Back Button */}
      <div className="z-30">
        <StatusBar />
        <div className="px-4 py-2 flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#8b7355] hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center pb-24">
        {/* 头像 + 在一起多少天 */}
        <div className="flex flex-col items-center justify-center gap-3 mb-6">
          {/* 头像区域 - 重叠效果，支持多人 */}
          <div className="flex items-center justify-center">
            {/* 用户头像 */}
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg z-20">
              {userAvatar ? (
                <img src={userAvatar} alt="me" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-[#f5f5f5]">我</div>
              )}
            </div>
            {/* 成员头像 - 可点击切换 */}
            {members.map((member, index) => (
              <div 
                key={member.characterId}
                onClick={() => onSelectMember(index)}
                className={`w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-4 shadow-lg -ml-5 cursor-pointer transition-all ${
                  index === selectedMemberIndex ? 'border-pink-300 scale-110' : 'border-white hover:border-pink-200'
                }`}
                style={{ zIndex: index === selectedMemberIndex ? 20 : 19 - index }}
              >
                {member.characterAvatar ? (
                  <img src={member.characterAvatar} alt={member.characterName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-[#f5f5f5]">
                    {member.characterName?.charAt(0) || 'AI'}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* 文字 - 显示当前选中成员 */}
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#8b7355] font-medium">
              我和{selectedMember?.characterName || '对方'}在一起
            </span>
            <span className="font-bold text-3xl text-[#5d4037] font-serif">{daysCount} <span className="text-base font-normal">天</span></span>
          </div>
        </div>

        {/* Horizontal Scrolling Carousel */}
        <div 
          ref={carouselRef} 
          className="flex overflow-x-auto pb-6 px-6 hide-scrollbar gap-4 mt-6"
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
          className="relative mx-6 mb-8 mt-14 h-44 cursor-pointer"
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
}
