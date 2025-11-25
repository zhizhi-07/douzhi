# 🔧 记忆提取系统 - Bug修复与优化

## 修复的问题

### ✅ Bug 1: 重复提取对话
**问题**：
- 第1次：提取1-15轮对话
- 第2次：又提取1-30轮（重复了前15轮）❌

**解决方案**：
- 记录上次提取的时间戳 `last_extract_{domain}_{characterId}`
- 只分析时间戳之后的新消息/朋友圈

**效果**：
- 第1次：提取1-15轮 → 保存时间戳
- 第2次：只提取16-30轮 ✅
- 第3次：只提取31-45轮 ✅

---

### ✅ Bug 2: 计数器应该统一
**问题**：
- 聊天、朋友圈、线下各有计数器
- 导致提取过于频繁

**解决方案**：
- 所有互动类型共用一个计数器
- 达到15次时，一次性提取所有类型的新记忆

**效果**：
```
互动1次（聊天） → 计数=1
互动1次（点赞） → 计数=2
...
互动1次（评论） → 计数=15 ✅ 触发批量提取

批量提取：
- 聊天新记忆（如果有）
- 朋友圈新记忆（如果有）
- 线下新记忆（如果有）
```

---

## 新增功能

### 🎯 统一触发函数
```typescript
// 任何互动后只需调用这一个函数
await recordInteraction(characterId, characterName)
```

自动处理：
1. 计数+1
2. 达到15次时，批量提取所有类型
3. 异步执行，不阻塞UI
4. 自动去重，只分析新数据

### 📊 批量提取函数
```typescript
triggerMemoryExtraction(characterId, characterName)
```

一次性提取：
- ✅ 聊天新记忆
- ✅ 朋友圈新记忆
- 🔜 线下/其他新记忆（待集成）

---

## API 消耗优化

### 优化前
- 每15次聊天 → 1次API
- 每15次朋友圈 → 1次API
- 每15次线下 → 1次API
- **最坏情况**：45次互动 = 3次API ❌

### 优化后
- 任何15次互动 → 1次批量提取
- 批量提取最多3次API（实际取决于有哪些新数据）
- **最坏情况**：15次互动 = 最多3次API ✅

**节省 66% 的 API 调用！**

---

## 集成方式

### 超简单！只需一行代码

```typescript
import { recordInteraction } from '../services/memoryExtractor'

// 任何互动后
await recordInteraction(characterId, characterName)
```

适用场景：
- ✅ 发送消息
- ✅ 朋友圈点赞/评论
- ✅ 线下记录保存
- ✅ 视频通话
- ✅ 任何与AI角色的互动

---

## 测试建议

1. **测试去重**：
   - 强制提取2次，看日志是否显示"没有新消息"
   
2. **测试计数**：
   ```typescript
   console.log('当前计数:', interactionCounter.getCount())
   ```

3. **测试批量提取**：
   - 连续互动15次
   - 观察控制台日志
   - 检查记忆管理页面

---

## 注意事项

1. **情侣空间**：有专属记忆系统，可以暂不集成
2. **线下/其他互动**：暂时跳过，未来可扩展
3. **时间戳存储**：localStorage 中的 `last_extract_*` 键

---

## 相关文件

- `src/services/memoryExtractor.ts` - 核心服务
- `src/services/unifiedMemoryService.ts` - 记忆存储
- `AUTO_MEMORY_INTEGRATION_GUIDE.md` - 完整集成指南
