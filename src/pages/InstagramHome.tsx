import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Share2, PlusSquare, MoreHorizontal, X, Flame, RefreshCw } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import InstagramLayout from '../components/InstagramLayout'
import { getAllPostsAsync, toggleLike, getNPCById, initForumData } from '../utils/forumNPC'
import { getAllCharacters } from '../utils/characterManager'
import { getUserInfoWithAvatar, type UserInfo } from '../utils/userUtils'
import type { ForumPost } from '../utils/forumNPC'
import type { Character } from '../services/characterService'
import CommentContentRenderer from '../components/CommentContentRenderer'
import { generateNPCPosts, generateHotTopics, checkAutoGeneratePosts } from '../utils/forumNPCPost'

const InstagramHome = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: '', realName: '' })
  
  // 刷新弹窗状态
  const [showRefreshModal, setShowRefreshModal] = useState(false)
  const [refreshCount, setRefreshCount] = useState(3)
  const [topicHint, setTopicHint] = useState('')  // 用户输入的话题提示
  const [refreshCharacterId, setRefreshCharacterId] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // 热点弹窗状态
  const [showHotTopics, setShowHotTopics] = useState(false)
  const [hotTopics, setHotTopics] = useState<string[]>([])
  const [isLoadingHotTopics, setIsLoadingHotTopics] = useState(false)

  const formatTimeAgo = (timestamp: number | undefined): string => {
    if (!timestamp) return '刚刚'
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString()
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await initForumData()
    // Load user info with avatar
    const info = await getUserInfoWithAvatar()
    setUserInfo(info)
    const chars = await getAllCharacters()
    setCharacters(chars)
    
    // 检查是否需要自动生成帖子（1小时后上线）
    await checkAutoGeneratePosts()
    
    const loadedPosts = await getAllPostsAsync()
    const mainPosts = loadedPosts.filter(p => !(p as any).topicId)
    setPosts(mainPosts)
  }
  
  // 刷新热点话题
  const refreshHotTopics = async () => {
    setIsLoadingHotTopics(true)
    try {
      const topics = await generateHotTopics()
      setHotTopics(topics)
    } catch (e) {
      console.error('刷新热点失败:', e)
    } finally {
      setIsLoadingHotTopics(false)
    }
  }

  const handleLike = async (postId: string) => {
    const updatedPosts = await toggleLike(postId)
    setPosts(updatedPosts.filter(p => !(p as any).topicId))
  }

  // 刷新社区动态 - 生成NPC帖子
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const newPosts = await generateNPCPosts({
        count: refreshCount,
        topicHint: topicHint || undefined,
        specificCharacterId: refreshCharacterId || undefined
      })
      
      if (newPosts.length > 0) {
        // 重新加载帖子列表
        const allPosts = await getAllPostsAsync()
        setPosts(allPosts.filter(p => !(p as any).topicId))
        setShowRefreshModal(false)
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('生成帖子失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getCharacterName = (id: string): string => {
    const char = characters.find(c => String(c.id) === String(id))
    if (char) return char.nickname || char.realName || id
    const npc = getNPCById(id)
    if (npc) return npc.name
    return id
  }

  const getRealAvatar = (npcId: string, npcAvatar: string): string => {
    const character = characters.find(c => String(c.id) === String(npcId))
    if (character?.avatar) return character.avatar
    if (!npcAvatar || npcAvatar === '/default-avatar.png') return '/default-avatar.png'
    return npcAvatar
  }

  return (
    <InstagramLayout showHeader={false}>
      <div className="min-h-screen bg-transparent font-serif text-[#2C2C2C]">
        {/* 顶部导航 - 玻璃拟态（包含状态栏） */}
        <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
          <StatusBar />
          <div className="px-6 pb-4 flex items-center justify-between relative">
            <button
              onClick={() => navigate('/')}
              className="text-[#5A5A5A] hover:text-[#2C2C2C] transition-colors p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              className="text-lg font-medium tracking-[0.2em] cursor-pointer text-[#2C2C2C] absolute left-1/2 -translate-x-1/2"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              社区
            </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/instagram/create')}
              className="text-[#5A5A5A] hover:text-[#2C2C2C] transition-colors"
            >
              <PlusSquare className="w-5 h-5 stroke-[1.5]" />
            </button>
{/* 刷新按钮暂时隐藏，自动刷新使用zhizhi API */}
            <button
              onClick={() => setShowHotTopics(true)}
              className="text-[#5A5A5A] hover:text-[#2C2C2C] transition-colors"
              title="今日热点"
            >
              <Flame className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>
          </div>
        </div>

        {/* Stories - 玻璃质感圆环区域 */}
        <div className="pt-6 pb-4 border-b border-white/30 bg-white/20 backdrop-blur-sm">
          <div className="max-w-screen-sm mx-auto px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-6 justify-center">
              {/* 我的 */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
                <div className="relative w-14 h-14">
                  <div className="w-full h-full rounded-full p-[3px] border border-white/60 group-hover:border-[#8C8C8C] transition-colors bg-white/30 backdrop-blur-md">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {userInfo.avatar ? (
                        <img src={userInfo.avatar} alt="我" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-full h-full bg-white/40 flex items-center justify-center text-[#8C8C8C] text-xs">
                          我
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#2C2C2C] rounded-full flex items-center justify-center text-white border border-white/50">
                    <PlusSquare className="w-2.5 h-2.5" />
                  </div>
                </div>
                <span className="text-[10px] text-[#5A5A5A] tracking-wider">我的</span>
              </div>

              {/* 角色列表 */}
              {characters.filter(c => c.nickname || c.realName).map((character) => (
                <div
                  key={character.id}
                  className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
                  onClick={() => navigate(`/instagram/user/${character.id}`)}
                >
                  <div className="w-14 h-14 rounded-full p-[3px] border border-white/60 group-hover:border-[#8B3A3A] transition-colors bg-white/30 backdrop-blur-md">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img
                        src={character.avatar || '/default-avatar.png'}
                        alt={character.realName}
                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#5A5A5A] tracking-wider max-w-[56px] truncate text-center">
                    {character.nickname || character.realName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Posts Feed - 玻璃卡片排版 */}
        <div className="pb-20 pt-2">
          <div className="max-w-screen-sm mx-auto">
            {posts.filter(post => post.npcId).map((post) => {
              const isUserPost = post.npcId === 'user'
              
              // 尝试获取NPC信息，找不到就用角色信息
              let npc = !isUserPost ? getNPCById(post.npcId) : null
              const char = !isUserPost ? characters.find(c => String(c.id) === String(post.npcId)) : null
              
              // 如果getNPCById找不到但角色存在，用角色信息创建临时NPC对象
              if (!isUserPost && !npc && char) {
                npc = {
                  id: String(char.id),
                  name: char.nickname || char.realName || 'Unknown',
                  avatar: char.avatar || '/default-avatar.png',
                  bio: char.signature || '',
                  followers: 0
                }
              }
              
              // 如果还是找不到，跳过这条帖子
              if (!isUserPost && !npc) {
                return null
              }
              
              // 判断是好友（角色）还是NPC
              const isFriend = isUserPost || !!char

              const authorName = isUserPost ? (userInfo.nickname || userInfo.realName || '我') : npc!.name
              const authorAvatar = isUserPost ? (userInfo.avatar || '/default-avatar.png') : getRealAvatar(npc!.id, npc!.avatar)

              return (
                <div key={post.id} className={`mb-6 backdrop-blur-md shadow-sm border sm:rounded-2xl sm:mx-4 overflow-hidden transition-all hover:shadow-md ${
                  isFriend 
                    ? 'bg-white/60 border-white/40 hover:bg-white/70' 
                    : 'bg-gray-50/60 border-gray-200/40 hover:bg-gray-50/70'
                }`}>
                  {/* Header */}
                  <div className="px-5 py-4 flex items-center justify-between border-b border-white/30">
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => !isUserPost && navigate(`/instagram/user/${npc!.id}`)}
                    >
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-10 h-10 rounded-full object-cover opacity-90 group-hover:opacity-100 transition-opacity border border-white/50 shadow-sm"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#2C2C2C] tracking-wide group-hover:text-black transition-colors">
                            {authorName}
                          </span>
                          {/* 好友/NPC标签 */}
                          {!isUserPost && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-sm ${
                              isFriend 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isFriend ? '好友' : 'NPC'}
                            </span>
                          )}
                          {/* 公众人物标签 */}
                          {(() => {
                            const char = characters.find(c => c.id === post.npcId)
                            if (!char?.isPublicFigure) return null
                            const savedLabel = localStorage.getItem(`public-label-${post.npcId}`)
                            const label = (savedLabel && savedLabel !== '__none__') ? savedLabel : 'OFFICIAL'
                            return (
                              <span className="text-[9px] border border-[#8C8C8C]/50 text-[#5A5A5A] px-1 rounded-sm tracking-widest scale-90 origin-left backdrop-blur-sm">
                                {label}
                              </span>
                            )
                          })()}
                        </div>
                        <span className="text-[10px] text-[#8C8C8C] tracking-wider font-sans opacity-80">
                          {formatTimeAgo(post.timestamp)} {post.location && `· ${post.location}`}
                        </span>
                      </div>
                    </div>
                    <button className="text-[#8C8C8C] hover:text-[#2C2C2C] transition-colors p-1 rounded-full hover:bg-white/30">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-5 pt-3 pb-2">
                    {post.content && (
                      <div className="text-[15px] text-[#4A4A4A] leading-loose mb-3 whitespace-pre-wrap font-light text-justify">
                        <CommentContentRenderer content={post.content} emojiSize={18} />
                      </div>
                    )}

                    {/* Images - 只显示imageUrls中的实际图片 */}
                    {(post.imageUrls?.length || 0) > 0 && (
                      <div className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${post.imageUrls!.length === 1 ? 'grid-cols-1' :
                        post.imageUrls!.length === 2 ? 'grid-cols-2' :
                          'grid-cols-3'
                        }`}>
                        {post.imageUrls!.slice(0, 9).map((url, index) => (
                          <div key={index} className={`relative overflow-hidden bg-black/5 ${post.imageUrls!.length === 1 ? 'aspect-[4/3]' : 'aspect-square'
                            }`}>
                            <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 只有没有imageUrls但有images数量时才显示占位符 */}
                    {(!post.imageUrls || post.imageUrls.length === 0) && post.images > 0 && (
                      <div className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${post.images === 1 ? 'grid-cols-1' : 'grid-cols-3'
                        }`}>
                        {Array.from({ length: Math.min(post.images, 9) }).map((_, index) => (
                          <div key={index} className="aspect-square bg-black/5 flex items-center justify-center backdrop-blur-sm">
                            <span className="text-[#D4D4D4] text-xs tracking-widest font-sans">IMAGE</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3 border-t border-white/30 flex items-center justify-between bg-white/20">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 group"
                      >
                        <Heart
                          className={`w-5 h-5 transition-all duration-300 stroke-[1.5] ${post.isLiked ? 'text-[#8B3A3A] fill-[#8B3A3A]' : 'text-[#5A5A5A] group-hover:text-[#2C2C2C]'
                            }`}
                        />
                        <span className={`text-xs tracking-wide ${post.isLiked ? 'text-[#8B3A3A]' : 'text-[#8C8C8C] group-hover:text-[#5A5A5A]'}`}>
                          {post.likes > 0 ? post.likes : 'Like'}
                        </span>
                      </button>

                      <button
                        className="flex items-center gap-1.5 group"
                        onClick={() => navigate(`/instagram/post/${post.id}`)}
                      >
                        <MessageCircle className="w-5 h-5 text-[#5A5A5A] group-hover:text-[#2C2C2C] stroke-[1.5] transition-colors" />
                        <span className="text-xs text-[#8C8C8C] group-hover:text-[#5A5A5A] tracking-wide">
                          {post.comments > 0 ? post.comments : 'Reply'}
                        </span>
                      </button>
                    </div>

                    <button className="text-[#5A5A5A] hover:text-[#2C2C2C] transition-colors">
                      <Share2 className="w-5 h-5 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              )
            })}

            <div className="py-12 text-center">
              <span className="text-[10px] text-[#D4D4D4] tracking-[0.3em] font-sans uppercase opacity-60">
                - End of Feed -
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 刷新弹窗 */}
      {showRefreshModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[90%] max-w-sm shadow-2xl overflow-hidden">
            {/* 标题 */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-800">刷新社区动态</h3>
              <button 
                onClick={() => setShowRefreshModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4">
              {/* 发帖数量 */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">生成帖子数量</label>
                <div className="flex gap-2">
                  {[1, 3, 5, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setRefreshCount(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        refreshCount === n 
                          ? 'bg-[#2C2C2C] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}条
                    </button>
                  ))}
                </div>
              </div>

              {/* 话题提示（可选） */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">话题方向（可选，留空则随机）</label>
                <input
                  type="text"
                  value={topicHint}
                  onChange={(e) => setTopicHint(e.target.value)}
                  placeholder="如：美食分享、工作吐槽、恋爱八卦..."
                  className="w-full p-2.5 rounded-lg bg-gray-100 text-sm text-gray-700 outline-none border-none placeholder:text-gray-400"
                />
              </div>

              {/* 指定角色 */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">指定发帖者（可选）</label>
                <select
                  value={refreshCharacterId}
                  onChange={(e) => setRefreshCharacterId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-100 text-sm text-gray-700 outline-none border-none"
                >
                  <option value="">随机选择</option>
                  {characters.filter(c => c.nickname || c.realName).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nickname || c.realName} {c.isPublicFigure ? '(公众人物)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 按钮 */}
            <div className="px-5 pb-5">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full py-3 bg-[#2C2C2C] text-white rounded-xl font-medium transition-all hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    生成帖子
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 热点弹窗 */}
      {showHotTopics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[90%] max-w-sm shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            {/* 标题 */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-gray-800">今日热点</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshHotTopics}
                  disabled={isLoadingHotTopics}
                  className="text-orange-500 hover:text-orange-600 p-1 disabled:opacity-50"
                  title="刷新热点"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingHotTopics ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowHotTopics(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 热点列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingHotTopics ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
                  <span className="ml-2 text-gray-500">正在分析论坛动态...</span>
                </div>
              ) : hotTopics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3">点击刷新获取热点</p>
                  <button
                    onClick={refreshHotTopics}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm"
                  >
                    生成热点
                  </button>
                </div>
              ) : (
                hotTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setTopicHint(topic)
                      setShowHotTopics(false)
                      setShowRefreshModal(true)
                    }}
                    className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-orange-50 transition-colors flex items-center gap-3 group"
                  >
                    <span className={`text-sm font-bold ${index < 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                      {topic}
                    </span>
                    {index < 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">热</span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* 提示 */}
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400">热点根据当前帖子和角色动态生成</span>
            </div>
          </div>
        </div>
      )}
    </InstagramLayout>
  )
}

export default InstagramHome
