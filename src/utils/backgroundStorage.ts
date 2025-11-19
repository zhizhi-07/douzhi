/**
 * 背景图片存储 - 使用IndexedDB
 * 避免localStorage配额限制
 */

const DB_NAME = 'BackgroundStorage'
const DB_VERSION = 1
const STORE_NAME = 'backgrounds'

// 初始化数据库
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * 保存背景图片
 * @param key 背景类型：desktop, music, wechat, memo
 * @param file 图片文件
 */
export const saveBackground = async (key: string, file: File): Promise<string> => {
  const db = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    // 直接存储Blob
    const request = store.put(file, key)
    
    request.onsuccess = () => {
      // 创建临时URL供预览
      const url = URL.createObjectURL(file)
      resolve(url)
    }
    
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取背景图片
 * @param key 背景类型
 */
export const getBackground = async (key: string): Promise<string | null> => {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)
      
      request.onsuccess = () => {
        const blob = request.result as Blob | undefined
        if (blob) {
          const url = URL.createObjectURL(blob)
          resolve(url)
        } else {
          resolve(null)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('获取背景失败:', error)
    return null
  }
}

/**
 * 删除背景图片
 * @param key 背景类型
 */
export const deleteBackground = async (key: string): Promise<void> => {
  const db = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(key)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 从localStorage迁移到IndexedDB（兼容旧数据）
 */
export const migrateFromLocalStorage = async () => {
  const keys = ['desktop_background', 'music_background', 'wechat_background', 'memo_background']
  
  for (const oldKey of keys) {
    const base64 = localStorage.getItem(oldKey)
    if (base64) {
      try {
        // 将base64转为Blob
        const response = await fetch(base64)
        const blob = await response.blob()
        
        // 保存到IndexedDB
        const newKey = oldKey.replace('_background', '')
        await saveBackground(newKey, new File([blob], `${newKey}.jpg`, { type: 'image/jpeg' }))
        
        // 删除localStorage旧数据
        localStorage.removeItem(oldKey)
        console.log(`✅ 已迁移: ${oldKey} → IndexedDB`)
      } catch (error) {
        console.error(`迁移失败: ${oldKey}`, error)
      }
    }
  }
}
