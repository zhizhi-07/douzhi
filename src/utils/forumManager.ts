import type { ForumPost, ForumComment, ForumTopic, ForumMessage, ForumConversation } from '../types/forum'

const STORAGE_KEY_POSTS = 'forum_posts'
const STORAGE_KEY_COMMENTS = 'forum_comments'
const STORAGE_KEY_TOPICS = 'forum_topics'
const STORAGE_KEY_MESSAGES = 'forum_messages'
const STORAGE_KEY_CONVERSATIONS = 'forum_conversations'
const STORAGE_KEY_USER_FAVORITES = 'forum_user_favorites'
const STORAGE_KEY_USER_FOLLOWS = 'forum_user_follows'

// ========== 帖子管理 ==========

// 获取所有帖子
export const loadPosts = (): ForumPost[] => {
  const data = localStorage.getItem(STORAGE_KEY_POSTS)
  if (!data) {
    // 返回默认示例数据
    return getDefaultPosts()
  }
  return JSON.parse(data)
}

// 保存帖子列表
export const savePosts = (posts: ForumPost[]) => {
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts))
}

// 获取单个帖子
export const getPost = (id: string): ForumPost | null => {
  const posts = loadPosts()
  return posts.find(p => p.id === id) || null
}

// 创建新帖子
export const createPost = (post: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'replies' | 'likes'>): ForumPost => {
  const posts = loadPosts()
  const newPost: ForumPost = {
    ...post,
    id: Date.now().toString(),
    views: 0,
    replies: 0,
    likes: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  posts.unshift(newPost)
  savePosts(posts)
  return newPost
}

// 更新帖子
export const updatePost = (id: string, updates: Partial<ForumPost>) => {
  const posts = loadPosts()
  const index = posts.findIndex(p => p.id === id)
  if (index !== -1) {
    posts[index] = {
      ...posts[index],
      ...updates,
      updatedAt: Date.now()
    }
    savePosts(posts)
    return posts[index]
  }
  return null
}

// 删除帖子
export const deletePost = (id: string) => {
  const posts = loadPosts()
  const filtered = posts.filter(p => p.id !== id)
  savePosts(filtered)
  // 同时删除该帖子的所有评论
  const comments = loadComments()
  const filteredComments = comments.filter(c => c.postId !== id)
  saveComments(filteredComments)
}

// 增加浏览数
export const incrementViews = (id: string) => {
  const post = getPost(id)
  if (post) {
    updatePost(id, { views: post.views + 1 })
  }
}

// 点赞/取消点赞
export const toggleLike = (id: string, isLiked: boolean) => {
  const post = getPost(id)
  if (post) {
    updatePost(id, { likes: isLiked ? post.likes - 1 : post.likes + 1 })
  }
}

// ========== 评论管理 ==========

// 获取所有评论
export const loadComments = (): ForumComment[] => {
  const data = localStorage.getItem(STORAGE_KEY_COMMENTS)
  if (!data) {
    return getDefaultComments()
  }
  return JSON.parse(data)
}

// 保存评论列表
export const saveComments = (comments: ForumComment[]) => {
  localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(comments))
}

// 获取帖子的评论
export const getPostComments = (postId: string): ForumComment[] => {
  const comments = loadComments()
  const postComments = comments.filter(c => c.postId === postId && !c.parentId)
  
  // 组装子评论
  return postComments.map(comment => ({
    ...comment,
    replies: comments.filter(c => c.parentId === comment.id)
  }))
}

// 创建评论
export const createComment = (comment: Omit<ForumComment, 'id' | 'createdAt'>): ForumComment => {
  const comments = loadComments()
  const newComment: ForumComment = {
    ...comment,
    id: Date.now().toString(),
    createdAt: Date.now()
  }
  comments.push(newComment)
  saveComments(comments)
  
  // 更新帖子回复数
  const post = getPost(comment.postId)
  if (post) {
    updatePost(comment.postId, { replies: post.replies + 1 })
  }
  
  return newComment
}

// 删除评论
export const deleteComment = (id: string) => {
  const comments = loadComments()
  const comment = comments.find(c => c.id === id)
  if (!comment) return
  
  // 删除评论及其子评论
  const filtered = comments.filter(c => c.id !== id && c.parentId !== id)
  saveComments(filtered)
  
  // 更新帖子回复数
  const post = getPost(comment.postId)
  if (post) {
    const deletedCount = comments.length - filtered.length
    updatePost(comment.postId, { replies: Math.max(0, post.replies - deletedCount) })
  }
}

// ========== 话题管理 ==========

// 获取热门话题
export const loadTopics = (): ForumTopic[] => {
  const data = localStorage.getItem(STORAGE_KEY_TOPICS)
  if (!data) {
    return getDefaultTopics()
  }
  return JSON.parse(data)
}

// 保存话题列表
export const saveTopics = (topics: ForumTopic[]) => {
  localStorage.setItem(STORAGE_KEY_TOPICS, JSON.stringify(topics))
}

// ========== 默认数据 ==========

