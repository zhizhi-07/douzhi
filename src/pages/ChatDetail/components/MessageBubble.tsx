import React from 'react'
import { Message } from '../../../types/chat'

interface MessageBubbleProps {
  message: Message
  onLongPressStart: (message: Message, e: React.TouchEvent | React.MouseEvent) => void
  onLongPressEnd: () => void
}

/**
 * 纯文本消息气泡组件
 * 支持用户自定义CSS样式
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onLongPressStart,
  onLongPressEnd
}) => {
  // 过滤掉特殊标签（这些只应在特定场景中显示）
  const filterSpecialTags = (content?: string) => {
    if (!content) return ''
    // 移除画面描述：[画面:...] 或 【画面：...】
    let filtered = content.replace(/[\[【]画面[:\：][^\]】]+[\]】]/g, '')
    // 移除相册标签：[相册:...]
    filtered = filtered.replace(/[\[【]相册[:\：][^\]】]+[\]】]/g, '')
    // 移除纪念日标签：[纪念日:...]
    filtered = filtered.replace(/[\[【]纪念日[:\：][^\]】]+[\]】]/g, '')
    // 移除留言标签：[留言:...]
    filtered = filtered.replace(/[\[【]留言[:\：][^\]】]+[\]】]/g, '')
    return filtered.trim()
  }

  const displayContent = filterSpecialTags(message.content)
  
  // 如果过滤后内容为空，不显示
  if (!displayContent) return null

  return (
    <div
      className="message-bubble px-2.5 py-1.5 break-words cursor-pointer message-press text-sm"
      onTouchStart={(e) => onLongPressStart(message, e)}
      onTouchEnd={onLongPressEnd}
      onMouseDown={(e) => onLongPressStart(message, e)}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
    >
      <div className="whitespace-pre-wrap">{displayContent}</div>
    </div>
  )
}
