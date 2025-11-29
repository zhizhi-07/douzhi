import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { getAllPosts, toggleLike, getNPCById, initForumData } from '../utils/forumNPC'
import { getAllCharacters } from '../utils/characterManager'
import { getUserInfo } from '../utils/userUtils'
import type { ForumPost } from '../utils/forumNPC'
import type { Character } from '../services/characterService'
import EmojiContentRenderer from '../components/EmojiContentRenderer'

// 解析帖子内容，把[图片：描述]或【截图：描述】标记转换成图片卡片
const parsePostContent = (content: string) => {
  // 同时匹配英文方括号[]和中文方括号【】
  const imagePattern = /[\[【](图片|照片|截图)[:：]([^\]】]+)[\]】]/g
  
  const hasImages = imagePattern.test(content)
  if (!hasImages) {
    return <p className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap"><EmojiContentRenderer content={content} emojiSize={32} /></p>
  }
  
  imagePattern.lastIndex = 0
  
  const elements: React.ReactNode[] = []
  const images: { type: string; desc: string }[] = []
  let lastIndex = 0
  let match
  
  while ((match = imagePattern.exec(content)) !== null) {
    // 添加图片前的文字
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text.trim()) {
        // 如果有累积的图片，先渲染图片
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
          <p key={`text-${lastIndex}`} className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap mb-2">
            {text}
          </p>
        )
      }
    }
    
    // 累积图片
    images.push({ type: match[1], desc: match[2] })
    lastIndex = match.index + match[0].length
  }
  
  // 渲染剩余的图片
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
  
  // 添加剩余的文字
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex)
    if (text.trim()) {
      elements.push(
        <p key={`text-${lastIndex}`} className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
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

  // 根据时间戳计算相对时间
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
    // 初始化NPC和帖子数据
    initForumData()
    
    // 加载角色（用于Stories）和NPC帖子
    const chars = await getAllCharacters()
    setCharacters(chars)
    
    const loadedPosts = getAllPosts()
    // 过滤掉话题帖子，话题帖子只在话题详情页显示
    const mainPosts = loadedPosts.filter(p => !(p as any).topicId)
    console.log('加载的帖子数量:', mainPosts.length, '（已过滤话题帖子）')
    setPosts(mainPosts)
  }

  const handleLike = (postId: string) => {
    const updatedPosts = toggleLike(postId)
    setPosts(updatedPosts)
  }

  // 🔥 把角色ID转换成名字
  const getCharacterName = (id: string): string => {
    const char = characters.find(c => c.id === id)
    if (char) return char.nickname || char.realName || id
    // 如果找不到角色，检查是否是NPC
    const npc = getNPCById(id)
    if (npc) return npc.name
    return id // 找不到就返回原ID
  }

  // 获取NPC的真实头像（优先从角色获取，解决头像不同步问题）
  const getRealAvatar = (npcId: string, npcAvatar: string): string => {
    // 检查是否是角色ID
    const character = characters.find(c => c.id === npcId)
    if (character?.avatar) {
      return character.avatar
    }
    // 如果NPC头像是默认的，用名字首字母生成
    if (!npcAvatar || npcAvatar === '/default-avatar.png') {
      return '/default-avatar.png'
    }
    return npcAvatar
  }

  return (
    <InstagramLayout>
      {/* Stories横向滚动区域 */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4">
            {/* 我的Story */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative w-16 h-16">
                <div className="w-full h-full rounded-full bg-white/80 backdrop-blur-sm border border-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-0.5">
                  {userInfo.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt="我"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                      我
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+</span>
                </div>
              </div>
              <span className="text-xs text-gray-700 max-w-[64px] truncate">我的</span>
            </div>
            
            {/* 角色Stories（互关的角色，过滤掉没有名字的） */}
            {characters.filter(c => c.nickname || c.realName).map((character) => (
              <div 
                key={character.id}
                className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                onClick={() => navigate(`/instagram/user/${character.id}`)}
              >
                <div className="relative w-16 h-16">
                  <div className="w-full h-full rounded-full bg-white/80 backdrop-blur-sm border border-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-0.5">
                    <img
                      src={character.avatar || '/default-avatar.png'}
                      alt={character.realName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-700 max-w-[64px] truncate">
                  {character.nickname || character.realName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="pb-4">
        {posts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-sm mb-4">没有帖子数据</p>
            <button 
              onClick={() => {
                localStorage.removeItem('forum_posts')
                localStorage.removeItem('forum_npcs')
                window.location.reload()
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg active:bg-blue-600"
            >
              重新加载数据
            </button>
          </div>
        )}
        {posts.filter(post => post.npcId).map((post) => {
          // 用户发布的帖子
          if (post.npcId === 'user') {
            return (
              <div key={post.id} className="mb-4 bg-white">
                {/* Post Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {userInfo.avatar ? (
                      <img
                        src={userInfo.avatar}
                        alt="我"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
                        我
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold">{userInfo.nickname || userInfo.realName || '我'}</div>
                      <div className="text-xs text-gray-500">{formatTimeAgo(post.timestamp)}</div>
                    </div>
                  </div>
                  <button className="p-2 -m-2 active:opacity-60">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Content - 先显示文字 */}
                {post.content && (
                  <div className="px-4 py-3">
                    <p className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
                      <EmojiContentRenderer content={post.content} emojiSize={32} />
                    </p>
                  </div>
                )}

                {/* 显示实际图片 */}
                {post.imageUrls && post.imageUrls.length > 0 ? (
                  <div className="px-4 mb-3">
                    <div className={`grid gap-1 ${post.imageUrls.length === 1 ? 'grid-cols-1' : post.imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {post.imageUrls.slice(0, 9).map((url, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img src={url} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : post.images > 0 ? (
                  // 兼容旧数据：没有实际图片时显示占位
                  <div className="px-4 mb-3">
                    <div className={`grid gap-1 ${post.images === 1 ? 'grid-cols-1' : post.images === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {Array.from({ length: Math.min(post.images, 9) }).map((_, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Post Actions */}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(post.id)} className="active:scale-110 transition-transform">
                        <Heart className={`w-5 h-5 ${post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-900'}`} />
                      </button>
                      <button className="active:opacity-60">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button className="active:opacity-60">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                    <button className="active:opacity-60">
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-base font-semibold mb-2">{post.likes.toLocaleString()} 次赞</div>
                  
                  {/* 显示标记的人 */}
                  {post.taggedUsers && post.taggedUsers.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>提到了 {post.taggedUsers.map(id => `@${getCharacterName(id)}`).join(' ')}</span>
                    </div>
                  )}
                  
                  {post.comments > 0 && (
                    <button 
                      className="text-base text-gray-500 mt-2" 
                      onClick={() => {
                        console.log('👉 准备跳转到评论页:', post.id)
                        navigate(`/instagram/post/${post.id}`)
                      }}
                    >
                      查看全部 {post.comments} 条评论
                    </button>
                  )}
                </div>
              </div>
            )
          }
          
          // NPC发布的帖子
          const npc = getNPCById(post.npcId)
          if (!npc) {
            console.log('找不到NPC:', post.npcId)
            return null
          }
          
          return (
            <div key={post.id} className="mb-3 bg-white border-b-8 border-gray-100">
              {/* Post Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/instagram/user/${npc.id}`)}
                >
                  <img
                    src={getRealAvatar(npc.id, npc.avatar)}
                    alt={npc.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-base font-semibold">{npc.name}</div>
                    <div className="text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</div>
                  </div>
                </div>
                <button className="p-2 -m-2 active:opacity-60">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

            {/* Post Content - 纯文字或图片 */}
            {post.images === 0 ? (
              // 纯文字帖子（但可能包含[图片]标记）
              <div className="px-4 py-4">
                {parsePostContent(post.content)}
              </div>
            ) : post.images === 1 ? (
              /* 单图 - 最大宽度，自适应高度 */
              <div className="px-4 mb-3">
                <div className="max-w-sm mx-auto rounded-xl overflow-hidden bg-gray-100">
                  <div className="aspect-[4/3]">
                    <div className={`w-full h-full ${
                      ['bg-gradient-to-br from-pink-200 to-purple-200',
                       'bg-gradient-to-br from-blue-200 to-cyan-200',
                       'bg-gradient-to-br from-orange-200 to-red-200',
                       'bg-gradient-to-br from-green-200 to-teal-200',
                       'bg-gradient-to-br from-purple-200 to-pink-200'][parseInt(post.id.split('-')[1]) % 5]
                    }`} />
                  </div>
                </div>
              </div>
            ) : post.images === 2 ? (
              /* 两张图 - 横向排列 */
              <div className="px-4 mb-3">
                <div className="grid grid-cols-2 gap-1">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <div className={`w-full h-full ${
                        ['bg-gradient-to-br from-pink-200 to-purple-200',
                         'bg-gradient-to-br from-blue-200 to-cyan-200'][index]
                      }`} />
                    </div>
                  ))}
                </div>
              </div>
            ) : post.images === 3 ? (
              /* 三张图 - 横向排列 */
              <div className="px-4 mb-3">
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <div className={`w-full h-full ${
                        ['bg-gradient-to-br from-pink-200 to-purple-200',
                         'bg-gradient-to-br from-blue-200 to-cyan-200',
                         'bg-gradient-to-br from-orange-200 to-red-200'][index]
                      }`} />
                    </div>
                  ))}
                </div>
              </div>
            ) : post.images === 4 ? (
              /* 四张图 - 2x2网格 */
              <div className="px-4 mb-3">
                <div className="grid grid-cols-2 gap-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <div className={`w-full h-full ${
                        ['bg-gradient-to-br from-pink-200 to-purple-200',
                         'bg-gradient-to-br from-blue-200 to-cyan-200',
                         'bg-gradient-to-br from-orange-200 to-red-200',
                         'bg-gradient-to-br from-green-200 to-teal-200'][index]
                      }`} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 5-9张图 - 3x3网格，最多显示9张 */
              <div className="px-4 mb-3">
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: Math.min(post.images, 9) }).map((_, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                      <div className={`w-full h-full ${
                        ['bg-gradient-to-br from-pink-200 to-purple-200',
                         'bg-gradient-to-br from-blue-200 to-cyan-200',
                         'bg-gradient-to-br from-orange-200 to-red-200',
                         'bg-gradient-to-br from-green-200 to-teal-200',
                         'bg-gradient-to-br from-purple-200 to-pink-200',
                         'bg-gradient-to-br from-yellow-200 to-orange-200',
                         'bg-gradient-to-br from-indigo-200 to-purple-200',
                         'bg-gradient-to-br from-teal-200 to-green-200',
                         'bg-gradient-to-br from-rose-200 to-pink-200'][index % 9]
                      }`} />
                      {/* 如果图片超过9张，在第9张显示 +N */}
                      {index === 8 && post.images > 9 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">+{post.images - 9}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="active:scale-110 transition-transform"
                  >
                    <Heart 
                      className={`w-5 h-5 ${
                        post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-900'
                      }`}
                    />
                  </button>
                  <button className="active:opacity-60">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button className="active:opacity-60">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <button className="active:opacity-60">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>

              {/* Likes */}
              <div className="text-base font-semibold mb-2">
                {post.likes.toLocaleString()} 次赞
              </div>

              {/* Caption - 只在有图片且有文字时显示 */}
              {post.images > 0 && post.content && (
                <div className="text-base">
                  <span className="font-semibold mr-2">{npc.name}</span>
                  <span className="text-gray-900"><EmojiContentRenderer content={post.content} emojiSize={24} /></span>
                </div>
              )}

              {/* 显示标记的人 */}
              {post.taggedUsers && post.taggedUsers.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>提到了 {post.taggedUsers.map(id => `@${getCharacterName(id)}`).join(' ')}</span>
                </div>
              )}

              {/* View Comments */}
              {post.comments > 0 && (
                <button 
                  className="text-base text-gray-500 mt-2"
                  onClick={() => navigate(`/instagram/post/${post.id}`)}
                >
                  查看全部 {post.comments} 条评论
                </button>
              )}
            </div>
          </div>
        )})}

        {/* 加载完成提示 */}
        <div className="py-8 text-center text-gray-400 text-sm">
          你已经看完所有内容了
        </div>
      </div>
    </InstagramLayout>
  )
}

export default InstagramHome
