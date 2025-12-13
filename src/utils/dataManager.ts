/**
 * 数据管理工具
 * 导出、导入、清除所有数据
 */

// 🔥 实际使用的数据库列表（必须与实际代码中的DB_NAME保持一致）
const INDEXED_DB_NAMES = [
  'DouzhiDB',           // 主数据库（消息、角色、设置等）
  'AppStorage',         // 图片、音频、壁纸
  'BubbleStyleDB',      // 气泡样式（BubbleSettings, CardSettings, useChatBubbles）
  'EmojiDB',            // 表情包
  'AILocationDB',       // AI位置历史（locationService.ts）
  'CouplePhotosDB',     // 情侣照片
  'UnifiedMemoryDB',    // 记忆系统
  'FontStorage',        // 自定义字体
  'IconStorage',        // 自定义图标
  'BackgroundStorage',  // 背景存储
  'AvatarStorage',      // 头像存储
  'kiro_avatar_library', // 头像库
  'forum_db',           // 论坛帖子
  'forum-comments-db',  // 论坛评论
  'topic_chat_db',      // 话题聊天
  'douzhi_device',      // 设备ID
]

/**
 * 导出所有数据
 */
export async function exportAllData(): Promise<void> {
  try {
    const data: any = {
      version: '2.0',  // 升级版本号
      exportTime: new Date().toISOString(),
      localStorage: {},
      indexedDB: {}
    }

    // 1. 导出 localStorage 数据（过滤掉临时备份数据）
    console.log('📦 开始导出 localStorage...')
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        // 跳过消息备份（这些数据在 IndexedDB 里有）
        if (key.startsWith('msg_backup_')) continue
        data.localStorage[key] = localStorage.getItem(key)
      }
    }
    console.log(`✅ localStorage 导出完成，共 ${Object.keys(data.localStorage).length} 项`)

    // 2. 导出所有 IndexedDB 数据库
    console.log('📦 开始导出 IndexedDB...')
    
    for (const dbName of INDEXED_DB_NAMES) {
      try {
        const dbData = await exportIndexedDB(dbName)
        if (dbData && Object.keys(dbData).length > 0) {
          data.indexedDB[dbName] = dbData
          console.log(`  ✅ ${dbName} 导出成功`)
        }
      } catch (err) {
        console.warn(`  ⚠️ ${dbName} 导出失败:`, err)
      }
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
    console.log(`📦 备份版本: ${data.version}`)

    // 🔥 2. 先清空 localStorage（防止配额超限）
    console.log('🗑️ 清空旧的 localStorage...')
    localStorage.clear()

    // 3. 导入 localStorage
    if (data.localStorage) {
      console.log('📦 开始导入 localStorage...')
      let successCount = 0
      let failCount = 0
      
      for (const key of Object.keys(data.localStorage)) {
        try {
          localStorage.setItem(key, data.localStorage[key])
          successCount++
        } catch (err) {
          console.warn(`  ⚠️ 跳过大数据项: ${key}`)
          failCount++
        }
      }
      console.log(`✅ localStorage 导入完成，成功 ${successCount} 项，跳过 ${failCount} 项`)
    }

    // 4. 导入 IndexedDB
    if (data.indexedDB) {
      console.log('📦 开始导入 IndexedDB...')

      // 🔥 兼容旧备份：将旧数据库名映射到新的
      const oldToNewDbMap: Record<string, string> = {
        'simple-chat-messages': 'DouzhiDB',
        'moments-storage': 'DouzhiDB', 
        'characters-db': 'DouzhiDB',
        'BubbleDB': 'BubbleStyleDB',      // 旧名称 -> 正确名称
        'LocationDB': 'AILocationDB',     // 旧名称 -> 正确名称
      }

      for (const dbName of Object.keys(data.indexedDB)) {
        try {
          // 检查是否是旧格式数据库名
          const targetDb = oldToNewDbMap[dbName] || dbName
          
          if (oldToNewDbMap[dbName]) {
            console.log(`  🔄 转换旧格式: ${dbName} -> ${targetDb}`)
          }
          
          await importIndexedDB(targetDb, data.indexedDB[dbName])
          console.log(`  ✅ ${targetDb} 导入成功`)
        } catch (err) {
          console.warn(`  ⚠️ ${dbName} 导入失败:`, err)
        }
      }

      console.log('✅ IndexedDB 导入完成')
    }

    // 🔥 5. 从 localStorage 的消息备份恢复到 IndexedDB
    console.log('📦 检查 localStorage 消息备份...')
    let restoredMessages = 0
    
    for (const key of Object.keys(data.localStorage || {})) {
      if (key.startsWith('msg_backup_')) {
        try {
          const backup = JSON.parse(data.localStorage[key])
          if (backup.messages && backup.messages.length > 0) {
            const chatId = key.replace('msg_backup_', '')
            
            // 直接写入 DouzhiDB
            const dbReq = indexedDB.open('DouzhiDB', 4)
            await new Promise<void>((resolve) => {
              dbReq.onsuccess = () => {
                const db = dbReq.result
                if (db.objectStoreNames.contains('messages')) {
                  const tx = db.transaction('messages', 'readwrite')
                  tx.objectStore('messages').put(backup.messages, chatId)
                  tx.oncomplete = () => {
                    console.log(`  ✅ 恢复消息: ${chatId}, ${backup.messages.length} 条`)
                    restoredMessages++
                    db.close()
                    resolve()
                  }
                  tx.onerror = () => {
                    db.close()
                    resolve()
                  }
                } else {
                  db.close()
                  resolve()
                }
              }
              dbReq.onerror = () => resolve()
              // 超时
              setTimeout(resolve, 5000)
            })
          }
        } catch (e) {
          console.warn(`  ⚠️ 恢复消息备份失败: ${key}`, e)
        }
      }
    }
    
    if (restoredMessages > 0) {
      console.log(`✅ 从备份恢复了 ${restoredMessages} 个聊天的消息`)
    }

    console.log('✅ 数据导入成功！请刷新页面以加载新数据。')
  } catch (error) {
    console.error('❌ 导入数据失败:', error)
    throw error
  }
}

