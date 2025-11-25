/**
 * 情侣空间相册 IndexedDB 存储
 * 解决 localStorage 存储图片导致配额超限的问题
 */

const DB_NAME = 'CouplePhotosDB'
const DB_VERSION = 1
const STORE_NAME = 'photos'

export interface PhotoRecord {
  id: string
  characterId: string
  characterName: string
  uploaderName: string
  description: string
  imageData: string  // base64
  timestamp: number
  createdAt: number
}

/**
 * 打开数据库
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 创建对象存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('characterId', 'characterId', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        console.log('✅ IndexedDB 对象存储已创建')
      }
    }
  })
}

/**
 * 保存照片到 IndexedDB
 */
export const savePhotoToDB = async (photo: PhotoRecord): Promise<void> => {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(photo)

    request.onsuccess = () => {
      console.log(`✅ 照片已保存到 IndexedDB: ${photo.id}`)
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 从 IndexedDB 获取所有照片
 */
export const getAllPhotosFromDB = async (): Promise<PhotoRecord[]> => {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const photos = request.result as PhotoRecord[]
      // 按时间倒序排序
      photos.sort((a, b) => b.timestamp - a.timestamp)
      resolve(photos)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 从 IndexedDB 获取指定角色的照片
 */
export const getPhotosByCharacterFromDB = async (characterId: string): Promise<PhotoRecord[]> => {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('characterId')
    const request = index.getAll(characterId)

    request.onsuccess = () => {
      const photos = request.result as PhotoRecord[]
      photos.sort((a, b) => b.timestamp - a.timestamp)
      resolve(photos)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 从 IndexedDB 删除照片
 */
export const deletePhotoFromDB = async (photoId: string): Promise<void> => {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(photoId)

    request.onsuccess = () => {
      console.log(`✅ 照片已从 IndexedDB 删除: ${photoId}`)
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 清空所有照片（用于清理情侣空间数据）
 */
export const clearAllPhotosFromDB = async (): Promise<void> => {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => {
      console.log('✅ 所有照片已从 IndexedDB 清空')
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取 IndexedDB 中的照片数量
 */
export const getPhotosCountFromDB = async (): Promise<number> => {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
