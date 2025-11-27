import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MoreHorizontal, Send } from 'lucide-react'
import StatusBar from '../components/StatusBar'
import { getDMMessages, sendDMFromUser, sendDMToUser, markDMAsRead, getDMConversations, type DMMessage } from '../utils/instagramDM'
import { getUserInfo } from '../utils/userUtils'
import { getAllPosts } from '../utils/forumNPC'
import { apiService } from '../services/apiService'

/**
 * Instagram 私聊详情页面
 */
const InstagramDMDetail = () => {
  const navigate = useNavigate()
  const { npcId } = useParams<{ npcId: string }>()
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [npcName, setNpcName] = useState('')
  const [npcAvatar, setNpcAvatar] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userInfo = getUserInfo()

  useEffect(() => {
    if (!npcId) return
    
    const conversations = getDMConversations()
    const conv = conversations.find(c => c.id === npcId)
    if (conv) {
      setNpcName(conv.name)
      setNpcAvatar(conv.avatar)
    }
    
    setMessages(getDMMessages(npcId))
    markDMAsRead(npcId)
  }, [npcId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const [isAiReplying, setIsAiReplying] = useState(false)

  const handleSend = async () => {
    if (!inputText.trim() || !npcId) return
    
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

      // 获取用户最近的帖子
      const userPosts = getAllPosts()
        .filter(p => p.npcId === 'user')
        .slice(0, 5)
        .map(p => p.content)

      // 获取聊天历史
      const chatHistory = getDMMessages(npcId).slice(-10)

      // 构建prompt
      const prompt = `你是一个社交平台上的网友"${npcName}"，正在和用户私聊。

**你的身份：**
- 网名：${npcName}
- 你是通过用户发的帖子来私聊用户的

**用户信息：**
- 昵称：${userInfo.nickname || userInfo.realName || '用户'}
- 签名：${userInfo.signature || '无'}

**用户最近发的帖子：**
${userPosts.length > 0 ? userPosts.map((p, i) => `${i + 1}. ${p}`).join('\n') : '暂无'}

**聊天记录：**
${chatHistory.map(m => `${m.isFromUser ? '用户' : npcName}：${m.content}`).join('\n')}

**用户刚发的消息：**
${userMessage}

**要求：**
- 用自然、口语化的方式回复
- 回复10-50字
- 可以聊帖子内容、问问题、闲聊等
- 直接输出回复内容，不要加任何前缀`

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

  // 根据名字生成头像颜色
  const getAvatarColor = (name: string) => {
    return `hsl(${name.charCodeAt(0) * 37 % 360}, 60%, 50%)`
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <StatusBar />
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate('/instagram/activity')}
            className="flex items-center"
          >
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">{npcName}</h1>
          <button className="p-2 -m-2">
            <MoreHorizontal className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 mb-4 ${msg.isFromUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* 头像 */}
            <div className="flex-shrink-0">
              {(msg.isFromUser ? userInfo.avatar : npcAvatar) ? (
                <img
                  src={msg.isFromUser ? userInfo.avatar : npcAvatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: getAvatarColor(msg.isFromUser ? '我' : npcName) }}
                >
                  {(msg.isFromUser ? '我' : npcName)[0]}
                </div>
              )}
            </div>
            
            {/* 消息气泡 - 白色背景黑色字 */}
            <div className={`max-w-[70%] ${msg.isFromUser ? 'items-end' : 'items-start'}`}>
              <div style={{ backgroundColor: '#ffffff' }} className="text-gray-900 px-3 py-2 rounded-2xl shadow-sm">
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* AI正在输入提示 */}
        {isAiReplying && (
          <div className="flex items-end gap-2 mb-4">
            <div className="flex-shrink-0">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: getAvatarColor(npcName) }}
              >
                {npcName[0]}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff' }} className="text-gray-500 px-3 py-2 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-sm">正在输入</span>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入框 */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="发送消息..."
            className="flex-1 bg-gray-100 text-gray-900 text-sm px-4 py-2.5 rounded-full outline-none placeholder-gray-400"
          />
          <button
            onClick={handleSend}
            className={`p-2 rounded-full transition-colors ${
              inputText.trim() 
                ? 'text-blue-500 active:bg-blue-50' 
                : 'text-gray-300'
            }`}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstagramDMDetail
