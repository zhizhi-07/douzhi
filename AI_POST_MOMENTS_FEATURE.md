# 🎭 AI主动发朋友圈功能

## ✨ 功能概述

实现了AI主动发布朋友圈的完整功能链：
1. **聊天设置中的开关控制**
2. **AI在聊天中发布朋友圈**
3. **朋友圈导演系统编排其他AI互动**

---

## 🎯 功能流程

```
用户开启"AI主动发朋友圈" 
    ↓
AI在聊天中发送：朋友圈：今天心情不错
    ↓
系统解析指令并发布朋友圈
    ↓
显示灰色系统消息："汁汁发布了朋友圈：'今天心情不错'"
    ↓
触发朋友圈导演系统
    ↓
导演分析朋友圈内容和角色关系
    ↓
编排其他AI角色的互动（点赞/评论/私聊）
    ↓
其他AI按照导演的剧本进行互动
```

---

## 1️⃣ 聊天设置 - AI主动发朋友圈开关

### UI界面

在聊天设置页面，**朋友圈可见条数之前**添加了新的开关：

```tsx
{/* AI主动发朋友圈 */}
<div className="glass-effect rounded-3xl p-6">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <h2>AI主动发朋友圈</h2>
      <p>开启后AI可以在聊天中发布朋友圈</p>
    </div>
    <button className="toggle-switch">
      {/* 紫色开关 */}
    </button>
  </div>
  
  {/* 开启后显示提示 */}
  {settings.aiCanPostMoments && (
    <div className="info-box">
      AI发送朋友圈后，其他AI角色可能会根据内容进行互动
    </div>
  )}
</div>
```

### 数据结构

**ChatSettingsData** (`src/pages/ChatSettings.tsx`)
```typescript
interface ChatSettingsData {
  messageLimit: number
  momentsVisibleCount: number
  aiCanPostMoments: boolean  // 新增字段
}
```

**默认值**：
- `aiCanPostMoments`: `false` （默认关闭）

**存储位置**：
- `localStorage: chat_settings_${characterId}`

---

## 2️⃣ 系统提示词 - 朋友圈发送指令

### 提示词内容

当 `aiCanPostMoments = true` 时，系统提示词中会添加：

```
══════════════════════════════════

✨ 你也可以发朋友圈：

想发朋友圈？用这个格式：
朋友圈：你想发的内容

例如：
朋友圈：今天心情不错
朋友圈：刚吃了超好吃的火锅🔥

⚠️ 注意：
- 朋友圈发出后，其他人（可能是你的朋友、用户认识的人）会看到
- 他们可能会点赞或评论你的朋友圈
- 不要频繁发朋友圈，看心情和情况决定
- 发朋友圈的内容要符合你的性格和当下的心情
```

### 实现代码

**buildAIMomentsPostPrompt** (`src/utils/chatApi.ts`)

```typescript
const buildAIMomentsPostPrompt = async (characterId: string): Promise<string> => {
  // 读取聊天设置
  const settingsKey = `chat_settings_${characterId}`
  const saved = localStorage.getItem(settingsKey)
  let aiCanPostMoments = false
  
  if (saved) {
    const data = JSON.parse(saved)
    aiCanPostMoments = data.aiCanPostMoments ?? false
  }
  
  // 如果没有开启，返回空字符串
  if (!aiCanPostMoments) {
    return ''
  }
  
  return `...提示词内容...`
}
```

---

## 3️⃣ 指令解析 - parseAIMomentsPost

### 解析逻辑

**文件**：`src/utils/aiMomentsPostParser.ts`

**正则表达式**：
```typescript
const pattern = /朋友圈[:：](.+?)(?=\n|$)/
```

**支持格式**：
- `朋友圈：今天心情不错` ✅
- `朋友圈:刚吃了火锅` ✅
- `朋友圈： 超开心🎉` ✅

**返回结构**：
```typescript
interface AIMomentsPost {
  content: string      // 朋友圈内容
  aiName: string       // AI角色名称
  aiId: string         // AI角色ID
  aiAvatar: string     // AI角色头像
}
```

### 示例

**AI回复**：
```
朋友圈：今天心情不错

刚才想发个朋友圈记录一下
```

