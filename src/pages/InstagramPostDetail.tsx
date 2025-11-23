import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Send } from 'lucide-react'
import { getAllPosts, toggleLike, getNPCById } from '../utils/forumNPC'
import { getPostComments } from '../utils/forumCommentsDB'
import { getUserInfo } from '../utils/userUtils'
import type { ForumPost } from '../utils/forumNPC'
import type { Comment } from '../utils/forumComments'

const InstagramPostDetail = () => {
  const navigate = useNavigate()
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const userInfo = getUserInfo()

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

  useEffect(() => {
    loadPostAndComments()
  }, [postId])

  const loadPostAndComments = async () => {
    if (!postId) return
    
    // 加载帖子
    const posts = getAllPosts()
    const foundPost = posts.find(p => p.id === postId)
    if (foundPost) {
      setPost(foundPost)
    }
    
    // 加载评论
    const postComments = await getPostComments(postId)
    setComments(postComments)
  }

  const handleLike = () => {
    if (!postId) return
    const updatedPosts = toggleLike(postId)
    const updatedPost = updatedPosts.find(p => p.id === postId)
    if (updatedPost) {
      setPost(updatedPost)
    }
  }

  if (!post) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">帖子不存在</p>
      </div>
    )
  }

  const isUserPost = post.npcId === 'user'
  const npc = !isUserPost ? getNPCById(post.npcId) : null
  const authorName = isUserPost ? (userInfo.nickname || userInfo.realName || '我') : (npc?.name || '未知')
  const authorAvatar = isUserPost ? userInfo.avatar : npc?.avatar

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -m-2 active:opacity-60"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-base font-semibold">评论</h1>
          <button className="p-2 -m-2 active:opacity-60">
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 帖子和评论 */}
      <div className="flex-1 overflow-y-auto">
        {/* 帖子内容 */}
        <div className="border-b border-gray-100">
          <div className="flex items-start gap-3 px-4 py-3">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {authorName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{authorName}</span>
                <span className="text-xs text-gray-500">{post.time}</span>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {post.content}
              </p>
            </div>
          </div>

          {/* 帖子操作按钮 */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={handleLike} className="active:scale-110 transition-transform">
                <Heart className={`w-6 h-6 ${post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-900'}`} />
              </button>
              <button className="active:opacity-60">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="active:opacity-60">
                <Send className="w-6 h-6" />
              </button>
            </div>
            <div className="text-sm font-semibold">{post.likes.toLocaleString()} 次赞</div>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="px-4 py-3">
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <img
                    src={comment.authorAvatar || '/default-avatar.png'}
                    alt={comment.authorName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{comment.authorName}</span>
                      <span className="text-sm text-gray-900 break-words">{comment.content}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</span>
                      <button className="text-xs text-gray-500 font-semibold">
                        {comment.likes > 0 ? `${comment.likes} 次赞` : '赞'}
                      </button>
                      <button className="text-xs text-gray-500 font-semibold">回复</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">还没有评论</p>
              <p className="text-xs text-gray-400 mt-1">快来发表第一条评论吧</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部评论输入框 */}
      <div className="border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          {userInfo.avatar ? (
            <img
              src={userInfo.avatar}
              alt="我"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              我
            </div>
          )}
          <input
            type="text"
            placeholder="添加评论..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
          {newComment.trim() && (
            <button
              onClick={() => {
                // TODO: 添加评论功能
                setNewComment('')
              }}
              className="text-sm font-semibold text-blue-500"
            >
              发布
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstagramPostDetail
