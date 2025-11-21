/**
 * 帖子卡片组件
 * 显示AI生成的社交媒体帖子，模拟真实社交媒体界面
 */

import { Message } from '../types/chat'
import { useState } from 'react'

interface PostCardProps {
  message: Message
}

const PostCard = ({ message }: PostCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!message.post) {
    return null
  }

  const { content, prompt } = message.post

  // 智能识别论坛类型
  const detectForumType = () => {
    const promptLower = (prompt || '').toLowerCase()
    const contentLower = content.toLowerCase()
    const combined = promptLower + ' ' + contentLower

    if (combined.includes('表白墙') || combined.includes('表白')) return '表白墙'
    if (combined.includes('豆瓣') || combined.includes('小组')) return '豆瓣'
    if (combined.includes('知乎') || combined.includes('回答')) return '知乎'
    if (combined.includes('校园') || combined.includes('学校') || combined.includes('大学')) return '校园论坛'
    if (combined.includes('树洞') || combined.includes('匿名')) return '树洞'
    if (combined.includes('贴吧')) return '贴吧'
    if (combined.includes('论坛')) return '论坛'
    
    return '社区'
  }

  const forumType = detectForumType()

  // 解析帖子内容，分离楼主、楼层和楼中楼
  const parsePostContent = (text: string) => {
    const lines = text.split('\n')
    const comments: Array<{ user: string; content: string; isNested?: boolean }> = []
    let mainPost = ''
    let opName = '匿名用户' // 楼主名字
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // 匹配楼主：楼主（OP）：内容 或 楼主：内容
      const opMatch = line.match(/^楼主(?:（OP）)?[：:](.+)$/)
      if (opMatch) {
        mainPost += opMatch[1].trim() + '\n'
        opName = '楼主'
        continue
      }
      
      // 匹配楼层：【1L 用户名】内容 或 【2L 用户名】后面跟内容
      const floorMatch = line.match(/^【(\d+L)\s*(.+?)】(.*)$/)
      if (floorMatch) {
        const userName = floorMatch[2].trim()
        let content = floorMatch[3].trim()
        
        // 如果内容为空，看下一行
        if (!content && i + 1 < lines.length) {
          content = lines[i + 1].trim()
          i++ // 跳过下一行
        }
        
        comments.push({
          user: userName,
          content: content
        })
        continue
      }
      
      // 匹配楼中楼：-> 用户名：内容 或 - 用户名：内容
      const nestedMatch = line.match(/^[-=]>\s*(.+?)[：:](.+)$/)
      if (nestedMatch) {
        comments.push({
          user: nestedMatch[1].trim(),
          content: nestedMatch[2].trim(),
          isNested: true
        })
        continue
      }
      
      // 如果还没有主帖内容，当作主帖
      if (!mainPost && !comments.length) {
        mainPost += line + '\n'
      } else if (comments.length > 0) {
        // 如果已经有评论，当作最后一个评论的续行
        const lastComment = comments[comments.length - 1]
        lastComment.content += '\n' + line
      } else {
        mainPost += line + '\n'
      }
    }
    
    return { 
      mainPost: mainPost.trim(), 
      opName,
      comments 
    }
  }

  const { mainPost, opName, comments } = parsePostContent(content)

  return (
    <div className="max-w-sm">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 头部标识 */}
        <div className="px-3 py-2.5 bg-gradient-to-r from-gray-50 to-white flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-xs font-semibold text-gray-700">{forumType}</span>
          <span className="text-[10px] text-gray-400 ml-auto">刚刚</span>
        </div>

        {/* 主帖内容 */}
        {mainPost && (
          <div className="px-4 py-3 bg-white">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                楼
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-gray-800">{opName}</span>
                  <span className="text-[10px] text-gray-400">楼主</span>
                </div>
                <div 
                  className={`text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words ${
                    !isExpanded ? 'line-clamp-3' : ''
                  }`}
                >
                  {mainPost}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 展开/收起按钮 */}
        {(mainPost.length > 100 || comments.length > 0) && (
          <div className="px-4 py-2 bg-white">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-blue-500 font-medium flex items-center gap-1 active:opacity-70 transition-opacity"
            >
              {isExpanded ? (
                <>
                  <span>收起</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>展开全文</span>
                  {comments.length > 0 && <span className="text-gray-400">({comments.length}条评论)</span>}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* 评论区 */}
        {comments.length > 0 && isExpanded && (
          <div className="px-3 py-2.5 space-y-2 max-h-80 overflow-y-auto bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-[11px] font-semibold text-gray-600">
                热门评论
              </div>
              <div className="text-[10px] text-gray-400">
                {comments.length} 条
              </div>
            </div>
            {comments.map((comment, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-2 ${comment.isNested ? 'ml-5' : ''}`}
              >
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-[10px] flex-shrink-0">
                  {comment.user.charAt(0)}
                </div>
                <div className={`flex-1 min-w-0 rounded-lg px-2.5 py-2 ${
                  comment.isNested 
                    ? 'bg-gray-50' 
                    : 'bg-white'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-gray-800">
                      {comment.user}
                    </span>
                    <span className="text-[9px] text-gray-400">刚刚</span>
                  </div>
                  <div className="text-[12px] text-gray-700 leading-relaxed break-words">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部交互栏 */}
        <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex items-center justify-around">
          <button className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span className="text-[11px] font-medium">赞</span>
          </button>
          <button className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[11px] font-medium">评论</span>
          </button>
          <button className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-[11px] font-medium">分享</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostCard
