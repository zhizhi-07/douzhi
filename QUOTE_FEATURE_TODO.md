# 引用功能实现TODO

## 已完成
- ✅ Message类型添加quotedMessage字段
- ✅ useMessageMenu添加引用逻辑
- ✅ ChatDetail添加quotedMessage状态

## 还需要完成

### 1. 底部输入框显示引用预览
在输入框上方显示被引用的消息：
```tsx
{quotedMessage && (
  <div className="px-3 pt-2 pb-1">
    <div className="bg-gray-100 rounded-xl p-2 flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700 mb-0.5">
          {quotedMessage.type === 'sent' ? '我' : character?.realName}
        </div>
        <div className="text-xs text-gray-600 truncate">
          {quotedMessage.content || quotedMessage.voiceText || quotedMessage.photoDescription || '特殊消息'}
        </div>
      </div>
      <button
        onClick={() => setQuotedMessage(null)}
        className="text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  </div>
)}
```

### 2. 发送消息时附带引用信息
在 handleSend 中添加引用：
```typescript
const newMessage: Message = {
  // ... 其他字段
  quotedMessage: quotedMessage ? {
    id: quotedMessage.id,
    content: quotedMessage.content || quotedMessage.voiceText || quotedMessage.photoDescription || '特殊消息',
    senderName: quotedMessage.type === 'sent' ? '我' : character?.realName,
    type: quotedMessage.type
  } : undefined
}
// 发送后清除引用
setQuotedMessage(null)
```

### 3. AI支持引用

#### 提示词添加
```
• 引用：[引用:消息ID]
最近消息ID: ${messages.slice(-5).map(m => m.id).join(', ')}
```

#### AI回复解析
```typescript
const quoteMatch = content.match(/\[引用:\s*(\d+)\]/)
if (quoteMatch) {
  const quotedId = parseInt(quoteMatch[1])
  const quoted = messages.find(m => m.id === quotedId)
  
  // 创建AI消息with引用
  const aiMessage: Message = {
    // ... 其他字段
    quotedMessage: quoted ? {
      id: quoted.id,
      content: quoted.content || ...,
      senderName: quoted.type === 'sent' ? '我' : character.realName,
      type: quoted.type
    } : undefined
  }
}
```

## 文件位置
- 类型定义: `src/types/chat.ts` ✅
- Hook: `src/pages/ChatDetail/hooks/useMessageMenu.ts` ✅
- 主组件: `src/pages/ChatDetail.tsx` (需要修复)
- AI逻辑: `src/pages/ChatDetail/hooks/useChatAI.ts` (待添加)
- 提示词: `src/utils/chatApi.ts` (待添加)

## 注意事项
- 引用的消息要显示在气泡内部，上方
- 点击引用可以跳转到原消息（可选）
- AI看到的格式：引用内容在对话历史中，不需要特殊处理
- 清空输入框或发送后要清除引用状态
