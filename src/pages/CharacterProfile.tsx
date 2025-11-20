import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, MoreHorizontal, Grid3x3, Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import ForumLayout from '../components/ForumLayout'
import { getAllCharacters } from '../utils/characterManager'
import type { Character } from '../services/characterService'

// 模拟角色动态数据
interface CharacterMoment {
  id: string
  characterId: string
  images: string[]
  content: string
  likes: number
  comments: number
  time: string
  isLiked?: boolean
}

const CharacterProfile = () => {
  const { characterId } = useParams()
  const navigate = useNavigate()
  const [character, setCharacter] = useState<Character | null>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts')
  const [isFollowing, setIsFollowing] = useState(false)
  const [moments, setMoments] = useState<CharacterMoment[]>([])
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  })

  useEffect(() => {
    loadCharacter()
    loadMoments()
    loadStats()
  }, [characterId])

  const loadCharacter = async () => {
    const characters = await getAllCharacters()
    const found = characters.find(c => c.id === characterId)
    if (found) {
      setCharacter(found)
    }
  }

  const loadMoments = () => {
    // 模拟加载角色的动态
    const mockMoments: CharacterMoment[] = [
      {
        id: '1',
        characterId: characterId || '',
        images: ['1'],
        content: '今天的天气真好呀~ 出去散步遇到了一只可爱的小猫咪 🐱',
        likes: 128,
        comments: 23,
        time: '2小时前',
        isLiked: false
      },
      {
        id: '2',
        characterId: characterId || '',
        images: ['2', '3', '4'],
        content: '尝试了新的咖啡店，拿铁的味道很不错！推荐给大家 ☕',
        likes: 256,
        comments: 45,
        time: '1天前',
        isLiked: true
      },
      {
        id: '3',
        characterId: characterId || '',
        images: ['5'],
        content: '夕阳下的城市，有种特别的美 🌅',
        likes: 342,
        comments: 67,
        time: '3天前',
        isLiked: false
      },
      {
        id: '4',
        characterId: characterId || '',
        images: ['6', '7'],
        content: '周末的悠闲时光，看书听音乐 📚🎵',
        likes: 189,
        comments: 34,
        time: '5天前',
        isLiked: false
      },
      {
        id: '5',
        characterId: characterId || '',
        images: ['8', '9', '10', '11'],
        content: '和朋友们的聚会，好久没这么开心了！',
        likes: 567,
        comments: 89,
        time: '1周前',
        isLiked: true
      },
      {
        id: '6',
        characterId: characterId || '',
        images: ['12'],
        content: '雨天的街道，有种独特的氛围 🌧️',
        likes: 234,
        comments: 45,
        time: '2周前',
        isLiked: false
      }
    ]
    setMoments(mockMoments)
  }

  const loadStats = () => {
    // 模拟统计数据
    setStats({
      posts: 42,
      followers: 1234,
      following: 567
    })
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    setStats(prev => ({
      ...prev,
      followers: isFollowing ? prev.followers - 1 : prev.followers + 1
    }))
  }

  const handleLike = (momentId: string) => {
    setMoments(prev => prev.map(m => {
      if (m.id === momentId) {
        return {
          ...m,
          isLiked: !m.isLiked,
          likes: m.isLiked ? m.likes - 1 : m.likes + 1
        }
      }
      return m
    }))
  }

  if (!character) {
    return (
      <ForumLayout>
        <div className="p-4">
          <div className="text-center py-20 text-gray-400">
            角色不存在
          </div>
        </div>
      </ForumLayout>
    )
  }

  return (
    <ForumLayout>
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -m-2 active:opacity-60"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">{character.realName}</h1>
          <button className="p-2 -m-2 active:opacity-60">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 个人信息区 */}
      <div className="p-4 border-b border-gray-100">
        {/* 头像和统计 */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <img
              src={character.avatar || '/default-avatar.png'}
              alt={character.realName}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
            />
            {/* 在线状态 */}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
          </div>
          
          <div className="flex-1 pt-2">
            <div className="grid grid-cols-3 text-center">
              <div>
                <div className="text-lg font-semibold">{stats.posts}</div>
                <div className="text-xs text-gray-500">帖子</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {stats.followers >= 1000 
                    ? `${(stats.followers / 1000).toFixed(1)}k` 
                    : stats.followers}
                </div>
                <div className="text-xs text-gray-500">粉丝</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{stats.following}</div>
                <div className="text-xs text-gray-500">关注</div>
              </div>
            </div>
          </div>
        </div>

        {/* 名字和简介 */}
        <div className="mb-4">
          <h2 className="text-base font-semibold mb-1">{character.realName}</h2>
          {character.nickname && (
            <p className="text-xs text-gray-500 mb-2">@{character.nickname}</p>
          )}
          <p className="text-sm text-gray-700">
            {character.signature || '这个角色很神秘，什么都没有留下...'}
          </p>
          {character.personality && (
            <p className="text-xs text-gray-500 mt-2">
              🎭 {character.personality}
            </p>
          )}
          {character.currentActivity && (
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">{character.currentActivity}</span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleFollow}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              isFollowing
                ? 'bg-slate-50 text-slate-700 shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)]'
                : 'bg-slate-700 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
            }`}
          >
            {isFollowing ? '已关注' : '关注'}
          </button>
          <button
            onClick={() => navigate(`/chat/${character.id}`)}
            className="flex-1 py-2 px-4 rounded-xl bg-slate-50 text-sm font-medium text-slate-700 shadow-[0_2px_8px_rgba(148,163,184,0.15)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)] active:shadow-[inset_0_1px_3px_rgba(148,163,184,0.2)] transition-all"
          >
            发消息
          </button>
          <button className="p-2 rounded-xl bg-gray-100">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="border-b border-gray-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 ${
              activeTab === 'posts' 
                ? 'text-gray-900 border-b-2 border-gray-900' 
                : 'text-gray-400'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="text-sm font-medium">帖子</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 ${
              activeTab === 'saved' 
                ? 'text-gray-900 border-b-2 border-gray-900' 
                : 'text-gray-400'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="text-sm font-medium">收藏</span>
          </button>
        </div>
      </div>

      {/* 内容区 - Instagram风格的图片网格 */}
      <div className="pb-20">
        {activeTab === 'posts' ? (
          <div>
            {/* 网格视图 */}
            <div className="grid grid-cols-3 gap-0.5">
              {moments.map((moment) => (
                <div
                  key={moment.id}
                  className="relative aspect-square bg-gray-100 cursor-pointer active:opacity-80"
                  onClick={() => navigate(`/forum/moment/${moment.id}`)}
                >
                  {/* 模拟图片 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200" />
                  
                  {/* 多图标识 */}
                  {moment.images.length > 1 && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                        <path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* 悬浮时显示的统计信息 */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1 text-white">
                      <Heart className="w-5 h-5 fill-current" />
                      <span className="text-sm font-semibold">{moment.likes}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white">
                      <MessageCircle className="w-5 h-5 fill-current" />
                      <span className="text-sm font-semibold">{moment.comments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 加载更多提示 */}
            <div className="py-8 text-center text-gray-400 text-sm">
              已显示全部内容
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400 text-sm">
            暂无收藏内容
          </div>
        )}
      </div>
    </ForumLayout>
  )
}

export default CharacterProfile