/**
 * 清除所有数据
 */
export async function clearAllData(): Promise<void> {
  console.log('🗑️ 开始清除所有数据...')

  // 1. 清除 localStorage
  console.log('🗑️ 清除 localStorage...')
  localStorage.clear()
  sessionStorage.clear()
  console.log('✅ localStorage 已清除')

  // 2. 清除所有 IndexedDB 数据库（等待每个删除完成）
  console.log('🗑️ 清除 IndexedDB...')
  
  const deletePromises = INDEXED_DB_NAMES.map(dbName => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(dbName)
      request.onsuccess = () => {
        console.log(`  ✅ 删除数据库: ${dbName}`)
        resolve()
      }
      request.onerror = () => {
        console.warn(`  ⚠️ 删除失败: ${dbName}`)
        resolve() // 即使失败也继续
      }
      request.onblocked = () => {
        console.warn(`  ⚠️ 数据库被占用: ${dbName}`)
        resolve()
      }
    })
  })

  await Promise.all(deletePromises)
  console.log('✅ IndexedDB 已清除')

  // 3. 清除 Service Worker 缓存
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('✅ 缓存已清除')
  }

  console.log('✅ 所有数据清除完成！')
}

/**
 * 导出单个 IndexedDB 数据库
 * 🔥 修复：同时导出 keys 和 values（支持 key-value 存储）
 */
