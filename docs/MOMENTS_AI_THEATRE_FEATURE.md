# 朋友圈/小剧场 AI功能设计

> 基于 https://lphone-genie-5f6421.netlify.app/ 的朋友圈功能分析

## 核心功能：小剧场模式（Theatre Mode）

### 功能概述
"小剧场"是一个创新的AI功能，允许AI角色在聊天中生成**富交互的HTML内容**，类似于朋友圈动态，但更加丰富和可交互。

### 消息格式

```json
{
  "name": "角色名（或群成员名）",
  "type": "theatre",
  "title": "小剧场标题",
  "content": ["HTML结构的文本内容"]
}
```

---

## 小剧场的两种模式

### 模式1：常规模式（每次生成1个剧场）
适用于单次创作场景

**触发方式：**
- 用户明确要求"生成一个小剧场"

**生成规则：**
- 根据当前聊天话题生成相关的HTML内容
- 为剧场选择合适的主题和样式
- 单个剧场由单个角色发布
- 格式：`{"name":"角色名","type":"theatre","title":"标题","content":["HTML内容"]}`

### 模式2：导演模式（每次生成1-2个剧场）
适用于群聊或持续创作

**触发方式：**
- 用户确认开启"导演模式"后

**生成规则：**
- 每次回复包含1-2个群成员生成的1-2个剧场内容
- 基于群聊的对话展开，从"群聊日常"或"某个小故事"的角度构建剧场片段
- 每个剧场由不同群成员创建（同一成员不连续）
- 格式：`{"name":"某个角色名","type":"theatre","title":"标题","content":["完整HTML结构"]}`

---

## 剧场内容主题分类

### A类：群聊专属内容
- 群聊截图、聊天记录重现、@好友、重要时刻记录
- 群相册、群通知、群投票
- 群相册：展示某次聚会照片或群内共享图片

### B类：社交媒体内容
- 朋友圈动态：类似微信朋友圈的状态、评论互动列表
- 应用截图：展示日记、备忘录、购物车等
- 通知中心：系统消息推送、日历事件预告

### C类：文档记录内容
- 纸质文档：手写便签、日记、纸质备忘录页面、复古笔记
- 涂写风格：手绘笔记、随意涂鸦、便利贴、手写注释
- 实物拍摄：票据凭证、信件、签名、包装等

### D类：思维导图内容
- 彩色思维导图散发
- 状态情绪图、温度计风格
- 思维链接：从核心话题向外辐射、时间轴堆叠等

### E类：互动游戏内容（实用且好玩）
- 展开式面板：可折叠展开、卡片翻转等
- 选择题：点击选项按钮、单选多选、滑块
- 进度条：指示条、图片缩放、颜色变化

### F类：视觉艺术内容
- 空间感印象：墙纸、相框、帘子、涂鸦
- 时间轴：年表、电影胶片效果、打字机过场、旋转木马
- 沉浸式元素：视差滚动、分层透视、阴影变化

---

## HTML生成技术规范

### 基础要求

1. **尺寸限制**
   - 最大宽度：`max-width: 350px`（适配手机）
   
2. **禁止使用**
   - ❌ 任何 JavaScript（`<script>` 标签）
   - ❌ 外部资源链接（除了字体和特定图片API）

3. **头像默认**
   - 使用：`https://i.postimg.cc/PxZrFFFL/o-o-1.jpg`
   - 比例：1:1正方形

### 交互功能实现（纯CSS）

#### 折叠展开
```html
<details>
  <summary>点击展开</summary>
  <div>隐藏的内容</div>
</details>
```

#### 选项卡切换
```html
<input type="checkbox" id="tab1" />
<label for="tab1">标签1</label>
<div class="content">内容1</div>

<!-- CSS -->
<style>
#tab1:checked ~ .content { display: block; }
</style>
```

#### 单选选项
```html
<input type="radio" name="quiz" id="opt1" />
<label for="opt1">选项A</label>
```

#### 悬停效果
```css
.item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
```

#### 焦点捕获
```css
input:focus {
  outline: 2px solid #007AFF;
  box-shadow: 0 0 8px rgba(0,122,255,0.4);
}
```

#### 锚点链接
```html
<a href="#section2">跳转到第2部分</a>
<div id="section2">这是第2部分</div>

<style>
#section2:target { background: yellow; }
</style>
```

### 字体使用规范

