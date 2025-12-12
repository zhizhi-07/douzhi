/**
 * 头像库服务
 * 支持两种模式：
 * 1. 描述模式 - 单张上传带描述，AI用 [换头像:描述:xxx] 匹配
 * 2. 标签模式 - 批量上传到标签下，AI用 [换头像:标签:xxx] 随机选择
 */

const DB_NAME = 'kiro_avatar_library'
const DB_VERSION = 3  // 升级版本以触发索引更新
const AVATAR_STORE = 'avatars'
const TAG_STORE = 'tags'

export interface AvatarItem {
  id: string
  imageData: string
  createdAt: number
  description?: string  // 描述模式用
  tagId?: string        // 标签模式用
}

export interface AvatarTag {
  id: string
  name: string
  createdAt: number
}

let dbInstance: IDBDatabase | null = null

export async function initAvatarLibraryDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const tx = (event.target as IDBOpenDBRequest).transaction!
      
      // 头像存储
      if (!db.objectStoreNames.contains(AVATAR_STORE)) {
        const store = db.createObjectStore(AVATAR_STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
        store.createIndex('tagId', 'tagId', { unique: false })
      } else {
        // 已存在的存储，检查并添加缺失的索引
        const store = tx.objectStore(AVATAR_STORE)
        if (!store.indexNames.contains('tagId')) {
          store.createIndex('tagId', 'tagId', { unique: false })
        }
      }
      
      // 标签存储
      if (!db.objectStoreNames.contains(TAG_STORE)) {
        const tagStore = db.createObjectStore(TAG_STORE, { keyPath: 'id' })
        tagStore.createIndex('name', 'name', { unique: true })
      }
    }
  })
}


// ========== 描述模式 ==========

/** 添加带描述的头像 */
export async function addAvatarWithDescription(imageData: string, description: string): Promise<string> {
  const db = await initAvatarLibraryDB()
  const avatar: AvatarItem = {
    id: `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    imageData,
    createdAt: Date.now(),
    description
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([AVATAR_STORE], 'readwrite')
    const request = tx.objectStore(AVATAR_STORE).add(avatar)
    request.onsuccess = () => resolve(avatar.id)
    request.onerror = () => reject(request.error)
  })
}

/** 获取所有带描述的头像 */
export async function getDescriptionAvatars(): Promise<AvatarItem[]> {
  const db = await initAvatarLibraryDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([AVATAR_STORE], 'readonly')
    const request = tx.objectStore(AVATAR_STORE).index('createdAt').openCursor(null, 'prev')
    const avatars: AvatarItem[] = []

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        if (cursor.value.description && !cursor.value.tagId) {
          avatars.push(cursor.value)
        }
        cursor.continue()
      } else {
        resolve(avatars)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

/** 根据描述匹配头像 */
export async function getAvatarByDescription(desc: string): Promise<AvatarItem | null> {
  const avatars = await getDescriptionAvatars()
  // 模糊匹配
  return avatars.find(a => 
    a.description?.includes(desc) || desc.includes(a.description || '')
  ) || null
}

// ========== 标签模式 ==========

/** 创建标签 */
export async function createTag(name: string): Promise<string> {
  const db = await initAvatarLibraryDB()
  const tag: AvatarTag = {
    id: `tag_${Date.now()}`,
    name,
    createdAt: Date.now()
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([TAG_STORE], 'readwrite')
    const request = tx.objectStore(TAG_STORE).add(tag)
    request.onsuccess = () => resolve(tag.id)
    request.onerror = () => reject(request.error)
  })
}

/** 获取所有标签 */
export async function getTags(): Promise<AvatarTag[]> {
  const db = await initAvatarLibraryDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([TAG_STORE], 'readonly')
    const request = tx.objectStore(TAG_STORE).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 删除标签（同时删除该标签下的所有头像） */
export async function deleteTag(tagId: string): Promise<void> {
  const db = await initAvatarLibraryDB()
  
  // 先删除该标签下的所有头像
  const avatars = await getAvatarsByTag(tagId)
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([AVATAR_STORE, TAG_STORE], 'readwrite')
    
    // 删除头像
    const avatarStore = tx.objectStore(AVATAR_STORE)
    avatars.forEach(a => avatarStore.delete(a.id))
    
    // 删除标签
    tx.objectStore(TAG_STORE).delete(tagId)
    
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 添加头像到标签 */
export async function addAvatarToTag(imageData: string, tagId: string): Promise<string> {
  const db = await initAvatarLibraryDB()
  const avatar: AvatarItem = {
    id: `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    imageData,
    createdAt: Date.now(),
    tagId
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction([AVATAR_STORE], 'readwrite')
    const request = tx.objectStore(AVATAR_STORE).add(avatar)
    request.onsuccess = () => resolve(avatar.id)
    request.onerror = () => reject(request.error)
  })
}

