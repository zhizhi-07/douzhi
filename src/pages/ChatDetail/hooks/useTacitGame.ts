/**
 * 默契游戏 Hook - 你画我猜 / 你演我猜
 */
import { useState, useRef, useCallback } from 'react'
import { getRandomTopic, refreshTopics, needsRefresh, getRemainingCount } from '../../../components/TacitGamePanel'
import type { Message } from '../../../types/chat'

interface UseTacitGameProps {
  characterId: string | undefined
  saveMessages: (id: string, messages: Message[]) => void
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  messages: Message[]  // 当前消息列表
  scrollToBottom: () => void
  playSound: () => void
}

export const useTacitGame = ({
  characterId,
  saveMessages,
  setMessages,
  messages,
  scrollToBottom,
  playSound
}: UseTacitGameProps) => {
  // 状态
  const [showGameSelect, setShowGameSelect] = useState(false)
  const [gameType, setGameType] = useState<'draw' | 'act' | null>(null)
  const [topic, setTopic] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [hasSent, setHasSent] = useState(false)  // 是否已发送画作/描述
  const [isRefreshing, setIsRefreshing] = useState(false)  // 是否正在刷新题库
  
  // 检查AI是否已经猜了，以及猜的内容
  const aiGuessResult = (() => {
    if (!hasSent || !topic) return { hasGuessed: false, guess: '', isCorrect: false }
    
    // 找到最后一条游戏消息（用户发的画/描述）
    let lastGameMsgIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.type === 'sent' && 
          (msg.content?.includes('[你画我猜:') || msg.aiReadableContent?.includes('[你画我猜游戏]') ||
           msg.aiReadableContent?.includes('[你演我猜游戏]'))) {
        lastGameMsgIndex = i
        break
      }
    }
    if (lastGameMsgIndex === -1) return { hasGuessed: false, guess: '', isCorrect: false }
    
    // 获取AI的回复
    const aiReplies = messages.slice(lastGameMsgIndex + 1).filter(msg => 
      msg.type === 'received' && msg.content
    )
    if (aiReplies.length === 0) return { hasGuessed: false, guess: '', isCorrect: false }
    
    // 从最新的AI回复中提取猜测
    const lastReply = aiReplies[aiReplies.length - 1].content || ''
    
    // 提取猜测内容（支持多种格式）
    const patterns = [
      /你画我猜[：:]\s*(.+?)(?:\s|$|[，。！？])/,
      /你演我猜[：:]\s*(.+?)(?:\s|$|[，。！？])/,
      /我猜[是]?[：:]?\s*(.+?)(?:\s|$|[，。！？])/,
      /应该是[：:]?\s*(.+?)(?:\s|$|[，。！？])/,
      /是不是[：:]?\s*(.+?)(?:\s|$|[，。！？])/,
    ]
    
    let guess = ''
    for (const pattern of patterns) {
      const match = lastReply.match(pattern)
      if (match) {
        guess = match[1].trim()
        break
      }
    }
    
    // 判定是否猜对（模糊匹配）
    const normalizedTopic = topic.toLowerCase().trim()
    const normalizedGuess = guess.toLowerCase().trim()
    const isCorrect = normalizedGuess.length > 0 && (
      normalizedTopic === normalizedGuess ||
      normalizedTopic.includes(normalizedGuess) ||
      normalizedGuess.includes(normalizedTopic)
    )
    
    return { hasGuessed: true, guess, isCorrect }
  })()
  
  const hasAiGuessed = aiGuessResult.hasGuessed
  
  // 保存画布/描述数据的ref
  const canvasDataRef = useRef<string | null>(null)
  const descriptionRef = useRef<string>('')

  // 打开游戏选择菜单
  const openGameSelect = useCallback(() => {
    playSound()
    setShowGameSelect(true)
  }, [playSound])

  // 选择游戏类型并开始
  const startGame = useCallback((type: 'draw' | 'act') => {
    setShowGameSelect(false)
    setGameType(type)
    setTopic(getRandomTopic(type))
    setShowPanel(true)
    setHasSent(false)  // 重置发送状态
    canvasDataRef.current = null
    descriptionRef.current = ''
  }, [])

  // 换题（缓存用完时调API刷新）
  const changeTopic = useCallback(async () => {
    if (!gameType) return
    
    // 检查缓存是否用完
    if (needsRefresh(gameType)) {
      // 需要刷新，调用API
      setIsRefreshing(true)
      try {
        const newTopic = await refreshTopics(gameType)
        setTopic(newTopic)
      } catch (e) {
        console.error('刷新题库失败', e)
        setTopic(getRandomTopic(gameType))
      } finally {
        setIsRefreshing(false)
      }
    } else {
      // 从缓存取
      setTopic(getRandomTopic(gameType))
    }
    
    canvasDataRef.current = null
    descriptionRef.current = ''
  }, [gameType])

  // 结束游戏
  const endGame = useCallback(() => {
    setGameType(null)
    setTopic('')
    setShowPanel(false)
    canvasDataRef.current = null
    descriptionRef.current = ''
  }, [])

  // 打开/关闭面板
  const openPanel = useCallback(() => setShowPanel(true), [])
  const closePanel = useCallback(() => setShowPanel(false), [])

  // 发送画作（不自动调用AI，不结束游戏）
  const sendDrawing = useCallback((imageData: string) => {
    if (!characterId) return

    const message: Message = {
      id: Date.now(),
      type: 'sent',
      messageType: 'photo',
      content: `[你画我猜: ${topic}]`,  // 用户看到的，显示答案
      aiReadableContent: `[你画我猜游戏] 我画了一幅画给你猜！请看图猜猜这是什么。
⚠️ 必须用这个格式回复：你画我猜：你的答案
例如：你画我猜：太阳  或  你画我猜：猫
直接猜，不要解释，只说"你画我猜：XX"`,
      photoBase64: imageData,
      photoDescription: `你画我猜游戏`,  // 不暴露题目
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }

    setMessages(prev => {
      const updated = [...prev, message]
      saveMessages(characterId, updated)
      return updated
    })

    scrollToBottom()
    // 关闭画板但不结束游戏，题目卡片还在
    setShowPanel(false)
    setHasSent(true)  // 标记已发送
    canvasDataRef.current = null
  }, [characterId, topic, setMessages, saveMessages, scrollToBottom])

  // 发送描述（不自动调用AI，不结束游戏）
  const sendDescription = useCallback((description: string) => {
    if (!characterId) return

    const message: Message = {
      id: Date.now(),
      type: 'sent',
      messageType: 'text',
      content: description,
      aiReadableContent: `[你演我猜游戏] 我在描述一个动作让你猜！我的描述是："${description}"
⚠️ 必须用这个格式回复：你演我猜：你的答案
例如：你演我猜：跳舞  或  你演我猜：游泳
直接猜，不要解释，只说"你演我猜：XX"`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }

    setMessages(prev => {
      const updated = [...prev, message]
      saveMessages(characterId, updated)
      return updated
    })

    scrollToBottom()
    // 关闭面板但不结束游戏，题目卡片还在
    setShowPanel(false)
    setHasSent(true)  // 标记已发送
    descriptionRef.current = ''
  }, [characterId, topic, setMessages, saveMessages, scrollToBottom])

  // 确认AI猜对了，结束游戏并发送成功消息
  const confirmCorrect = useCallback(() => {
    if (!characterId || !topic) return

    const gameTypeName = gameType === 'draw' ? '你画我猜' : '你演我猜'
    const message: Message = {
      id: Date.now(),
      type: 'sent',
      messageType: 'system',
      content: `🎉 ${gameTypeName}成功！答案是「${topic}」`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }

    setMessages(prev => {
      const updated = [...prev, message]
      saveMessages(characterId, updated)
      return updated
    })

    playSound()
    endGame()
  }, [characterId, topic, gameType, setMessages, saveMessages, playSound, endGame])

  // 获取剩余题目数量
  const remainingCount = gameType ? getRemainingCount(gameType) : 0
  
  return {
    // 状态
    showGameSelect,
    gameType,
    topic,
    showPanel,
    hasSent,  // 是否已发送画作/描述
    hasAiGuessed,  // AI是否已猜测
    aiGuess: aiGuessResult.guess,  // AI猜的内容
    isAiCorrect: aiGuessResult.isCorrect,  // AI是否猜对
    canvasDataRef,
    descriptionRef,
    isRefreshing,  // 是否正在刷新题库
    remainingCount,  // 剩余题目数量
    
    // 操作
    openGameSelect,
    closeGameSelect: () => setShowGameSelect(false),
    startGame,
    changeTopic,
    endGame,
    openPanel,
    closePanel,
    sendDrawing,
    sendDescription,
    confirmCorrect
  }
}
