import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { loadPosts, loadTopics } from '../utils/forumManager'
import type { ForumPost, ForumTopic } from '../types/forum'

const Forum = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('推荐')

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    switch (tab) {
      case '话题':
        navigate('/forum/topics')
        break
      case '私信':
        navigate('/forum/messages')
        break
      case '主页':
        navigate('/forum/profile')
        break
      default:
        // 推荐保持在当前页
        break
    }
  }
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
          <h1 className="flex-1 text-center text-base font-semibold text-gray-800">论坛</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="p-4 space-y-3 pb-20">
        {/* 搜索栏 */}
        <div className="py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="搜索帖子、话题..." 
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* 分类导航 */}
        <div className="grid grid-cols-4 gap-3 py-3 border-b border-gray-100">
          {['推荐', '话题', '私信', '主页'].map((item) => (
            <button
              key={item}
              onClick={() => handleTabClick(item)}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:bg-white/50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

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

      {/* 底部发帖按钮 */}
      <div className="fixed bottom-6 right-6">
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-gray-700 font-medium text-lg shadow-lg border border-gray-200"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default Forum