async function exportIndexedDB(dbName: string): Promise<Record<string, any> | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName)
    
    request.onsuccess = async () => {
      const db = request.result
      const result: Record<string, { keys: string[], values: any[] }> = {}
      
      try {
        const storeNames = Array.from(db.objectStoreNames)
        
        for (const storeName of storeNames) {
          const tx = db.transaction(storeName, 'readonly')
          const store = tx.objectStore(storeName)
          
          // 获取所有 keys
          const keys = await new Promise<string[]>((res, rej) => {
            const req = store.getAllKeys()
            req.onsuccess = () => res(req.result as string[])
            req.onerror = () => rej(req.error)
          })
          
          // 获取所有 values
          const values = await new Promise<any[]>((res, rej) => {
            const req = store.getAll()
            req.onsuccess = () => res(req.result)
            req.onerror = () => rej(req.error)
          })
          
          result[storeName] = { keys, values }
          console.log(`  - ${storeName}: ${keys.length} 条`)
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

// 🔥 DouzhiDB 需要的完整 stores 列表（与 indexedDBManager.ts 保持一致）
const DOUZHI_DB_STORES = [
  'messages',        // 聊天消息
  'moments',         // 朋友圈
  'characters',      // 角色数据
  'userInfo',        // 用户信息
  'wallet',          // 钱包数据
  'emojis',          // 表情包
  'settings',        // 各种设置
  'misc',            // 其他杂项
  'dmMessages',      // 论坛私聊消息
  'dmConversations'  // 论坛私聊会话
]

/**
 * 导入单个 IndexedDB 数据库
 * 🔥 修复：支持 key-value 格式和旧格式兼容
 */
async function importIndexedDB(dbName: string, data: Record<string, any>): Promise<void> {
  console.log(`  🔓 正在打开数据库: ${dbName}`)
  
  // 🔥 先删除旧数据库，确保能创建正确的store结构
  await new Promise<void>((resolve) => {
    const delReq = indexedDB.deleteDatabase(dbName)
    delReq.onsuccess = () => resolve()
    delReq.onerror = () => resolve()
    delReq.onblocked = () => resolve()
    setTimeout(resolve, 2000)
  })
  
  // 🔥 DouzhiDB 需要使用正确的版本号
  const dbVersion = dbName === 'DouzhiDB' ? 4 : 1
  
  return new Promise((resolve, reject) => {
    // 添加超时
    const timeout = setTimeout(() => {
      console.error(`  ❌ 打开数据库超时: ${dbName}`)
      reject(new Error(`打开数据库超时: ${dbName}`))
    }, 10000)
    
    // 打开数据库
    const request = indexedDB.open(dbName, dbVersion)
    
    request.onupgradeneeded = () => {
      const db = request.result
      
      // 🔥 DouzhiDB 需要创建完整的 stores 结构
      if (dbName === 'DouzhiDB') {
        DOUZHI_DB_STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName)
            console.log(`  📦 创建 store: ${storeName}`)
          }
        })
      }
      
      // 创建导入数据中的 store
      Object.keys(data).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
          console.log(`  📦 创建 store: ${storeName}`)
        }
      })
    }
    
    request.onsuccess = async () => {
      clearTimeout(timeout)
      const db = request.result
      console.log(`  ✅ 数据库已打开: ${dbName}, stores: ${Array.from(db.objectStoreNames).join(', ')}`)
      
      try {
        for (const storeName of Object.keys(data)) {
          if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`  ⚠️ store 不存在，跳过: ${storeName}`)
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
          
          const storeData = data[storeName]
          
          // 🔥 检测数据格式：新格式 { keys, values } 或 旧格式 [records]
          if (storeData && storeData.keys && storeData.values) {
            // 新格式：key-value 对
            const { keys, values } = storeData
            for (let i = 0; i < keys.length; i++) {
              await new Promise((res, rej) => {
                const putReq = store.put(values[i], keys[i])
                putReq.onsuccess = () => res(true)
                putReq.onerror = () => rej(putReq.error)
              })
            }
            console.log(`  ✅ ${storeName}: ${keys.length} 条 (key-value格式)`)
          } else if (Array.isArray(storeData)) {
            // 旧格式：数组，用 id 或索引作为 key
            for (const record of storeData) {
              const key = record.id || record.chatId || String(Date.now() + Math.random())
              await new Promise((res, rej) => {
                const putReq = store.put(record, key)
                putReq.onsuccess = () => res(true)
                putReq.onerror = () => rej(putReq.error)
              })
            }
            console.log(`  ✅ ${storeName}: ${storeData.length} 条 (数组格式)`)
          }
        }
        
        db.close()
        resolve()
      } catch (err) {
        db.close()
        reject(err)
      }
    }
    
    request.onerror = () => {
      clearTimeout(timeout)
      console.error(`  ❌ 打开数据库失败: ${dbName}`, request.error)
      reject(request.error)
    }
    
    request.onblocked = () => {
      clearTimeout(timeout)
      console.warn(`  ⚠️ 数据库被占用: ${dbName}，尝试继续...`)
      // 被占用时也尝试继续
    }
  })
}