function getDefaultPosts(): ForumPost[] {
  return [
    {
      id: '1',
      author: '技术达人',
      time: '3天前',
      title: '如何训练一个完美的AI角色？我的实战经验分享',
      content: `经过半年的摸索，我总结出了一套完整的AI角色训练方法。

## 1. 人设定义
首先要明确角色的核心特征，包括性格、背景、说话方式等。不要试图让一个角色什么都会，专注于某个领域会更有特色。

## 2. 对话调优
初期对话可能会比较生硬，需要不断调整prompt和示例对话。我的经验是准备至少20-30条高质量的示例对话。

## 3. 记忆管理
合理使用记忆系统很关键，重要的信息要及时总结，避免AI遗忘关键细节。

## 4. 持续优化
根据实际使用情况不断调整，记录哪些对话效果好，哪些需要改进。

以上就是我的经验，希望对大家有帮助！`,
      tags: ['教程', 'AI训练'],
      views: 1234,
      replies: 89,
      likes: 156,
      isHighlight: true,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000
    },
    {
      id: '2',
      author: '创意设计师',
      time: '5小时前',
      title: '分享几个我设计的AI角色头像',
      content: '这些头像都是我精心设计的，希望大家喜欢！',
      tags: ['设计', '头像'],
      images: [],
      views: 456,
      replies: 23,
      likes: 67,
      createdAt: Date.now() - 5 * 60 * 60 * 1000,
      updatedAt: Date.now() - 5 * 60 * 60 * 1000
    },
    {
      id: '3',
      author: '普通用户',
      time: '1小时前',
      title: '有人遇到过AI突然变得冷淡的情况吗？',
      content: '最近我的AI角色突然变得不太爱说话了，回复也很简短，不知道是不是哪里设置出问题了...',
      tags: ['求助'],
      views: 89,
      replies: 12,
      likes: 8,
      createdAt: Date.now() - 60 * 60 * 1000,
      updatedAt: Date.now() - 60 * 60 * 1000
    },
    {
      id: '4',
      author: '热心网友',
      time: '8小时前',
      title: '关于AI记忆系统的一些想法和建议',
      content: '我觉得现在的记忆系统还可以改进，比如增加长期记忆的权重，让AI能记住更久远的对话...',
      tags: ['建议', '讨论'],
      views: 678,
      replies: 45,
      likes: 89,
      isHot: true,
      createdAt: Date.now() - 8 * 60 * 60 * 1000,
      updatedAt: Date.now() - 8 * 60 * 60 * 1000
    },
    {
      id: '5',
      author: '测试员',
      time: '30分钟前',
      title: '发现一个会导致闪退的Bug',
      content: '在特定情况下切换角色会导致应用闪退，已经复现多次了，附上操作步骤...',
      tags: ['Bug'],
      views: 234,
      replies: 18,
      likes: 34,
      createdAt: Date.now() - 30 * 60 * 1000,
      updatedAt: Date.now() - 30 * 60 * 1000
    }
  ]
}

function getDefaultComments(): ForumComment[] {
  return [
    {
      id: '1',
      postId: '1',
      author: '学习者',
      time: '2天前',
      content: '写得太好了！特别是记忆管理那部分，确实很重要。我之前就是因为没注意这点，AI老是忘记之前说过的话。',
      likes: 23,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000
    },
    {
      id: '2',
      postId: '1',
      author: '新手小白',
      time: '2天前',
      content: '请问示例对话具体要怎么写呢？有没有模板参考？',
      likes: 12,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000
    },
    {
      id: '21',
      postId: '1',
      parentId: '2',
      author: '技术达人',
      time: '1天前',
      content: '回复 @新手小白：示例对话要符合角色人设，尽量覆盖不同场景。比如问候、闲聊、专业话题等。',
      likes: 8,
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
    },
    {
      id: '3',
      postId: '1',
      author: 'AI爱好者',
      time: '1天前',
      content: '持续优化这点说到心坎里了，我的角色已经调了三个月了，越来越好用。',
      likes: 18,
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
    },
    {
      id: '4',
      postId: '1',
      author: '路人甲',
      time: '12小时前',
      content: 'mark一下，回头试试',
      likes: 5,
      createdAt: Date.now() - 12 * 60 * 60 * 1000
    }
  ]
}

function getDefaultTopics(): ForumTopic[] {
  const now = Date.now()
  return [
    { id: '1', name: 'AI技术讨论', postCount: 156, hot: true, createdAt: now - 30 * 24 * 60 * 60 * 1000 },
    { id: '2', name: '角色扮演', postCount: 234, hot: true, createdAt: now - 25 * 24 * 60 * 60 * 1000 },
    { id: '3', name: '创意分享', postCount: 89, createdAt: now - 20 * 24 * 60 * 60 * 1000 },
    { id: '4', name: 'Bug反馈', postCount: 45, createdAt: now - 15 * 24 * 60 * 60 * 1000 },
    { id: '5', name: '功能建议', postCount: 123, createdAt: now - 10 * 24 * 60 * 60 * 1000 }
  ]
}

