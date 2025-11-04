# 聊天系统架构文档

## 📁 目录结构

```
src/
├── types/
│   └── chat.ts                 # 类型定义（Message, Character, ApiSettings等）
├── utils/
│   ├── chatApi.ts              # AI API调用服务
│   ├── messageUtils.ts         # 消息处理工具函数
│   └── storage.ts              # 存储工具
├── services/
│   ├── apiService.ts           # API配置服务
│   └── characterService.ts     # 角色数据服务
└── pages/
    └── ChatDetail.tsx          # 聊天详情页面组件
```

## 🏗️ 架构设计原则

### 1. 关注点分离 (Separation of Concerns)
- **类型定义** (`types/chat.ts`)：统一的类型定义
- **业务逻辑** (`utils/chatApi.ts`)：API调用、错误处理
- **数据处理** (`utils/messageUtils.ts`)：消息创建、转换、存储
- **UI组件** (`pages/ChatDetail.tsx`)：界面展示和用户交互

### 2. 单一职责 (Single Responsibility)
每个模块只负责一个明确的功能：
- `chatApi.ts`：只负责API通信
- `messageUtils.ts`：只负责消息数据处理
- `ChatDetail.tsx`：只负责UI渲染和事件处理

### 3. 依赖注入和可测试性
- 使用纯函数，便于单元测试
- 避免在组件中直接调用localStorage
- 通过工具函数封装外部依赖

## 📦 模块说明

### types/chat.ts
**职责**：定义所有聊天相关的TypeScript类型

```typescript
- Message: 消息对象类型
- Character: 角色对象类型
- ApiSettings: API配置类型
- ChatMessage: API通信消息格式
```

**优势**：
- 类型安全，减少运行时错误
- 便于IDE自动补全
- 统一管理类型定义

---

### utils/chatApi.ts
**职责**：处理所有AI API相关的调用

**核心功能**：
1. `getApiSettings()`: 读取API配置
2. `buildSystemPrompt()`: 构建系统提示词
3. `callAIApi()`: 调用AI API并处理响应
4. `ChatApiError`: 自定义错误类型

**特点**：
- ✅ 错误分类处理（认证失败、限流、服务器错误等）
- ✅ 超时控制（60秒）
- ✅ 响应格式验证
- ✅ 详细的错误信息

**使用示例**：
```typescript
try {
  const settings = getApiSettings()
  const reply = await callAIApi(messages, settings)
} catch (error) {
  if (error instanceof ChatApiError) {
    console.log(error.code) // 错误代码
    console.log(error.message) // 错误信息
  }
}
```

---

### utils/messageUtils.ts
**职责**：处理消息的创建、转换和存储

**核心功能**：
1. `createMessage()`: 创建新消息对象
2. `convertToApiMessages()`: 转换为API格式
3. `getRecentMessages()`: 获取最近N条消息
4. `loadChatMessages()`: 从localStorage加载消息
5. `saveChatMessages()`: 保存消息到localStorage

**配置常量**：
```typescript
MESSAGE_CONFIG = {
  MAX_HISTORY_COUNT: 10,        // 最大历史消息数
  STORAGE_KEY_PREFIX: 'chat_messages_'
}
```

**特点**：
- ✅ 纯函数设计，易于测试
- ✅ 统一的消息创建逻辑
- ✅ 错误捕获和日志记录

---

### pages/ChatDetail.tsx
**职责**：聊天界面的展示和交互

**状态管理**：
```typescript
- character: 当前角色信息
- messages: 消息列表
- inputValue: 输入框内容
- isAiTyping: AI是否正在输入
- error: 错误信息
```

**核心方法**：
1. `handleSend()`: 发送用户消息
2. `handleAIReply()`: 触发AI回复
3. `scrollToBottom()`: 滚动到底部

**特点**：
- ✅ 使用useCallback优化性能
- ✅ 完整的错误处理和展示
- ✅ 清晰的注释说明
- ✅ 类型安全

---

## 🔄 数据流

```
用户输入
  ↓
handleSend() → createMessage()
  ↓
setMessages() → saveChatMessages()
  ↓
用户点击纸飞机
  ↓
handleAIReply()
  ↓
getApiSettings() → buildSystemPrompt()
  ↓
getRecentMessages() → convertToApiMessages()
  ↓
callAIApi()
  ↓
createMessage() → setMessages()
  ↓
saveChatMessages()
```

## 🎯 优势总结

### 1. 可维护性
- 代码结构清晰，职责明确
- 模块化设计，易于定位和修改
- 完善的注释和类型定义

### 2. 可扩展性
- 新增API提供商：只需修改`chatApi.ts`
- 新增消息类型：只需扩展`types/chat.ts`
- 新增功能：不影响现有代码

### 3. 可测试性
- 纯函数设计，易于单元测试
- 依赖注入，可mock外部调用
- 错误处理完善，边界条件清晰

### 4. 性能优化
- useCallback避免不必要的重渲染
- 只保存最近10条消息到API
- localStorage操作集中管理

### 5. 用户体验
- 详细的错误提示
- 加载状态反馈
- 防止重复提交

## 🚀 未来扩展方向

### 1. 消息类型扩展
在`types/chat.ts`中添加新类型：
```typescript
interface Message {
  messageType?: 'text' | 'image' | 'voice' | 'file'
  // ... 其他字段
}
```

### 2. 多API提供商支持
在`chatApi.ts`中添加适配器：
```typescript
const apiAdapters = {
  openai: callOpenAIApi,
  google: callGoogleApi,
  // ...
}
```

### 3. 消息搜索功能
在`messageUtils.ts`中添加：
```typescript
export const searchMessages = (
  messages: Message[],
  keyword: string
): Message[] => {
  // 搜索逻辑
}
```

### 4. 消息导出功能
```typescript
export const exportMessages = (
  messages: Message[],
  format: 'json' | 'txt'
): string => {
  // 导出逻辑
}
```

## 📝 开发规范

### 1. 命名规范
- 类型：PascalCase（`Message`, `Character`）
- 函数：camelCase（`createMessage`, `handleSend`）
- 常量：UPPER_SNAKE_CASE（`MESSAGE_CONFIG`）
- 组件：PascalCase（`ChatDetail`）

### 2. 注释规范
- 每个函数添加JSDoc注释
- 复杂逻辑添加行内注释
- 模块顶部添加职责说明

### 3. 错误处理
- 使用自定义Error类型
- 区分不同的错误类型
- 提供清晰的错误信息

### 4. 类型安全
- 避免使用any类型
- 为所有函数定义返回类型
- 使用TypeScript严格模式

---

## 📞 联系方式

如有问题或建议，请联系开发团队。

**版本**: 1.0.0  
**更新日期**: 2025-11-04
