/**
 * 情侣空间 - 经期管理工具
 * 存储在 localStorage: 'couple_period_data'
 */

export interface PeriodRecord {
  id: string
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  note?: string
}

export interface PeriodSettings {
  cycleLength: number // 周期长度，默认28天
  duration: number // 经期持续天数，默认5天
}

export interface PeriodData {
  records: PeriodRecord[]
  settings: PeriodSettings
}

const STORAGE_KEY = 'couple_period_data'

const DEFAULT_SETTINGS: PeriodSettings = {
  cycleLength: 28,
  duration: 5
}

// 获取所有数据
export const getPeriodData = (): PeriodData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      return { records: [], settings: DEFAULT_SETTINGS }
    }
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to parse period data', error)
    return { records: [], settings: DEFAULT_SETTINGS }
  }
}

// 保存所有数据
export const savePeriodData = (data: PeriodData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 添加记录
export const addPeriodRecord = (startDate: string, note?: string): PeriodRecord => {
  const data = getPeriodData()
  const newRecord: PeriodRecord = {
    id: Date.now().toString(),
    startDate,
    note
  }
  // 按时间倒序排列
  data.records.push(newRecord)
  data.records.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  
  savePeriodData(data)
  return newRecord
}

// 更新记录（例如设置结束日期）
export const updatePeriodRecord = (id: string, updates: Partial<PeriodRecord>) => {
  const data = getPeriodData()
  const recordIndex = data.records.findIndex(r => r.id === id)
  if (recordIndex !== -1) {
    data.records[recordIndex] = { ...data.records[recordIndex], ...updates }
    savePeriodData(data)
    return true
  }
  return false
}

// 删除记录
export const deletePeriodRecord = (id: string) => {
  const data = getPeriodData()
  data.records = data.records.filter(r => r.id !== id)
  savePeriodData(data)
}

// 更新设置
export const updatePeriodSettings = (settings: Partial<PeriodSettings>) => {
  const data = getPeriodData()
  data.settings = { ...data.settings, ...settings }
  savePeriodData(data)
}

// 预测下一次经期
export const predictNextPeriod = (lastRecord: PeriodRecord, cycleLength: number) => {
  if (!lastRecord) return null
  const lastStart = new Date(lastRecord.startDate)
  const nextStart = new Date(lastStart.getTime() + cycleLength * 24 * 60 * 60 * 1000)
  return nextStart.toISOString().split('T')[0]
}

/**
 * 计算某天的状态
 * @param dateStr YYYY-MM-DD
 * @param data PeriodData
 * @returns 'period' | 'ovulation' | 'fertile' | 'safe' | null
 */
export const getDayStatus = (dateStr: string, data: PeriodData): {
  type: 'period' | 'ovulation' | 'fertile' | 'safe' | null,
  dayIndex?: number // 如果是经期，是第几天
} => {
  const date = new Date(dateStr)
  const dateTime = date.getTime()
  
  // 1. 检查是否在记录的经期内
  for (const record of data.records) {
    const start = new Date(record.startDate)
    const startTime = start.getTime()
    
    // 如果有结束日期，用结束日期判断
    if (record.endDate) {
      const end = new Date(record.endDate)
      if (dateTime >= startTime && dateTime <= end.getTime()) {
        const diffDays = Math.floor((dateTime - startTime) / (24 * 60 * 60 * 1000)) + 1
        return { type: 'period', dayIndex: diffDays }
      }
    } else {
      // 如果没有结束日期，使用设置的持续天数推算
      const duration = data.settings.duration
      const endEstimateTime = startTime + (duration - 1) * 24 * 60 * 60 * 1000
      if (dateTime >= startTime && dateTime <= endEstimateTime) {
         const diffDays = Math.floor((dateTime - startTime) / (24 * 60 * 60 * 1000)) + 1
         return { type: 'period', dayIndex: diffDays }
      }
    }
  }

  // 2. 预测逻辑（基于最近一次经期）
  if (data.records.length > 0) {
    const lastRecord = data.records[0] // 已经是倒序，第一个是最新的
    const lastStart = new Date(lastRecord.startDate)
    
    // 计算输入日期与最近一次经期开始日期的天数差
    const diffTime = dateTime - lastStart.getTime()
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000))
    
    if (diffDays < 0) return { type: null } // 过去的日期不预测

    // 计算当前处于周期的第几天 (0-based)
    const cycleDay = diffDays % data.settings.cycleLength
    
    // 预测经期
    if (cycleDay < data.settings.duration) {
       // 如果距离上次开始时间很久，且刚好落在模运算的经期范围内，说明是预测的经期
       // 只有当日期大于最后一条记录的结束时间时才算预测
       // 这里简单处理：如果不是记录中的经期（上面已经check过），那就是预测的
       return { type: 'period', dayIndex: cycleDay + 1 }
    }

    // 预测排卵日 (下次月经前14天)
    // 周期第X天 = 周期长度 - 14
    const ovulationDay = data.settings.cycleLength - 14
    if (cycleDay === ovulationDay) {
      return { type: 'ovulation' }
    }

    // 预测易孕期 (排卵日前5天 + 排卵日 + 排卵日后4天 = 10天左右，这里简化为 排卵日前5天到后4天)
    if (cycleDay >= ovulationDay - 5 && cycleDay <= ovulationDay + 4) {
      return { type: 'fertile' }
    }
    
    return { type: 'safe' }
  }

  return { type: null }
}
