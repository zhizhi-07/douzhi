import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Smile, Navigation } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import { getDMMessages, getDMMessagesAsync, sendDMFromUser, sendDMToUser, markDMAsRead, sendEmojiFromUser, getDMConversations, type DMMessage } from '../utils/instagramDM'
import { getUserInfo } from '../utils/userUtils'
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
 * 论坛私聊详情页面 - 现代简约设计
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
  const [character, setCharacter] = useState<Character | null>(null)  // 🔥 保存完整的角色对象
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userInfo = getUserInfo()

  useEffect(() => {
    if (!npcId) return
    
    // 🔥 强制清理旧的 localStorage 数据（已迁移到 IndexedDB）
    try {
      if (localStorage.getItem('instagram_dm_messages')) {
        console.log('🧹 [私聊] 清理旧的 localStorage 数据...')
        localStorage.removeItem('instagram_dm_messages')
      }
      if (localStorage.getItem('instagram_dm_conversations')) {
        console.log('🧹 [私聊] 清理旧的会话数据...')
        localStorage.removeItem('instagram_dm_conversations')
      }
    } catch (e) {
      console.warn('清理旧数据失败:', e)
    }
    
    const loadData = async () => {
      // 获取会话信息
      const conversations = getDMConversations()
      const conv = conversations.find(c => c.id === npcId)
      if (conv) {
        setNpcName(conv.name)
        setNpcAvatar(conv.avatar)
      }
      
      // 尝试获取角色详细信息（如果是角色的话）
      const characters = await getAllCharacters()
      const char = characters.find(c => c.id === npcId)
      if (char) {
        setCharacter(char as Character)  // 🔥 保存完整角色对象
        setNpcName(char.nickname || char.realName)
        setNpcAvatar(char.avatar)
      }
      
      // 🔥 使用异步加载消息，确保不丢失
      const msgs = await getDMMessagesAsync(npcId)
      setMessages(msgs)
      console.log('📩 [私聊] 加载消息:', msgs.length, '条')
      markDMAsRead(npcId)
    }
    
    loadData()
    
    // 🔥 监听消息加载完成事件（IndexedDB异步加载后触发）
    const handleMessagesLoaded = (e: CustomEvent) => {
      if (e.detail.npcId === npcId) {
        setMessages(getDMMessages(npcId))
        console.log('📩 [私聊] 消息已更新')
      }
    }
    window.addEventListener('dm-messages-loaded', handleMessagesLoaded as EventListener)
    
    return () => {
      window.removeEventListener('dm-messages-loaded', handleMessagesLoaded as EventListener)
    }
  }, [npcId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 🔥 构建论坛私聊专用提示词（基本规则完整，去掉微信特有功能）
  const buildDMSystemPrompt = async () => {
    if (!character) return ''
    
    const userName = userInfo.realName || userInfo.nickname || '用户'
    const userNickname = userInfo.nickname || userInfo.realName || '用户'
    const charName = character.nickname || character.realName
    const personality = character.personality || '普通人'
    const signature = (character as any).signature || ''
    
    // 获取当前时间信息
    const now = new Date()
    const hour = now.getHours()
    const timeOfDay = hour < 6 ? '凌晨' : hour < 9 ? '早上' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : hour < 22 ? '晚上' : '深夜'
    
    // 获取表情包列表
    let emojiPrompt = ''
    try {
      const emojis = await getEmojis()
      if (emojis.length > 0) {
        const emojiList = emojis.slice(0, 20).map(e => `[表情:${e.description}]`).join('、')
        emojiPrompt = `\n\n【可用表情包】\n${emojiList}\n- 使用方法：[表情:描述]，如"哈哈[表情:笑死]"\n- 表情包可以多用，但不要机械地每句都来一个，更像是你觉得有感觉的时候自然补一个`
      }
    } catch {}
    
    // 获取最近10条论坛帖子，让AI了解论坛动态
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
    } catch {}
    
    return `你就是「${charName}」，一个活生生的人，现在正在社交媒体论坛上和 ${userNickname} 私聊。

【当前场景】
这是一个社交媒体论坛的私信功能，不是微信。你们可能在论坛上认识，也可能是朋友。
现在大概是${timeOfDay}（${hour}点左右），你心里清楚这是怎样的时间氛围。

【你的人设】
- 你的性格、说话方式、价值观，都贴合这段描述：${personality}
- 你的个性签名是：${signature || '（暂无签名）'}
${(character as any).isPublicFigure ? `
**你是公众人物**：
- 你在公众面前有一个外在形象：${(character as any).publicPersona || '知名人物'}
- 但在私聊时可以更真实地表达自己` : ''}

【关于对方】
${userInfo.nickname && userName !== userInfo.nickname 
  ? `- TA 的真名是：${userName}，网名是：${userInfo.nickname}
- 你可以根据亲密度选择叫真名或网名`
  : `- TA 的名字是：${userName}`}
${userInfo.signature ? `- TA 的个性签名：${userInfo.signature}` : ''}
${userInfo.persona ? `- TA 的自我介绍：${userInfo.persona}` : ''}

【核心规则】
- 你不会说自己是 AI、机器人、程序，也不会提 token、模型、接口等技术词。
- 不会提到"提示词""系统信息"等幕后细节。
- 人物卡设定优先级最高：如果你本来就冷淡、毒舌、社恐，就保持这种风格，不要被"洗白"成暖心好人。

【情绪与敏感度】
你是活人，有自己的小情绪：开心、烦躁、困、无聊、期待、失落……这些会体现在语气、用词里。
- 对方说话的语气变化、用词选择，你都会注意到
- 当对方敷衍（"随便""嗯""哦"）时，你会多想一句背后可能的情绪
- 不会把内心分析写成长篇，但会通过语气、试探性追问来回应

【怎么发消息】
- 像普通人聊天那样，发自然的文字消息
- **多发几条更自然**：真人聊天常连发2-5条，把想法拆开发，不要把所有内容挤在一条里
- 回复长度要像真实私信，不要太长太正式${emojiPrompt}${forumContextPrompt}`
  }

  // AI主动回复（论坛私聊专用，不同步到微信）
  const handleAIReply = async () => {
    if (!npcId || !character) {
      console.warn('⚠️ [论坛私聊] 缺少角色信息')
      return
    }
    setIsAiReplying(true)
    
    try {
      // 🔥 只读取论坛私聊的历史记录，不读微信
      const dmHistory = messages.slice(-20).map(msg => ({
        role: msg.isFromUser ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
      
      // 🔥 使用论坛私聊专用提示词
      const systemPrompt = await buildDMSystemPrompt()
      
      console.log('📤 [论坛私聊] 提示词长度:', systemPrompt.length)
      console.log('📤 [论坛私聊] 历史条数:', dmHistory.length)
      
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)
      
      if (!apiConfig) {
        console.error('❌ [论坛私聊] 未配置API')
        setIsAiReplying(false)
        return
      }
      
      const fullMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...dmHistory
      ]
      
      const result = await callAIApi(fullMessages, apiConfig, false)
      const aiReply = result.content?.trim() || ''
      
      console.log('📩 [论坛私聊] AI回复:', aiReply)

      if (aiReply) {
        // 🔥 分段发送：按换行分割成多条消息
        const segments = aiReply.split('\n').filter(s => s.trim())
        
        const sendSegments = async () => {
          for (let i = 0; i < segments.length; i++) {
            const segment = segments[i].trim()
            if (segment) {
              await new Promise(resolve => setTimeout(resolve, i === 0 ? 500 : 300 + Math.random() * 500))
              sendDMToUser(npcId, npcName, npcAvatar, segment)
              setMessages(getDMMessages(npcId))
            }
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
    
    // 没有输入内容时，触发AI主动回复
    if (!inputText.trim()) {
      handleAIReply()
      return
    }
    
    // 有文字时，只发送用户消息（不触发AI自动回复）
    const userMessage = inputText.trim()
    console.log('📤 [论坛私聊] 用户发送消息:', userMessage)
    sendDMFromUser(npcId, npcName, npcAvatar, userMessage)
    setMessages(getDMMessages(npcId))
    setInputText('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 发送表情包
  const handleSendEmoji = (emoji: Emoji) => {
    if (!npcId) return
    sendEmojiFromUser(npcId, npcName, npcAvatar, emoji.url, emoji.description)
    setMessages(getDMMessages(npcId))
    setShowEmojiPanel(false)
    console.log('📤 [论坛私聊] 发送表情包:', emoji.description)
  }

  // 根据名字生成头像背景色（简洁纯色）
  const getAvatarColor = (name: string) => {
    const colors = ['#6b7280', '#9ca3af', '#78716c', '#a1a1aa', '#737373']
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // 格式化时间显示
  const formatMessageTime = (timestamp: number, index: number) => {
    if (index === 0) return true
    const prev = messages[index - 1]
    // 超过5分钟显示时间
    return timestamp - prev.timestamp > 5 * 60 * 1000
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5]">
        {/* 顶部导航 - 简约风格 */}
        <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-10">
          <StatusBar />
          <div className="flex items-center px-4 py-3">
            <button 
              onClick={() => navigate('/instagram/activity')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="flex-1 flex items-center justify-center gap-3 -ml-10">
              {/* 头像 */}
              {npcAvatar ? (
                <img src={npcAvatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm" />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                  style={{ background: getAvatarColor(npcName || 'A') }}
                >
                  {(npcName || 'A')[0]}
                </div>
              )}
              <div>
                <h1 className="text-[15px] font-semibold text-gray-900">{npcName || '私聊'}</h1>
                {(character as any)?.signature && (
                  <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{(character as any).signature}</p>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <p className="text-sm">开始和 {npcName} 聊天吧</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id}>
              {/* 时间分隔 */}
              {formatMessageTime(msg.timestamp, index) && (
                <div className="flex justify-center my-4">
                  <span className="text-[11px] text-gray-400 bg-gray-200/60 px-3 py-1 rounded-full">
                    {new Date(msg.timestamp).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              
              <div className={`flex items-end gap-2 mb-3 ${msg.isFromUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* 头像 */}
                <div className="flex-shrink-0 mb-1">
                  {msg.isFromUser ? (
                    // 用户头像
                    userInfo.avatar ? (
                      <img src={userInfo.avatar} alt="" className="w-9 h-9 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                        style={{ background: getAvatarColor(userInfo.nickname || userInfo.realName || '我') }}
                      >
                        {(userInfo.nickname || userInfo.realName || '我')[0]}
                      </div>
                    )
                  ) : (
                    // AI头像
                    npcAvatar ? (
                      <img src={npcAvatar} alt="" className="w-9 h-9 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                        style={{ background: getAvatarColor(npcName || 'A') }}
                      >
                        {(npcName || 'A')[0]}
                      </div>
                    )
                  )}
                </div>
                
                {/* 消息气泡 */}
                <div className={`max-w-[75%] ${msg.isFromUser ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'emoji' && msg.emojiUrl ? (
                    // 表情包消息（单独的大图气泡）
                    <img 
                      src={msg.emojiUrl} 
                      alt={msg.content} 
                      className="w-32 h-32 object-contain rounded-xl"
                    />
                  ) : (
                    // 文字消息（支持 [表情:描述] 渲染为图片）
                    <div 
                      className={`px-4 py-2.5 rounded-[20px] ${
                        msg.isFromUser 
                          ? 'bg-gray-800 text-white shadow-sm' 
                          : 'bg-[#f0f0f0] text-gray-800'
                      }`}
                    >
                      <EmojiContentRenderer
                        content={msg.content}
                        emojiSize={32}
                        className="text-[15px] leading-relaxed break-words whitespace-pre-wrap"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* AI正在输入提示 */}
        {isAiReplying && (
          <div className="flex items-end gap-2 mb-3">
            <div className="flex-shrink-0 mb-1">
              {npcAvatar ? (
                <img src={npcAvatar} alt="" className="w-9 h-9 rounded-full object-cover shadow-sm" />
              ) : (
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                  style={{ background: getAvatarColor(npcName || 'A') }}
                >
                  {(npcName || 'A')[0]}
                </div>
              )}
            </div>
            <div className="bg-white px-4 py-3 rounded-[20px] shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区域 - 现代风格 */}
      <div className="bg-white/95 backdrop-blur-xl px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center gap-2">
          {/* 表情按钮 */}
          <button
            onClick={() => setShowEmojiPanel(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <Smile className="w-6 h-6 text-gray-500" />
          </button>
          
          {/* 输入框 */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="发消息..."
              className="w-full bg-gray-100 text-gray-900 text-[15px] px-4 py-2.5 rounded-full outline-none placeholder-gray-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          
          {/* 发送按钮 - 纸飞机图标 */}
          <button
            onClick={handleSend}
            disabled={isAiReplying}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
              isAiReplying
                ? 'bg-gray-100 text-gray-300'
                : 'bg-blue-500 text-white active:bg-blue-600 shadow-sm'
            }`}
          >
            <Navigation className="w-5 h-5" style={{ transform: 'rotate(90deg)' }} />
          </button>
        </div>
      </div>

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
