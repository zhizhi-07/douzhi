import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Send, X, Trash2, MoreHorizontal, Share2 } from 'lucide-react'
import { getAllPostsAsync, toggleLike, getNPCById, savePosts } from '../utils/forumNPC'
import { getPostComments, addReply, addComment } from '../utils/forumCommentsDB'
import { getUserInfo } from '../utils/userUtils'
import { apiService } from '../services/apiService'
import { getAllCharacters } from '../utils/characterManager'
import { addMessage, loadMessages } from '../utils/simpleMessageManager'
import type { Message } from '../types/chat'
import StatusBar from '../components/StatusBar'
import EmojiContentRenderer from '../components/EmojiContentRenderer'
import type { ForumPost } from '../utils/forumNPC'
import type { Comment } from '../utils/forumCommentsDB'

// 解析帖子内容，把[图片：描述]标记转换成图片卡片
const parsePostContent = (content: string) => {
  const imagePattern = /\[(图片|照片|截图)[:：]([^\]]+)\]/g

  const hasImages = imagePattern.test(content)
  if (!hasImages) {
    return <p className="text-[15px] text-[#333] whitespace-pre-wrap break-words leading-relaxed">{content}</p>
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
          <p key={`text-${lastIndex}`} className="text-[15px] text-[#333] whitespace-pre-wrap break-words leading-relaxed mb-2">
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
        <p key={`text-${lastIndex}`} className="text-[15px] text-[#333] whitespace-pre-wrap break-words leading-relaxed">
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
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null)
  const [pendingReplies, setPendingReplies] = useState<{ id: string, commentId: string, targetName: string, content: string }[]>([])
  const [isSending, setIsSending] = useState(false)
  const [characters, setCharacters] = useState<any[]>([])
  const userInfo = getUserInfo()
  const commentsEndRef = useRef<HTMLDivElement>(null)

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

  // 🔥 把角色ID转换成名字
  const getCharacterName = (id: string): string => {
    const char = characters.find(c => c.id === id)
    if (char) return char.nickname || char.realName || id
    const npc = getNPCById(id)
    if (npc) return npc.name
    return id
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

    const posts = await getAllPostsAsync()
    const foundPost = posts.find(p => p.id === postId)
    if (foundPost) {
      setPost(foundPost)
    }

    const postComments = await getPostComments(postId)
    setComments(postComments)
  }

  const handleLike = async () => {
    if (!postId) return
    const updatedPosts = await toggleLike(postId)
    const updatedPost = updatedPosts.find(p => p.id === postId)
    if (updatedPost) {
      setPost(updatedPost)
    }
  }

  // 🔥 同步论坛评论互动到主聊天记录
  const syncForumInteractionToChat = (
    characterId: string,
    content: string,
    type: 'sent' | 'received',
    contextInfo: string
  ) => {
    if (!characterId || characterId === 'user') return

    const msg: Message = {
      id: Date.now(),
      type,
      content,
      aiReadableContent: `[论坛评论互动] ${contextInfo}: ${content}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      source: 'dm'  // 标记为论坛来源
    }

    addMessage(characterId, msg)
    console.log(`🔄 [论坛互动同步] ${type === 'sent' ? '用户->AI' : 'AI->用户'}: ${content.slice(0, 30)}...`)
  }

  // 点击回复按钮，设置回复目标
  const handleReplyClick = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName })
    setNewComment(`@${authorName} `)
  }

  // 添加评论或回复到待发送列表（不触发AI，等点纸飞机）
  const addPendingReply = async () => {
    if (!newComment.trim() || !postId) return

    // 如果是回复某人
    if (replyingTo) {
      const content = newComment.replace(new RegExp(`^@${replyingTo.name}\\s*`), '').trim()
      if (!content) return

      // 添加到待发送列表
      const newPending = {
        id: `pending-${Date.now()}`,
        commentId: replyingTo.id,
        targetName: replyingTo.name,
        content,
        isReply: true
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

      console.log(`📝 添加待发送回复: @${newPending.targetName}: ${content}`)
    } else {
      // 直接发表一级评论 - 也加入待发送列表
      const content = newComment.trim()

      // 添加到待发送列表（一级评论没有targetName）
      const newPending = {
        id: `pending-${Date.now()}`,
        commentId: '',  // 一级评论没有commentId
        targetName: post?.npcId ? (getNPCById(post.npcId)?.name || '楼主') : '楼主',
        content,
        isReply: false
      }
      setPendingReplies(prev => [...prev, newPending])

      // 保存用户评论到数据库
      await addComment(
        postId,
        'user',
        userInfo.nickname || userInfo.realName || '我',
        userInfo.avatar || '/default-avatar.png',
        content
      )

      console.log(`📝 添加待发送评论: ${content}`)
    }

    // 刷新评论
    const updatedComments = await getPostComments(postId)
    setComments(updatedComments)

    // 更新帖子评论数
    if (post) {
      const updatedPosts = await getAllPostsAsync()
      const targetPost = updatedPosts.find((p: ForumPost) => p.id === postId)
      if (targetPost) {
        // 🔥 计算总评论数：主楼 + 所有楼中楼
        const totalComments = updatedComments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)
        targetPost.comments = totalComments
        await savePosts(updatedPosts)
      }
    }

    setNewComment('')
    setReplyingTo(null)

    // 滚动到底部
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
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

      // 构建所有待回复的内容（明确标注被@的人）
      const repliesText = pendingReplies.map(r => `用户回复「${r.targetName}」说：${r.content}`).join('\n')

      // 构建当前评论区状态（完整内容，不截断）
      const existingCommentsText = latestComments.slice(0, 10).map(c => {
        let text = `[主楼] ${c.authorName}：${c.content}`
        if (c.replies && c.replies.length > 0) {
          text += '\n' + c.replies.slice(0, 5).map(r =>
            `  └ ${r.authorName} -> ${r.replyTo || c.authorName}：${r.content}`
          ).join('\n')
        }
        return text
      }).join('\n')

      // 检查哪些是AI角色（有完整人设）- 不截断
      const aiCharactersWithChat = await Promise.all(
        allCharacters.filter(c => c.personality).slice(0, 5).map(async c => {
          const name = c.nickname || c.realName || '未知'
          // 读取和这个角色的最近20条聊天记录
          const chatId = c.id
          const messages = loadMessages(chatId)
          const recentChat = messages.slice(-20).map(m => {
            const sender = m.type === 'sent' ? userInfo.nickname || '用户' : name
            return `${sender}: ${m.content?.slice(0, 100) || ''}`
          }).join('\n')

          return {
            name,
            personality: c.personality,
            isPublic: c.isPublicFigure,
            publicPersona: c.publicPersona,
            recentChat
          }
        })
      )

      const aiCharacterPrompt = aiCharactersWithChat.length > 0 ? `
## 🎭 AI角色（有人设，可能参与评论）
${aiCharactersWithChat.map(a => {
        let info = `**${a.name}**${a.isPublic ? '【公众人物】' : ''}`
        if (a.publicPersona) info += `\n- 网络形象：${a.publicPersona}`
        if (a.personality) info += `\n- 人设：${a.personality}`
        if (a.recentChat) info += `\n- 🔥 和用户的最近聊天记录：\n${a.recentChat}`
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

**⚠️ 最重要的规则：被@的人必须第一个回复！**
- 用户@了谁，那个人就要回复用户
- 如果用户@了"小李"，那"小李"必须回复，不能让"阿明"来回复
- 被@的人根据自己人设来回复（可以友好、可以怼回去、可以敷衍）

**回复风格选择：**
- 如果用户说了有价值的话 → 认真回复
- 如果用户杠精/无聊 → 可以敷衍、怼回去、或一句话带过
- 不能完全无视被@（除非是NPC网友，NPC可以不回）

**其他评论：**
- 围观网友的新评论（2-4条）
- 楼中楼继续讨论（1-2条）

**评论者类型：**
- NPC网友（70%）：路人甲、吃瓜群众、小李、阿明等随机网名
- AI角色（30%）：按人设语气说话

**输出格式（严格遵守）：**
[主楼] 网名：评论内容
[回复] 回复者 -> 被回复者：回复内容

**要求：**
- 每条5-50字，自然口语化
- AI角色符合人设，但可以选择无视不值得回复的评论
- 生成5-10条评论，自然就好，不要硬凑
- 直接输出，不要解释`

      const apiUrl = apiConfig.baseUrl.endsWith('/chat/completions')
        ? apiConfig.baseUrl
        : apiConfig.baseUrl.replace(/\/?$/, '/chat/completions')

      console.log('🟢 [批量AI回复] Prompt长度:', prompt.length, '字')
      console.log('🟢 [批量AI回复] 帖子内容长度:', post.content.length, '字')
      console.log('🟢 [批量AI回复] 待发送:', pendingReplies.map((r: any) => `${r.isReply ? '回复' : '评论'}: ${r.content.slice(0, 30)}`))
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
          temperature: 0.8,
          max_tokens: 100000  // 🔥 不限制token
        })
      })

      const data = await response.json()
      console.log('🟢 [批量AI回复] API响应:', data)
      console.log('🟢 [批量AI回复] choices:', data.choices)
      console.log('🟢 [批量AI回复] choices[0]:', data.choices?.[0])
      console.log('🟢 [批量AI回复] message:', data.choices?.[0]?.message)

      if (data.error) {
        console.error('❌ [批量AI回复] API错误:', data.error)
        setPendingReplies([])
        setIsSending(false)
        return
      }

      // 兼容不同API格式（包括思考模型）
      const message = data.choices?.[0]?.message
      let aiContent = message?.content?.trim()
        || data.choices?.[0]?.text?.trim()  // 某些API用text
        || data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()  // Gemini原生格式
        || ''

      // 🔥 如果content为空但有reasoning_content（思考模型），尝试从中提取评论
      if (!aiContent && message?.reasoning_content) {
        console.log('🟢 [批量AI回复] 从思考内容中提取...')
        // 尝试提取思考内容中的评论格式
        const reasoningContent = message.reasoning_content as string
        const lines = reasoningContent.split('\n')
        const commentLines = lines.filter((l: string) =>
          l.match(/^\[主楼\]/) || l.match(/^\[回复\]/) || l.match(/^[^:：]+[:：].+/)
        )
        if (commentLines.length > 0) {
          aiContent = commentLines.join('\n')
          console.log('🟢 [批量AI回复] 从思考中提取到:', commentLines.length, '条')
        }
      }

      console.log('🟢 [批量AI回复] 返回:', aiContent)

      if (!aiContent) {
        console.warn('⚠️ [批量AI回复] AI返回内容为空')
        // 仍然清空待发送列表，因为用户评论已经保存了
        setPendingReplies([])
        setIsSending(false)
        // 刷新评论
        const updatedComments = await getPostComments(postId)
        setComments(updatedComments)
        return
      }

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

          // 🔥 如果AI回复的是用户，同步到主聊天记录
          const userName = userInfo.nickname || userInfo.realName || '用户'
          if (replyToName === userName || replyToName === '用户' || replyToName === '我' || replyToName === '楼主') {
            const { character } = getCharacterInfo(authorName)
            if (character) {
              syncForumInteractionToChat(
                character.id,
                content,
                'received',
                `${authorName}在论坛评论区回复了用户`
              )
            }
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
            const { id, avatar, character } = getCharacterInfo(responderName)
            await addReply(pending.commentId, id, responderName, avatar, replyContent, userInfo.nickname || '我')
            console.log(`✅ ${responderName} 回复了你: ${replyContent}`)

            // 🔥 同步到主聊天记录
            if (character) {
              syncForumInteractionToChat(
                character.id,
                replyContent,
                'received',
                `${responderName}在论坛评论区回复了用户`
              )
            }
          }
        }
      }

      // 清空待发送列表
      setPendingReplies([])

      // 刷新评论
      const updatedComments = await getPostComments(postId)
      setComments(updatedComments)

      // 更新帖子评论数
      const allPosts = await getAllPostsAsync()
      const currentPost = allPosts.find(p => p.id === postId)
      if (currentPost) {
        // 🔥 计算总评论数：主楼 + 所有楼中楼
        const totalComments = updatedComments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)
        currentPost.comments = totalComments
        await savePosts(allPosts)
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
      {/* 顶部导航 - 玻璃拟态 */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <StatusBar />
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -m-2 active:opacity-60 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">正文</h1>
          <div className="flex items-center gap-2">
            {post.npcId === 'user' && (
              <button
                onClick={async () => {
                  if (confirm('确定要删除这条帖子吗？')) {
                    const posts = await getAllPostsAsync()
                    const newPosts = posts.filter((p: ForumPost) => p.id !== postId)
                    await savePosts(newPosts)
                    navigate(-1)
                  }
                }}
                className="p-2 -m-2 text-gray-500 hover:text-red-500 active:opacity-60 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button className="p-2 -m-2 text-gray-500 hover:text-gray-900 active:opacity-60 transition-colors">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* 帖子和评论 */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* 用户帖子内容 */}
        <div className="bg-white pb-4">
          <div className="flex items-start gap-3 px-4 py-4">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {authorName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[15px] text-[#333]">{authorName}</span>
                  {characters.find(c => c.id === post.npcId)?.isPublicFigure && (
                    <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium align-middle">官方</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{formatTimeAgo(post.timestamp)}</span>
              </div>

              {/* 帖子正文 */}
              <div className="mb-3">
                {parsePostContent(post.content)}
              </div>

              {/* 显示标记的人 */}
              {post.taggedUsers && post.taggedUsers.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3 text-sm text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>提到了 {post.taggedUsers.map(id => `@${getCharacterName(id)}`).join(' ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 帖子操作按钮 - 简约风格 */}
          <div className="px-4 flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 group active:scale-95 transition-transform"
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600 group-hover:text-gray-900'}`} />
                <span className={`text-sm ${post.isLiked ? 'text-red-500' : 'text-gray-600'}`}>
                  {post.likes > 0 ? post.likes : '赞'}
                </span>
              </button>
              <button className="flex items-center gap-1.5 group active:scale-95 transition-transform">
                <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                <span className="text-sm text-gray-600">
                  {comments.length > 0 ? comments.length : '评论'}
                </span>
              </button>
              <button className="flex items-center gap-1.5 group active:scale-95 transition-transform">
                <Share2 className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                <span className="text-sm text-gray-600">分享</span>
              </button>
            </div>
          </div>
        </div>

        {/* 评论区标题 */}
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 sticky top-0 z-0">
          <span className="font-bold text-sm text-gray-600">全部评论 {comments.length}</span>
        </div>

        {/* 评论列表 - 微博/贴吧风格 */}
        <div className="pb-20">
          {comments.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {[...comments].sort((a, b) => b.timestamp - a.timestamp).map((comment) => {
                const isNew = Date.now() - comment.timestamp < 5 * 60 * 1000
                return (
                  <div key={comment.id} className={`px-4 py-3 ${isNew ? 'bg-blue-50/30' : 'bg-white'}`}>
                    {/* 主楼评论 */}
                    <div className="flex items-start gap-3">
                      {/* 头像 */}
                      {comment.authorAvatar && comment.authorAvatar !== '/default-avatar.png' ? (
                        <img src={comment.authorAvatar} alt={comment.authorName} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0">
                          {comment.authorName[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[14px] text-[#333]">{comment.authorName}</span>
                            {characters.find(c => c.id === comment.authorId)?.isPublicFigure && (
                              <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium align-middle">官方</span>
                            )}
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-[15px] text-[#333] break-words leading-relaxed mb-2">
                          <EmojiContentRenderer content={comment.content} emojiSize={20} />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                          <span>{formatTimeAgo(comment.timestamp)}</span>
                          {comment.likes > 0 && <span>{comment.likes} 赞</span>}
                          <button
                            className="font-medium text-gray-500 hover:text-blue-600"
                            onClick={() => handleReplyClick(comment.id, comment.authorName)}
                          >
                            回复
                          </button>
                        </div>

                        {/* 楼中楼回复 - 灰色背景块 */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="text-[14px] leading-relaxed">
                                <span className="font-bold text-[#333]">{reply.authorName}</span>
                                {reply.replyTo && (
                                  <span className="text-gray-500 mx-1">回复</span>
                                )}
                                {reply.replyTo && (
                                  <span className="font-bold text-[#333]">{reply.replyTo}</span>
                                )}
                                <span className="text-[#333]">：</span>
                                <span className="text-[#333]">
                                  <EmojiContentRenderer content={reply.content} emojiSize={18} />
                                </span>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-400">{formatTimeAgo(reply.timestamp)}</span>
                                  <button
                                    className="text-xs text-gray-500 hover:text-blue-600"
                                    onClick={() => handleReplyClick(comment.id, reply.authorName)}
                                  >
                                    回复
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">还没有评论，快来抢沙发~</p>
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* 底部评论输入框 - 悬浮设计 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {/* 待发送列表提示 */}
        {pendingReplies.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-blue-50 px-4 py-2 text-xs text-blue-600 flex items-center justify-between border-t border-blue-100">
            <span>
              {pendingReplies.length} 条评论待发送...
              {isSending && <span className="ml-2 animate-pulse">正在通知大家...</span>}
            </span>
            {!isSending && (
              <button
                onClick={() => setPendingReplies([])}
                className="text-blue-400 hover:text-blue-600"
              >
                清空
              </button>
            )}
          </div>
        )}

        {/* 回复提示 */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-t-lg text-xs text-gray-500 mb-2">
            <span>回复 @{replyingTo.name}</span>
            <button onClick={() => {
              setReplyingTo(null)
              setNewComment('')
            }}>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1 bg-gray-100 rounded-[20px] px-4 py-2 flex items-center">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? `回复 ${replyingTo.name}...` : "说点什么..."}
              className="flex-1 bg-transparent border-none outline-none text-sm max-h-24 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addPendingReply()
                }
              }}
            />
          </div>

          {/* 发送按钮 - 纸飞机图标 */}
          <button
            onClick={pendingReplies.length > 0 ? handleSendAll : addPendingReply}
            disabled={(!newComment.trim() && pendingReplies.length === 0) || isSending}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${(newComment.trim() || pendingReplies.length > 0) && !isSending
              ? 'bg-blue-500 text-white shadow-md active:scale-95'
              : 'bg-gray-100 text-gray-400'
              }`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : pendingReplies.length > 0 ? (
              <div className="relative">
                <Send className="w-5 h-5 -ml-0.5 mt-0.5 -rotate-45" />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center border border-white">
                  {pendingReplies.length}
                </span>
              </div>
            ) : (
              <Send className="w-5 h-5 -ml-0.5 mt-0.5 -rotate-45" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstagramPostDetail
