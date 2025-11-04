# 重回功能文档

## ✨ 功能说明

**重回** = 重新生成AI回复

当AI的回复不满意时，点击加号菜单的"重回"，会：
1. 删除最后一条AI消息
2. 保留用户的消息
3. 重新调用AI API
4. 生成新的回复

---

## 🎯 使用场景

```
用户: 你好
AI: 你好啊！（这个回复不满意）

↓ 点击"重回"

用户: 你好
AI: [正在输入...]
AI: 嗨！很高兴见到你～（新的回复）
```

---

## 💻 技术实现

### 架构设计 ✅

遵循模块化原则，从一开始就拆分好：

```
useChatAI.ts (AI交互逻辑)
  ├── generateAIReply()       - 核心生成逻辑
  ├── handleAIReply()         - 普通AI回复
  └── handleRegenerate() ✅   - 重新生成
          ↓
useAddMenu.ts (加号菜单)
  └── handleSelectRecall()    - 调用重新生成
          ↓
ChatDetail.tsx (主组件)
  └── 连接 chatAI.handleRegenerate → addMenu
```

### 核心代码

#### 1. useChatAI.ts - 重新生成逻辑
```typescript
const handleRegenerate = useCallback(async () => {
  if (isAiTyping || !character) return
  
  // 检查最后一条消息是否是AI回复
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage || lastMessage.type !== 'received') {
    setError('没有可重新生成的AI回复')
    return
  }
  
  setIsAiTyping(true)
  setError(null)
  
  // 删除最后一条AI消息
  setMessages(prev => prev.slice(0, -1))
  
  // 等待状态更新
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 重新生成
  await generateAIReply()
  
  setIsAiTyping(false)
}, [isAiTyping, character, messages, setMessages, generateAIReply, setError])
```

#### 2. useAddMenu.ts - 连接功能
```typescript
export const useAddMenu = (onRegenerate?: () => void) => {
  const handleSelectRecall = useCallback(() => {
    setShowAddMenu(false)  // 关闭菜单
    if (onRegenerate) {
      onRegenerate()        // 触发重新生成
    }
  }, [onRegenerate])
}
```

#### 3. ChatDetail.tsx - 组合Hooks
```typescript
const chatAI = useChatAI(...)
const addMenu = useAddMenu(chatAI.handleRegenerate)  // 传递重新生成函数
```

---

## 🔄 执行流程

```
用户点击"重回"
    ↓
AddMenu.handleSelectRecall()
    ↓
关闭加号菜单
    ↓
chatAI.handleRegenerate()
    ↓
检查最后一条是否是AI消息 ✓
    ↓
删除最后一条AI消息
    ↓
setIsAiTyping(true) → 显示"正在输入..."
    ↓
generateAIReply() → 调用AI API
    ↓
解析回复并添加到消息列表
    ↓
setIsAiTyping(false) → 完成
```

---

## ✅ 边界处理

### 1. 没有AI消息
```typescript
if (!lastMessage || lastMessage.type !== 'received') {
  setError('没有可重新生成的AI回复')
  return
}
```

### 2. AI正在输入时
```typescript
if (isAiTyping || !character) return
```

### 3. 没有配置API
```typescript
const settings = getApiSettings()
if (!settings) {
  throw new ChatApiError('请先配置API', 'NO_API_SETTINGS')
}
```

---

## 📊 代码复用

### 提取核心逻辑
```typescript
// ✅ 好的做法：提取共同逻辑
const generateAIReply = async () => {
  // 核心AI调用逻辑
}

// 普通回复使用
const handleAIReply = async () => {
  await generateAIReply()
}

// 重新生成也使用
const handleRegenerate = async () => {
  setMessages(prev => prev.slice(0, -1))  // 删除最后一条
  await generateAIReply()                  // 复用
}
```

### ❌ 不好的做法
```typescript
// 复制粘贴相同代码
const handleAIReply = async () => {
  // 100行AI调用代码
}

const handleRegenerate = async () => {
  setMessages(prev => prev.slice(0, -1))
  // 又复制100行相同的AI调用代码 ❌
}
```

---

## 🎨 UI交互

### 加号菜单
```
┌──────────────┐
│  🔄 重回     │ ← 第一项
│  📷 相册     │
│  📸 拍照     │
│  💰 转账     │
│  ...        │
└──────────────┘
```

### 点击后
```
用户: 你好
AI: 你好！[删除]

↓

用户: 你好
[正在输入...]

↓

用户: 你好
AI: 嗨！很高兴见到你～[新消息]
```

---

## 📝 开发原则 ✅

### 1. 模块化优先
- ✅ 功能在独立Hook里实现
- ✅ 不在主组件里堆代码
- ✅ 从一开始就拆分好

### 2. 代码复用
- ✅ 提取核心逻辑 `generateAIReply()`
- ✅ 多个功能复用同一逻辑
- ✅ 避免重复代码

### 3. 职责单一
- ✅ `useChatAI` - 负责AI交互
- ✅ `useAddMenu` - 负责菜单UI
- ✅ `ChatDetail` - 负责组合

---

## 🚀 扩展性

如果以后要添加更多AI生成功能，很容易：

```typescript
// 继续复用核心逻辑
const handleContinue = async () => {
  // 继续写
  await generateAIReply()
}

const handleSummarize = async () => {
  // 总结对话
  await generateAIReply()
}
```

---

## ✅ 测试

### 手动测试步骤
1. 发送消息："你好"
2. AI回复
3. 点击加号 → 点击"重回"
4. 观察：
   - ✅ 旧AI消息被删除
   - ✅ 显示"正在输入..."
   - ✅ 出现新的AI回复

### 边界测试
- 没有AI消息时点击"重回" → 显示错误提示
- AI正在输入时点击"重回" → 不响应

---

**实现时间**: 2025-11-04  
**状态**: ✅ 完成  
**代码行数**: Hook添加约50行，主组件无增加  
**模块化**: ✅ 优秀
