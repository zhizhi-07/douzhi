/**
 * 性能优化工具
 * 🔥 减少不必要的对象创建和重新渲染
 */

/**
 * 防抖函数 - 减少频繁调用
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数 - 限制调用频率
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 批量更新 - 合并多个状态更新
 */
export class BatchUpdater<T> {
  private updates: Partial<T>[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private callback: (updates: Partial<T>) => void
  private delay: number

  constructor(callback: (updates: Partial<T>) => void, delay: number = 16) {
    this.callback = callback
    this.delay = delay
  }

  add(update: Partial<T>) {
    this.updates.push(update)
    this.schedule()
  }

  private schedule() {
    if (this.timer !== null) return
    
    this.timer = setTimeout(() => {
      const merged = Object.assign({}, ...this.updates)
      this.callback(merged)
      this.updates = []
      this.timer = null
    }, this.delay)
  }

  flush() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
      if (this.updates.length > 0) {
        const merged = Object.assign({}, ...this.updates)
        this.callback(merged)
        this.updates = []
      }
    }
  }
}

/**
 * 内存缓存 - 避免重复计算
 */
export class MemoCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    return this.cache.get(key)
  }

  set(key: K, value: V) {
    if (this.cache.size >= this.maxSize) {
      // 移除最旧的条目
      const firstKey = this.cache.keys().next().value as K
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear() {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * 请求去重 - 避免重复的API请求
 */
export class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>()

  async execute<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // 如果已有相同的请求在进行，直接返回
    if (this.pending.has(key)) {
      return this.pending.get(key)!
    }

    // 创建新请求
    const promise = fn().finally(() => {
      this.pending.delete(key)
    })

    this.pending.set(key, promise)
    return promise
  }

  clear() {
    this.pending.clear()
  }
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>()

  mark(name: string) {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark)
    if (!startTime) {
      console.warn(`Mark "${startMark}" not found`)
      return 0
    }

    const duration = performance.now() - startTime
    console.log(`⏱️ [${name}] ${duration.toFixed(2)}ms`)
    return duration
  }

  clear() {
    this.marks.clear()
  }
}

/**
 * 图片懒加载优化
 */
export function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
          }
        }
      })
    })

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }
}

/**
 * 虚拟滚动优化 - 只渲染可见区域
 */
export class VirtualScroller {
  private container: HTMLElement
  private items: HTMLElement[] = []
  private itemHeight: number
  private visibleStart: number = 0
  private visibleEnd: number = 0

  constructor(container: HTMLElement, itemHeight: number) {
    this.container = container
    this.itemHeight = itemHeight
    this.updateVisibleRange()
    this.container.addEventListener('scroll', () => this.updateVisibleRange())
  }

  private updateVisibleRange() {
    const { scrollTop, clientHeight } = this.container
    this.visibleStart = Math.floor(scrollTop / this.itemHeight)
    this.visibleEnd = Math.ceil((scrollTop + clientHeight) / this.itemHeight)
  }

  getVisibleRange() {
    return { start: this.visibleStart, end: this.visibleEnd }
  }

  setItems(items: HTMLElement[]) {
    this.items = items
  }

  getVisibleItems() {
    return this.items.slice(this.visibleStart, this.visibleEnd)
  }
}

/**
 * 全局性能优化初始化
 */
export function initializePerformanceOptimizations() {
  // 1. 启用被动事件监听
  if (typeof window !== 'undefined') {
    let passiveSupported = false
    try {
      const options = {
        get passive() {
          passiveSupported = true
          return false
        }
      } as EventListenerOptions
      window.addEventListener('test' as any, () => {}, options)
      window.removeEventListener('test' as any, () => {}, options)
    } catch (err) {
      passiveSupported = false
    }

    if (passiveSupported) {
      console.log('✅ 被动事件监听已启用')
    }
  }

  // 2. 启用图片懒加载
  setupLazyLoading()

  // 3. 监控长任务
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(`⚠️ 长任务检测: ${entry.duration.toFixed(2)}ms`)
        }
      })
      observer.observe({ entryTypes: ['longtask'] })
    } catch (e) {
      // 浏览器不支持longtask
    }
  }

  console.log('✅ 性能优化初始化完成')
}
