# 小剧场功能使用说明

## 功能概述

**小剧场**是一个智能HTML生成器，通过识别关键词自动生成富交互的HTML内容。

### 核心特点

✅ **AI输出简化**：AI只需要输出结构化文本，无需生成HTML代码  
✅ **关键词触发**：自动识别关键词（小票、日记、菜单等）  
✅ **自定义关键词**：用户可以为每个模板自定义触发关键词  
✅ **全局开关**：一键启用/禁用所有小剧场功能  
✅ **正则替换**：系统自动将数据填入HTML模板  
✅ **即时预览**：查看每个模板的实际效果  

---

## 使用流程

### 1. 打开小剧场
- 在桌面第二页，点击"小剧场"图标
- 或直接访问 `/theatre` 路由

### 2. 输入需求
在输入框中输入包含关键词的需求，例如：
```
今天吃了炒饭，发票给我看看
```

### 3. AI生成数据
AI识别到"发票"关键词后，输出结构化文本：
```
食物：炒饭
价格：25
商家：快餐店
日期：2025-11-21
时间：13:45
```

### 4. 查看结果
系统自动将数据填入HTML模板，生成精美的小票

---

## 已实现的模板

### 1️⃣ 小票（Receipt）
**关键词**：小票、发票、账单、收据

**需要的字段**：
- 食物：菜品名称
- 价格：金额
- 商家：店铺名
- 日期：年月日
- 时间：时分

**示例输入**：
```
今天吃了炒饭，发票给我看看
```

**AI输出格式**：
```
食物：炒饭
价格：25
商家：快餐店
日期：2025-11-21
时间：13:45
```

---

### 2️⃣ 日记（Diary）
**关键词**：日记、记录

**需要的字段**：
- 标题：日记标题
- 内容：正文内容
- 日期：年月日
- 心情：emoji表情

**示例输入**：
```
今天心情不错，帮我写一篇日记
```

**AI输出格式**：
```
标题：今天的心情
内容：今天天气不错，心情也很好。中午吃了喜欢的炒饭，下午和朋友聊天，感觉很开心。
日期：2025-11-21
心情：😊
```

---

### 3️⃣ 菜单（Menu）
**关键词**：菜单、点菜、餐单

**需要的字段**：
- 菜品1、菜品2、菜品3：菜名
- 价格1、价格2、价格3：对应价格
- 餐厅名：餐厅名称

**示例输入**：
```
给我看看今天的菜单
```

**AI输出格式**：
```
菜品1：红烧肉
价格1：38
菜品2：糖醋排骨
价格2：42
菜品3：清炒时蔬
价格3：18
餐厅名：家常菜馆
```

---

## 技术实现

### 数据流程

```
用户输入 
  → 识别关键词（findTemplateByKeyword）
  → 选择模板（TheatreTemplate）
  → AI生成结构化数据
  → 正则替换（fillTemplate）
  → 渲染HTML
```

### 关键代码

#### 1. 模板配置
```typescript
// src/data/theatreTemplates.ts

export interface TheatreTemplate {
  id: string                 // 模板ID
  name: string              // 模板名称
  keywords: string[]        // 触发关键词
  fields: TheatreField[]    // 需要的字段
  htmlTemplate: string      // HTML模板（带{{占位符}}）
}
```

#### 2. 关键词识别
```typescript
export function findTemplateByKeyword(text: string): TheatreTemplate | null {
  for (const template of theatreTemplates) {
    for (const keyword of template.keywords) {
      if (text.includes(keyword)) {
        return template
      }
    }
  }
  return null
}
```

#### 3. 正则替换
```typescript
export function fillTemplate(template: TheatreTemplate, aiOutput: string): string {
  let html = template.htmlTemplate
  
  // 解析AI输出：食物：炒饭
  const lines = aiOutput.split('\n')
  const data: Record<string, string> = {}
  
  for (const line of lines) {
    const match = line.match(/^(.+?)[：:]\s*(.+)$/)
    if (match) {
      const label = match[1].trim()  // "食物"
      const value = match[2].trim()  // "炒饭"
      
      // 根据label找到对应的key（FOOD_NAME）
      const field = template.fields.find(f => f.label === label)
      if (field) {
        data[field.key] = value
      }
    }
  }
  
  // 替换HTML中的{{FOOD_NAME}}等占位符
  for (const field of template.fields) {
    const value = data[field.key] || field.placeholder || ''
    html = html.replace(new RegExp(`{{${field.key}}}`, 'g'), value)
  }
  
  return html
}
```

