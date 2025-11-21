# 记忆系统 API 降级机制修复

## 问题描述
用户报告：记忆总结功能在没有配置副API时直接抛出错误，而不是降级使用主API。

**错误信息**：
```
Error: 请先在系统设置中配置副API（智能总结API）
```

这导致用户在只配置了主API的情况下无法使用记忆提取和时间线生成功能。

## 修复方案

### 修改文件：`src/utils/memorySystem.ts`

#### 1. 记忆提取功能（第97-130行）

**修复前**：
```typescript
const summaryApiConfig = summaryApiService.get()

// 🔥 检查副API是否已配置
if (!summaryApiConfig.baseUrl || !summaryApiConfig.apiKey || !summaryApiConfig.model) {
  throw new Error('请先在系统设置中配置副API（智能总结API）')
}

const summarySettings = {
  baseUrl: summaryApiConfig.baseUrl,
  apiKey: summaryApiConfig.apiKey,
  model: summaryApiConfig.model,
  provider: summaryApiConfig.provider,
  temperature: 0.3,
  maxTokens: 2000
}
```

**修复后**：
```typescript
const summaryApiConfig = summaryApiService.get()

// 🔥 如果副API没配置，降级使用主API
let summarySettings: any
let usingMainApi = false

if (!summaryApiConfig.baseUrl || !summaryApiConfig.apiKey || !summaryApiConfig.model) {
  console.warn('[记忆系统] 副API未配置，降级使用主API')
  const { getApiSettings } = await import('./chatApi')
  const mainApiConfig = getApiSettings()
  
  if (!mainApiConfig) {
    throw new Error('主API和副API都未配置，请先配置API')
  }
  
  summarySettings = {
    baseUrl: mainApiConfig.baseUrl,
    apiKey: mainApiConfig.apiKey,
    model: mainApiConfig.model,
    provider: mainApiConfig.provider,
    temperature: 0.3,
    maxTokens: 2000
  }
  usingMainApi = true
} else {
  summarySettings = {
    baseUrl: summaryApiConfig.baseUrl,
    apiKey: summaryApiConfig.apiKey,
    model: summaryApiConfig.model,
    provider: summaryApiConfig.provider,
    temperature: 0.3,
    maxTokens: 2000
  }
}

console.log(`[记忆系统] 使用${usingMainApi ? '主' : '副'}API: ${summarySettings.model}`)
```

#### 2. 时间线生成功能（第843-876行）

同样的修复逻辑应用到时间线生成功能。

## 降级机制说明

### 优先级
1. **优先使用副API**：如果配置了副API（智能总结API），优先使用
2. **降级使用主API**：如果副API未配置，自动降级使用主API
3. **抛出错误**：如果主API和副API都未配置，才抛出错误

### 控制台日志
- 使用副API时：`[记忆系统] 使用副API: gpt-4o`
- 降级使用主API时：
  - 警告：`[记忆系统] 副API未配置，降级使用主API`
  - 确认：`[记忆系统] 使用主API: gpt-4o`

## 受影响的功能

1. **记忆提取**（`extractMemoriesFromConversation`）
   - 从对话中提取有用的长期记忆
   - 使用AI分析对话内容

2. **时间线生成**（`generateTimelineFromMessages`）
   - 从消息记录生成时间线摘要
   - 智能分析和总结对话历史

## 用户体验改进

### 修复前
- ❌ 必须配置副API才能使用记忆功能
- ❌ 报错信息不友好
- ❌ 用户体验差

### 修复后
- ✅ 只要配置了主API就能使用记忆功能
- ✅ 自动降级，无需用户干预
- ✅ 控制台有清晰的日志说明
- ✅ 只有在两个API都未配置时才报错

## 配置建议

### 推荐配置
- **主API**：用于日常聊天对话（高性能模型，如 GPT-4o）
- **副API**：用于智能总结任务（经济型模型，如 GPT-3.5-turbo）

### 最小配置
- **只配置主API**：所有功能正常工作，但总结任务会消耗主API的额度

### 成本优化
如果希望降低成本，可以配置副API使用更便宜的模型专门处理总结任务。
