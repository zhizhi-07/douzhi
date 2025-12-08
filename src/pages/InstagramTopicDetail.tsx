import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Send, MoreHorizontal, Hash, Shield, Users, Bell, Ban, X, MessageSquare } from 'lucide-react'
import { apiService } from '../services/apiService'
import StatusBar from '../components/StatusBar'
import InstagramLayout from '../components/InstagramLayout'
import { getAllPostsAsync, toggleLike, getNPCById } from '../utils/forumNPC'
import { getCurrentUserInfoWithAvatar } from '../utils/userUtils'
import type { ForumPost } from '../utils/forumNPC'

// 打开IndexedDB存储聊天记录
const openChatDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('topic_chat_db', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('topic_chats')) {
        db.createObjectStore('topic_chats', { keyPath: 'topicName' })
      }
    }
  })
}

// 渲染文本，把 #话题 变成蓝色
const renderTextWithHashtags = (text: string, key: string) => {
  const hashtagPattern = /#[\u4e00-\u9fa5a-zA-Z0-9_]+/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match

  while ((match = hashtagPattern.exec(text)) !== null) {
    // 前面的普通文本
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    // 话题标签（蓝色）
    parts.push(
      <span key={`${key}-tag-${match.index}`} className="text-blue-500">{match[0]}</span>
    )
    lastIndex = match.index + match[0].length
  }
  // 剩余文本
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

// 解析帖子内容
const parsePostContent = (content: string) => {
  const imagePattern = /[\[【](图片|照片|截图)[:：]([^\]】]+)[\]】]/g

  const hasImages = imagePattern.test(content)
  if (!hasImages) {
    return <p className="text-sm leading-loose text-[#4A4A4A] whitespace-pre-wrap font-light text-justify">{renderTextWithHashtags(content, 'main')}</p>
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
            {renderTextWithHashtags(text, `t-${lastIndex}`)}
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
          {renderTextWithHashtags(text, `e-${lastIndex}`)}
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

// 模拟生成社区数据
const getCommunityData = (name: string) => {
  // 基于名称生成的伪随机数
  const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const members = 1000 + (seed % 9000)
  const online = Math.floor(members * (0.05 + (seed % 10) / 100))
  
  const rules = [
    '禁止发布违规、广告信息',
    '文明交流，禁止人身攻击',
    '发帖请遵守社区规范',
    '转载请注明出处',
    '有问题请私信管理员'
  ]

  const admins = [
    { name: '社区管理员', role: '版主' },
    { name: '纪律委员', role: '管理员' },
    { name: '活动小助手', role: '助理' }
  ]

  // 更有活力的渐变色
  const colors = [
    'from-[#FF9A9E] to-[#FECFEEF]',
    'from-[#a18cd1] to-[#fbc2eb]',
    'from-[#84fab0] to-[#8fd3f4]',
    'from-[#e0c3fc] to-[#8ec5fc]',
    'from-[#4facfe] to-[#00f2fe]',
    'from-[#43e97b] to-[#38f9d7]'
  ]
  const colorClass = colors[seed % colors.length]

  return { members, online, rules, admins, colorClass }
}

// 获取话题存储信息
function getStoredTopic(name: string) {
  try {
    const stored = localStorage.getItem('instagram_topics')
    if (stored) {
      const topics = JSON.parse(stored)
      return topics.find((t: any) => t.name === name)
    }
  } catch (e) {
    console.error('读取话题信息失败:', e)
  }
  return null
}

const InstagramTopicDetail = () => {
  const { topicName } = useParams<{ topicName: string }>()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<ForumPost[]>([])
  // 用户创建的话题默认加入，其他话题从localStorage读取
  const [isJoined, setIsJoined] = useState(() => {
    const storedTopic = getStoredTopic(decodeURIComponent(topicName || ''))
    if (storedTopic?.isOwner) return true // 自己创建的话题默认加入
    const joinedKey = `topic_joined_${decodeURIComponent(topicName || '')}`
    return localStorage.getItem(joinedKey) === 'true'
  })
  const [activeTab, setActiveTab] = useState<'latest' | 'chat'>('latest')
  const [chatMessages, setChatMessages] = useState<{id: string, npcId: string, name: string, avatar: string, content: string, time: number, isMe?: boolean, hasPrivateMsg?: boolean, hasNewPost?: boolean, memeUrls?: string[]}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [availableEmojis, setAvailableEmojis] = useState<{url: string, name: string, description?: string}[]>([])
  const [showRules, setShowRules] = useState(false)
  const [showKickMenu, setShowKickMenu] = useState<string | null>(null) // 显示踢人菜单的帖子ID
  const [kickedUsers, setKickedUsers] = useState<string[]>([]) // 被踢用户ID列表
  const [isKicking, setIsKicking] = useState(false)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [availableCharacters, setAvailableCharacters] = useState<{id: string, realName: string, avatar?: string}[]>([])
  const [topicAdmins, setTopicAdmins] = useState<{id: string, name: string, avatar?: string, role: string}[]>([])
  const [chatLoaded, setChatLoaded] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  const decodedName = decodeURIComponent(topicName || '')
  const storedTopic = getStoredTopic(decodedName)
  const communityData = getCommunityData(decodedName)
  
  // 只用用户设置的规则，不用默认规则
  const rawRules = storedTopic?.rules || []
  const topicRules = Array.isArray(rawRules) ? rawRules : []
  const isOwner = storedTopic?.isOwner || false

  // ... useEffect and handlers ...

  useEffect(() => {
    if (decodedName) {
      getAllPostsAsync().then(allPosts => {
        const topicPosts = allPosts.filter(post =>
          post.content.includes(`#${decodedName}`) ||
          (post as any).topicId === decodedName
        )
        // 按时间排序
        topicPosts.sort((a, b) => b.timestamp - a.timestamp)
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
    topicPosts.sort((a, b) => b.timestamp - a.timestamp)
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

  // 用户头像状态
  const [myAvatar, setMyAvatar] = useState('')

  // 加载用户头像
  useEffect(() => {
    getCurrentUserInfoWithAvatar().then(info => {
      if (info.avatar) {
        setMyAvatar(info.avatar)
      }
    })
  }, [])

  // 加载表情包
  useEffect(() => {
    import('../utils/emojiStorage').then(({ getEmojis }) => {
      getEmojis().then(emojis => setAvailableEmojis(emojis))
    })
  }, [])

  // 发送表情包
  const handleSendEmoji = (emoji: {url: string, name: string}) => {
    const myMessage = {
      id: `chat-${Date.now()}`,
      npcId: 'me',
      name: '我',
      avatar: myAvatar,
      content: '',
      time: Date.now(),
      isMe: true,
      memeUrls: [emoji.url]
    }
    setChatMessages(prev => [...prev, myMessage])
    setShowEmojiPicker(false)
  }

  // 发送闲聊消息（有文字=只发送，没文字=触发AI回复）
  const handleSendChat = async () => {
    if (isSendingChat) return
    
    const userInput = chatInput.trim()
    
    // 有文字时只发送用户消息，不触发AI
    if (userInput) {
      const myMessage = {
        id: `chat-${Date.now()}`,
        npcId: 'me',
        name: '我',
        avatar: myAvatar,
        content: userInput,
        time: Date.now(),
        isMe: true
      }
      setChatMessages(prev => [...prev, myMessage])
      setChatInput('')
      return // 有文字就只发送，不触发AI
    }
    
    // 没有文字才触发AI回复
    setIsSendingChat(true)

    // 获取梗库（根据设置的数量随机提取）
    let memeLibraryInfo = ''
    try {
      const { getMemeSettings, getRandomMemes } = await import('../utils/memeRetrieval')
      const settings = getMemeSettings()
      if (settings.enabled) {
        const memes = getRandomMemes(settings.maxRecommend)
        if (memes.length > 0) {
          const memeDescriptions = memes.map((m, i) => 
            `${i + 1}. 「${m.name}」：${m.description}`
          ).join('\n')
          memeLibraryInfo = `\n\n**梗库（群友可以引用这些梗）：**\n${memeDescriptions}`
        }
      }
    } catch (e) {
      console.error('读取梗库失败:', e)
    }

    // 获取表情包（图片）- 随机取最多15个
    let emojiList: any[] = []
    let emojiInfo = ''
    try {
      const { getEmojis } = await import('../utils/emojiStorage')
      const allEmojis = await getEmojis()
      // 随机打乱并取最多15个
      emojiList = allEmojis.sort(() => Math.random() - 0.5).slice(0, 15)
      if (emojiList.length > 0) {
        const emojiDescriptions = emojiList.map((e: any, i: number) => 
          `- [表情包${i + 1}] ${e.description || '表情'}`
        ).join('\n')
        emojiInfo = `\n\n**表情包（格式：[表情包X]）：**\n${emojiDescriptions}`
      }
    } catch (e) {
      console.error('读取表情包失败:', e)
    }

    console.log('梗库提示:', memeLibraryInfo ? '已匹配' : '无匹配')
    console.log('表情包数量:', emojiList.length)

    // 调用AI生成其他用户的回复
    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (apiConfig) {
        // 打印使用的API信息
        console.log('🔌 使用的API:')
        console.log('  - 名称:', apiConfig.name || apiConfig.id)
        console.log('  - 模型:', apiConfig.model)
        console.log('  - BaseURL:', apiConfig.baseUrl)
        
        const recentMessages = chatMessages.slice(-10).map(m => `${m.name}: ${m.content}`).join('\n')
        
        // 获取社区规则（用户设置的规则优先）
        const rulesInfo = topicRules && topicRules.length > 0 
          ? `\n\n**重要：社区规则（群友必须遵守）：**\n${topicRules.map((r: string, i: number) => `${i+1}. ${r}`).join('\n')}`
          : ''

        // 获取用户信息
        const { getUserInfo } = await import('../utils/userUtils')
        const userInfo = getUserInfo()
        const userName = userInfo.nickname || userInfo.realName || '用户'
        
        // 变量替换函数（支持酒馆变量）
        const replaceVariables = (text: string, charName?: string) => {
          if (!text) return text
          return text
            .replace(/\{\{user\}\}/gi, userName)
            .replace(/\{\{char\}\}/gi, charName || '角色')
            .replace(/\{\{User\}\}/g, userName)
            .replace(/\{\{Char\}\}/g, charName || '角色')
            .replace(/<user>/gi, userName)
            .replace(/<char>/gi, charName || '角色')
        }

        // 获取所有角色（用于获取头像和人设）
        const { getAllCharacters } = await import('../utils/characterManager')
        const { loadMessages } = await import('../utils/simpleMessageManager')
        const allChars = await getAllCharacters()

        // 获取管理员信息（公众人物会引起群友震惊）
        let adminInfo = ''
        let hasPublicFigureAdmin = false
        let adminChatHistory = '' // 用户和管理员的聊天记录
        
        if (topicAdmins.length > 0) {
          try {
            const adminDetails: string[] = []
            
            // 存储管理员的头像信息
            const adminAvatarMap: Record<string, string> = {}
            
            for (const admin of topicAdmins) {
              const char = allChars.find(c => c.id === admin.id)
              if (char) {
                const isPublic = (char as any).isPublicFigure
                if (isPublic) hasPublicFigureAdmin = true
                
                // 保存管理员头像
                adminAvatarMap[admin.name] = char.avatar || ''
                
                // 读取用户和这个管理员的聊天记录
                try {
                  const messages = await loadMessages(char.id)
                  if (messages && messages.length > 0) {
                    const recentChat = messages.slice(-15).map(m => {
                      const sender = m.type === 'sent' ? userName : char.realName
                      return `${sender}: ${m.content || ''}`
                    }).join('\n')
                    adminChatHistory += `\n**${char.realName}和${userName}的私聊记录（了解他们的关系）：**\n${recentChat}\n`
                  }
                } catch (e) {
                  console.error('读取聊天记录失败:', e)
                }
                
                // 读取完整的角色人设（不截断）
                const charInfo: string[] = []
                
                // 基本信息
                if (isPublic) charInfo.push('⭐公众人物/名人')
                
                // 性格
                const personality = replaceVariables(char.personality || '', char.realName)
                if (personality) charInfo.push(`性格：${personality}`)
                
                // 公众人物人设
                const publicPersona = replaceVariables((char as any).publicPersona || '', char.realName)
                if (publicPersona) charInfo.push(`公众人设：${publicPersona}`)
                
                // 完整人设描述（不截断）
                const description = replaceVariables((char as any).description || '', char.realName)
                if (description) charInfo.push(`人设：${description}`)
                
                // 系统提示词/角色设定（过滤掉小剧场相关内容）
                let systemPrompt = replaceVariables((char as any).systemPrompt || (char as any).system_prompt || '', char.realName)
                if (systemPrompt) {
                  // 过滤掉小剧场卡片相关的内容
                  systemPrompt = systemPrompt
                    .replace(/小剧场[^]*?(?=\n\n|\n-|$)/gi, '')
                    .replace(/theatre[^]*?(?=\n\n|\n-|$)/gi, '')
                    .replace(/\[theatre[^\]]*\]/gi, '')
                    .trim()
                  if (systemPrompt) charInfo.push(`角色设定：${systemPrompt}`)
                }
                
                adminDetails.push(`- **${admin.name}**（管理员）\n  ${charInfo.join('\n  ')}`)
              } else {
                adminDetails.push(`- ${admin.name}（管理员）`)
              }
            }
            
            // 更新topicAdmins的头像
            topicAdmins.forEach(admin => {
              if (adminAvatarMap[admin.name]) {
                admin.avatar = adminAvatarMap[admin.name]
              }
            })
            
            adminInfo = `\n\n**本话题管理员：**\n${adminDetails.join('\n')}`
            if (adminChatHistory) {
              adminInfo += `\n${adminChatHistory}`
            }
            if (hasPublicFigureAdmin) {
              adminInfo += `\n\n【公众人物管理员】：\n- 公众人物发言时**必须符合其人设和性格**\n- 不需要每次都说话，但说话时要像本人\n- 管理员知道${userName}创建了这个话题，发言要考虑和用户的关系\n- 群友可能会议论管理员`
            }
          } catch (e) {
            console.error('获取管理员信息失败:', e)
          }
        }

        // 获取当前时间
        const now = new Date()
        const timeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`

        // 获取话题内的帖子（只显示用户和管理员发的）
        let postsInfo = ''
        if (posts.length > 0) {
          const adminIds = topicAdmins.map(a => a.id)
          const filteredPosts = posts.filter(p => {
            const isOwner = (p as any).isMe || p.npcId === 'me'
            const isAdmin = adminIds.includes(p.npcId)
            return isOwner || isAdmin
          })
          if (filteredPosts.length > 0) {
            const recentPosts = filteredPosts.slice(0, 10).map(p => {
              const isOwner = (p as any).isMe || p.npcId === 'me'
              const admin = topicAdmins.find(a => a.id === p.npcId)
              const poster = isOwner ? `${userName}（社区主）` : `${admin?.name}（管理员）`
              const content = p.content.replace(`#${decodedName}`, '').trim()
              return `- ${poster}: ${content} [👍${p.likes}]`
            }).join('\n')
            postsInfo = `\n\n**用户和管理员发的帖子：**\n${recentPosts}`
          }
        }

        // 获取用户创建的所有话题
        let userTopicsInfo = ''
        try {
          const storedTopics = localStorage.getItem('instagram_topics')
          if (storedTopics) {
            const allTopics = JSON.parse(storedTopics)
            const userTopics = allTopics.filter((t: any) => t.isOwner)
            if (userTopics.length > 0) {
              userTopicsInfo = `\n\n**${userName}创建的话题：**\n${userTopics.map((t: any) => `- #${t.name}`).join('\n')}`
            }
          }
        } catch (e) {}

        // 获取社区主（话题创建者）信息
        const communityOwnerInfo = `
**社区主信息：**
- 名字：${userName}
- 身份：本话题/社区的创建者
- 个性签名：${(userInfo as any).bio || (userInfo as any).signature || '无'}
- 在本话题发帖数：${posts.filter(p => (p as any).isMe || p.npcId === 'me').length}
`

        const prompt = `**当前时间：${timeStr}**

你现在是"#${decodedName}"话题社区的群聊模拟器。

**话题信息：**
- 话题名称：#${decodedName}
${rulesInfo}${communityOwnerInfo}${userTopicsInfo}${adminInfo}${postsInfo}
${memeLibraryInfo}
${emojiInfo}

**最近的聊天记录：**
${recentMessages || '(刚开始聊天)'}${userInput ? `\n${userName}: ${userInput}` : ''}

请生成20-50条**NPC群友**的回复。

**严格禁止（违反将被惩罚）：**
1. **禁止扮演${userName}**：绝对不能生成任何以"${userName}"或"我"开头的消息
2. **禁止编造**：不能编造没有发生过的事情，只能基于上面的帖子和聊天记录进行讨论
3. **禁止AI味**：禁止使用"热闹的群聊"、"大家在聊天"等描述性语言

**回复要求：**
1. **人设贴合**：管理员发言必须完全符合其人设和性格
2. **分段发送**：一个人说多句话要分成多条消息
3. **互动自然**：群友之间要有互动、反驳、复读、@对方等行为

**功能指令：**
- **私信**：[私信:内容]
- **发帖**：[发帖:内容]
- **表情包**：[表情包X]

**输出格式（严格执行）：**
摸鱼王|哈哈哈笑死我了[表情包1]
摸鱼王|这一天天过的
甜妹|确实是这样
暴躁老哥|别废话了
暴躁老哥|直接开干

**请直接输出回复内容，不要有任何开场白。**`

        // 打印Prompt
        console.log('============================================================')
        console.log('🗨️ 闲聊区 - API调用')
        console.log('============================================================')
        console.log('📝 Prompt:')
        console.log(prompt)
        console.log('------------------------------------------------------------')

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
            temperature: 0.95,
            max_tokens: 4000
          })
        })

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''
        
        // 打印Response
        console.log('📥 Response:')
        console.log(content)
        console.log('============================================================')
        
        // 解析回复并批量处理
        const lines = content.split('\n').filter((l: string) => l.includes('|'))
        const newMessages: any[] = []
        const dmTasks: { name: string, content: string }[] = []
        const postTasks: { name: string, content: string }[] = []
        
        // 先解析所有消息
        for (let i = 0; i < lines.length; i++) {
          try {
            const [name, reply] = lines[i].split('|')
            if (!name?.trim() || !reply?.trim()) continue
            
            let replyContent = reply.trim()
            
            // 检查私信
            const dmMatch = replyContent.match(/\[私信[:：]([^\]]+)\]/)
            const dmContent = dmMatch ? dmMatch[1].trim() : ''
            if (dmContent) dmTasks.push({ name: name.trim(), content: dmContent })
            
            // 检查发帖
            const postMatch = replyContent.match(/\[发帖[:：]([^\]]+)\]/)
            const postContent = postMatch ? postMatch[1].trim() : ''
            if (postContent) postTasks.push({ name: name.trim(), content: postContent })
            
            let cleanContent = replyContent
              .replace(/\[私信[:：][^\]]+\]/, '')
              .replace(/\[发帖[:：][^\]]+\]/, '')
              .trim()
            
            // 处理表情包
            const emojiPattern = /\[表情包(\d+)\]/g
            let emojiMatch
            const emojiUrls: string[] = []
            while ((emojiMatch = emojiPattern.exec(cleanContent)) !== null) {
              const emojiIndex = parseInt(emojiMatch[1]) - 1
              if (emojiList[emojiIndex]?.url) {
                emojiUrls.push(emojiList[emojiIndex].url)
              }
            }
            cleanContent = cleanContent.replace(emojiPattern, '').trim()
            
            const adminMatch = topicAdmins.find(a => a.name === name.trim())
            // 从allChars获取管理员头像（allChars在上面已经获取）
            let adminAvatar = ''
            if (adminMatch) {
              const adminChar = allChars.find(c => c.id === adminMatch.id)
              adminAvatar = adminChar?.avatar || ''
            }
            
            newMessages.push({
              id: `chat-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
              npcId: adminMatch?.id || `npc-${name.trim()}`,
              name: name.trim(),
              avatar: adminAvatar,
              content: cleanContent,
              time: Date.now() + i * 100,
              hasNewPost: !!postContent,
              memeUrls: emojiUrls,
              isAdmin: !!adminMatch
            })
          } catch (e) {
            console.error('解析消息失败:', e)
          }
        }
        
        // 批量添加消息（分批显示，模拟打字效果）
        for (let i = 0; i < newMessages.length; i++) {
          // 延迟600-1200ms，模拟真实打字速度
          await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600))
          setChatMessages(prev => [...prev, newMessages[i]])
        }
        
        // 处理私信任务
        for (const dm of dmTasks) {
          try {
            const dmKey = 'instagram_dms'
            const existingDMs = JSON.parse(localStorage.getItem(dmKey) || '[]')
            const newDM = {
              id: `dm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              recipientId: `npc-${dm.name}`,
              recipientName: dm.name,
              messages: [{
                id: `msg-${Date.now()}`,
                senderId: `npc-${dm.name}`,
                content: dm.content,
                timestamp: Date.now()
              }],
              lastMessage: dm.content,
              lastMessageTime: Date.now(),
              unread: 1
            }
            existingDMs.unshift(newDM)
            localStorage.setItem(dmKey, JSON.stringify(existingDMs))
            console.log(`✅ 私信已创建: ${dm.name}`)
          } catch (e) {
            console.error('创建私信失败:', e)
          }
        }
        
        // 处理发帖任务
        for (const post of postTasks) {
          try {
            const { savePosts, getAllNPCs, saveNPCs } = await import('../utils/forumNPC')
            const allPosts = await getAllPostsAsync()
            const existingNPCs = getAllNPCs()
            
            if (!existingNPCs.some(n => n.id === `npc-${post.name}`)) {
              existingNPCs.push({
                id: `npc-${post.name}`,
                name: post.name,
                avatar: '',
                bio: '社区活跃用户',
                followers: Math.floor(Math.random() * 500) + 50
              } as any)
              saveNPCs(existingNPCs)
            }

            const newPost = {
              id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              npcId: `npc-${post.name}`,
              content: `${post.content} #${decodedName}`,
              likes: Math.floor(Math.random() * 30),
              comments: [],
              timestamp: Date.now(),
              isLiked: false,
              images: [],
              time: new Date().toISOString(),
              topicId: decodedName
            } as any
            
            allPosts.unshift(newPost)
            await savePosts(allPosts)
            console.log(`✅ 帖子已发布: ${post.name}`)
          } catch (e) {
            console.error('发帖失败:', e)
          }
        }
      } else {
        console.error('❌ 闲聊区 - 没有可用的API配置！')
        console.log('请先在设置中配置API')
      }
    } catch (error) {
      console.error('生成聊天回复失败:', error)
    } finally {
      setIsSendingChat(false)
    }
  }

  // 加载闲聊区历史消息（从IndexedDB）
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const db = await openChatDB()
        const tx = db.transaction('topic_chats', 'readonly')
        const store = tx.objectStore('topic_chats')
        const data = await new Promise<any>((resolve) => {
          const req = store.get(decodedName)
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => resolve(null)
        })
        if (data && Array.isArray(data.messages)) {
          setChatMessages(data.messages)
        }
      } catch (e) {
        console.error('读取聊天记录失败:', e)
      }
      setChatLoaded(true)
    }
    loadFromDB()
  }, [decodedName])

  // 保存聊天消息到IndexedDB（完整保存，防抖500ms）
  useEffect(() => {
    if (chatLoaded && chatMessages.length > 0) {
      // 使用防抖，避免频繁保存
      const timer = setTimeout(async () => {
        try {
          const db = await openChatDB()
          const tx = db.transaction('topic_chats', 'readwrite')
          const store = tx.objectStore('topic_chats')
          // 保存所有消息，不限制数量
          await new Promise<void>((resolve, reject) => {
            const req = store.put({
              topicName: decodedName,
              messages: chatMessages,
              updatedAt: Date.now()
            })
            req.onsuccess = () => {
              console.log(`💾 已保存${chatMessages.length}条消息`)
              resolve()
            }
            req.onerror = () => reject(req.error)
          })
        } catch (e) {
          console.error('保存聊天记录失败:', e)
        }
      }, 500) // 防抖500ms
      return () => clearTimeout(timer) // 清理定时器
    }
  }, [chatMessages, decodedName, chatLoaded])

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current && activeTab === 'chat') {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, activeTab])

  // 加载角色列表和管理员（始终加载，不限制isOwner）
  useEffect(() => {
    const loadData = async () => {
      // 加载角色
      try {
        const { getAllCharacters } = await import('../utils/characterManager')
        const chars = await getAllCharacters()
        setAvailableCharacters(chars.map(c => ({ id: c.id, realName: c.realName, avatar: c.avatar })))
      } catch (e) {
        console.error('加载角色失败:', e)
      }
      
      // 加载已添加的管理员
      try {
        const adminKey = `topic_admins_${decodedName}`
        const stored = localStorage.getItem(adminKey)
        if (stored) {
          setTopicAdmins(JSON.parse(stored))
        }
      } catch (e) {
        console.error('加载管理员失败:', e)
      }
    }
    loadData() // 始终加载，不限制isOwner
  }, [decodedName])

  // 添加管理员
  const handleAddAdmin = (char: {id: string, realName: string, avatar?: string}) => {
    if (topicAdmins.some(a => a.id === char.id)) return // 已经是管理员
    
    const now = new Date()
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    
    const newAdmin = {
      id: char.id,
      name: char.realName,
      avatar: char.avatar,
      role: '管理员',
      addedAt: Date.now()
    }
    const newAdmins = [...topicAdmins, newAdmin]
    setTopicAdmins(newAdmins)
    
    // 保存到localStorage
    const adminKey = `topic_admins_${decodedName}`
    localStorage.setItem(adminKey, JSON.stringify(newAdmins))
    
    // 在聊天区显示系统消息
    const systemMsg = {
      id: `system-${Date.now()}`,
      npcId: 'system',
      name: '系统消息',
      avatar: '',
      content: `社区主 将 ${char.realName} 设为管理员`,
      time: Date.now(),
      isSystem: true
    }
    setChatMessages(prev => [...prev, systemMsg])
    
    setShowAddAdmin(false)
  }

  // 移除管理员
  const handleRemoveAdmin = (adminId: string) => {
    const newAdmins = topicAdmins.filter(a => a.id !== adminId)
    setTopicAdmins(newAdmins)
    
    const adminKey = `topic_admins_${decodedName}`
    localStorage.setItem(adminKey, JSON.stringify(newAdmins))
  }

  // 踢人功能
  const handleKickUser = async (npcId: string, npcName: string) => {
    if (!isOwner || isKicking) return
    
    setIsKicking(true)
    setShowKickMenu(null)
    
    // 添加到被踢列表
    const newKickedUsers = [...kickedUsers, npcId]
    setKickedUsers(newKickedUsers)
    
    // 存储被踢用户
    try {
      const kickedKey = `kicked_users_${decodedName}`
      localStorage.setItem(kickedKey, JSON.stringify(newKickedUsers))
    } catch (e) {
      console.error('存储被踢用户失败:', e)
    }

    // 从帖子列表中移除该用户的帖子
    setPosts(prev => prev.filter(p => p.npcId !== npcId))

    // 生成被踢用户的反应帖子
    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (apiConfig) {
        const prompt = `你是一个被社区踢出的用户"${npcName}"，你刚刚被"#${decodedName}"话题的社区主踢出了社区。

请生成1条愤怒/委屈的抱怨帖子，可以选择以下反应之一：
1. 挂社区主：说社区主耍大牌、滥用权力
2. 委屈诉苦：说自己什么都没做就被踢了
3. 讽刺嘲讽：说这个社区不值得待
4. 爆料：说社区主私下的一些"黑料"（编造的）

**要求：**
- 帖子内容50-150字
- 语气要真实、情绪化
- 可以@社区主或提到话题名

**输出格式：**
帖子内容|反应类型

示例：
我就发了一条正常评论就被#xxx的社区主踢了？？？这社区主是不是有毛病啊，权力大了了不起吗？大家别去那个话题了，社区主耍大牌得很！|挂社区主

直接输出，不要其他内容。`

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
        
        if (content) {
          // 解析反应帖子
          const [postContent] = content.split('|')
          if (postContent?.trim()) {
            // 创建反应帖子（发到"吐槽"或"日常"话题）
            const { savePosts, getAllNPCs, saveNPCs } = await import('../utils/forumNPC')
            const allPosts = await getAllPostsAsync()
            const existingNPCs = getAllNPCs()
            
            // 确保被踢用户存在于NPC列表
            if (!existingNPCs.some(n => n.id === npcId)) {
              existingNPCs.push({
                id: npcId,
                name: npcName,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${npcId}`,
                bio: '被踢出社区的用户',
                followers: Math.floor(Math.random() * 100) + 10
              } as any)
              saveNPCs(existingNPCs)
            }

            const reactionPost = {
              id: `reaction-${Date.now()}`,
              npcId: npcId,
              content: `${postContent.trim()} #吐槽 #被踢了`,
              likes: Math.floor(Math.random() * 50),
              comments: [],
              timestamp: Date.now(),
              isLiked: false,
              images: [],
              time: new Date().toISOString()
            } as any
            
            allPosts.unshift(reactionPost)
            await savePosts(allPosts)
            
            console.log(`😤 ${npcName} 发布了反应帖子:`, postContent.trim())
          }
        }
      }
    } catch (error) {
      console.error('生成反应帖子失败:', error)
    } finally {
      setIsKicking(false)
    }
    
    alert(`已将 ${npcName} 踢出社区`)
  }

  // 加载被踢用户列表
  useEffect(() => {
    const kickedKey = `kicked_users_${decodedName}`
    try {
      const stored = localStorage.getItem(kickedKey)
      if (stored) {
        setKickedUsers(JSON.parse(stored))
      }
    } catch (e) {
      console.error('读取被踢用户失败:', e)
    }
  }, [decodedName])

  return (
    <InstagramLayout showHeader={false} showTabBar={false}>
      <div className="min-h-screen bg-white">
        {/* 顶部导航 */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm">
            <StatusBar />
            <div className="flex items-center justify-between px-4 py-2">
                <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                >
                <ArrowLeft className="w-5 h-5 stroke-[2] text-gray-900" />
                </button>
                <button 
                    onClick={() => setShowRules(!showRules)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                >
                <Shield className="w-5 h-5 stroke-[2] text-gray-900" />
                </button>
            </div>
        </div>

        {/* 社区头部 */}
        <div className="relative bg-white pb-4 mb-3">
            {/* Banner - 白色背景 */}
            <div className="h-44 bg-gray-50" />
            
            {/* 社区基本信息 */}
            <div className="px-5">
                <div className="flex items-start gap-4 -mt-10 mb-3">
                    {/* 头像 */}
                    <div className="w-20 h-20 rounded-2xl bg-white p-1.5 shadow-lg shrink-0">
                        <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-3xl font-bold">
                            {decodedName.slice(0, 1)}
                        </div>
                    </div>
                    
                    {/* 标题和加入按钮在同一行 */}
                    <div className="flex-1 min-w-0 pt-10">
                        <div className="flex items-center justify-between gap-3">
                            <h1 className="text-xl font-bold text-gray-900 truncate">{decodedName}</h1>
                            <button 
                                onClick={() => {
                                  const newJoined = !isJoined
                                  setIsJoined(newJoined)
                                  // 保存到localStorage
                                  const joinedKey = `topic_joined_${decodedName}`
                                  if (newJoined) {
                                    localStorage.setItem(joinedKey, 'true')
                                  } else {
                                    localStorage.removeItem(joinedKey)
                                  }
                                }}
                                className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all active:scale-95 shrink-0 ${
                                    isJoined 
                                    ? 'bg-gray-100 text-gray-500' 
                                    : 'bg-black text-white'
                                }`}
                            >
                                {isJoined ? '已加入' : '加入'}
                            </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span>{(storedTopic?.members || communityData.members).toLocaleString()} 成员</span>
                            <span>{Math.floor((storedTopic?.members || communityData.members) * (0.02 + Math.random() * 0.08)).toLocaleString()} 在线</span>
                            <span>{posts.length} 帖子</span>
                        </div>
                    </div>
                </div>

                {/* 规则预览（可展开） */}
                <div 
                    className={`bg-gray-50 rounded-xl overflow-hidden transition-all duration-300 border border-gray-100 ${showRules ? 'max-h-96 p-4' : 'max-h-10 py-2 px-4 cursor-pointer hover:bg-gray-100'}`}
                    onClick={() => !showRules && setShowRules(true)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                            <Bell className="w-3.5 h-3.5" />
                            <span>社区公告 & 规范</span>
                        </div>
                        {!showRules && <span className="text-[10px] text-gray-400">点击展开</span>}
                    </div>
                    
                    <div className={`mt-3 space-y-3 opacity-${showRules ? '100' : '0'} transition-opacity duration-300`}>
                        <div className="space-y-1.5">
                            {topicRules.map((rule: string, idx: number) => (
                                <p key={idx} className="text-xs text-gray-500 leading-relaxed pl-2 border-l-2 border-gray-200">{rule}</p>
                            ))}
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                            <p className="text-xs font-bold text-gray-600 mb-2">管理团队</p>
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {isOwner ? (
                                    // 用户创建的社区，显示自己 + 管理员 + 添加按钮
                                    <>
                                        <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200 shadow-sm shrink-0">
                                            <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                                                <Users className="w-3 h-3 text-yellow-600" />
                                            </div>
                                            <span className="text-[10px] text-yellow-700 font-medium">我</span>
                                            <span className="text-[10px] px-1 rounded bg-yellow-200 text-yellow-800">社区主</span>
                                        </div>
                                        {/* 已添加的管理员 */}
                                        {topicAdmins.map((admin) => (
                                            <div key={admin.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm shrink-0 group">
                                                {admin.avatar ? (
                                                    <img src={admin.avatar} alt={admin.name} className="w-5 h-5 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-[8px] text-gray-500">{admin.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-gray-600 font-medium">{admin.name}</span>
                                                <span className="text-[10px] px-1 rounded bg-blue-100 text-blue-700">{admin.role}</span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveAdmin(admin.id) }}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {/* 添加管理员按钮 */}
                                        <button 
                                            onClick={() => setShowAddAdmin(true)}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors shrink-0"
                                        >
                                            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg">+</span>
                                            <span className="text-[10px] text-gray-400">添加管理</span>
                                        </button>
                                    </>
                                ) : (
                                    // 非用户创建的话题才显示默认管理员
                                    communityData.admins.map((admin, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm shrink-0">
                                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Users className="w-3 h-3 text-gray-400" />
                                            </div>
                                            <span className="text-[10px] text-gray-600 font-medium">{admin.name}</span>
                                            <span className={`text-[10px] px-1 rounded ${admin.role === '版主' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {admin.role}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 帖子列表区域 */}
        <div className="bg-white min-h-[500px]">
            {/* 列表Tab */}
            <div className="sticky top-[52px] z-10 bg-white border-b border-gray-100 flex items-center px-5 h-11 gap-6 shadow-sm">
                <button 
                    onClick={() => setActiveTab('latest')}
                    className={`text-sm font-bold h-full border-b-[3px] transition-all relative ${
                        activeTab === 'latest' 
                        ? 'text-gray-900 border-black' 
                        : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                >
                    最新发布
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`text-sm font-bold h-full border-b-[3px] transition-all relative flex items-center gap-1.5 ${
                        activeTab === 'chat' 
                        ? 'text-gray-900 border-black' 
                        : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    闲聊区
                </button>
            </div>

            {/* 内容区域 */}
            {activeTab === 'chat' ? (
              /* 闲聊区 */
              <div className="flex flex-col h-[calc(100vh-280px)]">
                {/* 聊天消息列表 */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                  {chatMessages.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-50 rounded-full">
                        <MessageSquare className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">闲聊区空空如也</h3>
                      <p className="text-xs text-gray-400">发条消息和大家聊聊天吧~</p>
                    </div>
                  ) : (
                    chatMessages.filter(msg => msg && msg.id).map((msg, idx) => (
                      (msg as any).isSystem ? (
                        // 系统消息样式
                        <div key={msg.id || `msg-${idx}`} className="flex justify-center my-2">
                          <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 6v6l4 2"/>
                            </svg>
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                      <div 
                        key={msg.id || `msg-${idx}`} 
                        className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}
                      >
                        {/* 头像 */}
                        {msg.isMe ? (
                          // 自己的头像
                          msg.avatar ? (
                            <img 
                              src={msg.avatar} 
                              alt="我"
                              className="w-8 h-8 rounded-full shrink-0 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full shrink-0 bg-black flex items-center justify-center text-white text-xs font-bold">
                                我
                              </div>
                            )
                          ) : (
                            // 群友/管理员头像
                            msg.avatar && (msg.avatar.startsWith('http') || msg.avatar.startsWith('data:') || msg.avatar.startsWith('/')) ? (
                              <img 
                                src={msg.avatar} 
                                alt={msg.name || '用户'}
                                className={`w-8 h-8 rounded-full shrink-0 object-cover ${(msg as any).isAdmin ? 'ring-2 ring-blue-400' : ''}`}
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${(msg as any).isAdmin ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                {(msg.name || '?').charAt(0)}
                              </div>
                            )
                          )}
                          
                          <div className={`max-w-[75%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                            {!msg.isMe && (
                              <p className="text-[10px] text-gray-400 mb-0.5 ml-1 flex items-center gap-1">
                                {msg.name}
                                {(msg as any).isAdmin && (
                                  <span className="text-[9px] px-1 py-0.5 bg-blue-500 text-white rounded font-medium">管理员</span>
                                )}
                                {msg.hasNewPost && (
                                  <span className="text-[9px] px-1 py-0.5 bg-green-100 text-green-600 rounded">发帖了</span>
                                )}
                              </p>
                            )}
                            {/* 文字内容 */}
                            {msg.content && (
                              <div className={`px-3 py-1.5 rounded-2xl text-sm ${
                                msg.isMe 
                                  ? 'bg-black text-white rounded-br-sm' 
                                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                              }`}>
                                {msg.content}
                              </div>
                            )}
                            {/* 梗图 */}
                            {msg.memeUrls && msg.memeUrls.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {msg.memeUrls.map((url, idx) => (
                                  <img 
                                    key={idx}
                                    src={url} 
                                    alt="梗图"
                                    className="max-w-[150px] max-h-[150px] rounded-lg object-cover"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )))
                    )}
                  {isSendingChat && (
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse shrink-0" />
                      <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 输入框 */}
                <div className="border-t border-gray-100 px-4 py-3 bg-white">
                  {/* 表情包选择器 */}
                  {showEmojiPicker && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-xl max-h-32 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {availableEmojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendEmoji(emoji)}
                            className="w-12 h-12 rounded-lg overflow-hidden hover:scale-110 transition-transform"
                          >
                            <img src={emoji.url} alt={emoji.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                        {availableEmojis.length === 0 && (
                          <p className="text-xs text-gray-400 p-2">暂无表情包，请先上传</p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {/* 表情包按钮 */}
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                    </button>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder={chatInput.trim() ? "发送消息..." : "点击发送触发AI回复"}
                      className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={isSendingChat}
                      className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white disabled:opacity-50 active:scale-95 transition-all"
                    >
                      <Send className="w-5 h-5 -rotate-45" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 帖子列表 */
              <div className="pb-24">
                {posts.length === 0 ? (
                <div className="py-32 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-gray-50 rounded-full">
                    <Hash className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">这里空空如也</h3>
                    <p className="text-sm text-gray-500">做第一个发帖的人吧！</p>
                </div>
                ) : (
                <div className="divide-y divide-gray-100">
                    {posts.map((post) => {
                    const npc = getNPCById(post.npcId)
                    if (!npc) return null

                    return (
                        <div key={post.id} className="bg-white py-5 hover:bg-gray-50/30 transition-colors active:bg-gray-50">
                        {/* Post Header */}
                        <div className="flex items-center justify-between px-5 mb-3">
                            <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate(`/instagram/user/${npc.id}`)}
                            >
                            {npc.avatar && npc.avatar.startsWith('http') ? (
                              <img
                                src={npc.avatar}
                                alt={npc.name || '用户'}
                                className="w-10 h-10 rounded-full object-cover border border-gray-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm border border-gray-100">
                                {(npc.name || '?').charAt(0)}
                              </div>
                            )}
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900">{npc.name || '未知用户'}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">LV.{((npc.name || '').length % 5) + 2}</span>
                                </div>
                                <div className="text-[11px] text-gray-400 font-medium">
                                    {formatTimeAgo(post.timestamp)} · {decodedName}
                                </div>
                            </div>
                            </div>
                            
                            {/* 更多按钮 + 踢人菜单 */}
                            <div className="relative">
                              <button 
                                onClick={() => setShowKickMenu(showKickMenu === post.id ? null : post.id)}
                                className="text-gray-300 hover:text-gray-600"
                              >
                                <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                              </button>
                              
                              {/* 踢人菜单 */}
                              {showKickMenu === post.id && (
                                <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 min-w-[120px]">
                                  {isOwner && !kickedUsers.includes(post.npcId) && (
                                    <button
                                      onClick={() => handleKickUser(post.npcId, npc.name)}
                                      disabled={isKicking}
                                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-500 text-sm font-medium"
                                    >
                                      <Ban className="w-4 h-4" />
                                      {isKicking ? '处理中...' : '踢出社区'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setShowKickMenu(null)
                                      navigate(`/instagram/user/${npc.id}`)
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-gray-600 text-sm font-medium"
                                  >
                                    <Users className="w-4 h-4" />
                                    查看主页
                                  </button>
                                  <button
                                    onClick={() => setShowKickMenu(null)}
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-gray-400 text-sm font-medium border-t border-gray-50"
                                  >
                                    <X className="w-4 h-4" />
                                    取消
                                  </button>
                                </div>
                              )}
                            </div>
                        </div>

                        {/* Post Content */}
                        <div 
                            className="px-5 mb-3 cursor-pointer"
                            onClick={() => navigate(`/instagram/post/${post.id}`)}
                        >
                            {parsePostContent(post.content)}
                        </div>

                        {/* Post Actions */}
                        <div className="px-5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike(post.id);
                                }}
                                className="flex items-center gap-1.5 group"
                            >
                                <Heart
                                className={`w-5 h-5 stroke-[2] transition-all ${
                                    post.isLiked 
                                    ? 'text-rose-500 fill-rose-500 scale-110' 
                                    : 'text-gray-400 group-hover:text-gray-600'
                                    }`}
                                />
                                <span className={`text-xs font-bold ${post.isLiked ? 'text-rose-500' : 'text-gray-500'}`}>
                                {post.likes > 0 ? post.likes : '赞'}
                                </span>
                            </button>
                            <button
                                className="flex items-center gap-1.5 group"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/instagram/post/${post.id}`);
                                }}
                            >
                                <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-600 stroke-[2] transition-colors" />
                                <span className="text-sm font-semibold text-gray-400 group-hover:text-blue-600">
                                {post.comments > 0 ? post.comments : '评论'}
                                </span>
                            </button>
                            <button className="flex items-center gap-1.5 group">
                                <Send className="w-5 h-5 text-gray-400 group-hover:text-green-600 stroke-[2] -rotate-45 transition-colors" />
                            </button>
                            </div>
                        </div>
                        </div>
                    )
                    })}
                </div>
                )}
            </div>
            )}
        </div>

        {/* 点击遮罩关闭菜单 */}
        {showKickMenu && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowKickMenu(null)} 
          />
        )}

        {/* 添加管理员模态框 */}
        {showAddAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl w-[85%] max-w-sm max-h-[70vh] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">选择角色作为管理员</h3>
                <button onClick={() => setShowAddAdmin(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[50vh] p-2">
                {availableCharacters.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">
                    暂无可用角色<br />
                    <span className="text-xs">请先创建一些角色</span>
                  </div>
                ) : (
                  availableCharacters
                    .filter(c => !topicAdmins.some(a => a.id === c.id))
                    .map((char) => (
                      <button
                        key={char.id}
                        onClick={() => handleAddAdmin(char)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        {char.avatar ? (
                          <img src={char.avatar} alt={char.realName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                            {char.realName.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700">{char.realName}</span>
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </InstagramLayout>
  )
}

export default InstagramTopicDetail
