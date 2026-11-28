/**
 * 统一存储服务
 * - 大文件（图片、音频）使用 IndexedDB
 * - 小配置使用 localStorage
 */

const DB_NAME = 'AppStorage'
const DB_VERSION = 2  // 升级版本以添加 SETTINGS store
const STORES = {
  IMAGES: 'images',      // 壁纸、图标
  AUDIO: 'audio',        // 音效
  MESSAGES: 'messages',  // 聊天记录
  MOMENTS: 'moments',    // 朋友圈
  CHARACTERS: 'characters', // 角色数据
  SETTINGS: 'settings'   // 各种设置和小数据
}

/**
 * 初始化 IndexedDB
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      })
      console.log('✅ IndexedDB 初始化完成')
    }
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 保存到 IndexedDB
 */
export const saveToIndexedDB = async (
  store: keyof typeof STORES,
  key: string,
  data: any
): Promise<void> => {
  const db = await initDB()
  const storeName = STORES[store]
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const objectStore = transaction.objectStore(storeName)
    const request = objectStore.put(data, key)
    
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('事务中止')) }
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('事务失败')) }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 从 IndexedDB 读取
 */
export const getFromIndexedDB = async (
  store: keyof typeof STORES,
  key: string
): Promise<any> => {
  const db = await initDB()
  const storeName = STORES[store]
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const objectStore = transaction.objectStore(storeName)
    const request = objectStore.get(key)
    
    request.onsuccess = () => { db.close(); resolve(request.result || null) }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 从 IndexedDB 删除
 */
export const deleteFromIndexedDB = async (
  store: keyof typeof STORES,
  key: string
): Promise<void> => {
  const db = await initDB()
  const storeName = STORES[store]
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const objectStore = transaction.objectStore(storeName)
    const request = objectStore.delete(key)
    
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('事务中止')) }
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('事务失败')) }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取 store 中所有 keys
 */
export const getAllKeysFromIndexedDB = async (
  store: keyof typeof STORES
): Promise<string[]> => {
  const db = await initDB()
  const storeName = STORES[store]
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const objectStore = transaction.objectStore(storeName)
    const request = objectStore.getAllKeys()
    
    request.onsuccess = () => { db.close(); resolve(request.result as string[]) }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 清空整个 store
 */
export const clearIndexedDBStore = async (
  store: keyof typeof STORES
): Promise<void> => {
  const db = await initDB()
  const storeName = STORES[store]
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const objectStore = transaction.objectStore(storeName)
    const request = objectStore.clear()
    
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('事务中止')) }
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('事务失败')) }
    request.onerror = () => reject(request.error)
  })
}

// ============ 便捷方法 ============

/**
 * 保存图片（壁纸、图标等）
 * @param key 图片key
 * @param data Blob对象或base64字符串
 */
export const saveImage = async (key: string, data: Blob | string) => {
  // 如果是base64字符串，转为Blob（兼容旧代码）
  if (typeof data === 'string' && data.startsWith('data:')) {
    const res = await fetch(data)
    data = await res.blob()
  }
  return saveToIndexedDB('IMAGES', key, data)
}

/**
 * 获取图片
 * @returns ObjectURL或null
 */
export const getImage = async (key: string): Promise<string | null> => {
  const data = await getFromIndexedDB('IMAGES', key)
  if (!data) return null
  
  // 如果存的是Blob，创建ObjectURL
  if (data instanceof Blob) {
    return URL.createObjectURL(data)
  }
  
  // 如果存的是base64字符串（兼容旧数据），直接返回
  if (typeof data === 'string') {
    return data
  }
  
  return null
}

/**
 * 保存音频
 */
export const saveAudio = (key: string, base64Data: string) => {
  return saveToIndexedDB('AUDIO', key, base64Data)
}

/**
 * 获取音频
 */
export const getAudio = (key: string) => {
  return getFromIndexedDB('AUDIO', key)
}

/**
 * 保存聊天记录
 */
export const saveMessages = (characterId: string, messages: any[]) => {
  return saveToIndexedDB('MESSAGES', characterId, messages)
}

/**
 * 获取聊天记录
 */
export const getMessages = (characterId: string) => {
  return getFromIndexedDB('MESSAGES', characterId)
}

/**
 * 保存朋友圈
 */
export const saveMoments = (moments: any[]) => {
  return saveToIndexedDB('MOMENTS', 'all', moments)
}

/**
 * 获取朋友圈
 */
export const getMoments = () => {
  return getFromIndexedDB('MOMENTS', 'all')
}

/**
 * 从 localStorage 迁移到 IndexedDB
 */
export const migrateFromLocalStorage = async () => {
  console.log('🔄 开始迁移 localStorage 数据到 IndexedDB...')
  
  const migrations = [
    // 迁移背景图片
    { localKey: 'desktop_background', idbStore: 'IMAGES' as const, idbKey: 'desktop_bg' },
    { localKey: 'music_background', idbStore: 'IMAGES' as const, idbKey: 'music_bg' },
    { localKey: 'wechat_background', idbStore: 'IMAGES' as const, idbKey: 'wechat_bg' },
    
    // 迁移音效
    { localKey: 'custom_sound', idbStore: 'AUDIO' as const, idbKey: 'custom_sound' },
    { localKey: 'custom_send_sound', idbStore: 'AUDIO' as const, idbKey: 'send_sound' },
    { localKey: 'custom_notify_sound', idbStore: 'AUDIO' as const, idbKey: 'notify_sound' },
    { localKey: 'custom_call_sound', idbStore: 'AUDIO' as const, idbKey: 'call_sound' },
    
    // 迁移朋友圈
    { localKey: 'moments', idbStore: 'MOMENTS' as const, idbKey: 'all' },
  ]
  
  let migratedCount = 0
  
  for (const { localKey, idbStore, idbKey } of migrations) {
    const data = localStorage.getItem(localKey)
    if (data) {
      try {
        const parsed = localKey === 'moments' ? JSON.parse(data) : data
        await saveToIndexedDB(idbStore, idbKey, parsed)
        localStorage.removeItem(localKey)
        migratedCount++
        console.log(`✅ 已迁移: ${localKey} -> IndexedDB`)
      } catch (error) {
        console.error(`❌ 迁移失败: ${localKey}`, error)
      }
    }
  }
  
  console.log(`✅ 迁移完成，共迁移 ${migratedCount} 项`)
}
