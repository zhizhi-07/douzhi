/**
 * 数据管理工具
 * 导出、导入、清除所有数据
 */

import { clearMessageCache } from './simpleMessageManager'

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
 * 🔥 进度回调类型
 */
export type ProgressCallback = (stage: string, percent: number) => void

/**
 * 🔥 美化数据的数据库列表
 */
const STYLE_DB_NAMES = [
  'AppStorage',        // 应用图片
  'AvatarStorage',     // 头像图片
  'BackgroundStorage', // 壁纸
  'IconStorage',       // 图标
  'FontStorage',       // 字体
  'BubbleStyleDB',     // 气泡样式
  'EmojiDB',           // 表情包
  'kiro_avatar_library', // 头像库
]

/**
 * 🔥 聊天数据的数据库列表
 */
const CHAT_DB_NAMES = [
  'DouzhiDB',          // 主数据库（角色、消息、朋友圈、情侣空间等）
  'AILocationDB',      // AI位置
  'UnifiedMemoryDB',   // 🔥 记忆系统
  'CouplePhotosDB',    // 🔥 情侣照片
  'forum_db',          // 论坛帖子
  'forum-comments-db', // 论坛评论
  'topic_chat_db',     // 话题聊天
  'douzhi_device',     // 设备ID
]

/**
 * 🔥 导出美化数据（头像/图标/壁纸/气泡/字体/表情包）
 */