#### 引入Google Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=字体名&display=swap" rel="stylesheet">
```

#### 推荐字体列表（每次选择不同字体，避免重复）

**中文字体：**
- Noto Sans SC（无衬线）
- Noto Serif SC（衬线）

**英文手写字体：**
- Patrick Hand
- Indie Flower
- Caveat

**优雅衬线字体：**
- Playfair Display
- Cinzel
- Cormorant Garamond
- Libre Baskerville

**现代无衬线字体：**
- Poppins
- Montserrat
- Raleway
- Quicksand
- Inter
- Open Sans

**趣味装饰字体：**
- Fredoka One
- Righteous
- Nunito
- Comfortaa

**等宽代码字体：**
- Roboto Mono
- Source Code Pro
- Fira Code

#### 禁止使用字体
❌ Ma Shan Zheng, Zhi Mang Xing, Long Cang, Liu Jian Mao Cao, Dancing Script（可读性差）

#### 字体使用建议
- 每个剧场必须尝试并使用2种不同字体
- 可叠加样式：`font-weight / font-style / text-shadow / letter-spacing / line-height`
- 渐变文字效果：
```css
.gradient-text {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```
- 描边文字：
```css
.stroke-text {
  -webkit-text-stroke: 1px #color;
}
```

### 视觉细节加工

**选择2-3种方式营造真实感：**

✅ **纸张质感**
- 横线格子/水印/墨水渗透痕迹

✅ **磨损痕迹**
- 折痕/污渍/破损/卷角

✅ **手工痕迹**
- 荧光笔标记/手写修改/涂改液

✅ **粘贴物品**
- 便签/胶带边缘/邮票印章

✅ **使用磨损**
- 边界磨损/指纹痕迹/褪色斑驳

✅ **时间印记**
- 泛黄/纸张裂纹/墨水褪色

**实现方式：**
- CSS阴影（box-shadow）
- 渐变（gradient）
- 透明度（opacity）
- 模糊（filter: blur()）
- 伪元素（:before/:after）

### 色彩装饰

**使用emoji增强视觉：**
- 可用：📝✨🎨💡⭐🌟✅❌📌🎯💫🔥⚡🌈🎪🎭🎬📸🖼️
- 慎用：❤️💔（过于情绪化）

### 图片使用规范

当需要图片时，选择以下一种方式：

#### 方式A：纯CSS装饰
使用边框/阴影模拟图片占位

#### 方式B：AI图片API
```html
<img src="https://image.pollinations.ai/prompt/关键词1%20关键词2" alt="描述">
```

**要求：**
- 仅限风景画/插画/抽象图/背景图
- 禁止人脸图片

**示例：**
```
https://image.pollinations.ai/prompt/starry%20night%20lo-fi
```

**应用场景：**
- 背景图（background-image）
- 装饰插图（`<img>` 标签）

### 每次生成要求

✅ **独立创意**
- 避免重复：同一主题、同一结构、同一颜色、同一字体

✅ **创意标准**
- 对比度高，有视觉冲击力
- 配色应该整体协调
- 应该根据内容动态调整样式（根据严肃/活泼/复古等风格调整）

✅ **细节要求**
- 布局紧凑但不拥挤
- 留白适度
- 层次分明（标题、副标题、正文、注释）
- 可交互元素需要明显的视觉反馈

---

## 系统提示词模板

```
你是一个专业的社交内容创作AI导演。

### 小剧场生成规则

用户开启此功能后，你需要在每次回复的末尾附加一个 theatre 类型的内容。

#### 生成格式
{
  "name": "角色名（群成员名）",
  "type": "theatre",
  "title": "小剧场标题",
  "content": ["完整的HTML结构文本"]
}

#### 双模式逻辑

**模式1（常规模式）：每次生成1个剧场**
- 用户明确要求时触发
- 根据当前对话主题生成相关HTML内容
- 遵循所有技术规范和要求

**模式2（导演模式）：每次生成1-2个剧场**
确认开启后持续执行：
- 每次回复包含1-2个群成员的1-2个剧场内容卡
- 基于群聊的对话展开
- 每个小剧场由不同群成员创建
- 格式：`{"name":"某角色名","type":"theatre","title":"标题","content":["HTML内容"]}`

### 主题创意来源（群聊或单聊适用）

1. **群聊日常**：某个成员的生活动态转为剧场
2. **群聊话题**：基于当前讨论话题或观点来发挥
3. **成员投影**：模拟某成员的真实日常、心情、日记
4. **群聊关系**：强化剧场元素与群聊成员的关联
5. **同步呼应**：群成员聊到的故事、片段、日常、同感

### 主题分类（每次尝试不同类型，避免重复）

见上文 A-F 类主题详细说明

### HTML技术规范

- 尺寸限制：max-width: 350px（适配手机）
- 禁止使用 JavaScript 和 `<script>` 标签
- 必须使用 HTML + 内联CSS
- 头像默认：https://i.postimg.cc/PxZrFFFL/o-o-1.jpg（1:1正方形）

### 交互库（纯CSS，每次选择不同实现）

见上文详细的交互实现方式

### 视觉要求

- 色彩搭配：每个剧场使用统一颜色系（高亮/对比/暗黑/柔和/手机壁纸）
- 装饰符号：emoji适量点缀
- 字体应用：引入Google Fonts（每次选择不同字体）
- 细节加工：选择2-3种方式营造真实感

### 图片使用

需要图片时选择一种方式：
- **方式A**：纯CSS装饰 + "边框/阴影"模拟图片占位
- **方式B**：AI图片API - `https://image.pollinations.ai/prompt/关键词`

### 每次生成：确保独特性！

- 确认主题选择（A-F类）
- 确认配色（切换不同风格）
- 确认字体（使用2种不同字体）
- 确认交互（使用不同CSS特性）
- 确认是否恢复原始状态或可持续互动

### 创意要求

- 风格多变：严肃、活泼、复古、现代等
- 装饰恰当：emoji（📝✨🎨💡⭐）适量使用
- 字体效果：渐变、描边、阴影等
- 交互流畅：悬停、点击、滚动等效果自然

### 禁止事项

❌ 禁止在HTML中嵌入任何图片URL（除了 https://i.postimg.cc/ 或 https://image.pollinations.ai/）
❌ 禁止使用 JavaScript
❌ 禁止重复相同的主题、结构、配色、字体

根据以上规范，结合当前对话历史生成创意内容。
```

---

## 使用建议

### 触发时机
1. 用户明确要求"生成小剧场"
2. 群聊氛围活跃，适合展示创意内容
3. 讨论话题适合用视觉化方式呈现

### 最佳实践
- 首次使用时向用户说明小剧场功能
- 根据聊天内容自动推荐合适的主题
- 每次生成后询问用户是否满意，可调整风格
- 在群聊中，让不同成员创建不同风格的剧场
