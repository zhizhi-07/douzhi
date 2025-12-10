/**
 * IndexedDB 存储工具类
 * 用于替代 localStorage，支持更大的存储容量
 */

const DB_NAME = 'WeChatAppDB'
const DB_VERSION = 3

// 存储对象名称
export const STORES = {
  CHARACTERS: 'characters',
  CHATS: 'chats',
  MESSAGES: 'messages',
  SETTINGS: 'settings',
  LOREBOOKS: 'lorebooks',
  MOMENTS: 'moments',
  GROUPS: 'groups',
  EMOJIS: 'emojis'
} as const

/**
 * 初始化数据库
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // 创建角色存储
      if (!db.objectStoreNames.contains(STORES.CHARACTERS)) {
        const characterStore = db.createObjectStore(STORES.CHARACTERS, { keyPath: 'id' })
        characterStore.createIndex('name', 'name', { unique: false })
      }
      
      // 创建聊天存储
      if (!db.objectStoreNames.contains(STORES.CHATS)) {
        const chatStore = db.createObjectStore(STORES.CHATS, { keyPath: 'id' })
        chatStore.createIndex('characterId', 'characterId', { unique: false })
        chatStore.createIndex('lastMessageTime', 'lastMessageTime', { unique: false })
      }
      
      // 创建消息存储
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messageStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' })
        messageStore.createIndex('chatId', 'chatId', { unique: false })
        messageStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
      
      // 创建设置存储
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
      }
      
      // 创建世界书存储
      if (!db.objectStoreNames.contains(STORES.LOREBOOKS)) {
        const lorebookStore = db.createObjectStore(STORES.LOREBOOKS, { keyPath: 'id' })
        lorebookStore.createIndex('name', 'name', { unique: false })
      }
      
      // 创建朋友圈存储
      if (!db.objectStoreNames.contains(STORES.MOMENTS)) {
        const momentStore = db.createObjectStore(STORES.MOMENTS, { keyPath: 'id' })
        momentStore.createIndex('characterId', 'characterId', { unique: false })
        momentStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
      
      // 创建群聊存储
      if (!db.objectStoreNames.contains(STORES.GROUPS)) {
        db.createObjectStore(STORES.GROUPS, { keyPath: 'id' })
      }
      
      // 创建表情包存储
      if (!db.objectStoreNames.contains(STORES.EMOJIS)) {
        const emojiStore = db.createObjectStore(STORES.EMOJIS, { keyPath: 'id' })
        emojiStore.createIndex('addTime', 'addTime', { unique: false })
      }
    }
  })
}

/**
 * 获取数据库实例
 */
let dbInstance: IDBDatabase | null = null

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance
  dbInstance = await initDB()
  return dbInstance
}

/**
 * 通用的增删改查操作
 */

// 添加或更新数据
export async function setItem<T>(storeName: string, data: T): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 获取单个数据
export async function getItem<T>(storeName: string, key: string | number): Promise<T | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)
    
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

// 获取所有数据
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

// 删除数据
export async function deleteItem(storeName: string, key: string | number): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 清空存储
export async function clearStore(storeName: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 通过索引查询
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: any
): Promise<T[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)
    
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * 从 localStorage 迁移数据到 IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
  console.log('开始从 localStorage 迁移数据到 IndexedDB...')
  
  try {
    // 迁移角色数据
    const charactersData = localStorage.getItem('characters')
    if (charactersData) {
      const characters = JSON.parse(charactersData)
      for (const character of characters) {
        await setItem(STORES.CHARACTERS, character)
      }
      console.log(`✅ 迁移了 ${characters.length} 个角色`)
    }
    
    // 迁移聊天数据
    const chatsData = localStorage.getItem('chats')
    if (chatsData) {
      const chats = JSON.parse(chatsData)
      for (const chat of chats) {
        await setItem(STORES.CHATS, chat)
      }
      console.log(`✅ 迁移了 ${chats.length} 个聊天`)
    }
    
    // 迁移消息数据
    const messagesData = localStorage.getItem('messages')
    if (messagesData) {
      const messages = JSON.parse(messagesData)
      for (const message of messages) {
        await setItem(STORES.MESSAGES, message)
      }
      console.log(`✅ 迁移了 ${messages.length} 条消息`)
    }
    
    // 迁移世界书数据
    const lorebooksData = localStorage.getItem('lorebooks')
    if (lorebooksData) {
      const lorebooks = JSON.parse(lorebooksData)
      for (const lorebook of lorebooks) {
        await setItem(STORES.LOREBOOKS, lorebook)
      }
      console.log(`✅ 迁移了 ${lorebooks.length} 个世界书`)
    }
    
    // 迁移朋友圈数据
    const momentsData = localStorage.getItem('moments')
    if (momentsData) {
      const moments = JSON.parse(momentsData)
      for (const moment of moments) {
        await setItem(STORES.MOMENTS, moment)
      }
      console.log(`✅ 迁移了 ${moments.length} 条朋友圈`)
    }
    
    // 迁移群聊数据
    const groupsData = localStorage.getItem('groups')
    if (groupsData) {
      const groups = JSON.parse(groupsData)
      for (const group of groups) {
        await setItem(STORES.GROUPS, group)
      }
      console.log(`✅ 迁移了 ${groups.length} 个群聊`)
    }
    
    // 迁移设置数据
    const settingsKeys = [
      'showStatusBar',
      'apiKey',
      'apiEndpoint',
      'model',
      'temperature',
      'maxTokens'
    ]
    
    for (const key of settingsKeys) {
      const value = localStorage.getItem(key)
      if (value !== null) {
        await setItem(STORES.SETTINGS, { key, value })
      }
    }
    
    console.log('✅ 数据迁移完成！')
    console.log('💡 建议：确认数据正常后，可以清理 localStorage')
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error)
    throw error
  }
}

/**
 * 获取存储使用情况
 */
export async function getStorageInfo(): Promise<{
  storeName: string
  count: number
  estimatedSize: string
}[]> {
  await getDB() // 确保数据库已初始化
  const info: {
    storeName: string
    count: number
    estimatedSize: string
  }[] = []
  
  for (const storeName of Object.values(STORES)) {
    const items = await getAllItems(storeName)
    const size = JSON.stringify(items).length
    info.push({
      storeName,
      count: items.length,
      estimatedSize: `${(size / 1024).toFixed(2)} KB`
    })
  }
  
  return info
}
