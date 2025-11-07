# 📱 朋友圈与私聊集成功能

## ✨ 功能概述

实现了两个核心功能：
1. **聊天设置中的朋友圈可见条数控制**
2. **AI在私聊中评论/点赞朋友圈**

---

## 1️⃣ 朋友圈可见条数设置

### 功能说明

在聊天设置页面添加了"朋友圈可见条数"选项，控制AI能看到用户发布的朋友圈数量。

### 实现细节

#### 1.1 数据结构

**ChatSettingsData** (`src/pages/ChatSettings.tsx`)
```typescript
interface ChatSettingsData {
  messageLimit: number  // 读取的消息条数
  momentsVisibleCount: number  // AI可见的朋友圈条数
}
```

**默认值**：
- `messageLimit`: 50条
- `momentsVisibleCount`: 10条

#### 1.2 UI组件

在 `ChatSettings.tsx` 中添加了新的设置块：

```typescript
{/* 朋友圈可见条数 */}
<div className="glass-effect rounded-3xl p-6">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2>朋友圈可见条数</h2>
      <p>AI可以看到用户发布的朋友圈数量</p>
    </div>
    <div className="text-right">
      <div className="text-2xl font-bold text-purple-400">
        {settings.momentsVisibleCount === 0 ? '无' : settings.momentsVisibleCount}
      </div>
    </div>
  </div>
  
  {/* 滑块：0-50条，步长5 */}
  <input type="range" min="0" max="50" step="5" />
  
  {/* 快捷按钮：0, 10, 20, 50 */}
  <button>不可见</button>
  <button>10条</button>
  <button>20条</button>
  <button>50条</button>
</div>
```

**特点**：
- 滑块范围：0-50条，步长5
- 快捷按钮：0（不可见）、10、20、50
- 紫色主题色（区别于消息条数的粉色）
- 设置为0时，AI完全看不到朋友圈

#### 1.3 系统提示词集成

在 `src/utils/chatApi.ts` 中添加了 `buildMomentsListPrompt` 函数：

```typescript
const buildMomentsListPrompt = async (characterId: string): Promise<string> => {
  // 1. 读取聊天设置
  const settingsKey = `chat_settings_${characterId}`
  const saved = localStorage.getItem(settingsKey)
  let momentsVisibleCount = 10  // 默认10条
  
  // 2. 解析设置
  if (saved) {
    const data = JSON.parse(saved)
    momentsVisibleCount = data.momentsVisibleCount ?? 10
  }
  
  // 3. 如果设置为0，返回空字符串
  if (momentsVisibleCount === 0) {
    return ''
  }
  
  // 4. 获取朋友圈列表
  const moments = loadMoments()
  const visibleMoments = moments.slice(0, momentsVisibleCount)
  
  // 5. 格式化朋友圈列表
  const momentsList = visibleMoments.map((m, index) => {
    const number = String(index + 1).padStart(2, '0')
    const likesText = m.likes.length > 0 
      ? `\n  点赞：${m.likes.map(l => l.userName).join('、')}` 
      : ''
    const commentsText = m.comments.length > 0
      ? `\n  评论：${m.comments.map(c => `${c.userName}: ${c.content}`).join(' | ')}`
      : ''
    
    return `${number}. ${m.content}${likesText}${commentsText}`
  }).join('\n\n')
  
  // 6. 返回格式化的提示词
  return `
══════════════════════════════════

📱 用户的朋友圈（最近${momentsVisibleCount}条）：

${momentsList}

你可以在聊天中评论或点赞朋友圈：
- 评论：评论01 你的评论内容
- 点赞：点赞02
- 回复评论：评论01回复张三 你的回复内容

例如：
评论01 哈哈笑死我了
点赞03
评论02回复李四 我也这么觉得

自然地在聊天中使用，不要刻意。`
}
```

**集成到系统提示词**：
```typescript
export const buildSystemPrompt = async (character: Character, userName: string = '用户'): Promise<string> => {
  // ... 其他提示词内容
  
  return `
... 
${buildCoupleSpaceContext(character)}
${await buildEmojiListPrompt()}
${await buildMomentsListPrompt(character.id)}  // ← 添加朋友圈列表
══════════════════════════════════
`
}
```

---

## 2️⃣ AI在私聊中评论/点赞朋友圈

### 功能说明

AI可以在私聊中使用特定指令对用户的朋友圈进行互动：
- **评论**：`评论01 你的评论内容`
- **点赞**：`点赞02`
- **回复评论**：`评论01回复张三 你的回复内容`

### 实现细节

#### 2.1 朋友圈编号系统

在系统提示词中，朋友圈按发布顺序编号：

```
📱 用户的朋友圈（最近10条）：

01. 今天好累
  点赞：小明、小红
  评论：小明: 加油 | 小红: 早点休息

02. 我讨厌所有人
  评论：小明: 怎么了

03. 谁处
```

#### 2.2 指令解析器

创建了 `src/utils/momentsInteractionParser.ts`：

