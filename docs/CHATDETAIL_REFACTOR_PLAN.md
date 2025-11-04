# ChatDetail.tsx 重构计划

## 📊 当前状态

**代码行数**: 471行 ❌ （超过400行，需要重构）
**代码质量**: B- (75/100) ⚠️

---

## 🔍 问题分析

### 1. 🔴 文件过大（严重）
- **当前**: 471行
- **建议**: 单个组件不超过300行
- **问题**: 所有逻辑都在一个文件里

### 2. 🟡 职责过多（中等）
ChatDetail.tsx 当前负责：
- UI渲染
- 状态管理（7个状态）
- 消息处理
- AI调用
- 长按检测
- 加号菜单
- 消息菜单
- 输入处理

### 3. 🟡 大量处理函数（中等）
```typescript
handleSend()              // 发送消息
handleAIReply()           // AI回复
handleSelectRecall()      // 重回
handleSelectImage()       // 相册
handleSelectCamera()      // 拍照
handleSelectTransfer()    // 转账
handleSelectIntimatePay() // 亲密付
handleSelectCoupleSpace() // 情侣空间
handleSelectLocation()    // 位置
handleSelectVoice()       // 语音
handleSelectVideoCall()   // 视频通话
handleSelectMusicInvite() // 一起听
handleLongPressStart()    // 长按开始
handleLongPressEnd()      // 长按结束
handleCopyMessage()       // 复制
handleDeleteMessage()     // 删除
handleRecallMessage()     // 撤回
handleQuoteMessage()      // 引用
handleEditMessage()       // 编辑
handleBatchDelete()       // 批量删除
```
**共20个处理函数** ❌

---

## 🎯 重构方案

### 方案1：拆分为多个Custom Hooks（推荐）✅

```
src/pages/ChatDetail/
├── ChatDetail.tsx           (100行) - 主组件
├── hooks/
│   ├── useChatState.ts      (50行)  - 状态管理
│   ├── useChatMessages.ts   (80行)  - 消息处理
│   ├── useChatAI.ts         (60行)  - AI交互
│   ├── useLongPress.ts      (40行)  - 长按检测
│   ├── useAddMenu.ts        (60行)  - 加号菜单
│   └── useMessageMenu.ts    (60行)  - 消息菜单
└── components/
    ├── ChatHeader.tsx       (30行)  - 顶部栏
    ├── MessageList.tsx      (50行)  - 消息列表
    ├── MessageItem.tsx      (40行)  - 消息项
    └── ChatInput.tsx        (50行)  - 输入栏
```

**优势**：
- ✅ 逻辑复用
- ✅ 职责清晰
- ✅ 易于测试
- ✅ 便于维护

---

## 📋 重构步骤

### 阶段1：创建Custom Hooks

#### 1. useChatState.ts
```typescript
// 管理所有状态
export const useChatState = (id: string) => {
  const [character, setCharacter] = useState<Character | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 加载角色和消息
  useEffect(() => { ... }, [id])
  
  return {
    character,
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isAiTyping,
    setIsAiTyping,
    error,
    setError
  }
}
```

#### 2. useChatAI.ts
```typescript
// AI交互逻辑
export const useChatAI = (character, messages) => {
  const [isAiTyping, setIsAiTyping] = useState(false)
  
  const handleAIReply = useCallback(async () => {
    // AI调用逻辑
  }, [character, messages])
  
  return { handleAIReply, isAiTyping }
}
```

#### 3. useLongPress.ts
```typescript
// 长按检测
export const useLongPress = (onLongPress: (msg: Message) => void) => {
  const timerRef = useRef<number | null>(null)
  
  const handleLongPressStart = useCallback((message, event) => {
    // 长按逻辑
  }, [onLongPress])
  
  const handleLongPressEnd = useCallback(() => {
    // 结束逻辑
  }, [])
  
  return { handleLongPressStart, handleLongPressEnd }
}
```

#### 4. useAddMenu.ts
```typescript
// 加号菜单逻辑
export const useAddMenu = () => {
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  const handleSelectImage = useCallback(() => { ... }, [])
  const handleSelectCamera = useCallback(() => { ... }, [])
  // ... 其他处理函数
  
  return {
    showAddMenu,
    setShowAddMenu,
    handlers: {
      handleSelectImage,
      handleSelectCamera,
      // ...
    }
  }
}
```

#### 5. useMessageMenu.ts
```typescript
// 消息菜单逻辑
export const useMessageMenu = (messages, setMessages) => {
  const [showMenu, setShowMenu] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  
  const handleCopy = useCallback(() => { ... }, [selectedMessage])
  const handleDelete = useCallback(() => { ... }, [selectedMessage, messages])
  // ... 其他处理函数
  
  return {
    showMenu,
    selectedMessage,
    setShowMenu,
    setSelectedMessage,
    handlers: {
      handleCopy,
      handleDelete,
      // ...
    }
  }
}
```

---

### 阶段2：拆分UI组件

#### 1. ChatHeader.tsx
```typescript
interface ChatHeaderProps {
  character: Character | null
  isAiTyping: boolean
  onBack: () => void
}

const ChatHeader = ({ character, isAiTyping, onBack }: ChatHeaderProps) => {
  return (
    <div className="glass-effect">
      <StatusBar />
      <div className="px-5 py-4 flex items-center justify-between">
        <button onClick={onBack}>←</button>
        <h1>{isAiTyping ? '正在输入...' : character?.nickname}</h1>
        <button>⋮</button>
      </div>
    </div>
  )
}
```

#### 2. MessageList.tsx
```typescript
interface MessageListProps {
  messages: Message[]
  character: Character
  isAiTyping: boolean
  onLongPress: (msg: Message, e: Event) => void
}

const MessageList = ({ messages, character, isAiTyping, onLongPress }: MessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map(message => (
        <MessageItem
          key={message.id}
          message={message}
          character={character}
          onLongPress={onLongPress}
        />
      ))}
      {isAiTyping && <TypingIndicator character={character} />}
    </div>
  )
}
```

#### 3. ChatInput.tsx
```typescript
interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onAIReply: () => void
  onOpenMenu: () => void
  isAiTyping: boolean
}

const ChatInput = ({ value, onChange, onSend, onAIReply, onOpenMenu, isAiTyping }: ChatInputProps) => {
  return (
    <div className="glass-effect border-t border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2">
        <button onClick={onOpenMenu}>+</button>
        <input value={value} onChange={e => onChange(e.target.value)} />
        <button>😊</button>
        <button onClick={value.trim() ? onSend : onAIReply}>
          ✈️
        </button>
      </div>
    </div>
  )
}
```

---

### 阶段3：重构后的ChatDetail.tsx

```typescript
// ChatDetail.tsx (约100行)
const ChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  // 使用Custom Hooks
  const chatState = useChatState(id || '')
  const chatAI = useChatAI(chatState.character, chatState.messages)
  const addMenu = useAddMenu()
  const messageMenu = useMessageMenu(chatState.messages, chatState.setMessages)
  const longPress = useLongPress((msg) => {
    messageMenu.setSelectedMessage(msg)
    messageMenu.setShowMenu(true)
  })
  
  if (!chatState.character) {
    return <div>角色不存在</div>
  }
  
  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      <ChatHeader 
        character={chatState.character}
        isAiTyping={chatAI.isAiTyping}
        onBack={() => navigate(-1)}
      />
      
      <MessageList
        messages={chatState.messages}
        character={chatState.character}
        isAiTyping={chatAI.isAiTyping}
        onLongPress={longPress.handleLongPressStart}
      />
      
      <ChatInput
        value={chatState.inputValue}
        onChange={chatState.setInputValue}
        onSend={chatState.handleSend}
        onAIReply={chatAI.handleAIReply}
        onOpenMenu={() => addMenu.setShowAddMenu(true)}
        isAiTyping={chatAI.isAiTyping}
      />
      
      <AddMenu 
        isOpen={addMenu.showAddMenu}
        onClose={() => addMenu.setShowAddMenu(false)}
        {...addMenu.handlers}
      />
      
      <MessageMenu
        isOpen={messageMenu.showMenu}
        message={messageMenu.selectedMessage}
        onClose={() => messageMenu.setShowMenu(false)}
        {...messageMenu.handlers}
      />
    </div>
  )
}
```

---

## 📊 重构前后对比

| 维度 | 重构前 | 重构后 | 提升 |
|------|--------|--------|------|
| **文件行数** | 471行 | 100行 | -79% ⬇️ |
| **职责数量** | 8个 | 1个 | -88% ⬇️ |
| **函数数量** | 20个 | 5个 | -75% ⬇️ |
| **可测试性** | 困难 | 容易 | ✅ |
| **可维护性** | 差 | 优秀 | ✅ |
| **代码复用** | 无 | 高 | ✅ |

---

## ✅ 重构优势

### 1. 文件更小
- ChatDetail.tsx: 471行 → 100行
- 每个Hook: 40-80行
- 每个组件: 30-50行

### 2. 职责清晰
- ChatDetail: 只负责组合
- Hooks: 各自负责一块逻辑
- Components: 只负责UI

### 3. 易于测试
```typescript
// 可以单独测试每个Hook
describe('useChatAI', () => {
  it('should call AI API', async () => {
    const { result } = renderHook(() => useChatAI(character, messages))
    await act(() => result.current.handleAIReply())
    expect(callAIApi).toHaveBeenCalled()
  })
})
```

### 4. 逻辑复用
```typescript
// 可以在其他地方复用Hook
const GroupChatDetail = () => {
  const chatAI = useChatAI(character, messages) // 复用AI逻辑
  // ...
}
```

### 5. 易于扩展
```typescript
// 添加新功能只需新增Hook
const videoCall = useVideoCall()
const voiceMessage = useVoiceMessage()
```

---

## 🚀 实施建议

### 优先级1（立即）
1. ✅ 创建hooks目录结构
2. ✅ 提取useChatState
3. ✅ 提取useChatAI
4. ✅ 重构ChatDetail使用新Hooks

### 优先级2（本周）
5. 提取useLongPress
6. 提取useAddMenu
7. 提取useMessageMenu

### 优先级3（下周）
8. 拆分UI组件
9. 添加单元测试
10. 性能优化

---

## 📝 命名规范

### Hooks命名
- `use` + 功能名称
- 驼峰命名
- 例：`useChatState`, `useLongPress`

### 组件命名
- PascalCase
- 清晰描述功能
- 例：`ChatHeader`, `MessageList`

### 处理函数
- `handle` + 动作
- 例：`handleSend`, `handleCopy`

---

## ⚠️ 注意事项

### 1. 保持向后兼容
重构时确保功能不受影响

### 2. 渐进式重构
不要一次性重构所有代码，分步进行

### 3. 添加测试
重构的同时添加单元测试

### 4. 文档更新
更新相关文档说明新架构

---

## 📚 参考资料

### React Hooks最佳实践
- 单一职责原则
- 依赖数组优化
- 避免过度抽象

### 组件拆分原则
- 一个组件一个职责
- Props不超过10个
- 文件不超过200行

---

**评审日期**: 2025-11-04  
**当前状态**: 需要重构 ⚠️  
**目标状态**: 优秀可维护 ✅  
**预计工时**: 4-6小时
