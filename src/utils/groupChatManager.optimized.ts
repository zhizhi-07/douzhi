/**
 * 群聊管理器性能优化配置
 */

// 消息缓存配置
export const MESSAGE_CACHE_CONFIG = {
  MAX_MESSAGES_PER_GROUP: 500,     // 每个群聊最多缓存500条消息
  CLEANUP_THRESHOLD: 600,          // 超过600条时触发清理
  CLEANUP_BATCH_SIZE: 100,          // 每次清理100条旧消息
  MEMORY_WARNING_THRESHOLD: 50 * 1024 * 1024,  // 50MB内存警告阈值
}

// 性能优化配置
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,             // 防抖延迟
  THROTTLE_DELAY: 100,             // 节流延迟
  BATCH_UPDATE_DELAY: 16,          // 批量更新延迟（一帧）
  MAX_CONCURRENT_AI_REPLIES: 3,    // 最大并发AI回复数
}

/**
 * 内存使用监控
 */
export class MemoryMonitor {
  private static lastCheck = 0
  private static checkInterval = 5000  // 5秒检查一次
  
  static checkMemoryUsage() {
    const now = Date.now()
    if (now - this.lastCheck < this.checkInterval) return
    
    this.lastCheck = now
    
    // 估算内存使用（简化版）
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize
      const limit = performance.memory.jsHeapSizeLimit
      const percentage = (used / limit) * 100
      
      if (percentage > 80) {
        console.warn('⚠️ 内存使用率过高:', percentage.toFixed(2) + '%')
        // 触发垃圾回收提示
        this.suggestGarbageCollection()
      }
    }
  }
  
  private static suggestGarbageCollection() {
    // 清理过期缓存
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('memory-pressure', {
        detail: { level: 'critical' }
      }))
    }
  }
}

/**
 * 消息缓存清理器
 */
export class MessageCacheCleaner {
  /**
   * 清理过多的消息缓存
   */
  static cleanupCache(messages: any[], groupId: string): any[] {
    if (messages.length <= MESSAGE_CACHE_CONFIG.MAX_MESSAGES_PER_GROUP) {
      return messages
    }
    
    console.log(`🧹 清理群聊 ${groupId} 的消息缓存: ${messages.length} -> ${MESSAGE_CACHE_CONFIG.MAX_MESSAGES_PER_GROUP}`)
    
    // 保留最新的消息
    const cleaned = messages.slice(-MESSAGE_CACHE_CONFIG.MAX_MESSAGES_PER_GROUP)
    
    // 检查内存
    MemoryMonitor.checkMemoryUsage()
    
    return cleaned
  }
  
  /**
   * 智能清理策略：保留重要消息
   */
  static smartCleanup(messages: any[]): any[] {
    if (messages.length <= MESSAGE_CACHE_CONFIG.MAX_MESSAGES_PER_GROUP) {
      return messages
    }
    
    const important = new Set<string>()
    const recent = Date.now() - 24 * 60 * 60 * 1000  // 24小时内
    
    // 标记重要消息
    messages.forEach(msg => {
      // 保留最近24小时的消息
      if (msg.timestamp && msg.timestamp > recent) {
        important.add(msg.id)
      }
      // 保留红包、转账等特殊消息
      if (msg.messageType === 'redPacket' || msg.messageType === 'transfer') {
        important.add(msg.id)
      }
      // 保留被引用的消息
      if (msg.quotedMessage) {
        important.add(msg.quotedMessage.id)
      }
    })
    
    // 过滤消息
    let kept = messages.filter(msg => important.has(msg.id))
    
    // 如果还是太多，保留最新的
    if (kept.length > MESSAGE_CACHE_CONFIG.MAX_MESSAGES_PER_GROUP) {
      kept = kept.slice(-MESSAGE_CACHE_CONFIG.MAX_MESSAGES_PER_GROUP)
    }
    
    return kept
  }
}

/**
 * 防抖和节流工具
 */
export class PerformanceUtils {
  private static debounceTimers = new Map<string, NodeJS.Timeout>()
  private static throttleLastCall = new Map<string, number>()
  
  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY,
    key: string
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existing = this.debounceTimers.get(key)
      if (existing) clearTimeout(existing)
      
      const timer = setTimeout(() => {
        fn(...args)
        this.debounceTimers.delete(key)
      }, delay)
      
      this.debounceTimers.set(key, timer)
    }
  }
  
  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = PERFORMANCE_CONFIG.THROTTLE_DELAY,
    key: string
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const now = Date.now()
      const lastCall = this.throttleLastCall.get(key) || 0
      
      if (now - lastCall >= delay) {
        fn(...args)
        this.throttleLastCall.set(key, now)
      }
    }
  }
}

/**
 * 批量更新管理器
 */
export class BatchUpdateManager {
  private static pending = new Map<string, any[]>()
  private static scheduled = false
  
  /**
   * 添加批量更新
   */
  static addUpdate(groupId: string, update: any) {
    if (!this.pending.has(groupId)) {
      this.pending.set(groupId, [])
    }
    this.pending.get(groupId)!.push(update)
    
    if (!this.scheduled) {
      this.scheduled = true
      requestAnimationFrame(() => this.flush())
    }
  }
  
  /**
   * 执行批量更新
   */
  private static flush() {
    const updates = new Map(this.pending)
    this.pending.clear()
    this.scheduled = false
    
    updates.forEach((updateList, groupId) => {
      // 合并更新
      const merged = this.mergeUpdates(updateList)
      // 触发单次更新事件
      window.dispatchEvent(new CustomEvent('batch-update', {
        detail: { groupId, updates: merged }
      }))
    })
  }
  
  /**
   * 合并更新
   */
  private static mergeUpdates(updates: any[]): any {
    // 简单合并策略，实际可以更复杂
    return updates[updates.length - 1]
  }
}
