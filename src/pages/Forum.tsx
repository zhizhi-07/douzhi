import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ForumLayout from '../components/ForumLayout'
import { loadPosts, loadTopics } from '../utils/forumManager'
import type { ForumPost, ForumTopic } from '../types/forum'

const Forum = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [topics, setTopics] = useState<ForumTopic[]>([])

  useEffect(() => {
    setPosts(loadPosts())
    setTopics(loadTopics())
  }, [])

  // 渲染帖子卡片
  const renderPostCard = (post: ForumPost) => (
    <div
      key={post.id}
      onClick={() => navigate(`/forum/post/${post.id}`)}
      className="py-4 cursor-pointer active:opacity-70 transition-opacity border-b border-gray-100"
    >
      {/* 用户信息 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">{post.author}</span>
            {post.isHighlight && (
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">精华</span>
            )}
            {post.isHot && (
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">热门</span>
            )}
          </div>
          <div className="text-xs text-gray-400">{post.time}</div>
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-sm font-medium text-gray-800 mb-2">
        {post.title}
      </h3>

      {/* 内容预览 */}
      {post.content && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {post.content.split('\n')[0]}...
        </p>
      )}

      {/* 图片 */}
      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {post.images.slice(0, 3).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {/* 标签 */}
      {post.tags.length > 0 && (
        <div className="flex gap-2 mb-3">
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 互动统计 */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{post.views} 浏览</span>
        <span>{post.replies} 回复</span>
        <span>{post.likes} 点赞</span>
      </div>
    </div>
  )

  return (
    <ForumLayout>
      <div className="p-4 space-y-3 pb-20">
        {/* 热门话题 */}
        <div className="py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">热门话题</h2>
            <button className="text-xs text-gray-400">更多</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="px-3 py-1.5 rounded-full bg-gray-50 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                #{topic.name}
              </div>
            ))}
          </div>
        </div>

        {/* 帖子列表 */}
        <div>
          {posts.map(renderPostCard)}
        </div>
      </div>
    </ForumLayout>
  )
}

export default Forum
