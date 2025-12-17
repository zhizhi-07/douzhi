import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MoreHorizontal, Phone, Mic, Smile, Play, Pause, Trash2, X, Check } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import { getDMMessages, getDMMessagesAsync, sendDMFromUser, sendDMToUser, markDMAsRead, sendEmojiFromUser, sendVoiceFromUser, getDMConversations, clearDMMessages, deleteDMMessages, preloadDMData, type DMMessage } from '../utils/instagramDM'
import { getUserInfoWithAvatar, type UserInfo } from '../utils/userUtils'
import EmojiPanel from '../components/EmojiPanel'
import EmojiContentRenderer from '../components/EmojiContentRenderer'
import type { Emoji } from '../utils/emojiStorage'
import { getAllCharacters } from '../utils/characterManager'
import { callAIApi } from '../utils/chatApi'
import { getAllPosts, getNPCById } from '../utils/forumNPC'
import { apiService } from '../services/apiService'
import type { Character } from '../types/chat'
import { getEmojis } from '../utils/emojiStorage'

/**
 * 仿抖音私信界面 - 文艺复古版
 */
const InstagramDMDetail = () => {
  const navigate = useNavigate()
  const { npcId } = useParams<{ npcId: string }>()
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [npcName, setNpcName] = useState('')
  const [npcAvatar, setNpcAvatar] = useState<string | undefined>()
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  const [isAiReplying, setIsAiReplying] = useState(false)
  const [character, setCharacter] = useState<Character | null>(null)
  const [publicLabel, setPublicLabel] = useState<string>('')  // 公众人物标签（如：音乐人、主播）
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: '', realName: '' })
  
  // 语音消息模式（打字发送但显示为语音样式）
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  
  // 播放中的语音ID
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 菜单和选择模式
  const [showMenu, setShowMenu] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!npcId) return

    // 🔥 强制清理旧的 localStorage 数据（已迁移到 IndexedDB）
    try {
      if (localStorage.getItem('instagram_dm_messages')) {
        localStorage.removeItem('instagram_dm_messages')
      }
      if (localStorage.getItem('instagram_dm_conversations')) {
        localStorage.removeItem('instagram_dm_conversations')
      }
    } catch (e) {
      console.warn('清理旧数据失败:', e)
    }

    const loadData = async () => {
      // 🔥 先预加载IndexedDB数据
      await preloadDMData()
      // Load user info with avatar
      const info = await getUserInfoWithAvatar()
      setUserInfo(info)

      // 获取会话信息
      const conversations = getDMConversations()
      const conv = conversations.find(c => c.id === npcId)
      if (conv) {
        setNpcName(conv.name)
        setNpcAvatar(conv.avatar)
      }

      // 读取公众人物标签（从主页刷新后存储的）
      const savedLabel = localStorage.getItem(`public-label-${npcId}`)
      if (savedLabel && savedLabel !== '__none__') {
        setPublicLabel(savedLabel)
      }

      // 尝试获取论坛NPC信息
      const forumNpc = getNPCById(npcId)
      if (forumNpc && !conv) {
        setNpcName(forumNpc.name)
        setNpcAvatar(forumNpc.avatar)
      }

      // 尝试获取AI角色详细信息
      const characters = await getAllCharacters()
      const char = characters.find(c => c.id === npcId)
      if (char) {
        setCharacter(char as Character)
        setNpcName(char.remark || char.nickname || char.realName)
        setNpcAvatar(char.avatar)
      }

      const msgs = await getDMMessagesAsync(npcId)
      setMessages(msgs)
      markDMAsRead(npcId)
    }

    loadData()

    const handleMessagesLoaded = (e: CustomEvent) => {
      if (e.detail.npcId === npcId) {
        setMessages(getDMMessages(npcId))
      }
    }
    window.addEventListener('dm-messages-loaded', handleMessagesLoaded as EventListener)

    return () => {
      window.removeEventListener('dm-messages-loaded', handleMessagesLoaded as EventListener)
      // 清理语音定时器
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current)
      }
    }
  }, [npcId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiReplying])

  // 处理语音播放
  const handlePlayVoice = (id: string, duration: number) => {
    // 如果点击正在播放的，则暂停（重置）
    if (playingVoiceId === id) {
      setPlayingVoiceId(null)
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current)
        voiceTimeoutRef.current = null
      }
      return
    }

    // 播放新的
    setPlayingVoiceId(id)
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current)
    }

    // 模拟播放结束
    voiceTimeoutRef.current = setTimeout(() => {
      setPlayingVoiceId(null)
      voiceTimeoutRef.current = null
    }, duration * 1000)
  }

  // 🔥 构建论坛私聊专用提示词
  const buildDMSystemPrompt = async () => {
    const userName = userInfo.realName || userInfo.nickname || '用户'
    const userNickname = userInfo.nickname || userInfo.realName || '用户'
    
    // 如果是AI角色，使用角色人设
    const charName = character?.nickname || character?.realName || npcName || '网友'
    const personality = character?.personality || '普通网友，说话随意自然'
    const signature = (character as any)?.signature || ''

    const now = new Date()
    const hour = now.getHours()
    const timeOfDay = hour < 6 ? '凌晨' : hour < 9 ? '早上' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : hour < 22 ? '晚上' : '深夜'

    let emojiPrompt = ''
    try {
      const emojis = await getEmojis()
      if (emojis.length > 0) {
        const emojiList = emojis.slice(0, 20).map(e => `[表情:${e.description}]`).join('、')
        emojiPrompt = `\n\n【可用表情包】\n${emojiList}\n- 使用方法：[表情:描述]，如"哈哈[表情:笑死]"\n- 表情包可以多用，但不要机械地每句都来一个`
      }
    } catch { }

    let forumContextPrompt = ''
    try {
      const recentPosts = getAllPosts()
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
      if (recentPosts.length > 0) {
        const postsText = recentPosts.map(p => {
          const authorName = p.npcId === 'user'
            ? (userInfo.nickname || userInfo.realName || '用户')
            : (getNPCById(p.npcId)?.name || p.npcId)
          return `【${authorName}】${p.content.substring(0, 60)}${p.content.length > 60 ? '...' : ''}`
        }).join('\n')
        forumContextPrompt = `\n\n【论坛最近动态】\n${postsText}`
      }
    } catch { }

    return `你就是「${charName}」，一个活生生的人，现在正在社交媒体论坛上和 ${userNickname} 私聊。
【当前场景】
这是一个社交媒体论坛的私信功能。
现在大概是${timeOfDay}（${hour}点左右）。

【你的人设】
- 性格、说话方式：${personality}
- 个性签名：${signature || '（暂无签名）'}
${(character as any)?.isPublicFigure ? `
**你是公众人物**：
- 外在形象：${(character as any).publicPersona || '知名人物'}
- 私聊时可以更真实` : ''}

【关于对方】
${userInfo.nickname && userName !== userInfo.nickname
        ? `- TA 的真名是：${userName}，网名是：${userInfo.nickname}`
        : `- TA 的名字是：${userName}`}
${userInfo.signature ? `- TA 的个性签名：${userInfo.signature}` : ''}

【核心规则】
- 绝不说自己是AI。
- 保持人设，不要被洗白。
- 像真人一样聊天，多发几条短消息比一条长消息更自然。
${emojiPrompt}${forumContextPrompt}`
  }

  // AI主动回复（支持AI角色和NPC网友）
  const handleAIReply = async () => {
    if (!npcId) return
    setIsAiReplying(true)

    try {
      const dmHistory = messages.slice(-20).map(msg => ({
        role: msg.isFromUser ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))

      const systemPrompt = await buildDMSystemPrompt()
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (!apiConfig) {
        setIsAiReplying(false)
        return
      }

      const fullMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...dmHistory
      ]

      const result = await callAIApi(fullMessages, apiConfig, false)
      const aiReply = result.content?.trim() || ''

      if (aiReply) {
        // 检测并分离表情包和文本（支持 [emoji:xxx] 和 [表情:xxx] 两种格式）
        const emojiRegex = /\[(emoji|表情):([^\]]+)\]/g
        const parts: { type: 'text' | 'emoji', content: string }[] = []
        let lastIndex = 0
        let match
        
        while ((match = emojiRegex.exec(aiReply)) !== null) {
          if (match.index > lastIndex) {
            const textBefore = aiReply.slice(lastIndex, match.index).trim()
            if (textBefore) parts.push({ type: 'text', content: textBefore })
          }
          parts.push({ type: 'emoji', content: match[2] })  // match[2] 是表情描述
          lastIndex = match.index + match[0].length
        }
        if (lastIndex < aiReply.length) {
          const remaining = aiReply.slice(lastIndex).trim()
          if (remaining) parts.push({ type: 'text', content: remaining })
        }
        
        // 如果没有检测到表情包，按原来的方式处理
        if (parts.length === 0) {
          parts.push({ type: 'text', content: aiReply })
        }
        
        const sendSegments = async () => {
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            await new Promise(resolve => setTimeout(resolve, i === 0 ? 500 : 300 + Math.random() * 500))
            
            if (part.type === 'emoji') {
              // 发送表情包
              const emojis = await getEmojis()
              const emoji = emojis.find(e => e.description?.includes(part.content) || e.url.includes(part.content))
              if (emoji) {
                sendEmojiFromUser(npcId, npcName, npcAvatar, emoji.url, emoji.description || '', true)
              }
            } else {
              // 发送文本（按行分开）
              const lines = part.content.split('\n').filter(s => s.trim())
              for (let j = 0; j < lines.length; j++) {
                if (j > 0) await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
                sendDMToUser(npcId, npcName, npcAvatar, lines[j].trim())
                setMessages(getDMMessages(npcId))
              }
            }
            setMessages(getDMMessages(npcId))
          }
          setIsAiReplying(false)
        }
        sendSegments()
      } else {
        setIsAiReplying(false)
      }
    } catch (error) {
      console.error('AI回复失败:', error)
      setIsAiReplying(false)
    }
  }

  const handleSend = () => {
    if (!npcId) return
    if (!inputText.trim()) {
      handleAIReply()
      return
    }

    const userMessage = inputText.trim()
    
    if (isVoiceMode) {
      // 语音模式：发送语音消息（内容是文字，显示为语音样式）
      const duration = Math.max(1, Math.ceil(userMessage.length / 5))  // 根据文字长度估算时长
      sendVoiceFromUser(npcId, npcName, npcAvatar, duration, userMessage)
      setMessages(getDMMessages(npcId))
      setIsVoiceMode(false)  // 发送后退出语音模式
    } else {
      // 普通文字消息
      sendDMFromUser(npcId, npcName, npcAvatar, userMessage)
      setMessages(getDMMessages(npcId))
    }
    setInputText('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSendEmoji = (emoji: Emoji) => {
    if (!npcId) return
    sendEmojiFromUser(npcId, npcName, npcAvatar, emoji.url, emoji.description)
    setMessages(getDMMessages(npcId))
    setShowEmojiPanel(false)
  }

  const getAvatarColor = (name: string) => {
    const colors = ['#8C8C8C', '#5A5A5A', '#2C2C2C', '#D4D4D4', '#e5e5e5']
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const shouldShowTime = (current: number, prev: number) => {
    return current - prev > 5 * 60 * 1000
  }

  return (
    <div className="h-screen flex flex-col bg-transparent font-sans text-slate-900 soft-page-enter">
      {/* 顶部导航 - 现代社交风格 */}
      <div className="bg-white/70 sticky top-0 z-20 backdrop-blur-xl border-b border-gray-100">
        <StatusBar theme="dark" />
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/instagram/activity')}
              className="w-10 h-10 flex items-center justify-center -ml-2 active:opacity-60 transition-opacity text-slate-900"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2]" />
            </button>

            <div className="flex items-center gap-3">
              {/* 顶部头像 */}
              <div className="relative">
                {npcAvatar ? (
                  <img src={npcAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: getAvatarColor(npcName || 'A') }}
                  >
                    {(npcName || 'A')[0]}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[16px] font-semibold text-slate-900 leading-tight">{npcName || '私信'}</span>
                  {publicLabel && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                      {publicLabel}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">在线</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 pr-1 relative">
            <button className="active:opacity-60 text-slate-900">
              <Phone className="w-[26px] h-[26px] stroke-[1.5]" />
            </button>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="active:opacity-60 text-slate-900"
            >
              <MoreHorizontal className="w-[26px] h-[26px] stroke-[1.5]" />
            </button>
            
            {/* 下拉菜单 */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-40">
                  <button
                    onClick={() => {
                      setIsSelectMode(true)
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Check className="w-5 h-5 text-gray-400" />
                    选择消息删除
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定要清除全部聊天记录吗？此操作不可恢复！')) {
                        if (npcId) {
                          clearDMMessages(npcId)
                          setMessages([])
                        }
                      }
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3"
                  >
                    <Trash2 className="w-5 h-5" />
                    清除全部记录
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <img
                src={npcAvatar || userInfo.avatar}
                className="w-20 h-20 rounded-full opacity-50 object-cover"
                alt=""
              />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2">{npcName}</p>
            <p className="text-xs text-gray-500 mt-1">Instagram • {publicLabel || '热门博主'}</p>
            <button className="mt-6 px-4 py-2 bg-gray-100 text-sm font-semibold rounded-lg text-gray-900">
              查看个人主页
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg, index) => {
              const showTime = index === 0 || shouldShowTime(msg.timestamp, messages[index - 1].timestamp)
              return (
                <div key={msg.id} className="flex flex-col">
                  {showTime && (
                    <div className="flex justify-center my-5">
                      <span className="text-[11px] text-gray-400 font-medium">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'} group mb-4`}>
                    {/* 选择模式的复选框 */}
                    {isSelectMode && (
                      <button
                        onClick={() => {
                          const newSet = new Set(selectedMsgIds)
                          if (newSet.has(msg.id)) {
                            newSet.delete(msg.id)
                          } else {
                            newSet.add(msg.id)
                          }
                          setSelectedMsgIds(newSet)
                        }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-2 flex-shrink-0 self-center transition-all ${
                          selectedMsgIds.has(msg.id) 
                            ? 'bg-red-500 border-red-500' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {selectedMsgIds.has(msg.id) && <Check className="w-4 h-4 text-white" />}
                      </button>
                    )}
                    <div className={`flex max-w-[70%] ${msg.isFromUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
                      {/* 头像 */}
                      <div className="flex-shrink-0 w-8 h-8 mt-1">
                        {msg.isFromUser ? (
                          // 用户头像
                          userInfo.avatar ? (
                            <img src={userInfo.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-[#3797F0]"
                            >
                              {(userInfo.nickname || userInfo.realName || '我')[0]}
                            </div>
                          )
                        ) : (
                          // AI头像
                          npcAvatar ? (
                            <img src={npcAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ background: getAvatarColor(npcName || 'A') }}
                            >
                              {(npcName || 'A')[0]}
                            </div>
                          )
                        )}
                      </div>

                      <div className={`flex flex-col ${msg.isFromUser ? 'items-end' : 'items-start'}`}>
                        {msg.type === 'voice' ? (
                          // 语音消息 - 紧凑版
                          <div
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all active:scale-95 shadow-sm ${msg.isFromUser
                              ? 'bg-[#5B6EF5] text-white rounded-[20px] rounded-tr-md'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-[20px] rounded-tl-md'
                            }`}
                            style={{ minWidth: '100px', maxWidth: '240px' }}
                            onClick={() => handlePlayVoice(msg.id, msg.voiceDuration || 1)}
                          >
                            {/* 播放/暂停按钮 - 更小巧 */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              msg.isFromUser ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {playingVoiceId === msg.id ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              )}
                            </div>

                            {/* 声波可视化 - 更简洁 */}
                            <div className="flex items-center gap-[2px] h-4 flex-1 justify-end px-1">
                              {[40, 70, 45, 90, 60, 50, 80, 55, 75].map((h, i) => (
                                <div
                                  key={i}
                                  className={`w-[2px] rounded-full transition-all duration-300 ${
                                    msg.isFromUser ? 'bg-white/70' : 'bg-gray-400'
                                  } ${playingVoiceId === msg.id ? 'animate-pulse' : ''}`}
                                  style={{ 
                                    height: `${h}%`,
                                    animationDelay: `${i * 0.1}s`,
                                    opacity: playingVoiceId === msg.id ? 1 : 0.7
                                  }}
                                />
                              ))}
                            </div>

                            {/* 时长 */}
                            <span className={`text-xs font-medium whitespace-nowrap min-w-[20px] text-right ${
                              msg.isFromUser ? 'text-white/90' : 'text-gray-500'
                            }`}>
                              {msg.voiceDuration || 1}"
                            </span>
                          </div>
                        ) : msg.type === 'emoji' && msg.emojiUrl ? (
                          <img
                            src={msg.emojiUrl}
                            alt={msg.content}
                            className="w-32 h-32 object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div
                            className={`px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-sm ${msg.isFromUser
                              ? 'bg-[#5B6EF5] text-white rounded-[20px] rounded-tr-md'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-[20px] rounded-tl-md'
                              }`}
                          >
                            <EmojiContentRenderer
                              content={msg.content}
                              emojiSize={18}
                              className={msg.isFromUser ? 'text-white' : 'text-gray-800'}
                            />
                          </div>
                        )}
                        {/* 状态/已读 - 在用户最后一条消息上显示，AI回复了显示已读，否则已送达 */}
                        {msg.isFromUser && (() => {
                          // 检查是否是用户发送的最后一条消息
                          const lastUserMsgIndex = messages.map((m, i) => m.isFromUser ? i : -1).filter(i => i >= 0).pop()
                          if (index !== lastUserMsgIndex) return null
                          // 检查后面是否有AI回复
                          const hasAIReply = messages.slice(index + 1).some(m => !m.isFromUser)
                          return <span className="text-[10px] text-gray-400 mt-1 mr-1">{hasAIReply ? '已读' : '已送达'}</span>
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* AI正在输入 */}
        {isAiReplying && (
          <div className="flex items-end gap-2 mt-4 ml-9">
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-[20px] rounded-tl-md">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* 底部输入区域 / 选择模式操作栏 */}
      {isSelectMode ? (
        <div className="bg-white border-t border-gray-100 px-4 py-3 safe-area-inset-bottom">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setIsSelectMode(false)
                setSelectedMsgIds(new Set())
              }}
              className="px-4 py-2 text-gray-600 font-medium"
            >
              <X className="w-5 h-5 inline mr-1" />
              取消
            </button>
            <span className="text-sm text-gray-500">
              已选择 {selectedMsgIds.size} 条
            </span>
            <button
              onClick={() => {
                if (selectedMsgIds.size > 0 && npcId) {
                  if (confirm(`确定要删除选中的 ${selectedMsgIds.size} 条消息吗？`)) {
                    const newMessages = deleteDMMessages(npcId, Array.from(selectedMsgIds))
                    setMessages(newMessages)
                    setSelectedMsgIds(new Set())
                    setIsSelectMode(false)
                  }
                }
              }}
              disabled={selectedMsgIds.size === 0}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedMsgIds.size > 0 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Trash2 className="w-5 h-5 inline mr-1" />
              删除
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl px-4 py-3 safe-area-inset-bottom">
          <div className="flex items-center gap-3">
            <div className={`flex-1 rounded-full flex items-center px-4 py-2.5 min-h-[44px] ${
              isVoiceMode ? 'bg-green-50 border border-green-200' : 'bg-[#EFEFEF]'
            }`}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isVoiceMode ? "输入语音内容..." : "发消息..."}
                className="flex-1 bg-transparent outline-none text-[15px] text-slate-900 placeholder-gray-500"
              />
              {inputText.trim() ? (
                <button
                  onClick={handleSend}
                  className={`ml-2 font-semibold text-sm transition-colors ${
                    isVoiceMode ? 'text-green-600 hover:text-green-700' : 'text-[#5B6EF5] hover:text-[#4A5BD4]'
                  }`}
                >
                  {isVoiceMode ? '发送语音' : '发送'}
                </button>
              ) : (
                <div className="flex items-center gap-3 ml-2">
                  {/* 语音模式切换按钮 - 在右边 */}
                  <button 
                    onClick={() => setIsVoiceMode(!isVoiceMode)}
                    className={`transition-colors ${isVoiceMode ? 'text-[#5B6EF5]' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    <Mic className="w-6 h-6 stroke-[1.5]" />
                  </button>
                  <button
                    onClick={() => setShowEmojiPanel(true)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <Smile className="w-6 h-6 stroke-[1.5]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 表情包面板 */}
      <EmojiPanel
        show={showEmojiPanel}
        onClose={() => setShowEmojiPanel(false)}
        onSelect={handleSendEmoji}
      />
    </div>
  )
}

export default InstagramDMDetail
