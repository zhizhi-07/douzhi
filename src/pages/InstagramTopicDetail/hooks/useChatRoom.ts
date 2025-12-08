import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../../services/apiService'
import { getAllPostsAsync, getNPCById } from '../../../utils/forumNPC'
import type { ChatMessage, TopicAdmin } from './types'
import type { ForumPost } from '../../../utils/forumNPC'

interface UseChatRoomProps {
  decodedName: string
  topicRules: string[]
  topicAdmins: TopicAdmin[]
  posts: ForumPost[]
}

export function useChatRoom({ decodedName, topicRules, topicAdmins, posts }: UseChatRoomProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [myAvatar, setMyAvatar] = useState('')
  const [chatLoaded, setChatLoaded] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 加载用户头像
  useEffect(() => {
    import('../../../utils/userUtils').then(({ getCurrentUserInfoWithAvatar }) => {
      getCurrentUserInfoWithAvatar().then(info => {
        if (info.avatar) {
          setMyAvatar(info.avatar)
        }
      })
    })
  }, [])

  // 加载闲聊区历史消息
  useEffect(() => {
    const chatKey = `chat_messages_${decodedName}`
    try {
      const stored = localStorage.getItem(chatKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed)
        }
      }
    } catch (e) {
      console.error('读取聊天记录失败:', e)
    }
    setChatLoaded(true)
  }, [decodedName])

  // 保存聊天消息（只在加载完成后保存）
  useEffect(() => {
    if (chatLoaded && chatMessages.length > 0) {
      const chatKey = `chat_messages_${decodedName}`
      const toSave = chatMessages.slice(-100)
      localStorage.setItem(chatKey, JSON.stringify(toSave))
    }
  }, [chatMessages, decodedName, chatLoaded])

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // 发送闲聊消息
  const handleSendChat = async () => {
    if (!chatInput.trim() || isSendingChat) return
    
    const myMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      npcId: 'me',
      name: '我',
      avatar: myAvatar,
      content: chatInput.trim(),
      time: Date.now(),
      isMe: true
    }
    
    setChatMessages(prev => [...prev, myMessage])
    const userInput = chatInput.trim()
    setChatInput('')
    setIsSendingChat(true)

    // 获取梗库（根据设置的数量随机提取）
    let memeLibraryInfo = ''
    try {
      const { getMemeSettings, getRandomMemes } = await import('../../../utils/memeRetrieval')
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

    // 获取表情包（随机取最多15个）
    let emojiList: any[] = []
    let emojiInfo = ''
    try {
      const { getEmojis } = await import('../../../utils/emojiStorage')
      const allEmojis = await getEmojis()
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

    console.log('梗库数量:', memeLibraryInfo ? 'yes' : 0)
    console.log('表情包数量:', emojiList.length)

    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (apiConfig) {
        console.log('🔌 使用的API:')
        console.log('  - 名称:', apiConfig.name || apiConfig.id)
        console.log('  - 模型:', apiConfig.model)
        console.log('  - BaseURL:', apiConfig.baseUrl)
        
        const recentMessages = chatMessages.slice(-10).map(m => `${m.name}: ${m.content}`).join('\n')
        
        const rulesInfo = topicRules && topicRules.length > 0 
          ? `\n\n**重要：社区规则（群友必须遵守）：**\n${topicRules.map((r: string, i: number) => `${i+1}. ${r}`).join('\n')}`
          : ''

        // 获取管理员信息
        let adminInfo = ''
        if (topicAdmins.length > 0) {
          try {
            const { getAllCharacters } = await import('../../../utils/characterManager')
            const allChars = await getAllCharacters()
            const adminDetails = topicAdmins.map(admin => {
              const char = allChars.find(c => c.id === admin.id)
              if (char) {
                const details = []
                if (char.personality) details.push(`性格：${char.personality}`)
                if ((char as any).isPublicFigure) details.push('（公众人物，大家都认识）')
                if ((char as any).publicPersona) details.push(`网络形象：${(char as any).publicPersona}`)
                return `- ${admin.name}（管理员）${details.length > 0 ? '：' + details.join('，') : ''}`
              }
              return `- ${admin.name}（管理员）`
            }).join('\n')
            adminInfo = `\n\n**管理员（可能出现在群聊中）：**\n${adminDetails}`
          } catch (e) {
            console.error('获取管理员信息失败:', e)
          }
        }

        // 获取话题内的帖子摘要
        let postsInfo = ''
        if (posts.length > 0) {
          const recentPosts = posts.slice(0, 5).map(p => {
            const npc = getNPCById(p.npcId)
            const content = p.content.replace(`#${decodedName}`, '').trim().slice(0, 50)
            return `- ${npc?.name || '网友'}: ${content}...`
          }).join('\n')
          postsInfo = `\n\n**话题内最近的帖子（群友可能讨论这些）：**\n${recentPosts}`
        }

        const prompt = `你是一个热闹的社区群聊模拟器。
这是"#${decodedName}"话题的闲聊区，有很多活跃的群友。
${rulesInfo}${adminInfo}${postsInfo}
${memeLibraryInfo}
${emojiInfo}

**最近的聊天记录：**
${recentMessages || '(刚开始聊天)'}
我: ${userInput}

请生成20-50条群友的回复，模拟一个超级活跃热闘的群聊场景。

**核心要求：**
1. **身份多样**：网名要有个性（2-4字），如：小明、摸鱼王、暴躁老哥、甜妹、冷笑话、杠精、吃瓜群众、话痨本痨、深夜emo等。
2. **内容真实**：回复要口语化、接地气、短小精悍（5-50字）。
3. **互动自然**：
   - 有人回应"我"的话。
   - 有人无视"我"，在聊自己的话题。
   - 有人插科打诨、水群、复读。
   - 有人吵架、跑题。
4. **功能指令**：
   - **私信**：偶尔（1-2人）想私聊，格式为 [私信:私信内容]，私信内容要真实有料，比如表白、求认识、聊隐私话题等。
   - **发帖**：偶尔（1人）想发帖，格式为 [发帖:帖子内容]，帖子内容要符合#${decodedName}话题，真实有料。
   - **表情包**：群友可以发表情包图片，格式为 [表情包X]，其中X是上面列出的表情包编号。
   - **引用梗**：群友可以引用梗库里的梗来聊天。

**输出格式示例（每行一条）：**
摸鱼王|哈哈哈笑死我了[表情包1]
甜妹|确实是这样
暴躁老哥|别废话了，直接开干
路人甲|感觉你挺有意思的[私信:你好呀~看你在群里聊天感觉很有趣，能认识一下吗？]
小美|我要去发帖了[发帖:今天在食堂看到一个超帅的学长，心动了怎么办]
杠精|这就破防了？[表情包3]

**请直接输出20-50条回复，严格按照"网名|内容"格式，不要包含任何其他说明文字。**`

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
        
        console.log('📥 Response:')
        console.log(content)
        console.log('============================================================')
        
        // 解析回复
        const lines = content.split('\n').filter((l: string) => l.includes('|'))
        
        for (let i = 0; i < lines.length; i++) {
          const [name, reply] = lines[i].split('|')
          if (name?.trim() && reply?.trim()) {
            const delay = 80 + Math.random() * 150
            await new Promise(resolve => setTimeout(resolve, delay))
            
            let replyContent = reply.trim()
            
            const dmMatch = replyContent.match(/\[私信[:：]([^\]]+)\]/)
            const hasPrivateMsg = !!dmMatch
            const dmContent = dmMatch ? dmMatch[1].trim() : ''
            
            const postMatch = replyContent.match(/\[发帖[:：]([^\]]+)\]/)
            const hasNewPost = !!postMatch
            const postContent = postMatch ? postMatch[1].trim() : ''
            
            let cleanContent = replyContent
              .replace(/\[私信[:：][^\]]+\]/, '')
              .replace(/\[发帖[:：][^\]]+\]/, '')
              .trim()
            
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
            
            const npcMessage: ChatMessage = {
              id: `chat-${Date.now()}-${i}`,
              npcId: `npc-${name.trim()}`,
              name: name.trim(),
              avatar: '',
              content: cleanContent,
              time: Date.now(),
              hasPrivateMsg,
              hasNewPost,
              memeUrls: emojiUrls
            }
            
            setChatMessages(prev => [...prev, npcMessage])

            // 真正发私信
            if (hasPrivateMsg && dmContent) {
              console.log(`💬 ${name.trim()} 发起私信: ${dmContent}`)
              try {
                const dmKey = 'instagram_dms'
                const existingDMs = JSON.parse(localStorage.getItem(dmKey) || '[]')
                const newDM = {
                  id: `dm-${Date.now()}`,
                  recipientId: `npc-${name.trim()}`,
                  recipientName: name.trim(),
                  messages: [{
                    id: `msg-${Date.now()}`,
                    senderId: `npc-${name.trim()}`,
                    content: dmContent,
                    timestamp: Date.now()
                  }],
                  lastMessage: dmContent,
                  lastMessageTime: Date.now(),
                  unread: 1
                }
                existingDMs.unshift(newDM)
                localStorage.setItem(dmKey, JSON.stringify(existingDMs))
                console.log(`✅ 私信已创建: ${name.trim()}`)
              } catch (e) {
                console.error('创建私信失败:', e)
              }
            }
            
            // 真正发帖
            if (hasNewPost && postContent) {
              console.log(`📝 ${name.trim()} 去发帖了`)
              try {
                const { savePosts, getAllNPCs, saveNPCs } = await import('../../../utils/forumNPC')
                const allPosts = await getAllPostsAsync()
                const existingNPCs = getAllNPCs()
                
                if (!existingNPCs.some(n => n.id === `npc-${name.trim()}`)) {
                  existingNPCs.push({
                    id: `npc-${name.trim()}`,
                    name: name.trim(),
                    avatar: '',
                    bio: '社区活跃用户',
                    followers: Math.floor(Math.random() * 500) + 50
                  } as any)
                  saveNPCs(existingNPCs)
                }

                const newPost = {
                  id: `post-${Date.now()}`,
                  npcId: `npc-${name.trim()}`,
                  content: `${postContent} #${decodedName}`,
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
                console.log(`✅ 帖子已发布: ${name.trim()}`)
              } catch (e) {
                console.error('发帖失败:', e)
              }
            }
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

  return {
    chatMessages,
    chatInput,
    setChatInput,
    isSendingChat,
    myAvatar,
    chatContainerRef,
    handleSendChat
  }
}
