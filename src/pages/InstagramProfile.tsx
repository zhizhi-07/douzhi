import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Grid3x3, Heart, MessageCircle, Settings, Image as ImageIcon, Share2, MoreHorizontal } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import InstagramEditProfile from '../components/InstagramEditProfile'
import { getNPCById, getAllPostsAsync } from '../utils/forumNPC'
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
  const [userInfo, setUserInfo] = useState(getUserInfo())
  const [userPosts, setUserPosts] = useState<ForumPost[]>([])
  const [npcPosts, setNpcPosts] = useState<ForumPost[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [wallpaper, setWallpaper] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    initUserData()

    // 尝试读取壁纸
    const savedWallpaper = localStorage.getItem(`profile-wallpaper-${userId || 'user'}`)
    if (savedWallpaper) {
      setWallpaper(savedWallpaper)
    }

    if (userId) {
      const allPosts = await getAllPostsAsync()
      const theirPosts = allPosts.filter(p => p.npcId === userId)
      setNpcPosts(theirPosts)

      const savedSocialData = localStorage.getItem(`social-profile-${userId}`)
      let savedProfile: { followers?: number; following?: number } | null = null
      if (savedSocialData) {
        try {
          savedProfile = JSON.parse(savedSocialData)
        } catch (e) {
          console.error(e)
        }
      }

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
        const characters = await getAllCharacters()
        const foundChar = characters.find(c => c.id === userId)
        if (foundChar) {
          setCharacter(foundChar)
          setNpc(null)
          setIsFollowing(true)
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
      setNpc(null)
      setCharacter(null)

      const allPosts = await getAllPostsAsync()
      const myPosts = allPosts.filter(p => p.npcId === 'user')
      setUserPosts(myPosts)

      const userData = getUserData()
      const characters = await getAllCharacters()
      setStats({
        posts: myPosts.length,
        followers: userData.followers,
        following: characters.length
      })
    }
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
    setUserInfo(getUserInfo())
  }

  const handleRefresh = async () => {
    if (!userId || isRefreshing) return
    setIsRefreshing(true)
    try {
      const charName = character?.nickname || character?.realName || npc?.name || '未知'
      const isPublicFigure = character?.isPublicFigure || false

      const charInfo: string[] = []
      charInfo.push(`角色名：${charName}`)
      if (character?.realName && character.realName !== charName) charInfo.push(`真名：${character.realName}`)
      if (character?.personality) charInfo.push(`人设：${character.personality}`)
      if (character?.signature) charInfo.push(`签名：${character.signature}`)
      if (character?.publicPersona) charInfo.push(`公众形象：${character.publicPersona}`)
      charInfo.push(isPublicFigure ? `身份：公众人物/明星` : `身份：普通用户`)
      if (npc?.bio) charInfo.push(`简介：${npc.bio}`)

      const prompt = `你是一个社交媒体数据分析师。请根据以下角色的完整信息，生成合理的社交媒体粉丝数据：
${charInfo.join('\n')}
请根据角色的身份、人设、影响力等综合判断，生成JSON格式的数据：
{
  "followers": 粉丝数（根据角色影响力判断，公众人物/明星通常几万到几百万，普通人几百到几千）,
  "following": 关注数（通常几十到几百）
}
只输出JSON，不要其他内容。`

      const content = await callZhizhiApi([{ role: 'user', content: prompt }], { temperature: 0.7 }) || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const newStats = {
          posts: stats.posts,
          followers: parsed.followers || stats.followers,
          following: parsed.following || stats.following
        }
        setStats(newStats)

        const socialData = {
          followers: newStats.followers,
          following: newStats.following,
          updatedAt: Date.now()
        }
        localStorage.setItem(`social-profile-${userId}`, JSON.stringify(socialData))
      }
    } catch (error) {
      console.error('刷新数据失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setWallpaper(result)
        localStorage.setItem(`profile-wallpaper-${userId || 'user'}`, result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <InstagramLayout showHeader={false} showTabBar={!userId}>
      {/* 沉浸式背景区域 */}
      <div className="relative h-[35vh] w-full overflow-hidden">
        {wallpaper ? (
          <img src={wallpaper} alt="background" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900" />
        )}
        {/* 渐变遮罩，保证文字清晰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* 顶部导航 */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 text-white">
          {userId ? (
            <button onClick={() => navigate(-1)} className="p-2 -m-2 active:opacity-60 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md">
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <div className="flex items-center gap-3">
            {userId ? (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 -m-2 active:opacity-60 disabled:opacity-40 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <label className="p-2 -m-2 active:opacity-60 hover:bg-white/10 rounded-full transition-colors cursor-pointer backdrop-blur-md">
                  <ImageIcon className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperChange} />
                </label>
                <button
                  onClick={() => navigate('/instagram/settings')}
                  className="p-2 -m-2 active:opacity-60 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}
            <button className="p-2 -m-2 active:opacity-60 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 - 上拉覆盖 */}
      <div className="relative -mt-8 bg-white rounded-t-[32px] min-h-[70vh] z-10">
        {/* 个人信息部分 */}
        <div className="px-6 pb-6">
          <div className="flex justify-between items-end -mt-12 mb-4">
            {/* 头像 */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full p-1 bg-white shadow-lg">
                <img
                  src={npc?.avatar || character?.avatar || userInfo.avatar || '/default-avatar.png'}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              {/* 状态点 */}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 mb-1">
              {userId ? (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${isFollowing
                        ? 'bg-gray-100 text-gray-900 border border-gray-200'
                        : 'bg-black text-white hover:bg-gray-800'
                      }`}
                  >
                    {isFollowing ? '已关注' : '关注'}
                  </button>
                  <button
                    onClick={() => navigate(`/instagram/dm/${userId}`)}
                    className="px-6 py-2 rounded-full bg-gray-100 text-sm font-semibold text-gray-900 border border-gray-200 active:bg-gray-200 transition-all"
                  >
                    私信
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="px-6 py-2 rounded-full bg-gray-100 text-sm font-semibold text-gray-900 border border-gray-200 active:bg-gray-200 transition-all"
                >
                  编辑资料
                </button>
              )}
            </div>
          </div>

          {/* 名字和简介 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {npc?.name || character?.nickname || character?.realName || userInfo.nickname || userInfo.realName || '我的名字'}
              </h2>
              {character?.isPublicFigure && (
                <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium align-middle">官方</span>
              )}
            </div>
            <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-wrap">
              {npc?.bio || character?.signature || userInfo.signature || '写点什么来介绍自己...'}
            </p>
          </div>

          {/* 统计数据 - 极简风格 */}
          <div className="flex items-center gap-8 mb-2">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">{stats.posts}</span>
              <span className="text-xs text-gray-500">帖子</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">
                {stats.followers >= 10000
                  ? `${(stats.followers / 1000).toFixed(1)}k`
                  : stats.followers.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">粉丝</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">
                {stats.following >= 1000
                  ? `${(stats.following / 1000).toFixed(1)}k`
                  : stats.following}
              </span>
              <span className="text-xs text-gray-500">关注</span>
            </div>
          </div>
        </div>

        {/* 标签栏 - 简约线条 */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
          <div className="flex px-4">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex-1 py-3 flex items-center justify-center relative transition-colors ${activeTab === 'grid' ? 'text-gray-900' : 'text-gray-400'
                }`}
            >
              <Grid3x3 className="w-6 h-6" />
              {activeTab === 'grid' && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-black rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('tagged')}
              className={`flex-1 py-3 flex items-center justify-center relative transition-colors ${activeTab === 'tagged' ? 'text-gray-900' : 'text-gray-400'
                }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {activeTab === 'tagged' && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-black rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* 帖子网格 - 无缝设计 */}
        <div className="pb-20">
          {activeTab === 'grid' ? (
            (userId ? npcPosts : userPosts).length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5">
                {(userId ? npcPosts : userPosts).map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square bg-gray-50 cursor-pointer group overflow-hidden"
                    onClick={() => navigate(userId ? `/instagram/post/${post.id}` : '/instagram/home')}
                  >
                    {post.images === 0 ? (
                      <div className="w-full h-full bg-gray-100 p-3 flex items-center justify-center">
                        <p className="text-[10px] text-center line-clamp-4 text-gray-500 leading-tight font-serif">
                          {post.content}
                        </p>
                      </div>
                    ) : (
                      <div className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${['bg-stone-100', 'bg-zinc-100', 'bg-slate-100', 'bg-neutral-100'][post.images % 4]
                        }`}>
                        {post.imageUrls?.[0] && (
                          <img src={post.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

                    {/* 悬浮遮罩 */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[1px]">
                      <div className="flex items-center gap-1 text-white">
                        <Heart className="w-5 h-5 fill-current" />
                        <span className="text-sm font-bold">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white">
                        <MessageCircle className="w-5 h-5 fill-current" />
                        <span className="text-sm font-bold">{post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">暂无发布</h3>
                <p className="text-xs text-gray-400">
                  {userId ? '这里空空如也' : '记录你的第一个瞬间'}
                </p>
              </div>
            )
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">标记内容</h3>
              <p className="text-xs text-gray-400">
                被标记的照片和视频将显示在这里
              </p>
            </div>
          )}
        </div>
      </div>

      <InstagramEditProfile
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleSaveProfile}
      />
    </InstagramLayout>
  )
}

export default InstagramProfile
