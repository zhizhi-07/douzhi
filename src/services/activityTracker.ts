/**
 * 用户活跃度追踪服务
 * 记录用户的使用时长和活跃程度
 */

import { supabase } from '../lib/supabase'

const ACTIVITY_KEY = 'user_activity_data'
const REPORT_INTERVAL = 60 * 1000 // 每60秒上报一次
const HEARTBEAT_INTERVAL = 10 * 1000 // 每10秒心跳一次

interface ActivityData {
  totalSeconds: number      // 总使用时长（秒）
  todaySeconds: number      // 今日使用时长
  lastActiveDate: string    // 最后活跃日期 YYYY-MM-DD
  lastReportTime: number    // 上次上报时间戳
  sessionStart: number      // 当前会话开始时间
}

let heartbeatTimer: number | null = null
let reportTimer: number | null = null
let isActive = true
let lastHeartbeat = Date.now()

/**
 * 获取今天的日期字符串
 */
const getTodayStr = (): string => {
  return new Date().toISOString().split('T')[0]
}

/**
 * 获取本地活跃数据
 */
const getLocalData = (): ActivityData => {
  try {
    const saved = localStorage.getItem(ACTIVITY_KEY)
    if (saved) {
      const data = JSON.parse(saved) as ActivityData
      // 如果是新的一天，重置今日时长
      if (data.lastActiveDate !== getTodayStr()) {
        data.todaySeconds = 0
        data.lastActiveDate = getTodayStr()
      }
      return data
    }
  } catch (e) {
    console.error('读取活跃数据失败:', e)
  }
  
  return {
    totalSeconds: 0,
    todaySeconds: 0,
    lastActiveDate: getTodayStr(),
    lastReportTime: 0,
    sessionStart: Date.now()
  }
}

/**
 * 保存本地活跃数据
 */
const saveLocalData = (data: ActivityData) => {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存活跃数据失败:', e)
  }
}

/**
 * 上报活跃数据到服务器
 */
const reportToServer = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const localData = getLocalData()
    
    // 更新到 user_status 表
    const { error } = await supabase
      .from('user_status')
      .update({
        total_active_seconds: localData.totalSeconds,
        today_active_seconds: localData.todaySeconds,
        last_active_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
    
    if (error) {
      console.error('上报活跃数据失败:', error)
    } else {
      localData.lastReportTime = Date.now()
      saveLocalData(localData)
    }
  } catch (e) {
    console.error('上报活跃数据异常:', e)
  }
}

/**
 * 心跳：记录活跃时长
 */
const heartbeat = () => {
  if (!isActive) return
  
  const now = Date.now()
  const elapsed = Math.floor((now - lastHeartbeat) / 1000)
  lastHeartbeat = now
  
  // 如果间隔太长（超过30秒），可能是页面被挂起，不计入
  if (elapsed > 30) return
  
  const data = getLocalData()
  data.totalSeconds += elapsed
  data.todaySeconds += elapsed
  data.lastActiveDate = getTodayStr()
  saveLocalData(data)
}

/**
 * 监听用户活跃状态
 */
const setupVisibilityListener = () => {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isActive = false
      // 页面隐藏时立即上报
      reportToServer()
    } else {
      isActive = true
      lastHeartbeat = Date.now()
    }
  })
  
  // 监听用户操作
  const markActive = () => {
    isActive = true
    lastHeartbeat = Date.now()
  }
  
  document.addEventListener('mousemove', markActive, { passive: true })
  document.addEventListener('keydown', markActive, { passive: true })
  document.addEventListener('touchstart', markActive, { passive: true })
  document.addEventListener('scroll', markActive, { passive: true })
}

/**
 * 启动活跃度追踪
 */
export const startActivityTracker = () => {
  // 初始化会话
  const data = getLocalData()
  data.sessionStart = Date.now()
  saveLocalData(data)
  lastHeartbeat = Date.now()
  
  // 启动心跳
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = window.setInterval(heartbeat, HEARTBEAT_INTERVAL)
  
  // 启动定期上报
  if (reportTimer) clearInterval(reportTimer)
  reportTimer = window.setInterval(reportToServer, REPORT_INTERVAL)
  
  // 监听可见性变化
  setupVisibilityListener()
  
  // 页面关闭时上报
  window.addEventListener('beforeunload', () => {
    heartbeat() // 最后一次心跳
    // 使用 sendBeacon 确保数据发送
    const localData = getLocalData()
    navigator.sendBeacon?.('/api/activity', JSON.stringify(localData))
  })
  
  console.log('📊 活跃度追踪已启动')
}

/**
 * 停止活跃度追踪
 */
export const stopActivityTracker = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (reportTimer) {
    clearInterval(reportTimer)
    reportTimer = null
  }
}

/**
 * 获取当前活跃数据
 */
export const getActivityData = (): ActivityData => {
  return getLocalData()
}

/**
 * 格式化时长显示
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  
  return `${minutes}分钟`
}
