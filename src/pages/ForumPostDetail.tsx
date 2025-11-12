import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { getPost, getPostComments, createComment, incrementViews } from '../utils/forumManager'
import type { ForumPost, ForumComment } from '../types/forum'

const ForumPostDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [comments, setComments] = useState<ForumComment[]>([])
  const [replyText, setReplyText] = useState('')
  const [showReplyBox, setShowReplyBox] = useState(false)

  useEffect(() => {
    if (id) {
      const postData = getPost(id)
      if (postData) {
        setPost(postData)
        setComments(getPostComments(id))
        // 增加浏览数
        incrementViews(id)
      }
    }
  }, [id])

  const handleLike = () => {
    console.log('点赞')
  }

  const handleReply = () => {
    if (replyText.trim() && id) {
      createComment({
        postId: id,
        author: '当前用户',
        time: '刚刚',
        content: replyText,
        likes: 0
      })
      setComments(getPostComments(id))
      setReplyText('')
      setShowReplyBox(false)
    }
  }

  if (!post) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
      {/* 顶部状态栏和导航 */}
      <div className="sticky top-0 z-10" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between border-b border-black/5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-gray-800">帖子详情</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* 帖子内容 */}
      <div className="p-4 space-y-3">
        {/* 帖子主体 */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* 作者信息 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{post.author}</span>
                {post.isHighlight && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">精华</span>
                )}
              </div>
              <div className="text-xs text-gray-400">{post.time}</div>
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-lg font-semibold text-gray-800 mb-3">
            {post.title}
          </h1>

          {/* 内容 */}
          <div className="text-sm text-gray-600 mb-4 whitespace-pre-line leading-relaxed">
            {post.content}
          </div>

          {/* 标签 */}
          <div className="flex gap-2 mb-4">
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* 互动统计 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex gap-4 text-xs text-gray-400">
              <span>{post.views} 浏览</span>
              <span>{post.replies} 回复</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLike}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                点赞 {post.likes}
              </button>
            </div>
          </div>
        </div>

        {/* 评论区标题 */}
        <div
          className="rounded-2xl p-3"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">全部评论 ({comments.length})</span>
            <button className="text-xs text-gray-400">最新</button>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="space-y-2 pb-20">
          {comments.map((comment) => (
            <div key={comment.id}>
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
              >
                {/* 评论者信息 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{comment.author}</div>
                    <div className="text-xs text-gray-400">{comment.time}</div>
                  </div>
                </div>

                {/* 评论内容 */}
                <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                  {comment.content}
                </p>

                {/* 评论互动 */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <button className="hover:text-gray-600">点赞 {comment.likes}</button>
                  <button className="hover:text-gray-600">回复</button>
                </div>

                {/* 子评论 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 ml-4 space-y-2">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-3 rounded-xl"
                        style={{
                          background: 'rgba(255, 255, 255, 0.4)',
                          border: '1px solid rgba(0, 0, 0, 0.03)'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200" />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-800">{reply.author}</div>
                            <div className="text-xs text-gray-400">{reply.time}</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-1 leading-relaxed">
                          {reply.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <button className="hover:text-gray-600">点赞 {reply.likes}</button>
                          <button className="hover:text-gray-600">回复</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部回复栏 */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        {showReplyBox ? (
          <div className="space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="写下你的评论..."
              className="w-full p-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                minHeight: '80px'
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowReplyBox(false)
                  setReplyText('')
                }}
                className="px-4 py-2 rounded-lg text-sm text-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleReply}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                发送
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="说点什么..."
              onClick={() => setShowReplyBox(true)}
              readOnly
              className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            />
            <button
              onClick={handleLike}
              className="p-2.5 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForumPostDetail
