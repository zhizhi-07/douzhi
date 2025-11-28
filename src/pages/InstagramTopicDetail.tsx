import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Hash } from 'lucide-react'
import InstagramLayout from '../components/InstagramLayout'
import { getAllPosts, toggleLike, getNPCById } from '../utils/forumNPC'
import type { ForumPost } from '../utils/forumNPC'

// 解析帖子内容，把[图片：描述]或【截图：描述】标记转换成图片卡片
const parsePostContent = (content: string) => {
  // 同时匹配英文方括号[]和中文方括号【】
  const imagePattern = /[\[【](图片|照片|截图)[:：]([^\]】]+)[\]】]/g
  
  const hasImages = imagePattern.test(content)
  if (!hasImages) {
    return <p className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">{content}</p>
  }
  
  // 重置正则的lastIndex
  imagePattern.lastIndex = 0
  
  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let match
  const images: { desc: string }[] = []
  
  // 先提取所有图片
  while ((match = imagePattern.exec(content)) !== null) {
    // 添加图片前的文本
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim()
      if (text) {
        elements.push(
          <p key={`text-${lastIndex}`} className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap mb-2">
            {text}
          </p>
        )
      }
    }
    
    // 收集图片信息
    images.push({ desc: match[2].trim() })
    lastIndex = match.index + match[0].length
  }
  
  // 添加剩余文本
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim()
    if (text) {
      elements.push(
        <p key={`text-${lastIndex}`} className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap mb-2">
          {text}
        </p>
      )
    }
  }
  
  // 添加图片网格
  if (images.length > 0) {
    elements.push(
      <div key="images" className="grid grid-cols-3 gap-1 mt-2">
        {images.map((img, idx) => (
          <div 
            key={idx} 
            className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center p-2"
          >
            <span className="text-xs text-gray-700 font-medium text-center line-clamp-3">{img.desc}</span>
          </div>
        ))}
      </div>
    )
  }
  
  return <>{elements}</>
}

const InstagramTopicDetail = () => {
  const { topicName } = useParams<{ topicName: string }>()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const decodedName = decodeURIComponent(topicName || '')

  useEffect(() => {
    if (decodedName) {
      // 筛选包含该话题标签的帖子
      const allPosts = getAllPosts()
      const topicPosts = allPosts.filter(post => 
        post.content.includes(`#${decodedName}`) || 
        (post as any).topicId === decodedName
      )
      setPosts(topicPosts)
    }
  }, [decodedName])

  const handleLike = (postId: string) => {
    const updatedPosts = toggleLike(postId)
    // 重新筛选
    const topicPosts = updatedPosts.filter(post => 
      post.content.includes(`#${decodedName}`) || 
      (post as any).topicId === decodedName
    )
    setPosts(topicPosts)
  }

  // 格式化时间
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
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <InstagramLayout showHeader={false} showTabBar={false}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -m-2 active:opacity-60"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 ml-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-purple-600" />
              <h1 className="text-lg font-semibold">{decodedName}</h1>
            </div>
            <p className="text-sm text-gray-500">{posts.length} 条帖子</p>
          </div>
        </div>
      </div>

      {/* 帖子列表 */}
      <div className="pb-4">
        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <Hash className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 text-sm">暂无相关帖子</p>
          </div>
        ) : (
          posts.map((post) => {
            const npc = getNPCById(post.npcId)
            if (!npc) return null

            return (
              <div key={post.id} className="mb-3 bg-white border-b-8 border-gray-100">
                {/* Post Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/instagram/user/${npc.id}`)}
                  >
                    <img
                      src={npc.avatar}
                      alt={npc.name}
                      className="w-10 h-10 rounded-full object-cover"
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

                {/* Post Content */}
                <div className="px-4 pb-3">
                  {parsePostContent(post.content)}
                </div>

                {/* Post Actions */}
                <div className="px-4 py-3 border-t border-gray-50">
                  <div className="flex items-center justify-between mb-2">
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
                      <button 
                        className="active:opacity-60"
                        onClick={() => navigate(`/instagram/post/${post.id}`)}
                      >
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

                  <div className="text-base font-semibold">
                    {post.likes.toLocaleString()} 次赞
                  </div>

                  {post.comments > 0 && (
                    <button 
                      className="text-sm text-gray-500 mt-1"
                      onClick={() => navigate(`/instagram/post/${post.id}`)}
                    >
                      查看全部 {post.comments} 条评论
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </InstagramLayout>
  )
}

export default InstagramTopicDetail
