# 购物车购买与代付功能实现说明

## 功能概述

为在线商城添加了完整的购物车购买和代付功能，用户可以：
1. 将商品加入购物车
2. 在购物车中管理商品（修改数量、删除）
3. 结算购物车并发送给AI查看
4. 分享购物车请求AI代付
5. AI可以同意或拒绝代付请求
6. **待处理请求提示**：AI在每次回复时都能看到未处理的代付请求，不需要用户重新发起

## 新增文件

### 1. 页面组件
- **`src/pages/ShoppingCart.tsx`** - 购物车页面
  - 显示购物车商品列表
  - 支持选择商品、修改数量、删除商品
  - 结算功能：发送购物车卡片消息
  - 分享代付功能：发送代付请求消息
  - 购物车数据持久化到localStorage

### 2. 消息卡片组件
- **`src/components/ShoppingCartCard.tsx`** - 购物车卡片
  - 显示购物车商品列表
  - 显示总价、优惠、运费等信息
  - 精美的电商风格设计

- **`src/components/CartPaymentRequestCard.tsx`** - 购物车代付请求卡片
  - 显示代付请求的商品列表和总金额
  - 支持同意/拒绝代付按钮（AI收到时）
  - 显示代付状态（pending/paid/rejected）

## 修改的文件

### 1. 类型定义 (`src/types/chat.ts`)
- 扩展 `messageType` 添加：
  - `'shoppingCart'` - 购物车消息
  - `'cartPaymentRequest'` - 购物车代付请求
- 添加消息字段：
  ```typescript
  shoppingCart?: {
    items: Array<{
      id: string
      name: string
      price: number
      description: string
      quantity: number
      image?: string
    }>
    totalAmount: number
    discount?: number
    shipping?: number
    storeName?: string
  }
  cartPaymentRequest?: {
    cartId: string
    items: Array<{...}>
    totalAmount: number
    requesterName: string
    status: 'pending' | 'paid' | 'rejected'
    payerName?: string
    note?: string
  }
  ```

### 2. 在线商城页面 (`src/pages/OnlineShopping.tsx`)
- 添加购物车状态管理（localStorage持久化）
- 添加购物车图标按钮（显示商品数量徽章）
- 优化加入购物车逻辑（已存在商品则增加数量）
- 添加 `useEffect` 加载和保存购物车数据

### 3. 路由配置 (`src/App.tsx`)
- 添加购物车页面路由：`/chat/:id/shopping/cart`
- 导入 `ShoppingCart` 组件

### 4. 消息渲染器 (`src/pages/ChatDetail/components/SpecialMessageRenderer.tsx`)
- 导入新的卡片组件
- 添加购物车卡片渲染逻辑
- 添加购物车代付请求卡片渲染逻辑
- 添加代付回调函数参数

### 5. 代付处理器 (`src/pages/ChatDetail/hooks/usePaymentRequest.ts`)
- 添加 `acceptCartPayment` 函数 - AI同意购物车代付
- 添加 `rejectCartPayment` 函数 - AI拒绝购物车代付
- 自动生成系统消息通知代付结果
- 保存消息到IndexedDB

### 6. 聊天详情页 (`src/pages/ChatDetail.tsx`)
- 添加购物车和代付请求到特殊消息类型检查
- 传递 `onAcceptCartPayment` 和 `onRejectCartPayment` 回调

## 功能流程

### 购买流程
1. 用户在商城浏览商品
2. 点击"加入购物车"按钮
3. 商品添加到购物车（localStorage持久化）
4. 点击购物车图标进入购物车页面
5. 选择要购买的商品
6. 点击"结算"按钮
7. 生成购物车卡片消息发送给AI
8. 已结算的商品从购物车中移除

### 代付流程
1. 用户在购物车选择商品
2. 点击"分享代付"按钮
3. 生成代付请求消息发送给AI
4. AI收到代付请求卡片，显示商品列表和总金额
5. AI可以选择：
   - 点击"同意代付" → 状态变为 `paid`，生成系统消息
   - 点击"拒绝" → 状态变为 `rejected`，生成系统消息
6. 用户看到代付结果

## 数据存储

### localStorage
- **Key**: `shopping_cart_${chatId}`
- **Value**: `CartItem[]`
- **结构**:
  ```typescript
  {
    id: string
    name: string
    price: number
    description: string
    quantity: number
    image?: string
  }[]
  ```

### IndexedDB
- 购物车消息和代付请求消息通过 `saveMessages` 保存到IndexedDB
- 与其他聊天消息一起持久化

## UI设计特点

### 购物车页面
- 现代电商风格设计
- 商品卡片带选择框、数量控制、删除按钮
- 底部固定操作栏显示总价和按钮
- 全选/取消全选功能
- 空购物车状态提示

### 购物车卡片
- 渐变色头部（橙红色）
- 商品列表滚动显示
- 详细的价格明细（商品总额、优惠、运费）
- 精美的卡片阴影效果

### 代付请求卡片
- 渐变色头部（蓝紫色）
- 简洁的商品列表
- 明显的操作按钮
- 状态指示（等待确认/已代付/已拒绝）

## 技术亮点

1. **状态管理**: 使用localStorage实现购物车跨页面持久化
2. **类型安全**: 完整的TypeScript类型定义
3. **组件化**: 独立的卡片组件，易于维护
4. **用户体验**: 
   - 购物车数量徽章实时更新
   - 商品数量控制流畅
   - 代付状态清晰展示
5. **数据持久化**: 消息保存到IndexedDB，刷新不丢失

## 使用示例

### 用户操作
1. 访问 `/chat/123/shopping` 浏览商品
2. 点击"加入购物车"
3. 点击购物车图标（显示数量徽章）
4. 在购物车页面选择商品
5. 点击"分享代付"或"结算"

### AI响应
1. AI收到代付请求后，可以在聊天中看到代付请求卡片
2. AI可以通过指令响应：
   - 同意：`[购物车代付:同意]`
   - 拒绝：`[购物车代付:拒绝]`
3. **待处理请求提示**：
   - 即使AI没有立即处理，在后续的每次回复中，AI都会在系统提示词中看到：
     ```
     🛒 购物车代付处理（用户请求你代付购物车）：
     - 用户发了 1 个购物车代付请求：购物车(商品Ax1、商品Bx2) ¥299
     - 每个购物车代付请求你都需要单独回应：
       - 同意：[购物车代付:同意]
       - 拒绝：[购物车代付:拒绝]
     ```
   - 这样AI就不会忘记处理请求，用户也不需要重复发送

## 注意事项

1. 购物车数据按 `chatId` 隔离，不同聊天的购物车互不影响
2. 结算后商品会从购物车中移除
3. 代付请求发送后不会从购物车移除，方便再次操作
4. 所有金额计算保留两位小数
5. 商品图片使用emoji占位符（可扩展为真实图片URL）

## 未来扩展方向

1. 添加商品图片上传功能
2. 支持优惠券系统
3. 添加订单历史记录
4. 支持多人拼单
5. 集成真实支付接口
6. 添加物流跟踪功能
