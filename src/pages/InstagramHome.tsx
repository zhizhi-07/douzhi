import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Navigation, PlusSquare, Bell, MoreHorizontal } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import InstagramLayout from '../components/InstagramLayout'
import { getAllPostsAsync, toggleLike, getNPCById, initForumData } from '../utils/forumNPC'
import { getAllCharacters } from '../utils/characterManager'
import { getUserInfoWithAvatar, type UserInfo } from '../utils/userUtils'
import type { ForumPost } from '../utils/forumNPC'
import type { Character } from '../services/characterService'
import EmojiContentRenderer from '../components/EmojiContentRenderer'

const InstagramHome = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: '', realName: '' })

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
    const loadedPosts = await getAllPostsAsync()
    const mainPosts = loadedPosts.filter(p => !(p as any).topicId)
    setPosts(mainPosts)
  }

  const handleLike = async (postId: string) => {
    const updatedPosts = await toggleLike(postId)
    setPosts(updatedPosts.filter(p => !(p as any).topicId))
  }

  const getCharacterName = (id: string): string => {
    const char = characters.find(c => c.id === id)
    if (char) return char.nickname || char.realName || id
    const npc = getNPCById(id)
    if (npc) return npc.name
    return id
  }

  const getRealAvatar = (npcId: string, npcAvatar: string): string => {
    const character = characters.find(c => c.id === npcId)
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
            <button className="text-[#5A5A5A] hover:text-[#2C2C2C] transition-colors relative">
              <Bell className="w-5 h-5 stroke-[1.5]" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#8B3A3A] rounded-full"></span>
            </button>
            <button
              onClick={() => navigate('/instagram/dm/list')}
              className="text-[#5A5A5A] hover:text-[#2C2C2C] transition-colors"
            >
              <Navigation className="w-5 h-5 stroke-[1.5] rotate-90" />
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
              const npc = !isUserPost ? getNPCById(post.npcId) : null
              if (!isUserPost && !npc) return null

              const authorName = isUserPost ? (userInfo.nickname || userInfo.realName || '我') : npc!.name
              const authorAvatar = isUserPost ? (userInfo.avatar || '/default-avatar.png') : getRealAvatar(npc!.id, npc!.avatar)

              return (
                <div key={post.id} className="mb-6 bg-white/60 backdrop-blur-md shadow-sm border border-white/40 sm:rounded-2xl sm:mx-4 overflow-hidden transition-all hover:bg-white/70 hover:shadow-md">
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
                        <EmojiContentRenderer content={post.content} emojiSize={18} />
                      </div>
                    )}

                    {/* Images - 艺术画廊布局 */}
                    {(post.imageUrls?.length || 0) > 0 ? (
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
                    ) : post.images > 0 ? (
                      <div className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${post.images === 1 ? 'grid-cols-1' : 'grid-cols-3'
                        }`}>
                        {Array.from({ length: Math.min(post.images, 9) }).map((_, index) => (
                          <div key={index} className="aspect-square bg-black/5 flex items-center justify-center backdrop-blur-sm">
                            <span className="text-[#D4D4D4] text-xs tracking-widest font-sans">IMAGE</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
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
                      <Navigation className="w-5 h-5 stroke-[1.5] -rotate-45" />
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
    </InstagramLayout>
  )
}

export default InstagramHome
