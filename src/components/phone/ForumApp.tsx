import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface ForumAppProps {
  content: AIPhoneContent
}

const ForumApp = ({ content }: ForumAppProps) => {
  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">论坛</h1>
        </div>
        <div className="px-4 pb-3">
          <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="text-sm text-gray-400">搜索帖子</span>
          </div>
        </div>
      </div>
      
      {/* 论坛帖子列表 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-3 space-y-2">
          {content.forumPosts.map((post, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
            {/* 论坛标签 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 font-medium">
                {post.forum}
              </span>
              {post.hasCommented && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-300 text-gray-700 font-medium">
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
              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-gray-400">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="text-xs font-medium text-gray-700">我的评论</span>
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
    </div>
  )
}

export default ForumApp
