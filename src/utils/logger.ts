/**
 * 日志工具 - 统一管理调试输出
 */

import { DEBUG_CONFIG } from '../config/constants'

export class Logger {
  static prompt(title: string, content: string): void {
    if (!DEBUG_CONFIG.ENABLE_PROMPT_LOG) return
    console.group(`━━━━━━ ${title} ━━━━━━`)
    console.log(content)
    console.groupEnd()
  }

  static api(method: string, url: string, data?: any): void {
    if (!DEBUG_CONFIG.ENABLE_API_LOG) return
    console.log(`🌐 API ${method}:`, url, data)
  }

  static error(message: string, error?: any): void {
    console.error(`❌ ${message}`, error)
  }
}
