# Token 统计功能实现指南

## ✅ 已完成的功能

1. **世界书功能已完整集成到聊天**
   - ✅ 在 `useChatAI.ts` 中已注入世界书上下文（第178-201行）
   - ✅ 基于关键词自动触发
   - ✅ 支持最近10条消息的关键词匹配
   - ✅ 自动显示触发日志

2. **Token 计数工具已创建**
   - ✅ `src/utils/tokenCounter.ts` - 完整的 Token 估算工具
   - ✅ `src/pages/ChatDetail/components/TokenStatsDisplay.tsx` - 统计显示组件

## 🔧 完成 Token 统计功能的步骤

### 步骤1：在 useChatAI.ts 中添加统计代码

在 `callAIApi` 调用**前**（约第333行之前）添加：

```typescript
// ⏱ 记录开始时间
const startTime = Date.now()

// 📊 计算各部分 Token（保存注入的上下文用于计算）
let lorebookContext = ''
let memoryContext = ''
```

修改世界书和记忆注入部分，保存上下文：

```typescript
// 在第190行 lorebookContext 赋值时
lorebookContext = lorebookManager.buildContext(character.id, recentText, 2000)

// 在第213-221行记忆注入时，保存 memoryPrompt
memoryContext = relevantMemories.map(m => m.content).join('\n')
```

在 `callAIApi` 调用**后**（约第336行之后）添加：

```typescript
// ⏱ 计算响应时间
const responseTime = Date.now() - startTime

// 📊 计算Token统计
const messageStrings = apiMessages.map(m => m.content || '')
const stats: TokenStats = {
  systemPrompt: estimateTokens(systemPrompt),
  character: estimateTokens(character?.personality || ''),
  lorebook: estimateTokens(lorebookContext),
  memory: estimateTokens(memoryContext),
  messages: messageStrings.reduce((sum, msg) => sum + estimateTokens(msg), 0),
  total: 0, // 下面计算
  remaining: 0,
  percentage: 0,
  responseTime
}

stats.total = stats.systemPrompt + stats.character + stats.lorebook + stats.memory + stats.messages
stats.remaining = Math.max(0, 8000 - stats.total)
stats.percentage = Math.min(100, (stats.total / 8000) * 100)

// 更新状态
setTokenStats(stats)

console.log('📊 Token统计:', stats)
```

### 步骤2：导出 tokenStats

在 `useChatAI.ts` 返回值中添加（约第775行）：

```typescript
return {
  isAiTyping,
  messagesEndRef,
  scrollToBottom,
  handleSend,
  handleAIReply,
  handleRegenerate,
  tokenStats  // ← 添加这一行
}
```

### 步骤3：在 ChatDetail.tsx 中显示

在聊天头部下方添加 Token 统计显示组件：

```tsx
import { TokenStatsDisplay } from './components/TokenStatsDisplay'

// 在 JSX 中，ChatHeader 下方添加：
<TokenStatsDisplay stats={chatAI.tokenStats} />
```

## 📍 具体修改位置

### useChatAI.ts 修改位置

1. **第34行**：导入已完成 ✅
   ```typescript
   import { TokenStats, estimateTokens } from '../../../utils/tokenCounter'
   ```

2. **第47行**：状态已添加 ✅
   ```typescript
   const [tokenStats, setTokenStats] = useState<TokenStats | null>(null)
   ```

3. **第180-201行**：世界书注入已完成 ✅ - 需要保存 `lorebookContext` 变量

4. **第204-228行**：记忆注入已完成 ✅ - 需要保存 `memoryContext` 变量

5. **第333行前后**：需要添加计时和统计代码 ⚠️

6. **第775行**：需要添加返回值 ⚠️

### ChatDetail.tsx 修改位置

在 ChatHeader 组件下方添加：

```tsx
{/* Token 统计显示 */}
<TokenStatsDisplay stats={chatAI.tokenStats} />
```

## 🎯 快速实现（最小改动）

如果想要最快看到效果，可以先在控制台查看统计：

在 `useChatAI.ts` 的第336行（API调用后）添加：

```typescript
const responseTime = Date.now() - startTime
console.log('📊 响应时间:', responseTime + 'ms')
console.log('📊 系统提示词Token:', estimateTokens(systemPrompt))
console.log('📊 消息Token:', apiMessages.reduce((sum, msg) => sum + estimateTokens(msg.content || ''), 0))
```

## ✨ 效果预览

完成后，聊天界面顶部会显示：

```
系统:1.2k | 世界书:500 | 记忆:300 | 历史:800 | 总计:2.8k | ⏱1.2s | 消耗:3.5k | ███░░ 35%
```

## 🔍 调试建议

1. 打开浏览器控制台
2. 发送一条消息
3. 查看以下日志：
   - `📚 [世界书] 已注入世界书上下文`
   - `📚 世界书触发: X 条目, 约 X tokens`
   - `🧠 [记忆系统] 注入了 X 条相关记忆`
   - `📊 Token统计:` - 会显示详细统计

## 📝 注意事项

1. **Token 估算是近似值**：实际 Token 数可能略有不同
2. **响应时间包含网络延迟**：不只是模型处理时间
3. **世界书自动触发**：基于最近10条消息的关键词匹配
4. **记忆自动注入**：基于最后一条用户消息的内容相关性

## 🎉 当前状态

- ✅ 世界书系统完整实现并集成
- ✅ Token 计数工具已创建
- ✅ 显示组件已创建
- ⚠️ 需要在 useChatAI 中添加计时和统计代码
- ⚠️ 需要在界面中显示组件

**建议**：先测试世界书功能是否正常工作，再添加 Token 统计显示。
