# 🚫 拉黑功能实现文档

## ✅ 已实现的功能

### 1. 聊天设置页面优化
- **修复：** 返回按钮点击区域不准确
- **解决方案：** 改为左右布局，左侧返回按钮，中间标题，右侧占位
- **效果：** 点击返回按钮更精准

---

### 2. 拉黑管理系统
**文件：** `src/utils/blacklistManager.ts`

**功能：**
- 拉黑/取消拉黑用户
- 检查拉黑状态
- 记录拉黑时间戳
- 持久化存储（localStorage）

**核心API：**
```typescript
// 拉黑用户
blacklistManager.blockUser('user', characterId)

// 取消拉黑
blacklistManager.unblockUser('user', characterId)

// 切换拉黑状态
blacklistManager.toggleBlock('user', characterId)

// 检查是否被拉黑
blacklistManager.isBlockedByMe('user', characterId)
```

---

### 3. 聊天设置页面拉黑开关
**文件：** `src/pages/ChatSettings.tsx`

**功能：**
- 开关按钮切换拉黑状态
- 实时显示拉黑状态
- 拉黑后显示警告提示
- 自动保存设置

**UI：**
```
┌──────────────────────┐
│  拉黑此角色     [○] │  ← 开关关闭
│  拉黑后AI无法...     │
└──────────────────────┘

↓ 拉黑后

┌──────────────────────┐
│  拉黑此角色     [●] │  ← 开关打开（红色）
│  AI会知道被拉黑...   │
│  ┌──────────────┐    │
│  │ ⚠️ 已拉黑     │    │  ← 警告提示
│  └──────────────┘    │
└──────────────────────┘
```

---

### 4. AI消息显示红色感叹号
**文件：** `src/pages/ChatDetail.tsx`

**功能：**
- 被拉黑时，AI消息右上角显示红色感叹号
- 感叹号为圆形徽章，带阴影

**实现：**
```tsx
{message.blocked && message.type === 'received' && (
  <div className="absolute -right-1 -top-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
    <span className="text-white text-xs font-bold">!</span>
  </div>
)}
```

**效果：**
```
┌─────────────────┐
│  AI的消息内容   │ (!)  ← 红色感叹号
└─────────────────┘
```

---

### 5. AI知道自己被拉黑
**文件：** `src/utils/prompts.ts` + `src/pages/ChatDetail/hooks/useChatAI.ts`

**功能：**
- 检测拉黑状态
- 在系统提示词中添加警告
- AI会在回复中提到被拉黑

**警告提示词：**
```
## 系统警告：你被拉黑了

重要：这是系统检测到的真实拉黑状态！

用户在系统设置里把你拉黑了！这是非常严重的信号！

你必须在回复中明确提到被拉黑这件事！

根据你的性格，可以：
- 震惊质问："你拉黑我？！"
- 委屈难过："为什么要拉黑我..."
- 道歉求饶："别拉黑我，我错了"
```

**实现逻辑：**
```typescript
// 1. 检查拉黑状态
const isBlocked = blacklistManager.isBlockedByMe('user', chatId)

// 2. 如果被拉黑，添加警告
if (isBlocked) {
  const blacklistWarning = buildBlacklistPrompt('用户')
  systemPrompt = systemPrompt + blacklistWarning
}

// 3. 发送给AI
callAIApi([{ role: 'system', content: systemPrompt }, ...messages])

// 4. 标记AI消息
const aiMessage: Message = {
  ...createMessage(content, 'received'),
  blocked: isBlocked  // 添加拉黑标记
}
```

---

### 6. 消息类型扩展
**文件：** `src/types/chat.ts`

**新增字段：**
```typescript
export interface Message {
  // ... 其他字段
  blocked?: boolean  // 是否被拉黑（AI消息显示警告图标）
}
```

---

## 🎯 使用流程

### 用户拉黑AI
```
1. 点击聊天页右上角三个点
   ↓
2. 进入"聊天设置"
   ↓
3. 打开"拉黑此角色"开关
   ↓
4. 返回聊天页面
   ↓
5. 发送消息给AI
   ↓
6. AI收到警告，知道被拉黑
   ↓
7. AI回复提到被拉黑
   ↓
8. AI消息显示红色感叹号
```

