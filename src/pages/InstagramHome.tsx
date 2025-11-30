import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Navigation, Bookmark, MoreHorizontal, PlusSquare, Bell } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { getAllPosts, getAllPostsAsync, toggleLike, getNPCById, initForumData } from '../utils/forumNPC'
import { getAllCharacters } from '../utils/characterManager'
import { getUserInfo } from '../utils/userUtils'
import type { ForumPost } from '../utils/forumNPC'
import type { Character } from '../services/characterService'
import EmojiContentRenderer from '../components/EmojiContentRenderer'

// 解析帖子内容，把[图片：描述]或【截图：描述】标记转换成图片卡片
const parsePostContent = (content: string) => {
  const imagePattern = /[\[【](图片|照片|截图)[:：]([^\]】]+)[\]】]/g

  const hasImages = imagePattern.test(content)
  if (!hasImages) {
    return <p className="text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap"><EmojiContentRenderer content={content} emojiSize={20} /></p>
  }

  imagePattern.lastIndex = 0

  const elements: React.ReactNode[] = []
  const images: { type: string; desc: string }[] = []
  let lastIndex = 0
  let match

  while ((match = imagePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text.trim()) {
        if (images.length > 0) {
          elements.push(
            <div key={`imgs-${lastIndex}`} className="grid grid-cols-3 gap-1 my-2">
              {images.map((img, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden p-1.5">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-500 text-center leading-tight line-clamp-3">{img.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )
          images.length = 0
        }
        elements.push(
          <p key={`text-${lastIndex}`} className="text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap mb-2">
            {text}
          </p>
        )
      }
    }
    images.push({ type: match[1], desc: match[2] })
    lastIndex = match.index + match[0].length
  }

  if (images.length > 0) {
    elements.push(
      <div key={`imgs-end`} className="grid grid-cols-3 gap-1 my-2">
        {images.map((img, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg overflow-hidden p-2">
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-gray-700 font-medium text-center leading-tight line-clamp-3">{img.desc}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex)
    if (text.trim()) {
      elements.push(
        <p key={`text-${lastIndex}`} className="text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap">
          {text}
        </p>
      )
    }
  }

  return <>{elements}</>
}

const InstagramHome = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const userInfo = getUserInfo()

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
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return `${Math.floor(days / 30)}月前`
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await initForumData()
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
    if (character?.avatar) {
      return character.avatar
    }
    if (!npcAvatar || npcAvatar === '/default-avatar.png') {
      return '/default-avatar.png'
    }
    return npcAvatar
  }

  return (
    <InstagramLayout showHeader={false}>
      {/* 自定义顶部导航 - 极简风格 */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-all"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Forum
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/instagram/create')}
            className="text-gray-900 hover:text-gray-600 transition-colors"
          >
            <PlusSquare className="w-6 h-6" />
          </button>
          <button className="text-gray-900 hover:text-gray-600 transition-colors relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <button
            onClick={() => navigate('/instagram/dm/list')}
            className="text-gray-900 hover:text-gray-600 transition-colors relative"
          >
            <Navigation className="w-6 h-6 rotate-90" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border border-white">
              3
            </span>
          </button>
        </div>
      </div>

      {/* Stories横向滚动区域 - 简约风格 */}
      <div className="bg-white pt-3 pb-2 border-b border-gray-100">
        <div className="px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-2">
            {/* 我的Story */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
              <div className="relative w-[64px] h-[64px]">
                <div className="w-full h-full rounded-full p-[2px] bg-white border border-gray-200">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} alt="我" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                        我
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-500 border-[2px] border-white flex items-center justify-center text-white">
                  <PlusSquare className="w-3 h-3" />
                </div>
              </div>
              <span className="text-[11px] text-gray-600 font-medium">我的</span>
            </div>

            {/* 角色Stories */}
            {characters.filter(c => c.nickname || c.realName).map((character, i) => (
              <div
                key={character.id}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
                onClick={() => navigate(`/instagram/user/${character.id}`)}
              >
                <div className="w-[64px] h-[64px] rounded-full p-[2px] border-2 border-blue-500">
                  <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white">
                    <img
                      src={character.avatar || '/default-avatar.png'}
                      alt={character.realName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-[11px] text-gray-900 font-medium max-w-[64px] truncate">
                  {character.nickname || character.realName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Feed - 微博/贴吧风格 */}
      <div className="pb-20 bg-[#f2f2f2] min-h-screen">
        <div className="max-w-screen-sm mx-auto">
          {posts.filter(post => post.npcId).map((post) => {
            const isUserPost = post.npcId === 'user'
            const npc = !isUserPost ? getNPCById(post.npcId) : null

            if (!isUserPost && !npc) return null

            const authorName = isUserPost
              ? (userInfo.nickname || userInfo.realName || '我')
              : npc!.name

            const authorAvatar = isUserPost
              ? (userInfo.avatar || '/default-avatar.png')
              : getRealAvatar(npc!.id, npc!.avatar)

            return (
              <div key={post.id} className="bg-white mb-2 py-3">
                {/* Post Header */}
                <div className="flex items-start justify-between px-4 mb-2">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => !isUserPost && navigate(`/instagram/user/${npc!.id}`)}
                  >
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-bold text-[#333]">{authorName}</span>
                        {characters.find(c => c.id === post.npcId)?.isPublicFigure && (
                          <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium align-middle">官方</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{formatTimeAgo(post.timestamp)}</span>
                        {post.location && <span>· {post.location}</span>}
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Content */}
                <div className="px-4 mb-2">
                  {/* 文字内容 */}
                  {post.content && (
                    <div className="text-[16px] text-[#333] leading-relaxed mb-2 whitespace-pre-wrap break-words">
                      <EmojiContentRenderer content={post.content} emojiSize={20} />
                    </div>
                  )}

                  {/* 图片展示 - 九宫格 */}
                  {(post.imageUrls?.length || 0) > 0 ? (
                    <div className={`grid gap-1 ${post.imageUrls!.length === 1 ? 'grid-cols-2' :
                      post.imageUrls!.length === 2 ? 'grid-cols-2' :
                        post.imageUrls!.length === 4 ? 'grid-cols-2' : 'grid-cols-3'
                      } ${post.imageUrls!.length === 1 ? 'max-w-[70%]' : ''}`}>
                      {post.imageUrls!.slice(0, 9).map((url, index) => (
                        <div key={index} className={`relative bg-[#f0f0f0] overflow-hidden ${post.imageUrls!.length === 1 ? 'aspect-auto' : 'aspect-square'
                          }`}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : post.images > 0 ? (
                    // 占位图 - 纯色背景，无渐变
                    <div className={`grid gap-1 ${post.images === 1 ? 'grid-cols-2' :
                      post.images === 2 ? 'grid-cols-2' :
                        post.images === 4 ? 'grid-cols-2' : 'grid-cols-3'
                      } ${post.images === 1 ? 'max-w-[70%]' : ''}`}>
                      {Array.from({ length: Math.min(post.images, 9) }).map((_, index) => (
                        <div key={index} className="aspect-square bg-[#e6e6e6] relative overflow-hidden flex items-center justify-center">
                          <span className="text-gray-400 text-xs">图片</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Tagged Users */}
                {post.taggedUsers && post.taggedUsers.length > 0 && (
                  <div className="px-4 mb-3 flex flex-wrap gap-1">
                    {post.taggedUsers.map(id => (
                      <span key={id} className="text-[13px] text-[#4078c0]">
                        @{getCharacterName(id)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Post Actions - 底部栏 */}
                <div className="px-4 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 group"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${post.isLiked
                          ? 'text-red-500 fill-red-500'
                          : 'text-gray-600 group-hover:text-gray-900'
                          }`}
                      />
                      <span className={`text-[13px] ${post.isLiked ? 'text-red-500' : 'text-gray-600'}`}>
                        {post.likes > 0 ? post.likes : '赞'}
                      </span>
                    </button>
                    <button
                      className="flex items-center gap-1.5 group"
                      onClick={() => navigate(`/instagram/post/${post.id}`)}
                    >
                      <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                      <span className="text-[13px] text-gray-600">
                        {post.comments > 0 ? post.comments : '评论'}
                      </span>
                    </button>
                    <button className="flex items-center gap-1.5 group">
                      <Navigation className="w-5 h-5 text-gray-600 group-hover:text-gray-900 rotate-90" />
                      <span className="text-[13px] text-gray-600">分享</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="py-8 flex flex-col items-center justify-center text-gray-400">
            <span className="text-xs">没有更多内容了</span>
          </div>
        </div>
      </div>
    </InstagramLayout>
  )
}

export default InstagramHome