**解析结果**：
```typescript
{
  post: {
    content: "今天心情不错",
    aiName: "汁汁",
    aiId: "zhizhi-001",
    aiAvatar: "🤖"
  },
  cleanedMessage: "刚才想发个朋友圈记录一下"
}
```

---

## 4️⃣ 发布执行 - executeAIMomentsPost

### 执行流程

```typescript
export function executeAIMomentsPost(post: AIMomentsPost): boolean {
  // 1. 获取现有朋友圈列表
  const moments = loadMoments()
  
  // 2. 创建新的朋友圈对象
  const newMoment = {
    id: Date.now().toString(),
    userId: post.aiId,
    userName: post.aiName,
    userAvatar: post.aiAvatar,
    content: post.content,
    images: [],
    likes: [],
    comments: [],
    createdAt: Date.now()
  }
  
  // 3. 添加到列表开头（最新的在前面）
  moments.unshift(newMoment)
  
  // 4. 保存到localStorage
  saveMoments(moments)
  
  // 5. 触发朋友圈更新事件
  window.dispatchEvent(new Event('storage'))
  
  return true
}
```

### 系统消息

发布成功后，会在聊天中显示灰色系统消息：

```typescript
const systemContent = `${aiName}发布了朋友圈："${aiMomentsPost.content}"`
const systemMessage: Message = {
  ...createMessage(systemContent, 'system'),
  aiReadableContent: `[系统通知：你发布了朋友圈"${aiMomentsPost.content}"，其他人可能会看到并互动]`
}
```

**效果**：
```
[灰色系统消息] 汁汁发布了朋友圈："今天心情不错"
```

---

## 5️⃣ 朋友圈导演系统 - 编排其他AI互动

### 触发时机

AI发布朋友圈成功后，自动触发：

```typescript
// 获取刚发布的朋友圈对象
const moments = loadMoments()
const justPostedMoment = moments.find(m => 
  m.userId === aiId && 
  m.content === aiMomentsPost.content
)

if (justPostedMoment) {
  // 异步调用导演系统
  triggerAIMomentsInteraction(justPostedMoment).catch(error => {
    console.error('❌ 导演系统调用失败:', error)
  })
}
```

### 导演工作流程

**文件**：`src/utils/momentsAI/director.ts`

#### 1. 数据收集

```typescript
// 收集所有AI角色信息
const characters = characterService.getAll()

// 收集朋友圈历史
const momentsHistory = formatMomentsHistory()

// 收集角色关系信息
const charactersInfo = collectCharactersInfo(characters)
```

#### 2. 构建提示词

```typescript
const prompt = buildDirectorPrompt(moment, charactersInfo, momentsHistory)
```

**提示词包含**：
- 📱 朋友圈内容
- 👥 所有AI角色的性格和背景
- 📚 历史朋友圈记录
- 🎭 角色之间的关系

#### 3. 调用API编排场景

```typescript
const requestBody = {
  model: apiConfig.model,
  messages: [
    {
      role: 'system',
      content: SYSTEM_PROMPT  // 导演系统提示词
    },
    {
      role: 'user',
      content: prompt
    }
  ],
  temperature: 1.2  // 较高的温度，让互动更自然
}
```

#### 4. 解析导演的编排结果

```typescript
interface AIScene {
  scene: string                // 场景描述
  dramatic_analysis?: string   // 戏剧分析
  actions: AIAction[]          // 所有角色的动作列表
}

interface AIAction {
  characterId: string
  characterName: string
  action: 'like' | 'comment' | 'dm' | 'none'
  reason: string               // 为什么这么做
  delay: number                // 延迟多少秒执行
  commentContent?: string      // 评论内容
  replyTo?: string            // 回复谁
  dmContent?: string          // 私聊内容
}
```

#### 5. 按时间表执行动作

```typescript
scene.actions.forEach((action: AIAction) => {
  const delay = (action.delay || 0) * 1000
  
  setTimeout(() => {
    switch (action.action) {
      case 'like':
        executeLikeAction(action, moment, character)
        break
      case 'comment':
        executeCommentAction(action, moment, character, allActions)
        break
      case 'dm':
        executeDMAction(action, character)
        break
      case 'none':
        // 选择沉默
        break
    }
  }, delay)
})
```

### 导演的智能分析

导演系统会根据：

