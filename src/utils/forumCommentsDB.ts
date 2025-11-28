// 论坛评论系统 - IndexedDB版本（大容量存储，不删除数据）

import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface Comment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  timestamp: number
  time: string
  likes: number
  isLiked: boolean
  replies: Reply[]
  isPublicFigure?: boolean  // 是否公众人物评论
}

export interface Reply {
  id: string
  commentId: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  replyTo?: string
  timestamp: number
  time: string
  likes: number
  isLiked: boolean
}

interface ForumCommentsDB extends DBSchema {
  comments: {
    key: string
    value: Comment
    indexes: { 'by-postId': string, 'by-timestamp': number }
  }
}

const DB_NAME = 'forum-comments-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ForumCommentsDB>> | null = null

// 初始化数据库
function getDB(): Promise<IDBPDatabase<ForumCommentsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ForumCommentsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 创建评论表
        if (!db.objectStoreNames.contains('comments')) {
          const commentStore = db.createObjectStore('comments', { keyPath: 'id' })
          commentStore.createIndex('by-postId', 'postId')
          commentStore.createIndex('by-timestamp', 'timestamp')
        }
      },
    })
  }
  return dbPromise
}

// 格式化时间
function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${Math.floor(days / 7)}周前`
}

// 获取所有评论
export async function getAllComments(): Promise<Comment[]> {
  try {
    const db = await getDB()
    return await db.getAll('comments')
  } catch (error) {
    console.error('获取评论失败:', error)
    return []
  }
}

// 获取帖子的评论
export async function getPostComments(postId: string): Promise<Comment[]> {
  try {
    const db = await getDB()
    const allComments = await db.getAllFromIndex('comments', 'by-postId', postId)
    // 排序规则：公众人物评论优先 > 点赞数高的在前 > 最新的在前
    return allComments.sort((a, b) => {
      // 公众人物优先
      if (a.isPublicFigure && !b.isPublicFigure) return -1
      if (!a.isPublicFigure && b.isPublicFigure) return 1
      // 点赞数高的在前
      if (a.likes !== b.likes) return b.likes - a.likes
      // 时间作为最后排序依据
      return b.timestamp - a.timestamp
    })
  } catch (error) {
    console.error('获取帖子评论失败:', error)
    return []
  }
}

// 添加评论
export async function addComment(
  postId: string, 
  authorId: string, 
  authorName: string, 
  authorAvatar: string, 
  content: string,
  initialLikes?: number,  // 可选的初始点赞数
  isPublicFigure?: boolean  // 是否公众人物
): Promise<Comment> {
  const timestamp = Date.now()
  
  const newComment: Comment = {
    id: `comment-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    postId,
    authorId,
    authorName,
    authorAvatar,
    content,
    timestamp,
    time: formatTime(timestamp),
    likes: initialLikes ?? 0,
    isLiked: false,
    replies: [],
    isPublicFigure: isPublicFigure || false
  }
  
  try {
    const db = await getDB()
    await db.add('comments', newComment)
    console.log(`✅ 评论已保存到IndexedDB: ${authorName}`)
    return newComment
  } catch (error) {
    console.error('添加评论失败:', error)
    throw error
  }
}

// 添加回复
export async function addReply(
  commentId: string, 
  authorId: string, 
  authorName: string, 
  authorAvatar: string, 
  content: string,
  replyTo?: string,
  initialLikes?: number  // 可选的初始点赞数
): Promise<Reply> {
  const timestamp = Date.now()
  const newReply: Reply = {
    id: `reply-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    commentId,
    authorId,
    authorName,
    authorAvatar,
    content,
    replyTo,
    timestamp,
    time: formatTime(timestamp),
    likes: initialLikes ?? 0,
    isLiked: false
  }
  
  try {
    const db = await getDB()
    const comment = await db.get('comments', commentId)
    
    if (!comment) {
      throw new Error('评论不存在')
    }
    
    comment.replies.push(newReply)
    await db.put('comments', comment)
    
    return newReply
  } catch (error) {
    console.error('添加回复失败:', error)
    throw error
  }
}

// 点赞评论
export async function toggleCommentLike(commentId: string): Promise<void> {
  try {
    const db = await getDB()
    const comment = await db.get('comments', commentId)
    
    if (comment) {
      comment.isLiked = !comment.isLiked
      comment.likes = comment.isLiked ? comment.likes + 1 : comment.likes - 1
      await db.put('comments', comment)
    }
  } catch (error) {
    console.error('点赞评论失败:', error)
  }
}

// 点赞回复
export async function toggleReplyLike(commentId: string, replyId: string): Promise<void> {
  try {
    const db = await getDB()
    const comment = await db.get('comments', commentId)
    
    if (comment) {
      const reply = comment.replies.find(r => r.id === replyId)
      if (reply) {
        reply.isLiked = !reply.isLiked
        reply.likes = reply.isLiked ? reply.likes + 1 : reply.likes - 1
        await db.put('comments', comment)
      }
    }
  } catch (error) {
    console.error('点赞回复失败:', error)
  }
}

// 更新评论时间显示
export async function updateCommentTimes(): Promise<void> {
  try {
    const db = await getDB()
    const comments = await db.getAll('comments')
    
    for (const comment of comments) {
      comment.time = formatTime(comment.timestamp)
      comment.replies.forEach(reply => {
        reply.time = formatTime(reply.timestamp)
      })
      await db.put('comments', comment)
    }
  } catch (error) {
    console.error('更新评论时间失败:', error)
  }
}

// 从localStorage迁移数据到IndexedDB（仅首次运行）
export async function migrateFromLocalStorage(): Promise<void> {
  const OLD_KEY = 'forum_comments'
  const MIGRATION_FLAG = 'forum_comments_migrated'
  
  // 检查是否已迁移
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') {
    return
  }
  
  try {
    const oldData = localStorage.getItem(OLD_KEY)
    if (!oldData) {
      localStorage.setItem(MIGRATION_FLAG, 'true')
      return
    }
    
    const oldComments: Comment[] = JSON.parse(oldData)
    console.log(`📦 开始迁移 ${oldComments.length} 条评论到IndexedDB...`)
    
    const db = await getDB()
    for (const comment of oldComments) {
      await db.put('comments', comment)
    }
    
    console.log(`✅ 迁移完成，保留所有 ${oldComments.length} 条评论`)
    localStorage.setItem(MIGRATION_FLAG, 'true')
    // 迁移后可以删除localStorage数据释放空间
    localStorage.removeItem(OLD_KEY)
  } catch (error) {
    console.error('迁移数据失败:', error)
  }
}

// 初始化时自动迁移
migrateFromLocalStorage()
