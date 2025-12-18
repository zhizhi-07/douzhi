/**
 * 情侣打卡功能工具函数
 */

import { saveToIndexedDB, getFromIndexedDB } from './unifiedStorage'

export interface CheckInRecord {
  id: string
  date: string // YYYY-MM-DD
  timestamp: number
  mood?: string
  content?: string // 打卡备注
  fortuneId?: string // 抽到的运势/任务ID
  customFortuneContent?: string
  customFortuneType?: 'fortune' | 'task'
}

export interface CheckInStats {
  totalDays: number
  currentStreak: number
  lastCheckInDate?: string
}

const STORAGE_KEY = 'couple_check_ins'

// 每日运势/任务库
export const DAILY_TASKS = [
  { id: '1', content: '给对方一个长达10秒的拥抱', type: 'task' },
  { id: '2', content: '对视一分钟，不许笑', type: 'task' },
  { id: '3', content: '用另一种语言说"我爱你"', type: 'task' },
  { id: '4', content: '分享一件今天发生的趣事', type: 'task' },
  { id: '5', content: '给对方按摩肩膀5分钟', type: 'task' },
  { id: '6', content: '一起听一首情歌', type: 'task' },
  { id: '7', content: '夸赞对方的一个优点', type: 'task' },
  { id: '8', content: '拍一张搞怪合照', type: 'task' },
  { id: '9', content: '为对方倒一杯水', type: 'task' },
  { id: '10', content: '摸摸头', type: 'task' },
  { id: '11', content: '宜：想念', type: 'fortune' },
  { id: '12', content: '宜：约会', type: 'fortune' },
  { id: '13', content: '大吉：今天适合表白', type: 'fortune' },
  { id: '14', content: '今日关键词：温柔', type: 'fortune' },
  { id: '15', content: '今日关键词：信任', type: 'fortune' }
]

/**
 * 获取所有打卡记录
 */
export const getCheckIns = async (): Promise<CheckInRecord[]> => {
  const records = await getFromIndexedDB('SETTINGS', STORAGE_KEY)
  return records || []
}

/**
 * 获取今日是否已打卡
 */
export const hasCheckedInToday = async (): Promise<boolean> => {
  const records = await getCheckIns()
  const today = new Date().toISOString().split('T')[0]
  return records.some(r => r.date === today)
}

/**
 * 执行打卡
 */
export const doCheckIn = async (mood?: string, content?: string, customFortune?: { content: string, type: 'fortune' | 'task' }): Promise<{ record: CheckInRecord, stats: CheckInStats }> => {
  const records = await getCheckIns()
  const today = new Date().toISOString().split('T')[0]
  
  if (records.some(r => r.date === today)) {
    throw new Error('今天已经打过卡啦')
  }

  let fortuneId: string

  if (customFortune) {
    fortuneId = `ai_${Date.now()}`
    // Store the custom fortune in the global list temporarily or just rely on the record having the ID
    // We might need to store the content in the record itself if it's dynamic
  } else {
    // 随机抽取一个任务
    const randomTask = DAILY_TASKS[Math.floor(Math.random() * DAILY_TASKS.length)]
    fortuneId = randomTask.id
  }

  const newRecord: CheckInRecord = {
    id: Date.now().toString(),
    date: today,
    timestamp: Date.now(),
    mood,
    content,
    fortuneId,
    // Add a field to store custom fortune content directly in the record if needed
    customFortuneContent: customFortune ? customFortune.content : undefined,
    customFortuneType: customFortune ? customFortune.type : undefined
  }

  const updatedRecords = [...records, newRecord]
  
  // 保存到存储
  await saveToIndexedDB('SETTINGS', STORAGE_KEY, updatedRecords)

  // 计算统计数据
  const stats = calculateStats(updatedRecords)
  
  return { record: newRecord, stats }
}

/**
 * 计算统计数据（连续打卡等）
 */
export const getCheckInStats = async (): Promise<CheckInStats> => {
  const records = await getCheckIns()
  return calculateStats(records)
}

function calculateStats(records: CheckInRecord[]): CheckInStats {
  if (records.length === 0) {
    return { totalDays: 0, currentStreak: 0 }
  }

  // 按日期排序（降序）
  const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp)
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  const lastDate = sorted[0].date
  
  // 如果最后一次打卡不是今天也不是昨天，连签中断
  if (lastDate !== today && lastDate !== yesterday) {
    return {
      totalDays: records.length,
      currentStreak: 0,
      lastCheckInDate: lastDate
    }
  }

  let streak = 1
  let currentDate = new Date(lastDate)

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(currentDate.getTime() - 86400000).toISOString().split('T')[0]
    // 查找前一天是否有记录
    const hasPrev = sorted.some(r => r.date === prevDate)
    
    if (hasPrev) {
      streak++
      currentDate = new Date(prevDate)
    } else {
      break
    }
  }

  return {
    totalDays: records.length,
    currentStreak: streak,
    lastCheckInDate: lastDate
  }
}

/**
 * 获取指定月份的打卡记录
 */
export const getMonthCheckIns = async (year: number, month: number): Promise<CheckInRecord[]> => {
  const records = await getCheckIns()
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`
  return records.filter(r => r.date.startsWith(monthStr))
}
