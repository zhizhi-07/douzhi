# 加号菜单功能说明

## 📱 菜单展示

点击聊天输入框左侧的 **+** 按钮，会从底部滑出功能菜单。

---

## 🎯 功能列表

### 1. 🖼️ **相册**
- 功能：从手机相册选择图片发送
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectImage`

### 2. 📷 **拍照**
- 功能：打开相机拍照并发送
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectCamera`

### 3. 🧧 **红包**
- 功能：发送红包给对方
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectRedPacket`

### 4. 💰 **转账**
- 功能：转账给对方
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectTransfer`

### 5. 💳 **亲密付**
- 功能：设置亲密付额度
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectIntimatePay`

### 6. 📍 **位置**
- 功能：发送位置信息
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectLocation`

### 7. 🎤 **语音**
- 功能：发送语音消息
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectVoice`

### 8. 📹 **视频通话**
- 功能：发起视频通话
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectVideoCall`

### 9. 🎵 **一起听**
- 功能：邀请对方一起听音乐
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectMusicInvite`

### 10. 💑 **情侣空间**
- 功能：邀请对方开通情侣空间
- 状态：UI已完成，逻辑待实现
- 处理函数：`handleSelectCoupleSpace`
- 特殊说明：如果已激活情侣空间，此选项不显示

---

## 🎨 UI设计

### 菜单布局
```
┌─────────────────────────────┐
│     ────  (拖动条)          │
│                             │
│  选择功能                    │
│ ─────────────────────────── │
│                             │
│  🖼️    📷    🧧    💰       │
│  相册   拍照   红包   转账    │
│                             │
│  💳    📍    🎤    📹       │
│  亲密付  位置   语音  视频通话  │
│                             │
│  🎵    💑                   │
│  一起听  情侣空间              │
│                             │
│ ┌─────────────────────────┐ │
│ │        取消              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 布局特点
- **4列网格布局**：每行4个功能按钮
- **从底部滑出动画**：`slide-up` 动画
- **半透明遮罩层**：点击遮罩关闭菜单
- **拖动条**：顶部有拖动条提示
- **取消按钮**：底部有明显的取消按钮

---

## 💻 技术实现

### 组件结构
```
AddMenu.tsx (独立组件)
├── 遮罩层 (点击关闭)
├── 菜单面板
│   ├── 拖动条
│   ├── 标题
│   ├── 功能网格 (4列)
│   └── 取消按钮
└── 动画样式
```

### 状态管理
```typescript
// ChatDetail.tsx
const [showAddMenu, setShowAddMenu] = useState(false)

// 打开菜单
<button onClick={() => setShowAddMenu(true)}>+</button>

// 关闭菜单
<AddMenu 
  isOpen={showAddMenu}
  onClose={() => setShowAddMenu(false)}
  ...
/>
```

### Props接口
```typescript
interface AddMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: () => void
  onSelectCamera: () => void
  onSelectRedPacket: () => void
  onSelectTransfer: () => void
  onSelectIntimatePay: () => void
  onSelectCoupleSpaceInvite: () => void
  onSelectLocation: () => void
  onSelectVoice: () => void
  onSelectVideoCall: () => void
  onSelectMusicInvite: () => void
  hasCoupleSpaceActive?: boolean  // 是否已激活情侣空间
}
```

---

## 🔄 交互流程

```
1. 用户点击 + 按钮
   ↓
2. setShowAddMenu(true)
   ↓
3. 菜单从底部滑出（slide-up动画）
   ↓
4. 用户选择功能或点击取消
   ↓
5. 执行对应处理函数 (目前只有console.log)
   ↓
6. 自动关闭菜单 onClose()
```

---

## 📝 当前状态

### ✅ 已完成
- [x] AddMenu 组件创建
- [x] 10个功能按钮UI
- [x] 滑出动画效果
- [x] 遮罩层交互
- [x] 集成到 ChatDetail
- [x] 状态管理
- [x] 处理函数占位

### ⏳ 待实现
- [ ] 相册选择功能
- [ ] 拍照功能
- [ ] 红包功能
- [ ] 转账功能
- [ ] 亲密付功能
- [ ] 位置功能
- [ ] 语音功能
- [ ] 视频通话功能
- [ ] 一起听功能
- [ ] 情侣空间功能

---

## 🎯 下一步计划

按优先级实现各个功能的具体逻辑：

### 优先级1（核心功能）
1. 相册 - 图片上传和显示
2. 红包 - 红包发送和领取
3. 转账 - 转账逻辑

### 优先级2（社交功能）
4. 一起听 - 音乐分享
5. 情侣空间 - 情侣功能
6. 位置 - 位置分享

### 优先级3（扩展功能）
7. 语音 - 语音消息
8. 视频通话 - 通话功能
9. 亲密付 - 支付功能
10. 拍照 - 相机功能

---

## 🐛 调试信息

所有功能当前都会在控制台输出日志：
```javascript
console.log('选择相册')
console.log('拍照')
console.log('发红包')
// ... 等等
```

可以按 **F12** 打开开发者工具，点击功能按钮查看日志输出。

---

## 📚 文件清单

1. `src/components/AddMenu.tsx` - 加号菜单组件
2. `src/pages/ChatDetail.tsx` - 聊天页面（已集成）
3. `docs/ADD_MENU_FEATURES.md` - 本文档

---

**版本**: 1.4.0  
**创建日期**: 2025-11-04  
**功能**: 加号菜单UI完成，逻辑待实现
