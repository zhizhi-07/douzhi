// 论坛NPC系统

// ========== IndexedDB 帖子存储 ==========
const DB_NAME = 'forum_db'
const DB_VERSION = 1
const POSTS_STORE = 'posts'

let dbInstance: IDBDatabase | null = null
let postsCache: ForumPost[] | null = null // 内存缓存

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(POSTS_STORE)) {
        db.createObjectStore(POSTS_STORE, { keyPath: 'id' })
      }
    }
  })
}

// 从 IndexedDB 加载帖子
async function loadPostsFromDB(forceReload = false): Promise<ForumPost[]> {
  if (postsCache && !forceReload) return postsCache
  
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(POSTS_STORE, 'readonly')
      const store = tx.objectStore(POSTS_STORE)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const rawPosts = request.result || []
        // 修复旧数据：确保npcId是字符串类型
        const posts = rawPosts.map((p: ForumPost) => ({
          ...p,
          npcId: String(p.npcId)
        }))
        // 按时间排序
        posts.sort((a: ForumPost, b: ForumPost) => b.timestamp - a.timestamp)
        postsCache = posts
        console.log(`📖 从IndexedDB加载 ${posts.length} 条帖子`)
        resolve(posts)
      }
      
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

// 保存帖子到 IndexedDB
async function savePostsToDB(posts: ForumPost[]): Promise<void> {
  try {
    const db = await openDB()
    
    // 只保留最近的帖子
    const recentPosts = posts
    
    // 🔥 使用单个事务完成清空和写入，保证原子性
    // 如果写入失败，清空也会回滚
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(POSTS_STORE, 'readwrite')
      const store = tx.objectStore(POSTS_STORE)
      
      // 先清空
      store.clear()
      
      // 再写入所有帖子
      for (const post of recentPosts) {
        try {
          store.put(post)
        } catch (putError) {
          tx.abort()
          reject(putError)
          return
        }
      }
      
      tx.oncomplete = () => {
        // 更新缓存
        postsCache = recentPosts
        console.log(`💾 已保存 ${recentPosts.length} 条帖子到IndexedDB`)
        resolve()
      }
      
      tx.onerror = () => {
        console.error('❌ 帖子保存事务失败:', tx.error)
        reject(tx.error)
      }
      
      tx.onabort = () => {
        console.error('❌ 帖子保存事务被中止:', tx.error)
        // 🔥 事务中止时，尝试恢复缓存
        // 不清空postsCache，保留旧数据
        reject(tx.error)
      }
    })
  } catch (e) {
    console.error('❌ 保存帖子到IndexedDB失败:', e)
    throw e
    // 🔥 失败时不清空缓存，让用户至少能看到旧数据
  }
}

// 🔥 安全添加单个帖子（不清空所有数据）
async function addSinglePost(post: ForumPost): Promise<boolean> {
  try {
    const db = await openDB()
    
    return new Promise((resolve) => {
      const tx = db.transaction(POSTS_STORE, 'readwrite')
      const store = tx.objectStore(POSTS_STORE)
      
      const request = store.put(post)
      
      tx.oncomplete = () => {
        // 更新缓存
        if (postsCache) {
          // 检查是否已存在
          const existingIndex = postsCache.findIndex(p => p.id === post.id)
          if (existingIndex >= 0) {
            postsCache[existingIndex] = post
          } else {
            postsCache.unshift(post)
          }
          // 保持排序
          postsCache.sort((a, b) => b.timestamp - a.timestamp)
          // 限制数量

        }
        console.log(`✅ 帖子已添加: ${post.id}`)
        resolve(true)
      }
      
      tx.onabort = () => resolve(false)
      request.onerror = () => {
        console.error(`❌ 添加帖子失败: ${post.id}`, request.error)
        resolve(false)
      }
    })
  } catch (e) {
    console.error('❌ 添加帖子异常:', e)
    return false
  }
}

// 🔥 安全删除单个帖子
async function deleteSinglePost(postId: string): Promise<boolean> {
  try {
    const db = await openDB()
    
    return new Promise((resolve) => {
      const tx = db.transaction(POSTS_STORE, 'readwrite')
      const store = tx.objectStore(POSTS_STORE)
      
      const request = store.delete(postId)
      
      tx.oncomplete = () => {
        // 更新缓存
        if (postsCache) {
          postsCache = postsCache.filter(p => p.id !== postId)
        }
        console.log(`✅ 帖子已删除: ${postId}`)
        resolve(true)
      }
      
      tx.onabort = () => resolve(false)
      request.onerror = () => {
        console.error(`❌ 删除帖子失败: ${postId}`, request.error)
        resolve(false)
      }
    })
  } catch (e) {
    console.error('❌ 删除帖子异常:', e)
    return false
  }
}

