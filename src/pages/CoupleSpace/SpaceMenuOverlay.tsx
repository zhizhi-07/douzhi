/**
 * 情侣空间 - 菜单弹窗
 */

import { useNavigate } from 'react-router-dom'
import { Icons } from './Icons'
import type { CoupleSpaceRelation } from '../../utils/coupleSpaceUtils'
import type { CoupleMessage } from '../../utils/coupleSpaceContentUtils'

interface SpaceMenuOverlayProps {
  isOpen: boolean
  onClose: () => void
  relation: CoupleSpaceRelation | null
  coverImage: string
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  latestMessage: CoupleMessage | null
  petStatus: 'none' | 'naming' | 'waitingAI' | 'egg' | 'hatched'
  petName: string
  checkInStreak: number
  privacyMode: 'public' | 'private'
}

export const SpaceMenuOverlay = ({
  isOpen,
  onClose,
  coverImage,
  onCoverUpload,
  latestMessage,
  petStatus,
  petName,
  checkInStreak,
  privacyMode
}: SpaceMenuOverlayProps) => {
  const navigate = useNavigate()

  if (!isOpen) return null

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
              onChange={onCoverUpload}
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

          {/* Card 4 - 设置 */}
          <div 
            onClick={() => { onClose(); navigate('/couple-space-settings') }}
            className="bg-white border-2 border-[#c9b8a8]/60 rounded-2xl p-4 shadow-sm relative h-28 flex flex-col justify-between overflow-hidden group active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex flex-col z-10">
              <span className="text-sm font-bold text-[#8b7355]">设置</span>
              <span className="text-xs text-gray-500 mt-1">{privacyMode === 'private' ? '私密模式' : '公开模式'}</span>
            </div>
            <div className="absolute right-[-5px] bottom-[-5px]">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <Icons.Settings className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Close Button - 放在右上角避免挡住头像 */}
      <div className="absolute top-6 right-6 z-50 pt-[env(safe-area-inset-top)]">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-[#c9b8a8] flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Icons.Close className="w-5 h-5 text-[#8b7355]" />
        </button>
      </div>
    </div>
  )
}
