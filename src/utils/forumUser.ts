// 论坛用户数据系统

export interface ForumUserData {
  followers: number      // 粉丝数
  following: number      // 关注数
  posts: number          // 帖子数
  likes: number          // 获赞总数
  collections: number    // 收藏数
}

const DEFAULT_USER_DATA: ForumUserData = {
  followers: 0,
  following: 0,
  posts: 0,
  likes: 0,
  collections: 0
}

// 获取用户数据
export function getUserData(): ForumUserData {
  const stored = localStorage.getItem('forum_user_data')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return DEFAULT_USER_DATA
    }
  }
  return DEFAULT_USER_DATA
}

// 保存用户数据
export function saveUserData(data: ForumUserData) {
  localStorage.setItem('forum_user_data', JSON.stringify(data))
}

// 初始化用户数据
export function initUserData() {
  const data = getUserData()
  console.log('用户数据:', data)
  return data
}

// 关注NPC
export function followNPC(npcId: string): ForumUserData {
  const data = getUserData()
  // 检查是否已关注
  const followedNPCs = getFollowedNPCs()
  if (!followedNPCs.includes(npcId)) {
    followedNPCs.push(npcId)
    localStorage.setItem('followed_npcs', JSON.stringify(followedNPCs))
    data.following += 1
    saveUserData(data)
  }
  return data
}

// 取消关注NPC
export function unfollowNPC(npcId: string): ForumUserData {
  const data = getUserData()
  const followedNPCs = getFollowedNPCs()
  const index = followedNPCs.indexOf(npcId)
  if (index > -1) {
    followedNPCs.splice(index, 1)
    localStorage.setItem('followed_npcs', JSON.stringify(followedNPCs))
    data.following -= 1
    saveUserData(data)
  }
  return data
}

// 获取已关注的NPC列表
export function getFollowedNPCs(): string[] {
  const stored = localStorage.getItem('followed_npcs')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

// 检查是否已关注某个NPC
export function isFollowingNPC(npcId: string): boolean {
  const followedNPCs = getFollowedNPCs()
  return followedNPCs.includes(npcId)
}

// 增加帖子数
export function incrementPosts(): ForumUserData {
  const data = getUserData()
  data.posts += 1
  saveUserData(data)
  return data
}

// 增加获赞数
export function incrementLikes(count: number = 1): ForumUserData {
  const data = getUserData()
  data.likes += count
  saveUserData(data)
  return data
}

// 收藏帖子
export function collectPost(postId: string): ForumUserData {
  const data = getUserData()
  const collectedPosts = getCollectedPosts()
  if (!collectedPosts.includes(postId)) {
    collectedPosts.push(postId)
    localStorage.setItem('collected_posts', JSON.stringify(collectedPosts))
    data.collections += 1
    saveUserData(data)
  }
  return data
}

// 取消收藏帖子
export function uncollectPost(postId: string): ForumUserData {
  const data = getUserData()
  const collectedPosts = getCollectedPosts()
  const index = collectedPosts.indexOf(postId)
  if (index > -1) {
    collectedPosts.splice(index, 1)
    localStorage.setItem('collected_posts', JSON.stringify(collectedPosts))
    data.collections -= 1
    saveUserData(data)
  }
  return data
}

// 获取已收藏的帖子列表
export function getCollectedPosts(): string[] {
  const stored = localStorage.getItem('collected_posts')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

// 检查是否已收藏某个帖子
export function isPostCollected(postId: string): boolean {
  const collectedPosts = getCollectedPosts()
  return collectedPosts.includes(postId)
}