1. **朋友圈内容**：分析情绪、话题、隐含信息
2. **角色性格**：每个角色的个性和说话风格
3. **角色关系**：谁和谁关系好/差，谁可能互怼
4. **历史互动**：之前的朋友圈互动记录
5. **戏剧性**：如何让互动更有趣、更真实

**示例编排**：

```javascript
// 汁汁发朋友圈："今天心情不错"

// 导演分析：
{
  scene: "汁汁发朋友圈表达好心情，可能会引发朋友们的关心和调侃",
  dramatic_analysis: "简单的好心情状态，适合轻松互动",
  actions: [
    {
      characterName: "小明",
      action: "like",
      delay: 5,
      reason: "看到汁汁心情好，简单点赞表示支持"
    },
    {
      characterName: "小红",
      action: "comment",
      delay: 10,
      commentContent: "难得看你发这么正能量的😂",
      reason: "和汁汁关系好，可以小小调侃一下"
    },
    {
      characterName: "小刚",
      action: "none",
      delay: 0,
      reason: "和汁汁不太熟，选择沉默"
    }
  ]
}
```

---

## 📊 完整示例

### 场景：AI发朋友圈并触发互动

**1. 用户发消息**：
```
用户: 你今天怎么样？
```

**2. AI回复（开启了发朋友圈权限）**：
```
朋友圈：今天心情不错😊

还不错啊，刚发了个朋友圈记录一下
```

**3. 系统处理流程**：

```
📱 [AI发朋友圈] 检测到AI发朋友圈指令: {
  content: "今天心情不错😊",
  aiName: "汁汁",
  aiId: "zhizhi-001",
  aiAvatar: "🤖"
}

✅ [AI发朋友圈] 汁汁 发布了朋友圈: 今天心情不错😊

💾 [AI发朋友圈] 系统消息已保存: 汁汁发布了朋友圈："今天心情不错😊"

🎬 [AI发朋友圈] 触发导演系统，准备编排其他AI互动...
```

**4. 聊天界面显示**：
```
[灰色系统消息] 汁汁发布了朋友圈："今天心情不错😊"
[AI消息] 还不错啊，刚发了个朋友圈记录一下
```

**5. 3秒后导演开始工作**：
```
🎭 AI导演开始工作...
👥 参与角色: 小明、小红、小刚
📱 朋友圈内容: 今天心情不错😊

[调用API...]

✨ 场景编排结果
🎬 场景: 汁汁发朋友圈表达好心情
📋 共编排了 3 个动作

📅 动作时间表:
1. ⏱️ 小明 - 5秒后点赞
2. ⏱️ 小红 - 10秒后评论
3. ⏱️ 小刚 - 0秒后不互动
```

**6. 5秒后小明点赞**：
```
▶️ 执行动作: 小明 点赞
👍 小明 点赞了朋友圈
```

**7. 10秒后小红评论**：
```
▶️ 执行动作: 小红 评论
💬 小红 评论了朋友圈: 难得看你发这么正能量的😂
```

**8. 用户打开朋友圈页面**：
```
┌─────────────────────────────────┐
│ 🤖 汁汁                         │
│ 今天心情不错😊                  │
│                                 │
│ 👍 小明                         │
│ 💬 小红: 难得看你发这么正能量的😂 │
│                                 │
│ 刚刚                            │
└─────────────────────────────────┘
```

---

## 🎯 功能特点

### 1. 智能判断

✅ **不频繁发朋友圈**：AI会根据对话情况自然地决定是否发朋友圈
✅ **内容符合性格**：发的内容会符合AI的性格设定
✅ **不刻意**：不会为了发而发，很自然

### 2. 导演编排

✅ **关系分析**：基于角色关系决定谁互动、谁沉默
✅ **内容理解**：理解朋友圈的情绪和话题
✅ **时间分配**：合理安排互动的时间差
✅ **逻辑连贯**：互动内容前后呼应，有逻辑

### 3. 真实体验

✅ **灰色系统消息**：清晰提示AI发了朋友圈
✅ **朋友圈页面实时更新**：立即能看到新发的朋友圈
✅ **其他AI自然互动**：点赞/评论不是硬塞，而是基于关系

---

## 🔧 技术实现

### 文件结构

