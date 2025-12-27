/**
 * 存储诊断工具
 * 帮助诊断和清理存储空间问题
 */

/**
 * 获取 localStorage 详细使用情况
 */
export function analyzeLocalStorage(): {
  totalSize: number
  items: Array<{ key: string; size: number; sizeStr: string }>
  sizeStr: string
} {
  let total = 0
  const items: Array<{ key: string; size: number; sizeStr: string }> = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const value = localStorage.getItem(key) || ''
    const size = (key.length + value.length) * 2 // UTF-16 编码，每个字符2字节
    total += size
    items.push({
      key,
      size,
      sizeStr: formatSize(size)
    })
  }

  items.sort((a, b) => b.size - a.size)

  return {
    totalSize: total,
    items,
    sizeStr: formatSize(total)
  }
}

/**
 * 获取 IndexedDB 使用情况
 */
export async function analyzeIndexedDB(): Promise<{
  databases: Array<{
    name: string
    stores: Array<{ name: string; count: number; estimatedSize: string }>
    totalEstimatedSize: string
  }>
  totalEstimatedSize: string
}> {
  const knownDBs = [
    'simple-chat-messages',
    'moments-storage', 
    'characters-db',
    'AppStorage',
    'EmojiDB',
    'ChatListDB',
    'IconDB',
    'BackgroundDB',
    'CouplePhotosDB',
    'ForumCommentsDB',
    'InstagramDMDB'
  ]

  const databases: Array<{
    name: string
    stores: Array<{ name: string; count: number; estimatedSize: string }>
    totalEstimatedSize: string
  }> = []

  let grandTotal = 0

  for (const dbName of knownDBs) {
    try {
      const result = await analyzeDatabase(dbName)
      if (result) {
        databases.push(result)
        // 估算大小
        const dbSize = result.stores.reduce((sum, store) => {
          const match = store.estimatedSize.match(/(\d+\.?\d*)/)
          if (match) {
            const num = parseFloat(match[1])
            if (store.estimatedSize.includes('MB')) return sum + num * 1024 * 1024
            if (store.estimatedSize.includes('KB')) return sum + num * 1024
            return sum + num
          }
          return sum
        }, 0)
        grandTotal += dbSize
      }
    } catch (e) {
      // 数据库不存在，跳过
    }
  }

  return {
    databases,
    totalEstimatedSize: formatSize(grandTotal)
  }
}

async function analyzeDatabase(dbName: string): Promise<{
  name: string
  stores: Array<{ name: string; count: number; estimatedSize: string }>
  totalEstimatedSize: string
} | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName)

    request.onerror = () => resolve(null)

    request.onsuccess = async () => {
      const db = request.result
      const storeNames = Array.from(db.objectStoreNames)

      if (storeNames.length === 0) {
        db.close()
        resolve(null)
        return
      }

      const stores: Array<{ name: string; count: number; estimatedSize: string }> = []
      let totalSize = 0

      for (const storeName of storeNames) {
        try {
          const tx = db.transaction(storeName, 'readonly')
          const store = tx.objectStore(storeName)

          // 获取记录数
          const countRequest = store.count()
          const count = await new Promise<number>((res) => {
            countRequest.onsuccess = () => res(countRequest.result)
            countRequest.onerror = () => res(0)
          })

          // 估算大小（获取所有数据并JSON序列化）
          const getAllRequest = store.getAll()
          const data = await new Promise<any[]>((res) => {
            getAllRequest.onsuccess = () => res(getAllRequest.result || [])
            getAllRequest.onerror = () => res([])
          })

          let estimatedSize = 0
          try {
            const jsonStr = JSON.stringify(data)
            estimatedSize = new Blob([jsonStr]).size
          } catch (e) {
            // Blob 可能存在，直接估算
            estimatedSize = count * 1024 // 粗略估计每条1KB
          }

          totalSize += estimatedSize
          stores.push({
            name: storeName,
            count,
            estimatedSize: formatSize(estimatedSize)
          })
        } catch (e) {
          stores.push({
            name: storeName,
            count: 0,
            estimatedSize: '未知'
          })
        }
      }

      db.close()
      resolve({
        name: dbName,
        stores,
        totalEstimatedSize: formatSize(totalSize)
      })
    }
  })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/**
 * 打印完整的存储诊断报告
 */
