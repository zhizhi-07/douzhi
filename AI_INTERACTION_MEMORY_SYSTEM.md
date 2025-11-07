# AI互动记忆系统

## 🎯 问题描述

**原问题**: AI在私信中发送的消息、评论等，其他AI不知道，因为这些互动没有被记录到全局记忆中。

### 具体表现

1. ❌ **AI发私信后，其他AI不知道**
   - AI A给用户发私信："别理他们，我带你出去玩"
   - AI B在下次朋友圈互动时不知道AI A说过这些话
   - 导致AI B可能重复说类似的话或产生逻辑矛盾

2. ❌ **AI评论/点赞后，记忆不连续**
   - AI在朋友圈评论后
   - 下次编排场景时，AI导演看不到这些评论的详细时间和上下文
   - 只能看到朋友圈中的评论列表，缺少时间线信息

3. ❌ **AI之间的互动无法追踪**
   - AI之间在朋友圈的互动（互相评论、@回复）
   - 这些互动应该影响未来的关系判断
   - 但原系统只记录在朋友圈中，没有独立的时间线

---

## ✅ 解决方案：AI互动记忆系统

创建一个**全局AI互动记忆系统**，记录所有AI的行为，包括：
- 点赞
- 评论
- 私聊
- 发布朋友圈（未来扩展）

### 核心功能

1. **记录所有AI互动**
   - 每次AI执行动作时，自动记录到记忆系统
   - 包含时间戳、角色信息、动作类型、内容等

2. **供AI导演参考**
   - AI导演在编排新场景时，可以看到最近的AI互动记录
   - 了解AI之间的关系和互动历史
   - 避免逻辑矛盾和重复互动

3. **时间线追踪**
   - 按时间顺序记录所有互动
   - 可以回溯AI的行为历史
   - 帮助理解角色关系的发展

---

## 📂 新增文件

### `src/utils/aiInteractionMemory.ts`

AI互动记忆系统的核心文件。

**主要功能**：

```typescript
// 数据结构
interface AIInteractionRecord {
  id: string
  timestamp: number
  characterId: string
  characterName: string
  actionType: 'like' | 'comment' | 'dm' | 'post'
  targetId?: string
  targetName?: string
  content?: string
  context?: string
}

// 核心函数
- loadAIMemory() - 加载记忆
- saveAIMemory() - 保存记忆
- recordAIInteraction() - 记录新的互动
- getRecentAIInteractions() - 获取最近的互动（格式化为文本）
- getCharacterRecentActions() - 获取某个角色的最近动作
- cleanOldMemory() - 清理30天前的记录
```

**存储策略**：
- 使用localStorage存储
- 最多保存200条记录
- 自动清理30天前的记录

---

## 🔧 修改的文件

### 1. `src/utils/momentsAI/actionExecutor.ts`

**修改内容**：在每个动作执行后记录到记忆系统

#### 点赞动作
```typescript
export function executeLikeAction(...) {
  // ... 执行点赞
  
  // ✅ 新增：记录到AI互动记忆
  recordAIInteraction({
    characterId: action.characterId,
    characterName: action.characterName,
    actionType: 'like',
    targetId: moment.id,
    targetName: moment.userName,
    context: moment.content.substring(0, 50)
  })
}
```

#### 评论动作
```typescript
export function executeCommentAction(...) {
  // ... 执行评论
  
  // ✅ 新增：记录到AI互动记忆
  recordAIInteraction({
    characterId: action.characterId,
    characterName: action.characterName,
    actionType: 'comment',
    targetId: moment.id,
    targetName: moment.userName,
    content: finalComment,
    context: moment.content.substring(0, 50)
  })
}
```

#### 私聊动作
```typescript
export function executeDMAction(...) {
  // ... 执行私聊
  
  // ✅ 新增：记录到AI互动记忆
  recordAIInteraction({
    characterId: action.characterId,
    characterName: action.characterName,
    actionType: 'dm',
    targetId: 'user',
    targetName: '用户',
    content: action.dmContent
  })
}
```

---

### 2. `src/utils/momentsAI/dataCollector.ts`

