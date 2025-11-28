/**
 * 统一的变量替换工具
 * 在人设、世界书、提示词等任何地方都可以使用
 */

import type { Character } from '../types/chat'

export interface VariableContext {
  charName?: string      // 角色名
  userName?: string      // 用户名
  character?: Character | any  // 角色完整信息
  userInfo?: any         // 用户完整信息
}

/**
 * 替换文本中的变量
 * 
 * 支持的变量：
 * - {{char}} / {{角色}} - 角色名
 * - {{user}} / {{用户}} - 用户名
 * - {{time}} - 当前时间 (HH:MM)
 * - {{date}} - 当前日期 (YYYY年M月D日)
 * - {{datetime}} - 完整日期时间
 * - {{weekday}} - 星期几
 * - {{daytime}} - 时间段（早上/中午/下午/晚上/深夜）
 * - {{personality}} / {{description}} - 角色人设
 * - {{scenario}} - 场景设定
 * - {{char_greeting}} - 角色打招呼语
 * - {{user_persona}} - 用户人设
 * - {{user_signature}} - 用户签名
 * - {{random}} - 1-100随机数
 * - {{random:min-max}} - 指定范围随机数
 */
export function replaceVariables(
  content: string,
  context: VariableContext
): string {
  if (!content) return ''
  
  const { charName = '', userName = '用户', character, userInfo } = context
  
  // 获取当前时间信息
  const now = new Date()
  const hour = now.getHours()
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  const datetimeStr = `${dateStr} ${timeStr}`
  const weekday = now.toLocaleDateString('zh-CN', { weekday: 'long' })
  
  // 时间段
  let timePeriod = '白天'
  if (hour >= 6 && hour < 9) timePeriod = '早上'
  else if (hour >= 9 && hour < 12) timePeriod = '上午'
  else if (hour >= 12 && hour < 14) timePeriod = '中午'
  else if (hour >= 14 && hour < 18) timePeriod = '下午'
  else if (hour >= 18 && hour < 22) timePeriod = '晚上'
  else if (hour >= 22 || hour < 6) timePeriod = '深夜'
  
  let result = content
  
  // 基础变量
  result = result
    .replace(/\{\{char\}\}/gi, charName)
    .replace(/\{\{user\}\}/gi, userName)
    .replace(/\{\{角色\}\}/g, charName)
    .replace(/\{\{用户\}\}/g, userName)
  
  // 时间相关变量
  result = result
    .replace(/\{\{time\}\}/gi, timeStr)
    .replace(/\{\{date\}\}/gi, dateStr)
    .replace(/\{\{datetime\}\}/gi, datetimeStr)
    .replace(/\{\{weekday\}\}/gi, weekday)
    .replace(/\{\{daytime\}\}/gi, timePeriod)
    .replace(/\{\{时间\}\}/g, timeStr)
    .replace(/\{\{日期\}\}/g, dateStr)
    .replace(/\{\{星期\}\}/g, weekday)
    .replace(/\{\{时段\}\}/g, timePeriod)
  
  // 随机数变量
  result = result.replace(/\{\{random\}\}/gi, String(Math.floor(Math.random() * 100) + 1))
  result = result.replace(/\{\{random:(\d+)-(\d+)\}\}/gi, (_, min, max) => {
    const minNum = parseInt(min)
    const maxNum = parseInt(max)
    return String(Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum)
  })
  
  // 角色相关变量
  if (character) {
    result = result
      .replace(/\{\{personality\}\}/gi, character.personality || '')
      .replace(/\{\{description\}\}/gi, character.personality || '')
      .replace(/\{\{scenario\}\}/gi, character.scenario || '')
      .replace(/\{\{world\}\}/gi, character.world || '')
      .replace(/\{\{char_version\}\}/gi, character.version || '')
      .replace(/\{\{system\}\}/gi, character.system || '')
      .replace(/\{\{char_greeting\}\}/gi, character.first_mes || character.greeting || '')
      .replace(/\{\{char_signature\}\}/gi, character.signature || '')
  }
  
  // 用户相关变量
  if (userInfo) {
    result = result
      .replace(/\{\{user_persona\}\}/gi, userInfo.persona || '')
      .replace(/\{\{user_signature\}\}/gi, userInfo.signature || '')
      .replace(/\{\{user_nickname\}\}/gi, userInfo.nickname || userName)
      .replace(/\{\{user_realname\}\}/gi, userInfo.realName || userName)
  }
  
  return result
}

/**
 * 简化版：只替换 {{char}} 和 {{user}}
 * 用于简单场景
 */
export function replaceBasicVariables(
  content: string,
  charName: string,
  userName: string
): string {
  if (!content) return ''
  return content
    .replace(/\{\{char\}\}/gi, charName)
    .replace(/\{\{user\}\}/gi, userName)
    .replace(/\{\{角色\}\}/g, charName)
    .replace(/\{\{用户\}\}/g, userName)
}