---

## 添加新模板

### 步骤

1. **编辑 `src/data/theatreTemplates.ts`**
2. **在 `theatreTemplates` 数组中添加新模板**

### 示例：添加购物清单模板

```typescript
{
  id: 'shopping-list',
  name: '购物清单',
  keywords: ['购物', '清单', '买东西'],
  fields: [
    { key: 'ITEM1', label: '商品1', placeholder: '苹果' },
    { key: 'ITEM2', label: '商品2', placeholder: '香蕉' },
    { key: 'ITEM3', label: '商品3', placeholder: '牛奶' },
  ],
  htmlTemplate: `
<div style="max-width: 350px; background: white; padding: 20px; border-radius: 12px;">
  <h3>🛒 购物清单</h3>
  <ul>
    <li>{{ITEM1}}</li>
    <li>{{ITEM2}}</li>
    <li>{{ITEM3}}</li>
  </ul>
</div>
  `.trim()
}
```

---

## 集成到聊天系统

### 在私聊/群聊中使用

1. **识别关键词**
```typescript
import { findTemplateByKeyword, fillTemplate } from '../data/theatreTemplates'

const template = findTemplateByKeyword(userMessage)
if (template) {
  // 触发AI生成结构化数据
  const aiOutput = await callAI(prompt)
  const html = fillTemplate(template, aiOutput)
  
  // 在消息中渲染HTML
  addMessage({
    type: 'theatre',
    content: html
  })
}
```

2. **在系统提示词中说明**
```
当用户提到"发票"、"小票"等关键词时，你需要输出以下格式的数据：

食物：XXX
价格：XXX
商家：XXX
日期：YYYY-MM-DD
时间：HH:MM

不要输出HTML代码，只输出上述格式的文本即可。
```

---

## 从桌面HTML库迁移

你电脑桌面上的 `html` 文件夹包含100+个DOCX模板，可以按以下步骤迁移：

### 1. 提取HTML代码
- 打开 `.docx` 文件
- 复制里面的HTML代码
- 识别占位符（通常是变量名）

### 2. 转换为模板
```typescript
{
  id: 'template-name',
  name: '模板名',
  keywords: ['关键词1', '关键词2'],
  fields: [
    { key: 'PLACEHOLDER1', label: '字段1', placeholder: '默认值' }
  ],
  htmlTemplate: `复制的HTML代码，用{{PLACEHOLDER1}}替换变量`
}
```

### 3. 测试
在小剧场应用中输入关键词测试生成效果

---

## 优势

### 相比AI直接生成HTML

❌ **AI生成HTML**：
- 容易出错（标签未闭合、样式丢失）
- 每次生成不一致
- 消耗更多tokens
- 难以控制样式

✅ **模板+正则替换**：
- 100%准确，无语法错误
- 样式统一、专业
- 节省tokens
- 易于维护和扩展

---

## 路由信息

- **路由路径**：`/theatre`
- **组件文件**：`src/pages/TheatreApp.tsx`
- **模板配置**：`src/data/theatreTemplates.ts`
- **桌面入口**：Desktop第二页"小剧场"图标

---

## 下一步扩展

### 计划添加的模板

根据你的 `html` 文件夹，可以添加：

- 📱 **聊天记录**：模拟微信聊天截图
- 📋 **待办清单**：任务列表
- 🎮 **小游戏**：井字棋、猜拳等
- 💌 **表白墙**：浪漫卡片
- 📊 **统计图表**：情绪月历、打卡记录
- 🎁 **礼物卡片**：生日祝福、节日问候
- 📝 **便签**：便利贴样式
- 🎯 **投票**：选择题样式

每个模板只需要：
1. 定义关键词
2. 列出需要的字段
3. 提供HTML模板

AI只需要输出简单的文本数据即可！

---

## 总结

小剧场功能实现了：
- ✅ 关键词自动识别
- ✅ AI输出简化（只输出文本，不输出HTML）
- ✅ 正则自动替换
- ✅ 实时预览和HTML导出
- ✅ 模板化管理，易于扩展

这个设计非常聪明，避免了AI生成HTML的各种问题，同时保持了灵活性和创意性！
