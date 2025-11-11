/**
 * 线下模式消息组件（小说阅读风格）
 */

import { Message } from '../../../types/chat'

interface OfflineMessageBubbleProps {
  message: Message
  characterName: string
  characterAvatar?: string
}

const OfflineMessageBubble = ({ message, characterName }: OfflineMessageBubbleProps) => {
  const isUser = message.type === 'sent'
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hours}:${minutes}`
  }
  
  return (
    <div className="py-4">
      {/* 用户消息 */}
      {isUser && (
        <div className="px-8 mb-8">
          <div className="max-w-2xl mx-auto">
            {/* 红色区域：角色名和时间 */}
            <div className="text-xs text-gray-500 mb-8">
              {characterName} · {formatTime(message.timestamp)}
            </div>
            
            {/* 黄色区域：用户发的文字 - 加大上方空白 */}
            <div className="pt-16 pb-12 text-sm text-gray-700 font-serif leading-relaxed text-center">
              {message.content}
            </div>
          </div>
        </div>
      )}
      
      {/* AI消息 */}
      {!isUser && (
        <div className="px-8 mb-8">
          <div className="max-w-2xl mx-auto">
            {/* 蓝色区域：AI回复的正文 */}
            {message.content?.split('\n\n').filter(p => p.trim()).map((paragraph, index) => {
              const trimmed = paragraph.trim()
              
              // 检测是否是引用或对话（带引号）
              const isQuote = /^["「『"]/.test(trimmed) || /["」』"]$/.test(trimmed)
              
              if (isQuote) {
                return (
                  <div key={index} className="text-center my-6">
                    <p className="text-[14px] leading-relaxed text-gray-700 font-serif italic">
                      {trimmed}
                    </p>
                  </div>
                )
              }
              
              return (
                <p key={index} className="text-[15px] leading-loose text-gray-800 mb-4 last:mb-0 indent-8">
                  {trimmed}
                </p>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default OfflineMessageBubble
