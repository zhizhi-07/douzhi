# Command Handlers 架构指南

## 📖 概述
Command Handlers 是处理AI指令的统一系统，确保所有AI发送的特殊消息（转账、表情包、语音等）都能正确保存。

## 🏗️ 核心架构

### 1. 关键原则
⚠️ **必须遵守**：所有创建消息的handler都必须传入`chatId`并调用`addMessage(message, setMessages, chatId)`

### 2. CommandContext 接口
```typescript
export interface CommandContext {
  messages: Message[]           // 当前消息列表
  setMessages: (fn) => void     // 更新消息状态
  character: any                // 角色信息
  chatId: string                // 🔥 聊天ID（必需，用于保存）
  isBlocked?: boolean           // 🔥 拉黑状态（用于显示感叹号）
  onVideoCallRequest?: () => void
  onEndCall?: () => void
}
```

### 3. 核心函数

#### createMessageObj - 创建消息对象
```typescript
const createMessageObj = (
  type: Message['messageType'],
  data: any,
  isBlocked?: boolean  // 🔥 拉黑状态，用于显示感叹号
) => {
  return {
    id: generateMessageId(),
    type: 'received',
    messageType: type,
    blocked: isBlocked,  // 🔥 关键：设置拉黑标记
    ...data
  }
}
```

#### addMessage - 保存消息
```typescript
const addMessage = async (
  message: Message,
  setMessages: (fn) => void,
  chatId?: string  // 🔥 必须传入
) => {
  // 1. 更新React状态
  // 2. 保存到localStorage（如果有chatId）
}
```

## 📝 Handler 编写规范

### ✅ 正确示例
```typescript
export const emojiHandler: CommandHandler = {
  pattern: /[\[【]表情包[:\：](.+?)[\]】]/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    //                                         ^^^^^^^ ^^^^^^^^^ 解构chatId和isBlocked
    const emojiMsg = createMessageObj('emoji', {...}, isBlocked)
    //                                                ^^^^^^^^^ 传入拉黑状态
    await addMessage(emojiMsg, setMessages, chatId)
    //                                      ^^^^^^ 传入chatId
    return { handled: true, ... }
  }
}
```

### ❌ 错误示例
```typescript
// 错误1: 没有从context解构chatId和isBlocked
handler: async (match, content, { setMessages }) => {
  const msg = createMessageObj('type', {...})  // ❌ 缺少isBlocked
  await addMessage(msg, setMessages)  // ❌ 缺少chatId
}

// 错误2: 解构了但没使用
handler: async (match, content, { setMessages, chatId, isBlocked }) => {
  const msg = createMessageObj('type', {...})  // ❌ 没传isBlocked
  await addMessage(msg, setMessages)  // ❌ 没传chatId
}

// 错误3: 只传了chatId，没传isBlocked
handler: async (match, content, { setMessages, chatId, isBlocked }) => {
  const msg = createMessageObj('type', {...})  // ❌ 特殊消息不会显示感叹号
  await addMessage(msg, setMessages, chatId)
}
```

## 🔍 Handler 分类

### A. 创建新消息的 Handlers（必须传chatId）
- ✅ transferHandler - 转账
- ✅ receiveTransferHandler - 接收转账  
- ✅ rejectTransferHandler - 退还转账
- ✅ voiceHandler - 语音
- ✅ locationHandler - 位置
- ✅ photoHandler - 照片
- ✅ emojiHandler - 表情包
- ✅ coupleSpaceAcceptHandler - 接受情侣空间
- ✅ coupleSpaceRejectHandler - 拒绝情侣空间
- ✅ coupleSpaceInviteHandler - 情侣空间邀请
- ✅ coupleSpacePhotoHandler - 相册
- ✅ coupleSpaceMessageHandler - 留言
- ✅ coupleSpaceAnniversaryHandler - 纪念日
- ✅ coupleSpaceEndHandler - 解除情侣空间
- ✅ intimatePayHandler - 亲密付
- ✅ acceptIntimatePayHandler - 接受亲密付
- ✅ rejectIntimatePayHandler - 拒绝亲密付
- ✅ blockUserHandler - 拉黑
- ✅ unblockUserHandler - 解除拉黑

### B. 只修改状态的 Handlers（可选chatId）
- videoCallHandler - 触发视频通话
- endCallHandler - 挂断电话
- recallHandler - 撤回消息（修改现有消息）
- quoteHandler - 引用消息（不创建新消息）

## 🚀 添加新Handler的步骤

1. **定义handler**
```typescript
export const myHandler: CommandHandler = {
  pattern: /正则表达式/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    // 1. 解析指令参数
    const param = match[1]
    
    // 2. 创建消息对象（传入isBlocked以显示感叹号）
    const msg = createMessageObj('type', { ... }, isBlocked)
    
    // 3. 保存消息（传入chatId）
    await addMessage(msg, setMessages, chatId)
    
    // 4. 返回结果
    return {
      handled: true,
      remainingText: content.replace(match[0], '').trim(),
      skipTextMessage: !remainingText
    }
  }
}
```

2. **注册到commandHandlers数组**
```typescript
export const commandHandlers: CommandHandler[] = [
  // ...
  myHandler,  // 添加到这里
]
```

3. **测试checklist**
- [ ] 消息能正确显示
- [ ] 刷新页面后消息仍存在
- [ ] 控制台有保存日志

## 🐛 调试技巧

### 检查消息是否保存
1. 打开控制台
2. 触发指令
3. 查看日志：
```
💾 [addMessage] 已保存消息到localStorage: {...}
📦 加载消息: chatId=xxx, 总数=x, 表情包消息=x
```

### 常见问题
1. **消息刷新后消失** → chatId没传入addMessage
2. **保存报错** → chatId为undefined
3. **消息重复** → messageId生成问题
4. **特殊消息没有感叹号** → isBlocked没传入createMessageObj
5. **拉黑后感叹号不显示** → CommandContext缺少isBlocked字段

## 📊 维护清单

### 每次修改后检查
- [ ] 所有handler都有chatId参数
- [ ] 所有addMessage调用都传入chatId
- [ ] CommandContext接口保持一致
- [ ] 日志完整清晰

### 代码审查要点
- 新增handler是否遵循规范
- 是否有未使用的参数
- 错误处理是否完善

## 🔗 相关文件
- `commandHandlers.ts` - Handler定义
- `useChatAI.ts` - Handler调用
- `simpleMessageManager.ts` - 消息保存
- `types/chat.ts` - Message类型定义
