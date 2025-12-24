import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { BackIcon } from '../components/Icons'
import { apiService } from '../services/apiService'
import { roleSwapData } from './RoleSwap'

interface Character {
  id: string
  realName: string
  avatar?: string
  personality?: string
}

interface CreatedCharacter {
  name: string
  description: string
  personality: string
  worldView?: string
  worldBook?: string
}

interface Message {
  id: string
  role: 'ai_user' | 'user_ai' | 'system'
  content: string
  timestamp: number
}

const RoleSwapChat = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [character, setCharacter] = useState<Character | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [createdCharacter, setCreatedCharacter] = useState<CreatedCharacter | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatHistoryRef = useRef<{ role: string; content: string }[]>([])

  // 加载角色信息（从全局变量）
  useEffect(() => {
    const char = roleSwapData.character
    const firstMessage = roleSwapData.aiFirstMessage
    
    if (char) {
      setCharacter(char)
      
      const initialMessages: Message[] = []
      
      // 如果有AI的第一条消息
      if (firstMessage) {
        initialMessages.push({
          id: 'first',
          role: 'ai_user',
          content: firstMessage,
          timestamp: Date.now()
        })
        
        // 解析是否创建了角色
        const created = parseCreatedCharacter(firstMessage)
        if (created) {
          setCreatedCharacter(created)
        }
        
        // 添加到聊天历史
        chatHistoryRef.current = [
          { role: 'assistant', content: firstMessage }
        ]
      }
      
      setMessages(initialMessages)
    }
  }, [id])

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 解析AI创建的角色
  const parseCreatedCharacter = (text: string): CreatedCharacter | null => {
    const createMatch = text.match(/【创建角色】/i)
    if (!createMatch) return null

    const nameMatch = text.match(/名字[：:]\s*(.+?)(?:\n|$)/i)
    const descMatch = text.match(/备注[：:]\s*(.+?)(?:\n|$)/i)
    const personalityMatch = text.match(/性格[：:]\s*(.+?)(?:\n|$)/i)
    const worldViewMatch = text.match(/世界观[：:]\s*(.+?)(?:\n|$)/i)
    const worldBookMatch = text.match(/世界书[：:]\s*(.+?)(?:\n|$)/i)

    if (nameMatch) {
      return {
        name: nameMatch[1].trim(),
        description: descMatch?.[1]?.trim() || '',
        personality: personalityMatch?.[1]?.trim() || '',
        worldView: worldViewMatch?.[1]?.trim(),
        worldBook: worldBookMatch?.[1]?.trim()
      }
    }
    return null
  }

  // 用户发送消息（扮演AI角色）
  const handleSend = async () => {
    if (!inputValue.trim() || !character) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user_ai',
      content: inputValue,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    // 更新聊天历史
    chatHistoryRef.current.push({ role: 'user', content: inputValue })

    try {
      const currentId = apiService.getCurrentId()
      const apiConfig = currentId ? apiService.getById(currentId) : null
      if (!apiConfig) {
        throw new Error('未配置API')
      }

      const systemPrompt = buildChatSystemPrompt(character, createdCharacter)
      
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
            ...chatHistoryRef.current
          ],
          max_tokens: 1000
        })
      })

      const data = await response.json()
      const aiResponse = data.choices?.[0]?.message?.content || '...'

      // 检查是否新创建了角色
      const newChar = parseCreatedCharacter(aiResponse)
      if (newChar) {
        setCreatedCharacter(newChar)
      }

      // 添加AI消息
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai_user',
        content: aiResponse,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, aiMsg])
      chatHistoryRef.current.push({ role: 'assistant', content: aiResponse })

    } catch (error) {
      console.error('发送失败:', error)
      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        role: 'system',
        content: '消息发送失败，请检查API配置',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // 构建聊天系统提示词
  const buildChatSystemPrompt = (char: Character, created: CreatedCharacter | null): string => {
    let prompt = `# 角色扮演指令

你现在要完全扮演【${char.realName}】这个角色，作为一个真实的人类用户在体验「小手机」AI聊天应用。

## 你的身份：${char.realName}
${char.personality ? `- 性格：${char.personality}` : ''}

## 场景
你正在使用「小手机」应用和AI聊天。`

    if (created) {
      prompt += `

## 你创建的AI角色
- 名字：${created.name}
- 备注：${created.description}
- 性格：${created.personality}
${created.worldView ? `- 世界观：${created.worldView}` : ''}
${created.worldBook ? `- 世界书：${created.worldBook}` : ''}

你正在和这个AI角色聊天。对方（用户扮演的AI）会根据上述设定来回复你。
你要像真人用户一样自然地聊天，可以：
- 测试AI是否贴合人设
- 问各种问题
- 分享心情
- 调戏AI
- 觉得无聊就换话题
- 甚至可以修改角色设定（使用【修改角色】格式）`
    } else {
      prompt += `

## 你还没有创建角色
你可以先创建一个AI角色，格式为：

【创建角色】
名字：xxx
备注：xxx（一句话描述）
性格：xxx
世界观：xxx（可选）
世界书：xxx（可选，背景设定）

创建后就可以和这个AI聊天了！`
    }

    prompt += `

## 重要规则
- 你是${char.realName}，一个真实的人类用户
- 不是AI助手，不要用AI的口吻
- 自然地表达情绪和想法
- 像真人一样随意聊天
- 可以发表情、吐槽、开玩笑
- 如果AI回复不满意，可以直接说出来`

    return prompt
  }

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <StatusBar />
      
      {/* 头部 */}
      <div className="bg-white border-b flex items-center px-4 py-3">
        <button onClick={() => navigate('/role-swap')} className="p-2 -ml-2">
          <BackIcon className="w-6 h-6 text-gray-600" />
        </button>
        <div className="ml-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-pink-400 to-purple-400">
              {character.avatar ? (
                <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-sm">
                  {character.realName[0]}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">{character.realName}</p>
              <p className="text-xs text-gray-500">正在体验小手机</p>
            </div>
          </div>
        </div>
        {/* 显示创建的角色信息 */}
        {createdCharacter && (
          <button 
            onClick={() => {/* TODO: 显示角色详情 */}}
            className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-full text-xs"
          >
            你扮演: {createdCharacter.name}
          </button>
        )}
      </div>

      {/* 如果创建了角色，显示角色设定卡片 */}
      {createdCharacter && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 mx-4 mt-3 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎭</span>
            <span className="font-bold">你要扮演的角色</span>
          </div>
          <div className="space-y-1 text-sm text-white/90">
            <p><strong>名字：</strong>{createdCharacter.name}</p>
            {createdCharacter.description && <p><strong>备注：</strong>{createdCharacter.description}</p>}
            <p><strong>性格：</strong>{createdCharacter.personality}</p>
            {createdCharacter.worldView && <p><strong>世界观：</strong>{createdCharacter.worldView}</p>}
            {createdCharacter.worldBook && <p><strong>世界书：</strong>{createdCharacter.worldBook}</p>}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user_ai' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}>
            {msg.role === 'system' ? (
              <div className="bg-black/5 rounded-xl px-4 py-3 max-w-[85%] text-center">
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : msg.role === 'ai_user' ? (
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-pink-400 to-purple-400 flex-shrink-0">
                  {character.avatar ? (
                    <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      {character.realName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{character.realName}</p>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <p className="text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 max-w-[85%] flex-row-reverse">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-green-400 to-emerald-400 flex-shrink-0 flex items-center justify-center text-white text-lg">
                  🤖
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">你（{createdCharacter?.name || 'AI'}）</p>
                  <div className="bg-green-500 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                    <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%]">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-pink-400 to-purple-400 flex-shrink-0">
                {character.avatar ? (
                  <img src={character.avatar} alt={character.realName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    {character.realName[0]}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="bg-white border-t px-4 py-3 pb-safe">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={createdCharacter ? `以${createdCharacter.name}的身份回复...` : '等待TA创建角色...'}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-opacity"
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

export default RoleSwapChat
