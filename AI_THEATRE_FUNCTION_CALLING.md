# AI 小剧场 Function Calling 功能说明

## 功能概述

现在 AI 可以在对话中**自主决定**何时发送小剧场卡片，而不需要用户主动触发。

例如：
- AI 说"我帮你付钱了" → 自动插入一张**支付卡片**
- AI 说"我给你打电话" → 自动插入一张**来电记录卡片**
- AI 说"购物车里有这些" → 自动插入一张**购物车卡片**

---

## 技术实现

### 1. 使用 Gemini Function Calling

- **不需要在 prompt 里列出所有卡片类型**（避免干扰 AI 注意力）
- AI 只知道"我有个工具可以发卡片"
- AI 根据对话内容自己决定：
  - 要不要发卡片
  - 发什么类型的卡片
  - 卡片字段填什么内容

### 2. 工作流程

```
用户："帮我付一下这个订单"
    ↓
AI 判断：这是支付场景 → 调用 send_theatre_card 工具
    ↓
返回：
{
  "replyText": "好了，我帮你付钱了～",
  "tool_calls": [{
    "card_type": "payment_card",
    "fields": {
      "amount": "-3200.00",
      "merchant": "全家便利店",
      "status": "成功",
      "time": "2025-11-23 03:15:22",
      "method": "微信支付"
    }
  }]
}
    ↓
前端：插入文本消息 + 插入支付卡片
```

---

## 已实现的文件

### 1. `src/utils/theatreTools.ts`（新建）
- 定义 `send_theatre_card` 工具（Gemini Function Calling 格式）
- 解析 API 返回的 tool_calls
- 转换为消息格式

### 2. `src/utils/chatApi.ts`（修改）
- 在 API 请求中添加 `tools` 参数（仅线上模式）
- 支持 Gemini 和 OpenAI 两种格式
- 解析并返回 `tool_calls`

### 3. `src/pages/ChatDetail/hooks/useChatAI.ts`（修改）
- 在 AI 回复后检测 `tool_calls`
- 为每个 tool call 创建小剧场消息
- 插入聊天并保存到 IndexedDB

---

## 支持的卡片类型

目前工具定义中包含以下卡片类型：

1. **payment_card** - 支付卡片
2. **shopping_cart** - 购物车
3. **call_incoming** - 来电记录
4. **express_delivery** - 物流卡片
5. **receipt** - 收据
6. **transfer** - 转账记录
7. **hotel_booking** - 酒店预订
8. **movie_ticket** - 电影票
9. **concert_ticket** - 演唱会票
10. **coupon** - 优惠券
11. **group_buy** - 拼团
12. **bargain** - 砍价

---

## 如何添加新卡片类型

### 步骤 1：在前端创建小剧场模板

在 `src/data/templates/` 对应分类下创建模板文件，例如：
```ts
// src/data/templates/life/new_card.ts
export const newCardTemplate = {
  id: 'new_card',
  name: '新卡片',
  category: 'life',
  html: `...`, // 卡片 UI
  // ...
}
```

### 步骤 2：在工具定义中添加卡片类型

编辑 `src/utils/theatreTools.ts`：
```ts
export const THEATRE_TOOL = {
  // ...
  parameters: {
    properties: {
      card_type: {
        enum: [
          'payment_card',
          'shopping_cart',
          // ... 其他卡片
          'new_card'  // ← 添加新卡片 ID
        ]
      }
    }
  }
}
```

### 步骤 3：完成！

- AI 会自动知道有这个新卡片可用
- AI 会根据对话内容自己决定何时使用
- 不需要修改 prompt 或其他代码

---

## 注意事项

### 1. 仅在线上模式启用

- **线上模式**（普通聊天）：启用 Function Calling
- **线下模式**（小说生成）：禁用 Function Calling

原因：线下模式需要长篇输出，Function Calling 会干扰叙事流畅度。

### 2. API 兼容性

- ✅ **Gemini 2.0 Flash / 2.5 Pro**：完全支持
- ✅ **OpenAI GPT-4 / GPT-3.5**：支持
- ✅ **Claude 3**：支持
- ✅ **国内大模型**（通义千问、文心一言等）：大部分支持

### 3. 字段灵活性

AI 可以自由发挥字段内容，不需要严格匹配模板定义。

例如支付卡片：
- 模板定义：`amount`, `merchant`, `status`, `time`, `method`
- AI 可能额外添加：`note`, `order_id`, `items` 等字段
- 前端模板会忽略未定义的字段，或者可以扩展模板来支持

---

## 调试

### 查看 Function Calling 日志

打开浏览器控制台，搜索：
- `🎭 [小剧场] Function Calling 已启用`
- `🎭 [小剧场] 检测到 tool_calls`
- `🎭 [小剧场] 插入卡片消息`

### 常见问题

**Q: AI 没有发送卡片？**
- 检查是否在线上模式（线下模式不启用）
- 检查对话内容是否明确触发了卡片场景
- 查看控制台是否有 `tool_calls` 日志

**Q: 卡片字段不对？**
- AI 会根据对话内容自由填充字段
- 可以在 prompt 中增加字段说明（但会增加 token 消耗）

**Q: 想禁用某些卡片？**
- 编辑 `src/utils/theatreTools.ts`
- 从 `enum` 中移除对应的卡片 ID

---

## 性能优化

### Token 消耗

- Function Calling 工具定义：约 **200-300 tokens**
- 相比在 prompt 里列出所有卡片（可能 1000+ tokens），节省了大量 token

### API 调用次数

- **不增加额外 API 调用**
- tool_calls 和文本回复在同一次 API 请求中返回

---

## 未来扩展

### 1. 支持更多卡片类型

可以无限扩展，只需：
1. 创建前端模板
2. 在工具定义中添加 ID
3. 完成

### 2. 动态卡片库

如果卡片数量超过 100 个，可以改用：
- **向量检索**：根据对话内容检索相关卡片
- **分类工具**：按场景分类（生活、娱乐、工作等）

### 3. 多轮对话卡片

AI 可以在一次回复中发送多张卡片：
```json
{
  "replyText": "好了，我帮你下单了～",
  "tool_calls": [
    { "card_type": "shopping_cart", "fields": {...} },
    { "card_type": "payment_card", "fields": {...} }
  ]
}
```

---

## 总结

✅ **AI 自主决定何时发卡片**  
✅ **不干扰 AI 注意力**（工具定义很简洁）  
✅ **易于扩展**（添加新卡片只需 2 步）  
✅ **节省 token**（相比 prompt 列举所有卡片）  
✅ **完全动态**（AI 自由填充字段内容）
