/**
 * IndexedDB 统一管理器
 * 替代 localStorage，提供更大的存储空间（几百MB到GB）
 */

const DB_NAME = 'DouzhiDB'
const DB_VERSION = 4  // 新增私聊stores

// 所有数据存储的stores
const STORES = {
  MESSAGES: 'messages',        // 聊天消息
  MOMENTS: 'moments',          // 朋友圈
  CHARACTERS: 'characters',    // 角色数据
  USER_INFO: 'userInfo',       // 用户信息
  WALLET: 'wallet',            // 钱包数据
  EMOJIS: 'emojis',           // 表情包
  SETTINGS: 'settings',        // 各种设置（壁纸、未读等）
  MISC: 'misc',                // 其他杂项数据
  DM_MESSAGES: 'dmMessages',   // 论坛私聊消息
  DM_CONVERSATIONS: 'dmConversations'  // 论坛私聊会话
}

let dbInstance: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null  // 🔥 缓存 Promise，避免重复初始化
let initRetryCount = 0
const MAX_RETRY = 3

/**
 * 关闭现有数据库连接
 */
function closeDB() {
  if (dbInstance) {
    try {
      dbInstance.close()
    } catch (e) {
      // 忽略关闭错误
    }
    dbInstance = null
  }
  dbPromise = null
}

/**
 * 初始化数据库
 * 🔥 使用单例 Promise，避免并发初始化导致超时
 */
function initDB(): Promise<IDBDatabase> {
  // 🔥 如果已有连接且连接有效，直接返回
  if (dbInstance) {
    // 检查连接是否仍然有效
    try {
      // 尝试访问objectStoreNames来验证连接
      if (dbInstance.objectStoreNames.length >= 0) {
        return Promise.resolve(dbInstance)
      }
    } catch (e) {
      // 连接已失效，清理并重新初始化
      console.warn('⚠️ IndexedDB 连接已失效，重新初始化...')
      closeDB()
    }
  }
  
  // 🔥 如果正在初始化，返回同一个 Promise
  if (dbPromise) {
    return dbPromise
  }
  
  // 🔥 创建新的初始化 Promise
  dbPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      dbPromise = null  // 清除缓存，允许重试
      
      // 🔥 超时时尝试重试
      if (initRetryCount < MAX_RETRY) {
        initRetryCount++
        console.warn(`⚠️ IndexedDB 打开超时，尝试重试 (${initRetryCount}/${MAX_RETRY})...`)
        closeDB()  // 关闭可能卡住的连接
        // 延迟500ms后重试
        setTimeout(() => {
          initDB().then(resolve).catch(reject)
        }, 500)
      } else {
        console.error('❌ IndexedDB 打开超时（已重试3次）')
        initRetryCount = 0  // 重置计数器
        reject(new Error('数据库打开超时'))
      }
    }, 5000)  // 🔥 减少到 5 秒，快速失败后重试

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      clearTimeout(timeout)
      dbPromise = null
      const error = (event.target as IDBOpenDBRequest).error
      console.error('❌ 打开IndexedDB失败:', error?.message || error)
      reject(new Error('打开数据库失败'))
    }
    
    request.onblocked = () => {
      console.warn('⚠️ IndexedDB 被阻塞，尝试关闭旧连接...')
      // 🔥 主动关闭旧连接，解除阻塞
      closeDB()
    }

    request.onsuccess = () => {
      clearTimeout(timeout)
      initRetryCount = 0  // 成功后重置计数器
      dbInstance = request.result
      
      // 🔥 监听连接关闭事件
      dbInstance.onclose = () => {
        console.warn('⚠️ IndexedDB 连接被关闭')
        dbInstance = null
        dbPromise = null
      }
      
      // 🔥 监听版本变化事件（其他标签页升级数据库时）
      dbInstance.onversionchange = () => {
        console.warn('⚠️ 数据库版本变化，关闭当前连接')
        closeDB()
      }
      
      console.log('✅ IndexedDB已连接')
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      console.log('📦 正在创建/升级数据库...')
      
      // 创建所有对象存储
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
          console.log(`  📦 创建 store: ${storeName}`)
        }
      })
    }
  })
  
  return dbPromise
}

/**
 * 保存数据到IndexedDB
 * 🔥 强化版：自动清理不可克隆的对象，防止DataCloneError
 */
export async function setItem(store: string, key: string, value: any): Promise<void> {
  try {
    // Structured clone preserves large histories without JSON string-size limits.
    // Never truncate records or report success after a serialization failure.
    let cleanedValue: any
    try {
      cleanedValue = structuredClone(value)
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'DataCloneError') throw error
      const seen = new WeakSet<object>()
      cleanedValue = JSON.parse(JSON.stringify(value, (_key, val) => {
        if (typeof val === 'function') return undefined
        if (val && typeof val === 'object') {
          if (val instanceof Event || (typeof Node !== 'undefined' && val instanceof Node)) return undefined
          if (seen.has(val)) return undefined
          seen.add(val)
        }
        return val
      }))
    }

    const db = await initDB()
    const transaction = db.transaction([store], 'readwrite')
    const objectStore = transaction.objectStore(store)
    
    return new Promise((resolve, reject) => {
      const request = objectStore.put(cleanedValue, key)
      
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error || new Error('事务中止'))
      transaction.onerror = () => reject(transaction.error || new Error('事务失败'))
      request.onerror = (event) => {
        const error = (event.target as IDBRequest).error
        console.error('❌ [IndexedDB] 保存失败:', error?.message || error)
        reject(error || new Error('保存数据失败'))
      }
    })
  } catch (error) {
    console.error('IndexedDB setItem error:', error)
    throw error
  }
}

