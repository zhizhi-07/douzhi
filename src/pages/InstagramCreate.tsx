import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Image, Smile, MapPin, UserPlus, Music2, Search } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { getAllCharacters } from '../utils/characterManager'
import { incrementPosts } from '../utils/forumUser'
import { getAllPosts, savePosts, getAllNPCs, type ForumNPC } from '../utils/forumNPC'
import { generateRealAIComments } from '../utils/forumAIComments'
import { getPostComments } from '../utils/forumCommentsDB'
import type { Character } from '../services/characterService'

const InstagramCreate = () => {
  const navigate = useNavigate()
  const [caption, setCaption] = useState('')
  const [selectedImages, setSelectedImages] = useState<number>(0)
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [showUserTag, setShowUserTag] = useState(false)
  const [showMusicSearch, setShowMusicSearch] = useState(false)
  const [location, setLocation] = useState('')
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
        const npcs = getAllNPCs()
        
        // 用户发的帖子，只让NPC评论（不让AI角色评论自己的朋友圈）
        const npcAsCharacters = npcs.map((npc: ForumNPC) => ({
          id: npc.id,
          realName: npc.name,
          nickname: npc.name,
          signature: npc.bio,
          personality: '',
          avatar: npc.avatar,
          createdAt: new Date().toISOString()
        }))
        
        console.log(`🤖 开始生成评论... (${npcs.length}个路人NPC)`)
        await generateRealAIComments(postId, caption, npcAsCharacters)
        
        // 更新帖子评论数
        const updatedPosts = getAllPosts()
        const post = updatedPosts.find(p => p.id === postId)
        if (post) {
          const comments = await getPostComments(postId)
          post.comments = comments.length
          savePosts(updatedPosts)
          console.log(`✅ 帖子评论数已更新: ${comments.length}`)
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
        {/* 图片选择区域 */}
        <div className="aspect-square bg-gray-100 border-b border-gray-200">
          {selectedImages > 0 ? (
            <div className="relative w-full h-full">
              {/* 模拟已选择的图片 */}
              <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">已选择 {selectedImages} 张图片</p>
                </div>
              </div>
              
              {/* 多选指示器 */}
              <div className="absolute bottom-4 right-4 flex gap-1">
                {Array.from({ length: Math.min(selectedImages, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i === 0 ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={handleSelectImage}
              className="w-full h-full flex flex-col items-center justify-center gap-4 active:bg-gray-200 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <Image className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">点击选择照片</p>
            </button>
          )}
        </div>

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
            <button className="text-gray-400 active:opacity-60">
              <Smile className="w-5 h-5" />
            </button>
            <div className="text-xs text-gray-400">
              {caption.length}/2,200
            </div>
          </div>
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
              {characters.filter(c => 
                c.realName.includes(userSearch) || c.nickname?.includes(userSearch)
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
                    alt={char.realName}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold">{char.nickname || char.realName}</div>
                    <div className="text-xs text-gray-500">{char.realName}</div>
                  </div>
                  {taggedUsers.find(u => u.id === char.id) && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
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
