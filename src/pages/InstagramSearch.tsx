import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Hash, Plus, X, Search, RefreshCw, Crown } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import InstagramLayout from '../components/InstagramLayout'
import { apiService } from '../services/apiService'
import { getAllPostsAsync, savePosts, getAllNPCs, saveNPCs, cleanupNPCStorage } from '../utils/forumNPC'
import { getAllCharacters } from '../utils/characterManager'

interface Topic {
  id: string
  name: string
  posts: number
  trending: boolean
  category: string
  hotScore?: number // 热度值
  members?: number // 成员数
  isOwner?: boolean // 是否是群主
  description?: string // 话题描述
  rules?: string[] // 群主设置的规则
  linkedCharacterId?: string // 关联的角色ID
  linkedCharacterName?: string // 关联的角色名
  worldContext?: string // 角色的世界背景
}

const TOPICS_KEY = 'instagram_topics'

// 获取话题列表
function getStoredTopics(): Topic[] {
  const stored = localStorage.getItem(TOPICS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return getDefaultTopics()
    }
  }
  return getDefaultTopics()
}

// 保存话题列表
function saveTopics(topics: Topic[]) {
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics))
}

// 默认话题
function getDefaultTopics(): Topic[] {
  return [
    { id: '1', name: '日常生活', posts: 1234, trending: true, category: '推荐', hotScore: 985000 },
    { id: '2', name: '美食分享', posts: 2567, trending: true, category: '推荐', hotScore: 876000 },
    { id: '3', name: '旅行vlog', posts: 3456, trending: false, category: '推荐', hotScore: 765000 },
    { id: '4', name: '摄影', posts: 4321, trending: true, category: '推荐', hotScore: 654000 },
    { id: '5', name: '健身打卡', posts: 1890, trending: false, category: '生活', hotScore: 543000 },
    { id: '6', name: '读书笔记', posts: 2234, trending: false, category: '生活', hotScore: 432000 },
    { id: '7', name: '穿搭分享', posts: 3567, trending: true, category: '时尚', hotScore: 321000 },
    { id: '8', name: '数码测评', posts: 1567, trending: false, category: '科技', hotScore: 210000 },
  ]
}