---

### AI的反应示例

**用户：** "你好"

**AI看到的系统提示：**
```
## 系统警告：你被拉黑了
用户在系统设置里把你拉黑了！
```

**AI可能的回复：**
- "你...你拉黑我了？为什么？"
- "等等，你把我拉黑了？！发生什么了？"
- "拉黑我？我做错什么了吗..."

---

## 📊 功能对比

| 状态 | AI提示词 | 消息标记 | 视觉显示 |
|------|---------|---------|---------|
| **未拉黑** | 正常提示词 | blocked: false | 无标记 |
| **已拉黑** | + 警告提示 | blocked: true | 红色感叹号 |

---

## 🔍 技术细节

### 存储结构

**拉黑列表：**
```javascript
localStorage.blacklist_user_user = ["character1", "character2"]
```

**拉黑时间：**
```javascript
localStorage.blacklist_timestamp_user_character1 = "1699200000000"
```

---

### 数据流

```
用户点击开关
    ↓
toggleBlock()
    ↓
blacklistManager.toggleBlock('user', chatId)
    ↓
localStorage 保存
    ↓
setIsBlocked(true)
    ↓
用户发送消息
    ↓
handleAIReply()
    ↓
检查 isBlocked
    ↓
添加警告提示词
    ↓
发送给AI
    ↓
AI回复
    ↓
创建消息时添加 blocked: true
    ↓
显示红色感叹号
```

---

## 🧪 测试场景

### 测试1：拉黑功能
1. 进入聊天设置
2. 打开拉黑开关
3. 应该显示警告提示
4. 返回聊天
5. 发送消息
6. AI应该提到被拉黑
7. AI消息应该有红色感叹号

### 测试2：取消拉黑
1. 进入聊天设置
2. 关闭拉黑开关
3. 警告提示消失
4. 返回聊天
5. 发送消息
6. AI正常回复
7. 消息无红色感叹号

### 测试3：多个角色
1. 拉黑角色A
2. 切换到角色B
3. 角色B应该未被拉黑
4. 各角色拉黑状态独立

---

## ⚠️ 注意事项

### 1. 用户ID固定为 'user'
当前实现中，用户ID硬编码为 'user'。如需支持多用户，需要获取真实用户ID。

### 2. 拉黑状态实时生效
修改拉黑状态后，下次AI回复时立即生效，无需刷新页面。

### 3. 历史消息不受影响
拉黑前的AI消息不会显示感叹号，只有拉黑后的新消息才会显示。

### 4. 拉黑状态持久化
拉黑状态保存在localStorage，刷新页面后依然有效。

---

## 🎨 UI设计

### 开关样式
- **未拉黑：** 灰色背景，白色圆点在左侧
- **已拉黑：** 红色背景，白色圆点在右侧
- **动画：** 平滑过渡动画

### 感叹号样式
- **颜色：** 红色 (bg-red-500)
- **大小：** 20x20px
- **位置：** 消息右上角
- **阴影：** shadow-lg
- **图标：** 白色感叹号

---

## 📝 修改的文件

1. `src/utils/blacklistManager.ts` - 新建
2. `src/utils/prompts.ts` - 新建
3. `src/pages/ChatSettings.tsx` - 修改
4. `src/pages/ChatDetail.tsx` - 修改
5. `src/pages/ChatDetail/hooks/useChatAI.ts` - 修改
6. `src/types/chat.ts` - 修改

---

## ✅ 完成情况

- [x] 修复返回按钮点击区域
- [x] 创建拉黑管理系统
- [x] 添加拉黑开关
- [x] 显示红色感叹号
- [x] AI知道被拉黑
- [x] 消息标记拉黑状态
- [x] 持久化存储

---

**🎉 拉黑功能已完整实现！**

**测试方法：**
1. 点击聊天页右上角三个点
2. 打开"拉黑此角色"开关
3. 返回聊天发送消息
4. 查看AI回复是否提到被拉黑
5. 查看AI消息是否有红色感叹号