/** 获取标签下的所有头像 */
export async function getAvatarsByTag(tagId: string): Promise<AvatarItem[]> {
  const db = await initAvatarLibraryDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([AVATAR_STORE], 'readonly')
    const store = tx.objectStore(AVATAR_STORE)
    
    // 检查索引是否存在，不存在则遍历所有数据
    if (store.indexNames.contains('tagId')) {
      const request = store.index('tagId').getAll(tagId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } else {
      // 备用方案：遍历所有数据过滤
      const request = store.getAll()
      request.onsuccess = () => {
        const all = request.result as AvatarItem[]
        resolve(all.filter(a => a.tagId === tagId))
      }
      request.onerror = () => reject(request.error)
    }
  })
}

/** 根据标签名随机获取一个头像 */
export async function getRandomAvatarByTagName(tagName: string): Promise<AvatarItem | null> {
  const tags = await getTags()
  const tag = tags.find(t => t.name === tagName)
  if (!tag) return null
  
  const avatars = await getAvatarsByTag(tag.id)
  if (avatars.length === 0) return null
  
  return avatars[Math.floor(Math.random() * avatars.length)]
}

// ========== 通用 ==========

/** 删除头像 */
export async function deleteAvatar(id: string): Promise<void> {
  const db = await initAvatarLibraryDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([AVATAR_STORE], 'readwrite')
    const request = tx.objectStore(AVATAR_STORE).delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/** 获取所有头像（兼容旧代码） */
export async function getAvatars(): Promise<AvatarItem[]> {
  return getDescriptionAvatars()
}

/** 按索引获取头像（兼容旧代码） */
export async function getAvatarByIndex(index: number): Promise<AvatarItem | null> {
  if (index < 1) return null
  const avatars = await getDescriptionAvatars()
  return avatars[index - 1] || null
}

/** 获取头像数量（兼容旧代码） */
export async function getAvatarCount(): Promise<number> {
  const avatars = await getDescriptionAvatars()
  return avatars.length
}

/** 添加头像（兼容旧代码） */
export async function addAvatar(imageData: string, name?: string): Promise<string> {
  return addAvatarWithDescription(imageData, name || '')
}

// ========== 头像库模式设置 ==========

export type AvatarLibraryMode = 'description' | 'tag'

/** 获取当前头像库模式 */
export function getAvatarLibraryMode(): AvatarLibraryMode {
  return (localStorage.getItem('avatar_library_mode') as AvatarLibraryMode) || 'description'
}

/** 设置头像库模式 */
export function setAvatarLibraryMode(mode: AvatarLibraryMode): void {
  localStorage.setItem('avatar_library_mode', mode)
}

/** 获取头像库信息（供AI提示词使用） */
export async function getAvatarLibraryInfo(): Promise<string> {
  const mode = getAvatarLibraryMode()
  const [descAvatars, tags] = await Promise.all([getDescriptionAvatars(), getTags()])
  
  if (mode === 'tag') {
    // 标签模式
    if (tags.length === 0) {
      // 没有标签，检查是否有描述头像
      if (descAvatars.length > 0) {
        const descriptions = descAvatars.map(a => a.description).filter(Boolean).join('、')
        return `【头像库】暂无标签，但有描述头像可用
可用描述：${descriptions}
使用方式：[换头像:描述:关键词]`
      }
      return '【头像库】暂无头像'
    }
    const tagNames = tags.map(t => t.name).join('、')
    return `【头像库】可用标签：${tagNames}
使用方式：[换头像:标签:标签名]`
  } else {
    // 描述模式
    if (descAvatars.length === 0) {
      // 没有描述头像，检查是否有标签
      if (tags.length > 0) {
        const tagNames = tags.map(t => t.name).join('、')
        return `【头像库】暂无描述头像，但有标签可用
可用标签：${tagNames}
使用方式：[换头像:标签:标签名]`
      }
      return '【头像库】暂无头像'
    }
    const descriptions = descAvatars.map(a => a.description).filter(Boolean).join('、')
    return `【头像库】可用描述：${descriptions}
使用方式：[换头像:描述:关键词]`
  }
}
