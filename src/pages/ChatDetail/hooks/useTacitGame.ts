/**
 * 默契游戏 Hook - 你画我猜 / 你演我猜
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { getRandomTopic, refreshTopics, needsRefresh, getRemainingCount } from '../../../components/TacitGamePanel'
import { judgeGuess } from '../../../services/tacitGameJudge'
import type { Message } from '../../../types/chat'

interface UseTacitGameProps {
  characterId: string | undefined
  characterName: string  // 角色名称，用于结果卡片
  saveMessages: (id: string, messages: Message[]) => void
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  messages: Message[]  // 当前消息列表
  scrollToBottom: () => void
  playSound: () => void
}

export const useTacitGame = ({
  characterId,
  characterName,
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
  const [isJudging, setIsJudging] = useState(false)  // 是否正在AI判定
  const [judgeResult, setJudgeResult] = useState<{ hasJudged: boolean, guess: string, isCorrect: boolean } | null>(null)

  // 记录已处理的AI回复消息ID，避免重复判定
  const processedReplyIdRef = useRef<number | null>(null)

  // 监听AI回复，自动进行AI判定
  useEffect(() => {
    // 已经判定过就不再判定（防止重复触发）
    if (!hasSent || !topic || !gameType || !characterId || isJudging || judgeResult?.hasJudged) return

    // 找到最后一条游戏消息
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
    if (lastGameMsgIndex === -1) return

    // 获取AI的回复
    const aiReplies = messages.slice(lastGameMsgIndex + 1).filter(msg => 
      msg.type === 'received' && msg.content && msg.messageType !== 'tacitGameResult'
    )
    if (aiReplies.length === 0) return

    const lastReply = aiReplies[aiReplies.length - 1]

    // 如果这条回复已经处理过，跳过
    if (processedReplyIdRef.current === lastReply.id) return

    // 合并所有AI回复，让判定函数从中找猜测
    const allRepliesText = aiReplies.map(r => r.content || '').join('\n')
    
    // 检查是否有像猜测的内容（避免AI只是提问就判定）
    const looksLikeGuess = (text: string): boolean => {
      // 检查是否包含猜测相关的词
      const guessPatterns = [
        /我猜/,
        /应该是/,
        /是不是/,
        /猜.*是/,
        /看起来像/,
        /这是.{1,6}[？?]?$/m,
        /像是/,
        /好像是/,
        /是.{1,6}吧/,
        /是.{1,6}[？?]/,
        // 简短名词+问号（如"狗?"、"猫?"、"香蕉?"）
        /^.{1,4}[？?]$/m,
        // 直接回答一个简短名词（2-6字，非疑问句）
        /^[^？?]{2,6}$/m,
      ]
      return guessPatterns.some(p => p.test(text))
    }
    
    // 如果回复看起来不像猜测（比如只是"这是什么"之类的疑问），等待更多回复
    if (!looksLikeGuess(allRepliesText)) {
      console.log('🎮 [游戏判定] 等待中，当前回复不像猜测:', allRepliesText.slice(0, 50))
      return
    }

    // 开始AI判定
    const doJudge = async () => {
      setIsJudging(true)
      processedReplyIdRef.current = lastReply.id

      try {
        const result = await judgeGuess(topic, allRepliesText, gameType)
        console.log('默契游戏判定结果:', result)

        setJudgeResult({
          hasJudged: true,
          guess: result.extractedGuess,
          isCorrect: result.isCorrect
        })

        // 发送结果卡片
        const gameTypeName = gameType === 'draw' ? '你画我猜' : '你演我猜'
        const resultMessage: Message = {
          id: Date.now(),
          type: 'system',
          messageType: 'tacitGameResult',
          content: '',
          // 让AI知道这轮游戏已结束
          aiReadableContent: `[🎮 游戏结束] ${gameTypeName}游戏已结束！答案是「${topic}」，你猜的是「${result.extractedGuess}」，${result.isCorrect ? '猜对了' : '猜错了'}。这轮游戏已经完全结束！`,
          tacitGameResult: {
            gameType,
            topic,
            aiGuess: result.extractedGuess,
            isCorrect: result.isCorrect,
            characterName
          },
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        }

        setMessages(prev => {
          const updated = [...prev, resultMessage]
          saveMessages(characterId, updated)
          return updated
        })

        playSound()
        scrollToBottom()

        // 结束游戏
        setTimeout(() => {
          setGameType(null)
          setTopic('')
          setShowPanel(false)
          setHasSent(false)
          setJudgeResult(null)
          processedReplyIdRef.current = null
        }, 500)

      } catch (e) {
        console.error('AI判定失败:', e)
      } finally {
        setIsJudging(false)
      }
    }

    doJudge()
  }, [messages, hasSent, topic, gameType, characterId, characterName, isJudging, judgeResult, setMessages, saveMessages, playSound, scrollToBottom])

  // 监听评分事件
  useEffect(() => {
    const handleRate = (e: CustomEvent<{ messageId: number, rating: number }>) => {
      const { messageId, rating } = e.detail
      if (!characterId) return

      // 找到对应的消息获取信息
      let ratingInfo: { gameTypeName: string, characterName: string, isCorrect: boolean } | null = null

      setMessages(prev => {
        const updated = prev.map(msg => {
          if (msg.id === messageId && msg.tacitGameResult) {
            const { gameType, topic, aiGuess, isCorrect, characterName } = msg.tacitGameResult
            const gameTypeName = gameType === 'draw' ? '你画我猜' : '你演我猜'
            const ratingText = rating === 5 ? '太厉害了' : rating >= 4 ? '很不错' : rating >= 3 ? '还可以' : rating >= 2 ? '加油' : '下次努力'
            
            // 保存信息用于创建评分消息
            ratingInfo = { gameTypeName, characterName, isCorrect }
            
            return {
              ...msg,
              tacitGameResult: {
                ...msg.tacitGameResult,
                rating
              },
              // 让AI知道用户给了几分
              aiReadableContent: `[${gameTypeName}游戏结束] 答案是「${topic}」，${characterName}猜的是「${aiGuess}」，${isCorrect ? '猜对了' : '猜错了'}。用户给${characterName}打了${rating}分（满分5分），评价：${ratingText}。`
            }
          }
          return msg
        })
        
        // 添加一条评分系统消息，让AI立即看到（解决评分延迟问题）
        if (ratingInfo) {
          const ratingText = rating === 5 ? '太厉害了' : rating >= 4 ? '很不错' : rating >= 3 ? '还可以' : rating >= 2 ? '加油' : '下次努力'
          const ratingMsg: Message = {
            id: Date.now(),
            type: 'system',
            messageType: 'text',
            content: '', // 用户看不到
            aiReadableContent: `[⭐ 用户评分] 用户给${ratingInfo.characterName}的${ratingInfo.gameTypeName}表现打了${rating}分（满分5分）！评价：${ratingText}。${ratingInfo.isCorrect ? '你猜对了，用户很满意！' : '虽然没猜对，但用户还是给了评价~'}`,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
          }
          updated.push(ratingMsg)
        }
        
        saveMessages(characterId, updated)
        return updated
      })
    }

    window.addEventListener('tacit-game-rate', handleRate as EventListener)
    return () => window.removeEventListener('tacit-game-rate', handleRate as EventListener)
  }, [characterId, setMessages, saveMessages])

  const hasAiGuessed = judgeResult?.hasJudged || false

  // 保存画布/描述数据的ref
  const canvasDataRef = useRef<string | null>(null)
  const descriptionRef = useRef<string>('')

  // 记录已处理的emojiDrawInvite消息ID，避免重复更新
  const processedInviteIdRef = useRef<number | null>(null)

  // 监听AI回复，自动将emojiDrawInvite状态更新为accepted
  useEffect(() => {
    if (!characterId) return

    // 找到最后一条pending状态的emojiDrawInvite消息
    let lastInviteMsg: Message | null = null
    let lastInviteIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i] as any
      if (msg.messageType === 'emojiDrawInvite' && 
          msg.emojiDrawInvite?.status === 'pending' &&
          msg.type === 'sent') {
        lastInviteMsg = msg
        lastInviteIndex = i
        break
      }
    }

    if (!lastInviteMsg || lastInviteIndex === -1) return

    // 如果已经处理过这个邀请，跳过
    if (processedInviteIdRef.current === lastInviteMsg.id) return

    // 检查邀请之后是否有AI回复
    const hasAiReply = messages.slice(lastInviteIndex + 1).some(msg => 
      msg.type === 'received' && msg.content
    )

    if (hasAiReply) {
      // AI已回复，更新邀请状态为accepted
      processedInviteIdRef.current = lastInviteMsg.id
      
      setMessages(prev => {
        const updated = prev.map(msg => {
          if (msg.id === lastInviteMsg!.id) {
            return {
              ...msg,
              emojiDrawInvite: {
                ...(msg as any).emojiDrawInvite,
                status: 'accepted'
              }
            }
          }
          return msg
        })
        saveMessages(characterId, updated)
        return updated
      })
    }
  }, [messages, characterId, setMessages, saveMessages])

  // 打开游戏选择菜单
  const openGameSelect = useCallback(() => {
    playSound()
    setShowGameSelect(true)
  }, [playSound])

  // 选择游戏类型并开始
  const startGame = useCallback((type: 'draw' | 'act' | 'ai-draw') => {
    setShowGameSelect(false)
    
    if (type === 'ai-draw') {
      // AI画你猜模式：发送邀请卡片
      if (!characterId) return
      
      const message: Message = {
        id: Date.now(),
        type: 'sent',
        messageType: 'emojiDrawInvite' as any,
        content: '邀请你玩你画我猜',
        aiReadableContent: `[你画我猜邀请] 用户邀请你玩"你画我猜"游戏！这次是你来画！

【画画格式】使用 [画:题目:画板内容] 发送！题目是答案，用户看不到。

示例：
[画:兔子:  (\_/)
 (o.o)
 (> <)]

或：
[画:太阳:🌞☀️]

规则：
1. 想一个简单事物（动物/食物/物品）
2. 【禁止画猫！太简单了，换个有创意的】
3. 用 [画:题目:画板内容] 格式发送
4. 画完后问"猜猜这是什么？"
5. 不要直接说答案！

【判断格式】当用户猜测时，根据用户的猜测判断对错：
- 猜对了：[猜对:答案:10:你的夸奖评语]
- 猜错了：[猜错:答案:2:你的安慰评语]

示例：
用户说"是兔子吗" → 如果答案是兔子 → [猜对:兔子:10:太厉害了！一下就猜对了]
用户说"是狗吗" → 如果答案是兔子 → [猜错:兔子:2:哈哈不对哦~是个长耳朵的小动物]`,
        emojiDrawInvite: {
          inviterName: characterName,
          status: 'pending'
        },
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      } as any

      setMessages(prev => {
        const updated = [...prev, message]
        saveMessages(characterId, updated)
        return updated
      })

      scrollToBottom()
      return
    }
    
    // 普通模式
    setGameType(type)
    setTopic(getRandomTopic(type))
    setShowPanel(true)
    setHasSent(false)  // 重置发送状态
    canvasDataRef.current = null
    descriptionRef.current = ''
  }, [characterId, setMessages, saveMessages, scrollToBottom])

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

  // 设置自定义题目
  const setCustomTopic = useCallback((customTopic: string) => {
    setTopic(customTopic)
    canvasDataRef.current = null
    descriptionRef.current = ''
  }, [])

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
      aiReadableContent: `[🎮 新游戏开始 - 你画我猜] 
⚠️ 注意：之前的游戏已经结束！不要再判断之前的猜测！
现在是【新一轮】游戏：用户画了一幅画让你来猜！
请看图说出你的猜测，不需要用任何特殊格式，直接自然地猜就好。
禁止使用[猜对:...]或[猜错:...]格式，那是你画用户猜时才用的！`,
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
      aiReadableContent: `[🎮 新游戏开始 - 你演我猜] 
⚠️ 注意：之前的游戏已经结束！不要再判断之前的猜测！
现在是【新一轮】游戏：用户在描述一个动作让你来猜！
描述内容："${description}"
请自然地说出你的猜测，不需要用任何特殊格式。
禁止使用[猜对:...]或[猜错:...]格式！`,
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
    aiGuess: judgeResult?.guess || '',  // AI猜的内容
    isAiCorrect: judgeResult?.isCorrect || false,  // AI是否猜对
    isJudging,  // 是否正在AI判定
    canvasDataRef,
    descriptionRef,
    isRefreshing,  // 是否正在刷新题库
    remainingCount,  // 剩余题目数量
    
    // 操作
    openGameSelect,
    closeGameSelect: () => setShowGameSelect(false),
    startGame,
    changeTopic,
    setCustomTopic,  // 设置自定义题目
    endGame,
    openPanel,
    closePanel,
    sendDrawing,
    sendDescription,
    confirmCorrect
  }
}
