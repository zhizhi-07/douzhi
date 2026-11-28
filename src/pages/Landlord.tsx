import { getStoredUserProfileJSON } from '../utils/userProfileStorage'
/**
 * 斗地主 - 真实AI对战版
 * 
 * 功能：
 * 1. 用户选择一个角色，AI选择另外两个角色
 * 2. 地主随机分配
 * 3. 轮流出牌，调用AI API决策
 * 4. 遵守斗地主规则
 * 5. AI可以发送聊天消息
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PlayingCard from '../components/game/PlayingCard'
import { characterService } from '../services/characterService'
import { Card, sortCards, recognizePattern, canBeat, getPatternName } from '../utils/landlordRules'
import { getAIPlayDecision } from '../services/landlordAI'

// === 类型定义 ===
interface Player {
  id: string
  name: string
  avatar: string
  characterId?: string
  isAI: boolean
  useProxyAPI?: boolean // 是否使用代付API
}

type Position = 'me' | 'left' | 'right'

// === 工具函数 ===
const createDeck = (): Card[] => {
  const suits = ['spade', 'heart', 'diamond', 'club'] as const
  const deck: Card[] = []
  for (let i = 3; i <= 15; i++) {
    for (const suit of suits) {
      deck.push({ suit, rank: i, id: `${suit}-${i}-${Math.random()}` })
    }
  }
  deck.push({ suit: 'joker', rank: 16, id: `joker-16-${Math.random()}` })
  deck.push({ suit: 'joker', rank: 17, id: `joker-17-${Math.random()}` })
  return deck
}

const Landlord = () => {
  const navigate = useNavigate()
  
  // UI适配
  const [scale, setScale] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // 游戏状态
  const [gameState, setGameState] = useState<'selecting' | 'dealing' | 'bidding' | 'playing' | 'gameover'>('selecting')
  const [currentTurn, setCurrentTurn] = useState<Position>('me')
  const [landlordPos, setLandlordPos] = useState<Position | null>(null)
  const [winner, setWinner] = useState<Position | null>(null)
  const [shouldStartGame, setShouldStartGame] = useState(false)
  
  // 玩家信息
  const [players, setPlayers] = useState<{me: Player | null, left: Player | null, right: Player | null}>({
    me: null, left: null, right: null
  })
  const [characters, setCharacters] = useState<any[]>([])
  
  // 牌数据
  const [hands, setHands] = useState<{me: Card[], left: Card[], right: Card[]}>({ me: [], left: [], right: [] })
  const [lastPlayed, setLastPlayed] = useState<{cards: Card[], by: Position | null}>({ cards: [], by: null })
  const [passCount, setPassCount] = useState(0) // 连续pass次数
  const [playHistory, setPlayHistory] = useState<{position: Position, cards: Card[], action: 'play' | 'pass'}[]>([]) // 出牌历史
  
  // 交互状态
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [chatBubbles, setChatBubbles] = useState<{id: string, text: string, position: Position}[]>([])
  const [chatHistory, setChatHistory] = useState<{position: string, text: string}[]>([]) // 聊天历史
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [showChatInput, setShowChatInput] = useState(false)
  
  // 加载角色列表
  useEffect(() => {
    const userCharacters = characterService.getAll()
    if (userCharacters.length > 0) {
      const chars = userCharacters.map((char, index) => ({
        id: `char-${index}`,
        characterId: char.id,
        name: char.nickname || char.realName,
        avatar: char.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${char.id}`
      }))
      setCharacters(chars)
    } else {
      setCharacters([
        { id: 'default-1', name: '农民老王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang' },
        { id: 'default-2', name: '地主婆', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lady' },
        { id: 'default-3', name: '赌神', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=god' },
      ])
    }
  }, [])
  
  // 屏幕适配
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      // 手机竖屏：不旋转，直接缩放适配屏幕
      const mobile = w < 768
      setIsMobile(mobile)
      if (mobile) {
        // 计算缩放比例，确保宽度和高度都能完整显示
        const scaleW = w / 750 // 设计宽度750
        const scaleH = h / 1000 // 设计高度1000
        setScale(Math.min(scaleW, scaleH, 1))
      } else {
        // 桌面端：横向布局
        const scaleW = w / 1334
        const scaleH = h / 750
        setScale(Math.min(scaleW, scaleH, 1))
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // 监听游戏开始标志位
  useEffect(() => {
    if (shouldStartGame && players.me && players.left && players.right) {
      console.log('✅ [斗地主] Players已就绪，开始游戏')
      setShouldStartGame(false) // 重置标志位
      startGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStartGame, players])
  
  // 监控hands状态变化
  useEffect(() => {
    console.log('🎮 [状态监控] hands更新:', {
      me: hands.me.length,
      left: hands.left.length,
      right: hands.right.length,
      meCards: hands.me.map(c => c.rank)
    })
  }, [hands])
  
  // 选择角色
  const handleSelectCharacter = (charIndex: number) => {
    // 获取用户自己的信息
    const userInfo = JSON.parse(getStoredUserProfileJSON() || '{}')
    const userName = userInfo.nickname || '玩家'
    const userAvatar = userInfo.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
    
    // 用户选择的AI角色（使用用户自己的API）
    const selectedAI = { ...characters[charIndex], isAI: true, useProxyAPI: false }
    
    // 右侧固定为电脑玩家（使用代付API）
    const computerNames = ['电脑玩家', 'AI对手', '机器人', '智能助手', '游戏AI']
    const randomName = computerNames[Math.floor(Math.random() * computerNames.length)]
    const randomAI = { 
      id: 'proxy-ai', 
      name: randomName, 
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`, 
      isAI: true, 
      useProxyAPI: true 
    }
    
    setPlayers({
      me: { id: 'user', name: userName, avatar: userAvatar, isAI: false },
      left: selectedAI,
      right: randomAI
    })
    
    // 设置标志位，触发游戏开始
    setShouldStartGame(true)
  }
  
  // 开始游戏
  const startGame = async () => {
    setGameState('dealing')
    
    // 洗牌发牌
    const deck = createDeck()
    deck.sort(() => Math.random() - 0.5)
    
    const bottomCards = deck.slice(51)
    
    // 随机决定地主
    const positions: Position[] = ['me', 'left', 'right']
    const landlord = positions[Math.floor(Math.random() * 3)]
    setLandlordPos(landlord)
    
    console.log(`🎮 [斗地主] 地主是: ${landlord}`)
    
    // 一次性设置所有手牌（包括底牌）
    const initialHands = {
      me: deck.slice(0, 17),
      left: deck.slice(17, 34),
      right: deck.slice(34, 51)
    }
    
    // 地主拿底牌
    initialHands[landlord] = [...initialHands[landlord], ...bottomCards]
    
    // 排序所有手牌
    const sortedHands = {
      me: sortCards(initialHands.me),
      left: sortCards(initialHands.left),
      right: sortCards(initialHands.right)
    }
    
    setHands(sortedHands)
    
    console.log(`🎮 [斗地主] 发牌完成:`, {
      me: initialHands.me.length,
      left: initialHands.left.length,
      right: initialHands.right.length
    })
    console.log(`🎮 [斗地主] 我的手牌:`, initialHands.me.map(c => c.rank))
    console.log(`🎮 [斗地主] 左侧AI手牌:`, initialHands.left.map(c => c.rank))
    console.log(`🎮 [斗地主] 右侧AI手牌:`, initialHands.right.map(c => c.rank))
    
    // 验证setHands是否执行（通过setTimeout在下一个事件循环检查）
    setTimeout(() => {
      console.log(`🔍 [发牌验证] setHands后的hands状态检查:`, {
        me: hands.me.length,
        left: hands.left.length,
        right: hands.right.length
      })
    }, 100)
    
    await new Promise(r => setTimeout(r, 2000))
    setGameState('playing')
    setCurrentTurn(landlord)
    
    // 等待状态更新后再让AI出牌（传递完整的hands数据和空的lastPlayed）
    if (landlord !== 'me') {
      setTimeout(() => handleAITurn(landlord, sortedHands[landlord], sortedHands, []), 2000)
    }
  }
  
  // AI回合
  const handleAITurn = async (position: Position, providedCards?: Card[], providedHands?: typeof hands, providedLastPlayed?: Card[]) => {
    if (position === 'me') return
    
    console.log(`🎮 [斗地主] handleAITurn 被调用，位置: ${position}`)
    setIsAIThinking(true)
    const player = players[position]
    if (!player) {
      console.error(`❌ [斗地主] 找不到玩家: ${position}`)
      setIsAIThinking(false)
      return
    }
    
    // 使用传入的lastPlayed（避免React状态延迟）
    const actualLastPlayed = providedLastPlayed !== undefined ? providedLastPlayed : lastPlayed.cards
    console.log(`🎮 [斗地主] 实际使用的lastPlayed:`, actualLastPlayed.map(c => c.rank))
    
    console.log(`🎮 [斗地主] 玩家信息:`, {
      name: player.name,
      id: player.id,
      characterId: player.characterId,
      useProxyAPI: player.useProxyAPI,
      isAI: player.isAI
    })
    
    try {
      // 优先使用传入的手牌，否则从状态读取
      const aiCards = providedCards || hands[position]
      const currentHands = providedHands || hands
      const isLandlord = landlordPos === position
      
      console.log(`🎮 [斗地主] 准备调用AI，手牌数量: ${aiCards?.length || 0}, 是否地主: ${isLandlord}`)
      console.log(`🎮 [斗地主] 使用的hands数据:`, {
        me: currentHands.me.length,
        left: currentHands.left.length,
        right: currentHands.right.length
      })
      
      // 检查手牌是否有效
      if (!aiCards || aiCards.length === 0) {
        console.error(`❌ [斗地主] AI手牌为空`)
        setIsAIThinking(false)
        return
      }
      
      // 获取队友和对手信息
      const teamInfo = getTeamInfo(position, landlordPos)
      
      console.log('🎮 [AI调用] 传递给AI的完整信息:', {
        characterName: player.name,
        characterId: player.characterId,
        aiCards: aiCards.map(c => `${c.rank}`),
        lastPlayedCards: actualLastPlayed.map(c => `${c.rank}`),
        isLandlord,
        handsCount: {
          ai: aiCards.length,
          left: currentHands.left?.length || 0,
          right: currentHands.right?.length || 0
        },
        teamInfo,
        playHistory: playHistory.slice(-5),
        chatHistory: chatHistory.slice(-3)
      })
      
      const decision = await getAIPlayDecision(
        position, // AI的位置
        player.id,
        player.name,
        aiCards,
        actualLastPlayed, // 使用传入的lastPlayed，避免状态延迟
        isLandlord,
        aiCards.length,
        currentHands.me?.length || 0, // 用户的牌数
        currentHands.left?.length || 0,
        currentHands.right?.length || 0,
        player.useProxyAPI || false, // 是否使用代付API
        chatHistory, // 传递聊天历史
        playHistory, // 传递出牌历史
        teamInfo // 传递队友关系
      )
      
      console.log(`✅ [斗地主] AI决策完成:`, decision)
      
      // 显示AI消息
      if (decision.message) {
        showChatBubble(position, decision.message)
        console.log(`💬 [AI说话] ${position}: ${decision.message}`)
      }
      
      if (decision.pass) {
        // AI pass时不显示默认的"不出"消息，因为AI已经说话了
        // 传递最新的hands状态，避免闭包问题
        handlePass(position, false, currentHands)
      } else {
        // 传递最新的hands状态，避免闭包问题
        handlePlay(position, decision.cards, currentHands)
      }
      
    } catch (error) {
      console.error('AI出牌失败:', error)
      // 出错时随机出一张（使用传入的手牌，避免闭包问题）
      const aiCards = providedCards || hands[position]
      if (aiCards && aiCards.length > 0) {
        handlePlay(position, [aiCards[0]], currentHands)
      }
    } finally {
      setIsAIThinking(false)
    }
  }
  
  // 显示聊天气泡
  const showChatBubble = (position: Position, text: string) => {
    const id = Date.now().toString()
    setChatBubbles(prev => [...prev, { id, text, position }])
    setChatHistory(prev => [...prev, { position, text }].slice(-9)) // 保留最近9条
    setTimeout(() => {
      setChatBubbles(prev => prev.filter(b => b.id !== id))
    }, 5000)
  }
  
  // 玩家发送聊天消息
  const handleSendChat = () => {
    if (!chatInput.trim()) return
    showChatBubble('me', chatInput)
    setChatInput('')
    setShowChatInput(false)
  }

  // 获取队友关系信息（返回位置和玩家名字）
  const getTeamInfo = (aiPosition: Position, landlordPos: Position | null) => {
    if (!landlordPos) return { teammates: [], enemies: [], teammate: '', opponent: '', teammatePos: '', opponentPos: '' }
    
    // 位置到名字的映射
    const getPlayerName = (pos: Position) => {
      if (pos === 'me') return players.me?.name || '用户'
      if (pos === 'left') return players.left?.name || '左侧AI'
      if (pos === 'right') return players.right?.name || '右侧AI'
      return '未知'
    }
    
    const allPositions: Position[] = ['me', 'left', 'right']
    const isLandlord = aiPosition === landlordPos
    
    if (isLandlord) {
      // 地主：其他两个都是敌人
      const enemyPositions = allPositions.filter(pos => pos !== aiPosition)
      return {
        teammates: [],
        enemies: enemyPositions.map(getPlayerName),
        teammate: '',
        opponent: enemyPositions.map(getPlayerName).join('和'),
        teammatePos: '',
        opponentPos: '' // 地主没有特定对手位置
      }
    } else {
      // 农民：地主是敌人，另一个农民是队友
      const teammatePositions = allPositions.filter(pos => pos !== aiPosition && pos !== landlordPos)
      return {
        teammates: teammatePositions.map(getPlayerName),
        enemies: [getPlayerName(landlordPos)],
        teammate: teammatePositions.map(getPlayerName).join(''),
        opponent: getPlayerName(landlordPos),
        teammatePos: teammatePositions[0] || '', // 队友的位置
        opponentPos: landlordPos // 地主的位置
      }
    }
  }
  
  // 玩家出牌
  const handlePlayerPlay = () => {
    if (selectedCards.length === 0) {
      setErrorMessage('请选择要出的牌')
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }
    
    console.log('🎮 [玩家出牌] 选中的卡牌ID:', selectedCards)
    console.log('🎮 [玩家出牌] 当前手牌:', hands.me.map(c => ({id: c.id, rank: c.rank})))
    
    const cards = hands.me.filter(c => selectedCards.includes(c.id))
    
    console.log('🎮 [玩家出牌] 准备出的牌:', cards.map(c => ({id: c.id, rank: c.rank})))
    
    if (cards.length !== selectedCards.length) {
      console.error('❌ [玩家出牌] 选中的牌数量不匹配:', {
        selectedCount: selectedCards.length,
        foundCards: cards.length,
        selectedIds: selectedCards,
        foundIds: cards.map(c => c.id)
      })
    }
    
    // 验证牌型
    const pattern = recognizePattern(cards)
    if (pattern.type === 'invalid') {
      setErrorMessage(`无效牌型！不能出${selectedCards.length}张牌`)
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }
    
    // 判断是否可以自由出牌（牌桌为空或其他人都pass了）
    const isFreePlay = lastPlayed.cards.length === 0 || passCount >= 2
    
    console.log('🎮 [玩家出牌] 出牌状态:', {
      lastPlayedCount: lastPlayed.cards.length,
      passCount,
      isFreePlay
    })
    
    // 验证是否能压过上家（只有非自由出牌时才验证）
    if (!isFreePlay && !canBeat(cards, lastPlayed.cards)) {
      setErrorMessage(`无法压过上家的${getPatternName(recognizePattern(lastPlayed.cards))}`)
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }
    
    showChatBubble('me', getPatternName(pattern))
    handlePlay('me', cards)
  }
  
  // 玩家pass
  const handlePlayerPass = () => {
    // 判断是否可以自由出牌
    const isFreePlay = lastPlayed.cards.length === 0 || passCount >= 2
    
    if (isFreePlay) {
      setErrorMessage('轮到你自由出牌了，不能pass！')
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }
    
    console.log('🎮 [玩家Pass] 玩家选择不出')
    showChatBubble('me', '要不起')
    handlePass('me')
  }
  
  // 统一出牌处理
  const handlePlay = (position: Position, cards: Card[], providedHands?: typeof hands) => {
    const currentHands = providedHands || hands // 使用传入的hands或当前状态
    
    console.log(`🎮 [出牌处理] ${position} 出牌:`, cards.map(c => ({id: c.id, rank: c.rank})))
    console.log(`🎮 [出牌处理] 更新前 ${position} 手牌数:`, currentHands[position].length)
    
    // 记录要移除的卡牌ID
    const cardsToRemove = new Set(cards.map(c => c.id))
    console.log(`🎮 [出牌处理] 要移除的卡牌ID:`, Array.from(cardsToRemove))
    
    // 计算新的手牌状态
    const newHands = {
      ...currentHands,
      [position]: currentHands[position].filter(c => !cardsToRemove.has(c.id))
    }
    
    console.log(`🎮 [出牌处理] 更新后 ${position} 手牌数:`, newHands[position].length)
    console.log(`🎮 [出牌处理] 移除的卡牌数:`, currentHands[position].length - newHands[position].length)
    
    // 验证移除是否成功
    if (currentHands[position].length === newHands[position].length) {
      console.error(`❌ [出牌处理] 警告：没有牌被移除！可能是ID不匹配`)
      console.error(`❌ [出牌处理] 要移除的ID:`, Array.from(cardsToRemove))
      console.error(`❌ [出牌处理] 手牌ID:`, currentHands[position].map(c => c.id))
    }
    
    setHands(newHands)
    setLastPlayed({ cards, by: position })
    setPassCount(0)
    setSelectedCards([])
    
    // 记录出牌历史
    setPlayHistory(prev => {
      const newHistory = [...prev, { position, cards, action: 'play' as const }]
      console.log('🎮 [出牌历史] 更新:', newHistory.slice(-3))
      return newHistory
    })
    
    // 检查是否获胜
    const remainingCards = newHands[position].length
    if (remainingCards === 0) {
      setWinner(position)
      setGameState('gameover')
      return
    }
    
    // 下一个玩家（传递刚出的牌，避免状态延迟）
    nextTurn(position, newHands, cards)
  }
  
  // 统一pass处理
  const handlePass = (position: Position, showMessage: boolean = true, providedHands?: typeof hands) => {
    console.log(`🎮 [Pass处理] ${position} pass，当前passCount: ${passCount}`)
    
    const newPassCount = passCount + 1
    const currentHands = providedHands || hands // 使用传入的hands或当前状态
    
    // 显示pass提示（AI在handleAITurn中已经显示了message，这里不重复显示）
    if (showMessage) {
      const positionName = position === 'me' ? '你' : 
                          position === 'left' ? '左侧AI' : '右侧AI'
      showChatBubble(position, '不出')
      console.log(`💬 [Pass提示] ${positionName} 选择不出`)
    }
    
    // 记录pass历史
    setPlayHistory(prev => {
      const newHistory = [...prev, { position, cards: [], action: 'pass' as const }]
      console.log('🎮 [Pass历史] 更新:', newHistory.slice(-3))
      return newHistory
    })
    
    // 如果连续两个人pass，清空场上的牌（在nextTurn之前清空，确保下一个玩家能自由出牌）
    if (newPassCount >= 2) {
      console.log(`🎮 [清空牌桌] 连续${newPassCount}人pass，清空场上的牌，下一个玩家可自由出牌`)
      setLastPlayed({ cards: [], by: null })
      setPassCount(0)
    } else {
      // 只有未清空时才更新passCount
      setPassCount(newPassCount)
    }
    
    // 下一个玩家（pass时传递当前的lastPlayed，如果2人pass则传空）
    const cardsForNext = newPassCount >= 2 ? [] : lastPlayed.cards
    nextTurn(position, currentHands, cardsForNext)
  }
  
  // 下一回合
  const nextTurn = (currentPos: Position, currentHands?: typeof hands, currentLastPlayed?: Card[]) => {
    const order: Position[] = ['me', 'left', 'right']
    const currentIndex = order.indexOf(currentPos)
    const nextPos = order[(currentIndex + 1) % 3]
    
    console.log(`🎮 [轮次切换] ${currentPos} -> ${nextPos}`)
    setCurrentTurn(nextPos)
    
    // 如果是AI，自动执行（传递当前手牌状态）
    if (nextPos !== 'me') {
      const handsToUse = currentHands || hands
      const nextPlayerCards = handsToUse[nextPos]
      
      console.log(`🎮 [下一回合] ${nextPos} 的手牌详情:`, {
        count: nextPlayerCards?.length || 0,
        cards: nextPlayerCards?.map(c => c.rank) || []
      })
      console.log(`🎮 [下一回合] 传递的完整状态:`, {
        me: handsToUse.me.length,
        left: handsToUse.left.length, 
        right: handsToUse.right.length
      })
      
      // 传递完整的hands数据和lastPlayed，避免状态延迟问题
      const lastPlayedToUse = currentLastPlayed !== undefined ? currentLastPlayed : lastPlayed.cards
      console.log(`🎮 [下一回合] 传递的lastPlayed:`, lastPlayedToUse.map(c => c.rank))
      setTimeout(() => handleAITurn(nextPos, nextPlayerCards, handsToUse, lastPlayedToUse), 1500)
    }
  }
  
  // 切换选中牌
  const toggleCard = (id: string) => {
    console.log('🎮 [选牌] 切换卡牌:', id)
    setSelectedCards(prev => {
      const isSelected = prev.includes(id)
      const newSelected = isSelected 
        ? prev.filter(c => c !== id) 
        : [...prev, id]
      
      console.log('🎮 [选牌] 选中状态变化:', {
        cardId: id,
        action: isSelected ? '取消选中' : '选中',
        before: prev,
        after: newSelected
      })
      
      return newSelected
    })
  }
  
  return (
    <div className="fixed inset-0 bg-[#1a472a] overflow-hidden select-none font-sans">
      <div 
        className="absolute left-1/2 top-1/2 origin-center transition-all duration-300 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
        style={{ 
          width: isMobile ? 750 : 1334, 
          height: isMobile ? 1000 : 750, 
          transform: `translate(-50%, -50%) scale(${scale})`
        }}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        
        {/* 顶部栏 */}
        <div className="absolute top-0 left-0 right-0 h-16 flex justify-between items-center px-8 z-20">
          <button onClick={() => navigate('/game-list')} className="w-10 h-10 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur">
            ←
          </button>
          <div className="text-white text-sm text-center">
            {gameState === 'playing' && (
              <div>
                <div className="font-bold">
                  当前回合: {currentTurn === 'me' ? '你' : players[currentTurn]?.name}
                </div>
              </div>
            )}
          </div>
          <div className="w-10" />
        </div>
        
        {/* 角色选择界面 */}
        {gameState === 'selecting' && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
            <h2 className="text-4xl font-black text-white mb-8">选择你的对手</h2>
            <p className="text-white/60 text-sm mb-8">你将与选中的AI角色一起游戏（再加一个电脑玩家）</p>
            <div className="flex gap-8 flex-wrap justify-center max-w-4xl">
              {characters.length > 0 ? characters.map((char, i) => (
                <button 
                  key={char.id}
                  onClick={() => handleSelectCharacter(i)}
                  className="group w-48 h-64 rounded-2xl bg-white/5 border-2 border-white/10 hover:border-yellow-400 hover:bg-white/10 transition-all hover:scale-105 flex flex-col items-center justify-center gap-4"
                >
                  <img src={char.avatar} className="w-24 h-24 rounded-full shadow-lg group-hover:scale-110 transition-transform" alt={char.name} />
                  <span className="text-xl font-bold text-white">{char.name}</span>
                </button>
              )) : (
                <div className="text-white text-center">
                  <p className="mb-4">您还没有创建角色</p>
                  <button onClick={() => navigate('/character-list')} className="px-6 py-3 bg-yellow-400 text-yellow-900 rounded-full font-bold">
                    去创建角色
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 结算界面 */}
        {gameState === 'gameover' && winner && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-[400px] text-center shadow-2xl">
              <div className="text-6xl mb-4">{winner === 'me' ? '🏆' : '😭'}</div>
              <h2 className={`text-3xl font-black mb-2 ${winner === 'me' ? 'text-yellow-500' : 'text-gray-600'}`}>
                {winner === 'me' ? '大获全胜' : '遗憾落败'}
              </h2>
              <p className="text-gray-500 mb-4">
                {winner === 'me' ? '你的牌技太强了！' : `${players[winner]?.name}获胜！`}
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => navigate('/game-list')} className="px-6 py-3 rounded-full bg-gray-100 text-gray-600 font-bold">
                  退出
                </button>
                <button onClick={() => {
                  setGameState('selecting')
                  setWinner(null)
                  setLandlordPos(null)
                  setCurrentTurn('me')
                  setPassCount(0)
                  setLastPlayed({ cards: [], by: null })
                  setHands({ me: [], left: [], right: [] })
                  setSelectedCards([])
                  setChatBubbles([])
                  setChatHistory([])
                  setPlayHistory([]) // 清空出牌历史
                }} className="px-8 py-3 rounded-full bg-yellow-500 text-white font-bold">
                  再来一局
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 左侧玩家 */}
        {players.left && (
          <div className={`absolute flex flex-col items-center gap-2 z-30 ${isMobile ? 'left-4 top-[15%]' : 'left-8 top-1/3 -translate-y-1/2'}`}>
            <div className="text-white text-xs font-bold">{players.left.name}</div>
            <div className="relative">
              <div className={`relative w-16 h-16 rounded-full border-2 ${currentTurn === 'left' ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-white/30'} overflow-hidden bg-gray-800 transition-all`}>
                <img src={players.left.avatar} alt="" />
                {landlordPos === 'left' && <span className="absolute top-0 right-0 text-xl">👑</span>}
              </div>
            </div>
            <div className="bg-black/40 text-white text-xs px-3 py-1 rounded-full">
              {hands.left.length}张
            </div>
            {chatBubbles.find(b => b.position === 'left') && (
              <div className="absolute left-20 top-0 bg-white text-black px-3 py-2 rounded-xl rounded-bl-none shadow-lg text-sm whitespace-nowrap">
                {chatBubbles.find(b => b.position === 'left')?.text}
              </div>
            )}
          </div>
        )}
        
        {/* 右侧玩家 */}
        {players.right && (
          <div className={`absolute flex flex-col items-center gap-2 z-30 ${isMobile ? 'right-4 top-[15%]' : 'right-8 top-1/3 -translate-y-1/2'}`}>
            <div className="text-white text-xs font-bold">{players.right.name}</div>
            <div className="relative">
              <div className={`relative w-16 h-16 rounded-full border-2 ${currentTurn === 'right' ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-white/30'} overflow-hidden bg-gray-800 transition-all`}>
                <img src={players.right.avatar} alt="" />
                {landlordPos === 'right' && <span className="absolute top-0 right-0 text-xl">👑</span>}
              </div>
            </div>
            <div className="bg-black/40 text-white text-xs px-3 py-1 rounded-full">
              {hands.right.length}张
            </div>
            {chatBubbles.find(b => b.position === 'right') && (
              <div className="absolute right-20 top-0 bg-white text-black px-3 py-2 rounded-xl rounded-br-none shadow-lg text-sm whitespace-nowrap">
                {chatBubbles.find(b => b.position === 'right')?.text}
              </div>
            )}
          </div>
        )}
        
        {/* 中央出牌区 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-h-[120px] flex flex-col items-center justify-center z-20">
          {/* 当前状态提示 */}
          <div className="mb-2 px-3 py-1 rounded-full text-xs font-bold">
            {gameState === 'playing' && (
              <>
                {lastPlayed.cards.length === 0 || passCount >= 2 ? (
                  <div className="bg-green-500/80 text-white">
                    🆓 自由出牌
                  </div>
                ) : (
                  <div className="bg-orange-500/80 text-white">
                    🎯 需要压过上家
                  </div>
                )}
              </>
            )}
          </div>
          
          {lastPlayed.cards.length > 0 && passCount < 2 && (
            <>
              <div className="text-white/60 text-xs mb-2">
                {lastPlayed.by && `${lastPlayed.by === 'me' ? '你' : players[lastPlayed.by]?.name}的出牌`}
              </div>
              <div className="flex">
                {lastPlayed.cards.map((card, i) => (
                  <PlayingCard key={card.id} card={card} scale={0.7} style={{ marginLeft: i === 0 ? 0 : -35 }} />
                ))}
              </div>
            </>
          )}
          
          {/* 出牌历史 */}
          {playHistory.length > 0 && (
            <div className="mt-4 bg-black/30 rounded-lg px-3 py-2 max-w-md">
              <div className="text-white/40 text-xs mb-1">最近动作</div>
              <div className="flex flex-col gap-1">
                {playHistory.slice(-3).map((h, i) => (
                  <div key={i} className="text-white/70 text-xs">
                    <span className="text-yellow-400">
                      {h.position === 'me' ? '你' : 
                       h.position === 'left' ? players.left?.name : 
                       players.right?.name}
                    </span>
                    ：
                    {h.action === 'pass' ? (
                      <span className="text-gray-400">不出</span>
                    ) : (
                      <span className="text-green-400">
                        出了 {h.cards.map(c => {
                          const rankMap: Record<number, string> = {
                            11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: '小王', 17: '大王'
                          }
                          return rankMap[c.rank] || c.rank
                        }).join(' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isAIThinking && (
            <div className="text-white text-sm mt-4 animate-pulse">
              <div>🧠 AI智能分析中...</div>
              <div className="text-xs text-white/60 mt-1">正在验证牌型和战术</div>
            </div>
          )}
          
          {errorMessage && (
            <div className="absolute top-32 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce-in">
              {errorMessage}
            </div>
          )}
        </div>
        
        {/* 底部自己区域 */}
        <div className="absolute bottom-0 left-0 right-0 h-[320px] flex flex-col justify-end items-center pb-4">
          {/* 玩家信息 */}
          {players.me && (
            <div className="absolute left-8 bottom-6 flex gap-3 items-center z-40">
              <div className="relative">
                <div className={`relative w-20 h-20 rounded-full border-4 ${currentTurn === 'me' ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-white/30'} overflow-hidden bg-gray-800 transition-all`}>
                  <img src={players.me.avatar} alt="" />
                  {landlordPos === 'me' && <span className="absolute top-0 right-0 text-2xl">👑</span>}
                </div>
              </div>
              <div className="text-white">
                <div className="font-bold text-lg">{players.me.name}</div>
                <div className="text-yellow-400 text-sm">{hands.me.length}张牌</div>
              </div>
              {chatBubbles.find(b => b.position === 'me') && (
                <div className="absolute left-24 bottom-16 bg-white text-black px-4 py-2 rounded-2xl shadow-lg whitespace-nowrap">
                  {chatBubbles.find(b => b.position === 'me')?.text}
                </div>
              )}
            </div>
          )}
          
          {/* 操作按钮 */}
          {gameState === 'playing' && currentTurn === 'me' && !isAIThinking && (
            <div className="flex flex-col items-center gap-3 mb-6">
              {/* 状态提示 */}
              <div className="text-sm text-center">
                {lastPlayed.cards.length === 0 || passCount >= 2 ? (
                  <div className="text-green-400 font-bold">
                    🆓 轮到你自由出牌！可以出任何牌型
                  </div>
                ) : (
                  <div className="text-orange-400 font-bold">
                    🎯 需要压过上家的牌，或选择不出
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                {/* Pass按钮 */}
                <div className="relative">
                  <button
                    onClick={handlePlayerPass}
                    className="px-6 py-3 rounded-full bg-gray-500 text-white font-bold hover:bg-gray-600 transition-colors"
                  >
                    不出
                  </button>
                </div>
                
                {/* 出牌按钮 */}
                <div className="relative">
                  <button
                    onClick={handlePlayerPlay}
                    disabled={selectedCards.length === 0}
                    className={`px-8 py-3 rounded-full font-bold transition-colors ${
                      selectedCards.length > 0
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    出牌
                  </button>
                </div>
              </div>
              
              {showChatInput && (
                <div className="flex gap-2 items-center mt-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="说点什么..."
                    className="px-4 py-2 rounded-full border-2 border-blue-300 focus:border-blue-500 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSendChat}
                    className="px-4 py-2 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-600"
                  >
                    发送
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* 手牌区域 */}
          <div className="relative h-[140px] w-full flex justify-center items-end">
            {hands.me.map((card, i) => {
              const isSelected = selectedCards.includes(card.id)
              return (
                <div 
                  key={card.id}
                  className="absolute transition-all duration-200 cursor-pointer hover:-translate-y-2"
                  style={{
                    left: `50%`,
                    marginLeft: (i - (hands.me.length - 1) / 2) * 40,
                    bottom: isSelected ? 20 : 0,
                    zIndex: i
                  }}
                  onClick={() => currentTurn === 'me' && !isAIThinking && toggleCard(card.id)}
                >
                  <PlayingCard card={card} scale={1.0} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landlord