export async function printDiagnosticReport(): Promise<void> {
  console.log('═══════════════════════════════════════')
  console.log('📊 存储空间诊断报告')
  console.log('═══════════════════════════════════════')

  // localStorage
  console.log('\n📁 LocalStorage 使用情况:')
  const ls = analyzeLocalStorage()
  console.log(`总计: ${ls.sizeStr} (限制约 5MB)`)
  console.log('\n前10大项目:')
  ls.items.slice(0, 10).forEach(item => {
    console.log(`  ${item.key}: ${item.sizeStr}`)
  })

  // IndexedDB
  console.log('\n📁 IndexedDB 使用情况:')
  const idb = await analyzeIndexedDB()
  console.log(`总计: ${idb.totalEstimatedSize}`)
  idb.databases.forEach(db => {
    console.log(`\n  🗃️ ${db.name} (${db.totalEstimatedSize}):`)
    db.stores.forEach(store => {
      console.log(`    - ${store.name}: ${store.count} 条, ${store.estimatedSize}`)
    })
  })

  // 浏览器存储配额
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate()
    console.log('\n📊 浏览器存储配额:')
    console.log(`  已用: ${formatSize(estimate.usage || 0)}`)
    console.log(`  配额: ${formatSize(estimate.quota || 0)}`)
    console.log(`  使用率: ${((estimate.usage || 0) / (estimate.quota || 1) * 100).toFixed(2)}%`)
  }

  console.log('\n═══════════════════════════════════════')
}

/**
 * 清理旧的聊天消息（保留最近N条）
 */
export async function cleanupOldMessages(keepCount: number = 100): Promise<void> {
  console.log(`🧹 开始清理旧消息，每个对话保留最近 ${keepCount} 条...`)

  const dbName = 'simple-chat-messages'
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName)

    request.onerror = () => {
      console.log('❌ 打开消息数据库失败')
      reject(new Error('打开数据库失败'))
    }

    request.onsuccess = async () => {
      const db = request.result
      const storeNames = Array.from(db.objectStoreNames)
      
      let totalCleaned = 0

      for (const storeName of storeNames) {
        try {
          const tx = db.transaction(storeName, 'readwrite')
          const store = tx.objectStore(storeName)

          // 获取所有数据
          const getAllRequest = store.getAll()
          const getAllKeysRequest = store.getAllKeys()

          const [data, keys] = await Promise.all([
            new Promise<any[]>((res) => {
              getAllRequest.onsuccess = () => res(getAllRequest.result || [])
              getAllRequest.onerror = () => res([])
            }),
            new Promise<IDBValidKey[]>((res) => {
              getAllKeysRequest.onsuccess = () => res(getAllKeysRequest.result || [])
              getAllKeysRequest.onerror = () => res([])
            })
          ])

          // 如果数据超过保留数量
          if (data.length > keepCount) {
            const deleteCount = data.length - keepCount
            console.log(`  ${storeName}: ${data.length} 条，需删除 ${deleteCount} 条`)

            // 删除最旧的消息
            const tx2 = db.transaction(storeName, 'readwrite')
            const store2 = tx2.objectStore(storeName)

            // 先清空，再写入保留的
            await new Promise<void>((res) => {
              const clearReq = store2.clear()
              clearReq.onsuccess = () => res()
              clearReq.onerror = () => res()
            })

            const tx3 = db.transaction(storeName, 'readwrite')
            const store3 = tx3.objectStore(storeName)
            const kept = data.slice(-keepCount) // 保留最新的

            for (let i = 0; i < kept.length; i++) {
              store3.put(kept[i], keys[data.length - keepCount + i])
            }

            totalCleaned += deleteCount
          }
        } catch (e) {
          console.warn(`  ⚠️ 清理 ${storeName} 失败:`, e)
        }
      }

      db.close()
      console.log(`✅ 清理完成，共删除 ${totalCleaned} 条旧消息`)
      resolve()
    }
  })
}

/**
 * 清理表情包（删除所有）
 */
