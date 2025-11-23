import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { MessageSquare, Heart, Eye, Plus } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import { getTopicPosts, loadTopics } from '../utils/forumManager'
import type { ForumPost, ForumTopic } from '../types/forum'

const ForumTopicDetail = () => {
  const navigate = useNavigate()
  const { name } = useParams<{ name: string }>()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [topic, setTopic] = useState<ForumTopic | null>(null)

  useEffect(() => {
    if (name) {
      const topicName = decodeURIComponent(name)
      setPosts(getTopicPosts(topicName))
      
      // 加载话题信息
      const topics = loadTopics()
      const foundTopic = topics.find(t => t.name === topicName)
      setTopic(foundTopic || null)
    }
  }, [name])

  const renderPostCard = (post: ForumPost) => (
    <div
      key={post.id}
      onClick={() => navigate(`/forum/post/${post.id}`)}
      className="bg-white rounded-2xl p-4 cursor-pointer active:opacity-70 transition-opacity shadow-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
          {post.author[0]}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">{post.author}</div>
          <div className="text-xs text-gray-500">{post.time}</div>
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-2">{post.title}</h3>
      
      {post.content && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {post.content}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>{post.views}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          <span>{post.replies}</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          <span>{post.likes}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      {/* 顶部状态栏和导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -m-2 active:opacity-60"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold">
            #{name ? decodeURIComponent(name) : ''}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 话题信息卡片 */}
      {topic && topic.description && (
        <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 leading-relaxed">{topic.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>{topic.postCount} 个帖子</span>
            {topic.hot && <span className="text-red-500">🔥 热门</span>}
          </div>
        </div>
      )}

      {/* 帖子列表 */}
      <div className="p-4 space-y-3">
        {posts.length > 0 ? (
          posts.map(renderPostCard)
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 mb-4">该话题下还没有帖子</p>
            <button
              onClick={() => {
                // TODO: 打开发帖页面
                alert('发帖功能开发中')
              }}
              className="text-sm text-blue-500 font-semibold"
            >
              成为第一个发帖的人
            </button>
          </div>
        )}
      </div>

      {/* 浮动发帖按钮 */}
      <button
        onClick={() => {
          // TODO: 打开发帖页面
          alert('发帖功能开发中')
        }}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

export default ForumTopicDetail
