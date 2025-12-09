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

/**
 * 初始化数据库
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('❌ 打开IndexedDB失败')
      reject(new Error('打开数据库失败'))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      console.log('✅ IndexedDB已连接')
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // 创建所有对象存储
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
          console.log(`📦 创建对象存储: ${storeName}`)
        }
      })
    }
  })
}

/**
 * 保存数据到IndexedDB
 * 🔥 强化版：自动清理不可克隆的对象，防止DataCloneError
 */
export async function setItem(store: string, key: string, value: any): Promise<void> {
  try {
    // 🔥 关键修复：在保存前先通过JSON序列化清理不可克隆的对象
    // 这会移除：Event、PointerEvent、DOM元素、函数、循环引用等
    let cleanedValue = value
    try {
      const seen = new WeakSet()
      const jsonString = JSON.stringify(value, (_key, val) => {
        if (typeof val === 'object' && val !== null) {
          // 检测循环引用
          if (seen.has(val)) return undefined
          seen.add(val)
          
          // 移除Event对象和DOM元素
          if (val instanceof Event || 
              val instanceof Node || 
              val instanceof Window || 
              val instanceof Document) {
            return undefined
          }
          
          // 检查构造函数名称
          if (val.constructor) {
            const name = val.constructor.name
            if (name.includes('Event') || 
                name.includes('Element') ||
                name === 'Window' ||
                name === 'Document') {
              return undefined
            }
          }
        }
        
        // 移除函数
        if (typeof val === 'function') return undefined
        
        return val
      })
      
      cleanedValue = JSON.parse(jsonString)
    } catch (cleanError) {
      // 🔥 数据太大，尝试压缩后再保存
      if (cleanError instanceof RangeError) {
        console.warn('⚠️ [IndexedDB] 数据太大，尝试压缩...')
        try {
          // 如果是数组（消息列表），只保留最近300条，并移除大型数据
          if (Array.isArray(value)) {
            const compressed = value.slice(-300).map((item: any) => {
              if (!item) return item
              const copy = { ...item }
              // 移除 base64 图片数据（太大）
              if (copy.emojiUrl?.startsWith('data:')) {
                copy.emojiUrl = '[图片数据已压缩]'
              }
              if (copy.content?.startsWith('data:image')) {
                copy.content = '[图片]'
              }
              return copy
            })
            cleanedValue = compressed
            console.log(`📦 [IndexedDB] 压缩后保存 ${compressed.length} 条`)
          } else {
            console.warn('⚠️ [IndexedDB] 无法压缩，跳过保存')
            return
          }
        } catch {
          console.warn('⚠️ [IndexedDB] 压缩失败，跳过保存')
          return
        }
      } else {
        console.warn('⚠️ [IndexedDB] 清理数据失败，使用原始数据:', cleanError)
      }
    }
    
    const db = await initDB()
    const transaction = db.transaction([store], 'readwrite')
    const objectStore = transaction.objectStore(store)
    
    return new Promise((resolve, reject) => {
      const request = objectStore.put(cleanedValue, key)
      
      request.onsuccess = () => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(new Error('事务失败'))
      }
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

/**
 * 从IndexedDB读取数据
 */
export async function getItem<T>(store: string, key: string): Promise<T | null> {
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
      
      request.onsuccess = () => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(new Error('事务失败'))
      }
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
      
      request.onsuccess = () => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(new Error('事务失败'))
      }
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
