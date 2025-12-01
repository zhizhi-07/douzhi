import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Hash } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import InstagramLayout from '../components/InstagramLayout'
import { getAllPostsAsync, toggleLike, getNPCById } from '../utils/forumNPC'
import type { ForumPost } from '../utils/forumNPC'

// 解析帖子内容，把[图片：描述]或【截图：描述】标记转换成图片卡片
const parsePostContent = (content: string) => {
  const imagePattern = /[\[【](图片|照片|截图)[:：]([^\]】]+)[\]】]/g

  const hasImages = imagePattern.test(content)
  if (!hasImages) {
    return <p className="text-sm leading-loose text-[#4A4A4A] whitespace-pre-wrap font-light text-justify">{content}</p>
  }

  imagePattern.lastIndex = 0

  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let match
  const images: { desc: string }[] = []

  while ((match = imagePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim()
      if (text) {
        elements.push(
          <p key={`text-${lastIndex}`} className="text-sm leading-loose text-[#4A4A4A] whitespace-pre-wrap mb-3 font-light text-justify">
            {text}
          </p>
        )
      }
    }

    images.push({ desc: match[2].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim()
    if (text) {
      elements.push(
        <p key={`text-${lastIndex}`} className="text-sm leading-loose text-[#4A4A4A] whitespace-pre-wrap mb-3 font-light text-justify">
          {text}
        </p>
      )
    }
  }

  if (images.length > 0) {
    elements.push(
      <div key="images" className="grid grid-cols-3 gap-1 mt-3">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="aspect-square bg-[#F5F5F5] flex items-center justify-center p-2"
          >
            <span className="text-[10px] text-[#8C8C8C] font-sans tracking-wider text-center line-clamp-3">{img.desc}</span>
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
      getAllPostsAsync().then(allPosts => {
        const topicPosts = allPosts.filter(post =>
          post.content.includes(`#${decodedName}`) ||
          (post as any).topicId === decodedName
        )
        setPosts(topicPosts)
      })
    }
  }, [decodedName])

  const handleLike = async (postId: string) => {
    const updatedPosts = await toggleLike(postId)
    const topicPosts = updatedPosts.filter(post =>
      post.content.includes(`#${decodedName}`) ||
      (post as any).topicId === decodedName
    )
    setPosts(topicPosts)
  }

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
      <div className="min-h-screen bg-[#F9F8F4] font-serif text-[#2C2C2C]">
        {/* 顶部导航（包含状态栏） */}
        <div className="sticky top-0 z-10 bg-[#F9F8F4]/90 backdrop-blur-md border-b border-[#EAE5D9]">
          <StatusBar />
          <div className="flex items-center justify-between px-5 pb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-[#5A5A5A] hover:text-[#2C2C2C] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
            </button>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3 text-[#8C8C8C]" />
                <h1 className="text-sm font-medium">{decodedName}</h1>
              </div>
              <span className="text-[10px] text-[#8C8C8C] mt-0.5">{posts.length} 帖子</span>
            </div>
            <div className="w-5" /> {/* 占位 */}
          </div>
        </div>

        {/* 帖子列表 */}
        <div className="pb-8">
          {posts.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-[#EAE5D9] rounded-full">
                <Hash className="w-5 h-5 text-[#D4D4D4] stroke-[1.5]" />
              </div>
              <p className="text-[10px] text-[#8C8C8C]">还没有帖子</p>
            </div>
          ) : (
            <div className="divide-y divide-[#EAE5D9]">
              {posts.map((post) => {
                const npc = getNPCById(post.npcId)
                if (!npc) return null

                return (
                  <div key={post.id} className="bg-[#F9F8F4] py-6">
                    {/* Post Header */}
                    <div className="flex items-center justify-between px-5 mb-3">
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => navigate(`/instagram/user/${npc.id}`)}
                      >
                        <img
                          src={npc.avatar}
                          alt={npc.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#D4D4D4]"
                        />
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-[#2C2C2C] tracking-wide group-hover:opacity-70 transition-opacity">{npc.name}</div>
                          <div className="text-[10px] text-[#8C8C8C] tracking-wider font-sans">{formatTimeAgo(post.timestamp)}</div>
                        </div>
                      </div>
                      <button className="text-[#8C8C8C] hover:text-[#2C2C2C] transition-colors">
                        <MoreHorizontal className="w-5 h-5 stroke-[1.5]" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="px-5 mb-4">
                      {parsePostContent(post.content)}
                    </div>

                    {/* Post Actions */}
                    <div className="px-5 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className="flex items-center gap-1.5 group"
                        >
                          <Heart
                            className={`w-5 h-5 stroke-[1.5] transition-colors ${post.isLiked ? 'text-[#8B3A3A] fill-[#8B3A3A]' : 'text-[#5A5A5A] group-hover:text-[#2C2C2C]'
                              }`}
                          />
                          <span className={`text-xs tracking-wide ${post.isLiked ? 'text-[#8B3A3A]' : 'text-[#8C8C8C]'}`}>
                            {post.likes > 0 ? post.likes : '赞'}
                          </span>
                        </button>
                        <button
                          className="flex items-center gap-1.5 group"
                          onClick={() => navigate(`/instagram/post/${post.id}`)}
                        >
                          <MessageCircle className="w-5 h-5 text-[#5A5A5A] group-hover:text-[#2C2C2C] stroke-[1.5]" />
                          <span className="text-xs text-[#8C8C8C] group-hover:text-[#5A5A5A] tracking-wide">
                            {post.comments > 0 ? post.comments : '评论'}
                          </span>
                        </button>
                        <button className="flex items-center gap-1.5 group">
                          <Send className="w-5 h-5 text-[#5A5A5A] group-hover:text-[#2C2C2C] stroke-[1.5] -rotate-45" />
                        </button>
                      </div>
                      <button className="text-[#5A5A5A] hover:text-[#2C2C2C] transition-colors">
                        <Bookmark className="w-5 h-5 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </InstagramLayout>
  )
}

export default InstagramTopicDetail
