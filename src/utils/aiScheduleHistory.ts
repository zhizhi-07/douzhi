/**
 * AI行程历史记录系统
 * 基于真实状态变更记录生成行程轨迹
 */

export interface ScheduleItem {
  id: string
  time: string
  title: string
  description: string
  type: 'past' | 'current' | 'future'
  isReal: boolean  // 是否为真实状态记录
}

interface StatusRecord {
  time: string      // '09:30'
  action: string    // '在图书馆自习'
  timestamp: number
}

interface DailySchedule {
  [date: string]: StatusRecord[]  // '2025-01-15': [...]
}

const SCHEDULE_HISTORY_KEY = 'ai_schedule_history_'

/**
 * 保存状态更新到行程历史
 */
export function saveStatusToSchedule(characterId: string, action: string): void {
  try {
    const today = new Date().toISOString().split('T')[0]
    const time = new Date().toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    const key = SCHEDULE_HISTORY_KEY + characterId
    const history: DailySchedule = JSON.parse(localStorage.getItem(key) || '{}')
    
    if (!history[today]) {
      history[today] = []
    }
    
    // 检查是否重复（5分钟内相同状态不重复记录）
    const lastRecord = history[today][history[today].length - 1]
    if (lastRecord && 
        lastRecord.action === action && 
        Date.now() - lastRecord.timestamp < 5 * 60 * 1000) {
      return
    }
    
    history[today].push({
      time,
      action,
      timestamp: Date.now()
    })
    
    // 只保留最近7天的记录
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
    
    Object.keys(history).forEach(date => {
      if (date < cutoffDateStr) {
        delete history[date]
      }
    })
    
    localStorage.setItem(key, JSON.stringify(history))
    console.log('📅 [行程记录] 状态已记录:', { time, action })
  } catch (error) {
    console.error('保存行程历史失败:', error)
  }
}

/**
 * 获取指定日期的行程历史
 */
export function getScheduleHistory(characterId: string, date?: string): StatusRecord[] {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const key = SCHEDULE_HISTORY_KEY + characterId
    const history: DailySchedule = JSON.parse(localStorage.getItem(key) || '{}')
    
    return history[targetDate] || []
  } catch (error) {
    console.error('获取行程历史失败:', error)
    return []
  }
}

/**
 * 获取今天的完整行程（真实记录 + 智能补全）
 */
export function getTodaySchedule(characterId: string): ScheduleItem[] {
  const realRecords = getScheduleHistory(characterId)
  const currentHour = new Date().getHours()
  
  // 将真实记录转换为 ScheduleItem 格式
  const realItems: ScheduleItem[] = realRecords.map((record, index) => {
    const recordTime = new Date(record.timestamp)
    const recordHour = recordTime.getHours()
    
    let type: 'past' | 'current' | 'future'
    if (recordHour < currentHour) {
      type = 'past'
    } else if (recordHour === currentHour) {
      type = 'current'
    } else {
      type = 'future'
    }
    
    return {
      id: `real_${index}`,
      time: record.time,
      title: record.action,
      description: `真实记录于 ${record.time}`,
      type,
      isReal: true
    }
  })
  
  // 如果没有真实记录，生成默认行程
  if (realItems.length === 0) {
    return generateDefaultSchedule(currentHour)
  }
  
  return realItems
}

/**
 * 生成默认行程（当没有真实记录时）
 */
function generateDefaultSchedule(currentHour: number): ScheduleItem[] {
  const defaultItems = [
    {
      time: '07:30',
      title: '晨间苏醒',
      description: '在晨光中醒来，整理思绪，准备新的一天。'
    },
    {
      time: '09:00', 
      title: '晨间时光',
      description: '翻开一本书，在文字间寻找灵感与宁静。'
    },
    {
      time: '11:30',
      title: '上午活动', 
      description: '在附近的小路上散步，感受微风与阳光。'
    },
    {
      time: '14:00',
      title: '午后时光',
      description: '泡一杯茶，听着轻音乐，享受慵懒的午后。'
    },
    {
      time: '16:30',
      title: '下午茶',
      description: '准备点心，翻阅相册，回忆美好时光。'
    },
    {
      time: '19:00',
      title: '晚间思绪', 
      description: '整理今天的想法，写下一些零散的文字。'
    },
    {
      time: '22:00',
      title: '夜晚',
      description: '在星光下准备休息，期待明天的相遇。'
    }
  ]
  
  return defaultItems.map((item, index) => {
    const hour = parseInt(item.time.split(':')[0])
    let type: 'past' | 'current' | 'future'
    
    if (hour < currentHour) {
      type = 'past'
    } else if (hour === currentHour || (hour === currentHour + 1 && new Date().getMinutes() > 30)) {
      type = 'current'
    } else {
      type = 'future'
    }
    
    return {
      id: `default_${index}`,
      time: item.time,
      title: item.title,
      description: item.description,
      type,
      isReal: false
    }
  })
}
