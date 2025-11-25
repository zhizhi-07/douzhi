/**
 * 斗地主规则引擎
 * 负责牌型识别和验证
 */

export interface Card {
  suit: 'spade' | 'heart' | 'diamond' | 'club' | 'joker'
  rank: number // 3-15 (14=A, 15=2), 16=小王, 17=大王
  id: string
}

export type CardPattern = 
  | 'single'        // 单张
  | 'pair'          // 对子
  | 'triple'        // 三张
  | 'triple_single' // 三带一
  | 'triple_pair'   // 三带二
  | 'straight'      // 顺子 (至少5张)
  | 'pair_straight' // 连对 (至少3对)
  | 'triple_straight' // 飞机 (至少2个三张)
  | 'bomb'          // 炸弹
  | 'joker_bomb'    // 王炸
  | 'invalid'       // 无效牌型

export interface PatternInfo {
  type: CardPattern
  value: number // 主要牌的点数
  length: number // 连牌的长度
}

/**
 * 排序牌（从大到小）
 */
export const sortCards = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => b.rank - a.rank)
}

/**
 * 统计牌的数量
 */
const countRanks = (cards: Card[]): Map<number, number> => {
  const counts = new Map<number, number>()
  cards.forEach(card => {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1)
  })
  return counts
}

/**
 * 识别牌型
 */
export const recognizePattern = (cards: Card[]): PatternInfo => {
  if (cards.length === 0) return { type: 'invalid', value: 0, length: 0 }
  
  const sorted = sortCards(cards)
  const counts = countRanks(sorted)
  const uniqueRanks = Array.from(counts.keys()).sort((a, b) => b - a)
  
  // 单张
  if (cards.length === 1) {
    return { type: 'single', value: cards[0].rank, length: 1 }
  }
  
  // 对子
  if (cards.length === 2 && counts.get(sorted[0].rank) === 2) {
    return { type: 'pair', value: sorted[0].rank, length: 1 }
  }
  
  // 王炸
  if (cards.length === 2 && sorted[0].rank === 17 && sorted[1].rank === 16) {
    return { type: 'joker_bomb', value: 17, length: 1 }
  }
  
  // 三张
  if (cards.length === 3 && counts.get(sorted[0].rank) === 3) {
    return { type: 'triple', value: sorted[0].rank, length: 1 }
  }
  
  // 三带一
  if (cards.length === 4 && uniqueRanks.length === 2) {
    const triple = uniqueRanks.find(r => counts.get(r) === 3)
    if (triple) {
      return { type: 'triple_single', value: triple, length: 1 }
    }
  }
  
  // 三带二
  if (cards.length === 5 && uniqueRanks.length === 2) {
    const triple = uniqueRanks.find(r => counts.get(r) === 3)
    const pair = uniqueRanks.find(r => counts.get(r) === 2)
    if (triple && pair) {
      return { type: 'triple_pair', value: triple, length: 1 }
    }
  }
  
  // 炸弹
  if (cards.length === 4 && counts.get(sorted[0].rank) === 4) {
    return { type: 'bomb', value: sorted[0].rank, length: 1 }
  }
  
  // 顺子（至少5张，不能包含2和王）
  if (cards.length >= 5 && uniqueRanks.length === cards.length) {
    const maxRank = Math.max(...uniqueRanks)
    if (maxRank <= 14) { // 不能包含2(15)和王(16,17)
      const isConsecutive = uniqueRanks.every((rank, i) => {
        return i === 0 || uniqueRanks[i - 1] - rank === 1
      })
      if (isConsecutive) {
        return { type: 'straight', value: maxRank, length: cards.length }
      }
    }
  }
  
  // 连对（至少3对）
  if (cards.length >= 6 && cards.length % 2 === 0 && uniqueRanks.length === cards.length / 2) {
    const allPairs = uniqueRanks.every(r => counts.get(r) === 2)
    const maxRank = Math.max(...uniqueRanks)
    if (allPairs && maxRank <= 14) {
      const isConsecutive = uniqueRanks.every((rank, i) => {
        return i === 0 || uniqueRanks[i - 1] - rank === 1
      })
      if (isConsecutive) {
        return { type: 'pair_straight', value: maxRank, length: uniqueRanks.length }
      }
    }
  }
  
  // 飞机（至少2个三张，可带牌）
  const triples = uniqueRanks.filter(r => counts.get(r) === 3)
  if (triples.length >= 2) {
    const maxTriple = Math.max(...triples)
    if (maxTriple <= 14) {
      const isConsecutive = triples.every((rank, i) => {
        return i === 0 || triples[i - 1] - rank === 1
      })
      if (isConsecutive) {
        const expectedLength = triples.length * 3
        // 飞机不带、飞机带单、飞机带对
        if (cards.length === expectedLength || 
            cards.length === expectedLength + triples.length ||
            cards.length === expectedLength + triples.length * 2) {
          return { type: 'triple_straight', value: maxTriple, length: triples.length }
        }
      }
    }
  }
  
  return { type: 'invalid', value: 0, length: 0 }
}

/**
 * 判断牌型A是否能压过牌型B
 */
export const canBeat = (cardsA: Card[], cardsB: Card[]): boolean => {
  const patternA = recognizePattern(cardsA)
  const patternB = recognizePattern(cardsB)
  
  // 无效牌型不能出
  if (patternA.type === 'invalid') return false
  
  // 首轮出牌（没有上家牌）
  if (cardsB.length === 0) return true // 已经检查过invalid了
  
  // 王炸最大
  if (patternA.type === 'joker_bomb') return true
  
  // 炸弹可以压任何非炸弹牌型
  if (patternA.type === 'bomb' && patternB.type !== 'bomb' && patternB.type !== 'joker_bomb') {
    return true
  }
  
  // 炸弹之间比大小
  if (patternA.type === 'bomb' && patternB.type === 'bomb') {
    return patternA.value > patternB.value
  }
  
  // 同类型牌型比较
  if (patternA.type === patternB.type && patternA.length === patternB.length) {
    return patternA.value > patternB.value
  }
  
  return false
}

/**
 * 获取牌型的友好名称
 */
export const getPatternName = (pattern: PatternInfo | null): string => {
  if (!pattern || pattern.type === 'invalid') return '无效牌型'
  const names: Record<CardPattern, string> = {
    'single': '单张',
    'pair': '对子',
    'triple': '三张',
    'triple_single': '三带一',
    'triple_pair': '三带二',
    'straight': '顺子',
    'pair_straight': '连对',
    'triple_straight': '飞机',
    'bomb': '炸弹',
    'joker_bomb': '王炸',
    'invalid': '无效牌型'
  }
  return names[pattern.type]
}

/**
 * 将rank转换为显示文本
 */
export const rankToText = (rank: number): string => {
  if (rank <= 10) return rank.toString()
  const map: Record<number, string> = {
    11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: '小王', 17: '大王'
  }
  return map[rank] || ''
}
