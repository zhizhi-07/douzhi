# 音效系统简化 - 统一使用系统点击音效

## 问题描述
用户反馈：点击选择功能的抽屉加号音效太吵了，希望统一使用简单的系统点击音效。

## 修改内容

### 1. ChatDetail.tsx
**修改位置**：
- 第43行：导入语句
- 第1256行：加号按钮点击音效
- 第1346行：菜单关闭音效

**修改内容**：
```typescript
// 之前
import { playLoadMoreSound, playMenuOpenSound, playCloseSound } from '../utils/soundManager'

onClick={() => {
  playMenuOpenSound() // 🎵 播放菜单音效
  addMenu.setShowAddMenu(true)
}}

onClose={() => {
  playCloseSound() // 🎵 关闭时播放音效
  addMenu.setShowAddMenu(false)
}}

// 之后
import { playLoadMoreSound, playSystemSound } from '../utils/soundManager'

onClick={() => {
  playSystemSound() // 🎵 统一使用系统点击音效
  addMenu.setShowAddMenu(true)
}}

onClose={() => {
  playSystemSound() // 🎵 统一使用系统点击音效
  addMenu.setShowAddMenu(false)
}}
```

### 2. AddMenu.tsx
**修改位置**：
- 第173行：遮罩层点击
- 第206行：菜单项点击

**已有正确实现**：
```typescript
// 遮罩层关闭
onClick={() => {
  playSystemSound() // 🎵 统一使用通用点击音效
  onClose()
}}

// 菜单项选择
onClick={() => {
  playSystemSound() // 🎵 统一使用通用点击音效
  item.onClick()
  onClose()
}}
```

### 3. soundManager.ts
**删除的函数**：
- `playClickBrightSound()` - 明亮点击音效
- `playClickPopSound()` - 弹出点击音效
- `playClickTapSound()` - 轻敲点击音效
- `playMenuOpenSound()` - 菜单打开音效
- `playMenuCloseSound()` - 菜单关闭音效
- `playMenuSelectSound()` - 菜单选择音效
- `playCloseSound()` - 通用关闭音效
- `playModalOpenSound()` - 模态框打开音效

**保留的核心函数**：
- `playSystemSound()` - 统一的系统点击音效（音量0.08，非常柔和）
- `playMessageSendSound()` - 消息发送音效
- `playMessageNotifySound()` - 消息通知音效
- 其他特殊场景音效（长按、加载、成功、错误等）

## 效果
✅ **所有抽屉、菜单、按钮点击都使用统一的系统点击音效**
✅ **音量柔和（0.08），不再吵闹**
✅ **代码更简洁，减少了不必要的音效函数**
✅ **用户体验更一致**

## 音效使用规范
- **通用点击**：使用 `playSystemSound()`
- **消息发送**：使用 `playMessageSendSound()`
- **消息通知**：使用 `playMessageNotifySound()`
- **特殊场景**：使用对应的专用音效函数

## 测试建议
1. 点击加号按钮打开菜单 - 应该听到柔和的系统点击音效
2. 点击菜单项选择功能 - 应该听到柔和的系统点击音效
3. 点击遮罩层关闭菜单 - 应该听到柔和的系统点击音效
4. 所有音效应该音量一致，不会太吵
