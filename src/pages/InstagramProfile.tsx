import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MoreHorizontal, Grid3x3, Heart, MessageCircle, Settings } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { getNPCById } from '../utils/forumNPC'
import { getUserData, initUserData, followNPC, unfollowNPC, isFollowingNPC } from '../utils/forumUser'
import type { ForumNPC } from '../utils/forumNPC'

interface Post {
  id: string
  image: string
  likes: number
  comments: number
}

const InstagramProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [npc, setNpc] = useState<ForumNPC | null>(null)
  const [activeTab, setActiveTab] = useState<'grid' | 'tagged'>('grid')
  const [isFollowing, setIsFollowing] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  })

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = () => {
    // 初始化用户数据
    initUserData()
    
    if (userId) {
      // 查看NPC主页
      const foundNPC = getNPCById(userId)
      if (foundNPC) {
        setNpc(foundNPC)
        setIsFollowing(isFollowingNPC(userId))
        setStats({
          posts: Math.floor(Math.random() * 50) + 20,
          followers: foundNPC.followers,
          following: Math.floor(Math.random() * 200) + 50
        })
      }
    } else {
      // 查看自己的主页
      setNpc(null)
      const userData = getUserData()
      setStats({
        posts: userData.posts,
        followers: userData.followers,
        following: userData.following
      })
    }
    
    // 模拟帖子
    const mockPosts: Post[] = Array.from({ length: 12 }, (_, i) => ({
      id: `post-${i}`,
      image: `${i}`,
      likes: Math.floor(Math.random() * 500) + 100,
      comments: Math.floor(Math.random() * 100) + 10
    }))
    setPosts(mockPosts)
  }

  const handleFollow = () => {
    if (userId) {
      if (isFollowing) {
        unfollowNPC(userId)
      } else {
        followNPC(userId)
      }
      setIsFollowing(!isFollowing)
      setStats(prev => ({
        ...prev,
        followers: isFollowing ? prev.followers - 1 : prev.followers + 1
      }))
    }
  }

  return (
    <InstagramLayout showHeader={false} showTabBar={!userId}>
      {/* 自定义顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          {userId ? (
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -m-2 active:opacity-60"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          
          <h1 className="text-base font-semibold">
            {npc?.name || '我的'}
          </h1>
          
          <button 
            onClick={() => navigate('/instagram/settings')}
            className="p-2 -m-2 active:opacity-60"
          >
            {userId ? (
              <MoreHorizontal className="w-6 h-6" />
            ) : (
              <Settings className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <div className="pb-20">
        {/* 个人信息区 */}
        <div className="px-4 py-4">
          {/* 头像和统计 */}
          <div className="flex items-start gap-6 mb-4">
            <img
              src={npc?.avatar || '/default-avatar.png'}
              alt={npc?.name || '我'}
              className="w-20 h-20 rounded-full object-cover ring-1 ring-gray-200"
            />
            
            <div className="flex-1">
              <div className="flex items-center justify-around text-center">
                <div>
                  <div className="text-lg font-semibold">{stats.posts}</div>
                  <div className="text-xs text-gray-500">帖子</div>
                </div>
                <div className="cursor-pointer">
                  <div className="text-lg font-semibold">
                    {stats.followers >= 10000 
                      ? `${(stats.followers / 1000).toFixed(1)}k` 
                      : stats.followers.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">粉丝</div>
                </div>
                <div className="cursor-pointer">
                  <div className="text-lg font-semibold">
                    {stats.following >= 1000 
                      ? `${(stats.following / 1000).toFixed(1)}k` 
                      : stats.following}
                  </div>
                  <div className="text-xs text-gray-500">关注</div>
                </div>
              </div>
            </div>
          </div>

          {/* 名字和简介 */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-1">
              {npc?.name || '我的名字'}
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {npc?.bio || '这是我的个人简介...'}
            </p>
          </div>

          {/* 操作按钮 */}
          {userId ? (
            <div className="flex gap-2">
              <button
                onClick={handleFollow}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-900 active:bg-gray-200'
                    : 'bg-blue-500 text-white active:bg-blue-600'
                }`}
              >
                {isFollowing ? '正在关注' : '关注'}
              </button>
              <button
                onClick={() => navigate(`/chat/${userId}`)}
                className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-sm font-semibold text-gray-900 active:bg-gray-200"
              >
                发消息
              </button>
              <button className="p-2 rounded-lg bg-gray-100 active:bg-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/user-profile')}
                className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-sm font-semibold text-gray-900 active:bg-gray-200"
              >
                编辑资料
              </button>
              <button 
                onClick={() => navigate('/instagram/archive')}
                className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-sm font-semibold text-gray-900 active:bg-gray-200"
              >
                分享资料
              </button>
            </div>
          )}
        </div>

        {/* 标签切换 */}
        <div className="border-t border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex-1 py-3 flex items-center justify-center ${
                activeTab === 'grid' 
                  ? 'text-gray-900 border-t-2 border-gray-900' 
                  : 'text-gray-400'
              }`}
            >
              <Grid3x3 className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveTab('tagged')}
              className={`flex-1 py-3 flex items-center justify-center ${
                activeTab === 'tagged' 
                  ? 'text-gray-900 border-t-2 border-gray-900' 
                  : 'text-gray-400'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容区 - Instagram风格的图片网格 */}
        {activeTab === 'grid' ? (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-square bg-gray-100 cursor-pointer"
                onClick={() => navigate(`/instagram/post/${post.id}`)}
              >
                {/* 模拟图片 */}
                <div className={`w-full h-full ${
                  ['bg-gradient-to-br from-pink-200 to-purple-200',
                   'bg-gradient-to-br from-blue-200 to-cyan-200',
                   'bg-gradient-to-br from-orange-200 to-red-200',
                   'bg-gradient-to-br from-green-200 to-teal-200',
                   'bg-gradient-to-br from-purple-200 to-pink-200',
                   'bg-gradient-to-br from-yellow-200 to-orange-200'][parseInt(post.id.split('-')[1]) % 6]
                }`} />
                
                {/* 悬浮时显示的统计信息 */}
                <div className="absolute inset-0 bg-black/40 opacity-0 active:opacity-100 transition-opacity flex items-center justify-center gap-6">
                  <div className="flex items-center gap-1 text-white">
                    <Heart className="w-6 h-6 fill-current" />
                    <span className="text-sm font-semibold">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <MessageCircle className="w-6 h-6 fill-current" />
                    <span className="text-sm font-semibold">{post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">照片和视频</h3>
            <p className="text-sm text-gray-500">
              当有人给你加上标签时，它们会显示在这里。
            </p>
          </div>
        )}
      </div>
    </InstagramLayout>
  )
}

export default InstagramProfile