```
src/
├── pages/
│   └── ChatSettings.tsx                      # 开关UI
├── utils/
│   ├── chatApi.ts                           # 系统提示词
│   ├── aiMomentsPostParser.ts               # 指令解析器
│   └── momentsAI/
│       ├── director.ts                      # 导演主控制器
│       ├── dataCollector.ts                 # 数据收集
│       ├── promptTemplate.ts                # 导演提示词
│       ├── responseParser.ts                # 响应解析
│       └── actionExecutor.ts                # 动作执行
└── pages/ChatDetail/hooks/
    └── useChatAI.ts                         # 集成所有逻辑
```

### 数据流

```
AI回复"朋友圈：xxx"
    ↓
parseAIMomentsPost (解析指令)
    ↓
executeAIMomentsPost (发布朋友圈)
    ↓
创建系统消息 (灰色小字)
    ↓
loadMoments (获取刚发布的朋友圈对象)
    ↓
triggerAIMomentsInteraction (触发导演系统)
    ↓
aiDirectorArrangeScene (导演编排场景)
    ↓
调用API (让导演分析并编排)
    ↓
parseDirectorResponse (解析导演的决策)
    ↓
executeAction × N (按时间表执行每个动作)
    ↓
executeLikeAction / executeCommentAction / executeDMAction
    ↓
更新朋友圈数据 + 触发storage事件
    ↓
朋友圈页面实时更新
```

---

## ✅ 完成清单

- [x] 添加 `aiCanPostMoments` 字段到 `ChatSettingsData`
- [x] 在聊天设置UI中添加AI主动发朋友圈开关
- [x] 实现 `buildAIMomentsPostPrompt` 函数
- [x] 创建 `aiMomentsPostParser.ts` 解析器
- [x] 实现 `parseAIMomentsPost` 指令解析
- [x] 实现 `executeAIMomentsPost` 发布执行
- [x] 创建系统消息显示AI发布朋友圈
- [x] 集成朋友圈导演系统 `triggerAIMomentsInteraction`
- [x] 实现完整的AI互动编排流程
- [x] 添加详细的控制台日志输出

---

## 🚀 测试步骤

### 测试1：开启AI发朋友圈

1. 打开聊天设置
2. 找到"AI主动发朋友圈"开关
3. 打开开关
4. 看到提示："AI发送朋友圈后，其他AI角色可能会根据内容进行互动"
5. 确认设置已保存

### 测试2：AI发朋友圈

1. 在聊天中发消息触发AI回复
2. AI可能会回复包含：`朋友圈：xxx`
3. 观察控制台：
   ```
   📱 [AI发朋友圈] 检测到AI发朋友圈指令: ...
   ✅ [AI发朋友圈] 汁汁 发布了朋友圈: ...
   💾 [AI发朋友圈] 系统消息已保存: ...
   ```
4. 聊天中显示灰色系统消息："汁汁发布了朋友圈：'xxx'"
5. 打开朋友圈页面，确认AI的朋友圈已显示

### 测试3：导演系统编排互动

1. AI发朋友圈后，等待3秒
2. 观察控制台：
   ```
   🎬 [AI发朋友圈] 触发导演系统，准备编排其他AI互动...
   🎭 AI导演开始工作...
   ✨ 场景编排结果
   📅 动作时间表: ...
   ```
3. 根据导演的时间表，其他AI会依次互动
4. 打开朋友圈页面，确认其他AI的点赞/评论已显示

### 测试4：关闭功能

1. 打开聊天设置
2. 关闭"AI主动发朋友圈"开关
3. 在聊天中触发AI回复
4. 确认系统提示词中没有朋友圈发送指令
5. AI不应该发朋友圈

---

## 📝 总结

实现了完整的AI主动发朋友圈功能：

**核心功能**：
- ✅ AI可以在聊天中主动发朋友圈
- ✅ 可通过开关控制是否允许AI发朋友圈
- ✅ AI发朋友圈后显示系统消息
- ✅ 自动触发导演系统编排其他AI互动

**智能特性**：
- ✅ 导演基于内容和关系智能编排互动
- ✅ 不是硬评论点赞，而是有逻辑的自然互动
- ✅ 支持点赞、评论、回复、私聊多种互动方式
- ✅ 合理的时间分配，让互动更真实

**用户体验**：
- ✅ 灰色系统消息清晰提示
- ✅ 朋友圈页面实时更新
- ✅ 详细的控制台日志便于调试
- ✅ 可配置的开关，完全可控

🎉 **功能完整，可以开始测试！**
