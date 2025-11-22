# 气泡切图工具 - CSS 使用说明

## 📋 步骤

### 1️⃣ 生成 CSS
1. 打开工具：`http://localhost:8765/气泡切图工具.html`
2. 上传底图和贴纸
3. 调整所有参数
4. 点击"生成 CSS 代码"
5. 点击"复制 CSS"

### 2️⃣ 应用到项目

#### 方法一：通过气泡设置页面（推荐）✅

1. 进入聊天界面
2. 点击顶部"设置"图标
3. 选择"气泡样式"标签
4. 在"自定义 CSS"区域粘贴代码
5. 点击"应用CSS"

#### 方法二：直接修改 localStorage

打开浏览器控制台（F12），运行：

```javascript
// 获取当前聊天ID（在聊天页面运行）
const chatId = window.location.pathname.split('/').pop()

// 用户消息气泡CSS（复制工具生成的 .message-container.sent 部分）
const userCSS = `
.message-container.sent .message-bubble {
  /* 粘贴工具生成的CSS */
}

.message-container.sent .message-bubble::before {
  /* 粘贴工具生成的CSS */
}
`

// AI消息气泡CSS（复制工具生成的 .message-container.received 部分）
const aiCSS = `
.message-container.received .message-bubble {
  /* 粘贴工具生成的CSS */
}

.message-container.received .message-bubble::after {
  /* 粘贴工具生成的CSS */
}
`

// 保存
localStorage.setItem(`user_bubble_css_${chatId}`, userCSS)
localStorage.setItem(`ai_bubble_css_${chatId}`, aiCSS)

// 触发更新
window.dispatchEvent(new Event('bubbleStyleUpdate'))
window.location.reload() // 刷新页面
```

### 3️⃣ 检查效果

1. 刷新页面（Ctrl+R）
2. 查看聊天消息气泡
3. 如果还有问题，按F12打开控制台查看错误

## ⚠️ 重要说明

### CSS 已包含 !important

工具生成的CSS已经自动添加了 `!important`，会覆盖项目默认样式。

### 图片数据已嵌入

- 气泡底图：base64 数据直接在CSS中
- 伪元素贴纸：base64 数据直接在CSS中
- **无需额外上传图片文件！**

### 长短消息一致性

新版工具使用**固定像素距离边缘**定位，确保：
- 短消息：耳朵距离边缘 20px
- 长消息：耳朵还是距离边缘 20px ✅

### 如果效果还不对

1. 确认CSS已正确保存到localStorage
2. 确认已刷新页面
3. 检查控制台是否有CSS错误
4. 尝试清除浏览器缓存
5. 检查是否在正确的聊天ID下应用

## 🔧 调试技巧

### 查看当前应用的CSS

```javascript
const chatId = window.location.pathname.split('/').pop()
console.log('用户气泡CSS:', localStorage.getItem(`user_bubble_css_${chatId}`))
console.log('AI气泡CSS:', localStorage.getItem(`ai_bubble_css_${chatId}`))
```

### 清除自定义CSS

```javascript
const chatId = window.location.pathname.split('/').pop()
localStorage.removeItem(`user_bubble_css_${chatId}`)
localStorage.removeItem(`ai_bubble_css_${chatId}`)
window.location.reload()
```

## 📝 示例

完整的CSS示例（工具生成的格式）：

```css
/* 用户发送的消息（右侧） */
.message-container.sent .message-bubble {
  border-image-source: url('data:image/png;base64,...') !important;
  border-image-slice: 30 30 30 30 fill !important;
  padding: 12px !important;
  /* ... 更多样式 ... */
}

/* 用户消息贴纸装饰 */
.message-container.sent .message-bubble::before {
  content: '';
  position: absolute;
  top: -30px;
  right: 20px;  /* 固定距离右边缘20px */
  width: 60px;
  height: 40px;
  background-image: url('data:image/png;base64,...');
}
```
