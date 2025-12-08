/**
 * 评论内容渲染器
 * 支持：
 * 1. 中插HTML小剧场 [小剧场HTML]...[/小剧场HTML]
 * 2. 表情包 [表情:描述]
 */

import { useMemo } from 'react'
import EmojiContentRenderer from './EmojiContentRenderer'

interface Props {
  content: string
  className?: string
  emojiSize?: number
}

// 安全过滤HTML：移除危险标签和属性
const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

// 中插HTML的样式
const theatreHtmlStyles = `
  .theatre-html-wrapper {
    transform: scale(0.85);
    transform-origin: center top;
  }
  .theatre-html-wrapper > div {
    margin: 0 auto !important;
  }
  .theatre-card {
    background: white;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.04);
    margin: 0 auto;
  }
  .theatre-card.type-note {
    background: linear-gradient(135deg, #FFF9C4 0%, #FFFDE7 100%);
    border-color: #FFF176;
  }
  .theatre-card.type-mood {
    background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
    border-color: #81D4FA;
  }
  .theatre-card.type-reminder {
    background: linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%);
    border-color: #F48FB1;
  }
  .theatre-card.type-memory {
    background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
    border-color: #CE93D8;
  }
  .theatre-card .tag {
    font-size: 11px;
    color: #666;
    margin-bottom: 6px;
    font-weight: 500;
  }
  .theatre-card .content {
    font-size: 13px;
    color: #333;
    line-height: 1.5;
  }
`

export default function CommentContentRenderer({ content, className = '', emojiSize = 16 }: Props) {
  // 解析内容，分离中插HTML和普通文本
  const renderedContent = useMemo(() => {
    if (!content) return null

    // 匹配中插HTML：[小剧场HTML]...[/小剧场HTML]
    const htmlPattern = /\[小剧场HTML\]([\s\S]*?)\[\/小剧场HTML\]/g
    const parts: JSX.Element[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let keyIndex = 0

    while ((match = htmlPattern.exec(content)) !== null) {
      // 添加HTML之前的普通文本（使用EmojiContentRenderer渲染）
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index).trim()
        if (textBefore) {
          parts.push(
            <EmojiContentRenderer 
              key={`text-${keyIndex++}`}
              content={textBefore}
              emojiSize={emojiSize}
            />
          )
        }
      }

      // 渲染中插HTML
      const htmlContent = match[1].trim()
      const safeHtml = sanitizeHtml(htmlContent)
      
      parts.push(
        <div key={`html-${keyIndex++}`} className="my-2">
          <style>{theatreHtmlStyles}</style>
          <div 
            className="theatre-html-wrapper" 
            dangerouslySetInnerHTML={{ __html: safeHtml }} 
          />
        </div>
      )

      lastIndex = match.index + match[0].length
    }

    // 添加最后的普通文本
    if (lastIndex < content.length) {
      const textAfter = content.slice(lastIndex).trim()
      if (textAfter) {
        parts.push(
          <EmojiContentRenderer 
            key={`text-${keyIndex++}`}
            content={textAfter}
            emojiSize={emojiSize}
          />
        )
      }
    }

    // 如果没有匹配到任何HTML，直接使用EmojiContentRenderer
    if (parts.length === 0) {
      return <EmojiContentRenderer content={content} emojiSize={emojiSize} />
    }

    return parts
  }, [content, emojiSize])

  return <div className={className}>{renderedContent}</div>
}

/**
 * 检测内容是否包含中插HTML
 */
export function hasTheatreHtml(content: string): boolean {
  return /\[小剧场HTML\][\s\S]*?\[\/小剧场HTML\]/.test(content)
}
