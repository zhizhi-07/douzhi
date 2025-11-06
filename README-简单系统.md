# 简单消息系统

## ✅ 已完成

### 1. 新文件
- `src/utils/simpleMessageManager.ts` - 消息管理（直接操作localStorage）
- `src/utils/simpleNotificationManager.ts` - 通知管理（未读数+通知记录）
- `src/components/SimpleNotificationListener.tsx` - 全局通知监听器
- `src/pages/ChatDetail/hooks/useChatAI.simple.ts` - 简单AI Hook

### 2. 已修改
- ✅ `App.tsx` - 替换为SimpleNotificationListener
- ✅ `ChatList.tsx` - 使用simpleNotificationManager读取未读数

### 3. 工作流程

```
用户发消息 → addMessage() → 立即保存localStorage
                            ↓
                   触发new-message事件
                            
AI回复 → addMessage() → 立即保存localStorage
                      ↓
             触发new-message事件
                      ↓
      SimpleNotificationListener监听
                      ↓
       【不在聊天窗口】→ 显示通知 + 增加未读数
       【在聊天窗口】→ 不处理
```

## 🔄 还需要做

### 修改ChatDetail使用新系统

需要修改：
1. ChatDetail使用`loadMessages()`而不是`loadChatMessages()`  
2. 使用`useSimpleChatAI`而不是`useChatAI`
3. 进入聊天时调用`clearUnread(chatId)`清除未读数

### 测试清单
- [ ] 发送消息立即保存
- [ ] AI回复立即保存
- [ ] 不在聊天窗口时显示通知
- [ ] 不在聊天窗口时增加未读数
- [ ] 进入聊天时清除未读数
- [ ] ChatList显示正确的未读数
- [ ] 刷新页面消息不丢失

## 🗑️ 可以删除的旧文件（完成测试后）
- `GlobalMessageMonitor.tsx`
- `BackgroundChatNotificationManager.tsx`
- `useChatNotifications.ts`
- `unreadMessages.ts` (旧的)
