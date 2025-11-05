/**
 * 统一错误处理器
 * 提供一致的错误处理和用户友好的错误提示
 */

import { ChatApiError } from './chatApi'
import { API_ERROR_MESSAGES } from '../constants/systemMessages'
import Logger from './logger'

/**
 * 网络错误类
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * 钱包错误类
 */
export class WalletError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'WalletError'
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  /**
   * 处理错误并返回用户友好的消息
   */
  static handle(error: unknown, context: string = '操作'): string {
    Logger.error(`[${context}] 错误`, error)
    
    // ChatAPI 错误
    if (error instanceof ChatApiError) {
      return this.handleChatApiError(error)
    }
    
    // 网络错误
    if (error instanceof NetworkError) {
      return API_ERROR_MESSAGES.NETWORK_ERROR
    }
    
    // 验证错误
    if (error instanceof ValidationError) {
      return error.message
    }
    
    // 钱包错误
    if (error instanceof WalletError) {
      return this.handleWalletError(error)
    }
    
    // 标准 Error
    if (error instanceof Error) {
      return this.handleStandardError(error, context)
    }
    
    // 未知错误
    return API_ERROR_MESSAGES.GENERIC_ERROR
  }
  
  /**
   * 处理 ChatAPI 错误
   */
  private static handleChatApiError(error: ChatApiError): string {
    const ERROR_MAP: Record<string, string> = {
      'NO_API_CONFIG': API_ERROR_MESSAGES.NO_CONFIG,
      'INVALID_API_KEY': API_ERROR_MESSAGES.INVALID_KEY,
      'RATE_LIMIT': API_ERROR_MESSAGES.RATE_LIMIT,
      'NETWORK_ERROR': API_ERROR_MESSAGES.NETWORK_ERROR,
    }
    
    return ERROR_MAP[error.code] || error.message || API_ERROR_MESSAGES.AI_REPLY_FAILED
  }
  
  /**
   * 处理钱包错误
   */
  private static handleWalletError(error: WalletError): string {
    const ERROR_MAP: Record<string, string> = {
      'INSUFFICIENT_BALANCE': '余额不足',
      'INSUFFICIENT_INTIMATE_PAY': '亲密付额度不足',
      'INVALID_AMOUNT': '无效的金额',
      'TRANSACTION_FAILED': '交易失败',
    }
    
    return error.code && ERROR_MAP[error.code] 
      ? ERROR_MAP[error.code] 
      : error.message || '钱包操作失败'
  }
  
  /**
   * 处理标准 Error
   */
  private static handleStandardError(error: Error, context: string): string {
    // 特定错误类型处理
    if (error.message.includes('fetch')) {
      return API_ERROR_MESSAGES.NETWORK_ERROR
    }
    
    if (error.message.includes('timeout')) {
      return '操作超时，请重试'
    }
    
    // 开发环境显示详细错误
    if (import.meta.env.MODE === 'development') {
      return `${context}失败: ${error.message}`
    }
    
    // 生产环境显示通用错误
    return `${context}失败，请稍后重试`
  }
  
  /**
   * 异步错误处理包装器
   */
  static async handleAsync<T>(
    promise: Promise<T>,
    context: string = '操作'
  ): Promise<{ data?: T; error?: string }> {
    try {
      const data = await promise
      return { data }
    } catch (error) {
      const errorMessage = this.handle(error, context)
      return { error: errorMessage }
    }
  }
  
  /**
   * 同步错误处理包装器
   */
  static handleSync<T>(
    fn: () => T,
    context: string = '操作'
  ): { data?: T; error?: string } {
    try {
      const data = fn()
      return { data }
    } catch (error) {
      const errorMessage = this.handle(error, context)
      return { error: errorMessage }
    }
  }
}

/**
 * 便捷函数：处理异步操作
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  context?: string
): Promise<{ data?: T; error?: string }> {
  return ErrorHandler.handleAsync(promise, context)
}

/**
 * 便捷函数：处理同步操作
 */
export function safeSync<T>(
  fn: () => T,
  context?: string
): { data?: T; error?: string } {
  return ErrorHandler.handleSync(fn, context)
}

export default ErrorHandler