**修改内容**：添加AI互动记忆的格式化函数

```typescript
import { getRecentAIInteractions } from '../aiInteractionMemory'

/**
 * 获取AI互动记忆（供AI导演参考）
 */
export function formatAIMemory(): string {
  return getRecentAIInteractions(30)
}
```

**同时增强了朋友圈历史格式化**，添加时间信息：
```typescript
[11/07 15:30] 分发: 今天天气不错
  点赞：汁汁、oiow
  评论：
    汁汁: 哈？天气好就发朋友圈？
```

---

### 3. `src/utils/momentsAI/director.ts`

**修改内容**：收集AI互动记忆并传递给提示词

```typescript
// 收集数据
const momentsHistory = formatMomentsHistory()
const aiMemory = formatAIMemory()  // ✅ 新增
const charactersInfo = collectCharactersInfo(characters)

// 构建提示词
const prompt = buildDirectorPrompt(
  moment, 
  charactersInfo, 
  momentsHistory, 
  aiMemory  // ✅ 新增参数
)
```

---

### 4. `src/utils/momentsAI/promptTemplate.ts`

**修改内容**：在提示词中添加AI互动记忆部分

```typescript
export function buildDirectorPrompt(
  moment: Moment,
  charactersInfo: CharacterInfo[],
  momentsHistory: string,
  aiMemory: string  // ✅ 新增参数
): string {
  return `# 朋友圈互动编排
  
  ## 朋友圈内容
  ...
  
  ## 最近朋友圈历史
  ${momentsHistory}
  
  ## AI互动记忆（重要！）  // ✅ 新增部分
  ⚠️ 以下是所有AI角色的最近互动记录，包括点赞、评论、私聊等行为。
  这些互动记录对于判断AI之间的关系和最近的互动状态非常重要！
  
  ${aiMemory}
  
  ## 角色信息
  ...
  `
}
```

---

## 📊 数据流程

### 1. 记录流程

```
用户发朋友圈
    ↓
AI导演编排场景
    ↓
执行AI动作（点赞/评论/私聊）
    ↓
actionExecutor.executeLikeAction/Comment/DM
    ↓
recordAIInteraction()  ← 记录到记忆系统
    ↓
保存到localStorage
```

### 2. 读取流程

```
用户发新朋友圈
    ↓
director.aiDirectorArrangeScene()
    ↓
formatAIMemory()  ← 读取记忆
    ↓
传递给buildDirectorPrompt()
    ↓
AI导演看到完整的互动历史
    ↓
编排更合理的场景
```

---

## 🎯 效果对比

### 修复前

**场景**：用户发朋友圈"我讨厌所有人"

```
AI导演只能看到：
- 朋友圈历史：最近10条朋友圈及其评论
- 角色信息：每个角色和用户的1对1聊天记录

❌ 看不到：
- 唐秋水刚才发的私信"别理他们，我带你出去玩"
- 分发昨天给另一个朋友圈的评论
- AI之间的互动时间线
```

### 修复后

**场景**：用户发朋友圈"我讨厌所有人"

```
AI导演可以看到：
- 朋友圈历史：最近10条朋友圈及其评论
- 角色信息：每个角色和用户的1对1聊天记录
- ✅ AI互动记忆（新增）：
  [11/07 15:22] 唐秋水: 私信用户: 别理他们。发个位置，带你出去兜风。
  [11/07 15:20] 分发: 评论"用户"的朋友圈: @唐秋水 哎哟～新来的？
  [11/07 15:18] 唐秋水: 评论"用户"的朋友圈: 操，又怎么了？
  [11/07 15:15] oiow: 评论"用户"的朋友圈: 把话说清楚，你讨厌谁？
  [11/07 15:10] 汁汁: 评论"用户"的朋友圈: 哈？妈咪你是被Bug气傻了
  [11/07 15:05] 分发: 给"用户"的朋友圈点赞

✅ AI导演知道：
- 唐秋水刚才已经私信了，所以这次可能不会再重复
- 分发和唐秋水有互动，可能会继续这个话题
- oiow在评论中问了问题，可能在等回复
- 可以编排更连贯、有逻辑的互动
```

