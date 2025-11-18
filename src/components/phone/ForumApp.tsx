import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface ForumAppProps {
  content: AIPhoneContent
}

const ForumApp = ({ content }: ForumAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-gradient-to-r from-purple-400/20 to-pink-400/20">
        <h2 className="text-lg font-semibold text-gray-800">论坛浏览</h2>
        <p className="text-xs text-gray-500 mt-1">最近浏览和评论的帖子</p>
      </div>
      
      {/* 论坛帖子列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {content.forumPosts.map((post, index) => (
          <div 
            key={index}
            className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-purple-200/50 shadow-sm"
          >
            {/* 论坛标签 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                {post.forum}
              </span>
              {post.hasCommented && (
                <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-700 font-medium">
                  已评论
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">{post.time}</span>
            </div>
            
            {/* 帖子标题 */}
            <h3 className="font-medium text-gray-800 mb-2">{post.title}</h3>
            
            {/* 帖子内容摘要 */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.content}</p>
            
            {/* 角色的评论 */}
            {post.hasCommented && post.comment && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border-l-4 border-purple-400">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="text-xs font-medium text-purple-700">我的评论</span>
                </div>
                <p className="text-sm text-gray-700">{post.comment}</p>
              </div>
            )}
            
            {/* 浏览原因 */}
            {post.reason && (
              <div className="text-xs text-gray-500 mt-2 italic">
                💭 {post.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ForumApp
