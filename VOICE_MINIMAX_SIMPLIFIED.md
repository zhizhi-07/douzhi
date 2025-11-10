# MiniMax 语音模块 - 简化版说明

## 📋 简化内容

### 原有问题
- ❌ 复杂的双环境判断（本地/生产环境）
- ❌ 多配置管理系统，内置配置override机制
- ❌ 多种音频数据格式处理
- ❌ 冗长的错误处理和日志

### 简化方案
✅ **统一代理模式**：无论本地还是生产环境，统一通过 `/api/minimax-tts` 代理
✅ **单一配置**：只保留一套配置（API Key、Group ID、Voice ID、Base URL）
✅ **简单存储**：使用单个 localStorage key 存储
✅ **精简代码**：大幅减少代码量和复杂度

---

## 🎯 新架构

### 1. **voiceApi.ts** (98行 → 98行)
```typescript
// 统一通过代理调用，自动从配置读取
callMinimaxTTS(text, apiKey?, groupId?, voiceId?)

// 播放音频
playAudio(audioUrl)

// 测试配置
testVoiceConfig(apiKey, groupId, voiceId)
```

**特点：**
- 统一使用 `/api/minimax-tts` 代理
- 参数可选，自动从 voiceService 读取
- 只处理音频流响应，简化逻辑

### 2. **voiceService.ts** (134行 → 60行)
```typescript
interface VoiceConfig {
  apiKey: string
  groupId: string
  voiceId: string
  baseUrl?: string
}

// API
voiceService.getCurrent()  // 获取配置
voiceService.save(config)  // 保存配置
voiceService.isConfigured() // 检查是否已配置
voiceService.clear()       // 清空配置
```

**特点：**
- 移除多配置管理
- 移除内置配置override
- 单一存储key：`minimax_voice_config`

### 3. **minimax-tts.js** (146行 → 101行)
```javascript
// Vercel Serverless代理
POST /api/minimax-tts
{
  text: string
  apiKey: string
  groupId: string
  voiceId: string
  baseUrl?: string
}

// 返回：audio/mpeg 二进制流
```

**特点：**
- 简化CORS设置
- 精简错误处理
- 只返回音频流（移除JSON响应）

### 4. **VoiceSettings.tsx** (268行 → 180行)
- 移除配置列表
- 单一表单界面
- 直接修改和保存
- 一键测试功能

---

## 📦 使用方式

### 配置步骤
1. 访问 [platform.minimaxi.com](https://platform.minimaxi.com)
2. 创建 API Key，获取 **API Key** 和 **Group ID**
3. 上传音频克隆音色，获取 **Voice ID**
4. 在应用的"语音设置"页面填写配置
5. 点击"测试语音"验证
6. 保存配置

### 代码调用
```typescript
import { callMinimaxTTS, playAudio } from '@/utils/voiceApi'

// 使用全局配置
const result = await callMinimaxTTS('你好')
await playAudio(result.audioUrl)

// 使用自定义配置
const result = await callMinimaxTTS('你好', apiKey, groupId, voiceId)
await playAudio(result.audioUrl)
```

---

## 🔧 技术细节

### 数据流
```
用户 → voiceApi → /api/minimax-tts → MiniMax API
                    (Serverless)
```

### 配置存储
```
localStorage: minimax_voice_config
{
  apiKey: "sk-xxx",
  groupId: "xxx",
  voiceId: "male-qn-qingse",
  baseUrl: "https://api.minimaxi.com/v1"
}
```

### 错误处理
- 参数验证：缺少必需参数抛出错误
- 网络错误：显示友好错误信息
- API错误：解析并显示MiniMax返回的错误

---

## ✅ 优势

1. **代码量减少**：从 ~600行 → ~360行
2. **逻辑清晰**：单一调用路径，易于理解
3. **易于维护**：移除复杂的环境判断和配置管理
4. **统一体验**：本地和生产环境行为一致
5. **更少Bug**：减少边界情况和状态管理

---

## 🚀 部署

确保 `vercel.json` 包含代理配置：
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

代理文件位置：`api/minimax-tts.js`

---

## 📝 迁移指南

### 从旧版本迁移
1. 旧配置会自动失效
2. 用户需要重新填写语音配置
3. 配置结构变更，需要填写 Voice ID

### 兼容性
- ✅ 调用接口保持兼容
- ✅ 现有代码无需修改
- ⚠️ 配置数据需要重新填写

---

## 📞 支持

如遇问题请检查：
1. API Key、Group ID、Voice ID 是否正确
2. MiniMax 账户余额是否充足
3. 浏览器控制台是否有错误信息
4. Vercel 部署是否成功
