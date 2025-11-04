# 长按消息菜单功能文档

## 📱 功能说明

长按消息（500ms）会弹出操作菜单，提供多种消息操作选项。

---

## 🎯 菜单功能列表

### 1. 📋 **复制**
- 功能：复制消息内容到剪贴板
- 适用：所有消息
- 状态：UI完成，功能待实现

### 2. 💬 **引用**
- 功能：引用该消息进行回复
- 适用：所有消息
- 状态：UI完成，功能待实现

### 3. ✏️ **编辑**
- 功能：编辑自己发送的消息
- 适用：仅自己发送的消息
- 状态：UI完成，功能待实现

### 4. ↩️ **撤回**
- 功能：撤回自己发送的消息
- 适用：仅自己发送的消息，且2分钟内
- 状态：UI完成，功能待实现

### 5. 🗑️ **删除**
- 功能：删除消息（仅本地删除）
- 适用：所有消息
- 状态：UI完成，功能待实现
- 危险操作：显示为红色

### 6. 📦 **批量删除**
- 功能：进入批量删除模式
- 适用：所有情况
- 状态：UI完成，功能待实现

---

## 🎨 UI设计

### 菜单布局
```
┌──────────────────────────────┐
│ [液态玻璃遮罩 - 可点击关闭]   │
│                              │
│  ┌────────────────────────┐  │
│  │      ────              │  │ ← 拖动条
│  │                        │  │
│  │  你/对方               │  │ ← 消息来源
│  │  这是消息内容...        │  │ ← 消息预览
│  │ ────────────────────── │  │
│  │                        │  │
│  │  📋  复制              │  │
│  │  💬  引用              │  │
│  │  ✏️  编辑              │  │
│  │  ↩️  撤回 (红色)       │  │
│  │  🗑️  删除 (红色)       │  │
│  │  📦  批量删除           │  │
│  │                        │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 设计特点
- ✅ 液态玻璃遮罩效果
- ✅ 消息预览（最多2行）
- ✅ SVG图标替代emoji
- ✅ 危险操作红色显示
- ✅ 按钮点击反馈
- ✅ 无取消按钮（点击遮罩关闭）

---

## 💻 技术实现

### 1. 长按检测
```typescript
const longPressTimerRef = useRef<number | null>(null)

