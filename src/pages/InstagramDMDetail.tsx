import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Smile, Navigation } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import { getDMMessages, getDMMessagesAsync, sendDMFromUser, sendDMToUser, markDMAsRead, sendEmojiFromUser, getDMConversations, type DMMessage } from '../utils/instagramDM'
import { getUserInfo } from '../utils/userUtils'
import EmojiPanel from '../components/EmojiPanel'
import type { Emoji } from '../utils/emojiStorage'
import { getAllCharacters } from '../utils/characterManager'
import { buildSystemPrompt, callAIApi } from '../utils/chatApi'
import { loadMessages, addMessage } from '../utils/simpleMessageManager'
import { apiService } from '../services/apiService'
import { convertToApiMessages } from '../utils/messageUtils'
import type { Message, Character } from '../types/chat'

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

  // 🔥 同步消息到主聊天记录
  const syncToMainChat = (content: string, type: 'sent' | 'received', aiReadableContent?: string) => {
    if (!npcId) return
    
    const msg: Message = {
      id: Date.now(),
      type,
      content,
      aiReadableContent: aiReadableContent || `[论坛私聊] ${content}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      source: 'dm'  // 🔥 标记为论坛私聊消息
    }
    
    addMessage(npcId, msg)
    console.log('🔄 [私聊] 同步到主聊天:', { type, content })
  }

  // AI主动回复（没有输入内容时触发）- 🔥 使用和微信一样的规则
  const handleAIReply = async () => {
    if (!npcId || !character) {
      console.warn('⚠️ [私聊] 缺少角色信息，无法AI回复')
      return
    }
    setIsAiReplying(true)
    
    try {
      // 🔥 读取主聊天记录（和微信一样）
      const mainMessages = loadMessages(npcId)
      const userName = userInfo.realName || userInfo.nickname || '用户'
      
      console.log('📩 [私聊] 读取主聊天记录:', mainMessages.length, '条')
      
      // 🔥 使用和微信一样的系统提示词
      const systemPrompt = await buildSystemPrompt(character, userName, mainMessages)
      
      // 🔥 转换消息格式（和微信一样）
      const apiMessages = convertToApiMessages(mainMessages.slice(-30), false, true)
      
      // 添加论坛私聊场景提示
      const dmContextPrompt = `

【当前场景】
你们现在在论坛私信里聊天。用户可能是第一次通过私信联系你，也可能是之前在微信聊过的朋友。
请根据你们的关系和聊天历史自然地回复。`
      
      const fullSystemPrompt = systemPrompt + dmContextPrompt
      
      console.log('📤 [私聊] 系统提示词长度:', fullSystemPrompt.length)
      console.log('📤 [私聊] 消息历史条数:', apiMessages.length)
      
      // 🔥 调用AI
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)
      
      if (!apiConfig) {
        console.error('❌ [私聊] 未配置API')
        setIsAiReplying(false)
        return
      }
      
      // 构建完整的消息列表
      const fullMessages = [
        { role: 'system' as const, content: fullSystemPrompt },
        ...apiMessages
      ]
      
      const result = await callAIApi(fullMessages, apiConfig, false)
      const aiReply = result.content?.trim() || ''
      
      console.log('📩 [私聊] AI回复:', aiReply)

      if (aiReply) {
        setTimeout(() => {
          // 保存到私聊记录
          sendDMToUser(npcId, npcName, npcAvatar, aiReply)
          
          // 🔥 同步到主聊天记录
          syncToMainChat(aiReply, 'received', `[论坛私聊回复] ${aiReply}`)
          
          setMessages(getDMMessages(npcId))
          setIsAiReplying(false)
        }, 500 + Math.random() * 1000)
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
    console.log('📤 [私聊] 用户发送消息:', userMessage)
    sendDMFromUser(npcId, npcName, npcAvatar, userMessage)
    
    // 🔥 同步到主聊天记录
    syncToMainChat(userMessage, 'sent', `[论坛私聊] ${userMessage}`)
    
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
    
    // 使用 IndexedDB 存储，不再使用 localStorage
    sendEmojiFromUser(npcId, npcName, npcAvatar, emoji.url, emoji.description)
    
    // 🔥 同步到主聊天记录
    syncToMainChat(`[表情包] ${emoji.description}`, 'sent', `[论坛私聊] 发送了表情包: ${emoji.description}`)
    
    setMessages(getDMMessages(npcId))
    setShowEmojiPanel(false)
    console.log('📤 [私聊] 发送表情包:', emoji.description)
  }

  // 根据名字生成头像渐变色
  const getAvatarGradient = (name: string) => {
    const hue = name.charCodeAt(0) * 37 % 360
    return `linear-gradient(135deg, hsl(${hue}, 70%, 60%) 0%, hsl(${(hue + 40) % 360}, 70%, 50%) 100%)`
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
                style={{ background: getAvatarGradient(npcName || 'A') }}
              >
                {(npcName || 'A')[0]}
              </div>
            )}
            <div>
              <h1 className="text-[15px] font-semibold text-gray-900">{npcName || '私聊'}</h1>
              {character?.personality && (
                <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{character.personality.slice(0, 20)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-medium mb-4 shadow-lg"
              style={{ background: getAvatarGradient(npcName || 'A') }}
            >
              {(npcName || 'A')[0]}
            </div>
            <p className="text-sm">开始和 {npcName} 聊天吧</p>
            <p className="text-xs text-gray-300 mt-1">发送消息或点击"让TA说"</p>
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
                        style={{ background: getAvatarGradient(userInfo.nickname || userInfo.realName || '我') }}
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
                        style={{ background: getAvatarGradient(npcName || 'A') }}
                      >
                        {(npcName || 'A')[0]}
                      </div>
                    )
                  )}
                </div>
                
                {/* 消息气泡 */}
                <div className={`max-w-[75%] ${msg.isFromUser ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'emoji' && msg.emojiUrl ? (
                    // 表情包消息
                    <img 
                      src={msg.emojiUrl} 
                      alt={msg.content} 
                      className="w-32 h-32 object-contain rounded-xl"
                    />
                  ) : (
                    // 文字消息
                    <div 
                      className={`px-4 py-2.5 rounded-[20px] shadow-sm ${
                        msg.isFromUser 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
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
                  style={{ background: getAvatarGradient(npcName || 'A') }}
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
