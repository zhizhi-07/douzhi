/**
 * 位置卡片组件
 * 显示位置信息，带地图缩略图
 */

import type { Message } from '../types/chat'

interface LocationCardProps {
  message: Message
}

const LocationCard = ({ message }: LocationCardProps) => {
  if (!message.location) return null

  return (
    <div className="message-bubble w-[220px] cursor-pointer overflow-hidden rounded-2xl">
      {/* 地图缩略图 - 用自己的背景覆盖气泡背景 */}
      <div className="h-24 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #dbeafe, #dcfce7)' }}>
        {/* 模拟地图网格 */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>
        
        {/* 定位标记 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <svg className="w-7 h-7 text-red-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
      
      {/* 位置信息 */}
      <div className="p-2.5">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {message.location.name}
            </div>
            <div className="text-xs opacity-60 mt-1 line-clamp-2">
              {message.location.address}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationCard
