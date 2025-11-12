import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { getUserPosts, getFavoritePosts, loadFollows } from '../utils/forumManager'
import type { ForumPost } from '../types/forum'

const ForumProfile = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'posts' | 'favorites' | 'follows'>('posts')
  const [myPosts, setMyPosts] = useState<ForumPost[]>([])
  const [favoritePosts, setFavoritePosts] = useState<ForumPost[]>([])
  const [follows, setFollows] = useState<string[]>([])

  useEffect(() => {
    setMyPosts(getUserPosts())
    setFavoritePosts(getFavoritePosts())
    setFollows(loadFollows())
  }, [])

  const renderPostItem = (post: ForumPost) => (
    <div
      key={post.id}
      onClick={() => navigate(`/forum/post/${post.id}`)}
      className="py-3 cursor-pointer active:opacity-70 transition-opacity border-b border-gray-100 last:border-b-0"
    >
      <h3 className="text-sm font-medium text-gray-800 mb-1">{post.title}</h3>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>{post.time}</span>
        <span>{post.views} 浏览</span>
        <span>{post.replies} 回复</span>
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
          <h1 className="flex-1 text-center text-base font-semibold text-gray-800">我的主页</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="p-4">
        {/* 用户信息卡片 */}
        <div className="py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div>
              <h2 className="text-base font-semibold text-gray-800">当前用户</h2>
              <p className="text-xs text-gray-500 mt-1">个性签名...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">{myPosts.length}</div>
              <div className="text-xs text-gray-500 mt-1">帖子</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">{follows.length}</div>
              <div className="text-xs text-gray-500 mt-1">关注</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">{favoritePosts.length}</div>
              <div className="text-xs text-gray-500 mt-1">收藏</div>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="py-3 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'posts'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:bg-white/50'
              }`}
            >
              我的帖子
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'favorites'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:bg-white/50'
              }`}
            >
              收藏
            </button>
            <button
              onClick={() => setActiveTab('follows')}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'follows'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:bg-white/50'
              }`}
            >
              关注
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="mt-3">
          {activeTab === 'posts' && (
            <div>
              {myPosts.length > 0 ? (
                myPosts.map(renderPostItem)
              ) : (
                <div className="py-20 text-center text-gray-400 text-sm">
                  还没有发布过帖子
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              {favoritePosts.length > 0 ? (
                favoritePosts.map(renderPostItem)
              ) : (
                <div className="py-20 text-center text-gray-400 text-sm">
                  还没有收藏帖子
                </div>
              )}
            </div>
          )}

          {activeTab === 'follows' && (
            <div>
              {follows.length > 0 ? (
                follows.map((topic, i) => (
                  <div
                    key={i}
                    className="py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">#{topic}</span>
                      <button className="text-xs text-gray-500 hover:text-gray-700">
                        查看
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-gray-400 text-sm">
                  还没有关注话题
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForumProfile
