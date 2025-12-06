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

  const { content, prompt, images } = message.post

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

  // 如果是AI发送的消息（received），显示“我发布了论坛”通知卡片
  if (message.type === 'received') {
    const lines = content.split('\n').filter(line => line.trim())
    const title = lines[0] || '无标题'
    const summary = lines.slice(1).join(' ').trim()

    return (
      <div className="w-[280px] rounded-[24px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 cursor-pointer hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 group backdrop-blur-xl bg-white/60">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-black/90 flex items-center justify-center shadow-lg shadow-black/10 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-[14px] font-bold text-gray-800 leading-tight mb-0.5 tracking-wide">我发布了论坛</div>
            <div className="text-[11px] text-gray-500/90 font-medium">快来查看吧</div>
          </div>
        </div>

        <div className="bg-white/40 rounded-2xl p-3.5 mb-3 border border-white/50 group-hover:bg-white/60 transition-colors duration-300">
          <div className="text-[13px] font-bold text-gray-800 mb-1 line-clamp-1">{title}</div>
          {summary && (
            <div className="text-[11px] text-gray-600/80 line-clamp-2 leading-relaxed">
              {summary}
            </div>
          )}
          {/* 🔥 图片预览 */}
          {images && Array.isArray(images) && images.length > 0 && (
            <div className="mt-2 rounded-lg overflow-hidden">
              <img 
                src={images[0]} 
                alt="帖子配图" 
                className="w-full h-24 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            <span className="text-[10px] text-gray-400 font-medium">刚刚</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-800 group-hover:translate-x-1 transition-transform duration-300">
            查看详情
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  // 如果是用户发送的消息（sent），显示完整的帖子卡片（Feed流样式）
  const forumType = detectForumType()
  const { mainPost, opName, comments } = parsePostContent(content)

  return (
    <div className="max-w-[350px] w-full bg-white/70 backdrop-blur-2xl rounded-[28px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/50 overflow-hidden font-sans hover:shadow-[0_15px_50px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-0.5">
      {/* 头部用户信息 */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50/80 to-indigo-50/80 flex items-center justify-center text-blue-600 font-bold text-sm border border-white shadow-sm backdrop-blur-sm">
              {opName.charAt(0)}
            </div>
            {opName === '楼主' && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-[2.5px] border-white flex items-center justify-center shadow-sm">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-gray-800 leading-none tracking-wide">{opName}</span>
              {forumType === '表白墙' && <span className="px-2 py-0.5 bg-pink-100/50 text-pink-600 text-[9px] rounded-full font-bold border border-pink-100">表白</span>}
              {forumType === '树洞' && <span className="px-2 py-0.5 bg-gray-100/50 text-gray-600 text-[9px] rounded-full font-bold border border-gray-100">树洞</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-gray-400 font-medium">{forumType}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
              <span className="text-[10px] text-gray-400 font-medium">刚刚</span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-black/5 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
      </div>

      {/* 帖子内容 */}
      <div className="px-5 pb-3">
        {mainPost && (
          <div className={`text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap break-words tracking-wide font-medium ${!isExpanded ? 'line-clamp-4' : ''
            }`}>
            {mainPost}
          </div>
        )}

        {/* 🔥 帖子图片 */}
        {images && Array.isArray(images) && images.length > 0 && (
          <div className={`mt-3 ${images.length === 1 ? '' : 'grid grid-cols-2 gap-1.5'}`}>
            {images.map((url, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden bg-gray-100">
                <img 
                  src={url} 
                  alt={`配图${idx + 1}`} 
                  className={`w-full object-cover ${images.length === 1 ? 'max-h-48' : 'h-24'}`}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* 展开/收起按钮 */}
        {(mainPost.length > 100 || comments.length > 0) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-[13px] text-blue-600/90 font-bold hover:text-blue-700 flex items-center gap-0.5 transition-colors"
          >
            {isExpanded ? '收起' : '全文'}
          </button>
        )}
      </div>

      {/* 底部交互栏 */}
      <div className="px-5 py-3.5 flex items-center justify-between border-t border-white/40 mt-1 bg-white/10">
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors group">
          <div className="p-1.5 rounded-full group-hover:bg-red-50/80 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium">赞</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors group">
          <div className="p-1.5 rounded-full group-hover:bg-blue-50/80 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-xs font-medium">{comments.length > 0 ? comments.length : '评论'}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition-colors group">
          <div className="p-1.5 rounded-full group-hover:bg-green-50/80 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <span className="text-xs font-medium">分享</span>
        </button>
      </div>

      {/* 评论区 */}
      {comments.length > 0 && isExpanded && (
        <div className="bg-white/30 px-5 py-4 space-y-4 border-t border-white/40 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-800">全部评论</div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              按热度
            </div>
          </div>
          {comments.map((comment, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${comment.isNested ? 'ml-8 mt-2' : ''}`}
            >
              <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-gray-500 font-bold text-[10px] flex-shrink-0 border border-white shadow-sm">
                {comment.user.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold text-gray-700">
                    {comment.user}
                  </span>
                  {comment.isNested && (
                    <span className="text-[10px] text-gray-400">回复</span>
                  )}
                </div>
                <div className="text-[13px] text-gray-800 leading-relaxed break-words">
                  {comment.content}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-400">刚刚</span>
                  <button className="text-[10px] text-gray-500 hover:text-gray-900 font-medium transition-colors">回复</button>
                  <button className="flex items-center gap-0.5 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PostCard
