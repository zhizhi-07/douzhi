import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { getAllPosts, toggleLike, getNPCById, initForumData } from '../utils/forumNPC'
import { getAllCharacters } from '../utils/characterManager'
import type { ForumPost } from '../utils/forumNPC'
import type { Character } from '../services/characterService'

const InstagramHome = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])

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
    console.log('加载的帖子数量:', loadedPosts.length)
    console.log('帖子数据:', loadedPosts)
    setPosts(loadedPosts)
  }

  const handleLike = (postId: string) => {
    const updatedPosts = toggleLike(postId)
    setPosts(updatedPosts)
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
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl">+</span>
                </div>
              </div>
              <span className="text-xs text-gray-700 max-w-[64px] truncate">我的</span>
            </div>
            
            {/* 角色Stories（互关的角色） */}
            {characters.map((character) => (
              <div 
                key={character.id}
                className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                onClick={() => navigate(`/chat/${character.id}`)}
              >
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-orange-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-white p-0.5">
                      <img
                        src={character.avatar || '/default-avatar.png'}
                        alt={character.realName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
                      我
                    </div>
                    <div>
                      <div className="text-sm font-semibold">我</div>
                      <div className="text-xs text-gray-500">{post.time}</div>
                    </div>
                  </div>
                  <button className="p-2 -m-2 active:opacity-60">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Content - 纯文字或图片 */}
                {post.images === 0 ? (
                  // 纯文字帖子
                  <div className="px-4 py-6">
                    <p className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                ) : post.images === 1 ? (
                  <div className="px-4 mb-3">
                    <div className="max-w-sm mx-auto rounded-xl overflow-hidden bg-gray-100">
                      <div className="aspect-[4/3]">
                        <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200" />
                      </div>
                    </div>
                  </div>
                ) : post.images === 2 ? (
                  <div className="px-4 mb-3">
                    <div className="grid grid-cols-2 gap-1">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : post.images >= 3 ? (
                  <div className="px-4 mb-3">
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: Math.min(post.images, 9) }).map((_, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
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
                        <Heart className={`w-6 h-6 ${post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-900'}`} />
                      </button>
                      <button className="active:opacity-60">
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <button className="active:opacity-60">
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                    <button className="active:opacity-60">
                      <Bookmark className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="text-sm font-semibold mb-2">{post.likes.toLocaleString()} 次赞</div>
                  <div className="text-sm">
                    <span className="font-semibold mr-2">我</span>
                    <span className="text-gray-900">{post.content}</span>
                  </div>

                  {post.comments > 0 && (
                    <button className="text-sm text-gray-500 mt-2" onClick={() => console.log('查看评论', post.id)}>
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
            <div key={post.id} className="mb-4 bg-white">
              {/* Post Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/instagram/user/${npc.id}`)}
                >
                  <img
                    src={npc.avatar}
                    alt={npc.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold">{npc.name}</div>
                    <div className="text-xs text-gray-500">{post.time}</div>
                  </div>
                </div>
                <button className="p-2 -m-2 active:opacity-60">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

            {/* Post Content - 纯文字或图片 */}
            {post.images === 0 ? (
              // 纯文字帖子
              <div className="px-4 py-6">
                <p className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
                  {post.content}
                </p>
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
                      className={`w-6 h-6 ${
                        post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-900'
                      }`}
                    />
                  </button>
                  <button className="active:opacity-60">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button className="active:opacity-60">
                    <Send className="w-6 h-6" />
                  </button>
                </div>
                <button className="active:opacity-60">
                  <Bookmark className="w-6 h-6" />
                </button>
              </div>

              {/* Likes */}
              <div className="text-sm font-semibold mb-2">
                {post.likes.toLocaleString()} 次赞
              </div>

              {/* Caption - 只在有图片且有文字时显示 */}
              {post.images > 0 && post.content && (
                <div className="text-sm">
                  <span className="font-semibold mr-2">{npc.name}</span>
                  <span className="text-gray-900">{post.content}</span>
                </div>
              )}

              {/* View Comments */}
              {post.comments > 0 && (
                <button 
                  className="text-sm text-gray-500 mt-2"
                  onClick={() => {
                    // TODO: 打开评论页面
                    console.log('查看评论', post.id)
                  }}
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
