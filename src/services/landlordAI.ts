/**
 * 斗地主AI服务
 * 调用API让AI决定出牌策略
 */

import { Card, rankToText, recognizePattern, getPatternName } from '../utils/landlordRules'
import { callZhizhiApi } from './zhizhiapi'
import { characterService } from './characterService'

export interface AIPlayDecision {
  cards: Card[] // 要出的牌
  message?: string // AI发送的消息
  pass: boolean // 是否要不起/过
}

/**
 * 将手牌转换为文本描述
 */
const cardsToText = (cards: Card[]): string => {
  const sorted = [...cards].sort((a, b) => b.rank - a.rank)
  return sorted.map(c => rankToText(c.rank)).join(' ')
}

/**
 * 将场上的牌转换为文本描述
 */
const tableCardsToText = (cards: Card[]): string => {
  if (cards.length === 0) return '无'
  const text = cardsToText(cards)
  return `${text}`
}

/**
 * 分析场上牌的类型
 */
const getCardTypeDescription = (cards: Card[]): string => {
  if (cards.length === 0) return ''
  const pattern = recognizePattern(cards)
  const typeName = getPatternName(pattern)
  return `${cards.length}张 - ${typeName}`
}

/**
 * 生成应对策略建议
 */
const getResponseStrategy = (lastCards: Card[]): string => {
  if (lastCards.length === 0) return '自由出牌'
  
  const pattern = recognizePattern(lastCards)
  switch (pattern.type) {
    case 'single':
      return `需要出更大的单张（大于${rankToText(lastCards[0].rank)}）`
    case 'pair':
      return `需要出更大的对子（大于${rankToText(lastCards[0].rank)}对）`
    case 'triple':
      return `需要出更大的三张（大于${rankToText(lastCards[0].rank)}）`
    case 'triple_single':
      return `需要出更大的三带一（三张大于${rankToText(pattern.value)}）`
    case 'triple_pair':
      return `需要出更大的三带二（三张大于${rankToText(pattern.value)}）`
    case 'straight':
      return `需要出同样长度但更大的顺子（${lastCards.length}张）`
    case 'pair_straight':
      return `需要出同样长度但更大的连对（${lastCards.length/2}对）`
    case 'triple_straight':
      return `需要出更大的飞机或炸弹`
    case 'bomb':
      return `需要出更大的炸弹或王炸`
    case 'joker_bomb':
      return `王炸最大，只能pass`
    default:
      return `需要出相同牌型但更大的牌`
  }
}

/**
 * 调用AI决定出牌
 */
