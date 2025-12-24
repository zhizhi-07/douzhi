/**
 * 背景图片存储 - 使用IndexedDB
 * 避免localStorage配额限制
 */

const DB_NAME = 'BackgroundStorage'
const DB_VERSION = 1  // 保持版本1，兼容旧数据
const STORE_NAME = 'backgrounds'

// 🔥 数据库连接缓存（单例模式）
let dbPromise: Promise<IDBDatabase> | null = null

// 🔥 内存缓存，避免重复读取 IndexedDB
const backgroundCache = new Map<string, string | null>()

// 🔥 URL缓存，避免重复创建blob URL
const urlCache = new Map<string, string>()

// 初始化数据库（单例）
const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      console.error('❌ [背景存储] 打开数据库失败:', request.error)
      dbPromise = null
      reject(request.error)
    }
    request.onsuccess = () => {
      console.log('✅ [背景存储] 数据库连接成功')
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      // 🔥 只在不存在时创建，不删除旧数据
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
        console.log('✅ [背景存储] 创建存储空间成功')
      }
    }
  })
  
  return dbPromise
}

// 将File转为base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * 保存背景图片
 * @param key 背景类型：desktop, music, wechat, memo
 * @param file 图片文件
 */
export const saveBackground = async (key: string, file: File): Promise<string> => {
  try {
    const db = await initDB()
    
    // 🔥 转换为base64存储（更可靠）
    const base64Data = await fileToBase64(file)
    
    // 🔥 更新内存缓存
    backgroundCache.set(key, base64Data)
    
    // 🔥 清除旧的URL缓存
    if (urlCache.has(key)) {
      URL.revokeObjectURL(urlCache.get(key)!)
      urlCache.delete(key)
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      // 🔥 直接存储base64字符串（兼容旧格式的key-value存储）
      const request = store.put(base64Data, key)
      
      request.onsuccess = () => {
        console.log(`✅ [背景存储] 保存成功: ${key}`)
        resolve(base64Data)
      }
      
      request.onerror = () => {
        console.error(`❌ [背景存储] 保存失败: ${key}`, request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('❌ [背景存储] 保存异常:', error)
    // 🔥 降级方案：直接返回base64
    try {
      const base64Data = await fileToBase64(file)
      backgroundCache.set(key, base64Data)
      return base64Data
    } catch {
      throw error
    }
  }
}

/**
 * 获取背景图片
 * @param key 背景类型
 */
export const getBackground = async (key: string): Promise<string | null> => {
  try {
    // 🔥 优先从内存缓存读取
    if (backgroundCache.has(key)) {
      const cached = backgroundCache.get(key)
      if (cached) {
        return cached
      }
      // 如果缓存值为null，说明之前查过不存在，直接返回
      if (cached === null) {
        return null
      }
    }
    
    const db = await initDB()
    
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)
      
      request.onsuccess = () => {
        const result = request.result
        
        if (!result) {
          backgroundCache.set(key, null)
          resolve(null)
          return
        }
        
        // 🔥 情况1：已经是base64字符串（新格式）
        if (typeof result === 'string' && result.startsWith('data:')) {
          console.log(`✅ [背景存储] 读取base64成功: ${key}`)
          backgroundCache.set(key, result)
          resolve(result)
          return
        }
        
        // 🔥 情况2：是Blob对象（旧格式）- 转换为base64并重新保存
        if (result instanceof Blob) {
          const reader = new FileReader()
          reader.onload = async () => {
            const base64Data = reader.result as string
            console.log(`✅ [背景存储] 转换旧Blob格式: ${key}`)
            backgroundCache.set(key, base64Data)
            
            // 🔥 自动迁移：将blob转换为base64重新保存
            try {
              const writeTransaction = db.transaction(STORE_NAME, 'readwrite')
              const writeStore = writeTransaction.objectStore(STORE_NAME)
              writeStore.put(base64Data, key)
              console.log(`✅ [背景存储] 自动迁移完成: ${key}`)
            } catch (e) {
              console.warn(`⚠️ [背景存储] 自动迁移失败: ${key}`, e)
            }
            
            resolve(base64Data)
          }
          reader.onerror = () => {
            // Blob读取失败，创建临时URL
            const url = URL.createObjectURL(result)
            urlCache.set(key, url)
            resolve(url)
          }
          reader.readAsDataURL(result)
          return
        }
        
        // 🔥 情况3：是File对象（旧格式的变体）
        if (result instanceof File) {
          const reader = new FileReader()
          reader.onload = () => {
            const base64Data = reader.result as string
            console.log(`✅ [背景存储] 转换旧File格式: ${key}`)
            backgroundCache.set(key, base64Data)
            resolve(base64Data)
          }
          reader.onerror = () => {
            const url = URL.createObjectURL(result)
            urlCache.set(key, url)
            resolve(url)
          }
          reader.readAsDataURL(result)
          return
        }
        
        // 🔥 其他情况：未知格式
        console.warn(`⚠️ [背景存储] 未知数据格式: ${key}`, typeof result)
        backgroundCache.set(key, null)
        resolve(null)
      }
      
      request.onerror = () => {
        console.error(`❌ [背景存储] 读取失败: ${key}`, request.error)
        resolve(null)
      }
    })
  } catch (error) {
    console.error('❌ [背景存储] 读取异常:', error)
    // 🔥 尝试从缓存返回
    if (backgroundCache.has(key)) {
      return backgroundCache.get(key) || null
    }
    return null
  }
}

