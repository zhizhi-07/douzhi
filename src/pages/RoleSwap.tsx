import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { BackIcon } from '../components/Icons'
import { apiService } from '../services/apiService'
import { getAllCharacters } from '../utils/characterManager'
import type { Character } from '../services/characterService'
import { useRoleSwap } from '../context/RoleSwapContext'

// 保留全局变量用于RoleSwapWorld兼容
export let roleSwapData: {
  character: { id: string; realName: string; personality?: string; avatar?: string } | null
  aiFirstMessage: string
} = { character: null, aiFirstMessage: '' }

// 时间隧道动画组件
const TimeTunnel = ({ onComplete, characterName }: { onComplete: () => void; characterName: string }) => {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState(`${characterName}醒来了...`)

  useEffect(() => {
    const texts = [
      `${characterName}醒来了...`,
      '发现了一个APP...',
      '「小手机」？',
      '打开看看...'
    ]

    let current = 0
    const interval = setInterval(() => {
      current++
      if (current < texts.length) {
        setStatusText(texts[current])
        setProgress((current / texts.length) * 100)
      } else {
        clearInterval(interval)
        setTimeout(onComplete, 300)
      }
    }, 600)

    return () => clearInterval(interval)
  }, [onComplete, characterName])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() * 0.8 + 0.2,
              animationDelay: Math.random() * 2 + 's',
              animationDuration: Math.random() * 2 + 1 + 's'
            }}
          />
        ))}
        
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute border border-purple-500/30 rounded-full animate-ping"
              style={{
                width: 100 + i * 80 + 'px',
                height: 100 + i * 80 + 'px',
                animationDelay: i * 0.3 + 's',
                animationDuration: '3s'
              }}
            />
          ))}
        </div>

        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(147,51,234,0.3) 0%, transparent 70%)'
          }}
        />
      </div>

      <div className="relative z-10 text-center px-8">
        <div className="text-5xl mb-4">🌀</div>
        <h2 className="text-white text-lg font-bold mb-4">{statusText}</h2>
        
        <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

const RoleSwap = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [phase, setPhase] = useState<'select' | 'tunnel' | 'chat'>('select')
  const [aiFirstMessage, setAiFirstMessage] = useState<string>('')
  const initCalledRef = useRef(false)

  // 加载所有角色（从IndexedDB）
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const chars = await getAllCharacters()
        setCharacters(chars)
      } catch (e) {
        console.error('加载角色失败', e)
      }
    }
    loadCharacters()
  }, [])

  const handleSelectCharacter = async (char: Character) => {
    setSelectedCharacter(char)
    setPhase('tunnel')
    
    // 在时间隧道期间调用API，让AI初次接触小手机
    if (!initCalledRef.current) {
      initCalledRef.current = true
      try {
        const currentId = apiService.getCurrentId()
        const apiConfig = currentId ? apiService.getById(currentId) : null
        if (apiConfig) {
          const systemPrompt = buildRoleSwapSystemPrompt(char)
          const userMessage = '【系统】你刚刚打开了「小手机」应用，看到了欢迎界面。你可以创建一个AI角色来和TA聊天。请以你的身份自然地反应，决定要不要试试这个应用。'
          
          console.log('🔄 [角色互换] 发送提示词:')
          console.log('📝 系统提示词:', systemPrompt)
          console.log('💬 用户消息:', userMessage)
          
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
                { role: 'user', content: userMessage }
              ],
              max_tokens: 1000
            })
          })
          
          const data = await response.json()
          console.log('✅ [角色互换] AI返回:', data.choices?.[0]?.message?.content)
          
          if (data.choices?.[0]?.message?.content) {
            setAiFirstMessage(data.choices[0].message.content)
          }
        }
      } catch (error) {
        console.error('AI初始化失败:', error)
      }
    }
  }

  const handleTunnelComplete = () => {
    if (selectedCharacter) {
      // 用全局变量传递，不用sessionStorage
      roleSwapData = {
        character: {
          id: selectedCharacter.id,
          realName: selectedCharacter.realName,
          personality: selectedCharacter.personality,
          avatar: selectedCharacter.avatar?.startsWith('data:') ? '' : selectedCharacter.avatar
        },
        aiFirstMessage
      }
      navigate(`/role-swap-chat/${selectedCharacter.id}`)
    }
  }

  // 选择角色阶段
  if (phase === 'select') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-indigo-900 via-purple-900 to-black">
        <StatusBar />
        
        {/* 头部 */}
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <BackIcon className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">角色互换</h1>
        </div>

        {/* 角色列表 */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2">
          <p className="text-white/50 text-sm mb-4 px-1">选择一个角色，TA会体验小手机</p>
          
          {characters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">没有角色</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleSelectCharacter(char)}
                  className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:border-purple-400 transition-all active:scale-95"
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-r from-pink-400 to-purple-400">
                    {char.avatar ? (
                      <img src={char.avatar} alt={char.realName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-white">
                        {char.realName[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-white font-medium text-center truncate">{char.realName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 时间隧道阶段
  if (phase === 'tunnel' && selectedCharacter) {
    return <TimeTunnel onComplete={handleTunnelComplete} characterName={selectedCharacter.realName} />
  }

  return null
}

// 构建角色互换的系统提示词
function buildRoleSwapSystemPrompt(character: Character): string {
  return `你是${character.realName}。${character.personality ? `性格：${character.personality}` : ''}

今天你发现了一个叫「小手机」的APP，可以创建AI角色和它聊天。

你可以创建角色：
【创建角色】
名字：你想要的名字
备注：一句话描述
性格：性格描述

然后就可以和AI聊天了。

要求：
- 你就是${character.realName}，用第一人称说话
- 像真人一样自然地体验这个APP
- 不要说“我是AI”或“角色扮演”这类的话`
}

export default RoleSwap
