import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Grid3x3, Heart, MessageCircle, Settings, Image as ImageIcon, Share2, MoreHorizontal } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import InstagramLayout from '../components/InstagramLayout'
import InstagramEditProfile from '../components/InstagramEditProfile'
import { getNPCById, getAllPostsAsync } from '../utils/forumNPC'
import { saveBackground, getBackground } from '../utils/backgroundStorage'
import { getUserData, initUserData, followNPC, unfollowNPC, isFollowingNPC } from '../utils/forumUser'
import { getUserInfoWithAvatar, type UserInfo } from '../utils/userUtils'
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
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: '', realName: '' })
  const [userPosts, setUserPosts] = useState<ForumPost[]>([])
  const [npcPosts, setNpcPosts] = useState<ForumPost[]>([])
  const [taggedPosts, setTaggedPosts] = useState<ForumPost[]>([])  // 被标记的帖子
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [wallpaper, setWallpaper] = useState<string>('')
  const [publicLabel, setPublicLabel] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setIsLoading(true)
    initUserData()
    
    // Load user info with avatar
    const info = await getUserInfoWithAvatar()
    setUserInfo(info)

    // 尝试读取壁纸（从IndexedDB）
    const bgKey = `profile-wallpaper-${userId || 'user'}`
    getBackground(bgKey).then(savedWallpaper => {
      if (savedWallpaper) {
        setWallpaper(savedWallpaper)
      }
    })

    // 尝试读取公众人物标签
    if (userId) {
      const savedLabel = localStorage.getItem(`public-label-${userId}`)
      if (savedLabel) {
        setPublicLabel(savedLabel)
      }
    }

    if (userId) {
      const allPosts = await getAllPostsAsync()
      const theirPosts = allPosts.filter(p => p.npcId === userId)
      setNpcPosts(theirPosts)
      // 查找标记了该用户的帖子
      const tagged = allPosts.filter(p => p.taggedUsers?.includes(userId))
      setTaggedPosts(tagged)

      const savedSocialData = localStorage.getItem(`social-profile-${userId}`)
      let savedProfile: { followers?: number; following?: number } | null = null
      if (savedSocialData) {
        try {
          savedProfile = JSON.parse(savedSocialData)
        } catch (e) {
          console.error(e)
        }
      }

      // 🔥 总是尝试获取character数据（用于头像等信息）
      const characters = await getAllCharacters()
      const foundChar = characters.find(c => c.id === userId)

      const foundNPC = getNPCById(userId)
      if (foundNPC) {
        setNpc(foundNPC)
        setCharacter(foundChar || null) // 🔥 保留character用于头像
        setIsFollowing(isFollowingNPC(userId))
        setStats({
          posts: theirPosts.length,
          followers: typeof savedProfile?.followers === 'number' ? savedProfile.followers : foundNPC.followers,
          following: typeof savedProfile?.following === 'number' ? savedProfile.following : Math.floor(Math.random() * 200) + 50
        })
      } else if (foundChar) {
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
    } else {
      setNpc(null)
      setCharacter(null)

      const allPosts = await getAllPostsAsync()
      const myPosts = allPosts.filter(p => p.npcId === 'user')
      setUserPosts(myPosts)
      // 查找标记了用户的帖子
      const tagged = allPosts.filter(p => p.taggedUsers?.includes('user'))
      setTaggedPosts(tagged)

      const userData = getUserData()
      const characters = await getAllCharacters()
      setStats({
        posts: myPosts.length,
        followers: userData.followers,
        following: characters.length
      })
    }
    setIsLoading(false)
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

  const handleSaveProfile = async () => {
    const info = await getUserInfoWithAvatar()
    setUserInfo(info)
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
  "following": 关注数（通常几十到几百）,
  "publicLabel": "公众人物标签（2-4个字，如：音乐人、游戏主播、演员、作家、网红、舞者、画师、运动员、模特、Coser、主持人、导演、歌手、偶像、DJ、电竞选手等，根据人设匹配最合适的；如果不是公众人物则留空）"
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

        // 保存公众人物标签（空字符串表示AI判断不是公众人物）
        if (parsed.publicLabel) {
          setPublicLabel(parsed.publicLabel)
          localStorage.setItem(`public-label-${userId}`, parsed.publicLabel)
        } else {
          // AI返回空，表示不是公众人物，保存特殊标记
          setPublicLabel('__none__')
          localStorage.setItem(`public-label-${userId}`, '__none__')
        }
      }
    } catch (error) {
      console.error('刷新数据失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleWallpaperChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const bgKey = `profile-wallpaper-${userId || 'user'}`
      // 保存到IndexedDB
      const url = await saveBackground(bgKey, file)
      setWallpaper(url)
    }
  }

  return (
    <InstagramLayout showHeader={false} showTabBar={!userId}>
      {/* 沉浸式背景区域 - 玻璃风格（包含状态栏） */}
      <div className="relative h-[35vh] w-full overflow-hidden bg-transparent">
        {/* 状态栏 */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <StatusBar theme="light" />
        </div>
        {wallpaper ? (
          <img src={wallpaper} alt="background" className="w-full h-full object-cover opacity-90" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200/50 backdrop-blur-sm" />
        )}
        {/* 渐变遮罩 - 优化为玻璃过渡 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/10" />

        {/* 顶部导航 */}
        <div className="absolute top-8 left-0 right-0 z-10 flex items-center justify-between px-5 py-4">
          {userId ? (
            <button onClick={() => navigate(-1)} className="text-white/90 hover:text-white transition-colors drop-shadow-md">
              <ArrowLeft className="w-6 h-6 stroke-[1.5]" />
            </button>
          ) : (
            <div className="w-5" />
          )}

          <div className="flex items-center gap-4">
            {userId ? (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-white/90 hover:text-white transition-colors disabled:opacity-30 drop-shadow-md"
              >
                <RefreshCw className={`w-5 h-5 stroke-[1.5] ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <label className="text-white/90 hover:text-white transition-colors cursor-pointer drop-shadow-md">
                  <ImageIcon className="w-5 h-5 stroke-[1.5]" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperChange} />
                </label>
                <button
                  onClick={() => navigate('/instagram/settings')}
                  className="text-white/90 hover:text-white transition-colors drop-shadow-md"
                >
                  <Settings className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>
            )}
            <button className="text-white/90 hover:text-white transition-colors drop-shadow-md">
              <MoreHorizontal className="w-6 h-6 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 - 玻璃卡片 */}
      <div className="relative -mt-12 bg-white/60 backdrop-blur-xl min-h-[70vh] z-10 rounded-t-[32px] font-serif border-t border-white/40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {/* 个人信息部分 */}
        <div className="px-6 pb-6">
          <div className="flex justify-between items-end -mt-12 mb-4">
            {/* 头像 */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full p-1 bg-white/40 backdrop-blur-md border border-white/60 shadow-lg">
                {isLoading ? (
                  <div className="w-full h-full rounded-full bg-white/50 animate-pulse" />
                ) : (
                  (() => {
                    const avatarSrc = character?.avatar || (npc?.avatar && npc.avatar !== '/default-avatar.png' ? npc.avatar : null) || userInfo.avatar
                    const displayName = npc?.name || character?.nickname || character?.realName || userInfo.nickname || userInfo.realName || '我'
                    return avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt="avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-2xl font-medium text-gray-600">{displayName[0]}</span>
                      </div>
                    )
                  })()
                )}
              </div>
            </div>

            {/* 操作按钮 - 玻璃风格 */}
            <div className="flex gap-2 mb-2">
              {userId ? (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-full text-xs tracking-widest transition-all border backdrop-blur-sm shadow-sm ${isFollowing
                      ? 'bg-white/30 text-[#2C2C2C] border-white/50 hover:bg-white/50'
                      : 'bg-[#2C2C2C]/90 text-white border-transparent hover:bg-[#2C2C2C]'
                      }`}
                  >
                    {isFollowing ? '已关注' : '关注'}
                  </button>
                  <button
                    onClick={() => navigate(`/instagram/dm/${userId}`)}
                    className="px-6 py-2 rounded-full bg-white/30 text-xs tracking-widest text-[#2C2C2C] border border-white/50 hover:bg-white/50 transition-all backdrop-blur-sm shadow-sm"
                  >
                    私信
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="px-6 py-2 rounded-full bg-white/30 text-xs tracking-widest text-[#2C2C2C] border border-white/50 hover:bg-white/50 transition-all backdrop-blur-sm shadow-sm"
                >
                  编辑资料
                </button>
              )}
            </div>
          </div>

          {/* 名字和简介 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-medium text-[#2C2C2C] tracking-wide">
                {npc?.name || character?.nickname || character?.realName || userInfo.nickname || userInfo.realName || '我的名字'}
              </h2>
              {/* 公众人物标签 */}
              {(publicLabel && publicLabel !== '__none__') ? (
                <span className="text-[10px] border border-[#8C8C8C]/50 bg-white/30 backdrop-blur-sm text-[#5A5A5A] px-1.5 py-0.5 rounded-sm tracking-widest scale-90 origin-left">
                  {publicLabel}
                </span>
              ) : (!publicLabel && character?.isPublicFigure) ? (
                <span className="text-[10px] border border-[#8C8C8C]/50 bg-white/30 backdrop-blur-sm text-[#5A5A5A] px-1.5 py-0.5 rounded-sm tracking-widest scale-90 origin-left">
                  官方
                </span>
              ) : null}
            </div>
            <p className="text-sm text-[#5A5A5A] leading-relaxed whitespace-pre-wrap font-light opacity-90">
              {(() => {
                // 优先使用角色的 signature（如果存在且不是人设数据）
                if (character?.signature) {
                  const sig = character.signature
                  // 过滤掉看起来像人设YAML的内容
                  if (!sig.includes('<info>') && !sig.includes('<character>') && !sig.includes('```') && sig.length < 200) {
                    return sig
                  }
                }
                // 其次使用 publicPersona
                if (character?.publicPersona) {
                  return character.publicPersona
                }
                // 然后是 NPC 的 bio（也要过滤）
                if (npc?.bio) {
                  const bio = npc.bio
                  if (!bio.includes('<info>') && !bio.includes('<character>') && !bio.includes('```') && bio.length < 200) {
                    return bio
                  }
                }
                // 用户自己的签名
                if (userInfo.signature) {
                  return userInfo.signature
                }
                return '暂无简介'
              })()}
            </p>
          </div>

          {/* 统计数据 - 极简风格 */}
          <div className="flex items-center gap-10 mb-2 border-b border-white/30 pb-6">
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-[#2C2C2C]">{stats.posts}</span>
              <span className="text-[10px] text-[#8C8C8C] opacity-80">帖子</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-[#2C2C2C]">
                {stats.followers >= 10000
                  ? `${(stats.followers / 1000).toFixed(1)}k`
                  : stats.followers.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8C8C8C] opacity-80">粉丝</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-[#2C2C2C]">
                {stats.following >= 1000
                  ? `${(stats.following / 1000).toFixed(1)}k`
                  : stats.following}
              </span>
              <span className="text-[10px] text-[#8C8C8C] opacity-80">关注</span>
            </div>
          </div>
        </div>

        {/* 标签栏 - 玻璃吸顶 */}
        <div className="sticky top-0 bg-white/40 backdrop-blur-md z-20 border-b border-white/20">
          <div className="flex justify-center gap-16 pt-3 pb-3">
            <button
              onClick={() => setActiveTab('grid')}
              className={`pb-1 text-[10px] tracking-[0.2em] uppercase transition-all relative ${activeTab === 'grid' ? 'text-[#2C2C2C] font-medium' : 'text-[#8C8C8C]'
                }`}
            >
              帖子
              {activeTab === 'grid' && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2C2C2C]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('tagged')}
              className={`pb-1 text-[10px] tracking-[0.2em] uppercase transition-all relative ${activeTab === 'tagged' ? 'text-[#2C2C2C] font-medium' : 'text-[#8C8C8C]'
                }`}
            >
              标记
              {activeTab === 'tagged' && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2C2C2C]" />
              )}
            </button>
          </div>
        </div>

        {/* 帖子网格 - 艺术留白 */}
        <div className="pb-20 px-4 pt-4">
          {activeTab === 'grid' ? (
            (userId ? npcPosts : userPosts).length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {(userId ? npcPosts : userPosts).map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-[3/4] bg-white/40 backdrop-blur-sm cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 rounded-sm"
                    onClick={() => navigate(`/instagram/post/${post.id}`)}
                  >
                    {post.images === 0 ? (
                      <div className="w-full h-full p-4 flex items-center justify-center bg-white/20">
                        <p className="text-[10px] text-center line-clamp-5 text-[#5A5A5A] leading-relaxed font-serif italic opacity-80">
                          {post.content}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-full">
                        {post.imageUrls?.[0] && (
                          <img src={post.imageUrls[0]} alt="" className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700" />
                        )}
                      </div>
                    )}

                    {/* 悬浮遮罩 - 玻璃 */}
                    <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                      <div className="flex items-center gap-1.5 text-[#2C2C2C]">
                        <Heart className="w-4 h-4 stroke-[1.5]" />
                        <span className="text-xs font-medium">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#2C2C2C]">
                        <MessageCircle className="w-4 h-4 stroke-[1.5]" />
                        <span className="text-xs font-medium">{post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-white/40 bg-white/20 rounded-full backdrop-blur-sm">
                  <ImageIcon className="w-5 h-5 text-[#8C8C8C] stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-medium text-[#5A5A5A] mb-1">暂无帖子</h3>
                <p className="text-[10px] text-[#8C8C8C]">
                  {userId ? '该用户还没有发过帖子' : '记录你的第一个瞬间'}
                </p>
              </div>
            )
          ) : taggedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {taggedPosts.map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-[3/4] bg-white/40 backdrop-blur-sm cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 rounded-sm"
                  onClick={() => navigate(`/instagram/post/${post.id}`)}
                >
                  {post.images === 0 ? (
                    <div className="w-full h-full p-4 flex items-center justify-center bg-white/20">
                      <p className="text-[10px] text-center line-clamp-5 text-[#5A5A5A] leading-relaxed font-serif italic opacity-80">
                        {post.content}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-full">
                      {post.imageUrls?.[0] && (
                        <img
                          src={post.imageUrls[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}
                  {/* 标记图标 */}
                  <div className="absolute bottom-2 left-2">
                    <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  {/* Hover 状态 */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5 text-white">
                      <Heart className="w-4 h-4 stroke-[1.5]" />
                      <span className="text-xs font-medium">{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white">
                      <MessageCircle className="w-4 h-4 stroke-[1.5]" />
                      <span className="text-xs font-medium">{post.comments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-white/40 bg-white/20 rounded-full backdrop-blur-sm">
                <svg className="w-5 h-5 text-[#8C8C8C] stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-[#5A5A5A] mb-1">被标记</h3>
              <p className="text-[10px] text-[#8C8C8C]">
                你被标记的帖子将显示在这里
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