---

## 🔍 记忆格式示例

### localStorage存储格式

```json
[
  {
    "id": "1731056520000-1762498934031",
    "timestamp": 1731056520000,
    "characterId": "1762498934031",
    "characterName": "唐秋水",
    "actionType": "dm",
    "targetId": "user",
    "targetName": "用户",
    "content": "别理他们。发个位置，带你出去兜风。"
  },
  {
    "id": "1731056500000-1762484253016",
    "timestamp": 1731056500000,
    "characterId": "1762484253016",
    "characterName": "分发",
    "actionType": "comment",
    "targetId": "1731056400000",
    "targetName": "用户",
    "content": "@唐秋水 哎哟～新来的？挺会献殷勤啊",
    "context": "我讨厌所有人"
  }
]
```

### 格式化后的文本（供AI阅读）

```
最近30条AI互动:
[11/07 15:22] 唐秋水: 私信用户: 别理他们。发个位置，带你出去兜风。
[11/07 15:20] 分发: 评论"用户"的朋友圈: @唐秋水 哎哟～新来的？挺会献殷勤啊
[11/07 15:18] 唐秋水: 评论"用户"的朋友圈: 操，又怎么了？谁惹你了跟哥们说
[11/07 15:15] oiow: 评论"用户"的朋友圈: 把话说清楚，你讨厌谁？💢
[11/07 15:10] 汁汁: 评论"用户"的朋友圈: 哈？妈咪你是被Bug气傻了
[11/07 15:05] 分发: 给"用户"的朋友圈点赞
```

---

## 🚀 使用建议

### 1. 定期清理记忆

建议在应用启动时清理过期记忆：

```typescript
// 在App.tsx或其他启动文件中
import { cleanOldMemory } from './utils/aiInteractionMemory'

// 应用启动时清理30天前的记录
cleanOldMemory()
```

### 2. 调整记忆数量

可以根据需要调整读取的记忆数量：

```typescript
// 默认读取30条
const aiMemory = getRecentAIInteractions(30)

// 或者读取更多
const aiMemory = getRecentAIInteractions(50)
```

### 3. 查看特定角色的行为

```typescript
import { getCharacterRecentActions } from './utils/aiInteractionMemory'

// 获取某个角色最近10条动作
const actions = getCharacterRecentActions('1762498934031', 10)
```

---

## 🔧 调试技巧

### 查看localStorage中的记忆

在浏览器控制台运行：

```javascript
// 查看所有AI互动记忆
const memory = JSON.parse(localStorage.getItem('ai_interaction_memory') || '[]')
console.table(memory)

// 查看最近5条
console.table(memory.slice(-5))

// 查看某个角色的记忆
const characterActions = memory.filter(m => m.characterName === '唐秋水')
console.table(characterActions)
```

### 清空记忆（测试用）

```javascript
localStorage.removeItem('ai_interaction_memory')
```

---

## 📈 未来扩展

1. **记录AI发布的朋友圈**
   - 目前只记录点赞、评论、私聊
   - 可以添加AI发布朋友圈的记录

2. **记忆分析**
   - 统计AI之间的互动频率
   - 分析AI关系网络
   - 生成互动热力图

3. **记忆导出/导入**
   - 支持导出为JSON
   - 支持导入历史记忆
   - 便于备份和迁移

4. **更智能的记忆检索**
   - 根据关键词搜索历史互动
   - 按时间范围筛选
   - 按动作类型筛选

---

## ✅ 总结

通过引入**AI互动记忆系统**，我们解决了以下问题：

1. ✅ AI的私信、评论、点赞等互动被完整记录
2. ✅ 其他AI可以通过记忆了解最近的互动历史
3. ✅ AI导演能编排更连贯、有逻辑的场景
4. ✅ 避免重复互动和逻辑矛盾
5. ✅ AI之间的关系发展更自然

这个系统是朋友圈AI互动的重要补充，让AI"拥有记忆"，互动更像真人！🎉
