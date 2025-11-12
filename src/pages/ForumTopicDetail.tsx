import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { getTopicPosts } from '../utils/forumManager'
import type { ForumPost } from '../types/forum'

const ForumTopicDetail = () => {
  const navigate = useNavigate()
  const { name } = useParams<{ name: string }>()
  const [posts, setPosts] = useState<ForumPost[]>([])

  useEffect(() => {
    if (name) {
      const topicName = decodeURIComponent(name)
      setPosts(getTopicPosts(topicName))
    }
  }, [name])

  const renderPostCard = (post: ForumPost) => (
    <div
      key={post.id}
      onClick={() => navigate(`/forum/post/${post.id}`)}
      className="py-4 cursor-pointer active:opacity-70 transition-opacity border-b border-gray-100 last:border-b-0"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800">{post.author}</div>
          <div className="text-xs text-gray-400">{post.time}</div>
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-800 mb-2">{post.title}</h3>
      
      {post.content && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {post.content.split('\n')[0]}...
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{post.views} 浏览</span>
        <span>{post.replies} 回复</span>
        <span>{post.likes} 点赞</span>
      </div>
    </div>
  )

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
          <h1 className="flex-1 text-center text-base font-semibold text-gray-800">
            #{name ? decodeURIComponent(name) : ''}
          </h1>
          <div className="w-9" />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="p-4">
        {posts.length > 0 ? (
          posts.map(renderPostCard)
        ) : (
          <div className="pt-32 text-center text-sm text-gray-400">
            该话题下暂无帖子
          </div>
        )}
      </div>
    </div>
  )
}

export default ForumTopicDetail
