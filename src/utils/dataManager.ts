/**
 * 数据管理工具
 * 导出、导入、清除所有数据
 */

/**
 * 导出所有数据
 */
export async function exportAllData(): Promise<void> {
  try {
    const data: any = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      localStorage: {},
      indexedDB: {}
    }

    // 1. 导出 localStorage 数据
    console.log('📦 开始导出 localStorage...')
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        data.localStorage[key] = localStorage.getItem(key)
      }
    }
    console.log(`✅ localStorage 导出完成，共 ${Object.keys(data.localStorage).length} 项`)

    // 2. 导出 IndexedDB 数据
    console.log('📦 开始导出 IndexedDB...')
    
    // 导出聊天消息数据库
    try {
      const messageDbData = await exportIndexedDB('simple-chat-messages')
      if (messageDbData) {
        data.indexedDB['simple-chat-messages'] = messageDbData
      }
    } catch (err) {
      console.warn('聊天消息数据库导出失败:', err)
    }

    // 导出朋友圈数据库
    try {
      const momentsDbData = await exportIndexedDB('moments-storage')
      if (momentsDbData) {
        data.indexedDB['moments-storage'] = momentsDbData
      }
    } catch (err) {
      console.warn('朋友圈数据库导出失败:', err)
    }

    console.log('✅ IndexedDB 导出完成')

    // 3. 生成文件并下载
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'douzhi.备份'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('✅ 数据导出成功！')
  } catch (error) {
    console.error('❌ 导出数据失败:', error)
    throw error
  }
}

/**
 * 导入数据
 */
export async function importAllData(file: File): Promise<void> {
  try {
    console.log('📦 开始导入数据...')

    // 1. 读取文件
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.version || !data.exportTime) {
      throw new Error('无效的备份文件格式')
    }

    console.log(`📅 备份时间: ${data.exportTime}`)

    // 2. 导入 localStorage
    if (data.localStorage) {
      console.log('📦 开始导入 localStorage...')
      Object.keys(data.localStorage).forEach(key => {
        localStorage.setItem(key, data.localStorage[key])
      })
      console.log(`✅ localStorage 导入完成，共 ${Object.keys(data.localStorage).length} 项`)
    }

    // 3. 导入 IndexedDB
    if (data.indexedDB) {
      console.log('📦 开始导入 IndexedDB...')

      // 导入聊天消息
      if (data.indexedDB['simple-chat-messages']) {
        await importIndexedDB('simple-chat-messages', data.indexedDB['simple-chat-messages'])
      }

      // 导入朋友圈
      if (data.indexedDB['moments-storage']) {
        await importIndexedDB('moments-storage', data.indexedDB['moments-storage'])
      }

      console.log('✅ IndexedDB 导入完成')
    }

    console.log('✅ 数据导入成功！')
  } catch (error) {
    console.error('❌ 导入数据失败:', error)
    throw error
  }
}

/**
 * 清除所有数据
 */
export function clearAllData(): void {
  try {
    console.log('🗑️ 开始清除所有数据...')

    // 1. 清除 localStorage
    console.log('🗑️ 清除 localStorage...')
    localStorage.clear()
    console.log('✅ localStorage 已清除')

    // 2. 清除 IndexedDB（通过重新加载页面后自动初始化）
    console.log('🗑️ 清除 IndexedDB...')
    indexedDB.deleteDatabase('simple-chat-messages')
    indexedDB.deleteDatabase('moments-storage')
    console.log('✅ IndexedDB 已清除')

    console.log('✅ 所有数据清除完成！')
  } catch (error) {
    console.error('❌ 清除数据失败:', error)
    throw error
  }
}

/**
 * 导出单个 IndexedDB 数据库
 */
async function exportIndexedDB(dbName: string): Promise<Record<string, any[]> | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName)
    
    request.onsuccess = async () => {
      const db = request.result
      const result: Record<string, any[]> = {}
      
      try {
        const storeNames = Array.from(db.objectStoreNames)
        
        for (const storeName of storeNames) {
          const tx = db.transaction(storeName, 'readonly')
          const store = tx.objectStore(storeName)
          const getAllRequest = store.getAll()
          
          const data = await new Promise<any[]>((res, rej) => {
            getAllRequest.onsuccess = () => res(getAllRequest.result)
            getAllRequest.onerror = () => rej(getAllRequest.error)
          })
          
          result[storeName] = data
          console.log(`  - ${storeName}: ${data.length} 条`)
        }
        
        db.close()
        resolve(result)
      } catch (err) {
        db.close()
        console.error(`导出 ${dbName} 失败:`, err)
        resolve(null)
      }
    }
    
    request.onerror = () => {
      console.warn(`数据库 ${dbName} 不存在`)
      resolve(null)
    }
  })
}

/**
 * 导入单个 IndexedDB 数据库
 */
async function importIndexedDB(dbName: string, data: Record<string, any[]>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName)
    
    request.onupgradeneeded = () => {
      const db = request.result
      // 创建所有需要的 object store
      Object.keys(data).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      })
    }
    
    request.onsuccess = async () => {
      const db = request.result
      
      try {
        for (const storeName of Object.keys(data)) {
          if (!db.objectStoreNames.contains(storeName)) {
            continue
          }
          
          const tx = db.transaction(storeName, 'readwrite')
          const store = tx.objectStore(storeName)
          
          // 清空现有数据
          await new Promise((res, rej) => {
            const clearReq = store.clear()
            clearReq.onsuccess = () => res(true)
            clearReq.onerror = () => rej(clearReq.error)
          })
          
          // 导入新数据
          const records = data[storeName]
          for (const record of records) {
            await new Promise((res, rej) => {
              const putReq = store.put(record)
              putReq.onsuccess = () => res(true)
              putReq.onerror = () => rej(putReq.error)
            })
          }
          
          console.log(`  - ${storeName}: ${records.length} 条`)
        }
        
        db.close()
        resolve()
      } catch (err) {
        db.close()
        reject(err)
      }
    }
    
    request.onerror = () => reject(request.error)
  })
}
