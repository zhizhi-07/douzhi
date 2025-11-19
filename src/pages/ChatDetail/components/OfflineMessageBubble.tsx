/**
 * 线下模式消息组件（小说阅读风格）
 */

import { Message } from '../../../types/chat'

interface OfflineMessageBubbleProps {
  message: Message
  characterName: string
  characterAvatar?: string
}

const OfflineMessageBubble = ({ message }: OfflineMessageBubbleProps) => {
  const isUser = message.type === 'sent'
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
  
  return (
    <div className="py-4">
      {/* 用户消息 */}
      {isUser && (
        <div className="px-6 sm:px-12 mb-12">
          <div className="max-w-2xl mx-auto">
            {/* 时间戳 */}
            <div className="flex justify-center mb-8">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                {formatTime(message.timestamp)}
              </span>
            </div>
            
            {/* 用户文字 */}
            <div className="relative">
              <div className="absolute -left-4 top-0 text-gray-300 text-6xl font-serif">"“</div>
              <div className="pt-3 pb-3 px-8 text-base text-gray-800 leading-relaxed text-center font-medium">
                {message.content}
              </div>
              <div className="absolute -right-4 bottom-0 text-gray-300 text-6xl font-serif">"”</div>
            </div>
          </div>
        </div>
      )}
      
      {/* AI消息 */}
      {!isUser && (
        <div className="px-6 sm:px-12 mb-12">
          <div className="max-w-2xl mx-auto">
            {/* AI回复 */}
            {message.content?.split('\n\n').filter(p => p.trim()).map((paragraph, index) => {
              const trimmed = paragraph.trim()
              
              // 检测是否是对话（带引号）
              const isQuote = /^["「『"‘]/.test(trimmed) || /["」』"’]$/.test(trimmed)
              
              // 检测是否是内心独白（【】标记）
              const isThought = /^【.*】$/.test(trimmed)
              
              if (isThought) {
                return (
                  <div key={index} className="my-8 px-8 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-200"></div>
                    <p className="text-sm leading-relaxed text-gray-500 italic">
                      {trimmed.replace(/[【】]/g, '')}
                    </p>
                  </div>
                )
              }
              
              if (isQuote) {
                return (
                  <div key={index} className="my-8 px-12">
                    <p className="text-base leading-relaxed text-gray-700 font-medium">
                      {trimmed}
                    </p>
                  </div>
                )
              }
              
              return (
                <p key={index} className="text-base leading-loose text-gray-800 mb-6 last:mb-0 text-justify first-letter:text-2xl first-letter:font-bold first-letter:mr-1 first-letter:float-left">
                  {trimmed}
                </p>
              )
            })}
            
            {/* 分隔线 */}
            <div className="mt-12 flex justify-center">
              <div className="flex items-center gap-2">
                <span className="w-8 h-px bg-gray-300"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                <span className="w-8 h-px bg-gray-300"></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfflineMessageBubble
