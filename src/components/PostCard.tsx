/**
 * 帖子卡片组件
 * 显示AI生成的社交媒体帖子，模拟真实社交媒体界面
 */

import { Message } from '../types/chat'

interface PostCardProps {
  message: Message
}

const PostCard = ({ message }: PostCardProps) => {
  console.log('🎴 [PostCard] 渲染帖子:', message)
  
  if (!message.post) {
    console.log('❌ [PostCard] message.post 不存在')
    return null
  }

  const { content, prompt } = message.post
  console.log('📝 [PostCard] 帖子内容:', { content, prompt })

  // 解析帖子内容，分离评论
  const parsePostContent = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const comments: Array<{ user: string; content: string }> = []
    let mainPost = ''
    
    lines.forEach(line => {
      // 匹配评论格式：@用户名: 内容 或 用户名: 内容
      const commentMatch = line.match(/^[@]?([^:：]+)[：:](.+)$/)
      if (commentMatch) {
        comments.push({
          user: commentMatch[1].trim(),
          content: commentMatch[2].trim()
        })
      } else if (line.trim()) {
        mainPost += line + '\n'
      }
    })
    
    return { mainPost: mainPost.trim(), comments }
  }

  const { mainPost, comments } = parsePostContent(content)

  return (
    <div className="max-w-sm">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {/* 头部标识 */}
        <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-xs font-medium text-gray-600">虚拟帖子</span>
          {prompt && (
            <span className="text-xs text-gray-400 ml-auto truncate max-w-[150px]">
              {prompt}
            </span>
          )}
        </div>

        {/* 主帖内容 */}
        {mainPost && (
          <div className="px-3 py-3 bg-white border-b border-gray-100">
            <div className="flex items-start gap-2">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs flex-shrink-0">
                楼主
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 mb-1">匿名用户</div>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {mainPost}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 评论区 */}
        {comments.length > 0 && (
          <div className="px-3 py-2 space-y-2 max-h-80 overflow-y-auto bg-gray-50">
            <div className="text-xs font-medium text-gray-500 mb-1">
              评论 {comments.length}
            </div>
            {comments.map((comment, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs flex-shrink-0">
                  {comment.user.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 bg-white rounded-lg px-2.5 py-1.5 border border-gray-200">
                  <div className="text-xs font-medium text-gray-900 mb-0.5">
                    {comment.user}
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed break-words">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部交互栏 */}
        <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-around text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>赞</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>评论</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>分享</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostCard
