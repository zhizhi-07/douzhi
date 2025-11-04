# AI正在输入功能文档

## 📱 功能说明

当AI正在生成回复时，会显示：
1. **顶部标题变化**：显示"正在输入..."
2. **消息列表显示**：AI头像 + 三个跳动的点

---

## 🎨 UI展示

### 顶部状态
```
正常状态：
┌──────────────────┐
│  ← 张三      ⋮   │
└──────────────────┘

输入状态：
┌──────────────────┐
│  ← 正在输入... ⋮  │
└──────────────────┘
```

### 消息列表底部
```
┌────────────────────────┐
│ 用户消息               │
│                        │
│ 🤖                     │  ← AI头像
│ [● ● ●]               │  ← 三个跳动的点
│                        │
└────────────────────────┘
```

---

## 💻 技术实现

### 1. 状态管理
```typescript
const [isAiTyping, setIsAiTyping] = useState(false)

// 开始输入
setIsAiTyping(true)

// 结束输入
setIsAiTyping(false)
```

### 2. 顶部标题动态显示
```tsx
<h1 className="text-lg font-semibold text-gray-900">
  {isAiTyping ? '正在输入...' : (character.nickname || character.realName)}
</h1>
```

### 3. 三个跳动的点
```tsx
{isAiTyping && (
  <div className="flex items-start gap-2 my-2">
    {/* AI头像 */}
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className="w-10 h-10 rounded-lg bg-gray-200...">
        {character.avatar ? (
          <img src={character.avatar} alt={character.realName} />
        ) : (
          <svg>...</svg>
        )}
      </div>
    </div>

    {/* 三个跳动的点 */}
    <div className="flex flex-col items-start">
      <div className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
               style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
               style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
               style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  </div>
)}
```

### 4. 动画效果
使用Tailwind CSS的 `animate-bounce` 类：
- 第一个点：0ms延迟
- 第二个点：150ms延迟
- 第三个点：300ms延迟

形成波浪式跳动效果：`● ● ●` → `  ●   ●   ●  ` → `●     ●     ●`

### 5. 自动滚动
```typescript
useEffect(() => {
  scrollToBottom()
}, [messages, isAiTyping, scrollToBottom])
```
当`isAiTyping`状态改变时，自动滚动到底部。

---

## 🔄 完整流程

### 用户触发AI回复
```
1. 用户点击纸飞机按钮
   ↓
2. setIsAiTyping(true)
   ↓
3. 顶部显示"正在输入..."
   消息列表底部显示三个跳动的点
   ↓
4. 调用AI API
   ↓
5. 收到AI回复
   ↓
6. 解析消息并分段发送
   ↓
7. setIsAiTyping(false)
   ↓
8. 隐藏"正在输入"提示
```

### 代码示例
```typescript
const handleAIReply = useCallback(async () => {
  if (isAiTyping || !character) return
  
  // 1. 开始输入状态
  setIsAiTyping(true)
  setError(null)
  
  try {
    // 2. 获取API配置
    const settings = getApiSettings()
    if (!settings) {
      throw new ChatApiError('请先配置API', 'NO_API_SETTINGS')
    }

    // 3. 调用AI API
    const aiReply = await callAIApi([...], settings)
    
    // 4. 解析并分段发送消息
    const aiMessagesList = parseAIMessages(aiReply)
    
    for (const content of aiMessagesList) {
      const aiMessage = createMessage(content, 'received')
      await new Promise(resolve => setTimeout(resolve, 300))
      setMessages(prev => [...prev, aiMessage])
    }
    
  } catch (error) {
    console.error('AI回复失败:', error)
    if (error instanceof ChatApiError) {
      setError(error.message)
    } else {
      setError('AI回复失败，请稍后重试')
    }
  } finally {
    // 5. 结束输入状态
    setIsAiTyping(false)
  }
}, [isAiTyping, character, messages])
```

---

## 🎯 视觉效果

### 跳动动画时序
```
时间轴：
0ms   → 第一个点开始弹跳  ●
150ms → 第二个点开始弹跳    ●
300ms → 第三个点开始弹跳      ●

效果：
●  ●  ●
 ● ● ●
  ●●●
 ● ● ●
●  ●  ●
```

### CSS动画
Tailwind的`animate-bounce`默认效果：
```css
@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}
```

通过`animationDelay`错开三个点的动画，形成波浪效果。

---

## 📋 状态切换表

| 阶段 | isAiTyping | 顶部标题 | 消息列表 | 输入框 |
|------|-----------|---------|---------|--------|
| **空闲** | false | 角色名 | 正常显示 | 可用 |
| **用户输入** | false | 角色名 | 正常显示 | 可用 |
| **AI思考中** | true | "正在输入..." | 显示跳动点 | 禁用 |
| **AI发送消息** | true | "正在输入..." | 显示跳动点 + 逐条显示消息 | 禁用 |
| **完成** | false | 角色名 | 显示完整对话 | 可用 |

---

## 🚀 优化建议

### 1. 防止重复触发
```typescript
if (isAiTyping) return  // AI正在输入时，禁止再次触发
```

### 2. 输入框禁用
```tsx
<input
  disabled={isAiTyping}  // AI输入时禁用输入框
  ...
/>
```

### 3. 按钮状态
```tsx
<button 
  disabled={isAiTyping}  // AI输入时禁用按钮
  className={isAiTyping ? 'opacity-50' : ''}
>
```

### 4. 自动滚动
确保显示"正在输入"时也自动滚动到底部。

---

## 🎨 样式配置

### 点的大小和颜色
```tsx
className="w-2 h-2 bg-gray-400 rounded-full"
```
可调整参数：
- `w-2 h-2`：点的大小（2 = 0.5rem = 8px）
- `bg-gray-400`：点的颜色

### 气泡样式
```tsx
className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm"
```
- `bg-white`：白色背景
- `px-4 py-3`：内边距
- `rounded-tl-none`：左上角无圆角（与AI消息一致）
- `shadow-sm`：轻微阴影

---

## ✅ 功能清单

- [x] 顶部标题显示"正在输入..."
- [x] 消息列表显示AI头像
- [x] 三个跳动的点动画
- [x] 动画延迟错开（0ms, 150ms, 300ms）
- [x] 输入时自动滚动到底部
- [x] 输入时禁用输入框和按钮
- [x] 完成后恢复正常状态

---

**版本**: 1.2.0  
**更新日期**: 2025-11-04  
**特性**: AI正在输入可视化反馈