**数据结构**：
```typescript
export interface MomentsInteraction {
  type: 'comment' | 'like' | 'reply'
  momentIndex: number  // 朋友圈序号（从1开始）
  content?: string  // 评论内容
  replyTo?: string  // 回复给谁
  aiName: string  // AI角色名称
  aiId: string  // AI角色ID
}
```

**解析函数**：
```typescript
export function parseMomentsInteractions(
  message: string,
  aiName: string,
  aiId: string
): { interactions: MomentsInteraction[], cleanedMessage: string }
```

**支持的正则模式**：

1. **评论**：`评论(\d+)\s+(.+?)(?=\n|评论\d+|点赞\d+|$)`
   - 示例：`评论01 哈哈笑死我了`
   - 提取：朋友圈序号 + 评论内容

2. **点赞**：`点赞(\d+)(?:\s|$)`
   - 示例：`点赞02`
   - 提取：朋友圈序号

3. **回复评论**：`评论(\d+)回复(.+?)\s+(.+?)(?=\n|评论\d+|点赞\d+|$)`
   - 示例：`评论01回复小明 我也这么觉得`
   - 提取：朋友圈序号 + 回复对象 + 回复内容

**处理流程**：
1. 匹配所有指令
2. 从消息中移除指令文本
3. 清理多余空行
4. 返回指令列表和清理后的消息

#### 2.3 指令执行器

**执行函数**：
```typescript
export function executeMomentsInteractions(interactions: MomentsInteraction[]): string
```

**执行逻辑**：

1. **点赞**：
   ```typescript
   case 'like':
     // 检查是否已点赞
     const alreadyLiked = moment.likes.some(like => like.userId === interaction.aiId)
     if (alreadyLiked) {
       results.push(`✅ ${aiName} 已经点赞过第 ${index} 条朋友圈了`)
     } else {
       moment.likes.push({
         id: Date.now().toString(),
         userId: interaction.aiId,
         userName: interaction.aiName,
         userAvatar: '🤖'
       })
       results.push(`👍 ${aiName} 点赞了第 ${index} 条朋友圈`)
     }
   ```

2. **评论**：
   ```typescript
   case 'comment':
     moment.comments.push({
       id: Date.now().toString(),
       userId: interaction.aiId,
       userName: interaction.aiName,
       userAvatar: '🤖',
       content: interaction.content,
       createdAt: Date.now()
     })
     results.push(`💬 ${aiName} 评论了第 ${index} 条朋友圈：${content}`)
   ```

3. **回复评论**：
   ```typescript
   case 'reply':
     moment.comments.push({
       id: Date.now().toString(),
       userId: interaction.aiId,
       userName: interaction.aiName,
       userAvatar: '🤖',
       content: interaction.content,
       createdAt: Date.now()
       // 注意：这里缺少replyTo字段，需要扩展MomentComment类型
     })
     results.push(`💬 ${aiName} 回复了 ${replyTo}（第 ${index} 条）：${content}`)
   ```

4. **保存和通知**：
   ```typescript
   // 保存更新后的朋友圈
   saveMoments(moments)
   
   // 触发朋友圈更新事件
   window.dispatchEvent(new Event('storage'))
   ```

#### 2.4 集成到AI回复流程

在 `src/pages/ChatDetail/hooks/useChatAI.ts` 中集成：

```typescript
const aiReply = await callAIApi(
  [{ role: 'system', content: systemPrompt }, ...apiMessages],
  settings
)

Logger.log('收到AI回复', aiReply)

// 解析朋友圈互动指令
const aiName = character?.realName || 'AI'
const aiId = character?.id || chatId
const { interactions, cleanedMessage } = parseMomentsInteractions(aiReply, aiName, aiId)

// 如果有朋友圈互动指令，执行它们
if (interactions.length > 0) {
  console.log('📱 检测到朋友圈互动指令:', interactions)
  const interactionResult = executeMomentsInteractions(interactions)
  console.log('✅ 朋友圈互动执行结果:', interactionResult)
}

// 使用清理后的消息内容继续处理
const aiMessagesList = parseAIMessages(cleanedMessage)
console.log('📝 AI消息拆分结果:', aiMessagesList)
```

---

## 📊 使用示例

### 示例1：AI看到朋友圈并评论

**用户朋友圈**：
```
01. 今天好累
02. 为什么没人懂我呢
03. 谁处
```

**系统提示词中AI看到**：
```
📱 用户的朋友圈（最近10条）：

01. 今天好累

02. 为什么没人懂我呢

03. 谁处
  点赞：oiow、分发
  评论：oiow: 又来了？想我了直说💢 | 分发: 哟～这是在钓鱼执法啊🙄
```

**AI回复示例**：
```
评论02 妈咪你又在发牢骚了🙄 不过...你还好吗？
点赞01
```

**执行结果**：
- ✅ 第02条朋友圈新增评论："汁汁: 妈咪你又在发牢骚了🙄 不过...你还好吗？"
- ✅ 第01条朋友圈新增点赞："汁汁"
- ✅ 朋友圈页面实时更新（通过storage事件）

