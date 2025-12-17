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
  // 读取时间戳设置
  const hideTimestamp = localStorage.getItem('hide_message_timestamp') === 'true'
  const timestampInBubble = localStorage.getItem('timestamp_in_bubble') === 'true'
  const globalButtonColor = localStorage.getItem('global_button_color') || '#475569'
  
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
  
  // 如果过滤后内容为空，且不是特殊消息类型，不显示
  // 特殊消息类型（如帖子）会由SpecialMessageRenderer处理
  if (!displayContent && !message.messageType) return null
  if (!displayContent && message.messageType === 'text') return null

  // 检测内容是否包含HTML代码（世界书卡片等）
  const isHtmlContent = (content: string) => {
    // 检测是否以<div或<span等HTML标签开头（允许前面有空白）
    const trimmed = content.trim()
    return /^<(div|span|section|article|table|ul|ol|p|h[1-6])\s/i.test(trimmed)
  }

  // 格式化文本：优化段落显示
  const formatText = (text: string) => {
    // 将文本按换行符分割成段落
    const paragraphs = text.split('\n')
    
    return paragraphs.map((para, index) => {
      const trimmedPara = para.trim()
      // 跳过空段落
      if (!trimmedPara) {
        // 保留空行，但限制连续空行数量
        if (index > 0 && paragraphs[index - 1].trim() === '') {
          return null // 跳过连续的空行
        }
        return <br key={index} />
      }
      
      return (
        <React.Fragment key={index}>
          {index > 0 && <br />}
          <span>{trimmedPara}</span>
        </React.Fragment>
      )
    }).filter(Boolean)
  }

  // 如果是HTML内容，渲染为卡片
  if (isHtmlContent(displayContent)) {
    return (
      <div
        className="break-words cursor-pointer message-press"
        onTouchStart={(e) => onLongPressStart(message, e)}
        onTouchEnd={onLongPressEnd}
        onMouseDown={(e) => onLongPressStart(message, e)}
        onMouseUp={onLongPressEnd}
        onMouseLeave={onLongPressEnd}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: displayContent }}
          style={{ maxWidth: '280px' }}
        />
      </div>
    )
  }

  return (
    <div
      className="message-bubble px-2.5 py-1.5 break-words cursor-pointer message-press text-sm"
      onTouchStart={(e) => onLongPressStart(message, e)}
      onTouchEnd={onLongPressEnd}
      onMouseDown={(e) => onLongPressStart(message, e)}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
    >
      {timestampInBubble && !hideTimestamp ? (
        <div className="flex items-end gap-2">
          <div className="leading-relaxed flex-1">{formatText(displayContent)}</div>
          <span style={{ color: globalButtonColor, opacity: 0.7, fontSize: '10px' }}>
            {message.time}
          </span>
        </div>
      ) : (
        <div className="leading-relaxed">{formatText(displayContent)}</div>
      )}
    </div>
  )
}
