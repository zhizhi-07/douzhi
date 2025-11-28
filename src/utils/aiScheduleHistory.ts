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
    
    // 检查是否重复（10分钟内相似内容不重复记录）
    const lastRecord = history[today][history[today].length - 1]
    if (lastRecord && Date.now() - lastRecord.timestamp < 10 * 60 * 1000) {
      // 检查相似度：提取关键词对比
      const getKeywords = (text: string) => {
        // 移除常见词，只保留关键词
        const stopWords = ['的', '了', '在', '上', '着', '是', '有', '和', '就', '都', '也', '很', '把', '被', '给', '跟', '让', '向', '从', '到', '为', '以', '于', '对', '等', '这', '那', '什么', '怎么', '一', '不', '没', '只', '还', '又', '再', '已', '正', '刚', '才']
        return text.split('').filter(char => 
          /[\u4e00-\u9fa5]/.test(char) && !stopWords.includes(char)
        ).join('')
      }
      
      const lastKeywords = getKeywords(lastRecord.action)
      const newKeywords = getKeywords(action)
      
      // 计算重叠率
      const overlap = [...lastKeywords].filter(char => newKeywords.includes(char)).length
      const similarity = overlap / Math.max(lastKeywords.length, newKeywords.length, 1)
      
      // 相似度超过50%就认为是重复
      if (similarity > 0.5) {
        console.log('📅 [行程记录] 跳过相似内容:', { last: lastRecord.action, new: action, similarity: (similarity * 100).toFixed(0) + '%' })
        return
      }
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
  
  // 只返回真实记录，不再生成默认行程
  return realItems
}

/**
 * 🔥 获取AI当前的行程状态（用于聊天提示词）
 * 返回一句话描述"TA现在在干嘛"
 */
export function getCurrentScheduleStatus(characterId: string): {
  summary: string      // 一句话描述当前状态
  activity: string     // 当前活动
  timeSlot: string     // 时间段
  isDefault: boolean   // 是否是默认生成的
} | null {
  const schedule = getTodaySchedule(characterId)
  if (schedule.length === 0) return null
  
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTotalMinutes = currentHour * 60 + currentMinute
  
  // 把行程按时间排序
  const sortedSchedule = [...schedule].sort((a, b) => {
    const [aH, aM] = a.time.split(':').map(Number)
    const [bH, bM] = b.time.split(':').map(Number)
    return (aH * 60 + aM) - (bH * 60 + bM)
  })
  
  // 找当前时间对应的行程段
  let currentItem: ScheduleItem | null = null
  let nextItem: ScheduleItem | null = null
  
  for (let i = 0; i < sortedSchedule.length; i++) {
    const item = sortedSchedule[i]
    const [h, m] = item.time.split(':').map(Number)
    const itemMinutes = h * 60 + m
    
    if (itemMinutes <= currentTotalMinutes) {
      currentItem = item
      nextItem = sortedSchedule[i + 1] || null
    }
  }
  
  // 如果当前时间在第一个行程之前
  if (!currentItem && sortedSchedule.length > 0) {
    const first = sortedSchedule[0]
    return {
      summary: `还没到${first.time}的"${first.title}"，大概还在睡觉或刚醒`,
      activity: '睡觉/刚醒',
      timeSlot: `${first.time}之前`,
      isDefault: true
    }
  }
  
  if (!currentItem) return null
  
  // 构建描述
  const timeOfDay = currentHour < 6 ? '凌晨' :
                    currentHour < 9 ? '早上' :
                    currentHour < 12 ? '上午' :
                    currentHour < 14 ? '中午' :
                    currentHour < 18 ? '下午' :
                    currentHour < 22 ? '晚上' : '深夜'
  
  let summary = `${timeOfDay}${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}，`
  
  if (currentItem.isReal) {
    summary += `正在"${currentItem.title}"`
  } else {
    summary += `按日常习惯应该在"${currentItem.title}"`
  }
  
  // 如果有下一个行程，可以提一下
  if (nextItem) {
    summary += `，${nextItem.time}之后会去"${nextItem.title}"`
  }
  
  return {
    summary,
    activity: currentItem.title,
    timeSlot: currentItem.time,
    isDefault: !currentItem.isReal
  }
}