export const getAIPlayDecision = async (
  position: 'left' | 'right', // AI的位置
  characterId: string,
  characterName: string,
  myCards: Card[],
  lastPlayedCards: Card[],
  isLandlord: boolean,
  myCardsCount: number,
  meCardsCount: number, // 用户(me)的牌数
  leftCardsCount: number,
  rightCardsCount: number,
  _useProxyAPI: boolean = false, // 废弃参数，现在统一使用zhizhiApi
  recentChat: Array<{position: string, text: string}> = [], // 最近的聊天记录
  playHistory: Array<{position: string, cards: Card[], action: 'play' | 'pass'}> = [], // 出牌历史
  teamInfo: {teammates: string[], enemies: string[], teammate?: string, opponent?: string, teammatePos?: string, opponentPos?: string} = {teammates: [], enemies: []} // 队友关系
): Promise<AIPlayDecision> => {
  console.log(`🎮 [landlordAI] getAIPlayDecision 被调用`)
  console.log(`🎮 [landlordAI] 参数:`, {
    characterId,
    characterName,
    myCardsCount: myCards.length,
    lastPlayedCount: lastPlayedCards.length,
    isLandlord
  })
  
  const myCardsText = cardsToText(myCards)
  const lastPlayText = tableCardsToText(lastPlayedCards)
  
  // 获取角色信息
  const character = characterService.getAll().find(c => c.id === characterId)
  const personality = character?.personality || '普通玩家'
  const signature = character?.signature || ''
  
  // 构建出牌历史文本
  const historyText = playHistory.length > 0 
    ? '最近6轮：\n' + playHistory.slice(-6).map((h, i) => {
        const playerName = h.position === 'me' ? '用户' : h.position === 'left' ? '左侧AI' : '右侧AI'
        const actionText = h.action === 'play' ? `出了 ${cardsToText(h.cards)}` : 'pass'
        return `  ${i+1}. ${playerName}: ${actionText}`
      }).join('\n')
    : '无历史记录'
    
  console.log('🤖 [AI输入] 出牌历史详情:')
  console.log(historyText)
    
  // 队友关系信息已在prompt中直接使用
    
  // 构建聊天历史文本
  const chatHistory = recentChat.length > 0 
    ? `\n\n【最近的对话】：\n${recentChat.map(c => `${c.position}: ${c.text}`).join('\n')}`
    : ''
  
  // 构建玩家位置信息（顺时针：我 → 左侧 → 右侧）
  const positionInfo = (() => {
    const clockwiseOrder: ('me' | 'left' | 'right')[] = ['me', 'left', 'right']
    const currentIndex = clockwiseOrder.indexOf(position)
    
    // 顺时针出牌，所以上家是前一个位置（逆时针找上家）
    const prevIndex = (currentIndex + 2) % 3  // 上家
    const nextIndex = (currentIndex + 1) % 3  // 下家
    
    const positionNames: Record<string, string> = {
      'me': '用户',
      'left': '左侧AI', 
      'right': '右侧AI'
    }
    
    const prevPlayer = positionNames[clockwiseOrder[prevIndex]]
    const nextPlayer = positionNames[clockwiseOrder[nextIndex]]
    const prevPosition = clockwiseOrder[prevIndex]
    
    // 验证顺序逻辑
    console.log(`🎮 [出牌顺序] AI位置: ${position}`)
    console.log(`🎮 [出牌顺序] 顺时针序列: 用户 → 左侧AI → 右侧AI`)
    console.log(`🎮 [出牌顺序] ${position}的上家: ${prevPlayer}，下家: ${nextPlayer}`)
    
    return {
      myPosition: position === 'left' ? '左侧位置' : '右侧位置',
      prevPlayer, // 上家是谁
      nextPlayer, // 下家是谁  
      prevPosition, // 上家位置标识
      nextPosition: clockwiseOrder[nextIndex]
    }
  })()

  // 构建提示词
  const prompt = `你是${characterName}，个性：${personality}，签名：${signature}

【游戏身份】：
- 你坐在${positionInfo.myPosition}
- 你的上家：${positionInfo.prevPlayer}
- 你的下家：${positionInfo.nextPlayer}
- ${isLandlord ? `你是地主，你要打败${teamInfo.opponent || '两个农民'}` : `你是农民，你的队友是${teamInfo.teammate || '另一个农民'}，地主是${teamInfo.opponent || '对手'}`}
- ${isLandlord ? '地主战术：抢先出完手牌，控制节奏，压制农民' : '农民战术：配合队友，阻击地主，让队友先走'}

【手牌分析】：
- 你的手牌：${myCardsText}
- 你剩余牌数：${myCardsCount}张
- 用户剩余：${meCardsCount}张${teamInfo.opponentPos === 'me' ? '【地主】' : teamInfo.teammatePos === 'me' ? '【队友】' : ''}
- ${position === 'left' ? '右侧AI' : '左侧AI'}剩余：${position === 'left' ? rightCardsCount : leftCardsCount}张${teamInfo.opponentPos === (position === 'left' ? 'right' : 'left') ? '【地主】' : teamInfo.teammatePos === (position === 'left' ? 'right' : 'left') ? '【队友】' : ''}

【出牌历史】：
${historyText}

【当前局面】：
${(() => {
  // 检查最近两次是否都是pass（说明可以自由出牌）
  const recentHistory = playHistory.slice(-2)
  const allRecentPass = recentHistory.length >= 2 && 
                        recentHistory.every(h => h.action === 'pass')
  
  if (lastPlayedCards.length === 0) {
    return '- 当前无人出牌，轮到你自由出牌（可以出任何牌型）'
  } else if (allRecentPass) {
    return '- 其他人都pass了，你可以自由出牌（可以出任何牌型）'
  } else {
    // 判断是谁出的牌
    const lastPlayer = playHistory.length > 0 ? playHistory[playHistory.length - 1] : null
    const playerName = lastPlayer ? 
      (lastPlayer.position === 'me' ? '用户' :
       lastPlayer.position === 'left' ? '左侧AI' : '右侧AI') : '上家'
    
    const isFromPrevPlayer = lastPlayer?.position === positionInfo.prevPosition
    
    return `- ${playerName}${isFromPrevPlayer ? '（你的上家）' : ''}刚出了：${lastPlayText}（${getCardTypeDescription(lastPlayedCards)}）
- 你的应对策略：${getResponseStrategy(lastPlayedCards)}
- 重要：只有出更大的同类牌型或炸弹才能压过去，否则只能pass`
  }
})()}

【战术思考】：
${isLandlord ? 
  `作为地主，你要：
  1. 优先出小牌，保留大牌控制局面
  2. 观察农民配合，及时阻击
  3. 利用炸弹和大牌主导节奏` :
  `作为农民，你要：
  1. 如果队友快赢了，帮助队友出牌（出小牌让路）
  2. 如果地主快赢了，用大牌阻击地主
  3. 合理配合，不要抢队友的机会`}

【斗地主规则】：
✅ **有效牌型**：
1. 单张：3, K, A, 2, 小王, 大王
2. 对子：33, KK, AA, 22
3. 三张：333, KKK, AAA, 222
4. 三带一：333+5, KKK+7, AAA+6
5. 三带二：333+55, KKK+77
6. 顺子：34567, 789JQ（至少5张连续，不能有2和王）
7. 连对：3344, 5566, 778899（至少3对连续）
8. 飞机：333444, 555666777（至少2个三张连续，可带牌）
9. 炸弹：3333, KKKK, AAAA, 2222（4张相同）
10. 王炸：小王+大王

❌ **无效牌型**（绝对不能出）：
- 9979（两个9+两个7，不是连对也不是其他牌型）
- 3456（4张顺子，至少要5张）
- 99K（3张不同，不是三张也不是三带一）
- 随机组合（如9773, K652等无规律组合）

**重要**：每次出牌前请确认是上述有效牌型之一！

【智能分析助手】：
请在出牌前进行以下分析：
1. 检查你想出的牌是否为有效牌型
2. 如果是跟牌，确认能压过上家
3. 考虑战术意图（主动出击 vs 配合队友）
4. 选择合适的说话内容配合出牌

【你的任务】：
${lastPlayedCards.length === 0 ? '你先出牌。分析手牌，选择最佳的开牌策略。' : '分析上家出的牌，决定是否跟牌或pass。如果跟牌，必须确保能压过上家。'}${chatHistory}

请用以下格式回复（只回复格式内容，不要额外解释）：
[出牌] 牌的点数（用空格分隔，如"3 3 3"）
[说话] 想说的话（**必须说话！**根据你的性格、牌面、对手的话来表达）

如果要pass，则回复：
[pass]
[说话] 想说的话（**必须说话！**）

例子1：场上无牌，自由出牌
[出牌] K K K 5
[说话] 三带一！看我的牌！

例子2：场上有J，出更大单张
[出牌] A
[说话] A压你的J！

❌ 错误示例：
[出牌] 9 9 7 7  ← 这不是有效牌型！
[出牌] 3 4 5 6  ← 顺子至少要5张！

例子3：场上有三带一（999+6），选择不出
[pass]  
[说话] 你这三带一太大了，要不起啊

例子4：场上有对8，出对K
[出牌] K K
[说话] 对K压你的对8！

例子5：队友出了大牌，你选择不压
[pass]
[说话] 队友这牌不错，我让你走！

例子6：地主快赢了，但你没有能压的牌
[pass]
[说话] 这牌太大了，顶不住啊！

**重要**：
1. 必须带[说话]！不要只出牌不说话
2. pass时也要说话！要根据局势说有意义的内容
3. 说话要符合你的性格
4. 如果对手刚说了话，要适当回应
5. 说话要自然、口语化，像真实玩家
6. pass的原因要清楚：是牌太大压不了，还是战术性让牌给队友

现在请做出你的决策：`

  console.log('🤖 [AI输入] 完整prompt:')
  console.log(prompt)
  console.log('🤖 [AI输入] 参数详情:', {
    characterName,
    myCards: myCardsText,
    lastPlayed: lastPlayText,
    isLandlord,
    teamInfo,
    historyText,
    chatHistory: recentChat
  })

  try {
    // 统一使用zhizhiApi
    console.log(`🎮 [斗地主] ${characterName} 使用zhizhiApi`)
    const responseContent = await callZhizhiApi(
      [
        { role: 'system', content: `你是${characterName}，正在玩斗地主。` },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.7, max_tokens: 2000 }
    )
    
    console.log('🤖 [zhizhiApi输出] 完整回复:')
    console.log(responseContent)
    
    // 解析AI回复
    const lines = responseContent.split('\n').map((l: string) => l.trim()).filter((l: string) => l)
    
    let pass = false
    let selectedCards: Card[] = []
    let message = ''
    
    for (const line of lines) {
      if (line.startsWith('[pass]')) {
        pass = true
      } else if (line.startsWith('[出牌]')) {
        const cardsText = line.replace('[出牌]', '').trim()
        selectedCards = parseCardsFromText(cardsText, myCards)
      } else if (line.startsWith('[说话]')) {
        message = line.replace('[说话]', '').trim()
      }
    }
    
    // 如果解析失败或AI出了无效牌，随机出一张
    if (!pass && selectedCards.length === 0) {
      console.warn('🤖 [AI验证] AI解析失败，随机出牌')
      selectedCards = [myCards[0]]
      message = message || '出牌！'
    }
    
    // 验证AI选择的牌型是否有效
    if (!pass && selectedCards.length > 0) {
      const { recognizePattern } = await import('../utils/landlordRules')
      const pattern = recognizePattern(selectedCards)
      
      if (pattern.type === 'invalid') {
        console.error('🤖 [AI验证] AI出了无效牌型:', selectedCards.map(c => rankToText(c.rank)).join(' '))
        
        // 智能修正：尝试找到有效的牌型
        const correctedCards = findValidCardPattern(selectedCards, myCards)
        
        if (correctedCards.length > 0) {
          selectedCards = correctedCards
          console.log('🤖 [智能修正] 修正为有效牌型:', selectedCards.map(c => rankToText(c.rank)).join(' '))
          message = '修正出牌！'
        } else {
          // 实在找不到就出单张
          selectedCards = [myCards[0]]
          console.log('🤖 [AI验证] 找不到有效牌型，出单张')
          message = '出牌！'
        }
      } else {
        console.log('🤖 [AI验证] 牌型验证通过:', pattern.type)
      }
    }
    
    const result = { cards: selectedCards, message, pass }
    console.log('🤖 [AI决策] 最终结果:', {
      pass: result.pass,
      cards: result.cards.map(c => rankToText(c.rank)).join(' '),
      message: result.message,
      cardsCount: result.cards.length,
      isValid: !result.pass ? '已验证' : 'N/A'
    })
    
    return result
    
  } catch (error) {
    console.error('AI出牌失败:', error)
    
    // API失败，随机出一张牌
    const fallbackResult = {
      cards: [myCards[0]],
      message: '出牌',
      pass: false
    }
    console.log('🤖 [降级决策] API失败，随机出牌:', {
      pass: fallbackResult.pass,
      cards: fallbackResult.cards.map(c => rankToText(c.rank)).join(' '),
      message: fallbackResult.message,
      cardsCount: fallbackResult.cards.length
    })
    
    return fallbackResult
  }
}