const InstagramSearch = () => {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<Topic[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [topicName, setTopicName] = useState('')
  const [topicDesc, setTopicDesc] = useState('')
  const [topicRules, setTopicRules] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [availableCharacters, setAvailableCharacters] = useState<{id: string, realName: string, avatar?: string, worldBook?: string}[]>([])
  const [linkedCharacter, setLinkedCharacter] = useState<{id: string, realName: string, worldBook?: string} | null>(null)

  useEffect(() => {
    setTopics(getStoredTopics())
    // 加载角色列表
    getAllCharacters().then(chars => {
      setAvailableCharacters(chars.map(c => ({ 
        id: c.id, 
        realName: c.realName, 
        avatar: c.avatar,
        worldBook: (c as any).worldBook || (c as any).background || ''
      })))
    })
  }, [])

  // 创建话题并生成帖子
  const handleCreateTopic = async () => {
    // ... (保持原有的创建逻辑不变)
    if (!topicName.trim()) return

    // 先清理localStorage，避免爆掉
    cleanupNPCStorage()

    setIsGenerating(true)
    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (!apiConfig) {
        alert('没有可用的API配置')
        setIsGenerating(false)
        return
      }

      // 获取所有角色，检查话题是否涉及公众人物
      const allChars = await getAllCharacters()
      const topicText = `${topicName} ${topicDesc || ''}`
      const mentionedPublicFigures = allChars.filter(c =>
        c.isPublicFigure &&
        (topicText.includes(c.nickname || '') || topicText.includes(c.realName))
      )

      // 构建公众人物说明（包含完整人设）
      const publicFigurePrompt = mentionedPublicFigures.length > 0 ? `
**话题涉及的公众人物（网友都认识他们）：**
${mentionedPublicFigures.map(pf => {
        const desc = []
        if (pf.publicPersona) desc.push(`网络形象：${pf.publicPersona}`)
        if (pf.personality) desc.push(`性格人设：${pf.personality}`)
        return `- ${pf.nickname || pf.realName}${desc.length > 0 ? '：' + desc.join('，') : ''}`
      }).join('\n')}

**公众人物互动规则：**
- 网友发帖时会针对这些公众人物发表看法
- 公众人物本人（${mentionedPublicFigures.map(pf => pf.nickname || pf.realName).join('、')}）也可能发帖回应
- **重要：公众人物的帖子必须完全符合他们的性格人设**
- 帖子可以是支持、反对、调侃、爆料、质疑等
` : ''

      // 🔷🔷🔷 创建话题日志 🔷🔷🔷
      console.log('\n' + '🔶'.repeat(30))
      console.log('🏷️ 创建话题 - 开始')
      console.log('🔶'.repeat(30))
      console.log('📝 话题名称:', topicName)
      console.log('📝 话题描述:', topicDesc || '无')
      console.log('👥 所有角色数量:', allChars.length)
      if (mentionedPublicFigures.length > 0) {
        console.log('🌟 检测到公众人物:')
        mentionedPublicFigures.forEach(pf => {
          console.log(`  - ${pf.nickname || pf.realName}`)
          console.log(`    网络形象: ${pf.publicPersona || '无'}`)
          console.log(`    性格人设: ${pf.personality || '无'}`)
        })
      } else {
        console.log('🌟 检测到公众人物: 无')
      }

      // 构建规则说明
      const rulesPrompt = topicRules.trim() ? `
**话题规则（社区主设定）：**
${topicRules.split('\n').map(r => `- ${r.trim()}`).filter(r => r !== '- ').join('\n')}
` : ''

      // 构建世界背景说明（如果关联了角色）
      let worldContextPrompt = ''
      if (linkedCharacter) {
        console.log('🔗 关联角色:', linkedCharacter.realName)
        console.log('📖 世界书内容:', linkedCharacter.worldBook ? linkedCharacter.worldBook.slice(0, 200) + '...' : '无')
        if (linkedCharacter.worldBook) {
          worldContextPrompt = `
**【重要】世界背景设定（所有帖子和评论必须100%符合这个世界观）：**
${linkedCharacter.worldBook}

**严格要求**：所有发帖者和评论者都必须遵守上面的世界观设定，不得出现任何违背世界观的内容。
`
        }
      }

      // 读取用户和关联角色的聊天记录
      let chatHistoryPrompt = ''
      if (linkedCharacter) {
        try {
          const { loadMessages } = await import('../utils/simpleMessageManager')
          const messages = await loadMessages(linkedCharacter.id)
          if (messages && messages.length > 0) {
            const recentMessages = messages.slice(-15).map(m => {
              const sender = m.type === 'sent' ? '用户' : linkedCharacter.realName
              return `${sender}: ${m.content?.slice(0, 80) || ''}${m.content && m.content.length > 80 ? '...' : ''}`
            }).join('\n')
            chatHistoryPrompt = `
**用户和${linkedCharacter.realName}的最近聊天记录（角色了解用户）：**
${recentMessages}
`
          }
        } catch (e) {
          console.error('读取聊天记录失败:', e)
        }
      }

      // 获取用户信息
      const { getUserInfo } = await import('../utils/userUtils')
      const userInfo = getUserInfo()
      const userName = userInfo.nickname || userInfo.realName || '用户'

      const prompt = `你是一个社交平台内容生成器。现在有一个热门话题：

**话题名称：**#${topicName}
**话题描述：**${topicDesc || topicName}
**话题创建者：**${userName}（用户本人创建了这个话题）
${worldContextPrompt}${rulesPrompt}${publicFigurePrompt}${chatHistoryPrompt}

**首先，请评估这个话题的规模，输出以下信息（第一行）：**
[话题数据] 成员数:XXXX|热度:XXXXX

成员数范围：500-50000（根据话题热度决定）
热度范围：10000-1000000（根据话题受欢迎程度决定）

**然后生成10-12条帖子，每条帖子带5-10条评论（包含楼中楼回复）。**

**要求：**
- 网名2-4个字（如：小李、阿明、路人甲等）${mentionedPublicFigures.length > 0 ? `\n- 公众人物本人（${mentionedPublicFigures.map(pf => pf.nickname || pf.realName).join('、')}）**最多发1-2条帖子**，不要太活跃，大部分应该是普通网友发的` : ''}
- 帖子内容20-150字，评论5-50字
- 可以有不同观点：支持、反对、调侃、提问等
- 帖子内容要符合话题主题${topicRules.trim() ? '，并遵守社区主设定的规则' : ''}${linkedCharacter?.worldBook ? '\n- **重要：所有内容必须符合上面的世界背景设定**' : ''}
- **每条帖子要标注点赞数**：公众人物发的帖子点赞应该很高（几万到几百万），普通人的帖子点赞较少
- **重要：必须生成至少10条帖子，每条帖子必须有至少5条评论**
- **重要：大部分帖子（8-10条）应该是随机网名的NPC发的，公众人物最多发1-2条**${linkedCharacter ? `\n- **${linkedCharacter.realName}知道这个话题是${userName}创建的，发言要考虑和用户的关系**` : ''}

**输出格式：**
[话题数据] 成员数:3500|热度:125000

===帖子1===
发帖人|帖子内容|点赞数
[评论] 网名：评论内容
[评论] 网名：评论内容
[回复] 网名 -> 被回复人：回复内容
[评论] 网名：评论内容
[回复] 网名 -> 被回复人：回复内容
===帖子2===
发帖人|帖子内容|点赞数
[评论] 网名：评论内容
...

**示例：**
[话题数据] 成员数:3500|热度:125000

===帖子1===
小李|这个话题太有意思了，大家怎么看？|156
[评论] 阿明：确实挺有意思的
[回复] 路人甲 -> 阿明：同意！
[评论] 网友A：我有不同看法
[回复] 小李 -> 网友A：说说你的想法
[评论] 吃瓜群众：围观中
===帖子2===
某明星|我来回应一下大家的质疑...|328000
[评论] 小张：说得好！

直接输出，不要其他内容。`

      // 打印完整Prompt
      console.log('============================================================')
      console.log('📋 创建话题 - 完整Prompt:')
      console.log('============================================================')
      console.log(prompt)
      console.log('============================================================')

      const apiUrl = apiConfig.baseUrl.endsWith('/chat/completions')
        ? apiConfig.baseUrl
        : apiConfig.baseUrl.replace(/\/?$/, '/chat/completions')

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9
        })
      })

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      // 打印AI返回内容
      console.log('============================================================')
      console.log('🤖 创建话题 - AI返回内容:')
      console.log('============================================================')
      console.log(content)
      console.log('============================================================')

      // 解析话题数据（成员数和热度）
      let aiMembers = Math.floor(Math.random() * 5000) + 1000 // 默认值
      let aiHotScore = Math.floor(Math.random() * 100000) + 50000 // 默认值
      const topicDataMatch = content.match(/\[话题数据\]\s*成员数[:：](\d+)\s*\|\s*热度[:：](\d+)/)
      if (topicDataMatch) {
        aiMembers = parseInt(topicDataMatch[1])
        aiHotScore = parseInt(topicDataMatch[2])
        console.log(`📊 AI生成话题数据: 成员数=${aiMembers}, 热度=${aiHotScore}`)
      }

      // 解析帖子和评论（新格式：===帖子N=== 分割）
      const postBlocks = content.split(/===帖子\d+===/).filter((b: string) => b.trim())
      const currentPosts = await getAllPostsAsync()
      const existingNPCs = getAllNPCs()
      const baseTimestamp = Date.now()
      const createdPostIds: string[] = []

      // 导入评论数据库
      const { addComment, addReply } = await import('../utils/forumCommentsDB')

      for (let index = 0; index < postBlocks.length; index++) {
        const block = postBlocks[index].trim()
        // 跳过包含话题数据的块（第一块通常是）
        if (block.includes('[话题数据]') || block.includes('成员数:') || block.includes('热度:')) {
          continue
        }
        const lines = block.split('\n').filter((l: string) => l.trim() && !l.includes('[话题数据]'))
        if (lines.length === 0) continue

        // 第一行是帖子：发帖人|帖子内容|点赞数（点赞数可选）
        const postLine = lines[0]
        const postMatch = postLine.match(/^(.+?)\|(.+?)(?:\|(\d+))?$/)
        if (!postMatch) continue

        const posterName = postMatch[1].trim()
        const postContent = postMatch[2].trim()
        const aiGeneratedLikes = postMatch[3] ? parseInt(postMatch[3]) : null

        // 检查是否是公众人物
        const publicFigure = allChars.find(c =>
          c.nickname === posterName || c.realName === posterName
        )

        // 创建NPC
        let npcId = `topic-npc-${baseTimestamp}-${index}`
        let npcAvatar = '/default-avatar.png'

        if (publicFigure) {
          npcId = publicFigure.id
          npcAvatar = publicFigure.avatar || '/default-avatar.png'
          console.log(`🌟 公众人物 ${posterName} 发帖`)
        }

        if (!existingNPCs.find(n => n.name === posterName)) {
          existingNPCs.push({
            id: npcId,
            name: posterName,
            avatar: npcAvatar,
            bio: publicFigure ? (publicFigure.publicPersona || '公众人物') : '论坛活跃用户',
            followers: Math.floor(Math.random() * 500) + 100
          })
        }

        // 创建帖子
        const postId = `topic-post-${baseTimestamp}-${index}`
        createdPostIds.push(postId)

        // 解析评论（从第二行开始）
        const commentLines = lines.slice(1)
        const nameToCommentId = new Map<string, string>()
        let commentCount = 0

        for (const line of commentLines) {
          // 匹配主评论：[评论] 网名：内容
          const commentMatch = line.match(/^\[评论\]\s*(.+?)[:：](.+)$/)
          if (commentMatch) {
            const commenterName = commentMatch[1].trim()
            const commentContent = commentMatch[2].trim()

            // 检查评论者是否是公众人物
            const commenterPF = allChars.find(c =>
              c.nickname === commenterName || c.realName === commenterName
            )
            const commenterId = commenterPF?.id || `topic-npc-${baseTimestamp}-${index}-c${commentCount}`
            const commenterAvatar = commenterPF?.avatar || '/default-avatar.png'

            const comment = await addComment(
              postId, commenterId, commenterName, commenterAvatar, commentContent,
              Math.floor(Math.random() * 50) + 5,
              !!commenterPF?.isPublicFigure
            )
            nameToCommentId.set(commenterName, comment.id)
            commentCount++
            continue
          }

          // 匹配回复：[回复] 网名 -> 被回复人：内容
          const replyMatch = line.match(/^\[回复\]\s*(.+?)\s*->\s*(.+?)[:：](.+)$/)
          if (replyMatch) {
            const replierName = replyMatch[1].trim()
            const replyToName = replyMatch[2].trim()
            const replyContent = replyMatch[3].trim()

            const targetCommentId = nameToCommentId.get(replyToName)
            if (targetCommentId) {
              const replierPF = allChars.find(c =>
                c.nickname === replierName || c.realName === replierName
              )
              const replierId = replierPF?.id || `topic-npc-${baseTimestamp}-${index}-r${commentCount}`
              const replierAvatar = replierPF?.avatar || '/default-avatar.png'

              await addReply(
                targetCommentId, replierId, replierName, replierAvatar,
                replyContent, replyToName,
                Math.floor(Math.random() * 20) + 1
              )
              nameToCommentId.set(replierName, targetCommentId)
              commentCount++
            }
          }
        }

        // 创建帖子 - 优先使用AI生成的点赞数
        const fallbackLikes = publicFigure?.isPublicFigure
          ? Math.floor(Math.random() * 50000) + 10000  // 公众人物默认：1万-6万
          : Math.floor(Math.random() * 100) + 10       // 普通人默认：10-110

        const newPost = {
          id: postId,
          npcId,
          content: `#${topicName} ${postContent}`,
          images: 0,
          likes: aiGeneratedLikes ?? fallbackLikes,  // 优先用AI生成的
          comments: commentCount,
          time: '刚刚',
          timestamp: baseTimestamp - index * 60000,
          isLiked: false,
          topicId: topicName
        }
        currentPosts.unshift(newPost)
        console.log(`📝 帖子 ${index + 1}: ${posterName} | 评论数: ${commentCount}`)
      }

      saveNPCs(existingNPCs)
      await savePosts(currentPosts)

      console.log('📝 创建的帖子ID:', createdPostIds)

      // 创建新话题（用户是群主）
      const rulesArray = topicRules.trim() 
        ? topicRules.split('\n').map(r => r.trim()).filter(r => r)
        : ['请友善交流，禁止人身攻击', '禁止发布违法违规内容', '禁止恶意广告和刷屏']
      
      const newTopic: Topic = {
        id: `topic-${Date.now()}`,
        name: topicName.trim(),
        posts: createdPostIds.length,
        trending: aiHotScore > 500000, // 热度超过50万就是热门
        category: '自定义',
        hotScore: aiHotScore, // 使用AI生成的热度
        members: aiMembers, // 使用AI生成的成员数
        isOwner: true,
        description: topicDesc.trim() || undefined,
        rules: rulesArray,
        linkedCharacterId: linkedCharacter?.id,
        linkedCharacterName: linkedCharacter?.realName,
        worldContext: linkedCharacter?.worldBook
      }

      const updatedTopics = [newTopic, ...topics]
      saveTopics(updatedTopics)
      setTopics(updatedTopics)

      setShowCreateModal(false)
      setLinkedCharacter(null) // 重置关联角色
      setTopicName('')
      setTopicDesc('')
      setTopicRules('')
      console.log(`✨ 创建话题 #${topicName} 成功，生成${createdPostIds.length}条帖子（含评论）`)

      // 评论生成完成后再跳转到话题详情
      navigate(`/instagram/topic/${encodeURIComponent(newTopic.name)}`)
    } catch (error) {
      console.error('创建话题失败:', error)
      alert('创建失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatHotScore = (score?: number) => {
    if (!score) return '50.2w'
    if (score >= 10000) {
      return `${(score / 10000).toFixed(1)}w`
    }
    return score.toString()
  }

  // 刷新话题列表（AI生成新话题）
  const handleRefreshTopics = async () => {
    setIsRefreshing(true)
    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (!apiConfig) {
        alert('没有可用的API配置')
        setIsRefreshing(false)
        return
      }

      const prompt = `你是一个社交平台话题生成器。请生成8个当前热门话题，包含各种类型：

**要求：**
- 话题名称简短，2-6个字
- 包含：日常、美食、旅行、娱乐、科技、游戏、运动、学习等类型
- 每个话题要有贴子数（100-9999）和热度值（100000-999999）
- 随机标记哪些是热门（trending）

**输出格式（JSON数组）：**
[
  {"name": "话题名", "posts": 1234, "hotScore": 500000, "trending": true, "category": "类别"},
  ...
]

直接输出JSON，不要其他内容。`

      const apiUrl = apiConfig.baseUrl.endsWith('/chat/completions')
        ? apiConfig.baseUrl
        : apiConfig.baseUrl.replace(/\/?$/, '/chat/completions')

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9
        })
      })

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      // 解析JSON
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        const newTopicsData = JSON.parse(jsonMatch[0])
        const newTopics: Topic[] = newTopicsData.map((t: any, idx: number) => ({
          id: `topic-${Date.now()}-${idx}`,
          name: t.name,
          posts: t.posts || Math.floor(Math.random() * 5000) + 500,
          trending: t.trending || false,
          category: t.category || '推荐',
          hotScore: t.hotScore || Math.floor(Math.random() * 500000) + 100000
        }))

        // 保留用户创建的话题（isOwner）
        const userTopics = topics.filter(t => t.isOwner)
        const finalTopics = [...userTopics, ...newTopics]
        
        saveTopics(finalTopics)
        setTopics(finalTopics)
        console.log('✨ 刷新话题成功，生成', newTopics.length, '个新话题')
      }
    } catch (error) {
      console.error('刷新话题失败:', error)
      alert('刷新失败，请重试')
    } finally {
      setIsRefreshing(false)
      setShowActionMenu(false)
    }
  }

  return (
    <InstagramLayout showHeader={false}>
      <div className="h-full flex flex-col bg-white font-sans text-[#333]">
        {/* 顶部搜索栏 */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <StatusBar />
          <div className="px-4 pb-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="搜索话题、用户..."
              />
            </div>
          </div>
        </div>

        {/* 热门榜单 */}
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-500 fill-red-500" />
                全站热榜
              </h2>
              <span className="text-xs text-gray-400">每10分钟更新</span>
            </div>

            <div className="space-y-1">
              {topics.filter(t => t.name.includes(searchQuery)).map((topic, index) => (
                <div
                  key={topic.id}
                  onClick={() => navigate(`/instagram/topic/${encodeURIComponent(topic.name)}`)}
                  className="flex items-center py-3 px-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                >
                  {/* 排名数字 */}
                  <div className={`w-8 text-center font-bold text-lg italic mr-2 ${
                    index === 0 ? 'text-red-500' :
                    index === 1 ? 'text-orange-500' :
                    index === 2 ? 'text-yellow-500' :
                    'text-gray-400 text-base not-italic'
                  }`}>
                    {index + 1}
                  </div>

                  {/* 话题内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        #{topic.name}
                      </h3>
                      {topic.isOwner && (
                        <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      )}
                      {topic.trending && (
                        <span className="text-[10px] px-1 bg-red-50 text-red-500 rounded font-medium">
                          爆
                        </span>
                      )}
                      {topic.category === '推荐' && !topic.trending && (
                        <span className="text-[10px] px-1 bg-blue-50 text-blue-500 rounded font-medium">
                          荐
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {topic.isOwner ? '我创建的 · ' : ''}{topic.posts.toLocaleString()} 讨论
                    </p>
                  </div>

                  {/* 热度值 */}
                  <div className="text-xs text-gray-400 font-medium w-16 text-right">
                    {formatHotScore(topic.hotScore)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 悬浮操作按钮 */}
        <div className="fixed bottom-24 right-6 z-20">
          {/* 菜单 */}
          {showActionMenu && (
            <div className="absolute bottom-14 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-2 min-w-[140px] animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={handleRefreshTopics}
                disabled={isRefreshing}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium text-gray-900">{isRefreshing ? '刷新中...' : '刷新话题'}</span>
              </button>
              <button
                onClick={() => {
                  setShowActionMenu(false)
                  setShowCreateModal(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">创建话题</span>
              </button>
            </div>
          )}
          
          {/* 主按钮 */}
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            className={`w-12 h-12 bg-black rounded-full shadow-lg shadow-black/20 flex items-center justify-center text-white active:scale-90 transition-all hover:scale-105 ${showActionMenu ? 'rotate-45' : ''}`}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 点击遮罩关闭菜单 */}
        {showActionMenu && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowActionMenu(false)} 
          />
        )}

        {/* 创建话题模态框 */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-sm font-bold text-gray-900">发起新话题</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1">
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
              
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">话题名称</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-black focus-within:ring-1 focus-within:ring-black/5 transition-all">
                    <Hash className="w-4 h-4 text-gray-400 stroke-[2.5]" />
                    <input
                      type="text"
                      value={topicName}
                      onChange={(e) => setTopicName(e.target.value)}
                      placeholder="输入话题..."
                      className="flex-1 bg-transparent outline-none text-sm font-medium placeholder-gray-400"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">话题描述（可选）</label>
                  <textarea
                    value={topicDesc}
                    onChange={(e) => setTopicDesc(e.target.value)}
                    placeholder="简单介绍一下话题主题..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none text-sm resize-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all placeholder-gray-400"
                    rows={2}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    社区规则（可选）
                    <span className="font-normal text-gray-400 ml-1">每行一条</span>
                  </label>
                  <textarea
                    value={topicRules}
                    onChange={(e) => setTopicRules(e.target.value)}
                    placeholder="例如：&#10;禁止人身攻击&#10;禁止发布广告&#10;保持友善交流"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none text-sm resize-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all placeholder-gray-400"
                    rows={3}
                    maxLength={300}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">不填则使用默认规则</p>
                </div>

                {/* 关联角色 */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    关联角色（可选）
                    <span className="font-normal text-gray-400 ml-1">话题将基于角色的世界背景</span>
                  </label>
                  {linkedCharacter ? (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {linkedCharacter.realName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{linkedCharacter.realName}</p>
                          <p className="text-[10px] text-gray-400">已关联</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setLinkedCharacter(null)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => {
                        const char = availableCharacters.find(c => c.id === e.target.value)
                        if (char) setLinkedCharacter(char)
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none text-sm focus:border-black focus:ring-1 focus:ring-black/5 transition-all text-gray-500"
                    >
                      <option value="">选择一个角色...</option>
                      {availableCharacters.map((char) => (
                        <option key={char.id} value={char.id}>{char.realName}</option>
                      ))}
                    </select>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">关联后，话题内容会围绕角色的世界观生成</p>
                </div>

                <button
                  onClick={handleCreateTopic}
                  disabled={!topicName.trim() || isGenerating}
                  className="w-full bg-black text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all hover:shadow-lg hover:shadow-black/20 mt-2"
                >
                  {isGenerating ? '正在生成内容...' : '立即创建'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstagramLayout>
  )
}

export default InstagramSearch
