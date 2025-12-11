# Implementation Plan

- [x] 1. 修复全局 body 样式中的底部 padding


  - 移除 `src/index.css` 中 body 元素的 `padding-bottom: env(safe-area-inset-bottom, 0)` 
  - 这是导致所有页面向上偏移的根本原因
  - _Requirements: 1.1, 1.4, 2.1, 2.2_



- [x] 2. 修正 Desktop 页面 dock 栏的 padding 计算
  - 修改 `src/pages/Desktop.tsx` 第 906 行的 paddingBottom 样式
  - 当前已使用 `calc(env(safe-area-inset-bottom, 0px) + 16px)`
  - _Requirements: 1.2, 1.3, 3.3, 3.4_

- [ ] 2.1 诊断并修复真正的底部空白问题
  - 检查Desktop组件的容器结构，确认是否有多余的padding或margin
  - 检查`.app-container`、外层div等容器的高度计算
  - 确保dock栏的父容器没有额外的底部间距
  - 使用浏览器开发工具检查实际渲染的padding值
  - _Requirements: 1.1, 1.4, 2.1_



- [ ] 3. 检查并修复其他页面的底部元素
- [ ] 3.1 检查 OfflineChat 页面底部输入框
  - 检查 `src/pages/OfflineChat.tsx` 中底部输入框的 padding 设置


  - 确保使用 `env(safe-area-inset-bottom, 0px)` 而不是固定值或 max() 函数
  - _Requirements: 1.2, 3.3_

- [ ] 3.2 检查 GroupChatDetail 页面底部
  - 检查 `src/pages/GroupChatDetail.tsx` 中底部元素的 padding 设置
  - 确保没有重复的底部 padding
  - _Requirements: 1.2, 3.3_

- [ ] 3.3 检查 Dock 组件（如果被其他页面使用）
  - 检查 `src/components/Dock.tsx` 的样式设置
  - 确保 padding 计算正确
  - _Requirements: 1.2, 3.3_

- [ ]* 4. 编写单元测试验证修复
- [ ]* 4.1 测试 Desktop 组件 dock 栏样式
  - **Property 1: Dock 栏样式配置正确性**
  - **Validates: Requirements 1.2**
  - 验证 dock 栏容器的 style 属性包含正确的 paddingBottom 值
  - 确保不包含 max() 函数或过大的固定值

- [ ]* 4.2 测试 dock 栏图标点击功能
  - **Property 2: 所有 dock 栏图标可点击**
  - **Validates: Requirements 3.2**
  - 模拟点击每个 dock 栏图标
  - 验证导航或回调函数正确执行

- [ ]* 4.3 测试 CSS 环境变量回退值
  - **Property 3: 安全区域 CSS 变量回退值**
  - **Validates: Requirements 3.4**
  - 验证所有使用 env(safe-area-inset-bottom) 的地方都有回退值

- [ ] 5. 在真实 iOS 设备上进行手动测试
  - 在 iPhone X 或更新机型上测试
  - 验证底部 dock 栏紧贴屏幕底部，没有过大空白
  - 验证所有页面底部没有异常留白
  - 测试竖屏和横屏模式
  - 测试 PWA 模式（添加到主屏幕）
  - 在非 iOS 设备上验证显示正常
  - _Requirements: 1.1, 1.3, 3.1, 3.2, 4.1, 4.3, 5.1, 5.2_