/**
 * 从文本解析牌（例如"3 3 3 5" -> 对应的Card对象）
 */
const parseCardsFromText = (text: string, availableCards: Card[]): Card[] => {
  const tokens = text.split(/\s+/).filter(t => t)
  const result: Card[] = []
  const used = new Set<string>()
  
  for (const token of tokens) {
    const targetRank = textToRank(token)
    if (targetRank === null) continue
    
    // 找到对应的牌
    const card = availableCards.find(c => c.rank === targetRank && !used.has(c.id))
    if (card) {
      result.push(card)
      used.add(card.id)
    }
  }
  
  return result
}

/**
 * 将文本转换为rank
 */
const textToRank = (text: string): number | null => {
  const num = parseInt(text)
  if (!isNaN(num) && num >= 3 && num <= 10) return num
  
  const map: Record<string, number> = {
    'J': 11, 'j': 11,
    'Q': 12, 'q': 12,
    'K': 13, 'k': 13,
    'A': 14, 'a': 14,
    '2': 15,
    '小王': 16, '小': 16,
    '大王': 17, '大': 17
  }
  
  return map[text] ?? null
}

/**
 * 智能修正无效牌型，找到相似的有效牌型
 */
const findValidCardPattern = (invalidCards: Card[], availableCards: Card[]): Card[] => {
  console.log('🤖 [智能修正] 分析无效牌型:', invalidCards.map(c => c.rank))
  
  // 统计各点数的数量
  const rankCounts = new Map<number, Card[]>()
  availableCards.forEach(card => {
    if (!rankCounts.has(card.rank)) {
      rankCounts.set(card.rank, [])
    }
    rankCounts.get(card.rank)!.push(card)
  })
  
  // 策略1：如果AI想出类似9977的牌，尝试修正为连对
  if (invalidCards.length === 4) {
    const ranks = invalidCards.map(c => c.rank).sort((a, b) => a - b)
    const [r1, r2, r3, r4] = ranks
    
    // 如果是两对但不连续，找连续的两对
    if (r1 === r2 && r3 === r4 && r3 !== r1 + 1) {
      console.log('🤖 [修正策略] 检测到非连续双对，寻找连对')
      
      // 寻找连续的对子
      const sortedRanks = Array.from(rankCounts.keys()).sort((a, b) => a - b)
      for (let i = 0; i < sortedRanks.length - 1; i++) {
        const rank1 = sortedRanks[i]
        const rank2 = sortedRanks[i + 1]
        
        if (rank2 === rank1 + 1 && 
            rankCounts.get(rank1)!.length >= 2 && 
            rankCounts.get(rank2)!.length >= 2) {
          
          const result = [
            ...rankCounts.get(rank1)!.slice(0, 2),
            ...rankCounts.get(rank2)!.slice(0, 2)
          ]
          console.log('🤖 [修正结果] 找到连对:', result.map(c => c.rank))
          return result
        }
      }
    }
  }
  
  // 策略2：如果AI想出3张不同的牌，尝试找三张相同的
  if (invalidCards.length === 3) {
    console.log('🤖 [修正策略] 寻找三张相同')
    
    for (const [, cards] of rankCounts) {
      if (cards.length >= 3) {
        const result = cards.slice(0, 3)
        console.log('🤖 [修正结果] 找到三张:', result.map(c => c.rank))
        return result
      }
    }
  }
  
  // 策略3：如果AI想出对子但牌不够，找其他对子
  if (invalidCards.length === 2) {
    console.log('🤖 [修正策略] 寻找对子')
    
    for (const [, cards] of rankCounts) {
      if (cards.length >= 2) {
        const result = cards.slice(0, 2)
        console.log('🤖 [修正结果] 找到对子:', result.map(c => c.rank))
        return result
      }
    }
  }
  
  // 策略4：实在不行就出单张最小的牌
  console.log('🤖 [修正策略] 无法修正，出最小单张')
  return []
}
