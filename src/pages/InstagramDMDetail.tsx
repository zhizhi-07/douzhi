import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Smile, Send } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import { getDMMessages, sendDMFromUser, sendDMToUser, markDMAsRead, getDMConversations, type DMMessage } from '../utils/instagramDM'
import { getUserInfo } from '../utils/userUtils'
import { apiService } from '../services/apiService'
import EmojiPanel from '../components/EmojiPanel'
import type { Emoji } from '../utils/emojiStorage'
import { getAllCharacters } from '../utils/characterManager'

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
  const [characterPersonality, setCharacterPersonality] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userInfo = getUserInfo()

  useEffect(() => {
    if (!npcId) return
    
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
        setCharacterPersonality(char.personality || '')
        setNpcName(char.nickname || char.realName)
        setNpcAvatar(char.avatar)
      }
      
      setMessages(getDMMessages(npcId))
      markDMAsRead(npcId)
    }
    
    loadData()
  }, [npcId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // AI主动回复（没有输入内容时触发）
  const handleAIReply = async () => {
    if (!npcId) return
    setIsAiReplying(true)
    
    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (!apiConfig) {
        setIsAiReplying(false)
        return
      }

      const chatHistory = getDMMessages(npcId).slice(-10)

      const prompt = `你是"${npcName}"，正在论坛私信里主动找用户聊天。
${characterPersonality ? `\n**你的性格：**\n${characterPersonality}\n` : ''}
**用户信息：**
- 昵称：${userInfo.nickname || userInfo.realName || '用户'}

**聊天记录：**
${chatHistory.length > 0 ? chatHistory.map(m => `${m.isFromUser ? '用户' : npcName}：${m.content}`).join('\n') : '这是你们第一次聊天'}

**要求：**
- 完全代入角色性格
- 主动打招呼或找话题
- 10-50字，直接输出`

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
          temperature: 0.8
        })
      })

      const data = await response.json()
      const aiReply = data.choices?.[0]?.message?.content?.trim() || ''

      if (aiReply) {
        setTimeout(() => {
          sendDMToUser(npcId, npcName, npcAvatar, aiReply)
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

  const handleSend = async () => {
    if (!npcId) return
    
    // 没有输入内容时，触发AI主动回复
    if (!inputText.trim()) {
      handleAIReply()
      return
    }
    
    const userMessage = inputText.trim()
    sendDMFromUser(npcId, npcName, npcAvatar, userMessage)
    setMessages(getDMMessages(npcId))
    setInputText('')

    // AI回复
    setIsAiReplying(true)
    try {
      const apiConfigs = apiService.getAll()
      const currentId = apiService.getCurrentId() || apiConfigs[0]?.id
      const apiConfig = apiConfigs.find(c => c.id === currentId)

      if (!apiConfig) {
        console.error('没有可用的API配置')
        setIsAiReplying(false)
        return
      }

      // 获取聊天历史
      const chatHistory = getDMMessages(npcId).slice(-10)

      // 构建prompt
      const prompt = `你是"${npcName}"，正在论坛私信里和用户聊天。
${characterPersonality ? `\n**你的性格：**\n${characterPersonality}\n` : ''}
**用户信息：**
- 昵称：${userInfo.nickname || userInfo.realName || '用户'}

**聊天记录：**
${chatHistory.map(m => `${m.isFromUser ? '用户' : npcName}：${m.content}`).join('\n')}

**用户刚发的消息：**
${userMessage}

**要求：**
- 完全代入角色性格回复
- 用自然口语回复，10-50字
- 直接输出内容`

      // 确保URL包含完整路径
      const apiUrl = apiConfig.baseUrl.endsWith('/chat/completions') 
        ? apiConfig.baseUrl 
        : apiConfig.baseUrl.replace(/\/?$/, '/chat/completions')
      
      console.log('🔵 [私聊AI] 发送请求到:', apiUrl)
      console.log('🔵 [私聊AI] Prompt:', prompt)
      
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
      console.log('🔵 [私聊AI] 返回:', data)
      const aiReply = data.choices?.[0]?.message?.content?.trim() || ''
      console.log('🔵 [私聊AI] AI回复:', aiReply)

      if (aiReply) {
        // 延迟1-3秒回复，模拟打字
        setTimeout(() => {
          sendDMToUser(npcId, npcName, npcAvatar, aiReply)
          setMessages(getDMMessages(npcId))
          setIsAiReplying(false)
        }, 1000 + Math.random() * 2000)
      } else {
        setIsAiReplying(false)
      }
    } catch (error) {
      console.error('AI回复失败:', error)
      setIsAiReplying(false)
    }
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
    
    // 保存表情包消息
    const now = Date.now()
    const time = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    // 通过修改instagramDM来支持表情包（使用content存储描述，emojiUrl存储图片）
    const allMessages = JSON.parse(localStorage.getItem('instagram_dm_messages') || '{}')
    if (!allMessages[npcId]) allMessages[npcId] = []
    
    allMessages[npcId].push({
      id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: 'user',
      senderName: '我',
      content: `[表情包] ${emoji.description}`,
      timestamp: now,
      time,
      isFromUser: true,
      type: 'emoji',
      emojiUrl: emoji.url
    })
    localStorage.setItem('instagram_dm_messages', JSON.stringify(allMessages))
    
    // 更新会话
    const conversations = getDMConversations()
    const conv = conversations.find(c => c.id === npcId)
    if (conv) {
      conv.lastMessage = `[表情包]`
      conv.lastTime = time
      conv.updatedAt = now
      localStorage.setItem('instagram_dm_conversations', JSON.stringify(conversations))
    }
    
    setMessages(getDMMessages(npcId))
    setShowEmojiPanel(false)
    
    // 触发AI回复
    setTimeout(() => handleSend(), 500)
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
              {characterPersonality && (
                <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{characterPersonality.slice(0, 20)}</p>
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
                {/* 头像 - 只在对方消息显示 */}
                {!msg.isFromUser && (
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
                )}
                
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
          
          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={isAiReplying}
            className={`h-10 px-4 rounded-full font-medium text-sm transition-all ${
              isAiReplying
                ? 'bg-gray-100 text-gray-300'
                : inputText.trim() 
                  ? 'bg-blue-500 text-white active:bg-blue-600 shadow-sm' 
                  : 'bg-green-500 text-white active:bg-green-600 shadow-sm'
            }`}
          >
            {inputText.trim() ? (
              <Send className="w-5 h-5" />
            ) : (
              <span>让TA说</span>
            )}
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