export async function exportStyleData(onProgress?: ProgressCallback): Promise<void> {
  try {
    console.log('📦 开始导出美化数据...')
    onProgress?.('准备导出美化数据...', 0)
    
    const chunks: string[] = []
    chunks.push('{\n')
    chunks.push(`"type":"style",\n`)
    chunks.push(`"version":"2.2",\n`)
    chunks.push(`"exportTime":"${new Date().toISOString()}",\n`)
    chunks.push(`"note":"美化数据：头像/图标/壁纸/气泡/字体/表情包",\n`)
    chunks.push(`"indexedDB":{`)
    
    let exportedCount = 0
    for (let i = 0; i < STYLE_DB_NAMES.length; i++) {
      const dbName = STYLE_DB_NAMES[i]
      const isLast = i === STYLE_DB_NAMES.length - 1
      
      try {
        onProgress?.(`导出 ${dbName}...`, Math.round((i / STYLE_DB_NAMES.length) * 90) + 5)
        console.log(`📦 导出美化数据: ${dbName}`)
        
        const dbChunks = await exportIndexedDBStreaming(dbName)
        if (dbChunks && dbChunks.length > 0) {
          if (exportedCount > 0) chunks.push(',')
          chunks.push(`"${dbName}":`)
          chunks.push(...dbChunks)
          exportedCount++
          console.log(`  ✅ ${dbName} 导出成功`)
        }
        
        await yieldToMain()
      } catch (err) {
        console.warn(`  ⚠️ ${dbName} 导出失败:`, err)
      }
    }
    
    chunks.push(`}\n}`)
    
    onProgress?.('生成备份文件...', 95)
    const blob = new Blob(chunks, { type: 'application/json' })
    console.log(`📦 美化数据大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'douzhi_style_backup.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    onProgress?.('完成!', 100)
    console.log('✅ 美化数据导出成功！')
  } catch (error) {
    console.error('❌ 导出美化数据失败:', error)
    throw error
  }
}

/**
 * 🔥 导出聊天数据（聊天记录/角色/配置设置）
 */
export async function exportChatData(onProgress?: ProgressCallback): Promise<void> {
  try {
    // 1. 导出 localStorage 数据（过滤掉临时备份数据）
    console.log('📦 开始导出 localStorage...')
    const localStorageData: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        // 跳过消息备份（这些数据在 IndexedDB 里有）
        if (key.startsWith('msg_backup_')) continue
        localStorageData[key] = localStorage.getItem(key) || ''
      }
    }
    console.log(`✅ localStorage 导出完成，共 ${Object.keys(localStorageData).length} 项`)

    // 2. 🔥 流式导出 IndexedDB，边读边序列化
    console.log('📦 开始流式导出聊天数据...')
    
    // 🔥 直接构建 chunks，不保存中间数据
    const chunks: string[] = []
    
    // 写入头部
    chunks.push('{\n')
    chunks.push(`"type":"chat",\n`)
    chunks.push(`"version":"2.2",\n`)
    chunks.push(`"exportTime":"${new Date().toISOString()}",\n`)
    chunks.push(`"note":"聊天数据：角色/聊天记录/朋友圈/论坛/配置设置",\n`)
    
    // 写入 localStorage
    onProgress?.('导出 localStorage...', 5)
    try {
      chunks.push(`"localStorage":${JSON.stringify(localStorageData)},\n`)
    } catch (e) {
      console.warn('⚠️ localStorage 序列化失败')
      chunks.push(`"localStorage":{},\n`)
    }
    
    // 🔥 流式写入 IndexedDB（只导出聊天相关数据库）
    chunks.push(`"indexedDB":{`)
    
    let exportedCount = 0
    for (let i = 0; i < CHAT_DB_NAMES.length; i++) {
      const dbName = CHAT_DB_NAMES[i]
      
      try {
        onProgress?.(`导出 ${dbName}...`, Math.round((i / CHAT_DB_NAMES.length) * 80) + 10)
        console.log(`📦 流式导出: ${dbName}`)
        
        // 🔥 聊天数据导出时清理 base64 图片/音频，大幅减少文件大小
        const dbChunks = await exportIndexedDBStreaming(dbName, true)
        if (dbChunks && dbChunks.length > 0) {
          if (exportedCount > 0) chunks.push(',')
          chunks.push(`"${dbName}":`)
          chunks.push(...dbChunks)
          exportedCount++
          console.log(`  ✅ ${dbName} 导出成功`)
        }
        
        await yieldToMain()
      } catch (err) {
        console.warn(`  ⚠️ ${dbName} 导出失败:`, err)
      }
    }
    
    chunks.push(`}\n`)
    chunks.push('}')
    
    console.log('✅ IndexedDB 导出完成')
    onProgress?.('生成备份文件...', 92)
    
    // 合并为 Blob（不会有字符串长度限制）
    const blob = new Blob(chunks, { type: 'application/json' })
    console.log(`📦 备份文件大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'douzhi_chat_backup.json'
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
 * 导入数据（兼容聊天数据和美化数据两种格式）
 * 🔥 完全重写，解决所有导入问题
 */
export async function importAllData(file: File, onProgress?: ProgressCallback): Promise<void> {
  try {
    console.log('📦 开始导入数据...')
    console.log(`📦 文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
    onProgress?.('读取文件...', 5)

    // 🔥 1. 读取文件内容
    const text = await file.text()
    onProgress?.('解析数据...', 15)
    
    // 🔥 2. 解析 JSON - 使用 try-catch 确保安全
    let data: any
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('JSON 解析失败:', e)
      throw new Error('文件格式错误，无法解析')
    }

    // 🔥 3. 验证数据格式
    if (!data || typeof data !== 'object') {
      throw new Error('无效的备份数据')
    }

    // 兼容旧版本和新版本
    const hasVersion = data.version && data.exportTime
    const hasIndexedDB = data.indexedDB && typeof data.indexedDB === 'object'
    
    if (!hasVersion && !hasIndexedDB) {
      throw new Error('无法识别的备份格式')
    }

    // 🔥 检测备份类型
    const backupType = data.type || 'chat' // 默认为聊天数据（兼容旧版本）
    console.log(`📅 备份时间: ${data.exportTime || '未知'}`)
    console.log(`📦 备份版本: ${data.version || '旧版'}`)
    console.log(`📦 备份类型: ${backupType === 'style' ? '美化数据' : '聊天数据'}`)

    onProgress?.('准备导入...', 18)
    
    // 🔥 只有聊天数据才需要清空 localStorage
    if (backupType === 'chat') {
      onProgress?.('清空旧数据...', 20)
      
      // 🔥 先保存用户登录信息，防止丢失（这些信息必须保留！）
      const savedUserInfo = localStorage.getItem('user_info')
      const savedApiConfig = localStorage.getItem('api_config')
      const savedInviteCode = localStorage.getItem('invite_code')
      const savedDeviceId = localStorage.getItem('device_id')
      console.log('💾 保存用户登录信息...')
      
      console.log('🗑️ 清空旧的 localStorage...')
      localStorage.clear()

      // 导入 localStorage
      if (data.localStorage) {
        console.log('📦 开始导入 localStorage...')
        let successCount = 0
        let failCount = 0
        
        for (const key of Object.keys(data.localStorage)) {
          // 🔥 跳过登录相关的key，保持当前登录状态
          if (['user_info', 'api_config', 'invite_code', 'device_id'].includes(key)) {
            console.log(`  ⏭️ 跳过登录信息: ${key}`)
            continue
          }
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
      
      // 🔥 必须恢复用户登录信息（不管备份里有没有）
      if (savedUserInfo) {
        localStorage.setItem('user_info', savedUserInfo)
        console.log('✅ 恢复用户登录信息')
      }
      if (savedApiConfig) {
        localStorage.setItem('api_config', savedApiConfig)
        console.log('✅ 恢复 API 配置')
      }
      if (savedInviteCode) {
        localStorage.setItem('invite_code', savedInviteCode)
        console.log('✅ 恢复邀请码')
      }
      if (savedDeviceId) {
        localStorage.setItem('device_id', savedDeviceId)
        console.log('✅ 恢复设备ID')
      }
    } else {
      console.log('📦 美化数据导入，跳过 localStorage')
    }

    // 4. 导入 IndexedDB
    if (data.indexedDB) {
      onProgress?.('导入数据库...', 30)
      console.log('📦 开始导入 IndexedDB...')

      // 🔥 兼容旧备份：将旧数据库名映射到新的
      const oldToNewDbMap: Record<string, string> = {
        'simple-chat-messages': 'DouzhiDB',
        'moments-storage': 'DouzhiDB', 
        'characters-db': 'DouzhiDB',
        'BubbleDB': 'BubbleStyleDB',      // 旧名称 -> 正确名称
        'LocationDB': 'AILocationDB',     // 旧名称 -> 正确名称
      }
      
      // 🔥 旧 store 名称映射到新名称
      const oldStoreMap: Record<string, string> = {
        'chats': 'messages',              // 旧的聊天记录 store
        'chat_messages': 'messages',      // 另一种旧名称
        'all_characters': 'characters',   // 旧的角色 store
        'character_list': 'characters',   // 另一种旧名称
      }

      const dbNames = Object.keys(data.indexedDB)
      for (let i = 0; i < dbNames.length; i++) {
        const dbName = dbNames[i]
        try {
          // 检查是否是旧格式数据库名
          const targetDb = oldToNewDbMap[dbName] || dbName
          
          onProgress?.(`导入 ${targetDb}...`, 30 + Math.round((i / dbNames.length) * 50))
          
          if (oldToNewDbMap[dbName]) {
            console.log(`  🔄 转换旧格式: ${dbName} -> ${targetDb}`)
          }
          
          // 🔥 转换旧 store 名称
          const dbData = data.indexedDB[dbName]
          const convertedData: Record<string, any> = {}
          for (const storeName of Object.keys(dbData)) {
            const targetStore = oldStoreMap[storeName] || storeName
            if (targetStore !== storeName) {
              console.log(`  🔄 转换旧 store: ${storeName} -> ${targetStore}`)
            }
            convertedData[targetStore] = dbData[storeName]
          }
          
          await importIndexedDB(targetDb, convertedData)
          console.log(`  ✅ ${targetDb} 导入成功`)
          
          // 🔥 导入完成后释放该数据库的数据，减少内存占用
          delete data.indexedDB[dbName]
          await yieldToMain()
        } catch (err) {
          console.warn(`  ⚠️ ${dbName} 导入失败:`, err)
          // 🔥 即使失败也释放数据
          delete data.indexedDB[dbName]
        }
      }

      console.log('✅ IndexedDB 导入完成')
      // 🔥 释放整个 indexedDB 对象
      data.indexedDB = null
    }

    // 🔥 5. 清除旧的 localStorage 消息备份（防止覆盖新导入的数据）
    console.log('🗑️ 清除旧的 localStorage 消息备份...')
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('msg_backup_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`  🗑️ 删除旧备份: ${key}`)
    })
    console.log(`✅ 清除了 ${keysToRemove.length} 个旧的消息备份`)

    // 🔥 6. 清空内存缓存，防止旧缓存覆盖新导入的数据
    onProgress?.('清理缓存...', 95)
    clearMessageCache()
    console.log('✅ 已清空内存缓存')

    onProgress?.('完成!', 100)
    console.log('✅ 数据导入成功！')
    
    // 🔥 导入完成后必须刷新页面，否则数据库连接会被阻塞
    console.log('🔄 2秒后自动刷新页面...')
    setTimeout(() => {
      window.location.reload()
    }, 2000)
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
 * 🔥 让主线程喘息，避免卡死
 */
function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * 🔥 清理消息中的大型 base64 数据
 */
function cleanMessageData(value: any): any {
  if (!value) return value
  
  // 如果是消息数组
  if (Array.isArray(value)) {
    return value.map(msg => {
      if (msg && typeof msg === 'object') {
        const cleaned = { ...msg }
        // 清理图片消息的 base64 数据
        if (cleaned.image && typeof cleaned.image === 'string' && cleaned.image.startsWith('data:')) {
          cleaned.image = '[BASE64_IMAGE_REMOVED]'
        }
        // 清理语音消息的 base64 数据
        if (cleaned.audio && typeof cleaned.audio === 'string' && cleaned.audio.startsWith('data:')) {
          cleaned.audio = '[BASE64_AUDIO_REMOVED]'
        }
        // 清理头像的 base64 数据（如果太大）
        if (cleaned.avatar && typeof cleaned.avatar === 'string' && cleaned.avatar.length > 1000) {
          cleaned.avatar = '[AVATAR_REMOVED]'
        }
        return cleaned
      }
      return msg
    })
  }
  
  return value
}

/**
 * 🔥 流式导出单个 store 并序列化
 * 边读边序列化，逐条写入，避免 join 时字符串超限
 */
async function exportStoreToJsonChunks(
  db: IDBDatabase, 
  storeName: string,
  cleanData: boolean = false // 是否清理 base64 数据
): Promise<string[]> {
  // 🔥 分别收集 keys 和 values，每个都是独立的字符串片段
  const keyParts: string[] = []
  const valueParts: string[] = []
  
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const cursorReq = store.openCursor()
      
      let count = 0
      
      cursorReq.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null
        if (cursor) {
          try {
            // 🔥 逐条序列化，加上逗号分隔符
            const keyJson = JSON.stringify(cursor.key)
            
            // 🔥 如果需要清理数据（消息 store）
            let value = cursor.value
            if (cleanData && storeName === 'messages') {
              value = cleanMessageData(value)
            }
            
            const valueJson = JSON.stringify(value)
            
            if (count > 0) {
              keyParts.push(',')
              valueParts.push(',')
            }
            keyParts.push(keyJson)
            valueParts.push(valueJson)
            count++
          } catch (e) {
            console.warn(`  ⚠️ 跳过无法序列化的记录`)
          }
          cursor.continue()
        } else {
          // 🔥 游标结束，组装最终 chunks（不使用 join）
          const result: string[] = []
          result.push(`{"keys":[`)
          result.push(...keyParts)
          result.push(`],"values":[`)
          result.push(...valueParts)
          result.push(`]}`)
          console.log(`  - ${storeName}: ${count} 条`)
          resolve(result)
        }
      }
      
      cursorReq.onerror = () => {
        console.warn(`  ⚠️ ${storeName} 读取失败`)
        resolve([`{"keys":[],"values":[]}`])
      }
    } catch (err) {
      console.warn(`  ⚠️ ${storeName} 事务失败`)
      resolve([`{"keys":[],"values":[]}`])
    }
  })
}

/**
 * 🔥 流式导出 IndexedDB 数据库
 * 返回 JSON chunks，不在内存中保存完整数据
 * @param cleanMessageBase64 是否清理消息中的 base64 数据
 */
async function exportIndexedDBStreaming(dbName: string, cleanMessageBase64: boolean = false): Promise<string[] | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName)
    
    request.onsuccess = async () => {
      const db = request.result
      const allChunks: string[] = []
      
      try {
        const storeNames = Array.from(db.objectStoreNames)
        
        allChunks.push('{')
        
        for (let i = 0; i < storeNames.length; i++) {
          const storeName = storeNames[i]
          
          // 🔥 导出单个 store，如果是 DouzhiDB 的 messages 则清理 base64
          const shouldClean = cleanMessageBase64 && dbName === 'DouzhiDB'
          const storeChunks = await exportStoreToJsonChunks(db, storeName, shouldClean)
          allChunks.push(...storeChunks)
          
          // 添加逗号分隔（除了最后一个）
          if (i < storeNames.length - 1) {
            allChunks.push(',')
          }
          
          // 让主线程喘息
          await yieldToMain()
        }
        
        allChunks.push('}')
        db.close()
        resolve(allChunks)
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
 * 🔥 修复：不删除数据库，直接打开并清空 store
 */
// 🔥 数据库版本号配置（必须与 indexedDBManager.ts 保持一致）
const DB_VERSIONS: Record<string, number> = {
  'DouzhiDB': 4,  // 主数据库版本
  'AppStorage': 1,
  'BubbleStyleDB': 1,
  'AILocationDB': 1,
}

async function importIndexedDB(dbName: string, data: Record<string, any>): Promise<void> {
  console.log(`  🔓 正在导入数据库: ${dbName}`)
  
  // 🔥 获取正确的版本号
  const version = DB_VERSIONS[dbName] || 1
  console.log(`  📌 使用版本号: ${version}`)
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error(`  ❌ 打开数据库超时: ${dbName}，跳过`)
      resolve()
    }, 30000) // 30秒超时
    
    // 🔥 使用正确的版本号打开数据库
    const request = indexedDB.open(dbName, version)
    
    request.onerror = () => {
      clearTimeout(timeout)
      console.error(`  ❌ 打开数据库失败: ${dbName}`, request.error)
      resolve()
    }
    
    // 🔥 如果数据库不存在，会触发 onupgradeneeded
    request.onupgradeneeded = () => {
      const db = request.result
      console.log(`  📦 数据库不存在，创建新数据库: ${dbName}`)
      
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
        const BATCH_SIZE = 50
        
        for (const storeName of Object.keys(data)) {
          if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`  ⚠️ store 不存在，跳过: ${storeName}`)
            continue
          }
          
          // 清空现有数据
          await new Promise((res, rej) => {
            const tx = db.transaction(storeName, 'readwrite')
            const clearReq = tx.objectStore(storeName).clear()
            clearReq.onsuccess = () => res(true)
            clearReq.onerror = () => rej(clearReq.error)
          })
          
          const storeData = data[storeName]
          
          // 🔥 检测数据格式：新格式 { keys, values } 或 旧格式 [records]
          if (storeData && storeData.keys && storeData.values) {
            const { keys, values } = storeData
            for (let i = 0; i < keys.length; i += BATCH_SIZE) {
              const batchEnd = Math.min(i + BATCH_SIZE, keys.length)
              const tx = db.transaction(storeName, 'readwrite')
              const store = tx.objectStore(storeName)
              
              for (let j = i; j < batchEnd; j++) {
                store.put(values[j], keys[j])
              }
              
              await new Promise<void>((res, rej) => {
                tx.oncomplete = () => res()
                tx.onerror = () => rej(tx.error)
              })
              
              await yieldToMain()
            }
            console.log(`  ✅ ${storeName}: ${keys.length} 条 (key-value格式)`)
          } else if (Array.isArray(storeData)) {
            for (let i = 0; i < storeData.length; i += BATCH_SIZE) {
              const batchEnd = Math.min(i + BATCH_SIZE, storeData.length)
              const tx = db.transaction(storeName, 'readwrite')
              const store = tx.objectStore(storeName)
              
              for (let j = i; j < batchEnd; j++) {
                const record = storeData[j]
                const key = record.id || record.chatId || String(Date.now() + Math.random())
                store.put(record, key)
              }
              
              await new Promise<void>((res, rej) => {
                tx.oncomplete = () => res()
                tx.onerror = () => rej(tx.error)
              })
              
              await yieldToMain()
            }
            console.log(`  ✅ ${storeName}: ${storeData.length} 条 (数组格式)`)
          }
          
          await yieldToMain()
        }
        
        db.close()
        resolve()
      } catch (err) {
        db.close()
        reject(err)
      }
    }
    
    request.onblocked = () => {
      clearTimeout(timeout)
      console.warn(`  ⚠️ 数据库被占用: ${dbName}，尝试继续...`)
    }
  })
}

