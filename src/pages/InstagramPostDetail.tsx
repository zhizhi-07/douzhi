import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Send, X } from 'lucide-react'
import { getAllPosts, toggleLike, getNPCById, savePosts } from '../utils/forumNPC'
import { getPostComments, addReply } from '../utils/forumCommentsDB'
import { getUserInfo } from '../utils/userUtils'
import { apiService } from '../services/apiService'
import StatusBar from '../components/StatusBar'
import type { ForumPost } from '../utils/forumNPC'
import type { Comment } from '../utils/forumCommentsDB'

// 待发送的回复
interface PendingReply {
  id: string
  targetCommentId: string
  targetName: string
  content: string
}

const InstagramPostDetail = () => {
  const navigate = useNavigate()
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [pendingReplies, setPendingReplies] = useState<PendingReply[]>([])
  const [replyingTo, setReplyingTo] = useState<{id: string, name: string} | null>(null)
  const [isSending, setIsSending] = useState(false)
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
    
    const posts = getAllPosts()
    const foundPost = posts.find(p => p.id === postId)
    if (foundPost) {
      setPost(foundPost)
    }
    
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

  // 点击回复按钮，设置回复目标
  const handleReplyClick = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName })
    setNewComment(`@${authorName} `)
  }

  // 添加回复到待发送列表
  const addPendingReply = async () => {
    if (!newComment.trim() || !replyingTo || !postId) return
    
    // 提取回复内容（去掉@名字部分）
    const content = newComment.replace(new RegExp(`^@${replyingTo.name}\\s*`), '').trim()
    if (!content) return

    const reply: PendingReply = {
      id: `pending-${Date.now()}`,
      targetCommentId: replyingTo.id,
      targetName: replyingTo.name,
      content
    }

    // 1）先把你的这句回复真实写入评论DB（不调API）
    await addReply(
      replyingTo.id,
      'user',
      userInfo.nickname || userInfo.realName || '我',
      userInfo.avatar || '/default-avatar.png',
      content,
      replyingTo.name
    )

    // 刷新这条帖子的评论数
    const updatedComments = await getPostComments(postId)
    setComments(updatedComments)
    const allPosts = getAllPosts()
    const currentPost = allPosts.find(p => p.id === postId)
    if (currentPost) {
      currentPost.comments = updatedComments.length
      savePosts(allPosts)
    }

    // 2）再把这句放进待发送列表，后面纸飞机用它去调API回你
    setPendingReplies(prev => [...prev, reply])
    setNewComment('')
    setReplyingTo(null)
  }

  // 删除待发送的回复
  const removePendingReply = (id: string) => {
    setPendingReplies(prev => prev.filter(r => r.id !== id))
  }

  // 批量发送所有回复 - 调用AI生成回复内容
  const handleSendAll = async () => {
    if (pendingReplies.length === 0 || !post) return
    
    setIsSending(true)
    try {
      // 获取API配置
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (!apiConfig) {
        alert('没有可用的API配置')
        setIsSending(false)
        return
      }

      // 构建prompt
      const commentsToReply = pendingReplies.map(r => `@${r.targetName}: ${r.content}`).join('\n')
      const prompt = `你是帖子作者，需要回复以下评论。

**你的信息：**
- 昵称：${userInfo.nickname || userInfo.realName || '我'}
- 签名：${userInfo.signature || '无'}

**你发的帖子：**
${post.content}

**需要回复的评论（格式：@评论者: 评论内容）：**
${commentsToReply}

**要求：**
- 用自然、口语化的方式回复每条评论
- 每条回复5-30字
- 格式：@评论者名字：回复内容
- 直接输出回复，不要解释`

      // 确保URL包含完整路径
      const apiUrl = apiConfig.baseUrl.endsWith('/chat/completions') 
        ? apiConfig.baseUrl 
        : apiConfig.baseUrl.replace(/\/?$/, '/chat/completions')

      console.log('🟢 [评论AI] 发送请求到:', apiUrl)
      console.log('🟢 [评论AI] Prompt:', prompt)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8
        })
      })

      const data = await response.json()
      console.log('🟢 [评论AI] 返回:', data)
      const aiReply = data.choices?.[0]?.message?.content || ''
      console.log('🟢 [评论AI] AI回复:', aiReply)

      // 解析AI回复并发送（由随机网友来回你，不再用你的身份）
      const lines = aiReply.split('\n').filter((l: string) => l.trim())
      const randomNames = ['路人甲', '网友A', '吃瓜群众', '围观的猫', '匿名用户', '热心市民']

      for (const line of lines) {
        const match = line.match(/@(.+?)[:：](.+)/)
        if (match) {
          const replyToName = match[1].trim()
          const replyContent = match[2].trim()
          
          // 找到对应的评论（你刚刚那句）
          const targetReply = pendingReplies.find(r => r.targetName === replyToName)
          if (targetReply) {
            const aiName = randomNames[Math.floor(Math.random() * randomNames.length)]
            await addReply(
              targetReply.targetCommentId,
              `npc-${aiName}`,
              aiName,
              '',
              replyContent,
              replyToName
            )
            console.log(`✅ 网友 ${aiName} 回复 @${replyToName}: ${replyContent}`)
          }
        }
      }

      // 刷新评论
      const updatedComments = await getPostComments(postId!)
      setComments(updatedComments)
      
      // 更新帖子评论数
      const allPosts = getAllPosts()
      const currentPost = allPosts.find(p => p.id === postId)
      if (currentPost) {
        currentPost.comments = updatedComments.length
        savePosts(allPosts)
      }

      setPendingReplies([])
    } catch (error) {
      console.error('发送失败:', error)
      alert('发送失败，请重试')
    } finally {
      setIsSending(false)
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
    <div className="h-screen bg-white flex flex-col" data-instagram>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <StatusBar />
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -m-2 active:opacity-60"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-base font-semibold">
            评论{pendingReplies.length > 0 && ` (待发${pendingReplies.length}条)`}
          </h1>
          <button 
            onClick={handleSendAll}
            disabled={isSending || pendingReplies.length === 0}
            className={`p-2 -m-2 active:opacity-60 ${pendingReplies.length > 0 ? 'text-blue-500' : 'text-gray-400'}`}
          >
            {isSending ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* 帖子和评论 */}
      <div className="flex-1 overflow-y-auto">
        {/* 用户帖子内容 - 突出显示 */}
        <div className="bg-white border-b-4 border-gray-200 mb-2">
          <div className="flex items-start gap-4 px-4 py-4">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {authorName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-base">{authorName}</span>
                <span className="text-sm text-gray-500">{post.time}</span>
              </div>
              <p className="text-base text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                {post.content}
              </p>
            </div>
          </div>

          {/* 帖子操作按钮 */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-5 mb-2">
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
            <div className="text-base font-bold">{post.likes.toLocaleString()} 次赞</div>
          </div>
        </div>

        {/* 评论区标题 */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span className="font-bold text-base text-gray-800">评论 ({comments.length})</span>
        </div>

        {/* 评论列表 */}
        <div className="divide-y divide-gray-100 bg-white">
          {comments.length > 0 ? (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="px-4 py-4">
                  {/* 主楼评论 */}
                  <div className="flex items-start gap-3">
                    {/* 首字头像 */}
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-base flex-shrink-0">
                      {comment.authorName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <span className="font-bold text-base mr-2">{comment.authorName}</span>
                      </div>
                      <p className="text-base text-gray-900 break-words leading-relaxed mb-2">{comment.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{formatTimeAgo(comment.timestamp)}</span>
                        <button className="font-medium hover:text-gray-600">
                          {comment.likes > 0 ? `${comment.likes} 赞` : '赞'}
                        </button>
                        <button 
                          className="font-medium text-blue-500 hover:text-blue-600"
                          onClick={() => handleReplyClick(comment.id, comment.authorName)}
                        >
                          回复
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 楼中楼回复 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-12 space-y-4 pl-4 border-l-2 border-gray-200">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          {/* 首字头像 */}
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                            {reply.authorName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1">
                              <span className="font-bold text-sm mr-2">{reply.authorName}</span>
                              {reply.replyTo && (
                                <>
                                  <span className="text-sm text-gray-400 mr-1">回复</span>
                                  <span className="font-bold text-sm text-blue-500 mr-2">@{reply.replyTo}</span>
                                </>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 break-words leading-relaxed mb-1">{reply.content}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>{formatTimeAgo(reply.timestamp)}</span>
                              <button className="font-medium hover:text-gray-600">
                                {reply.likes > 0 ? `${reply.likes} 赞` : '赞'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">还没有评论</p>
              <p className="text-xs text-gray-400 mt-1">快来发表第一条评论吧</p>
            </div>
          )}
        </div>
      </div>

      {/* 待发送回复列表 */}
      {pendingReplies.length > 0 && (
        <div className="border-t border-gray-200 bg-blue-50 px-4 py-2">
          <div className="text-xs text-gray-500 mb-2">待发送的回复：</div>
          <div className="space-y-2">
            {pendingReplies.map(reply => (
              <div key={reply.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                <span className="text-sm text-blue-500">@{reply.targetName}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{reply.content}</span>
                <button 
                  onClick={() => removePendingReply(reply.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部评论输入框 */}
      <div className="border-t border-gray-100 bg-white">
        {replyingTo && (
          <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">回复 @{replyingTo.name}</span>
            <button onClick={() => { setReplyingTo(null); setNewComment('') }} className="text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-3">
          {userInfo.avatar ? (
            <img
              src={userInfo.avatar}
              alt="我"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-sm flex-shrink-0">
              我
            </div>
          )}
          <input
            type="text"
            placeholder={replyingTo ? `回复 @${replyingTo.name}...` : "添加评论..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
          {newComment.trim() && replyingTo && (
            <button
              onClick={addPendingReply}
              className="text-sm font-semibold text-blue-500"
            >
              添加
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstagramPostDetail
