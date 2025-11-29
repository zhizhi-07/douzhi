import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Grid3x3, Heart, MessageCircle, Settings } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import InstagramEditProfile from '../components/InstagramEditProfile'
import { getNPCById, getAllPosts } from '../utils/forumNPC'
import { getUserData, initUserData, followNPC, unfollowNPC, isFollowingNPC } from '../utils/forumUser'
import { getUserInfo } from '../utils/userUtils'
import { getAllCharacters } from '../utils/characterManager'
import type { ForumNPC, ForumPost } from '../utils/forumNPC'
import type { Character } from '../services/characterService'
import { callZhizhiApi } from '../services/zhizhiapi'

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
  const [character, setCharacter] = useState<Character | null>(null)
  const [activeTab, setActiveTab] = useState<'grid' | 'tagged'>('grid')
  const [isFollowing, setIsFollowing] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  })
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [userInfo, setUserInfo] = useState(getUserInfo()) // 微信资料（主用）
  const [userPosts, setUserPosts] = useState<ForumPost[]>([])
  const [npcPosts, setNpcPosts] = useState<ForumPost[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    // 初始化用户数据
    initUserData()
    
    if (userId) {
      // 加载该用户发的帖子
      const allPosts = getAllPosts()
      const theirPosts = allPosts.filter(p => p.npcId === userId)
      setNpcPosts(theirPosts)
      
      // 尝试读取已保存的社交媒体数据（粉丝数和关注数）
      const savedSocialData = localStorage.getItem(`social-profile-${userId}`)
      console.log('📱 读取社交媒体数据:', userId, savedSocialData)
      let savedProfile: { followers?: number; following?: number } | null = null
      if (savedSocialData) {
        try {
          savedProfile = JSON.parse(savedSocialData)
          console.log('✅ 解析成功:', savedProfile)
        } catch (e) {
          console.error('❌ 解析失败:', e)
        }
      } else {
        console.log('⚠️ 没有保存的社交媒体数据')
      }
      
      // 先尝试查找NPC
      const foundNPC = getNPCById(userId)
      if (foundNPC) {
        setNpc(foundNPC)
        setCharacter(null)
        setIsFollowing(isFollowingNPC(userId))
        setStats({
          posts: theirPosts.length,
          followers: typeof savedProfile?.followers === 'number' ? savedProfile.followers : foundNPC.followers,
          following: typeof savedProfile?.following === 'number' ? savedProfile.following : Math.floor(Math.random() * 200) + 50
        })
      } else {
        // 如果不是NPC，查找角色
        const characters = await getAllCharacters()
        const foundChar = characters.find(c => c.id === userId)
        if (foundChar) {
          setCharacter(foundChar)
          setNpc(null)
          setIsFollowing(true) // 角色默认互关
          // 优先使用保存的数据，否则根据公众人物生成
          const baseFollowers = typeof savedProfile?.followers === 'number' 
            ? savedProfile.followers 
            : (foundChar.isPublicFigure 
                ? Math.floor(Math.random() * 500000) + 50000
                : Math.floor(Math.random() * 5000) + 100)
          setStats({
            posts: theirPosts.length,
            followers: baseFollowers,
            following: typeof savedProfile?.following === 'number' ? savedProfile.following : Math.floor(Math.random() * 200) + 50
          })
        }
      }
    } else {
      // 查看自己的主页
      setNpc(null)
      setCharacter(null)
      
      // 加载用户发布的帖子
      const allPosts = getAllPosts()
      const myPosts = allPosts.filter(p => p.npcId === 'user')
      setUserPosts(myPosts)
      
      const userData = getUserData()
      // 获取创建的角色数量作为关注数（角色默认互关）
      const characters = await getAllCharacters()
      setStats({
        posts: myPosts.length,
        followers: userData.followers,
        following: characters.length // 创建的角色都是互关的
      })
    }
    
    // 模拟帖子（用于NPC/角色主页）
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

  const handleSaveProfile = () => {
    // 刷新用户资料
    setUserInfo(getUserInfo())
  }

  // 刷新粉丝数等数据
  const handleRefresh = async () => {
    if (!userId || isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const charName = character?.nickname || character?.realName || npc?.name || '未知'
      const isPublicFigure = character?.isPublicFigure || false
      
      // 构建完整的角色信息
      const charInfo: string[] = []
      charInfo.push(`角色名：${charName}`)
      if (character?.realName && character.realName !== charName) {
        charInfo.push(`真名：${character.realName}`)
      }
      if (character?.personality) {
        charInfo.push(`人设：${character.personality}`)
      }
      if (character?.signature) {
        charInfo.push(`签名：${character.signature}`)
      }
      if (character?.publicPersona) {
        charInfo.push(`公众形象：${character.publicPersona}`)
      }
      if (isPublicFigure) {
        charInfo.push(`身份：公众人物/明星`)
      } else {
        charInfo.push(`身份：普通用户`)
      }
      if (npc?.bio) {
        charInfo.push(`简介：${npc.bio}`)
      }
      
      const prompt = `你是一个社交媒体数据分析师。请根据以下角色的完整信息，生成合理的社交媒体粉丝数据：

${charInfo.join('\n')}

请根据角色的身份、人设、影响力等综合判断，生成JSON格式的数据：
{
  "followers": 粉丝数（根据角色影响力判断，公众人物/明星通常几万到几百万，普通人几百到几千）,
  "following": 关注数（通常几十到几百）
}

只输出JSON，不要其他内容。`

      const content = await callZhizhiApi([
        { role: 'user', content: prompt }
      ], { temperature: 0.7 }) || ''
      
      // 解析JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const newStats = {
          posts: stats.posts,
          followers: parsed.followers || stats.followers,
          following: parsed.following || stats.following
        }
        setStats(newStats)
        
        // 保存到 localStorage（只保存粉丝数和关注数）
        const socialData = {
          followers: newStats.followers,
          following: newStats.following,
          updatedAt: Date.now()
        }
        localStorage.setItem(`social-profile-${userId}`, JSON.stringify(socialData))
        console.log('✅ 社交媒体数据已保存:', socialData)
      }
    } catch (error) {
      console.error('刷新数据失败:', error)
    } finally {
      setIsRefreshing(false)
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
            {npc?.name || character?.nickname || character?.realName || '我的'}
          </h1>
          
          {userId ? (
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 -m-2 active:opacity-60 disabled:opacity-40"
            >
              <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          ) : (
            <button 
              onClick={() => navigate('/instagram/settings')}
              className="p-2 -m-2 active:opacity-60"
            >
              <Settings className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="pb-20">
        {/* 个人信息区 */}
        <div className="bg-white px-4 py-4">
          {/* 头像和统计 */}
          <div className="flex items-start gap-6 mb-4">
            <img
              src={npc?.avatar || character?.avatar || userInfo.avatar || '/default-avatar.png'}
              alt={npc?.name || character?.nickname || character?.realName || userInfo.nickname || userInfo.realName || '我'}
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
              {npc?.name || character?.nickname || character?.realName || userInfo.nickname || userInfo.realName || '我的名字'}
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {npc?.bio || character?.signature || userInfo.signature || '这是我的个人简介...'}
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
                onClick={() => navigate(`/instagram/dm/${userId}`)}
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
                onClick={() => setShowEditProfile(true)}
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
        <div className="bg-white border-t border-gray-100">
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
          userId ? (
            // NPC/角色主页 - 显示真实帖子
            npcPosts.length > 0 ? (
              <div className="bg-white grid grid-cols-3 gap-0.5">
                {npcPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/instagram/post/${post.id}`)}
                  >
                    {/* 根据帖子图片数量显示不同样式 */}
                    {post.images === 0 ? (
                      // 纯文字帖子 - 显示文字预览
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 p-3 flex items-center justify-center">
                        <p className="text-xs text-center line-clamp-4 text-gray-700">
                          {post.content}
                        </p>
                      </div>
                    ) : (
                      // 有图片的帖子 - 显示渐变色块
                      <div className={`w-full h-full ${
                        ['bg-gradient-to-br from-pink-200 to-purple-200',
                         'bg-gradient-to-br from-blue-200 to-cyan-200',
                         'bg-gradient-to-br from-orange-200 to-red-200',
                         'bg-gradient-to-br from-green-200 to-teal-200',
                         'bg-gradient-to-br from-purple-200 to-pink-200',
                         'bg-gradient-to-br from-yellow-200 to-orange-200'][post.images % 6]
                      }`} />
                    )}
                    
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
              // 空状态
              <div className="bg-white py-20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">暂无帖子</h3>
                <p className="text-sm text-gray-500">
                  该用户还没有发布任何帖子
                </p>
              </div>
            )
          ) : (
            // 用户自己的主页 - 显示真实发布的帖子
            userPosts.length > 0 ? (
              <div className="bg-white grid grid-cols-3 gap-0.5">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/instagram/home`)}
                  >
                    {/* 根据帖子图片数量显示不同样式 */}
                    {post.images === 0 ? (
                      // 纯文字帖子 - 显示文字预览
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 p-3 flex items-center justify-center">
                        <p className="text-xs text-center line-clamp-4 text-gray-700">
                          {post.content}
                        </p>
                      </div>
                    ) : (
                      // 有图片的帖子 - 显示渐变色块
                      <div className={`w-full h-full ${
                        ['bg-gradient-to-br from-pink-200 to-purple-200',
                         'bg-gradient-to-br from-blue-200 to-cyan-200',
                         'bg-gradient-to-br from-orange-200 to-red-200',
                         'bg-gradient-to-br from-green-200 to-teal-200',
                         'bg-gradient-to-br from-purple-200 to-pink-200',
                         'bg-gradient-to-br from-yellow-200 to-orange-200'][post.images % 6]
                      }`}>
                        {post.images > 1 && (
                          <div className="absolute top-2 right-2">
                            <svg className="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                    
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
              // 空状态
              <div className="bg-white py-20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">分享照片</h3>
                <p className="text-sm text-gray-500 mb-4">
                  你还没有分享照片
                </p>
                <button
                  onClick={() => navigate('/instagram/create')}
                  className="text-sm text-blue-500 font-semibold"
                >
                  分享你的第一张照片
                </button>
              </div>
            )
          )
        ) : (
          <div className="bg-white py-20 text-center">
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

      {/* 编辑资料弹窗 */}
      <InstagramEditProfile
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleSaveProfile}
      />
    </InstagramLayout>
  )
}

export default InstagramProfile