// 迁移 localStorage 到 IndexedDB
async function migratePostsToIndexedDB(): Promise<void> {
  const raw = localStorage.getItem('forum_posts')
  if (!raw) return
  try {
    const posts = JSON.parse(raw)
    if (!Array.isArray(posts) || posts.some(post => typeof post.npcId !== 'string')) return
    const existing = await loadPostsFromDB(true)
    await savePostsToDB([...new Map([...posts, ...existing].map(post => [post.id, post])).values()])
    if (localStorage.getItem('forum_posts') === raw) localStorage.removeItem('forum_posts')
  } catch (error) {
    console.warn('迁移帖子失败，原始数据已保留:', error)
  }
}

// ========================================

export interface ForumNPC {
  id: string
  name: string
  avatar: string
  bio: string
  followers: number
}

export interface ForumPost {
  id: string
  npcId: string // 'user' 表示用户发布
  content: string
  images: number // 图片数量（兼容旧数据）
  imageUrls?: string[] // 🔥 实际图片base64数组
  likes: number
  comments: number
  time: string
  timestamp: number
  isLiked: boolean
  location?: string // 位置
  taggedUsers?: string[] // 标记的用户ID
  music?: {
    name: string
    artist: string
  }
}

// 随机生成NPC名字池
const SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '郑']
const GIVEN_NAMES_1 = ['小', '大', '阿', '老']
const GIVEN_NAMES_2 = ['明', '华', '伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '超', '刚', '平']
const SINGLE_NAMES = ['浩', '悦', '瑞', '欣', '婷', '杰', '宇', '琳', '晨', '雨', '雪', '阳', '萌', '佳', '怡', '凯', '霞', '峰', '颖', '鑫']

const BIOS = [
  '热爱生活，喜欢分享日常 ✨',
  '摄影爱好者 📷',
  '美食博主 🍜',
  '科技发烧友 💻',
  '健身达人 💪',
  '旅行爱好者 🌍',
  '音乐人 🎵',
  '电影迷 🎬',
  '读书人 📚',
  '咖啡爱好者 ☕',
  '宠物控 🐱',
  '手工达人 ✂️',
  '游戏玩家 🎮',
  '跑步爱好者 🏃',
  '吃货一枚 😋',
  '设计师 🎨',
  '程序员 👨‍💻',
  '自由职业者 🌈',
  '学生党 📖',
  '上班族 💼'
]

// 随机生成NPC名字
function randomName(): string {
  const r = Math.random()
  if (r < 0.3) {
    // 单字名 30%
    return SURNAMES[Math.floor(Math.random() * SURNAMES.length)] + 
           SINGLE_NAMES[Math.floor(Math.random() * SINGLE_NAMES.length)]
  } else if (r < 0.6) {
    // 小/阿/大+单字 30%
    return GIVEN_NAMES_1[Math.floor(Math.random() * GIVEN_NAMES_1.length)] + 
           SINGLE_NAMES[Math.floor(Math.random() * SINGLE_NAMES.length)]
  } else {
    // 姓+双字名 40%
    return SURNAMES[Math.floor(Math.random() * SURNAMES.length)] + 
           GIVEN_NAMES_2[Math.floor(Math.random() * GIVEN_NAMES_2.length)] + 
           GIVEN_NAMES_2[Math.floor(Math.random() * GIVEN_NAMES_2.length)]
  }
}

// 生成随机NPC列表
function generateRandomNPCs(count: number = 8): ForumNPC[] {
  const npcs: ForumNPC[] = []
  const usedNames = new Set<string>()
  
  for (let i = 0; i < count; i++) {
    let name = randomName()
    // 避免重名
    while (usedNames.has(name)) {
      name = randomName()
    }
    usedNames.add(name)
    
    npcs.push({
      id: `npc-${i + 1}`,
      name,
      avatar: '/default-avatar.png',
      bio: BIOS[Math.floor(Math.random() * BIOS.length)],
      followers: Math.floor(Math.random() * 5000) + 500
    })
  }
  
  return npcs
}

// 帖子模板
const POST_TEMPLATES = [
  { content: '今天的天气真好，出去散步心情都变好了 ☀️', images: 1 },
  { content: '尝试了新的咖啡店，拿铁的味道很不错！推荐给大家 ☕', images: 3 },
  { content: '夕阳真美，随手拍了几张 🌅', images: 2 },
  { content: '周末的悠闲时光～', images: 4 },
  { content: '和朋友们的聚会，好久没这么开心了！', images: 5 },
  { content: '今天做了顿大餐，色香味俱全 😋', images: 6 },
  { content: '健身打卡第30天！坚持就是胜利 💪', images: 2 },
  { content: '新入手的装备，太爱了！', images: 1 },
  { content: '分享一些最近拍的照片~', images: 9 },
  { content: '日常vlog｜充实的一天', images: 3 }
]

// 获取所有NPC
export function getAllNPCs(): ForumNPC[] {
  const stored = localStorage.getItem('forum_npcs')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // 解析失败，重新生成
      const npcs = generateRandomNPCs(8)
      saveNPCs(npcs)
      return npcs
    }
  }
  // 首次加载，随机生成NPC
  const npcs = generateRandomNPCs(8)
  saveNPCs(npcs)
  return npcs
}

