import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Send, X, Trash2, MoreHorizontal, Share2 } from 'lucide-react'
import { getAllPostsAsync, toggleLike, getNPCById, savePosts } from '../utils/forumNPC'
import { getPostComments, addReply, addComment } from '../utils/forumCommentsDB'
import { getUserInfoWithAvatar, type UserInfo } from '../utils/userUtils'
import { apiService } from '../services/apiService'
import { getAllCharacters } from '../utils/characterManager'
import { addMessage, loadMessages } from '../utils/simpleMessageManager'
import type { Message } from '../types/chat'
import { getRandomMemes, getMemeSettings } from '../utils/memeRetrieval'
import StatusBar from '../components/StatusBar'
import CommentContentRenderer from '../components/CommentContentRenderer'
import type { ForumPost } from '../utils/forumNPC'
import type { Comment } from '../utils/forumCommentsDB'

const InstagramPostDetail = () => {
  const navigate = useNavigate()
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null)
  const [pendingReplies, setPendingReplies] = useState<{ id: string, commentId: string, targetName: string, content: string, isReply: boolean }[]>([])
  const [isSending, setIsSending] = useState(false)
  const [characters, setCharacters] = useState<any[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: '', realName: '' })
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
    return new Date(timestamp).toLocaleDateString()
  }

  useEffect(() => {
    loadPostAndComments()
  }, [postId])

  const loadPostAndComments = async () => {
    if (!postId) return

    // 加载用户信息（包含头像）
    const info = await getUserInfoWithAvatar()
    setUserInfo(info)

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

      // 获取梗推荐
      const memeSettings = getMemeSettings()
      let memesPrompt = ''
      if (memeSettings.enabled) {
        const recommendedMemes = getRandomMemes(memeSettings.maxRecommend || 5)
        if (recommendedMemes.length > 0) {
          memesPrompt = `\n## 🔥 当前网络热梗（可自然融入评论）\n${recommendedMemes.map(m => `「${m.name}」- ${m.description}`).join('\n')}\n（不是必须用，自然就好）\n`
          console.log('🔥 评论回复推荐梗:', recommendedMemes.map(m => m.name))
        }
      }

      const prompt = `你是帖子评论区的导演，用户刚刚在评论区互动了，请生成后续的评论生态。

## 📱 帖子内容
楼主「${userInfo.nickname || '我'}」发帖：
${post.content}

## 💬 当前评论区状态
${existingCommentsText || '(暂无评论)'}

## 🆕 用户刚发的回复
${repliesText}
${aiCharacterPrompt}${memesPrompt}
## 🎯 你要生成的评论

**⚠️ 重要规则：被明确@到的人「可以选择性地」回复，而不是必须回复。**
- 用户@了谁，优先考虑由那个人来回复；但如果这个人是公众人物/高冷人设，可以权衡人设和内容的价值，**只挑少数值得回复的@**，其余完全不理也可以
- 如果用户@了"小李"，通常由"小李"来回复；但如果内容很无聊/没有营养，可以一句极简官方回复，或者干脆不回，由路人网友来接话
- 被@的人根据自己人设来回复（可以友好、可以怼回去、可以敷衍、也可以只点个赞不说话——这种情况就不要生成文字回复）

**回复风格选择：**
- 如果用户说了有价值的话 → 可以认真回复一条
- 如果用户是杠精/无聊/普通粉丝 → 更倾向于冷处理：
  - 要么一句很短、很敷衍的回复
  - 要么完全不回复，让NPC网友去评论
- 公众人物/高冷角色整体出场频率要低，**不能给人“整天蹲在评论区陪粉聊天”的感觉**

**其他评论：**
- 围观网友的新评论（2-4条）
- 楼中楼继续讨论（1-2条）

**评论者类型与风格：**
- **NPC网友（70%）**：
  - 风格参考：表白墙/吐槽君/小红书/微博评论区
  - 网名：xxx表白墙、xxx日常、深夜xxx、xxxbot、吃瓜xxx
  - 语气：玩梗、吐槽、吃瓜、站队、@亲友围观
  - 比如："磕到了"、"这种建议分手"、"这是什么神仙"、"笑死我了"
- **AI角色（30%）**：按人设语气说话，尤其是公众人物，更多是偶尔出现点到为止

**输出格式（严格遵守）：**
[主楼] 网名：评论内容
[回复] 回复者 -> 被回复者：回复内容

**要求：**
- 每条5-50字，自然口语化，可以使用emoji
- AI角色必须符合人设：
  - 高冷/大明星/公众人物 → 少量发言、谨慎选择要回复的人
  - 普通熟人/朋友 → 可以稍微多回一点
- 生成5-10条评论，营造热闹的社区氛围
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
      <div className="h-screen bg-transparent flex items-center justify-center font-serif">
        <p className="text-[#8C8C8C] tracking-widest text-sm bg-white/40 px-4 py-2 rounded-full backdrop-blur-sm">此篇已佚</p>
      </div>
    )
  }

  const isUserPost = post.npcId === 'user'
  const npc = !isUserPost ? getNPCById(post.npcId) : null
  const authorName = isUserPost ? (userInfo.nickname || userInfo.realName || '我') : (npc?.name || '未知')
  const authorAvatar = isUserPost ? userInfo.avatar : getRealAvatar(post.npcId, npc?.avatar)

  return (
    <div className="h-screen bg-white flex flex-col font-sans text-[#262626] soft-page-enter" data-instagram>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-50">
        <StatusBar />
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="text-black hover:text-gray-600 transition-colors -ml-2 p-2 rounded-full hover:bg-gray-50"
          >
            <ArrowLeft className="w-6 h-6 stroke-[1.5]" />
          </button>
          <h1 className="text-sm font-bold text-gray-900 uppercase tracking-wide">帖子</h1>
          <div className="flex items-center gap-2">
            {post.npcId === 'user' && (
              <button
                onClick={async () => {
                  if (confirm('确认移除此篇？')) {
                    const posts = await getAllPostsAsync()
                    const newPosts = posts.filter((p: ForumPost) => p.id !== postId)
                    await savePosts(newPosts)
                    navigate(-1)
                  }
                }}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-50"
              >
                <Trash2 className="w-5 h-5 stroke-[1.5]" />
              </button>
            )}
            <button className="text-black hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 -mr-2">
              <MoreHorizontal className="w-6 h-6 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* 帖子和评论 */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* 用户帖子内容 */}
        <div className="pb-4 border-b border-gray-100">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-3 mb-3">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-10 h-10 rounded-full object-cover bg-gray-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-bold">
                  {authorName[0]}
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#262626]">{authorName}</span>
                  {(() => {
                    const char = characters.find(c => c.id === post.npcId)
                    if (!char?.isPublicFigure) return null
                    const savedLabel = localStorage.getItem(`public-label-${post.npcId}`)
                    const label = (savedLabel && savedLabel !== '__none__') ? savedLabel : 'OFFICIAL'
                    return (
                      <span className="text-[9px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-bold tracking-wide">
                        {label}
                      </span>
                    )
                  })()}
                </div>
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(post.timestamp)}
                </span>
              </div>
            </div>

            {/* 帖子正文 */}
            <div className="mb-3 text-[15px] text-[#262626] leading-relaxed whitespace-pre-wrap">
              <CommentContentRenderer content={post.content} emojiSize={18} />
            </div>

            {/* 图片显示 */}
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className={`grid gap-1 mb-4 rounded-lg overflow-hidden ${
                post.imageUrls.length === 1 ? 'grid-cols-1' :
                post.imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {post.imageUrls.slice(0, 9).map((url, index) => (
                  <div key={index} className={`relative overflow-hidden bg-gray-100 ${
                    post.imageUrls!.length === 1 ? 'aspect-[4/3]' : 'aspect-square'
                  }`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* 显示标记的人 */}
            {post.taggedUsers && post.taggedUsers.length > 0 && (
              <div className="flex items-center gap-1.5 mb-4 text-xs text-gray-500">
                <span>with {post.taggedUsers.map(id => `@${getCharacterName(id)}`).join(', ')}</span>
              </div>
            )}
          </div>

          {/* 帖子操作按钮 */}
          <div className="px-4 flex items-center gap-6">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 group"
            >
              <Heart className={`w-6 h-6 stroke-[1.5] transition-all ${post.isLiked ? 'text-red-500 fill-red-500 scale-110' : 'text-black group-hover:text-gray-600'}`} />
              <span className={`text-sm font-semibold ${post.isLiked ? 'text-red-500' : 'text-black'}`}>
                {post.likes > 0 ? post.likes : '赞'}
              </span>
            </button>
            <button className="flex items-center gap-2 group">
              <MessageCircle className="w-6 h-6 text-black group-hover:text-blue-600 stroke-[1.5] transition-colors" />
              <span className="text-sm font-semibold text-black group-hover:text-blue-600">
                {comments.length > 0 ? comments.length : '评论'}
              </span>
            </button>
            <button className="flex items-center gap-2 group">
              <Share2 className="w-6 h-6 text-black group-hover:text-green-600 stroke-[1.5] transition-colors" />
              <span className="text-sm font-semibold text-black group-hover:text-green-600">分享</span>
            </button>
          </div>
        </div>

        {/* 评论列表 - 极简风格 */}
        <div className="pb-24 px-4 pt-4">
          {comments.length > 0 ? (
            <div className="space-y-5">
              {[...comments].sort((a, b) => a.timestamp - b.timestamp).map((comment) => {
                return (
                  <div key={comment.id} className="group">
                    {/* 主楼评论 */}
                    <div className="flex items-start gap-3">
                      {comment.authorAvatar && comment.authorAvatar !== '/default-avatar.png' ? (
                        <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0 font-bold">
                          {comment.authorName[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-bold text-[#262626]">{comment.authorName}</span>
                            <span className="text-xs text-gray-400 font-medium">{formatTimeAgo(comment.timestamp)}</span>
                        </div>

                        <div className="text-sm text-[#262626] leading-relaxed mb-2 break-words">
                          <CommentContentRenderer content={comment.content} emojiSize={16} />
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                            onClick={() => handleReplyClick(comment.id, comment.authorName)}
                          >
                            回复
                          </button>
                          {comment.likes > 0 && <span className="text-xs text-gray-400 font-medium">{comment.likes} 赞</span>}
                        </div>

                        {/* 楼中楼回复 - 极简缩进 */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 pl-3 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2.5">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 mb-0.5">
                                    <span className="text-sm font-bold text-[#262626]">{reply.authorName}</span>
                                    <span className="text-xs text-gray-400 font-medium">{formatTimeAgo(reply.timestamp)}</span>
                                  </div>
                                  <div className="text-sm text-[#262626] leading-relaxed mb-1.5 break-words">
                                    <span className="text-blue-600 mr-1">@{reply.replyTo || comment.authorName}</span>
                                    <CommentContentRenderer content={reply.content} emojiSize={16} />
                                  </div>
                                  <button
                                    className="text-xs font-semibold text-gray-400 hover:text-gray-600"
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
              <p className="text-gray-400 text-sm">暂无评论</p>
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* 底部评论输入框 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 z-30">
        {/* 待发送列表预览 */}
        {pendingReplies.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {pendingReplies.map((reply) => (
              <div key={reply.id} className="flex-shrink-0 bg-gray-50 rounded-lg px-3 py-2 w-48 relative group border border-gray-100">
                <button
                  onClick={() => setPendingReplies(prev => prev.filter(p => p.id !== reply.id))}
                  className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
                <div className="text-[10px] text-gray-400 font-bold mb-0.5 truncate uppercase tracking-wider">
                  {reply.isReply ? `Reply to ${reply.targetName}` : 'Comment'}
                </div>
                <div className="text-xs text-gray-900 truncate font-medium">
                  {reply.content}
                </div>
              </div>
            ))}
            <button
              onClick={handleSendAll}
              disabled={isSending}
              className="flex-shrink-0 w-10 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={18} className="-ml-0.5 mt-0.5" />
              )}
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1 bg-gray-100 rounded-3xl px-4 py-2.5 flex items-center gap-2 focus-within:bg-gray-50 focus-within:ring-1 focus-within:ring-gray-200 transition-all">
            {replyingTo && (
              <span className="text-xs text-blue-600 font-bold whitespace-nowrap">
                @{replyingTo.name}
              </span>
            )}
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? "回复..." : "添加评论..."}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#262626] placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addPendingReply()
                }
              }}
            />
          </div>
          <button
            onClick={addPendingReply}
            disabled={!newComment.trim()}
            className="p-2.5 rounded-full text-blue-600 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 transition-colors"
          >
            发布
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstagramPostDetail
