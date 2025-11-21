# 修复引用表情包显示问题

## 问题描述
当AI引用用户的表情包消息时，会把 `[表情:xxx]` 当成普通文本显示在引用气泡中，而不是清理掉这个指令标记。

**问题截图**：
- 用户发送表情包：`[用户发了表情包] [表情:小仓鼠脏脏]`
- AI引用时显示：`[引用了我的消息: "[用户发了表情包] [表情:小仓鼠脏脏]"]`
- 结果：引用气泡中出现了 `[表情:小仓鼠脏脏]` 这样的文本

## 根本原因
在 `commandHandlers.ts` 的引用处理器中，虽然会清理 `[用户发了表情包]` 和 `[AI发了表情包]` 标记，但没有清理 `[表情:xxx]` 指令标记。

## 修复方案

### 修改文件：`src/pages/ChatDetail/hooks/commandHandlers.ts`

#### 1. quoteOnlyHandler（第1143-1158行）
```typescript
if (quoted) {
  // 🔥 如果是表情包消息，优先使用emoji.description
  let quotedContent = quoted.emoji?.description || quoted.content || quoted.voiceText || quoted.photoDescription || quoted.location?.name || '特殊消息'
  quotedContent = quotedContent
    .replace(/\[用户发了表情包\]\s*/g, '')
    .replace(/\[AI发了表情包\]\s*/g, '')
    .replace(/\[表情[:\：][^\]]*?\]/g, '')  // 🔥 清理表情包指令标记
    .replace(/【表情[:\：][^】]*?】/g, '')  // 🔥 清理全角表情包指令标记
    .replace(/\[引用了?[^\]]*?\]/g, '')
    .replace(/【引用了?[^】]*?】/g, '')
    .trim()
  
  // 🔥 如果清理后为空，说明是纯表情包消息，显示[表情包]
  if (!quotedContent && quoted.messageType === 'emoji') {
    quotedContent = '[表情包]'
  }
  // ... 后续代码
}
```

#### 2. quoteHandler（第1299-1317行）
```typescript
if (quoted) {
  // 🔥 如果是表情包消息，优先使用emoji.description
  let quotedContent = quoted.emoji?.description || quoted.content || quoted.voiceText || quoted.photoDescription || quoted.location?.name || '特殊消息'
  
  // 🔥 清理系统提示标签和嵌套引用
  quotedContent = quotedContent
    .replace(/\[用户发了表情包\]\s*/g, '')
    .replace(/\[AI发了表情包\]\s*/g, '')
    .replace(/\[表情[:\：][^\]]*?\]/g, '')  // 🔥 清理表情包指令标记
    .replace(/【表情[:\：][^】]*?】/g, '')  // 🔥 清理全角表情包指令标记
    .replace(/\[引用了?[^\]]*?\]/g, '')
    .replace(/【引用了?[^】]*?】/g, '')
    .trim()
  
  // 🔥 如果清理后为空，说明是纯表情包消息，显示[表情包]
  if (!quotedContent && quoted.messageType === 'emoji') {
    quotedContent = '[表情包]'
  }
  // ... 后续代码
}
```

## 修复效果

### 修复前
```
[引用了我的消息: "[用户发了表情包] [表情:小仓鼠脏脏]"]
发个表情包就想糊弄过去？
```

### 修复后
```
[引用了我的消息: "小仓鼠脏脏"]  // 如果有emoji.description
或
[引用了我的消息: "[表情包]"]     // 如果清理后为空
```

## 技术细节

1. **优先使用 `emoji.description`**：表情包消息的真实描述存储在 `emoji.description` 字段中
2. **清理指令标记**：使用正则表达式清理 `[表情:xxx]` 和 `【表情：xxx】`（支持全角）
3. **兜底显示**：如果清理后为空字符串，显示 `[表情包]` 作为占位符

## 相关代码位置
- `src/pages/ChatDetail/hooks/commandHandlers.ts`
  - `quoteOnlyHandler`: 第1066-1180行
  - `quoteHandler`: 第1187-1349行
