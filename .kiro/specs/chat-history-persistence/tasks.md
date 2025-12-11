# Implementation Plan

- [ ] 1. 修复消息合并逻辑
  - 修改 `loadMoreMessages` 函数中的消息合并顺序
  - 确保新加载的历史消息添加到数组开头
  - 添加空数组保护，防止覆盖现有消息
  - _Requirements: 1.1, 1.2, 3.2_

- [ ] 1.1 编写消息合并的属性测试
  - **Property 1: 消息列表单调递增**
  - **Validates: Requirements 1.1, 1.2**

- [ ] 1.2 编写消息顺序的属性测试
  - **Property 2: 消息顺序保持一致**
  - **Validates: Requirements 1.3**

- [ ] 2. 添加加载状态保护机制
  - 在 `loadMoreMessages` 开始时检查 `isLoadingMessages` 状态
  - 如果正在加载，直接返回，防止并发加载
  - 添加详细的日志记录加载状态变化
  - _Requirements: 1.4, 4.2_

- [ ] 2.1 编写加载状态互斥的属性测试
  - **Property 6: 加载状态互斥**
  - **Validates: Requirements 1.4, 4.2**

- [ ] 3. 优化偏移量管理
  - 确保 `currentOffset` 在加载成功后正确递增
  - 验证偏移量计算逻辑：`newOffset = oldOffset + loadedCount`
  - 添加偏移量变化的日志
  - _Requirements: 2.2, 2.3_

- [ ] 3.1 编写偏移量递增的属性测试
  - **Property 3: 偏移量正确递增**
  - **Validates: Requirements 2.2, 2.3**

- [ ] 4. 修复页面可见性事件处理
  - 在 `handleVisibilityChange` 中添加 `isLoadingMessages` 检查
  - 如果正在分页加载，跳过全量重新加载
  - 保持现有的3秒延迟逻辑
  - _Requirements: 3.3_

- [ ] 5. 增强错误处理
  - 在 `loadMoreMessages` 中添加 try-catch 块
  - 捕获异常时保持现有消息列表不变
  - 显示用户友好的错误提示
  - 允许用户重试加载
  - _Requirements: 3.3, 3.4, 3.5, 4.5_

- [ ] 5.1 编写加载失败保护的属性测试
  - **Property 4: 加载失败不影响现有消息**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 6. 实现消息去重逻辑
  - 在消息合并后检查是否有重复的消息ID
  - 如果发现重复，保留时间戳较新的消息
  - 确保去重后消息顺序仍然正确
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.1 编写消息去重的属性测试
  - **Property 5: 消息ID唯一性**
  - **Validates: Requirements 8.1, 8.3**

- [ ] 7. 优化新消息处理
  - 确保发送新消息时不重置 `currentOffset`
  - 验证新消息添加到列表末尾
  - 确保新消息不触发历史消息重新加载
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 7.1 编写新消息不影响偏移量的属性测试
  - **Property 7: 新消息不影响偏移量**
  - **Validates: Requirements 6.2, 6.3**

- [ ] 8. 添加详细的调试日志
  - 在 `loadMoreMessages` 开始和结束时记录关键信息
  - 记录消息合并前后的列表长度
  - 记录偏移量的变化
  - 只在开发模式下输出日志
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8.1 编写单元测试验证日志输出
  - 测试日志包含必要的调试信息
  - 测试生产模式下不输出日志
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 9. 实现滚动位置保持
  - 在消息列表更新前记录当前滚动位置
  - 计算新增消息的高度
  - 更新后调整滚动位置以补偿新增内容
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9.1 编写滚动位置保持的集成测试
  - 测试加载更多后用户视角保持不变
  - 测试滚动调整不触发额外事件
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 10. Checkpoint - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

- [ ] 11. 优化加载状态UI反馈
  - 在 LoadMoreButton 上显示加载指示器
  - 加载时禁用按钮防止重复点击
  - 没有更多消息时隐藏按钮
  - 加载失败时显示错误消息和重试按钮
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 11.1 编写UI状态的单元测试
  - 测试加载时按钮被禁用
  - 测试没有更多消息时按钮隐藏
  - 测试错误状态显示
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 12. 集成测试和端到端验证
  - 测试完整的分页加载流程
  - 测试并发加载保护
  - 测试页面可见性事件处理
  - 测试新消息发送后的分页状态
  - _Requirements: 所有需求_

- [ ] 13. Final Checkpoint - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户
