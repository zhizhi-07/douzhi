/**
 * 头像存储服务
 * 使用 IndexedDB 存储头像数据，解决 localStorage 空间不足的问题
 */

const DB_NAME = 'AvatarStorage'
const DB_VERSION = 1
const STORE_NAME = 'avatars'

// 头像类型
type AvatarType = 'user' | 'character' | 'account' | 'mask'

interface AvatarRecord {
  id: string  // 'user' 或 'character_xxx'
  data: string  // base64 数据
  updatedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

/**
 * 打开数据库连接
 */
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      console.error('❌ [头像存储] 打开数据库失败:', request.error)
      dbPromise = null
      reject(request.error)
    }
    
    request.onsuccess = () => {
      console.log('✅ [头像存储] 数据库连接成功')
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        console.log('✅ [头像存储] 创建存储空间成功')
      }
    }
  })
  
  return dbPromise
}

/**
 * 保存头像到 IndexedDB
 */
export async function saveAvatar(type: AvatarType, id: string, data: string): Promise<boolean> {
  try {
    const db = await openDB()
    const key = type === 'user' ? 'user' : type === 'account' ? `account_${id}` : type === 'mask' ? `mask_${id}` : `character_${id}`
    
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const record: AvatarRecord = {
        id: key,
        data,
        updatedAt: Date.now()
      }
      
      const request = store.put(record)
      
      request.onsuccess = () => {
        console.log(`✅ [头像存储] 保存成功: ${key}`)
        resolve(true)
      }
      
      request.onerror = () => {
        console.error(`❌ [头像存储] 保存失败: ${key}`, request.error)
        resolve(false)
      }
    })
  } catch (error) {
    console.error('❌ [头像存储] 保存异常:', error)
    return false
  }
}

/**
 * 从 IndexedDB 获取头像
 */
export async function getAvatar(type: AvatarType, id: string = ''): Promise<string | null> {
  try {
    const db = await openDB()
    const key = type === 'user' ? 'user' : type === 'account' ? `account_${id}` : type === 'mask' ? `mask_${id}` : `character_${id}`
    
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)
      
      request.onsuccess = () => {
        const record = request.result as AvatarRecord | undefined
        if (record) {
          console.log(`✅ [头像存储] 读取成功: ${key}`)
          resolve(record.data)
        } else {
          resolve(null)
        }
      }
      
      request.onerror = () => {
        console.error(`❌ [头像存储] 读取失败: ${key}`, request.error)
        resolve(null)
      }
    })
  } catch (error) {
    console.error('❌ [头像存储] 读取异常:', error)
    return null
  }
}

/**
 * 删除头像
 */
export async function deleteAvatar(type: AvatarType, id: string = ''): Promise<boolean> {
  try {
    const db = await openDB()
    const key = type === 'user' ? 'user' : type === 'account' ? `account_${id}` : type === 'mask' ? `mask_${id}` : `character_${id}`
    
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)
      
      request.onsuccess = () => {
        console.log(`✅ [头像存储] 删除成功: ${key}`)
        resolve(true)
      }
      
      request.onerror = () => {
        console.error(`❌ [头像存储] 删除失败: ${key}`, request.error)
        resolve(false)
      }
    })
  } catch (error) {
    console.error('❌ [头像存储] 删除异常:', error)
    return false
  }
}

/**
 * 保存用户头像（便捷方法）
 */
export async function saveUserAvatar(data: string): Promise<boolean> {
  return saveAvatar('user', '', data)
}

/**
 * 获取用户头像（便捷方法）
 */
export async function getUserAvatar(): Promise<string | null> {
  return getAvatar('user', '')
}

/**
 * 检查 IndexedDB 是否可用
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

/**
 * 保存账号头像（便捷方法）
 */
export async function saveAccountAvatar(accountId: string, data: string): Promise<boolean> {
  return saveAvatar('account', accountId, data)
}

/**
 * 获取账号头像（便捷方法）
 */
export async function getAccountAvatar(accountId: string): Promise<string | null> {
  return getAvatar('account', accountId)
}

/**
 * 删除账号头像（便捷方法）
 */
export async function deleteAccountAvatar(accountId: string): Promise<boolean> {
  return deleteAvatar('account', accountId)
}

/**
 * 保存面具头像（便捷方法）
 */
export async function saveMaskAvatar(maskId: string, data: string): Promise<boolean> {
  return saveAvatar('mask', maskId, data)
}

/**
 * 获取面具头像（便捷方法）
 */
export async function getMaskAvatar(maskId: string): Promise<string | null> {
  return getAvatar('mask', maskId)
}

/**
 * 删除面具头像（便捷方法）
 */
export async function deleteMaskAvatar(maskId: string): Promise<boolean> {
  return deleteAvatar('mask', maskId)
}
