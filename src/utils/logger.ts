/**
 * 日志工具 - 统一管理调试输出
 * 支持日志级别、环境控制和彩色输出
 */

import { DEBUG_CONFIG } from '../config/constants'
import { DEV_CONFIG } from '../config/appConfig'

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * 日志工具类
 */
export class Logger {
  // 🔥 强制禁用所有日志输出以防止内存溢出
  private static level: LogLevel = LogLevel.NONE
  
  /**
   * 设置日志级别
   */
  static setLevel(level: LogLevel): void {
    this.level = level
  }
  
  /**
   * 调试日志 (开发环境)
   */
  static debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG && DEV_CONFIG.ENABLE_DEBUG_LOG) {
      console.log(`🔍 [DEBUG] ${message}`, data !== undefined ? data : '')
    }
  }
  
  /**
   * 信息日志
   */
  static log(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(message, data !== undefined ? data : '')
    }
  }
  
  /**
   * 信息日志 (带图标)
   */
  static info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`ℹ️ [INFO] ${message}`, data !== undefined ? data : '')
    }
  }
  
  /**
   * 警告日志
   */
  static warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, data !== undefined ? data : '')
    }
  }
  
  /**
   * 错误日志
   */
  static error(message: string, error?: any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`, error !== undefined ? error : '')
    }
  }
  
  /**
   * 成功日志
   */
  static success(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`✅ ${message}`, data !== undefined ? data : '')
    }
  }
  
  /**
   * API 请求日志
   */
  static api(method: string, url: string, data?: any): void {
    if (!DEBUG_CONFIG.ENABLE_API_LOG || this.level > LogLevel.DEBUG) return
    console.log(`🌐 API ${method}:`, url, data !== undefined ? data : '')
  }
  
  /**
   * Prompt 日志 (折叠显示)
   */
  static prompt(title: string, content: string): void {
    if (!DEBUG_CONFIG.ENABLE_PROMPT_LOG || this.level > LogLevel.DEBUG) return
    console.group(`━━━━━━ ${title} ━━━━━━`)
    console.log(content)
    console.groupEnd()
  }
  
  /**
   * 性能日志
   */
  static performance(label: string, startTime: number): void {
    if (!DEV_CONFIG.ENABLE_PERFORMANCE || this.level > LogLevel.DEBUG) return
    const duration = Date.now() - startTime
    console.log(`⏱️ [PERF] ${label}: ${duration}ms`)
  }
  
  /**
   * 分组日志开始
   */
  static group(label: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.group(label)
    }
  }
  
  /**
   * 分组日志结束
   */
  static groupEnd(): void {
    if (this.level <= LogLevel.DEBUG) {
      console.groupEnd()
    }
  }
  
  /**
   * 表格日志
   */
  static table(data: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.table(data)
    }
  }
}

export default Logger