/**
 * 删除背景图片
 * @param key 背景类型
 */
export const deleteBackground = async (key: string): Promise<void> => {
  try {
    // 🔥 删除缓存
    backgroundCache.delete(key)
    if (urlCache.has(key)) {
      URL.revokeObjectURL(urlCache.get(key)!)
      urlCache.delete(key)
    }
    
    const db = await initDB()
    
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)
      
      request.onsuccess = () => {
        console.log(`✅ [背景存储] 删除成功: ${key}`)
        resolve()
      }
      request.onerror = () => {
        console.error(`❌ [背景存储] 删除失败: ${key}`, request.error)
        resolve() // 即使失败也resolve，避免阻塞
      }
    })
  } catch (error) {
    console.error('❌ [背景存储] 删除异常:', error)
  }
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
        // 🔥 直接存储base64到IndexedDB（不需要转换）
        const newKey = oldKey.replace('_background', '')
        
        const db = await initDB()
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readwrite')
          const store = transaction.objectStore(STORE_NAME)
          // 🔥 使用key-value格式存储
          const request = store.put(base64, newKey)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
        
        // 更新缓存
        backgroundCache.set(newKey, base64)
        
        // 删除localStorage旧数据
        localStorage.removeItem(oldKey)
        console.log(`✅ [背景存储] 已迁移: ${oldKey} → IndexedDB`)
      } catch (error) {
        console.error(`❌ [背景存储] 迁移失败: ${oldKey}`, error)
      }
    }
  }
}

/**
 * 🔥 直接保存base64数据（用于已有base64的情况）
 */
export const saveBackgroundBase64 = async (key: string, base64Data: string): Promise<string> => {
  try {
    const db = await initDB()
    
    // 更新内存缓存
    backgroundCache.set(key, base64Data)
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      // 🔥 直接存储base64字符串（key-value格式）
      const request = store.put(base64Data, key)
      
      request.onsuccess = () => {
        console.log(`✅ [背景存储] 保存base64成功: ${key}`)
        resolve(base64Data)
      }
      
      request.onerror = () => {
        console.error(`❌ [背景存储] 保存base64失败: ${key}`, request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('❌ [背景存储] 保存base64异常:', error)
    // 降级：至少存入缓存
    backgroundCache.set(key, base64Data)
    return base64Data
  }
}

/**
 * 🔥 清除所有缓存（用于调试或强制刷新）
 */
export const clearBackgroundCache = () => {
  backgroundCache.clear()
  urlCache.forEach(url => URL.revokeObjectURL(url))
  urlCache.clear()
  console.log('✅ [背景存储] 缓存已清除')
}