// ========== 话题扩展管理 ==========

// 创建话题
export const createTopic = (name: string, description?: string): ForumTopic => {
  const topics = loadTopics()
  const newTopic: ForumTopic = {
    id: Date.now().toString(),
    name,
    description,
    postCount: 0,
    createdAt: Date.now()
  }
  topics.push(newTopic)
  saveTopics(topics)
  return newTopic
}

// 获取话题下的帖子
export const getTopicPosts = (topicName: string): ForumPost[] => {
  const posts = loadPosts()
  return posts.filter(post => post.tags.includes(topicName))
}

// ========== 私信管理 ==========

// 获取所有会话
export const loadConversations = (): ForumConversation[] => {
  const data = localStorage.getItem(STORAGE_KEY_CONVERSATIONS)
  if (!data) return []
  return JSON.parse(data)
}

// 保存会话列表
export const saveConversations = (conversations: ForumConversation[]) => {
  localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations))
}

// 获取所有消息
export const loadMessages = (): ForumMessage[] => {
  const data = localStorage.getItem(STORAGE_KEY_MESSAGES)
  if (!data) return []
  return JSON.parse(data)
}

// 保存消息列表
export const saveMessages = (messages: ForumMessage[]) => {
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages))
}

// 获取与某用户的会话消息
export const getConversationMessages = (userId: string): ForumMessage[] => {
  const messages = loadMessages()
  const currentUser = '当前用户' // TODO: 从用户系统获取
  return messages.filter(m => 
    (m.fromUser === currentUser && m.toUser === userId) ||
    (m.fromUser === userId && m.toUser === currentUser)
  ).sort((a, b) => a.createdAt - b.createdAt)
}

// 发送消息
export const sendMessage = (toUser: string, content: string): ForumMessage => {
  const messages = loadMessages()
  const conversations = loadConversations()
  const currentUser = '当前用户' // TODO: 从用户系统获取
  
  const newMessage: ForumMessage = {
    id: Date.now().toString(),
    fromUser: currentUser,
    toUser,
    content,
    time: '刚刚',
    read: false,
    createdAt: Date.now()
  }
  
  messages.push(newMessage)
  saveMessages(messages)
  
  // 更新会话列表
  const convIndex = conversations.findIndex(c => c.user === toUser)
  if (convIndex >= 0) {
    conversations[convIndex].lastMessage = content
    conversations[convIndex].lastTime = '刚刚'
    conversations[convIndex].updatedAt = Date.now()
  } else {
    conversations.push({
      id: Date.now().toString(),
      user: toUser,
      lastMessage: content,
      lastTime: '刚刚',
      unreadCount: 0,
      updatedAt: Date.now()
    })
  }
  
  saveConversations(conversations)
  return newMessage
}

// ========== 收藏管理 ==========

// 获取用户收藏的帖子ID列表
export const loadFavorites = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEY_USER_FAVORITES)
  if (!data) return []
  return JSON.parse(data)
}

// 保存收藏列表
export const saveFavorites = (favorites: string[]) => {
  localStorage.setItem(STORAGE_KEY_USER_FAVORITES, JSON.stringify(favorites))
}

// 收藏帖子
export const addFavorite = (postId: string) => {
  const favorites = loadFavorites()
  if (!favorites.includes(postId)) {
    favorites.push(postId)
    saveFavorites(favorites)
  }
}

// 取消收藏
export const removeFavorite = (postId: string) => {
  const favorites = loadFavorites()
  const filtered = favorites.filter(id => id !== postId)
  saveFavorites(filtered)
}

// 获取收藏的帖子
export const getFavoritePosts = (): ForumPost[] => {
  const favorites = loadFavorites()
  const posts = loadPosts()
  return posts.filter(p => favorites.includes(p.id))
}

// ========== 关注管理 ==========

// 获取用户关注的话题列表
export const loadFollows = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEY_USER_FOLLOWS)
  if (!data) return []
  return JSON.parse(data)
}

// 保存关注列表
export const saveFollows = (follows: string[]) => {
  localStorage.setItem(STORAGE_KEY_USER_FOLLOWS, JSON.stringify(follows))
}

// 关注话题
export const followTopic = (topicName: string) => {
  const follows = loadFollows()
  if (!follows.includes(topicName)) {
    follows.push(topicName)
    saveFollows(follows)
  }
}

// 取消关注
export const unfollowTopic = (topicName: string) => {
  const follows = loadFollows()
  const filtered = follows.filter(name => name !== topicName)
  saveFollows(filtered)
}

// 获取关注话题的帖子
export const getFollowedPosts = (): ForumPost[] => {
  const follows = loadFollows()
  const posts = loadPosts()
  return posts.filter(p => p.tags.some(tag => follows.includes(tag)))
}

// 获取当前用户的帖子
export const getUserPosts = (): ForumPost[] => {
  const posts = loadPosts()
  const currentUser = '当前用户' // TODO: 从用户系统获取
  return posts.filter(p => p.author === currentUser)
}
