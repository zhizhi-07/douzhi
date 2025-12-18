import React from 'react'
import { Message } from '../types/chat'

interface CheckInCardProps {
  message: Message
}

const CheckInCard: React.FC<CheckInCardProps> = ({ message }) => {
  if (!message.checkIn) return null

  const { streak, fortune, level } = message.checkIn
  const isSent = message.type === 'sent'

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} my-2`}>
      {/* 整体容器 */}
      <div className={`
        relative group cursor-pointer 
        transition-all duration-300 active:scale-[0.98]
      `}>
        
        {/* 卡片阴影层 (因为mask会裁掉box-shadow，所以需要单独一层做阴影) */}
        <div className="absolute inset-0 bg-black/5 rounded-[20px] blur-sm translate-y-1 scale-[0.98] -z-10"></div>

        {/* 卡片主体 (The Tag) - 使用mask挖孔 */}
        <div 
          className="relative w-[250px] bg-[#fdfbf7] z-10 overflow-hidden"
          style={{
            // 关键：顶部挖孔
            maskImage: 'radial-gradient(circle at 50% 12px, transparent 6px, black 6.5px)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 12px, transparent 6px, black 6.5px)',
            borderRadius: '16px',
            border: '1px solid rgba(240, 230, 219, 0.8)' // 这里的border会被mask裁掉一部分，但仍有效果
          }}
        >
          {/* 纸质纹理 */}
          <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] pointer-events-none"></div>
          
          {/* 顶部金属加固环 (Reinforcement Ring) - 视觉上套在孔周围 */}
          <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full border border-[#d4c5b0]/60 pointer-events-none shadow-sm"></div>

          {/* 内容区域 */}
          <div className="pt-10 pb-5 px-4 flex flex-col gap-3">
             
             {/* 头部信息 */}
             <div className="flex justify-between items-end px-1 border-b border-[#ebdccb]/50 pb-2">
               <div className="flex flex-col">
                 <span className="text-[9px] font-black tracking-[0.2em] text-[#b09b82] uppercase scale-90 origin-left">CHECK-IN</span>
                 <span className="text-xs font-bold text-[#4a3b32] font-mono">
                   {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                 </span>
               </div>
               <div className="flex items-center gap-1 bg-[#f5efe6] px-2 py-0.5 rounded-sm border border-[#eaddcf]/50">
                 <span className="text-[10px] font-mono font-bold text-[#8b7355]">#{streak}</span>
               </div>
             </div>

             {/* 中间镂空/凹陷区域 (Recessed Area) */}
             <div className="relative group/window mt-1">
               {/* 内阴影模拟凹陷 */}
               <div className="absolute inset-0 bg-[#f2ede6] rounded-lg shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)] border-b border-white/80"></div>
               
               <div className="relative p-3 min-h-[64px] flex flex-col items-center justify-center text-center z-10">
                  <span className="text-[9px] text-[#9ca3af] tracking-widest uppercase mb-1 scale-90">Today's Fortune</span>
                  <p className="text-[13px] font-medium text-[#5d4037] leading-relaxed font-serif line-clamp-3">
                    {fortune.replace(/^今日一夜[:：]/, '')}
                  </p>
               </div>
             </div>

             {/* 底部 Badge */}
             {level && (
               <div className="flex justify-center mt-1">
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2d3436] text-[#dfe6e9] shadow-sm scale-90">
                   <svg className="w-2.5 h-2.5 text-[#ffeaa7]" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                   </svg>
                   <span className="text-[9px] font-bold tracking-wide">{level}</span>
                 </div>
               </div>
             )}
             
          </div>

          {/* 底部装饰条 */}
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-[#dcd0c0] opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#000_2px,#000_4px)]"></div>
          {/* 底部撕裂线装饰 (Perforation) */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between">
             {Array.from({ length: 12 }).map((_, i) => (
               <div key={i} className="w-1 h-1 rounded-full bg-[#dcd0c0]/40"></div>
             ))}
          </div>
        </div>

        {/* 只有在非mask元素上才能应用外阴影 (Drop Shadow Fix) */}
        <div className="absolute inset-0 rounded-[20px] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] -z-10 bg-[#fdfbf7] opacity-0"></div>
      </div>
    </div>
  )
}

export default CheckInCard
