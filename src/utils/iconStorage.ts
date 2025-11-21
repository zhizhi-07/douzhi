// 使用IndexedDB存储图标，支持更大容量
const DB_NAME = 'IconStorage'
const DB_VERSION = 1
const UI_ICONS_STORE = 'ui_icons'
const DESKTOP_ICONS_STORE = 'desktop_icons'

// 初始化IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // 创建UI图标存储
      if (!db.objectStoreNames.contains(UI_ICONS_STORE)) {
        db.createObjectStore(UI_ICONS_STORE)
      }
      
      // 创建桌面图标存储
      if (!db.objectStoreNames.contains(DESKTOP_ICONS_STORE)) {
        db.createObjectStore(DESKTOP_ICONS_STORE)
      }
    }
  })
}

// 保存UI图标
export const saveUIIcon = async (iconId: string, imageData: Blob | string): Promise<void> => {
  const db = await initDB()
  
  // 如果是base64字符串，转为Blob（兼容旧代码）
  let dataToStore = imageData
  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    const res = await fetch(imageData)
    dataToStore = await res.blob()
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([UI_ICONS_STORE], 'readwrite')
    const store = transaction.objectStore(UI_ICONS_STORE)
    const request = store.put(dataToStore, iconId)
    
    request.onsuccess = () => {
      console.log(`✅ UI图标已保存: ${iconId}`)
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// 获取UI图标
export const getUIIcon = async (iconId: string): Promise<string | null> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([UI_ICONS_STORE], 'readonly')
    const store = transaction.objectStore(UI_ICONS_STORE)
    const request = store.get(iconId)
    
    request.onsuccess = () => {
      const data = request.result
      if (!data) {
        resolve(null)
        return
      }
      
      // 如果存的是Blob，创建ObjectURL
      if (data instanceof Blob) {
        resolve(URL.createObjectURL(data))
      } else if (typeof data === 'string') {
        // 兼容旧的base64数据
        resolve(data)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// 获取所有UI图标
export const getAllUIIcons = async (): Promise<Record<string, string>> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([UI_ICONS_STORE], 'readonly')
    const store = transaction.objectStore(UI_ICONS_STORE)
    const request = store.getAllKeys()
    
    request.onsuccess = async () => {
      const keys = request.result as string[]
      const icons: Record<string, string> = {}
      
      for (const key of keys) {
        const icon = await getUIIcon(key)
        if (icon) {
          icons[key] = icon
        }
      }
      
      resolve(icons)
    }
    request.onerror = () => reject(request.error)
  })
}

// 删除UI图标
export const deleteUIIcon = async (iconId: string): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([UI_ICONS_STORE], 'readwrite')
    const store = transaction.objectStore(UI_ICONS_STORE)
    const request = store.delete(iconId)
    
    request.onsuccess = () => {
      console.log(`✅ UI图标已删除: ${iconId}`)
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// 清空所有UI图标
export const clearAllUIIcons = async (): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([UI_ICONS_STORE], 'readwrite')
    const store = transaction.objectStore(UI_ICONS_STORE)
    const request = store.clear()
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 保存桌面图标  
export const saveDesktopIcon = async (appId: string, imageData: Blob | string): Promise<void> => {
  const db = await initDB()
  
  // 如果是base64字符串，转为Blob（兼容旧代码）
  let dataToStore = imageData
  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    const res = await fetch(imageData)
    dataToStore = await res.blob()
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DESKTOP_ICONS_STORE], 'readwrite')
    const store = transaction.objectStore(DESKTOP_ICONS_STORE)
    const request = store.put(dataToStore, appId)
    
    request.onsuccess = () => {
      console.log(`✅ 桌面图标已保存: ${appId}`)
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// 获取桌面图标
export const getDesktopIcon = async (appId: string): Promise<string | null> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DESKTOP_ICONS_STORE], 'readonly')
    const store = transaction.objectStore(DESKTOP_ICONS_STORE)
    const request = store.get(appId)
    
    request.onsuccess = () => {
      const data = request.result
      if (!data) {
        resolve(null)
        return
      }
      
      // 如果存的是Blob，创建ObjectURL
      if (data instanceof Blob) {
        resolve(URL.createObjectURL(data))
      } else if (typeof data === 'string') {
        // 兼容旧的base64数据
        resolve(data)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// 获取所有桌面图标
export const getAllDesktopIcons = async (): Promise<Array<{appId: string, icon: string}>> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DESKTOP_ICONS_STORE], 'readonly')
    const store = transaction.objectStore(DESKTOP_ICONS_STORE)
    const request = store.getAllKeys()
    
    request.onsuccess = async () => {
      const keys = request.result as string[]
      const icons: Array<{appId: string, icon: string}> = []
      
      for (const key of keys) {
        const icon = await getDesktopIcon(key)
        if (icon) {
          icons.push({ appId: key, icon })
        }
      }
      
      resolve(icons)
    }
    request.onerror = () => reject(request.error)
  })
}

// 删除桌面图标
export const deleteDesktopIcon = async (appId: string): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DESKTOP_ICONS_STORE], 'readwrite')
    const store = transaction.objectStore(DESKTOP_ICONS_STORE)
    const request = store.delete(appId)
    
    request.onsuccess = () => {
      console.log(`✅ 桌面图标已删除: ${appId}`)
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// 清空所有桌面图标
export const clearAllDesktopIcons = async (): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DESKTOP_ICONS_STORE], 'readwrite')
    const store = transaction.objectStore(DESKTOP_ICONS_STORE)
    const request = store.clear()
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 获取存储使用情况
export const getStorageUsage = async (): Promise<{ used: number, available: number }> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0
    }
  }
  return { used: 0, available: 0 }
}

// 从localStorage迁移到IndexedDB
export const migrateFromLocalStorage = async (): Promise<void> => {
  console.log('🔄 开始从localStorage迁移到IndexedDB...')
  
  try {
    // 迁移UI图标
    const uiIcons = localStorage.getItem('ui_custom_icons')
    if (uiIcons) {
      const icons = JSON.parse(uiIcons)
      for (const [key, value] of Object.entries(icons)) {
        await saveUIIcon(key, value as string)
      }
      console.log(`✅ 已迁移 ${Object.keys(icons).length} 个UI图标`)
    }
    
    // 迁移桌面图标
    const desktopIcons = localStorage.getItem('custom_icons')
    if (desktopIcons) {
      const icons = JSON.parse(desktopIcons) as Array<{appId: string, icon: string}>
      for (const item of icons) {
        await saveDesktopIcon(item.appId, item.icon)
      }
      console.log(`✅ 已迁移 ${icons.length} 个桌面图标`)
    }
    
    console.log('✅ 迁移完成！')
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  }
}
