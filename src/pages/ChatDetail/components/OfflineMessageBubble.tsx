/**
 * 线下模式消息组件（头像在上气泡在下）
 */

import { Message } from '../../../types/chat'
import Avatar from '../../../components/Avatar'

interface OfflineMessageBubbleProps {
  message: Message
  characterName: string
  characterAvatar?: string
  chatId?: string
}

const OfflineMessageBubble = ({ message, characterName, characterAvatar, chatId }: OfflineMessageBubbleProps) => {
  const isUser = message.type === 'sent'
  
  return (
    <>
      {/* 线下模式大头像样式（只渲染一次） */}
      {chatId && (
        <style>{`
          .offline-avatar-large [class*="avatar-frame"] {
            width: 64px !important;
            height: 64px !important;
            border-radius: 50% !important;
          }
          .offline-avatar-large [class*="avatar-frame"] img {
            width: 100% !important;
            height: 100% !important;
          }
          .offline-avatar-large [class*="avatar-frame"] svg {
            width: 32px !important;
            height: 32px !important;
          }
        `}</style>
      )}
      
      <div className="py-6">
        {/* 用户消息 */}
        {isUser && (
          <div className="message-container sent flex flex-col items-center px-4">
            {/* 头像 */}
            <div className="mb-3 offline-avatar-large">
              <Avatar 
                type="sent"
                avatar={undefined}
                name="我"
                chatId={chatId}
              />
            </div>
          
          {/* 消息气泡 */}
          <div className="message-bubble max-w-[85%] px-4 py-3">
            <p className="text-sm leading-relaxed break-words">
              {message.content}
            </p>
          </div>
        </div>
      )}
      
      {/* AI消息 */}
      {!isUser && (
        <div className="message-container received flex flex-col items-center px-4">
          {/* 头像 */}
          <div className="mb-3 offline-avatar-large">
            <Avatar 
              type="received"
              avatar={characterAvatar}
              name={characterName}
              chatId={chatId}
            />
          </div>
          
          {/* 消息气泡 */}
          <div className="message-bubble max-w-[85%] px-4 py-3">
            {message.content?.split('\n\n').filter(p => p.trim()).map((paragraph, index) => {
              const trimmed = paragraph.trim()
              
              // 检测是否是内心独白（【】标记）
              const isThought = /^【.*】$/.test(trimmed)
              
              if (isThought) {
                return (
                  <div key={index} className="my-2 pl-3 border-l-2 border-gray-300">
                    <p className="text-sm leading-relaxed opacity-80 italic">
                      {trimmed.replace(/[【】]/g, '')}
                    </p>
                  </div>
                )
              }
              
              return (
                <p key={index} className="text-sm leading-relaxed mb-3 last:mb-0">
                  {trimmed}
                </p>
              )
            })}
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default OfflineMessageBubble
