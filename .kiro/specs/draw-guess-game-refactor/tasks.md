# 你画我猜游戏重构 - 实现任务

- [ ] 1. 创建答案匹配工具模块
  - 创建 `src/utils/answerMatcher.ts` 文件
  - 实现文本标准化函数 `normalizeText`
  - 实现同义词映射 `SYNONYMS_MAP`
  - 实现答案判断函数 `isAnswerCorrect`
  - 导出公共接口
  - _需求: 4.1, 4.5, 4.6_

- [ ]* 1.1 为答案匹配器编写单元测试
  - 测试直接匹配（完全相同、包含答案）
  - 测试标点符号和空格忽略
  - 测试同义词匹配
  - 测试错误答案返回false
  - _需求: 4.1, 4.5, 4.6_

- [ ] 2. 重构 useTacitGame Hook
  - 移除 `hasSent` 和 `hasAiGuessed` 状态
  - 移除 `confirmCorrect` 方法
  - 添加 `checkAnswer` 方法，集成答案匹配逻辑
  - 修改 `sendDrawing` 方法，简化AI提示词
  - 修改 `sendDescription` 方法，简化AI提示词
  - 在答案正确时自动发送成功消息并结束游戏
  - _需求: 4.1, 4.2, 4.3, 4.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 3. 更新 TacitTopicCard 组件
  - 移除 `onConfirmCorrect` prop
  - 移除 `hasSent` prop
  - 添加 `isAiThinking` prop
  - 移除"猜对了"按钮的UI代码
  - 添加"AI正在猜测..."状态提示
  - 简化按钮布局
  - _需求: 5.3, 5.4_

- [ ] 4. 在 ChatDetail 中集成答案判断
  - 在 `ChatDetail.tsx` 中导入 `checkAnswer` 方法
  - 添加 `useEffect` 监听AI新回复
  - 当检测到AI回复且游戏进行中时，调用 `checkAnswer`
  - 传递 `isAiTyping` 状态到 `TacitTopicCard`
  - _需求: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. 测试完整游戏流程
  - 测试"你画我猜"：启动 → 画画 → 发送 → AI猜对 → 自动结束
  - 测试"你演我猜"：启动 → 描述 → 发送 → AI猜对 → 自动结束
  - 测试多轮尝试：AI猜错 → 继续画 → 再次发送 → AI猜对
  - 测试画板状态持久化：画画 → 关闭 → 重新打开 → 验证恢复
  - 测试换题功能：换题 → 验证画布清空
  - 测试手动关闭：游戏中途点击关闭 → 验证状态清理
  - _需求: 1.1-8.5_

- [ ] 6. 清理旧代码和注释
  - 移除 `hasSent` 相关的所有代码
  - 移除 `hasAiGuessed` 相关的所有代码
  - 移除 `confirmCorrect` 相关的所有代码
  - 更新相关注释，反映新的游戏流程
  - _需求: 所有_
