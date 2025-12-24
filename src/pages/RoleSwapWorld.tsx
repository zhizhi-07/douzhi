import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { BackIcon } from '../components/Icons'
import { apiService } from '../services/apiService'
import { roleSwapData } from './RoleSwap'

// ========== 虚拟环境数据类型 ==========
interface VirtualCharacter {
  id: string
  realName: string
  personality?: string
  avatar?: string
  greeting?: string
}

interface VirtualGroup {
  id: string
  name: string
  members: string[] // 角色ID列表
}

interface VirtualMessage {
  id: string
  role: 'ai_user' | 'user_ai' // ai_user = AI扮演的用户发的, user_ai = 用户扮演的AI发的
  content: string
  timestamp: number
}


// ========== 虚拟环境Context ==========
interface VirtualWorldState {
  characters: VirtualCharacter[]
  groups: VirtualGroup[]
  chats: Record<string, VirtualMessage[]>
  currentScreen: 'desktop' | 'chat' | 'create-character' | 'group-chat'
  currentChatId: string | null
}

const initialState: VirtualWorldState = {
  characters: [],
  groups: [],
  chats: {},
  currentScreen: 'desktop',
  currentChatId: null
}

// ========== 主组件 ==========
const RoleSwapWorld = () => {
  const navigate = useNavigate()
  const [playerCharacter, setPlayerCharacter] = useState<{ id: string; realName: string; personality?: string } | null>(null)
  const [world, setWorld] = useState<VirtualWorldState>(initialState)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 加载扮演的角色
  useEffect(() => {
    if (roleSwapData.character) {
      setPlayerCharacter(roleSwapData.character)
      
      // 初始化AI的第一条消息
      if (roleSwapData.aiFirstMessage) {
        processAIMessage(roleSwapData.aiFirstMessage)
        setChatHistory([{ role: 'assistant', content: roleSwapData.aiFirstMessage }])
      }
    }
  }, [])

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [world.chats])

  // 解析AI消息中的指令
  const processAIMessage = (content: string) => {
    // 解析【创建角色】
    const createCharMatch = content.match(/【创建角色】\s*\n名字[：:]\s*(.+?)\n(?:性格[：:]\s*(.+?)\n)?(?:备注[：:]\s*(.+?))?(?:\n|$)/i)
    if (createCharMatch) {
      const newChar: VirtualCharacter = {
        id: Date.now().toString(),
        realName: createCharMatch[1].trim(),
        personality: createCharMatch[2]?.trim(),
        avatar: ''
      }
      setWorld(prev => ({
        ...prev,
        characters: [...prev.characters, newChar]
      }))
      console.log('✅ AI创建了角色:', newChar.realName)
    }

    // 解析【进入聊天:xxx】
    const enterChatMatch = content.match(/【进入聊天[：:]\s*(.+?)】/i)
    if (enterChatMatch) {
      const charName = enterChatMatch[1].trim()
      const char = world.characters.find(c => c.realName === charName)
      if (char) {
        setWorld(prev => ({
          ...prev,
          currentScreen: 'chat',
          currentChatId: char.id
        }))
        console.log('✅ AI进入了聊天:', charName)
      }
    }

    // 解析【发消息】
    const sendMsgMatch = content.match(/【发消息】\s*\n(.+?)(?:\n【|$)/is)
    if (sendMsgMatch && world.currentChatId) {
      const msgContent = sendMsgMatch[1].trim()
      const newMsg: VirtualMessage = {
        id: Date.now().toString(),
        role: 'ai_user',
        content: msgContent,
        timestamp: Date.now()
      }
      setWorld(prev => ({
        ...prev,
        chats: {
          ...prev.chats,
          [prev.currentChatId!]: [...(prev.chats[prev.currentChatId!] || []), newMsg]
        }
      }))
      console.log('✅ AI发送了消息:', msgContent)
    }

    // 解析【返回】
    if (content.includes('【返回】') || content.includes('【返回桌面】')) {
      setWorld(prev => ({
        ...prev,
        currentScreen: 'desktop',
        currentChatId: null
      }))
      console.log('✅ AI返回了桌面')
    }
  }

  // 用户发送消息（扮演AI回复）
  const handleSend = async () => {
    if (!inputValue.trim() || !playerCharacter) return

    const userMessage = inputValue
    setInputValue('')
    setIsLoading(true)

    // 如果在聊天界面，添加用户扮演的AI的回复
    if (world.currentScreen === 'chat' && world.currentChatId) {
      const newMsg: VirtualMessage = {
        id: Date.now().toString(),
        role: 'user_ai',
        content: userMessage,
        timestamp: Date.now()
      }
      setWorld(prev => ({
        ...prev,
        chats: {
          ...prev.chats,
          [prev.currentChatId!]: [...(prev.chats[prev.currentChatId!] || []), newMsg]
        }
      }))
    }

    // 更新聊天历史
    const newHistory = [...chatHistory, { role: 'user', content: userMessage }]
    setChatHistory(newHistory)

    try {
      const currentId = apiService.getCurrentId()
      const apiConfig = currentId ? apiService.getById(currentId) : null
      if (!apiConfig) throw new Error('未配置API')

      const systemPrompt = buildSystemPrompt(playerCharacter, world)
      
      console.log('🔄 [角色互换] 发送:')
      console.log('📝 系统提示词:', systemPrompt)
      console.log('💬 聊天历史:', newHistory)

      const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...newHistory
          ],
          max_tokens: 1000
        })
      })

      const data = await response.json()
      const aiResponse = data.choices?.[0]?.message?.content || ''
      
      console.log('✅ [角色互换] AI返回:', aiResponse)

      if (aiResponse) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }])
        processAIMessage(aiResponse)
      }
    } catch (error) {
      console.error('发送失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 构建系统提示词
  const buildSystemPrompt = (char: { realName: string; personality?: string }, state: VirtualWorldState): string => {
    const currentChar = state.currentChatId 
      ? state.characters.find(c => c.id === state.currentChatId)
      : null

    let prompt = `你是${char.realName}。${char.personality ? `性格：${char.personality}` : ''}

你正在使用「小手机」APP。这是一个AI聊天应用。

## 当前状态
`

    if (state.currentScreen === 'desktop') {
      prompt += `你在桌面。\n`
      if (state.characters.length === 0) {
        prompt += `还没有创建任何角色。\n`
      } else {
        prompt += `已创建的角色：${state.characters.map(c => c.realName).join('、')}\n`
      }
    } else if (state.currentScreen === 'chat' && currentChar) {
      prompt += `你正在和「${currentChar.realName}」聊天。\n`
      const msgs = state.chats[state.currentChatId!] || []
      if (msgs.length > 0) {
        prompt += `最近消息：\n`
        msgs.slice(-5).forEach(m => {
          prompt += `- ${m.role === 'ai_user' ? '你' : currentChar.realName}：${m.content}\n`
        })
      }
    }

    prompt += `
## 操作指令格式

【创建角色】
名字：角色名
性格：性格描述
备注：一句话描述

【进入聊天:角色名】

【发消息】
消息内容

【返回】

## 规则
- 你就是${char.realName}，用第一人称
- 像真人一样自然地使用这个APP
- 想做什么就用对应的指令格式
- 可以随时创建新角色、和角色聊天
- 不要说"我是AI"这类话`

    return prompt
  }

  if (!playerCharacter) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  // 获取当前聊天的角色
  const currentChatChar = world.currentChatId 
    ? world.characters.find(c => c.id === world.currentChatId)
    : null

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <StatusBar />
      
      {/* 头部 */}
      <div className="bg-white border-b flex items-center px-4 py-3">
        <button 
          onClick={() => {
            if (world.currentScreen !== 'desktop') {
              setWorld(prev => ({ ...prev, currentScreen: 'desktop', currentChatId: null }))
            } else {
              navigate('/role-swap')
            }
          }} 
          className="p-2 -ml-2"
        >
          <BackIcon className="w-6 h-6 text-gray-600" />
        </button>
        <div className="ml-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-sm">
              {playerCharacter.realName[0]}
            </div>
            <div>
              <p className="font-medium text-gray-800">{playerCharacter.realName}</p>
              <p className="text-xs text-gray-500">
                {world.currentScreen === 'desktop' ? '在桌面' : 
                 world.currentScreen === 'chat' ? `和${currentChatChar?.realName}聊天` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded">
          角色互换模式
        </div>
      </div>

      {/* 虚拟界面展示 */}
      <div className="bg-gradient-to-b from-indigo-100 to-purple-100 p-3">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ minHeight: '200px' }}>
          {world.currentScreen === 'desktop' ? (
            // 虚拟桌面
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">📱 虚拟小手机 - 桌面</p>
              {world.characters.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>还没有角色</p>
                  <p className="text-xs mt-1">等待{playerCharacter.realName}创建...</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {world.characters.map(char => (
                    <div key={char.id} className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white">
                        {char.realName[0]}
                      </div>
                      <p className="text-xs mt-1 truncate">{char.realName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : world.currentScreen === 'chat' && currentChatChar ? (
            // 虚拟聊天界面
            <div className="flex flex-col h-48">
              <div className="bg-gray-50 px-3 py-2 border-b flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-teal-400 flex items-center justify-center text-white text-xs">
                  {currentChatChar.realName[0]}
                </div>
                <span className="text-sm font-medium">{currentChatChar.realName}</span>
                <span className="text-xs text-gray-400 ml-auto">你扮演的AI</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {(world.chats[world.currentChatId!] || []).map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user_ai' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-1.5 rounded-xl text-sm ${
                      msg.role === 'user_ai' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* AI的文字输出区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatHistory.filter(m => m.role === 'assistant').map((msg, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex-shrink-0 flex items-center justify-center text-white text-sm">
              {playerCharacter.realName[0]}
            </div>
            <div className="bg-white rounded-2xl px-4 py-2 shadow-sm max-w-[85%]">
              <p className="text-gray-800 whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex-shrink-0" />
            <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 - 用户扮演AI回复 */}
      <div className="bg-white border-t px-4 py-3 pb-safe">
        <p className="text-xs text-gray-400 mb-2 text-center">
          {world.currentScreen === 'chat' && currentChatChar 
            ? `你扮演「${currentChatChar.realName}」回复${playerCharacter.realName}` 
            : `等待${playerCharacter.realName}操作...`}
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={world.currentScreen === 'chat' ? '扮演AI回复...' : '输入任何内容继续...'}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoleSwapWorld
