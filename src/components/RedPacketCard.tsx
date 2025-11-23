import React from 'react'
import type { Message } from '../types/chat'

interface RedPacketCardProps {
  message: Message
  onOpenRedPacket?: (messageId: number) => void
}

const RedPacketCard: React.FC<RedPacketCardProps> = ({
  message,
  onOpenRedPacket
}) => {
  const redPacket = (message as any).redPacket
  
  // 判断当前用户是否已领取
  const hasReceived = redPacket?.received?.some((r: any) => r.userId === 'user')
  const isExpired = redPacket?.remainingCount === 0 && redPacket?.remaining === 0
  
  // 状态显示
  let statusText = '查看详情'
  if (hasReceived) statusText = '已领取'
  else if (isExpired) statusText = '已抢完'
  else statusText = '领取红包'

  return (
    <div 
      className="w-60 cursor-pointer active:scale-95 transition-transform"
      onClick={() => onOpenRedPacket?.(message.id)}
    >
      <div className="relative overflow-hidden rounded-lg shadow-sm">
        {/* 顶部红色区域 */}
        <div className="bg-[#fa9d3b] p-3.5 flex items-start gap-3 relative h-[88px]">
          {/* 红包图标 - 直接显示不加框 */}
          <div className="w-10 h-12 flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-[#f8d75d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          {/* 文本信息 */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="text-white text-[15px] font-medium truncate leading-tight mb-1">
              {redPacket?.blessing || '恭喜发财，大吉大利'}
            </div>
            <div className="text-white/80 text-xs">
              {statusText}
            </div>
          </div>
        </div>
        
        {/* 底部白色区域 */}
        <div className="bg-white px-3.5 py-1.5 flex items-center justify-between border-t border-gray-100">
          <span className="text-[11px] text-gray-400">微信红包</span>
        </div>
      </div>
    </div>
  )
}

export default RedPacketCard
