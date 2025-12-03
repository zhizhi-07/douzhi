import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Image as ImageIcon, Smile, MapPin, UserPlus, Music2, Search, ChevronRight, Plus } from 'lucide-react'
import StatusBar from '../components/StatusBar'
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
      <div className="min-h-screen bg-transparent font-serif text-[#2C2C2C]">
        {/* 顶部导航 - 玻璃拟态（包含状态栏） */}
        <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
          <StatusBar />
          <div className="flex items-center justify-between px-5 pb-4 relative">
            <button
              onClick={() => navigate(-1)}
              className="text-[#5A5A5A] hover:text-[#2C2C2C] transition-colors p-2"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
            <h1 className="text-lg font-medium tracking-[0.2em] text-[#2C2C2C] absolute left-1/2 -translate-x-1/2">发帖</h1>
            <button
              onClick={handlePost}
              className="text-[#2C2C2C] text-xs font-medium tracking-widest uppercase hover:opacity-70 transition-opacity"
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

          <div className="p-5 space-y-8">
            {/* 图片选择区 - 玻璃卡片 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] text-[#8C8C8C]">图片</h2>
                <button
                  onClick={handleSelectImage}
                  className="text-[10px] text-[#2C2C2C] tracking-widest uppercase hover:opacity-70"
                >
                  选择
                </button>
              </div>

              {selectedImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {selectedImages.map((img, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img
                        src={img}
                        alt={`图片${index + 1}`}
                        className="w-full h-full object-cover border border-white/40 rounded-sm shadow-sm"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-[#2C2C2C]/80 hover:bg-black rounded-full flex items-center justify-center backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3 text-[white]" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleSelectImage}
                    className="aspect-square flex flex-col items-center justify-center border border-dashed border-white/40 bg-white/20 hover:bg-white/30 transition-colors group rounded-sm backdrop-blur-sm"
                  >
                    <Plus className="w-6 h-6 text-[#D4D4D4] group-hover:text-[#8C8C8C] stroke-[1.5]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSelectImage}
                  className="w-full h-48 flex flex-col items-center justify-center border border-dashed border-white/40 bg-white/20 hover:bg-white/30 transition-colors group rounded-sm backdrop-blur-sm"
                >
                  <ImageIcon className="w-8 h-8 mb-3 text-[#D4D4D4] group-hover:text-[#8C8C8C] stroke-[1.5]" />
                  <span className="text-[10px] text-[#8C8C8C]">选择图片</span>
                </button>
              )}
            </div>

            {/* 内容输入区 - 玻璃输入框 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] text-[#8C8C8C]">正文</h2>
                <span className="text-[10px] text-[#D4D4D4] font-sans">{caption.length}/2,200</span>
              </div>
              <div className="relative">
                <textarea
                  placeholder="写点什么..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full min-h-[160px] p-4 bg-white/60 backdrop-blur-sm border border-white/40 outline-none resize-none text-sm text-[#2C2C2C] placeholder-[#C0C0C0] font-serif tracking-wide leading-relaxed focus:border-white/60 focus:bg-white/70 transition-colors rounded-sm shadow-sm"
                />
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute bottom-3 right-3 p-2 text-[#D4D4D4] hover:text-[#5A5A5A] transition-colors"
                >
                  <Smile className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              {/* 表情包选择面板 - 玻璃拟态 */}
              {showEmojiPicker && emojis.length > 0 && (
                <div className="p-3 bg-white/80 backdrop-blur-xl border border-white/40 animate-in fade-in slide-in-from-top-2 duration-200 rounded-sm shadow-lg">
                  <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji.id}
                        onClick={() => {
                          setCaption(prev => prev + `[表情:${emoji.description}]`)
                          setShowEmojiPicker(false)
                        }}
                        className="aspect-square p-1 hover:bg-white/50 active:scale-95 transition-all rounded-sm"
                      >
                        <img
                          src={emoji.url}
                          alt={emoji.description}
                          className="w-full h-full object-contain grayscale-[20%] hover:grayscale-0"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 选项列表 - 玻璃线条 */}
            <div className="border-t border-white/30">
              <button
                onClick={() => setShowLocationSearch(true)}
                className="w-full py-4 flex items-center justify-between border-b border-white/30 group hover:bg-white/10 transition-colors px-2"
              >
                <div className="flex items-center gap-4">
                  <MapPin className="w-4 h-4 text-[#8C8C8C] stroke-[1.5]" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-[#2C2C2C] group-hover:opacity-70 transition-opacity">添加位置</span>
                    {location && <span className="text-[10px] text-[#8C8C8C] mt-0.5 font-sans">{location}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#D4D4D4] stroke-[1.5]" />
              </button>

              <button
                onClick={() => {
                  loadCharacters()
                  setShowUserTag(true)
                }}
                className="w-full py-4 flex items-center justify-between border-b border-white/30 group hover:bg-white/10 transition-colors px-2"
              >
                <div className="flex items-center gap-4">
                  <UserPlus className="w-4 h-4 text-[#8C8C8C] stroke-[1.5]" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-[#2C2C2C] group-hover:opacity-70 transition-opacity">标记好友</span>
                    {taggedUsers.length > 0 && (
                      <span className="text-[10px] text-[#8C8C8C] mt-0.5 font-sans">已标记 {taggedUsers.length} 人</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#D4D4D4] stroke-[1.5]" />
              </button>

              <button
                onClick={() => setShowMusicSearch(true)}
                className="w-full py-4 flex items-center justify-between border-b border-white/30 group hover:bg-white/10 transition-colors px-2"
              >
                <div className="flex items-center gap-4">
                  <Music2 className="w-4 h-4 text-[#8C8C8C] stroke-[1.5]" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-[#2C2C2C] group-hover:opacity-70 transition-opacity">添加音乐</span>
                    {music && <span className="text-[10px] text-[#8C8C8C] mt-0.5 font-sans">{music.name} - {music.artist}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#D4D4D4] stroke-[1.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* 位置搜索模态框 - 玻璃拟态 */}
        {showLocationSearch && (
          <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl animate-in slide-in-from-bottom-10 duration-200 font-serif">
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-4 px-5 py-4 border-b border-white/40">
                <button onClick={() => setShowLocationSearch(false)} className="text-[#5A5A5A] hover:text-[#2C2C2C]">
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
                <div className="flex-1 bg-white/50 border border-white/40 rounded-sm px-4 py-2 flex items-center gap-2 backdrop-blur-sm">
                  <Search className="w-4 h-4 text-[#D4D4D4]" />
                  <input
                    type="text"
                    placeholder="搜索位置..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-[#2C2C2C] placeholder-[#C0C0C0] font-serif tracking-wide"
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
                    className="w-full px-5 py-4 text-left border-b border-white/30 hover:bg-white/40 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <MapPin className="w-4 h-4 text-[#D4D4D4] group-hover:text-[#8C8C8C] stroke-[1.5]" />
                      <span className="text-sm text-[#5A5A5A] group-hover:text-[#2C2C2C] tracking-wide">{loc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 标记用户模态框 - 玻璃拟态 */}
        {showUserTag && (
          <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl animate-in slide-in-from-bottom-10 duration-200 font-serif">
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-4 px-5 py-4 border-b border-white/40">
                <button onClick={() => setShowUserTag(false)} className="text-[#5A5A5A] hover:text-[#2C2C2C]">
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
                <div className="flex-1 bg-white/50 border border-white/40 rounded-sm px-4 py-2 flex items-center gap-2 backdrop-blur-sm">
                  <Search className="w-4 h-4 text-[#D4D4D4]" />
                  <input
                    type="text"
                    placeholder="搜索用户..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-[#2C2C2C] placeholder-[#C0C0C0] font-serif tracking-wide"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {characters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#8C8C8C]">
                    <UserPlus className="w-8 h-8 mb-3 opacity-30 stroke-[1.5]" />
                    <p className="text-xs">还没有角色</p>
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
                      className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/40 transition-colors border-b border-white/30 group"
                    >
                      <img
                        src={char.avatar || '/default-avatar.png'}
                        alt={char.realName || char.nickname || '角色'}
                        className="w-10 h-10 rounded-full object-cover border border-white/40"
                      />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-[#2C2C2C] tracking-wide">{char.nickname || char.realName}</div>
                        {char.realName && char.nickname && (
                          <div className="text-[10px] text-[#8C8C8C] tracking-wider font-sans">{char.realName}</div>
                        )}
                      </div>
                      {taggedUsers.find(u => u.id === char.id) ? (
                        <div className="w-5 h-5 rounded-full bg-[#2C2C2C] text-[white] flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-white/40 bg-white/20"></div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 音乐搜索模态框 - 玻璃拟态 */}
        {showMusicSearch && (
          <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl animate-in slide-in-from-bottom-10 duration-200 font-serif">
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-4 px-5 py-4 border-b border-white/40">
                <button onClick={() => setShowMusicSearch(false)} className="text-[#5A5A5A] hover:text-[#2C2C2C]">
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
                <div className="flex-1 bg-white/50 border border-white/40 rounded-sm px-4 py-2 flex items-center gap-2 backdrop-blur-sm">
                  <Search className="w-4 h-4 text-[#D4D4D4]" />
                  <input
                    type="text"
                    placeholder="搜索音乐..."
                    value={musicSearch}
                    onChange={(e) => setMusicSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-[#2C2C2C] placeholder-[#C0C0C0] font-serif tracking-wide"
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
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/40 transition-colors border-b border-white/30 group"
                  >
                    <div className="w-10 h-10 rounded-sm bg-white/40 border border-white/40 flex items-center justify-center text-[#D4D4D4] group-hover:border-[#8C8C8C] transition-colors backdrop-blur-sm">
                      <Music2 className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-[#2C2C2C] tracking-wide">{m.name}</div>
                      <div className="text-[10px] text-[#8C8C8C] tracking-wider font-sans">{m.artist}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </InstagramLayout>
  )
}

export default InstagramCreate
