import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Smile, Send, MoreHorizontal, Image as ImageIcon, Phone, Mic, PlusCircle, Video } from 'lucide-react'
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
 * 仿抖音私信界面
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userInfo = getUserInfo()

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
      // 获取会话信息
      const conversations = getDMConversations()
      const conv = conversations.find(c => c.id === npcId)
      if (conv) {
        setNpcName(conv.name)
        setNpcAvatar(conv.avatar)
      }

      // 尝试获取角色详细信息
      const characters = await getAllCharacters()
      const char = characters.find(c => c.id === npcId)
      if (char) {
        setCharacter(char as Character)
        setNpcName(char.nickname || char.realName)
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
    }
  }, [npcId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiReplying])

  // 🔥 构建论坛私聊专用提示词
  const buildDMSystemPrompt = async () => {
    if (!character) return ''

    const userName = userInfo.realName || userInfo.nickname || '用户'
    const userNickname = userInfo.nickname || userInfo.realName || '用户'
    const charName = character.nickname || character.realName
    const personality = character.personality || '普通人'
    const signature = (character as any).signature || ''

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
${(character as any).isPublicFigure ? `
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

  // AI主动回复
  const handleAIReply = async () => {
    if (!npcId || !character) return
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
    if (!inputText.trim()) {
      handleAIReply()
      return
    }

    const userMessage = inputText.trim()
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

  const handleSendEmoji = (emoji: Emoji) => {
    if (!npcId) return
    sendEmojiFromUser(npcId, npcName, npcAvatar, emoji.url, emoji.description)
    setMessages(getDMMessages(npcId))
    setShowEmojiPanel(false)
  }

  const getAvatarColor = (name: string) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6']
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
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {/* 顶部导航 - 抖音风格 */}
      <div className="bg-white sticky top-0 z-20 border-b border-gray-200">
        <StatusBar theme="dark" />
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/instagram/activity')}
            className="w-10 h-10 flex items-center justify-center -ml-2 active:opacity-60 transition-opacity"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <span className="text-[17px] font-bold text-gray-900">{npcName || '私聊'}</span>
              {(character as any)?.isPublicFigure && (
                <span className="bg-yellow-500 text-black text-[9px] px-1 rounded font-bold">V</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[11px] text-gray-400">在线</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="active:opacity-60">
              <Phone className="w-6 h-6 text-gray-700" />
            </button>
            <button className="active:opacity-60">
              <MoreHorizontal className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Smile className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-400">打个招呼吧</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, index) => {
              const showTime = index === 0 || shouldShowTime(msg.timestamp, messages[index - 1].timestamp)
              return (
                <div key={msg.id} className="flex flex-col">
                  {showTime && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] text-gray-500">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`flex max-w-[75%] ${msg.isFromUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2.5`}>
                      {/* 头像 */}
                      <div className="flex-shrink-0 w-9 h-9">
                        {!msg.isFromUser ? (
                          npcAvatar ? (
                            <img src={npcAvatar} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ background: getAvatarColor(npcName || 'A') }}
                            >
                              {(npcName || 'A')[0]}
                            </div>
                          )
                        ) : (
                          <img src={userInfo.avatar || '/default-avatar.png'} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                        )}
                      </div>

                      <div className={`flex flex-col ${msg.isFromUser ? 'items-end' : 'items-start'}`}>
                        {msg.type === 'emoji' && msg.emojiUrl ? (
                          <img
                            src={msg.emojiUrl}
                            alt={msg.content}
                            className="w-32 h-32 object-contain"
                          />
                        ) : (
                          <div
                            className={`px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap ${msg.isFromUser
                                ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm'
                                : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm shadow-sm'
                              }`}
                          >
                            <EmojiContentRenderer
                              content={msg.content}
                              emojiSize={22}
                              className={msg.isFromUser ? 'text-white' : 'text-gray-900'}
                            />
                          </div>
                        )}
                        {/* 状态/已读 */}
                        {msg.isFromUser && index === messages.length - 1 && (
                          <span className="text-[10px] text-gray-500 mt-1 mr-1">已读</span>
                        )}
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
          <div className="flex items-end gap-2.5 mt-2">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* 底部输入区域 - 抖音风格 */}
      <div className="bg-white border-t border-gray-200 px-3 py-2 safe-area-inset-bottom">
        <div className="flex items-end gap-3">
          <button className="mb-2 text-gray-600 active:opacity-60">
            <Mic className="w-7 h-7" />
          </button>

          <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 min-h-[40px]">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="发送消息..."
              className="flex-1 bg-transparent outline-none text-[15px] text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={() => setShowEmojiPanel(true)}
              className="ml-2 text-gray-400 hover:text-yellow-500 transition-colors"
            >
              <Smile className="w-6 h-6" />
            </button>
          </div>

          {inputText.trim() ? (
            <button
              onClick={handleSend}
              className="mb-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold active:scale-95 transition-transform"
            >
              发送
            </button>
          ) : (
            <button className="mb-2 text-gray-600 active:opacity-60">
              <PlusCircle className="w-7 h-7" />
            </button>
          )}
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
