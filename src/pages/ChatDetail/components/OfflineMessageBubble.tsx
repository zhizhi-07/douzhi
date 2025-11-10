/**
 * 线下模式消息气泡（小说叙事风格）
 */

import { Message } from '../../../types/chat'
import Avatar from '../../../components/Avatar'

interface OfflineMessageBubbleProps {
  message: Message
  characterName: string
  characterAvatar?: string
}

const OfflineMessageBubble = ({ message, characterName, characterAvatar }: OfflineMessageBubbleProps) => {
  const isUser = message.type === 'sent'
  
  return (
    <div className="px-3 py-1.5">
      {/* 用户消息 */}
      {isUser && (
        <div className="flex justify-end mb-2">
          <div className="bg-blue-500 text-white rounded-2xl px-3 py-2 max-w-[70%]">
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      )}
      
      {/* AI的小说叙事 */}
      {!isUser && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Avatar type="received" avatar={characterAvatar} name={characterName} />
            <span className="text-xs text-gray-500">{characterName}</span>
          </div>
          
          <div className="bg-white rounded-2xl px-3 py-2.5 max-w-[85%]">
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfflineMessageBubble
