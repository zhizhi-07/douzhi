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

// 预设NPC列表
const DEFAULT_NPCS: ForumNPC[] = [
  {
    id: 'npc-1',
    name: '小美',
    avatar: '/default-avatar.png',
    bio: '热爱生活，喜欢分享日常点滴 ✨',
    followers: 1234
  },
  {
    id: 'npc-2',
    name: '阿强',
    avatar: '/default-avatar.png',
    bio: '摄影爱好者 📷 | 旅行达人 🌍',
    followers: 2567
  },
  {
    id: 'npc-3',
    name: '林小雨',
    avatar: '/default-avatar.png',
    bio: '美食博主 | 探店小能手 🍜',
    followers: 3456
  },
  {
    id: 'npc-4',
    name: '张三',
    avatar: '/default-avatar.png',
    bio: '科技发烧友 💻 | 数码测评',
    followers: 4321
  },
  {
    id: 'npc-5',
    name: '小李',
    avatar: '/default-avatar.png',
    bio: '健身达人 💪 | 分享运动日常',
    followers: 1890
  }
]

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
      return DEFAULT_NPCS
    }
  }
  return DEFAULT_NPCS
}

// 保存NPC列表
export function saveNPCs(npcs: ForumNPC[]) {
  localStorage.setItem('forum_npcs', JSON.stringify(npcs))
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

// 初始化论坛数据
export function initForumData() {
  // 确保NPC数据存在
  const storedNPCs = localStorage.getItem('forum_npcs')
  if (!storedNPCs) {
    console.log('初始化NPC数据')
    saveNPCs(DEFAULT_NPCS)
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
