/**
 * 设备 ID 管理
 * 用于设备级封禁
 */

const DEVICE_ID_KEY = 'douzhi_device_id'

/**
 * 获取或生成设备 ID
 * 存储在 IndexedDB 中，比 localStorage 更难清除
 */
export const getDeviceId = async (): Promise<string> => {
  // 先尝试从 IndexedDB 读取
  try {
    const db = await openDeviceDB()
    const id = await getFromDB(db, 'deviceId')
    if (id) return id
  } catch (e) {
    console.log('IndexedDB 不可用，使用 localStorage')
  }

  // 再尝试从 localStorage 读取
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  
  if (!deviceId) {
    // 生成新的设备 ID
    deviceId = generateDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
    
    // 同时存到 IndexedDB
    try {
      const db = await openDeviceDB()
      await saveToDB(db, 'deviceId', deviceId)
    } catch (e) {
      // 忽略
    }
  }
  
  return deviceId
}

/**
 * 生成设备 ID
 * 结合多个因素生成较稳定的指纹
 */
function generateDeviceId(): string {
  const factors = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    // @ts-ignore
    navigator.deviceMemory || 0,
  ]
  
  // 简单哈希
  const str = factors.join('|')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  // 加上随机部分确保唯一性
  const random = Math.random().toString(36).substring(2, 10)
  
  return `dev_${Math.abs(hash).toString(36)}_${random}_${Date.now().toString(36)}`
}

// IndexedDB 操作
function openDeviceDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('douzhi_device', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('device')) {
        db.createObjectStore('device')
      }
    }
  })
}

function getFromDB(db: IDBDatabase, key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('device', 'readonly')
    const store = tx.objectStore('device')
    const request = store.get(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

function saveToDB(db: IDBDatabase, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('device', 'readwrite')
    const store = tx.objectStore('device')
    const request = store.put(value, key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
