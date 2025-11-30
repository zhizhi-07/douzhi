import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Image as ImageIcon, Smile, MapPin, UserPlus, Music2, Search, ChevronRight, Plus } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { getAllCharacters } from '../utils/characterManager'
import { incrementPosts, incrementFollowers } from '../utils/forumUser'
import { getAllPosts, getAllPostsAsync, savePosts, getAllNPCs, saveNPCs } from '../utils/forumNPC'
import { generateRealAIComments } from '../utils/forumAIComments'
import { getPostComments } from '../utils/forumCommentsDB'
import { sendDMToUser } from '../utils/instagramDM'
import { getInstagramSettings } from './InstagramSettings'
import { getEmojis, type Emoji } from '../utils/emojiStorage'
import type { Character } from '../services/characterService'

const InstagramCreate = () => {
  const navigate = useNavigate()
  const [caption, setCaption] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [showUserTag, setShowUserTag] = useState(false)
  const [showMusicSearch, setShowMusicSearch] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojis, setEmojis] = useState<Emoji[]>([])
  const [location, setLocation] = useState('')

  // 加载表情包
  useEffect(() => {
    getEmojis().then(setEmojis).catch(console.error)
  }, [])
  const [locationSearch, setLocationSearch] = useState('')
  const [taggedUsers, setTaggedUsers] = useState<Character[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [music, setMusic] = useState<{ name: string, artist: string } | null>(null)
  const [musicSearch, setMusicSearch] = useState('')
  const [characters, setCharacters] = useState<Character[]>([])

  const handleSelectImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setSelectedImages(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })

    // 清空input以便可以重复选择同一张图片
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const loadCharacters = async () => {
    const chars = await getAllCharacters()
    setCharacters(chars)
  }

  const handlePost = async () => {
    // 必须至少有文字或图片其一
    if (selectedImages.length === 0 && !caption.trim()) {
      alert('请输入文字或选择图片')
      return
    }

    // 创建用户帖子
    const posts = await getAllPostsAsync()
    const postId = `user-post-${Date.now()}`
    const newPost = {
      id: postId,
      npcId: 'user', // 标记为用户发布
      content: caption,
      images: selectedImages.length, // 图片数量
      imageUrls: selectedImages.length > 0 ? selectedImages : undefined, // 实际图片
      likes: 0,
      comments: 0,
      time: '刚刚',
      timestamp: Date.now(),
      isLiked: false,
      location: location || undefined,
      taggedUsers: taggedUsers.map(u => u.id),
      music: music || undefined
    }

    posts.unshift(newPost)
    await savePosts(posts)

    // 更新用户统计
    incrementPosts()

    // 立即跳转回主页
    navigate('/instagram')

    // 异步生成评论（真实调用API）
    setTimeout(async () => {
      try {
        // 获取用户历史帖子，让AI可以引用（带时间）
        const formatTimeAgo = (timestamp: number): string => {
          const now = Date.now()
          const diff = now - timestamp
          const minutes = Math.floor(diff / 60000)
          const hours = Math.floor(diff / 3600000)
          const days = Math.floor(diff / 86400000)
          if (minutes < 1) return '刚刚'
          if (minutes < 60) return `${minutes}分钟前`
          if (hours < 24) return `${hours}小时前`
          if (days < 7) return `${days}天前`
          return `${Math.floor(days / 7)}周前`
        }

        const userPosts = (await getAllPostsAsync())
          .filter(p => p.npcId === 'user')
          .slice(0, 10)
          .map(p => `[${formatTimeAgo(p.timestamp)}] ${p.content}`)

        // 传入所有角色（包括公众人物），让AI能识别并让公众人物参与评论
        const allCharacters = await getAllCharacters()
        console.log(`🤖 开始生成评论... (角色数: ${allCharacters.length}, 图片数: ${selectedImages.length})`)
        // 🔥 传入图片，让AI能看到图片内容
        // 如果没有文字只有图片，给AI一个提示
        const contentForAI = caption.trim() || (selectedImages.length > 0 ? '[用户发布了图片]' : '')
        const result = await generateRealAIComments(postId, contentForAI, allCharacters, userPosts, undefined, selectedImages.length > 0 ? selectedImages : undefined)

        // 🧠 为每个参与评论的AI角色增加记忆计数
        const allComments = await getPostComments(postId)
        const commentersSet = new Set<string>()
        allComments.forEach(c => {
          if (c.authorId && c.authorId !== 'user') {
            commentersSet.add(c.authorId)
          }
        })

        import('../services/memoryExtractor').then(({ recordInteraction }) => {
          commentersSet.forEach(commenterId => {
            const char = allCharacters.find(c => c.id === commenterId)
            if (char) {
              recordInteraction(char.id, char.realName)
            }
          })
        })

        // 更新帖子评论数和点赞
        const updatedPosts = await getAllPostsAsync()
        const post = updatedPosts.find(p => p.id === postId)
        if (post) {
          const comments = await getPostComments(postId)
          // 🔥 计算总评论数：主楼 + 所有楼中楼
          const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)
          post.comments = totalComments

          // 检查是否有公众人物参与评论或被@
          const hasPublicFigureComment = comments.some(c => c.isPublicFigure)
          const hasPublicFigureTagged = (post.taggedUsers || []).some(userId => {
            const char = allCharacters.find(c => c.id === userId)
            return char?.isPublicFigure
          })
          const hasPublicFigureInvolved = hasPublicFigureComment || hasPublicFigureTagged

          // 点赞数：有公众人物参与则大幅增加
          let likesCount: number
          if (hasPublicFigureInvolved) {
            // 有公众人物参与：几千到几万点赞
            likesCount = Math.floor(Math.random() * 50000) + 5000
          } else {
            // 普通帖子：评论数的10-30倍
            likesCount = Math.floor(comments.length * (10 + Math.random() * 20)) + 50
          }
          post.likes = likesCount

          await savePosts(updatedPosts)
          console.log(`✅ 帖子评论数已更新: ${comments.length}，点赞数: ${likesCount}`)

          // 发帖后增加粉丝：1-5个
          const newFollowers = Math.floor(Math.random() * 5) + 1
          incrementFollowers(newFollowers)

          // 使用AI生成的私聊
          if (result.dmList && result.dmList.length > 0) {
            result.dmList.forEach((dm, index) => {
              // 延迟发送私聊
              setTimeout(() => {
                sendDMToUser(dm.npcId, dm.npcName, undefined, dm.content)
              }, 3000 + index * 2000)
            })
          }

          // 创建挂人帖子（NPC发的帖子）- 根据设置决定是否启用
          const instagramSettings = getInstagramSettings()
          if (instagramSettings.allowRoastPost && result.roastPosts && result.roastPosts.length > 0) {
            result.roastPosts.forEach((roast, index) => {
              setTimeout(async () => {
                // 先创建NPC记录（如果不存在）
                const existingNPCs = getAllNPCs()
                if (!existingNPCs.find(n => n.id === roast.npcId)) {
                  const newNPC = {
                    id: roast.npcId,
                    name: roast.npcName,
                    avatar: '/default-avatar.png',
                    bio: '论坛活跃用户',
                    followers: Math.floor(Math.random() * 500) + 100
                  }
                  existingNPCs.push(newNPC)
                  saveNPCs(existingNPCs)
                  console.log(`✨ 创建挂人帖NPC: ${roast.npcName}`)
                }

                const roastPostId = `roast-${Date.now()}-${index}`

                // 检查发帖人是否是公众人物
                const chars = await getAllCharacters()
                const posterChar = chars.find(c => c.id === roast.npcId)
                const roastLikes = posterChar?.isPublicFigure
                  ? Math.floor(Math.random() * 50000) + 10000  // 公众人物：1万-6万
                  : Math.floor(Math.random() * 50) + 10        // 普通NPC：10-60

                const roastPost = {
                  id: roastPostId,
                  npcId: roast.npcId,
                  content: roast.content,
                  images: 0,
                  likes: roastLikes,
                  comments: 0,
                  time: '刚刚',
                  timestamp: Date.now(),
                  isLiked: false
                }
                const currentPosts = await getAllPostsAsync()
                // 插入到用户帖子后面
                const userPostIndex = currentPosts.findIndex(p => p.id === postId)
                if (userPostIndex >= 0) {
                  currentPosts.splice(userPostIndex + 1, 0, roastPost)
                } else {
                  currentPosts.unshift(roastPost)
                }
                await savePosts(currentPosts)
                console.log(`🔥 [挂人帖] ${roast.npcName} 发了帖子: "${roast.content}"`)

                // 挂人帖子也生成评论（延迟）
                setTimeout(async () => {
                  const chars = await getAllCharacters()
                  await generateRealAIComments(roastPostId, roast.content, chars, [])
                  const latestPosts = await getAllPostsAsync()
                  const roastP = latestPosts.find(p => p.id === roastPostId)
                  if (roastP) {
                    const roastComments = await getPostComments(roastPostId)
                    roastP.comments = roastComments.length
                    roastP.likes = Math.floor(roastComments.length * (2 + Math.random() * 3))
                    await savePosts(latestPosts)
                  }
                }, 5000)
              }, 5000 + index * 3000)
            })
          }
        }
      } catch (error) {
        console.error('❌ AI评论生成失败:', error)
      }
    }, 2000)
  }

  return (
    <InstagramLayout showHeader={false} showTabBar={false}>
      {/* 顶部导航 - 极简白底 */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -m-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-[17px] font-bold text-gray-900">新帖子</h1>
          <button
            onClick={handlePost}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
          >
            发布
          </button>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto pb-10">
        {/* 隐藏的文件输入 */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        <div className="p-4 space-y-6">
          {/* 图片选择区 - 优化网格布局 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">照片</h2>
              <button
                onClick={handleSelectImage}
                className="text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                选择照片
              </button>
            </div>

            {selectedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={img}
                      alt={`图片${index + 1}`}
                      className="w-full h-full object-cover rounded-xl border border-gray-100 shadow-sm"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleSelectImage}
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-500"
                >
                  <Plus className="w-8 h-8 mb-1" />
                  <span className="text-xs font-medium">添加</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSelectImage}
                className="w-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-500"
              >
                <ImageIcon className="w-10 h-10 mb-2" />
                <span className="text-sm font-medium">点击选择照片</span>
              </button>
            )}
          </div>

          {/* 内容输入区 - 优化排版 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">正文</h2>
              <span className="text-xs text-gray-400">{caption.length}/2,200</span>
            </div>
            <div className="relative">
              <textarea
                placeholder="分享你的想法..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full min-h-[120px] p-4 bg-gray-50 rounded-xl outline-none resize-none text-[15px] text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-yellow-500 hover:bg-gray-200/50 rounded-full transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            {/* 表情包选择面板 */}
            {showEmojiPicker && emojis.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji.id}
                      onClick={() => {
                        setCaption(prev => prev + `[表情:${emoji.description}]`)
                        setShowEmojiPicker(false)
                      }}
                      className="aspect-square p-1 hover:bg-white rounded-lg active:scale-95 transition-all"
                    >
                      <img
                        src={emoji.url}
                        alt={emoji.description}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 选项列表 - 现代化列表设计 */}
          <div className="bg-gray-50 rounded-xl overflow-hidden divide-y divide-gray-100 border border-gray-100">
            <button
              onClick={() => setShowLocationSearch(true)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[15px] font-medium text-gray-900">添加位置</span>
                  {location && <span className="text-xs text-blue-600">{location}</span>}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => {
                loadCharacters()
                setShowUserTag(true)
              }}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[15px] font-medium text-gray-900">标记用户</span>
                  {taggedUsers.length > 0 && (
                    <span className="text-xs text-blue-600">已标记 {taggedUsers.length} 人</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => setShowMusicSearch(true)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Music2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[15px] font-medium text-gray-900">添加音乐</span>
                  {music && <span className="text-xs text-blue-600">{music.name} - {music.artist}</span>}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 位置搜索模态框 - 优化样式 */}
      {showLocationSearch && (
        <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-bottom-10 duration-200">
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button onClick={() => setShowLocationSearch(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索位置..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {['北京市朝阳区', '上海市浦东新区', '广州市天河区', '深圳市南山区', '杭州市西湖区'].filter(loc =>
                loc.includes(locationSearch)
              ).map((loc, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setLocation(loc)
                    setShowLocationSearch(false)
                  }}
                  className="w-full px-4 py-4 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-[15px] text-gray-900">{loc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 标记用户模态框 - 优化样式 */}
      {showUserTag && (
        <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-bottom-10 duration-200">
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button onClick={() => setShowUserTag(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索用户..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {characters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <UserPlus className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">还没有创建角色</p>
                </div>
              ) : (
                characters.filter(c =>
                  (c.realName || '').includes(userSearch) || (c.nickname || '').includes(userSearch)
                ).map((char) => (
                  <button
                    key={char.id}
                    onClick={() => {
                      if (taggedUsers.find(u => u.id === char.id)) {
                        setTaggedUsers(taggedUsers.filter(u => u.id !== char.id))
                      } else {
                        setTaggedUsers([...taggedUsers, char])
                      }
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={char.avatar || '/default-avatar.png'}
                      alt={char.realName || char.nickname || '角色'}
                      className="w-12 h-12 rounded-full object-cover border border-gray-100"
                    />
                    <div className="flex-1 text-left">
                      <div className="text-[15px] font-semibold text-gray-900">{char.nickname || char.realName}</div>
                      {char.realName && char.nickname && (
                        <div className="text-xs text-gray-500">{char.realName}</div>
                      )}
                    </div>
                    {taggedUsers.find(u => u.id === char.id) ? (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 音乐搜索模态框 - 优化样式 */}
      {showMusicSearch && (
        <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-bottom-10 duration-200">
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button onClick={() => setShowMusicSearch(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索音乐..."
                  value={musicSearch}
                  onChange={(e) => setMusicSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {[
                { name: '晴天', artist: '周杰伦' },
                { name: '七里香', artist: '周杰伦' },
                { name: '稻香', artist: '周杰伦' },
                { name: '告白气球', artist: '周杰伦' },
                { name: '夜曲', artist: '周杰伦' }
              ].filter(m =>
                m.name.includes(musicSearch) || m.artist.includes(musicSearch)
              ).map((m, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMusic(m)
                    setShowMusicSearch(false)
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                    <Music2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[15px] font-semibold text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.artist}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </InstagramLayout>
  )
}

export default InstagramCreate
