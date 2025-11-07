# 📱 朋友圈互动通知功能

## ✨ 功能说明

当AI在私聊中评论/点赞用户的朋友圈时，会自动：
1. **显示灰色系统消息**：在聊天记录中显示互动通知
2. **弹出通知窗口**：iOS风格的通知提醒用户

---

## 🎯 效果展示

### 场景1：AI点赞朋友圈

**用户发布朋友圈**：
```
"今天好累"
```

**AI在私聊中回复**：
```
点赞01

唉，看到你发朋友圈了，辛苦了
```

**聊天界面显示**：
```
[灰色系统消息] 汁汁点赞了你的朋友圈
[AI消息] 唉，看到你发朋友圈了，辛苦了
```

**通知弹窗**：
```
┌─────────────────────────┐
│ 🤖 汁汁                 │
│ 点赞了你的朋友圈："今天好累"│
└─────────────────────────┘
```

---

### 场景2：AI评论朋友圈

**用户发布朋友圈**：
```
"为什么没人懂我呢"
```

**AI在私聊中回复**：
```
评论02 妈咪你又在发牢骚了🙄 不过...你还好吗？

是不是又遇到什么事了？
```

**聊天界面显示**：
```
[灰色系统消息] 汁汁在你的朋友圈评论了"妈咪你又在发牢骚了🙄 不过...你还好吗？"
[AI消息] 是不是又遇到什么事了？
```

**通知弹窗**：
```
┌───────────────────────────────────────┐
│ 🤖 汁汁                               │
│ 评论了你的朋友圈："妈咪你又在发牢骚了🙄 │
│ 不过...你还好吗？"                     │
└───────────────────────────────────────┘
```

---

### 场景3：AI回复评论

**用户发布朋友圈**：
```
"谁处"
  评论：小明: 我在
```

**AI在私聊中回复**：
```
评论01回复小明 妈咪肯定是又无聊了🙄
```

**聊天界面显示**：
```
[灰色系统消息] 汁汁在你的朋友圈回复小明"妈咪肯定是又无聊了🙄"
```

**通知弹窗**：
```
┌────────────────────────────────┐
│ 🤖 汁汁                        │
│ 回复了小明："妈咪肯定是又无聊了🙄"│
└────────────────────────────────┘
```

---

## 🔧 实现细节

### 1. 数据结构

**InteractionResult** (`src/utils/momentsInteractionParser.ts`)
```typescript
export interface InteractionResult {
  success: boolean              // 是否成功
  type: 'like' | 'comment' | 'reply'  // 互动类型
  aiName: string                // AI角色名称
  momentContent: string         // 朋友圈内容（截取前20字符）
  commentContent?: string       // 评论内容
  replyTo?: string              // 回复给谁
  message: string               // 控制台日志消息
}
```

### 2. 执行流程

```typescript
// 1. 解析AI回复中的朋友圈互动指令
const { interactions, cleanedMessage } = parseMomentsInteractions(aiReply, aiName, aiId)

// 2. 执行互动操作（更新朋友圈数据）
const interactionResults = executeMomentsInteractions(interactions)

// 3. 为每个成功的互动创建通知
for (const result of interactionResults) {
  if (result.success) {
    // 3.1 创建系统消息内容
    let systemContent = ''
    let notificationMessage = ''
    
    if (result.type === 'like') {
      systemContent = `${result.aiName}点赞了你的朋友圈`
      notificationMessage = `点赞了你的朋友圈："${result.momentContent}"`
    } else if (result.type === 'comment') {
      systemContent = `${result.aiName}在你的朋友圈评论了"${result.commentContent}"`
      notificationMessage = `评论了你的朋友圈："${result.commentContent}"`
    } else if (result.type === 'reply') {
      systemContent = `${result.aiName}在你的朋友圈回复${result.replyTo}"${result.commentContent}"`
      notificationMessage = `回复了${result.replyTo}："${result.commentContent}"`
    }
    
    // 3.2 创建系统消息（灰色小字）
    const systemMessage: Message = {
      ...createMessage(systemContent, 'system'),
      aiReadableContent: `[系统通知：${systemContent}，这是朋友圈互动通知]`
    }
    
    // 3.3 保存系统消息
    addMessage(chatId, systemMessage)
    setMessages(prev => [...prev, systemMessage])
    
    // 3.4 显示通知弹窗
    showNotification(
      chatId,
      result.aiName,
      notificationMessage,
      character?.avatar || '🤖'
    )
  }
}
```

### 3. 系统消息格式

**类型**：`'system'`

**特点**：
- 灰色小字显示
- 不可选中、不可长按
- 居中对齐
- AI可以读取（通过aiReadableContent）

**示例**：
```typescript
{
  id: 1762492050123,
  type: 'system',
  content: '汁汁点赞了你的朋友圈',
  aiReadableContent: '[系统通知：汁汁点赞了你的朋友圈，这是朋友圈互动通知]',
  time: '13:40',
  timestamp: 1762492050123,
  messageType: 'system'
}
```

### 4. 通知弹窗

