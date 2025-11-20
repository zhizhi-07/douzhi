# 线下聊天输入框重新设计

## ✅ 修改完成

### 1. 消息气泡 - 去除时间戳
- ❌ 之前：每条消息上方显示时间戳（14:30）
- ✅ 现在：完全去除时间戳，更干净

### 2. 输入框区域 - 全面简化
#### 去除的元素
- ❌ 顶部边框线 (`border-t border-gray-200`)
- ❌ 字数统计显示 (`XX 字`)
- ❌ 自动保存状态提示 (`保存中...` / `已保存`)
- ❌ 输入框边框 (`border border-gray-300`)

#### 新设计
- ✅ 背景：浅灰色 (`bg-gray-50`)
- ✅ 输入框：纯白圆形胶囊 (`rounded-full`)
- ✅ 阴影：轻微阴影 (`shadow-sm`)
- ✅ 按钮：圆形背景，灰色/黑色配色

---

## 新样式预览

### 输入区域结构
```
┌─────────────────────────────────────┐
│  背景：浅灰色 (bg-gray-50)             │
│                                     │
│  ╭────────────────────────────────╮ │
│  │  📝 输入框  [⚡] [🌲] [✓]      │ │ ← 圆形胶囊
│  ╰────────────────────────────────╯ │
│                                     │
└─────────────────────────────────────┘
```

### 按钮样式
```
[⚡] 动作建议  →  灰色圆形按钮
[🌲] 剧情分支  →  灰色圆形按钮
[✓]  发送     →  黑色圆形按钮（主按钮）
```

---

## 样式细节

### 输入区域容器
```tsx
<div className="bg-gray-50 px-6 py-4">
  <div className="max-w-2xl mx-auto">
    {/* 输入框 */}
  </div>
</div>
```
- **背景**: `bg-gray-50` (浅灰)
- **内边距**: `px-6 py-4`
- **最大宽度**: `max-w-2xl` (672px)
- **居中**: `mx-auto`

### 输入框胶囊
```tsx
<div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-sm">
  <textarea />
  <div className="flex items-center gap-2">
    {/* 按钮 */}
  </div>
</div>
```
- **形状**: `rounded-full` (全圆角胶囊)
- **背景**: `bg-white` (纯白)
- **阴影**: `shadow-sm` (轻微)
- **内边距**: `px-5 py-3`
- **布局**: `flex items-center gap-3`

### 功能按钮
```tsx
// 动作建议 & 剧情分支（灰色）
<button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
  <svg className="w-4 h-4 text-gray-600" />
</button>

// 发送按钮（黑色）
<button className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 disabled:bg-gray-200 flex items-center justify-center">
  <svg className="w-4 h-4 text-white" />
</button>
```
- **尺寸**: `w-8 h-8` (32px)
- **形状**: `rounded-full` (圆形)
- **图标**: `w-4 h-4` (16px)
- **间距**: `gap-2`

---

## 对比图

### 修改前（复杂）
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ↑ 顶部边框线
┌────────────────────────────────┐
│  12 字          [✓] 已保存       │ ← 字数统计+状态
│  ┌──────────────────────────┐  │
│  │ 输入框  [⚡] [🌲] [✓]    │  │ ← 方形边框
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### 修改后（简洁）
```
┌────────────────────────────────┐
│  ╭──────────────────────────╮  │
│  │ 输入框  ⚡  🌲  ✓       │  │ ← 圆形胶囊
│  ╰──────────────────────────╯  │
└────────────────────────────────┘
   ↑ 无边框线，浅灰背景
```

---

## 技术细节

### 完整代码结构
```tsx
{/* Input */}
<div className="bg-gray-50 px-6 py-4">
  <div className="max-w-2xl mx-auto">
    <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-sm">
      <textarea
        value={inputValue}
        onChange={handleChange}
        placeholder="写下你的文字..."
        className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 resize-none min-h-[20px] max-h-[120px]"
        rows={1}
      />
      
      <div className="flex items-center gap-2">
        {/* 动作建议 */}
        <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-600">⚡</svg>
        </button>
        
        {/* 剧情分支 */}
        <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-600">🌲</svg>
        </button>
        
        {/* 发送 */}
        <button className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 disabled:bg-gray-200 flex items-center justify-center">
          <svg className="w-4 h-4 text-white">✓</svg>
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 修改文件

### `OfflineChat.tsx`
- ✅ 去除顶部边框线
- ✅ 删除字数统计UI
- ✅ 删除自动保存状态显示
- ✅ 输入框改为全圆角胶囊
- ✅ 按钮改为圆形背景
- ✅ 简化整体布局

### `OfflineMessageBubble.tsx`
- ✅ 去除时间戳显示
- ✅ 删除 `formatTime` 函数

---

## 视觉效果

### 颜色方案
- **背景**: `#F9FAFB` (gray-50)
- **输入框**: `#FFFFFF` (white)
- **按钮灰色**: `#F3F4F6` (gray-100)
- **按钮黑色**: `#000000` (black)
- **文字**: `#374151` (gray-700)
- **占位符**: `#9CA3AF` (gray-400)

### 圆角规格
- **输入框**: `rounded-full` (完全圆形)
- **按钮**: `rounded-full` (圆形)
- **阴影**: `shadow-sm` (轻微)

---

## 交互体验

### 按钮悬停效果
- 灰色按钮: `hover:bg-gray-200` (变深)
- 黑色按钮: `hover:bg-gray-800` (变浅)
- 禁用状态: `disabled:bg-gray-200` (浅灰)

### 输入框行为
- 单行输入，自动换行
- 最小高度: 20px
- 最大高度: 120px
- Enter 发送，Shift+Enter 换行
- 无边框聚焦效果（更干净）

---

## 功能保留

虽然UI简化，但功能完全保留：
- ✅ 文字输入
- ✅ 动作建议
- ✅ 剧情分支
- ✅ 发送消息
- ✅ AI回复中的加载状态
- ✅ 自动保存草稿（后台运行，不显示）

---

## 更新日志

### 2024-11-20
- ✅ 去除消息时间戳
- ✅ 简化输入框区域
- ✅ 改为全圆角设计
- ✅ 去除所有多余线条
- ✅ 按钮改为圆形背景
- ✅ 删除字数统计和保存状态
- ✅ 整体视觉更干净、更现代

---

## 可选调整

如果需要进一步调整：

### 输入框大小
```tsx
// 更大: px-6 py-4
// 更小: px-4 py-2
```

### 按钮大小
```tsx
// 更大: w-10 h-10
// 更小: w-7 h-7
```

### 背景颜色
```tsx
// 更浅: bg-gray-100
// 纯白: bg-white
// 自定义: bg-[#F5F5F5]
```

### 阴影强度
```tsx
// 更明显: shadow-md
// 无阴影: shadow-none
```