// 保存NPC列表（优化存储：不保存base64头像，太大会导致localStorage爆掉）
export function saveNPCs(npcs: ForumNPC[]) {
  // 清理NPC：只保留最近100个，避免无限增长
  const recentNPCs = npcs.slice(-100)
  
  // 对头像进行压缩：base64头像替换为默认头像（角色头像会在显示时实时获取）
  const compressedNPCs = recentNPCs.map(npc => ({
    ...npc,
    avatar: npc.avatar?.startsWith('data:') ? '/default-avatar.png' : npc.avatar
  }))
  
  try {
    localStorage.setItem('forum_npcs', JSON.stringify(compressedNPCs))
  } catch (e) {
    console.warn('⚠️ NPC保存失败，尝试清理旧数据:', e)
    // 如果还是太大，只保留最近50个
    const smallerNPCs = compressedNPCs.slice(-50)
    try {
      localStorage.setItem('forum_npcs', JSON.stringify(smallerNPCs))
    } catch {
      // 最后手段：清空所有
      localStorage.removeItem('forum_npcs')
    }
  }
}

// 获取所有帖子（同步版本，返回缓存）
export function getAllPosts(): ForumPost[] {
  return postsCache || []
}

// 异步获取所有帖子
export async function getAllPostsAsync(): Promise<ForumPost[]> {
  // 先尝试迁移
  await migratePostsToIndexedDB()
  // 强制从数据库加载，不使用缓存（因为可能刚保存了新数据）
  return loadPostsFromDB(true)
}

// 保存帖子列表（异步）
export async function savePosts(posts: ForumPost[]): Promise<void> {
  // 过滤无效帖子
  const validPosts = posts.filter(post => post.npcId !== undefined && post.npcId !== null)
  await savePostsToDB(validPosts)
}

// 同步保存（用于简单场景，实际是异步执行）
export function savePostsSync(posts: ForumPost[]) {
  savePosts(posts).catch(e => console.error('保存帖子失败:', e))
}

// 🔥 导出安全的单个帖子操作函数
export { addSinglePost, deleteSinglePost }

// 生成默认帖子（已禁用，返回空数组）
function generateDefaultPosts(): ForumPost[] {
  return []  // 不再生成预设帖子
}

// 格式化时间
function formatTime(hoursAgo: number): string {
  if (hoursAgo < 1) return '刚刚'
  if (hoursAgo < 24) return `${Math.floor(hoursAgo)}小时前`
  const daysAgo = Math.floor(hoursAgo / 24)
  if (daysAgo < 7) return `${daysAgo}天前`
  return `${Math.floor(daysAgo / 7)}周前`
}

// 点赞帖子
export async function toggleLike(postId: string): Promise<ForumPost[]> {
  const posts = await getAllPostsAsync()
  const updatedPosts = posts.map(post => {
    if (post.id === postId) {
      return {
        ...post,
        isLiked: !post.isLiked,
        likes: post.isLiked ? post.likes - 1 : post.likes + 1
      }
    }
    return post
  })
  await savePosts(updatedPosts)
  return updatedPosts
}

// 根据NPC ID获取NPC信息（同时检查角色列表）
export function getNPCById(npcId: string): ForumNPC | null {
  // 先从NPC列表查找
  const npcs = getAllNPCs()
  const npc = npcs.find(npc => npc.id === npcId)
  if (npc) return npc
  
  // 再从角色列表查找（兼容字符串和数字类型的ID比较）
  try {
    const stored = localStorage.getItem('characters')
    if (stored) {
      const characters = JSON.parse(stored)
      // 使用 String() 确保类型一致
      const char = characters.find((c: any) => String(c.id) === String(npcId))
      if (char) {
        return {
          id: String(char.id),
          name: char.nickname || char.realName || 'Unknown',
          avatar: char.avatar || '/default-avatar.png',
          bio: char.signature || char.personality?.slice(0, 50) || '',
          followers: Math.floor(Math.random() * 1000) + 500
        }
      }
    }
  } catch (e) {
    console.warn('查找角色失败:', e)
  }
  
  return null
}

// 清理NPC存储（一次性迁移：清理base64头像）
export function cleanupNPCStorage() {
  const storedNPCs = localStorage.getItem('forum_npcs')
  if (storedNPCs) {
    try {
      const npcs = JSON.parse(storedNPCs)
      // 检查是否有base64头像
      const hasBase64 = npcs.some((npc: ForumNPC) => npc.avatar?.startsWith('data:'))
      if (hasBase64) {
        console.log('🧹 清理NPC存储中的base64头像...')
        saveNPCs(npcs) // saveNPCs会自动压缩
        console.log('✅ NPC存储清理完成')
      }
    } catch {
      // 解析失败，清空
      localStorage.removeItem('forum_npcs')
    }
  }
}

// 初始化论坛数据
export async function initForumData() {
  // 先清理旧数据
  cleanupNPCStorage()
  
  // 确保NPC数据存在
  const storedNPCs = localStorage.getItem('forum_npcs')
  if (!storedNPCs) {
    console.log('初始化NPC数据')
    saveNPCs(generateRandomNPCs(8))
  }
  
  // 迁移并加载帖子数据
  await migratePostsToIndexedDB()
  await loadPostsFromDB()
}
