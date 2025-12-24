/**
 * 情侣空间 - 底部导航
 */

import { useNavigate } from 'react-router-dom'
import { Icons } from './Icons'
import type { CoupleSpaceRelation } from '../../utils/coupleSpaceUtils'

interface BottomNavProps {
  relation: CoupleSpaceRelation | null
  onOpenMenu: () => void
}

export const BottomNav = ({ relation, onOpenMenu }: BottomNavProps) => {
  const navigate = useNavigate()

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)] z-20">
      <div className="flex justify-around items-center h-20 px-6">
        {/* 设置 */}
        <button 
          onClick={() => navigate('/couple-space-settings')}
          className="flex flex-col items-center gap-1 text-[#8b7355] opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="w-8 h-8 rounded-xl border-2 border-[#8b7355] flex items-center justify-center bg-white">
            <Icons.Settings className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold tracking-wide">设置</span>
        </button>

        {/* Couple Space (Center) */}
        <button 
          onClick={onOpenMenu}
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
}