export async function clearEmojis(): Promise<void> {
  console.log('🧹 开始清理表情包...')
  
  // 清理 IndexedDB
  try {
    const request = indexedDB.open('EmojiDB')
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const db = request.result
        if (db.objectStoreNames.contains('emojis')) {
          const tx = db.transaction('emojis', 'readwrite')
          const store = tx.objectStore('emojis')
          const clearReq = store.clear()
          clearReq.onsuccess = () => {
            console.log('✅ IndexedDB 表情包已清理')
            db.close()
            resolve()
          }
          clearReq.onerror = () => {
            db.close()
            reject(clearReq.error)
          }
        } else {
          db.close()
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn('IndexedDB清理失败:', e)
  }

  // 清理 localStorage
  localStorage.removeItem('custom_emojis')
  console.log('✅ localStorage 表情包已清理')
}

/**
 * 清理壁纸和图片
 */
export async function clearImages(): Promise<void> {
  console.log('🧹 开始清理壁纸和图片...')
  
  try {
    const request = indexedDB.open('AppStorage')
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const db = request.result
        if (db.objectStoreNames.contains('images')) {
          const tx = db.transaction('images', 'readwrite')
          const store = tx.objectStore('images')
          const clearReq = store.clear()
          clearReq.onsuccess = () => {
            console.log('✅ 图片已清理')
            db.close()
            resolve()
          }
          clearReq.onerror = () => {
            db.close()
            reject(clearReq.error)
          }
        } else {
          db.close()
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn('清理失败:', e)
  }
}

/**
 * 🔥 从localStorage备份恢复联系人/角色到IndexedDB
 */
export async function restoreCharactersFromBackup(): Promise<{
  restoredCount: number
  success: boolean
}> {
  console.log('🔄 开始从备份恢复联系人...')
  
  try {
    const backup = localStorage.getItem('characters_backup')
    if (!backup) {
      console.log('ℹ️ 没有找到联系人备份')
      return { restoredCount: 0, success: false }
    }
    
    const parsed = JSON.parse(backup)
    const characters = parsed.characters
    
    if (!characters || !Array.isArray(characters) || characters.length === 0) {
      console.log('ℹ️ 备份为空')
      return { restoredCount: 0, success: false }
    }
    
    // 打开IndexedDB
    const dbName = 'DouzhiDB'
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    // 检查当前IndexedDB中的角色数量
    const storeName = 'characters'
    let existingCharacters: any[] = []
    
    try {
      const tx = db.transaction([storeName], 'readonly')
      const store = tx.objectStore(storeName)
      const getReq = store.get('all')
      existingCharacters = await new Promise<any[]>((resolve) => {
        getReq.onsuccess = () => resolve(getReq.result || [])
        getReq.onerror = () => resolve([])
      })
    } catch (e) {
      existingCharacters = []
    }
    
    // 如果备份比IndexedDB中的数据更多，则恢复
    if (characters.length > existingCharacters.length) {
      const tx = db.transaction([storeName], 'readwrite')
      const store = tx.objectStore(storeName)
      
      await new Promise<void>((resolve, reject) => {
        const putReq = store.put(characters, 'all')
        putReq.onsuccess = () => resolve()
        putReq.onerror = () => reject(putReq.error)
      })
      
      console.log(`✅ 恢复了 ${characters.length} 个联系人 (原有 ${existingCharacters.length} 个)`)
      db.close()
      return { restoredCount: characters.length, success: true }
    } else {
      console.log(`ℹ️ IndexedDB已有 ${existingCharacters.length} 个联系人，备份 ${characters.length} 个，跳过`)
      db.close()
      return { restoredCount: 0, success: false }
    }
  } catch (e) {
    console.error('❌ 恢复联系人失败:', e)
    return { restoredCount: 0, success: false }
  }
}

/**
 * 🔥 从localStorage备份恢复聊天记录到IndexedDB
 * 用于聊天记录丢失时的紧急恢复
 */
export async function restoreFromBackups(): Promise<{ 
  restoredCount: number
  totalMessages: number
  chatIds: string[]
}> {
  console.log('🔄 开始从备份恢复聊天记录...')
  
  let restoredCount = 0
  let totalMessages = 0
  const chatIds: string[] = []
  
  // 找出所有msg_backup_开头的key
  const backupKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('msg_backup_')) {
      backupKeys.push(key)
    }
  }
  
  console.log(`📦 发现 ${backupKeys.length} 个备份文件`)
  
  // 打开IndexedDB
  const dbName = 'DouzhiDB'
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  
  // 恢复每个备份
  for (const backupKey of backupKeys) {
    try {
      const backup = localStorage.getItem(backupKey)
      if (!backup) continue
      
      const parsed = JSON.parse(backup)
      const messages = parsed.messages
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        console.log(`  ⚠️ ${backupKey}: 空备份，跳过`)
        continue
      }
      
      // 提取chatId
      const chatId = backupKey.replace('msg_backup_', '')
      
      // 检查IndexedDB中是否已有数据
      const storeName = 'messages'
      let existingMessages: any[] = []
      
      try {
        const tx = db.transaction([storeName], 'readonly')
        const store = tx.objectStore(storeName)
        const getReq = store.get(chatId)
        existingMessages = await new Promise<any[]>((resolve) => {
          getReq.onsuccess = () => resolve(getReq.result || [])
          getReq.onerror = () => resolve([])
        })
      } catch (e) {
        existingMessages = []
      }
      
      // 如果备份比IndexedDB中的数据更多，则恢复
      if (messages.length > existingMessages.length) {
        const tx = db.transaction([storeName], 'readwrite')
        const store = tx.objectStore(storeName)
        
        await new Promise<void>((resolve, reject) => {
          const putReq = store.put(messages, chatId)
          putReq.onsuccess = () => resolve()
          putReq.onerror = () => reject(putReq.error)
        })
        
        console.log(`  ✅ ${chatId}: 恢复 ${messages.length} 条消息 (原有 ${existingMessages.length} 条)`)
        restoredCount++
        totalMessages += messages.length
        chatIds.push(chatId)
      } else {
        console.log(`  ℹ️ ${chatId}: IndexedDB已有 ${existingMessages.length} 条，备份 ${messages.length} 条，跳过`)
      }
    } catch (e) {
      console.error(`  ❌ 恢复 ${backupKey} 失败:`, e)
    }
  }
  
  db.close()
  
  console.log(`✅ 恢复完成: ${restoredCount} 个聊天，共 ${totalMessages} 条消息`)
  
  return { restoredCount, totalMessages, chatIds }
}

