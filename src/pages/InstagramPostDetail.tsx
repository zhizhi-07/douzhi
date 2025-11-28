import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Send, X, Trash2 } from 'lucide-react'
import { getAllPosts, toggleLike, getNPCById, savePosts } from '../utils/forumNPC'
import { getPostComments, addReply, addComment } from '../utils/forumCommentsDB'
import { getUserInfo } from '../utils/userUtils'
import { apiService } from '../services/apiService'
import { getAllCharacters } from '../utils/characterManager'
import StatusBar from '../components/StatusBar'
import EmojiContentRenderer from '../components/EmojiContentRenderer'
import type { ForumPost } from '../utils/forumNPC'
import type { Comment } from '../utils/forumCommentsDB'

// 解析帖子内容，把[图片：描述]标记转换成图片卡片
const parsePostContent = (content: string) => {
  const imagePattern = /\[(图片|照片|截图)[:：]([^\]]+)\]/g
  
  const hasImages = imagePattern.test(content)
  if (!hasImages) {
    return <p className="text-base text-gray-900 whitespace-pre-wrap break-words leading-relaxed">{content}</p>
  }
  
  imagePattern.lastIndex = 0
  
  const elements: React.ReactNode[] = []
  const images: { type: string; desc: string }[] = []
  let lastIndex = 0
  let match
  
  while ((match = imagePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text.trim()) {
        if (images.length > 0) {
          elements.push(
            <div key={`imgs-${lastIndex}`} className="grid grid-cols-3 gap-1 my-2">
              {images.map((img, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden p-1.5">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-500 text-center leading-tight line-clamp-3">{img.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )
          images.length = 0
        }
        elements.push(
          <p key={`text-${lastIndex}`} className="text-base text-gray-900 whitespace-pre-wrap break-words leading-relaxed mb-2">
            {text}
          </p>
        )
      }
    }
    
    images.push({ type: match[1], desc: match[2] })
    lastIndex = match.index + match[0].length
  }
  
  if (images.length > 0) {
    elements.push(
      <div key={`imgs-end`} className="grid grid-cols-3 gap-1 my-2">
        {images.map((img, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden p-1.5">
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-gray-500 text-center leading-tight line-clamp-3">{img.desc}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex)
    if (text.trim()) {
      elements.push(
        <p key={`text-${lastIndex}`} className="text-base text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
          {text}
        </p>
      )
    }
  }
  
  return <>{elements}</>
}

const InstagramPostDetail = () => {
  const navigate = useNavigate()
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<{id: string, name: string} | null>(null)
  const [pendingReplies, setPendingReplies] = useState<{id: string, commentId: string, targetName: string, content: string}[]>([])
  const [isSending, setIsSending] = useState(false)
  const [characters, setCharacters] = useState<any[]>([])
  const userInfo = getUserInfo()

  // 获取NPC的真实头像（优先从角色获取）
  const getRealAvatar = (npcId: string, npcAvatar?: string): string => {
    const character = characters.find(c => c.id === npcId)
    if (character?.avatar) {
      return character.avatar
    }
    if (!npcAvatar || npcAvatar === '/default-avatar.png') {
      return '/default-avatar.png'
    }
    return npcAvatar
  }

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
    
    // 加载角色列表（用于获取真实头像）
    const chars = await getAllCharacters()
    setCharacters(chars)
    
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

  // 添加回复到待发送列表（不触发AI）
  const addPendingReply = async () => {
    if (!newComment.trim() || !replyingTo || !postId) return
    
    const content = newComment.replace(new RegExp(`^@${replyingTo.name}\\s*`), '').trim()
    if (!content) return

    // 添加到待发送列表
    const newPending = {
      id: `pending-${Date.now()}`,
      commentId: replyingTo.id,
      targetName: replyingTo.name,
      content
    }
    setPendingReplies(prev => [...prev, newPending])
    
    // 保存用户评论到数据库
    await addReply(
      replyingTo.id,
      'user',
      userInfo.nickname || userInfo.realName || '我',
      userInfo.avatar || '/default-avatar.png',
      content,
      replyingTo.name
    )
    
    // 刷新评论
    const updatedComments = await getPostComments(postId)
    setComments(updatedComments)
    
    setNewComment('')
    setReplyingTo(null)
    console.log(`📝 添加待发送回复: @${newPending.targetName}: ${content}`)
  }

  // 点击纸飞机：批量发送并触发AI回复
  const handleSendAll = async () => {
    if (pendingReplies.length === 0 || !post || !postId) return
    
    setIsSending(true)
    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (!apiConfig) {
        console.warn('没有可用的API配置')
        setIsSending(false)
        return
      }

      // 重新获取最新的评论列表（包含之前添加的用户回复）
      const latestComments = await getPostComments(postId)
      console.log('📋 最新评论数:', latestComments.length)

      // 获取所有角色信息（用于匹配公众人物）
      const allCharacters = await getAllCharacters()
      console.log('📋 所有角色:', allCharacters.map(c => ({ name: c.nickname || c.realName, avatar: c.avatar ? '有头像' : '无头像', isPublic: c.isPublicFigure })))
      
      // 构建所有待回复的内容
      const repliesText = pendingReplies.map(r => `@${r.targetName}: "${r.content}"`).join('\n')
      
      // 构建当前评论区状态
      const existingCommentsText = latestComments.slice(0, 10).map(c => {
        let text = `[主楼] ${c.authorName}：${c.content}`
        if (c.replies && c.replies.length > 0) {
          text += '\n' + c.replies.slice(0, 3).map(r => 
            `  └ ${r.authorName} -> ${r.replyTo || c.authorName}：${r.content}`
          ).join('\n')
        }
        return text
      }).join('\n')
      
      // 检查哪些是AI角色（有完整人设）
      const aiCharacters = allCharacters.filter(c => c.personality).slice(0, 5).map(c => ({
        name: c.nickname || c.realName || '未知',
        personality: c.personality,
        isPublic: c.isPublicFigure,
        publicPersona: c.publicPersona
      }))
      
      const aiCharacterPrompt = aiCharacters.length > 0 ? `
## 🎭 AI角色（有人设，可能参与评论）
${aiCharacters.map(a => {
  let info = `**${a.name}**${a.isPublic ? '【公众人物】' : ''}`
  if (a.publicPersona) info += `\n- 网络形象：${a.publicPersona}`
  if (a.personality) info += `\n- 人设：${a.personality}`
  return info
}).join('\n\n')}
` : ''

      const prompt = `你是帖子评论区的导演，用户刚刚在评论区互动了，请生成后续的评论生态。

## 📱 帖子内容
楼主「${userInfo.nickname || '我'}」发帖：
${post.content}

## 💬 当前评论区状态
${existingCommentsText || '(暂无评论)'}

## 🆕 用户刚发的回复
${repliesText}
${aiCharacterPrompt}
## 🎯 你要生成的评论

**必须包含：**
1. 被@的人必须回复用户（楼中楼回复）
2. 可能有1-2条新的主楼评论（围观群众看热闹）
3. 楼中楼可能继续讨论

**评论者类型：**
- NPC网友（70%）：路人甲、吃瓜群众、小李、阿明、网友A等随机网名
- AI角色（30%）：如果有人设的角色，按他们的语气说话

**输出格式（严格遵守）：**
[主楼] 网名：评论内容
[回复] 回复者 -> 被回复者：回复内容

**示例：**
[回复] 小李 -> 用户：哈哈你说得对
[主楼] 吃瓜群众：我也来凑热闹
[回复] 阿明 -> 小李：同意+1

**要求：**
- 每条5-30字，自然口语化
- AI角色必须符合人设语气
- 生成3-6条评论
- 直接输出，不要解释`

      const apiUrl = apiConfig.baseUrl.endsWith('/chat/completions') 
        ? apiConfig.baseUrl 
        : apiConfig.baseUrl.replace(/\/?$/, '/chat/completions')

      console.log('🟢 [批量AI回复] 完整Prompt:')
      console.log(prompt)
      console.log('🟢 [批量AI回复] 请求...')

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
      const aiContent = data.choices?.[0]?.message?.content?.trim() || ''
      console.log('🟢 [批量AI回复] 返回:', aiContent)

      // 解析AI回复并保存（支持新格式）
      const lines = aiContent.split('\n').filter((l: string) => l.trim())
      
      // 辅助函数：获取角色信息
      const getCharacterInfo = (name: string) => {
        const character = allCharacters.find(c => 
          c.nickname === name || c.realName === name
        )
        const charAvatar = character?.avatar && character.avatar !== '/default-avatar.png' ? character.avatar : ''
        return {
          id: character?.id || `npc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          avatar: charAvatar || '',
          character
        }
      }
      
      for (const line of lines) {
        // 解析 [主楼] 格式
        const mainMatch = line.match(/^\[主楼\]\s*(.+?)[:：](.+)$/)
        if (mainMatch) {
          const authorName = mainMatch[1].trim()
          const content = mainMatch[2].trim()
          const { id, avatar } = getCharacterInfo(authorName)
          
          await addComment(postId, id, authorName, avatar, content)
          console.log(`✅ [主楼] ${authorName}: ${content}`)
          continue
        }
        
        // 解析 [回复] 格式
        const replyMatch = line.match(/^\[回复\]\s*(.+?)\s*->\s*(.+?)[:：](.+)$/)
        if (replyMatch) {
          const authorName = replyMatch[1].trim()
          const replyToName = replyMatch[2].trim()
          const content = replyMatch[3].trim()
          const { id, avatar } = getCharacterInfo(authorName)
          
          // 找到要回复的评论（主楼）
          // 1. 先在待回复中找（用户刚回复的那条）
          const pending = pendingReplies.find(r => r.targetName === authorName)
          let targetCommentId = pending?.commentId
          
          // 2. 如果不是针对用户刚回复的，在现有评论中找
          if (!targetCommentId) {
            const refreshedComments = await getPostComments(postId)
            // 找包含被回复人的主楼
            const targetComment = refreshedComments.find(c => 
              c.authorName === replyToName || 
              c.replies?.some(r => r.authorName === replyToName)
            )
            targetCommentId = targetComment?.id
          }
          
          if (targetCommentId) {
            await addReply(targetCommentId, id, authorName, avatar, content, replyToName)
            console.log(`✅ [回复] ${authorName} -> ${replyToName}: ${content}`)
          } else {
            // 找不到目标评论，作为新主楼发
            await addComment(postId, id, authorName, avatar, `@${replyToName} ${content}`)
            console.log(`✅ [回复降级主楼] ${authorName}: @${replyToName} ${content}`)
          }
          continue
        }
        
        // 兼容旧格式：网名：内容
        const oldMatch = line.match(/^(.+?)[:：](.+)$/)
        if (oldMatch) {
          const responderName = oldMatch[1].trim()
          const replyContent = oldMatch[2].trim()
          
          // 找对应的待回复项
          const pending = pendingReplies.find(r => r.targetName === responderName)
          if (pending) {
            const { id, avatar } = getCharacterInfo(responderName)
            await addReply(pending.commentId, id, responderName, avatar, replyContent, userInfo.nickname || '我')
            console.log(`✅ ${responderName} 回复了你: ${replyContent}`)
          }
        }
      }

      // 清空待发送列表
      setPendingReplies([])
      
      // 刷新评论
      const updatedComments = await getPostComments(postId)
      setComments(updatedComments)
      
      // 更新帖子评论数
      const allPosts = getAllPosts()
      const currentPost = allPosts.find(p => p.id === postId)
      if (currentPost) {
        currentPost.comments = updatedComments.length
        savePosts(allPosts)
      }
      
      // 🧠 为每个回复的AI角色增加记忆计数
      const respondersSet = new Set<string>()
      pendingReplies.forEach(r => {
        const char = characters.find(c => 
          c.nickname === r.targetName || c.realName === r.targetName
        )
        if (char) {
          respondersSet.add(char.id)
        }
      })
      
      import('../services/memoryExtractor').then(({ recordInteraction }) => {
        respondersSet.forEach(charId => {
          const char = characters.find(c => c.id === charId)
          if (char) {
            recordInteraction(char.id, char.realName)
          }
        })
      })
    } catch (error) {
      console.error('发送失败:', error)
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
  const authorAvatar = isUserPost ? userInfo.avatar : getRealAvatar(post.npcId, npc?.avatar)

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
          <h1 className="text-base font-semibold">评论</h1>
          {/* 删除按钮 - 只有用户自己的帖子显示 */}
          {post.npcId === 'user' ? (
            <button 
              onClick={() => {
                if (confirm('确定要删除这条帖子吗？')) {
                  const posts = getAllPosts()
                  const newPosts = posts.filter(p => p.id !== postId)
                  savePosts(newPosts)
                  navigate(-1)
                }
              }}
              className="p-2 -m-2 text-red-500 active:opacity-60"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-6" />
          )}
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
              {parsePostContent(post.content)}
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
                    {/* 头像：有真实头像就显示，否则首字 */}
                    {comment.authorAvatar && comment.authorAvatar !== '/default-avatar.png' ? (
                      <img src={comment.authorAvatar} alt={comment.authorName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-base flex-shrink-0">
                        {comment.authorName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <span className="font-bold text-base mr-2">{comment.authorName}</span>
                      </div>
                      <p className="text-base text-gray-900 break-words leading-relaxed mb-2"><EmojiContentRenderer content={comment.content} emojiSize={32} /></p>
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
                          {/* 头像：有真实头像就显示，否则首字 */}
                          {reply.authorAvatar && reply.authorAvatar !== '/default-avatar.png' ? (
                            <img src={reply.authorAvatar} alt={reply.authorName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                              {reply.authorName[0]}
                            </div>
                          )}
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
                            <p className="text-sm text-gray-800 break-words leading-relaxed mb-1"><EmojiContentRenderer content={reply.content} emojiSize={28} /></p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>{formatTimeAgo(reply.timestamp)}</span>
                              <button className="font-medium hover:text-gray-600">
                                {reply.likes > 0 ? `${reply.likes} 赞` : '赞'}
                              </button>
                              <button 
                                className="font-medium text-blue-500 hover:text-blue-600"
                                onClick={() => handleReplyClick(comment.id, reply.authorName)}
                              >
                                回复
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
          {/* 添加回复按钮 */}
          {newComment.trim() && replyingTo && (
            <button
              onClick={addPendingReply}
              className="text-sm font-semibold text-blue-500"
            >
              添加
            </button>
          )}
          {/* 纸飞机发送按钮 - 有待发送回复时显示 */}
          {pendingReplies.length > 0 && (
            <button
              onClick={handleSendAll}
              disabled={isSending}
              className="ml-2 p-2 rounded-full bg-blue-500 text-white disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
              <span className="text-xs font-bold">{pendingReplies.length}</span>
            </button>
          )}
        </div>
        {/* 待发送回复列表 */}
        {pendingReplies.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
            <div className="text-xs text-blue-600 mb-1">待发送 ({pendingReplies.length}条)：</div>
            <div className="space-y-1">
              {pendingReplies.map(r => (
                <div key={r.id} className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-blue-500">@{r.targetName}</span>
                  <span className="truncate">{r.content}</span>
                  <button 
                    onClick={() => setPendingReplies(prev => prev.filter(p => p.id !== r.id))}
                    className="ml-auto text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstagramPostDetail
