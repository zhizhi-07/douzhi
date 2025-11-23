// 论坛评论系统

export interface Comment {
  id: string
  postId: string
  authorId: string // NPC ID 或 'user'
  authorName: string
  authorAvatar: string
  content: string
  timestamp: number
  time: string
  likes: number
  isLiked: boolean
  replies: Reply[]
}

export interface Reply {
  id: string
  commentId: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  replyTo?: string // 回复谁的名字
  timestamp: number
  time: string
  likes: number
  isLiked: boolean
}

// 评论模板
const COMMENT_TEMPLATES = [
  '太棒了！',
  '真不错👍',
  '很喜欢这个分享',
  '拍得真好看',
  '好棒啊！',
  '赞赞赞',
  '期待更多内容',
  '太美了',
  '哇，好厉害',
  '学到了',
  '很有意思',
  '支持支持',
  '真棒！',
  '好看好看',
  '真好',
  '不错不错',
  '太赞了',
  '很棒的分享',
  '喜欢',
  '收藏了'
]

// 回复模板
const REPLY_TEMPLATES = [
  '哈哈哈',
  '确实',
  '同感',
  '说得对',
  '有道理',
  '赞同',
  '是的',
  '没错',
  '我也觉得',
  '同意',
  '真的',
  '对的',
  '正解',
  '就是',
  '对',
  '嗯嗯'
]

// 获取所有评论
export function getAllComments(): Comment[] {
  const stored = localStorage.getItem('forum_comments')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

// 保存评论
export function saveComments(comments: Comment[]) {
  try {
    // 限制评论数量，最多保留1000条（防止localStorage溢出）
    const MAX_COMMENTS = 1000
    const limitedComments = comments.length > MAX_COMMENTS 
      ? comments.slice(0, MAX_COMMENTS)
      : comments
    
    localStorage.setItem('forum_comments', JSON.stringify(limitedComments))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage空间不足，清理旧评论...')
      // 强制清理，只保留最新500条
      const cleaned = comments.slice(0, 500)
      try {
        localStorage.setItem('forum_comments', JSON.stringify(cleaned))
        console.log('✅ 已清理评论，保留最新500条')
      } catch (e) {
        console.error('❌ 清理后仍然失败，清空评论存储')
        localStorage.removeItem('forum_comments')
      }
    } else {
      console.error('保存评论失败:', error)
      throw error
    }
  }
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

// 添加评论
export function addComment(postId: string, authorId: string, authorName: string, authorAvatar: string, content: string): Comment {
  const comments = getAllComments()
  const timestamp = Date.now()
  
  const newComment: Comment = {
    id: `comment-${timestamp}`,
    postId,
    authorId,
    authorName,
    authorAvatar,
    content,
    timestamp,
    time: formatTime(timestamp),
    likes: 0,
    isLiked: false,
    replies: []
  }
  
  comments.unshift(newComment)
  saveComments(comments)
  
  return newComment
}

// 添加回复
export function addReply(
  commentId: string, 
  authorId: string, 
  authorName: string, 
  authorAvatar: string, 
  content: string,
  replyTo?: string
): Reply {
  const comments = getAllComments()
  const comment = comments.find(c => c.id === commentId)
  
  if (!comment) {
    throw new Error('评论不存在')
  }
  
  const timestamp = Date.now()
  const newReply: Reply = {
    id: `reply-${timestamp}`,
    commentId,
    authorId,
    authorName,
    authorAvatar,
    content,
    replyTo,
    timestamp,
    time: formatTime(timestamp),
    likes: 0,
    isLiked: false
  }
  
  comment.replies.push(newReply)
  saveComments(comments)
  
  return newReply
}

// 获取帖子的评论
export function getPostComments(postId: string): Comment[] {
  const comments = getAllComments()
  return comments.filter(c => c.postId === postId).sort((a, b) => b.timestamp - a.timestamp)
}

// 点赞评论
export function toggleCommentLike(commentId: string): Comment[] {
  const comments = getAllComments()
  const comment = comments.find(c => c.id === commentId)
  
  if (comment) {
    comment.isLiked = !comment.isLiked
    comment.likes = comment.isLiked ? comment.likes + 1 : comment.likes - 1
    saveComments(comments)
  }
  
  return comments
}

// 点赞回复
export function toggleReplyLike(commentId: string, replyId: string): Comment[] {
  const comments = getAllComments()
  const comment = comments.find(c => c.id === commentId)
  
  if (comment) {
    const reply = comment.replies.find(r => r.id === replyId)
    if (reply) {
      reply.isLiked = !reply.isLiked
      reply.likes = reply.isLiked ? reply.likes + 1 : reply.likes - 1
      saveComments(comments)
    }
  }
  
  return comments
}

// AI角色自动评论（随机选择角色评论）
export async function generateAIComments(postId: string, npcList: {id: string, name: string, avatar: string}[]) {
  // 随机选择2-5个NPC评论
  const commentCount = Math.floor(Math.random() * 4) + 2 // 2-5个评论
  const selectedNPCs = [...npcList].sort(() => Math.random() - 0.5).slice(0, commentCount)
  
  const comments: Comment[] = []
  
  for (let i = 0; i < selectedNPCs.length; i++) {
    const npc = selectedNPCs[i]
    const content = COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)]
    
    // 延迟一点时间，模拟真实评论
    const delay = (i + 1) * 500 + Math.random() * 1000
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    const comment = addComment(postId, npc.id, npc.name, npc.avatar, content)
    comments.push(comment)
    
    // 30%概率有其他NPC回复
    if (Math.random() < 0.3 && i < selectedNPCs.length - 1) {
      const replier = selectedNPCs[i + 1]
      const replyContent = REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)]
      
      await new Promise(resolve => setTimeout(resolve, 300))
      addReply(comment.id, replier.id, replier.name, replier.avatar, replyContent, npc.name)
    }
  }
  
  return comments
}

// 更新评论时间显示
export function updateCommentTimes() {
  const comments = getAllComments()
  comments.forEach(comment => {
    comment.time = formatTime(comment.timestamp)
    comment.replies.forEach(reply => {
      reply.time = formatTime(reply.timestamp)
    })
  })
  saveComments(comments)
}
