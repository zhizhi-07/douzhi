import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface ForumAppProps {
  content: AIPhoneContent
  onBack?: () => void
}

const ForumApp = ({ content, onBack }: ForumAppProps) => {
  return (
    <div className="w-full h-full bg-[#F7F7F7] flex flex-col font-sans absolute inset-0">
      {/* 顶部标题栏 - 豆瓣绿 */}
      <div className="bg-[#42BD56] px-4 pt-3 pb-3 sticky top-0 z-[1000] shadow-sm">
        <button onClick={onBack} className="flex items-center gap-1 text-white mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          返回
        </button>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 text-white/80 text-[15px] font-medium">
            <span className="text-white font-bold border-b-2 border-white pb-1">我的小组</span>
            <span>精选</span>
            <span>发现</span>
          </div>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* 搜索框 */}
        <div className="bg-white/20 rounded-[4px] h-8 flex items-center px-3 gap-2">
          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <span className="text-[13px] text-white/70">搜索小组帖子</span>
        </div>
      </div>

      {/* 论坛帖子列表 */}
      <div className="flex-1 overflow-y-auto bg-[#F7F7F7] px-3 py-3 space-y-3">
        {content.forumPosts.map((post, index) => (
          <div
            key={index}
            className="bg-white rounded-[4px] p-4 shadow-sm border border-gray-100"
          >
            {/* 小组头部 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-[4px] bg-[#42BD56] flex items-center justify-center text-white font-bold text-xs">
                {post.forum[0]}组
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[#42BD56]">{post.forum}</div>
                <div className="text-[10px] text-gray-400">{post.time}</div>
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>

            {/* 帖子标题 */}
            <h3 className="text-[16px] font-bold text-[#111] mb-2 leading-snug">{post.title}</h3>

            {/* 帖子内容摘要 */}
            <p className="text-[14px] text-[#555] mb-3 line-clamp-3 leading-relaxed text-justify">{post.content}</p>

            {/* 角色的评论 */}
            {post.hasCommented && post.comment && (
              <div className="bg-[#F8FDF8] rounded-[2px] p-3 border-l-[3px] border-[#42BD56] mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-bold text-[#42BD56]">我的回应</span>
                </div>
                <p className="text-[13px] text-[#333] leading-relaxed">{post.comment}</p>
              </div>
            )}

            {/* 其他楼层评论（楼中楼） */}
            {post.otherComments && post.otherComments.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <span>精选评论</span>
                </div>
                {post.otherComments.map((comment, commentIndex) => (
                  <div key={commentIndex} className="bg-gray-50 rounded-lg p-2.5 flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {comment.author[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gray-600">{comment.author}</span>
                        {comment.likes !== undefined && (
                          <div className="flex items-center gap-0.5 text-gray-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span className="text-[10px]">{comment.likes}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-700 mt-0.5 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 底部互动栏 */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
              <div className="flex gap-4">
                <div className="flex items-center gap-1 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                  <span className="text-xs">赞</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <span className="text-xs">回应</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ForumApp