// 长按开始
const handleLongPressStart = useCallback((message: Message, _event) => {
  longPressTimerRef.current = window.setTimeout(() => {
    setLongPressedMessage(message)
    setShowMessageMenu(true)
    // 振动反馈
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, 500) // 500ms触发
}, [])

// 长按结束
const handleLongPressEnd = useCallback(() => {
  if (longPressTimerRef.current) {
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }
}, [])
```

### 2. 消息气泡绑定事件
```typescript
<div
  className="px-3 py-2 rounded-lg cursor-pointer..."
  onTouchStart={(e) => handleLongPressStart(message, e)}
  onTouchEnd={handleLongPressEnd}
  onMouseDown={(e) => handleLongPressStart(message, e)}
  onMouseUp={handleLongPressEnd}
  onMouseLeave={handleLongPressEnd}
>
  {message.content}
</div>
```

### 3. 菜单动态显示
```typescript
// 根据消息类型动态显示菜单项
const isSentMessage = message.type === 'sent'
const canRecall = isSentMessage && (Date.now() - message.timestamp < 120000)

// 编辑：仅自己的消息
if (isSentMessage) {
  menuItems.push({ label: '编辑', ... })
}

// 撤回：仅自己的消息，且2分钟内
if (canRecall) {
  menuItems.push({ label: '撤回', danger: true, ... })
}
```

---

## 🔄 交互流程

```
1. 用户长按消息
   ↓
2. 500ms后触发长按
   ↓
3. 振动反馈（50ms）
   ↓
4. 显示菜单（slide-up动画）
   ↓
5. 用户选择操作
   ↓
6. 执行对应处理函数
   ↓
7. 关闭菜单
```

---

## 📋 菜单项配置

```typescript
interface MenuItemConfig {
  label: string        // 菜单文本
  onClick: () => void  // 点击处理
  icon: JSX.Element    // SVG图标
  danger?: boolean     // 是否危险操作（红色）
}
```

---

## 🎯 功能状态

### ✅ 已完成
- [x] MessageMenu 组件
- [x] 长按检测逻辑
- [x] 振动反馈
- [x] 菜单动画
- [x] 液态玻璃效果
- [x] SVG图标
- [x] 消息预览
- [x] 2分钟撤回限制判断
- [x] 危险操作标记

### ⏳ 待实现
- [ ] 复制功能（剪贴板API集成）
- [ ] 删除功能（从消息列表移除）
- [ ] 撤回功能（标记为已撤回）
- [ ] 引用功能（设置引用消息）
- [ ] 编辑功能（修改消息内容）
- [ ] 批量删除（进入选择模式）

---

## 🔧 处理函数（当前为占位）

```typescript
// 复制
const handleCopyMessage = () => {
  navigator.clipboard.writeText(message.content)
  console.log('已复制:', message.content)
  // TODO: 显示复制成功提示
}

// 删除
const handleDeleteMessage = () => {
  console.log('删除消息:', message.id)
  // TODO: 从消息列表移除
}

// 撤回
const handleRecallMessage = () => {
  console.log('撤回消息:', message.id)
  // TODO: 标记为已撤回
}

// 引用
const handleQuoteMessage = () => {
  console.log('引用消息:', message.id)
  // TODO: 设置quotedMessage状态
}

// 编辑
const handleEditMessage = () => {
  console.log('编辑消息:', message.id)
  // TODO: 设置编辑模式
}

// 批量删除
const handleBatchDelete = () => {
  console.log('批量删除')
  // TODO: 进入批量选择模式
}
```

---

## 🎨 样式配置

### 遮罩层
```typescript
className="fixed inset-0 z-50 glass-dark"
```

### 菜单面板
```typescript
className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl z-50 animate-slide-up pb-safe"
```

### 菜单项
```typescript
className={`w-full px-5 py-3 flex items-center gap-3 
  hover:bg-white/50 active:bg-white/70 
  transition-all active:scale-[0.98]
  ${item.danger ? 'text-red-500' : 'text-gray-800'}`}
```

---

## 🐛 调试信息

所有功能当前都会在控制台输出日志：
```javascript
console.log('已复制:', message.content)
console.log('删除消息:', message.id)
console.log('撤回消息:', message.id)
console.log('引用消息:', message.id)
console.log('编辑消息:', message.id)
console.log('批量删除')
```

可以按 **F12** 打开开发者工具，长按消息并点击菜单项查看日志输出。

---

## 📊 撤回限制

```typescript
// 2分钟 = 120000毫秒
const canRecall = isSentMessage && (Date.now() - message.timestamp < 120000)
```

消息发送超过2分钟后，撤回选项将不再显示。

---

## ✨ 用户体验优化

### 1. 振动反馈
```typescript
if (navigator.vibrate) {
  navigator.vibrate(50) // 50ms振动
}
```

### 2. 滑入动画
```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

### 3. 按钮反馈
- hover: 背景变亮
- active: 轻微缩小（scale-[0.98]）
- transition: 流畅过渡

---

## 📚 文件清单

1. `src/components/MessageMenu.tsx` - 长按菜单组件
2. `src/pages/ChatDetail.tsx` - 聊天页面（已集成）
3. `docs/MESSAGE_MENU_FEATURES.md` - 本文档

---

## 🚀 后续实现计划

### 阶段1：基础功能（优先）
1. 复制功能 - 使用Clipboard API
2. 删除功能 - 从messages数组移除
3. 撤回功能 - 添加isRecalled字段

### 阶段2：高级功能
4. 引用功能 - 实现引用回复UI
5. 编辑功能 - 实现消息编辑UI
6. 批量删除 - 实现多选模式

### 阶段3：优化
7. 撤回消息显示 - "你撤回了一条消息"
8. 编辑消息标记 - "已编辑"标签
9. 操作成功提示 - Toast通知

---

**版本**: 1.5.0  
**创建日期**: 2025-11-04  
**功能**: 长按消息菜单UI完成，功能逻辑待实现
