import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Image, Smile, MapPin, UserPlus, Music2, Search } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { getAllCharacters } from '../utils/characterManager'
import { incrementPosts, incrementFollowers } from '../utils/forumUser'
import { getAllPosts, savePosts, getAllNPCs, saveNPCs } from '../utils/forumNPC'
import { generateRealAIComments } from '../utils/forumAIComments'
import { getPostComments } from '../utils/forumCommentsDB'
import { sendDMToUser } from '../utils/instagramDM'
import { getInstagramSettings } from './InstagramSettings'
import { getEmojis, type Emoji } from '../utils/emojiStorage'
import type { Character } from '../services/characterService'

const InstagramCreate = () => {
  const navigate = useNavigate()
  const [caption, setCaption] = useState('')
  const [selectedImages, setSelectedImages] = useState<number>(0)
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
  const [music, setMusic] = useState<{name: string, artist: string} | null>(null)
  const [musicSearch, setMusicSearch] = useState('')
  const [characters, setCharacters] = useState<Character[]>([])

  const handleSelectImage = () => {
    // 模拟选择图片
    setSelectedImages(prev => prev + 1)
  }

  const loadCharacters = async () => {
    const chars = await getAllCharacters()
    setCharacters(chars)
  }

  const handlePost = async () => {
    // 必须至少有文字或图片其一
    if (selectedImages === 0 && !caption.trim()) {
      alert('请输入文字或选择图片')
      return
    }

    // 创建用户帖子
    const posts = getAllPosts()
    const postId = `user-post-${Date.now()}`
    const newPost = {
      id: postId,
      npcId: 'user', // 标记为用户发布
      content: caption,
      images: selectedImages,
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
    savePosts(posts)
    
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
        
        const userPosts = getAllPosts()
          .filter(p => p.npcId === 'user')
          .slice(0, 10)
          .map(p => `[${formatTimeAgo(p.timestamp)}] ${p.content}`)
        
        // 传入所有角色（包括公众人物），让AI能识别并让公众人物参与评论
        const allCharacters = await getAllCharacters()
        console.log(`🤖 开始生成评论... (角色数: ${allCharacters.length})`)
        const result = await generateRealAIComments(postId, caption, allCharacters, userPosts)
        
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
        const updatedPosts = getAllPosts()
        const post = updatedPosts.find(p => p.id === postId)
        if (post) {
          const comments = await getPostComments(postId)
          post.comments = comments.length
          
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
          
          savePosts(updatedPosts)
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
                const currentPosts = getAllPosts()
                // 插入到用户帖子后面
                const userPostIndex = currentPosts.findIndex(p => p.id === postId)
                if (userPostIndex >= 0) {
                  currentPosts.splice(userPostIndex + 1, 0, roastPost)
                } else {
                  currentPosts.unshift(roastPost)
                }
                savePosts(currentPosts)
                console.log(`🔥 [挂人帖] ${roast.npcName} 发了帖子: "${roast.content}"`)
                
                // 挂人帖子也生成评论（延迟）
                setTimeout(async () => {
                  const chars = await getAllCharacters()
                  await generateRealAIComments(roastPostId, roast.content, chars, [])
                  const latestPosts = getAllPosts()
                  const roastP = latestPosts.find(p => p.id === roastPostId)
                  if (roastP) {
                    const roastComments = await getPostComments(roastPostId)
                    roastP.comments = roastComments.length
                    roastP.likes = Math.floor(roastComments.length * (2 + Math.random() * 3))
                    savePosts(latestPosts)
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
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -m-2 active:opacity-60"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-base font-semibold">新帖子</h1>
          <button 
            onClick={handlePost}
            className="text-blue-500 font-semibold text-sm active:opacity-60"
          >
            分享
          </button>
        </div>
      </div>

      <div className="pb-4">
        {/* 说明文字 */}
        <div className="p-4 border-b border-gray-100">
          <textarea
            placeholder="添加说明..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full outline-none resize-none text-sm"
            rows={4}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSelectImage}
                className="flex items-center gap-1 text-xs text-gray-500 active:opacity-60"
              >
                <Image className="w-4 h-4" />
                {selectedImages > 0 && <span>{selectedImages}</span>}
              </button>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`active:opacity-60 ${showEmojiPicker ? 'text-blue-500' : 'text-gray-400'}`}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-gray-400">
              {caption.length}/2,200
            </div>
          </div>
          
          {/* 表情包选择面板 */}
          {showEmojiPicker && emojis.length > 0 && (
            <div className="mt-3 p-2 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
              <div className="grid grid-cols-6 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji.id}
                    onClick={() => {
                      setCaption(prev => prev + `[表情:${emoji.description}]`)
                      setShowEmojiPicker(false)
                    }}
                    className="p-1 hover:bg-gray-200 rounded active:scale-95 transition-transform"
                  >
                    <img 
                      src={emoji.url} 
                      alt={emoji.description}
                      className="w-10 h-10 object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {showEmojiPicker && emojis.length === 0 && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-400">
              还没有表情包，去聊天页面添加吧
            </div>
          )}
        </div>

        {/* 添加位置 */}
        <button 
          onClick={() => setShowLocationSearch(true)}
          className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100 active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-600" />
            <span className="text-sm">{location || '添加位置'}</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 标记用户 */}
        <button 
          onClick={() => {
            loadCharacters()
            setShowUserTag(true)
          }}
          className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100 active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-gray-600" />
            <span className="text-sm">
              {taggedUsers.length > 0 ? `已标记 ${taggedUsers.length} 人` : '标记用户'}
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 添加音乐 */}
        <button 
          onClick={() => setShowMusicSearch(true)}
          className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Music2 className="w-5 h-5 text-gray-600" />
            <span className="text-sm">
              {music ? `${music.name} - ${music.artist}` : '添加音乐'}
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 位置搜索模态框 */}
      {showLocationSearch && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button onClick={() => setShowLocationSearch(false)}>
                <X className="w-6 h-6" />
              </button>
              <input
                type="text"
                placeholder="搜索位置..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="flex-1 outline-none"
                autoFocus
              />
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
                  className="w-full px-4 py-3 text-left border-b border-gray-100 active:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{loc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 标记用户模态框 */}
      {showUserTag && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button onClick={() => setShowUserTag(false)}>
                <X className="w-6 h-6" />
              </button>
              <input
                type="text"
                placeholder="搜索用户..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-1 outline-none"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {characters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <UserPlus className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">还没有创建角色</p>
                  <p className="text-xs mt-1">创建角色后可以在这里@他们</p>
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
                    className="w-full px-4 py-3 flex items-center gap-3 border-b border-gray-100 active:bg-gray-50"
                  >
                    <img
                      src={char.avatar || '/default-avatar.png'}
                      alt={char.realName || char.nickname || '角色'}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold">{char.nickname || char.realName}</div>
                      {char.realName && char.nickname && (
                        <div className="text-xs text-gray-500">{char.realName}</div>
                      )}
                    </div>
                    {taggedUsers.find(u => u.id === char.id) && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 音乐搜索模态框 */}
      {showMusicSearch && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button onClick={() => setShowMusicSearch(false)}>
                <X className="w-6 h-6" />
              </button>
              <input
                type="text"
                placeholder="搜索音乐..."
                value={musicSearch}
                onChange={(e) => setMusicSearch(e.target.value)}
                className="flex-1 outline-none"
                autoFocus
              />
              <Search className="w-5 h-5 text-gray-400" />
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
                  className="w-full px-4 py-3 flex items-center gap-3 border-b border-gray-100 active:bg-gray-50"
                >
                  <Music2 className="w-10 h-10 text-gray-400" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold">{m.name}</div>
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
