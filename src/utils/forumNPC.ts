// 论坛NPC系统

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
  images: number // 图片数量
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

// 获取所有帖子
export function getAllPosts(): ForumPost[] {
  const stored = localStorage.getItem('forum_posts')
  if (stored) {
    try {
      const posts = JSON.parse(stored)
      // 如果帖子为空，重新生成
      if (!posts || posts.length === 0) {
        const newPosts = generateDefaultPosts()
        savePosts(newPosts)
        return newPosts
      }
      // 过滤掉npcId为undefined的无效帖子
      const validPosts = posts.filter((post: ForumPost) => post.npcId !== undefined && post.npcId !== null)
      // 如果过滤后为空，重新生成
      if (validPosts.length === 0) {
        const newPosts = generateDefaultPosts()
        savePosts(newPosts)
        return newPosts
      }
      // 如果有帖子被过滤掉，保存清洗后的数据
      if (validPosts.length !== posts.length) {
        savePosts(validPosts)
      }
      return validPosts
    } catch {
      const newPosts = generateDefaultPosts()
      savePosts(newPosts)
      return newPosts
    }
  }
  const newPosts = generateDefaultPosts()
  savePosts(newPosts)
  return newPosts
}

// 保存帖子列表
export function savePosts(posts: ForumPost[]) {
  localStorage.setItem('forum_posts', JSON.stringify(posts))
}

// 生成默认帖子
function generateDefaultPosts(): ForumPost[] {
  const npcs = getAllNPCs()
  const now = Date.now()
  
  return POST_TEMPLATES.map((template, index) => {
    const npc = npcs[index % npcs.length]
    const hoursAgo = index * 2 + Math.floor(Math.random() * 3)
    
    return {
      id: `post-${index + 1}`,
      npcId: npc.id,
      content: template.content,
      images: template.images,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 100) + 5,
      time: formatTime(hoursAgo),
      timestamp: now - hoursAgo * 60 * 60 * 1000,
      isLiked: false
    }
  }).sort((a, b) => b.timestamp - a.timestamp)
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
export function toggleLike(postId: string): ForumPost[] {
  const posts = getAllPosts()
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
  savePosts(updatedPosts)
  return updatedPosts
}

// 根据NPC ID获取NPC信息
export function getNPCById(npcId: string): ForumNPC | null {
  const npcs = getAllNPCs()
  return npcs.find(npc => npc.id === npcId) || null
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
export function initForumData() {
  // 先清理旧数据
  cleanupNPCStorage()
  
  // 确保NPC数据存在
  const storedNPCs = localStorage.getItem('forum_npcs')
  if (!storedNPCs) {
    console.log('初始化NPC数据')
    saveNPCs(generateRandomNPCs(8))
  }
  
  // 确保帖子数据存在
  const storedPosts = localStorage.getItem('forum_posts')
  if (!storedPosts) {
    console.log('初始化帖子数据')
    const posts = generateDefaultPosts()
    console.log('生成的帖子:', posts)
    savePosts(posts)
  }
}
