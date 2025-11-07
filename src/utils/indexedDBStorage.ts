/**
 * IndexedDB存储工具
 * 提供比localStorage更大的存储空间
 */

const DB_NAME = 'EmojiDB'
const DB_VERSION = 1
const STORE_NAME = 'emojis'

let dbInstance: IDBDatabase | null = null

/**
 * 初始化数据库连接
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('打开数据库失败'))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // 如果对象存储不存在，创建它
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * 保存数据到IndexedDB
 */
export async function setItem(key: string, value: any): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.put(value, key)
      
      request.onsuccess = () => {
        // 等待事务完成，确保数据已写入磁盘
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(new Error('事务失败'))
      }
      request.onerror = () => reject(new Error('保存数据失败'))
    })
  } catch (error) {
    console.error('IndexedDB setItem error:', error)
    throw error
  }
}

/**
 * 从IndexedDB读取数据
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      
      request.onsuccess = () => {
        resolve(request.result !== undefined ? request.result : null)
      }
      request.onerror = () => reject(new Error('读取数据失败'))
    })
  } catch (error) {
    console.error('IndexedDB getItem error:', error)
    return null
  }
}

/**
 * 从IndexedDB删除数据
 */
export async function removeItem(key: string): Promise<void> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('删除数据失败'))
    })
  } catch (error) {
    console.error('IndexedDB removeItem error:', error)
    throw error
  }
}

/**
 * 检查IndexedDB是否可用
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}