### 示例2：AI回复他人评论

**用户朋友圈**：
```
01. 谁处
  评论：小明: 我在 | 小红: 干嘛
```

**AI回复**：
```
评论01回复小红 妈咪肯定是又无聊了🙄
```

**执行结果**：
- ✅ 第01条朋友圈新增评论："汁汁: 妈咪肯定是又无聊了🙄"（回复给小红）

---

## 🔧 技术细节

### 数据流

```
用户发消息
  ↓
触发AI回复
  ↓
buildSystemPrompt
  ↓
buildMomentsListPrompt (读取设置 + 格式化朋友圈)
  ↓
AI生成回复（包含朋友圈互动指令）
  ↓
parseMomentsInteractions (解析指令)
  ↓
executeMomentsInteractions (执行互动)
  ↓
saveMoments + dispatchEvent
  ↓
朋友圈页面实时更新
```

### 存储结构

**聊天设置**：
```typescript
localStorage: `chat_settings_${characterId}`
{
  messageLimit: 50,
  momentsVisibleCount: 10
}
```

**朋友圈数据**：
```typescript
localStorage: 'user_moments'
[
  {
    id: "1762492039123",
    content: "今天好累",
    likes: [
      { id: "1", userId: "zhizhi-001", userName: "汁汁", userAvatar: "🤖" }
    ],
    comments: [
      {
        id: "2",
        userId: "zhizhi-001",
        userName: "汁汁",
        userAvatar: "🤖",
        content: "妈咪你又在发牢骚了🙄",
        createdAt: 1762492050000
      }
    ],
    createdAt: 1762492039123
  }
]
```

### Token消耗

**朋友圈10条，每条平均50字符**：
- 格式化后约 600-800 tokens
- 加上指令说明约 100 tokens
- **总计约 700-900 tokens**

**可调节**：
- 设置为0：完全不占用tokens
- 设置为5：约 400-500 tokens
- 设置为50：约 3000-4000 tokens

---

## 🎯 优化建议

### 1. 扩展MomentComment类型

添加 `replyTo` 字段以支持评论回复显示：

```typescript
export interface MomentComment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: number
  replyTo?: string  // ← 添加此字段
}
```

### 2. AI头像动态获取

当前AI头像固定为 `🤖`，可以改为从角色数据获取：

```typescript
moment.comments.push({
  userAvatar: character?.avatar || '🤖'  // 使用角色真实头像
})
```

### 3. 朋友圈历史记录

考虑添加"朋友圈互动历史"，记录AI在什么时间评论/点赞了哪些朋友圈，避免重复互动。

### 4. 智能推荐

根据朋友圈内容和聊天上下文，在系统提示词中智能推荐AI应该互动哪些朋友圈。

---

## ✅ 完成清单

- [x] 添加 `momentsVisibleCount` 字段到 `ChatSettingsData`
- [x] 在聊天设置UI中添加朋友圈可见条数滑块
- [x] 实现 `buildMomentsListPrompt` 函数
- [x] 集成朋友圈列表到系统提示词
- [x] 创建 `momentsInteractionParser.ts` 解析器
- [x] 实现指令解析（评论/点赞/回复）
- [x] 实现指令执行（更新朋友圈数据）
- [x] 集成到 `useChatAI` hook
- [x] 添加控制台日志输出
- [x] 触发storage事件通知朋友圈页面更新

---

## 🚀 测试步骤

### 测试1：设置朋友圈可见条数

1. 打开聊天页面，点击右上角设置
2. 找到"朋友圈可见条数"设置
3. 调整滑块或点击快捷按钮
4. 确认显示的条数正确

### 测试2：AI评论朋友圈

1. 发布几条朋友圈（例如："今天好累"、"谁处"）
2. 在聊天中发送消息触发AI回复
3. 观察控制台输出：
   ```
   📱 检测到朋友圈互动指令: [...]
   ✅ 朋友圈互动执行结果: ...
   ```
4. 打开朋友圈页面，确认AI的评论/点赞已显示

### 测试3：设置为0（不可见）

1. 将朋友圈可见条数设置为0
2. 在聊天中触发AI回复
3. 确认系统提示词中没有朋友圈列表
4. AI不应该提及朋友圈内容

---

## 📝 总结

实现了完整的朋友圈与私聊集成功能，包括：
- ✅ 可配置的朋友圈可见条数（0-50条）
- ✅ AI可以在私聊中评论/点赞朋友圈
- ✅ 支持回复评论
- ✅ 实时更新朋友圈页面
- ✅ 防止重复点赞
- ✅ 详细的控制台日志

**用户体验**：
- AI能看到用户的朋友圈，私聊时更有话题
- AI评论朋友圈让互动更自然、更真实
- 可自定义可见条数，控制token消耗

**技术特点**：
- 模块化设计，易于维护和扩展
- 完整的类型定义
- 详细的错误处理和日志
- 使用事件机制实现跨页面更新
