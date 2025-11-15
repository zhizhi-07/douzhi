/**
 * AI备忘录管理器
 * AI可以记录自己觉得重要的事情
 */

export interface AIMemo {
  id: string
  characterId: string
  characterName: string
  content: string
  timestamp: number
  date: string // YYYY-MM-DD格式
  time: string // HH:MM格式
}

/**
 * 获取存储键
 */
const getStorageKey = (characterId: string): string => {
  return `ai_memos_${characterId}`
}

/**
 * 添加备忘录
 */
export const addAIMemo = (
  characterId: string,
  characterName: string,
  content: string
): AIMemo => {
  const now = new Date()
  const timestamp = now.getTime()
  
  const memo: AIMemo = {
    id: `memo_${timestamp}_${Math.random()}`,
    characterId,
    characterName,
    content,
    timestamp,
    date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
    time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 获取现有备忘录
  const memos = getAllMemos(characterId)

  // 简单去重：如果最近一条随笔内容完全相同且在5分钟内，认为是重复记录，直接复用上一条
  const lastMemo = memos[memos.length - 1]
  const FIVE_MINUTES = 5 * 60 * 1000
  if (
    lastMemo &&
    lastMemo.content === content &&
    typeof lastMemo.timestamp === 'number' &&
    timestamp - lastMemo.timestamp < FIVE_MINUTES
  ) {
    console.log('📝 检测到5分钟内的重复随笔，跳过新增:', content)
    return lastMemo
  }

  memos.push(memo)
  
  // 保存
  const key = getStorageKey(characterId)
  localStorage.setItem(key, JSON.stringify(memos))
  
  console.log('📝 AI添加备忘录:', memo)
  return memo
}

/**
 * 获取所有备忘录
 */
export const getAllMemos = (characterId: string): AIMemo[] => {
  const key = getStorageKey(characterId)
  const data = localStorage.getItem(key)
  
  if (!data) return []
  
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

/**
 * 按日期分组获取备忘录
 */
export const getMemosByDate = (characterId: string): Map<string, AIMemo[]> => {
  const memos = getAllMemos(characterId)
  const grouped = new Map<string, AIMemo[]>()
  
  memos.forEach(memo => {
    const date = memo.date
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(memo)
  })
  
  // 按日期排序（最新的在前）
  const sortedMap = new Map(
    Array.from(grouped.entries()).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime()
    })
  )
  
  return sortedMap
}

/**
 * 获取指定日期的备忘录
 */
export const getMemosForDate = (characterId: string, date: string): AIMemo[] => {
  const grouped = getMemosByDate(characterId)
  return grouped.get(date) || []
}

/**
 * 获取所有日期列表（降序）
 */
export const getAllDates = (characterId: string): string[] => {
  const grouped = getMemosByDate(characterId)
  return Array.from(grouped.keys())
}

/**
 * 删除备忘录
 */
export const deleteAIMemo = (characterId: string, memoId: string): void => {
  const memos = getAllMemos(characterId)
  const filtered = memos.filter(m => m.id !== memoId)
  
  const key = getStorageKey(characterId)
  localStorage.setItem(key, JSON.stringify(filtered))
  
  console.log('🗑️ 删除AI备忘录:', memoId)
}

/**
 * 清空所有备忘录
 */
export const clearAllMemos = (characterId: string): void => {
  const key = getStorageKey(characterId)
  localStorage.removeItem(key)
  console.log('🗑️ 清空AI备忘录:', characterId)
}

/**
 * 获取备忘录统计
 */
export const getMemoStats = (characterId: string): {
  total: number
  dates: number
  latest: AIMemo | null
} => {
  const memos = getAllMemos(characterId)
  const dates = getAllDates(characterId)
  
  return {
    total: memos.length,
    dates: dates.length,
    latest: memos.length > 0 ? memos[memos.length - 1] : null
  }
}