/** Read/modify/write in one transaction, including across tabs. */
export async function updateItem<T>(store: string, key: string, update: (current: T | null) => T): Promise<T> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite')
    const objectStore = transaction.objectStore(store)
    let result: T
    transaction.oncomplete = () => resolve(result)
    transaction.onabort = () => reject(transaction.error || new Error('事务中止'))
    transaction.onerror = () => reject(transaction.error || new Error('事务失败'))
    const request = objectStore.get(key)
    request.onsuccess = () => {
      try {
        result = update(request.result ?? null)
        objectStore.put(result, key)
      } catch (error) {
        transaction.abort()
        reject(error)
      }
    }
  })
}

/**
 * 从IndexedDB读取数据
 */
export async function getItem<T>(store: string, key: string, throwOnError = false): Promise<T | null> {
  try {
    const db = await initDB()
    const transaction = db.transaction([store], 'readonly')
    const objectStore = transaction.objectStore(store)
    
    return new Promise((resolve, reject) => {
      const request = objectStore.get(key)
      
      request.onsuccess = () => {
        resolve(request.result || null)
      }
      request.onerror = () => reject(new Error('读取数据失败'))
    })
  } catch (error) {
    console.error('IndexedDB getItem error:', error)
    if (throwOnError) throw error
    return null
  }
}

/**
 * 从IndexedDB删除数据
 */
export async function removeItem(store: string, key: string): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([store], 'readwrite')
    const objectStore = transaction.objectStore(store)
    
    return new Promise((resolve, reject) => {
      const request = objectStore.delete(key)
      
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error || new Error('事务中止'))
      transaction.onerror = () => reject(transaction.error || new Error('事务失败'))
      request.onerror = () => reject(new Error('删除数据失败'))
    })
  } catch (error) {
    console.error('IndexedDB removeItem error:', error)
    throw error
  }
}

/**
 * 获取store中的所有键
 */
export async function getAllKeys(store: string): Promise<string[]> {
  try {
    const db = await initDB()
    const transaction = db.transaction([store], 'readonly')
    const objectStore = transaction.objectStore(store)
    
    return new Promise((resolve, reject) => {
      const request = objectStore.getAllKeys()
      
      request.onsuccess = () => {
        resolve(request.result as string[])
      }
      request.onerror = () => reject(new Error('获取所有键失败'))
    })
  } catch (error) {
    console.error('IndexedDB getAllKeys error:', error)
    return []
  }
}

/**
 * 清空整个store
 */
export async function clearStore(store: string): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([store], 'readwrite')
    const objectStore = transaction.objectStore(store)
    
    return new Promise((resolve, reject) => {
      const request = objectStore.clear()
      
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error || new Error('事务中止'))
      transaction.onerror = () => reject(transaction.error || new Error('事务失败'))
      request.onerror = () => reject(new Error('清空store失败'))
    })
  } catch (error) {
    console.error('IndexedDB clearStore error:', error)
    throw error
  }
}

/**
 * 批量保存数据（性能优化）
 */
export async function setItems(store: string, items: { key: string; value: any }[]): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([store], 'readwrite')
    const objectStore = transaction.objectStore(store)
    
    return new Promise((resolve, reject) => {
      items.forEach(({ key, value }) => {
        objectStore.put(value, key)
      })
      
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(new Error('批量保存失败'))
    })
  } catch (error) {
    console.error('IndexedDB setItems error:', error)
    throw error
  }
}

// 导出store常量
export { STORES }

/**
 * 🔥 紧急清理：关闭连接并删除数据库
 * 可在控制台调用: window.emergencyResetDB()
 */
export async function emergencyResetDB(): Promise<void> {
  console.log('🚨 开始紧急重置数据库...')
  
  // 1. 关闭现有连接
  closeDB()
  console.log('✅ 已关闭数据库连接')
  
  // 2. 删除数据库
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => {
      console.log('✅ 数据库已删除')
      resolve()
    }
    req.onerror = () => {
      console.error('❌ 删除数据库失败')
      resolve()
    }
    req.onblocked = () => {
      console.warn('⚠️ 删除被阻塞，请刷新页面后重试')
      resolve()
    }
    // 5秒超时
    setTimeout(() => {
      console.warn('⚠️ 删除超时')
      resolve()
    }, 5000)
  })
}

// 🔥 暴露到全局，方便控制台调用
if (typeof window !== 'undefined') {
  (window as any).emergencyResetDB = emergencyResetDB
}
