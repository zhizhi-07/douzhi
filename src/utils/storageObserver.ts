// 简化版 storageObserver
type Callback = (value: string | null) => void

class StorageObserver {
  private observers: Map<string, Set<Callback>> = new Map()

  observe(key: string, callback: Callback): () => void {
    if (!this.observers.has(key)) {
      this.observers.set(key, new Set())
    }
    this.observers.get(key)!.add(callback)

    // 返回取消订阅函数
    return () => {
      const callbacks = this.observers.get(key)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  notify(key: string, value: string | null) {
    const callbacks = this.observers.get(key)
    if (callbacks) {
      callbacks.forEach(callback => callback(value))
    }
  }
}

export const storageObserver = new StorageObserver()
