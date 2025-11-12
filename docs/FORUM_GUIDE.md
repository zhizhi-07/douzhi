# 论坛功能开发指南

## 📁 代码结构

```
src/
├── types/
│   └── forum.ts              # 论坛相关类型定义
├── utils/
│   └── forumManager.ts       # 论坛数据管理模块
├── pages/
│   ├── Forum.tsx             # 论坛列表页
│   └── ForumPostDetail.tsx   # 帖子详情页
└── components/
    └── (待扩展)              # 可复用的论坛组件
```

## 🔧 核心模块说明

### 1. 类型定义 (`types/forum.ts`)

定义了论坛的核心数据结构：

- **ForumPost**: 帖子数据结构
  - `id`: 唯一标识
  - `author`: 作者名
  - `title`: 标题
  - `content`: 内容
  - `tags`: 标签数组
  - `images`: 图片数组
  - `views/replies/likes`: 统计数据
  - `isHighlight/isHot`: 标记属性

- **ForumComment**: 评论数据结构
  - `id`: 唯一标识
  - `postId`: 所属帖子ID
  - `parentId`: 父评论ID（用于嵌套回复）
  - `replies`: 子评论数组

- **ForumTopic**: 话题数据结构

### 2. 数据管理 (`utils/forumManager.ts`)

提供完整的CRUD操作接口：

#### 帖子管理

```typescript
// 获取所有帖子
loadPosts(): ForumPost[]

// 获取单个帖子
getPost(id: string): ForumPost | null

// 创建新帖子
createPost(post: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'replies' | 'likes'>): ForumPost

// 更新帖子
updatePost(id: string, updates: Partial<ForumPost>): ForumPost | null

// 删除帖子
deletePost(id: string): void

// 增加浏览数
incrementViews(id: string): void

// 点赞/取消点赞
toggleLike(id: string, isLiked: boolean): void
```

#### 评论管理

```typescript
// 获取帖子的评论（自动组装子评论）
getPostComments(postId: string): ForumComment[]

// 创建评论
createComment(comment: Omit<ForumComment, 'id' | 'createdAt'>): ForumComment

// 删除评论（自动删除子评论）
deleteComment(id: string): void
```

#### 话题管理

```typescript
// 获取热门话题
loadTopics(): ForumTopic[]

// 保存话题列表
saveTopics(topics: ForumTopic[]): void
```

## 🚀 功能扩展示例

### 1. 添加发帖功能

```typescript
// 在Forum.tsx中
const handleCreatePost = () => {
  const newPost = createPost({
    author: '当前用户',
    time: '刚刚',
    title: '帖子标题',
    content: '帖子内容',
    tags: ['标签1', '标签2']
  })
  
  // 刷新列表
  setPosts(loadPosts())
  
  // 跳转到详情页
  navigate(`/forum/post/${newPost.id}`)
}
```

### 2. 添加搜索功能

```typescript
// 在Forum.tsx中
const [searchQuery, setSearchQuery] = useState('')

const filteredPosts = useMemo(() => {
  if (!searchQuery) return posts
  
  return posts.filter(post =>
    post.title.includes(searchQuery) ||
    post.content.includes(searchQuery) ||
    post.tags.some(tag => tag.includes(searchQuery))
  )
}, [posts, searchQuery])
```

### 3. 添加分类筛选

```typescript
// 在Forum.tsx中
const filteredPosts = useMemo(() => {
  switch (activeTab) {
    case '热门':
      return posts.filter(p => p.isHot || p.likes > 50)
    case '最新':
      return [...posts].sort((a, b) => b.createdAt - a.createdAt)
    case '精华':
      return posts.filter(p => p.isHighlight)
    default:
      return posts
  }
}, [posts, activeTab])
```

### 4. 添加点赞功能

```typescript
// 在ForumPostDetail.tsx中
const [isLiked, setIsLiked] = useState(false)

const handleLike = () => {
  if (id) {
    toggleLike(id, isLiked)
    setIsLiked(!isLiked)
    // 刷新帖子数据
    const updated = getPost(id)
    if (updated) setPost(updated)
  }
}
```

### 5. 添加图片上传

```typescript
const handleImageUpload = (file: File) => {
  // 1. 上传到服务器或转为base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string
    
    // 2. 更新帖子图片
    setImages([...images, imageUrl])
  }
  reader.readAsDataURL(file)
}
```

## 📝 待实现功能清单

### 高优先级
- [ ] 发帖编辑器（支持Markdown）
- [ ] 图片上传和预览
- [ ] 帖子编辑和删除
- [ ] 评论点赞功能
- [ ] 用户系统集成（获取当前用户信息）

### 中优先级
- [ ] 搜索功能（标题、内容、标签）
- [ ] 话题页面（点击话题查看相关帖子）
- [ ] 帖子收藏功能
- [ ] 评论排序（最新、最热）
- [ ] @用户提醒

### 低优先级
- [ ] 帖子举报
- [ ] 敏感词过滤
- [ ] 帖子置顶
- [ ] 数据导出
- [ ] 通知系统

## 🎨 UI组件建议

可以将重复的UI抽取为独立组件：

```typescript
// components/ForumPostCard.tsx
export const ForumPostCard = ({ post, onClick }) => { ... }

// components/ForumCommentItem.tsx  
export const ForumCommentItem = ({ comment, onReply, onLike }) => { ... }

// components/ForumTopicTag.tsx
export const ForumTopicTag = ({ topic, onClick }) => { ... }

// components/ForumEditor.tsx
export const ForumEditor = ({ onSubmit, onCancel }) => { ... }
```

## 💡 最佳实践

1. **数据一致性**: 所有数据操作都通过 `forumManager.ts` 进行，不要直接操作 localStorage

2. **组件解耦**: 组件只负责展示和交互，数据管理在 utils 层

3. **类型安全**: 充分利用 TypeScript 类型系统，避免运行时错误

4. **性能优化**: 使用 `useMemo` 缓存计算结果，使用 `useCallback` 缓存函数引用

5. **错误处理**: 添加适当的错误边界和加载状态

## 🔄 数据持久化

当前使用 localStorage 存储数据，后续可以：

1. **迁移到 IndexedDB**: 支持更大数据量和复杂查询
2. **接入后端API**: 实现真正的多用户论坛
3. **添加离线缓存**: 提升用户体验

## 📊 数据迁移示例

```typescript
// 如果需要迁移到后端API
export const syncToServer = async () => {
  const posts = loadPosts()
  const comments = loadComments()
  
  await fetch('/api/forum/sync', {
    method: 'POST',
    body: JSON.stringify({ posts, comments })
  })
}
```

## 🐛 调试建议

1. 在浏览器开发工具中查看 localStorage:
   - `forum_posts`
   - `forum_comments`
   - `forum_topics`

2. 使用 React DevTools 查看组件状态

3. 添加日志记录关键操作

## 📚 相关文档

- [React Router 文档](https://reactrouter.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
