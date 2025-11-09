# 🔥 AI 记忆系统 - 副 API 优化

## 📊 优化内容

### 1. 使用副 API
- ✅ 自动检测是否配置了副 API
- ✅ 如果配置了副 API，记忆提取使用副 API
- ✅ 否则使用主 API
- 💰 **降低成本**：记忆提取可使用便宜的模型

### 2. 改为客观总结风格
- ✅ 不再使用角色的口语和称呼
- ✅ 改用第三人称客观描述
- 📝 **更清晰准确**：避免主观情感干扰

---

## 🔄 修改前后对比

### 记忆内容对比

**之前（角色口语风格）**：
```json
{
  "type": "preference",
  "content": "我家宝宝喜欢吃香蕉~",
  "importance": 5
}
```

**现在（客观总结风格）**：
```json
{
  "type": "preference",
  "content": "用户喜欢吃香蕉",
  "importance": 5
}
```

---

### API 使用对比

**之前（只用主 API）**：
```typescript
const settings = getApiSettings()
const response = await callAIApi(messages, settings)
```

**现在（优先用副 API）**：
```typescript
const mainSettings = getApiSettings()

// 🔥 使用副API（如果配置了）
const summarySettings = mainSettings.summaryApi 
  ? {
      baseUrl: mainSettings.summaryApi.baseUrl,
      apiKey: mainSettings.summaryApi.apiKey,
      model: mainSettings.summaryApi.model,
      provider: mainSettings.summaryApi.provider,
      temperature: 0.3,
      maxTokens: 2000
    }
  : mainSettings

const response = await callAIApi(messages, summarySettings)
```

---

## 💰 成本节省

### 使用场景
- 记忆提取（每次对话后）
- 记忆总结（手动生成）

### 节省效果
假设：
- 主 API：GPT-4 ($0.03/1K tokens)
- 副 API：GPT-3.5 ($0.002/1K tokens)
- 每次记忆提取：约 1000 tokens

**成本对比**：
- 使用主 API：$0.03/次
- 使用副 API：$0.002/次
- **节省 93%** 🎉

每 100 次记忆提取：
- 主 API：$3.00
- 副 API：$0.20
- **省 $2.80**

---

## 📝 提示词对比

### 之前的提示词（角色口语）

```
你是 AI角色名。
现在，你需要用**你自己的语气和视角**来记录和分析对话。

记录原则：
1. 用你自己的语气：不要用死板的"用户xxx"
   * ❌ 死板: "用户喜欢吃香蕉"
   * ✅ 生动: "我家宝宝喜欢吃香蕉~"

示例输出：
{
  "memories": [
    {
      "type": "preference",
      "content": "我家宝宝喜欢吃香蕉~",
      "importance": 5
    }
  ],
  "summary": "今天知道了宝宝喜欢吃香蕉~"
}
```

---

### 现在的提示词（客观总结）

```
你是一个记忆提取助手。请客观总结出关于用户的重要信息。

记录原则：
1. 客观描述：用第三人称客观记录
   * ✅ "用户喜欢吃香蕉"
   * ✅ "用户每天7点下班"
   * ✅ "用户不喜欢吃辣"

示例输出：
{
  "memories": [
    {
      "type": "preference",
      "content": "用户喜欢吃香蕉",
      "importance": 5
    }
  ],
  "summary": "用户喜欢吃香蕉，每天7点下班"
}
```

---

## 🎯 优势对比

### 角色口语风格（之前）
**优点**：
- ✅ 更有个性和情感
- ✅ 更符合角色设定

**缺点**：
- ❌ 主观色彩浓厚
- ❌ 不同角色风格不一致
- ❌ 解析可能不稳定
- ❌ 使用主 API 成本高

---

### 客观总结风格（现在）
**优点**：
- ✅ 清晰准确
- ✅ 风格一致
- ✅ 易于解析和管理
- ✅ 使用副 API 成本低
- ✅ 低温度生成更稳定

**缺点**：
- ❌ 缺少个性

**结论**：记忆系统更适合用客观风格！

---

## 🔧 技术细节

### 修改的文件

```
src/utils/memorySystem.ts           # 核心逻辑修改
AI记忆系统使用说明.md                # 文档更新
```

### 关键代码

```typescript
// src/utils/memorySystem.ts

async extractMemoriesFromConversation(
  userMessage: string,
  aiResponse: string,
  _characterName: string = 'AI',      // 不再使用
  _characterPersonality: string = ''  // 不再使用
): Promise<{ memories: Memory[], summary: string }> {
  // ...
  
  // 🔥 使用副API（如果配置了）
  const summarySettings = mainSettings.summaryApi 
    ? {
        baseUrl: mainSettings.summaryApi.baseUrl,
        apiKey: mainSettings.summaryApi.apiKey,
        model: mainSettings.summaryApi.model,
        provider: mainSettings.summaryApi.provider,
        temperature: 0.3,  // 低温度确保稳定
        maxTokens: 2000
      }
    : mainSettings
  
  console.log(`💭 [记忆系统] 使用${mainSettings.summaryApi ? '副API' : '主API'}`)
  
  // 客观总结风格的提示词
  const prompt = `你是一个记忆提取助手。请客观总结...`
  
  const response = await callAIApi(messages, summarySettings)
}
```

---

## 📊 配置副 API

### 在哪里配置？

```
设置 → API配置 → 添加API
```

### 配置示例

**主 API**：
- Provider: OpenAI
- Model: gpt-4
- 用途：聊天回复

**副 API（推荐）**：
- Provider: OpenAI
- Model: gpt-3.5-turbo
- 用途：记忆提取、群聊总结等辅助任务

---

## ✅ 兼容性

- ✅ 如果没有配置副 API，自动使用主 API
- ✅ 向后兼容，不影响现有功能
- ✅ 已有的记忆数据不受影响
- ✅ UI 和路由保持不变

---

## 🎉 总结

这次优化带来：

1. **💰 降低成本** - 使用副 API 节省 90%+ 费用
2. **📝 提高质量** - 客观风格更清晰准确
3. **⚡ 提升稳定性** - 低温度生成更可靠
4. **🔄 向后兼容** - 不破坏现有功能

**推荐配置**：
- 主 API：GPT-4（用于聊天）
- 副 API：GPT-3.5-turbo（用于记忆提取、总结）

---

**修改完成时间**：2024-11-09  
**优化状态**：✅ 已完成并测试
