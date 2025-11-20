import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import ForumLayout from '../components/ForumLayout'
import { getAllCharacters } from '../utils/characterManager'
import type { Character } from '../services/characterService'

// 模拟动态数据
interface Moment {
  id: string
  characterId: string
  character?: Character
  images: string[]
  content: string
  likes: number
  comments: Comment[]
  time: string
  isLiked: boolean
  isSaved: boolean
}

interface Comment {
  id: string
  author: string
  content: string
  time: string
  likes: number
  isLiked: boolean
}

const MomentDetail = () => {
  const { momentId } = useParams()
  const navigate = useNavigate()
  const [moment, setMoment] = useState<Moment | null>(null)
  const [commentText, setCommentText] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    loadMoment()
  }, [momentId])

  const loadMoment = async () => {
    // 模拟加载动态详情
    const mockMoment: Moment = {
      id: momentId || '1',
      characterId: 'char1',
      images: ['1', '2', '3'],
      content: '今天的天气真好呀~ 出去散步遇到了一只可爱的小猫咪 🐱\n\n阳光洒在街道上，一切都显得那么美好。生活中的小确幸就是这样，不经意间就会让人感到温暖。',
      likes: 128,
      comments: [
        {
          id: '1',
          author: '小明',
          content: '好可爱的猫咪！',
          time: '1小时前',
          likes: 12,
          isLiked: false
        },
        {
          id: '2',
          author: '小红',
          content: '天气确实很好呢，我也出去散步了',
          time: '30分钟前',
          likes: 5,
          isLiked: true
        },
        {
          id: '3',
          author: '小李',
          content: '这种天气最适合出去走走了',
          time: '10分钟前',
          likes: 3,
          isLiked: false
        }
      ],
      time: '2小时前',
      isLiked: false,
      isSaved: false
    }

    // 加载角色信息
    const characters = await getAllCharacters()
    const character = characters.find(c => c.id === mockMoment.characterId)
    if (character) {
      mockMoment.character = character
    }

    setMoment(mockMoment)
  }

  const handleLike = () => {
    if (!moment) return
    setMoment({
      ...moment,
      isLiked: !moment.isLiked,
      likes: moment.isLiked ? moment.likes - 1 : moment.likes + 1
    })
  }

  const handleSave = () => {
    if (!moment) return
    setMoment({
      ...moment,
      isSaved: !moment.isSaved
    })
  }

  const handleCommentLike = (commentId: string) => {
    if (!moment) return
    setMoment({
      ...moment,
      comments: moment.comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !c.isLiked,
            likes: c.isLiked ? c.likes - 1 : c.likes + 1
          }
        }
        return c
      })
    })
  }

  const handleAddComment = () => {
    if (!moment || !commentText.trim()) return
    
    const newComment: Comment = {
      id: Date.now().toString(),
      author: '我',
      content: commentText,
      time: '刚刚',
      likes: 0,
      isLiked: false
    }

    setMoment({
      ...moment,
      comments: [...moment.comments, newComment]
    })
    setCommentText('')
  }

  if (!moment) {
    return (
      <ForumLayout>
        <div className="p-4 text-center text-gray-400">
          加载中...
        </div>
      </ForumLayout>
    )
  }

  return (
    <ForumLayout>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -m-2 active:opacity-60"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">动态</h1>
          <button className="p-2 -m-2 active:opacity-60">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="pb-20">
        {/* 作者信息 */}
        <div className="p-4 border-b border-gray-100">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/forum/character/${moment.characterId}`)}
          >
            <img
              src={moment.character?.avatar || '/default-avatar.png'}
              alt={moment.character?.realName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">{moment.character?.realName}</div>
              <div className="text-xs text-gray-500">{moment.time}</div>
            </div>
          </div>
        </div>

        {/* 图片轮播 */}
        {moment.images.length > 0 && (
          <div className="relative">
            <div className="aspect-square bg-gray-100">
              {/* 模拟图片 */}
              <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                <span className="text-white text-4xl font-bold">{currentImageIndex + 1}</span>
              </div>
            </div>
            
            {/* 图片指示器 */}
            {moment.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                {moment.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white w-6' 
                        : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* 左右切换按钮 */}
            {moment.images.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center"
                  >
                    ‹
                  </button>
                )}
                {currentImageIndex < moment.images.length - 1 && (
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center"
                  >
                    ›
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* 操作栏 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="p-2 -m-2 active:scale-110 transition-transform"
              >
                <Heart 
                  className={`w-6 h-6 ${
                    moment.isLiked 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-700'
                  }`}
                />
              </button>
              <button className="p-2 -m-2 active:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="p-2 -m-2 active:scale-110 transition-transform">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleSave}
              className="p-2 -m-2 active:scale-110 transition-transform"
            >
              <Bookmark 
                className={`w-5 h-5 ${
                  moment.isSaved 
                    ? 'fill-gray-700 text-gray-700' 
                    : 'text-gray-700'
                }`}
              />
            </button>
          </div>

          {/* 点赞数 */}
          <div className="text-sm font-semibold mb-2">
            {moment.likes} 次赞
          </div>

          {/* 内容 */}
          <div className="text-sm whitespace-pre-wrap">
            {moment.content}
          </div>
        </div>

        {/* 评论区 */}
        <div className="border-t border-gray-100">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-4">评论</h3>
            
            {/* 评论列表 */}
            <div className="space-y-4">
              {moment.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-medium">{comment.author}</span>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">{comment.time}</span>
                          <button className="text-xs text-gray-500">回复</button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCommentLike(comment.id)}
                        className="p-1 -m-1"
                      >
                        <Heart 
                          className={`w-4 h-4 ${
                            comment.isLiked 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 底部评论输入框 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="添加评论..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none"
          />
          <button
            onClick={handleAddComment}
            disabled={!commentText.trim()}
            className="px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-medium disabled:opacity-50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all"
          >
            发送
          </button>
        </div>
      </div>
    </ForumLayout>
  )
}

export default MomentDetail
