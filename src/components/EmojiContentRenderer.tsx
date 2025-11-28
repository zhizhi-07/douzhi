/**
 * 表情包内容渲染器
 * 将文本中的 [表情:描述] 格式解析并渲染为实际的表情包图片
 */

import { useState, useEffect, useMemo } from 'react'
import { getEmojis, type Emoji } from '../utils/emojiStorage'

interface Props {
  content: string
  className?: string
  emojiSize?: number // 表情包大小，默认 24px
}

// 全局表情包缓存
let globalEmojiCache: Emoji[] | null = null

export default function EmojiContentRenderer({ content, className = '', emojiSize = 24 }: Props) {
  const [emojis, setEmojis] = useState<Emoji[]>(globalEmojiCache || [])

  // 加载表情包列表
  useEffect(() => {
    if (globalEmojiCache) return
    
    getEmojis().then(list => {
      globalEmojiCache = list
      setEmojis(list)
    }).catch(console.error)
  }, [])

  // 解析并渲染内容
  const renderedContent = useMemo(() => {
    if (!content) return null
    
    // 正则匹配 [表情:描述] 格式
    const emojiRegex = /\[表情[:：]([^\]]+)\]/g
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let keyIndex = 0

    while ((match = emojiRegex.exec(content)) !== null) {
      // 添加表情前的文本
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      const description = match[1].trim()
      
      // 查找匹配的表情包（支持模糊匹配）
      const emoji = emojis.find(e => 
        e.description === description || 
        e.description.includes(description) ||
        description.includes(e.description)
      )

      if (emoji) {
        // 找到表情包，渲染为图片
        parts.push(
          <img 
            key={`emoji-${keyIndex++}`}
            src={emoji.url} 
            alt={emoji.description}
            title={emoji.description}
            style={{ 
              width: emojiSize, 
              height: emojiSize, 
              display: 'inline-block',
              verticalAlign: 'middle',
              margin: '0 2px',
              objectFit: 'contain'
            }}
          />
        )
      } else {
        // 没找到表情包，显示原始格式
        parts.push(
          <span key={`emoji-text-${keyIndex++}`} className="text-gray-400 text-sm">
            {match[0]}
          </span>
        )
      }

      lastIndex = match.index + match[0].length
    }

    // 添加最后的文本
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }, [content, emojis, emojiSize])

  return <span className={className}>{renderedContent}</span>
}

/**
 * 纯函数版本：解析表情包内容（用于非React环境）
 * 返回包含文本和表情URL的数组
 */
export function parseEmojiContent(
  content: string, 
  emojis: Emoji[]
): Array<{ type: 'text' | 'emoji', value: string, description?: string }> {
  if (!content) return []
  
  const emojiRegex = /\[表情[:：]([^\]]+)\]/g
  const parts: Array<{ type: 'text' | 'emoji', value: string, description?: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = emojiRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }

    const description = match[1].trim()
    const emoji = emojis.find(e => 
      e.description === description || 
      e.description.includes(description) ||
      description.includes(e.description)
    )

    if (emoji) {
      parts.push({ type: 'emoji', value: emoji.url, description: emoji.description })
    } else {
      parts.push({ type: 'text', value: match[0] })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return parts
}