/**
 * 🔥 清理消息备份文件（msg_backup_*）
 * 这些备份文件是为了防止数据丢失，但会占用大量LocalStorage空间
 */
export function clearMessageBackups(): { count: number; freedSize: number; freedSizeStr: string } {
  console.log('🧹 开始清理消息备份文件...')
  
  let count = 0
  let freedSize = 0
  const keysToDelete: string[] = []
  
  // 找出所有msg_backup_开头的key
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('msg_backup_')) {
      const value = localStorage.getItem(key) || ''
      const size = (key.length + value.length) * 2
      keysToDelete.push(key)
      freedSize += size
      console.log(`  🗑️ 待删除: ${key} (${formatSize(size)})`)
    }
  }
  
  // 执行删除
  keysToDelete.forEach(key => {
    localStorage.removeItem(key)
    count++
  })
  
  console.log(`✅ 已清理 ${count} 个备份文件，释放 ${formatSize(freedSize)} 空间`)
  
  return {
    count,
    freedSize,
    freedSizeStr: formatSize(freedSize)
  }
}

/**
 * 紧急清理 - 释放最大空间
 * 🔥🔥🔥 关键修复：不再删除消息备份和消息数据！
 */
export async function emergencyCleanup(): Promise<void> {
  console.warn('🚨 执行紧急清理...')
  
  // 🔥🔥🔥 不再删除消息备份！这是数据恢复的最后手段
  // clearMessageBackups() // 已禁用，防止数据丢失
  console.log('⚠️ 跳过消息备份清理，保护用户聊天数据')
  
  // 1. 清理 localStorage 中的大数据（但保护消息备份）
  const ls = analyzeLocalStorage()
  ls.items.forEach(item => {
    // 🔥 保护消息备份和关键设置
    const criticalKeys = ['user_info', 'characters', 'chat_list', 'api_config', 'app_settings', 'msg_backup_']
    if (item.size > 100 * 1024 && !criticalKeys.some(k => item.key.includes(k))) {
      localStorage.removeItem(item.key)
      console.log(`  🗑️ 已删除: ${item.key} (${item.sizeStr})`)
    }
  })

  // 2. 只清理表情包，不删除消息！
  await clearEmojis()
  // 🔥🔥🔥 不再清理消息！用户的聊天记录是核心数据
  // await cleanupOldMessages(50) // 已禁用，防止数据丢失
  console.log('⚠️ 跳过消息清理，保护用户聊天数据')
  
  console.log('✅ 紧急清理完成（已保护聊天数据），请刷新页面')
}

// 暴露到全局
if (typeof window !== 'undefined') {
  (window as any).storageDiag = {
    report: printDiagnosticReport,
    analyzeLS: analyzeLocalStorage,
    analyzeIDB: analyzeIndexedDB,
    cleanupMessages: cleanupOldMessages,
    clearEmojis: clearEmojis,
    clearImages: clearImages,
    clearBackups: clearMessageBackups,
    emergency: emergencyCleanup
  }
  
  console.log('💡 存储诊断工具已加载，可用命令:')
  console.log('  - window.storageDiag.report()        // 打印完整诊断报告')
  console.log('  - window.storageDiag.cleanupMessages(50)  // 清理旧消息，保留最近50条')
  console.log('  - window.storageDiag.clearEmojis()   // 清理所有表情包')
  console.log('  - window.storageDiag.clearImages()   // 清理所有壁纸图片')
  console.log('  - window.storageDiag.clearBackups()  // 🔥 清理消息备份文件')
  console.log('  - window.storageDiag.emergency()     // 紧急清理（释放最大空间）')
}
