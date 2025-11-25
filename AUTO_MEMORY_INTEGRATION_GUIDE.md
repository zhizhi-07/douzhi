# 📝 自动记忆提取集成指南

## ✅ 已完成功能

### 核心特性
1. **统一计数器** - 所有互动（聊天/朋友圈/线下）共用一个计数器
2. **去重机制** - 记录上次提取的时间戳，避免重复分析
3. **批量提取** - 达到15次时，一次性提取所有类型的新记忆
4. **异步执行** - 不阻塞用户操作

### 三种记忆类型
- **chat** - 私聊对话记忆（从新消息中提取）
- **moments** - 朋友圈互动记忆（从新朋友圈中提取）
- **action** - 其他互动记忆（线下、情侣空间等）

---

## 🔌 超简单集成方法

**只需在任何互动后调用一个函数即可！**

```typescript
import { recordInteraction } from '../services/memoryExtractor'

// 任何互动后（聊天、点赞、评论、线下等）
await recordInteraction(characterId, characterName)
```

这个函数会：
1. 自动计数（+1）
2. 达到15次时，自动提取所有类型的新记忆
3. 异步执行，不阻塞UI

---

## 📍 集成位置

### 1. 私聊消息

**文件**: `src/pages/ChatDetail.tsx` 或相关 Hook

```typescript
import { recordInteraction } from '../services/memoryExtractor'

// 用户发送消息后
async function afterSendMessage(characterId: string, characterName: string) {
  await recordInteraction(characterId, characterName)
}
```

---

### 2. 朋友圈互动

**文件**: `src/pages/Moments.tsx`, `src/pages/MomentDetail.tsx`

```typescript
import { recordInteraction } from '../services/memoryExtractor'

// 点赞后
async function afterLike(characterId: string, characterName: string) {
  await recordInteraction(characterId, characterName)
}

// 评论后
async function afterComment(characterId: string, characterName: string) {
  await recordInteraction(characterId, characterName)
}

// AI发朋友圈后
async function afterAIPost(characterId: string, characterName: string) {
  await recordInteraction(characterId, characterName)
}
```

---

### 3. 线下模式对话

**文件**: `src/pages/OfflineChat.tsx`

```typescript
import { recordInteraction } from '../services/memoryExtractor'

// 保存线下记录后
async function afterSaveOfflineRecord(characterId: string, characterName: string) {
  await recordInteraction(characterId, characterName)
}
```

---

### 4. 其他互动

**任何与AI角色的互动都可以计数**：
- 视频通话后
- 转账后
- 发送礼物后
- 线下见面记录后

```typescript
// 统一调用
await recordInteraction(characterId, characterName)
```

---

## 🎮 测试方法

### 强制提取按钮（已实现）

在 **统一记忆管理页面** (`/global-memory`) 点击 **"🧠 提取记忆"** 按钮：
- 会从当前选中角色的聊天记录中提取记忆
- 用于测试提取效果

### 查看计数器

```typescript
import { interactionCounter } from '../services/memoryExtractor'

console.log('当前互动次数:', interactionCounter.getCount())
console.log('距离下次提取:', interactionCounter.getThreshold() - interactionCounter.getCount())
```

---

## 📊 记忆提取原则

### AI 会提取什么？
✅ **抽象的、可复用的洞察**
- 偏好/习惯："他喜欢..."
- 性格特点："他是个...的人"
- 重要约定：承诺、约会
- 关系洞察："我们的相处模式..."
- 情感共鸣：深度交流

❌ **不会提取**
- 琐碎流水账
- 具体对话细节
- 临时情绪

### 记忆类型
- **chat** - 私聊对话记忆
- **moments** - 朋友圈互动记忆
- **action** - 其他互动记忆

---

## 🎯 核心机制说明

### 1. 去重机制（重要！）
**问题**：第一次提取1-15轮对话，第二次不应该重复分析1-30轮

**解决方案**：
- 每次提取成功后，保存最后一条消息的时间戳
- 下次提取时，只分析时间戳之后的新消息/朋友圈
- Key: `last_extract_{domain}_{characterId}`

**效果**：
- 第1次：分析第1-15轮 → 保存时间戳T1
- 第2次：只分析T1之后的新消息（第16-30轮）
- 第3次：只分析T2之后的新消息（第31-45轮）

### 2. 统一计数器
**所有互动共用一个计数器**：
- 聊天1次 → 计数+1
- 点赞1次 → 计数+1
- 评论1次 → 计数+1
- 线下对话1次 → 计数+1

**达到15次时**：
- 一次性提取聊天、朋友圈的所有新记忆
- 避免频繁调用API
- 自动重置计数器

### 3. 批量提取
达到15次时，`triggerMemoryExtraction` 函数会：
1. 提取聊天新记忆（如果有新消息）
2. 提取朋友圈新记忆（如果有新互动）
3. 提取线下/其他新记忆（待集成）

**API消耗**：
- 最多3次 zhizhiapi 调用（每个类型1次）
- 实际消耗取决于有哪些新数据
- 如果某类型没有新数据，跳过不调用

---

## ⚠️ 注意事项

1. **API 消耗**
   - 每15次互动触发1次批量提取
   - 实际API调用次数：0-3次（取决于有哪些新数据）
   - 使用代付API（zhizhiapi），成本很低
   
2. **数据隐私**
   - 记忆存储在本地 IndexedDB
   - 时间戳记录在 localStorage
   - 不会上传到服务器

3. **性能**
   - 提取过程异步进行，不阻塞UI
   - 只分析新数据，不重复分析
   - 单次提取最多分析10条朋友圈/10轮对话

---

## 🚀 集成优先级

建议按以下顺序集成：

1. ✅ **私聊消息**（最重要，最频繁）
   - 在发送消息后调用 `recordInteraction`
   
2. **朋友圈互动**（次重要）
   - 点赞、评论、发帖后调用
   
3. **线下模式**（可选）
   - 保存线下记录后调用
   
4. **其他互动**（可选）
   - 视频通话、转账等特殊互动

先测试私聊记忆提取效果，满意后再扩展！