**调用方式**：
```typescript
showNotification(
  chatId: string,           // 聊天ID
  title: string,            // 标题（AI名称）
  message: string,          // 消息内容
  avatar?: string           // 头像（可选）
)
```

**触发事件**：
```typescript
window.dispatchEvent(new CustomEvent('show-notification', {
  detail: { chatId, title, message, avatar }
}))
```

**监听组件**：
- `SimpleNotificationListener.tsx` - 监听并显示通知
- `IOSNotification.tsx` - iOS风格通知组件

---

## 📊 消息内容对照表

| 互动类型 | 系统消息（灰色小字） | 通知弹窗 |
|---------|-------------------|---------|
| 点赞 | `汁汁点赞了你的朋友圈` | `点赞了你的朋友圈："今天好累"` |
| 评论 | `汁汁在你的朋友圈评论了"哈哈笑死"` | `评论了你的朋友圈："哈哈笑死"` |
| 回复 | `汁汁在你的朋友圈回复小明"我也这么觉得"` | `回复了小明："我也这么觉得"` |

---

## 🎨 样式说明

### 系统消息样式

在 `ChatDetail.tsx` 中渲染：

```tsx
{message.type === 'system' && (
  <div className="flex justify-center my-2">
    <div className="px-4 py-1.5 bg-gray-100 rounded-full text-xs text-gray-500">
      {message.content}
    </div>
  </div>
)}
```

**CSS类**：
- `text-xs` - 小字号
- `text-gray-500` - 灰色文字
- `bg-gray-100` - 浅灰背景
- `rounded-full` - 圆角胶囊形状
- `justify-center` - 居中对齐

### 通知弹窗样式

iOS风格的通知：
- 顶部滑入动画
- 半透明毛玻璃效果
- 自动消失（3秒）
- 可点击进入聊天

---

## 🔍 调试日志

执行朋友圈互动时的控制台输出：

```
📱 检测到朋友圈互动指令: [
  { type: 'like', momentIndex: 1, aiName: '汁汁', aiId: 'zhizhi-001' }
]

✅ 朋友圈互动执行结果: [
  {
    success: true,
    type: 'like',
    aiName: '汁汁',
    momentContent: '今天好累',
    message: '👍 汁汁 点赞了第 1 条朋友圈'
  }
]

💾 [朋友圈互动] 系统消息已保存: 汁汁点赞了你的朋友圈

🔔 [朋友圈互动] 通知已显示: 点赞了你的朋友圈："今天好累"
```

---

## ✅ 功能清单

- [x] 执行朋友圈互动后返回详细结果
- [x] 创建InteractionResult类型定义
- [x] 提取朋友圈内容前20字符用于通知
- [x] 创建系统消息（灰色小字）
- [x] 添加aiReadableContent供AI读取
- [x] 保存系统消息到localStorage
- [x] 更新React状态显示系统消息
- [x] 调用showNotification显示通知弹窗
- [x] 添加详细的控制台日志
- [x] 延迟300ms显示系统消息（和AI消息保持一致）

---

## 🧪 测试步骤

### 测试1：点赞通知

1. 发布朋友圈："今天好累"
2. 在聊天中发消息触发AI回复
3. AI回复包含：`点赞01`
4. 观察聊天界面：
   - ✅ 显示灰色系统消息："汁汁点赞了你的朋友圈"
   - ✅ 弹出通知窗口
5. 打开朋友圈，确认点赞已添加

### 测试2：评论通知

1. 发布朋友圈："为什么没人懂我呢"
2. 在聊天中发消息触发AI回复
3. AI回复包含：`评论02 妈咪你又在发牢骚了🙄`
4. 观察聊天界面：
   - ✅ 显示灰色系统消息："汁汁在你的朋友圈评论了'妈咪你又在发牢骚了🙄'"
   - ✅ 弹出通知窗口
5. 打开朋友圈，确认评论已添加

### 测试3：多个互动

1. 发布2条朋友圈
2. AI同时评论和点赞
3. 观察：
   - ✅ 显示多条系统消息
   - ✅ 显示多个通知（依次弹出）

### 测试4：控制台日志

打开控制台，观察输出：
```
📱 检测到朋友圈互动指令: [...]
✅ 朋友圈互动执行结果: [...]
💾 [朋友圈互动] 系统消息已保存: ...
🔔 [朋友圈互动] 通知已显示: ...
```

---

## 📝 总结

实现了完整的朋友圈互动通知系统：

**用户体验**：
- ✨ 灰色系统消息清晰提示AI的互动
- ✨ iOS风格通知弹窗立即提醒
- ✨ 消息内容详细（包含评论内容或朋友圈摘要）
- ✨ AI可以读取系统通知（通过aiReadableContent）

**技术实现**：
- ✅ 模块化设计，易于维护
- ✅ 完整的类型定义
- ✅ 详细的日志输出
- ✅ 自动保存到localStorage
- ✅ 实时更新UI

**通知类型**：
1. **点赞**："汁汁点赞了你的朋友圈"
2. **评论**："汁汁在你的朋友圈评论了'xxx'"
3. **回复**："汁汁在你的朋友圈回复小明'xxx'"
