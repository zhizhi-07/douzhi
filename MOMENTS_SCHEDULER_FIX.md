# 朋友圈AI动作调度器修复说明

## 问题描述

朋友圈AI导演成功编排场景后，使用`setTimeout`来延迟执行动作（点赞、评论、私聊）。但在等待期间如果页面刷新或HMR热更新，定时器会被清除，导致动作永远不会执行。

### 具体表现

1. ✅ AI导演成功编排场景（例如：方亦楷2.0在245秒后评论）
2. ❌ 等待期间页面HMR刷新，清除所有setTimeout定时器
3. ❌ 动作从未执行（控制台没有"▶️ 执行动作"日志）
4. ❌ 朋友圈没有显示任何互动

## 解决方案

### 1. 创建持久化动作调度器 (`actionScheduler.ts`)

**核心功能：**
- 将待执行的动作保存到`localStorage`
- 每秒检查是否有到期的动作需要执行
- 页面刷新后自动恢复待执行的动作

**关键API：**
```typescript
// 调度一个动作（替代setTimeout）
scheduleAction(action, moment, delaySeconds, characters, allActions)

// 启动调度器
startScheduler()

// 停止调度器
stopScheduler()

// 获取待执行动作数量
getPendingActionsCount()

// 清除所有待执行动作
clearAllScheduledActions()
```

### 2. 修改导演系统 (`director.ts`)

**变更：**
- ❌ 移除：直接使用`setTimeout`执行动作
- ✅ 新增：使用`scheduleAction`持久化调度动作
- ✅ 新增：导入`AIScene`类型和`apiService`

**核心代码：**
```typescript
// 旧方式（会丢失）
setTimeout(() => {
  executeAction(action, newMoment, characters, scene.actions)
}, delay)

// 新方式（持久化）
scheduleAction(action, newMoment, delay, characters, scene.actions)
```

### 3. App启动时初始化 (`App.tsx`)

**新增初始化代码：**
```typescript
// 初始化朋友圈AI动作调度器（恢复页面刷新前待执行的动作）
import('./utils/momentsAI/actionScheduler').then(({ startScheduler, getPendingActionsCount }) => {
  const pendingCount = getPendingActionsCount()
  if (pendingCount > 0) {
    console.log(`📋 发现 ${pendingCount} 个待执行的朋友圈动作，启动调度器...`)
    startScheduler()
  }
})
```

## 工作流程

### 用户发布朋友圈
1. 用户发布朋友圈（带图片/文字）
2. `triggerAIMomentsInteraction`被调用
3. AI导演分析并编排场景（例如：方亦楷245秒后评论）
4. **动作被保存到localStorage，不依赖内存定时器**

### 调度器运行
1. 每秒检查localStorage中的待执行动作
2. 发现到期动作（executeAt <= 当前时间）
3. 执行动作（点赞/评论/私聊）
4. 从localStorage中移除已执行的动作

### 页面刷新恢复
1. 页面刷新/HMR更新
2. `App.tsx`的useEffect检测到待执行动作
3. 自动启动调度器
4. 继续执行未完成的动作

## 优势

✅ **持久化**：动作保存在localStorage，页面刷新不会丢失  
✅ **自动恢复**：App启动时自动检测并恢复待执行动作  
✅ **可靠执行**：只要浏览器不关闭，动作就会被执行  
✅ **性能优化**：只在有待执行动作时运行调度器  
✅ **调试友好**：完整的控制台日志，方便追踪

## 测试步骤

1. 发布朋友圈（带图片）
2. 观察控制台：
   ```
   🎬 场景编排完成
   ⏰ 已调度动作: 方亦楷2.0 将在 245秒后评论
   ```
3. 刷新页面（或触发HMR）
4. 观察控制台：
   ```
   📋 发现 1 个待执行的朋友圈动作，启动调度器...
   🚀 启动朋友圈动作调度器
   ```
5. 等待延迟时间到期
6. 观察控制台和朋友圈：
   ```
   ⏰ 发现 1 个到期动作，开始执行...
   ▶️ 执行调度动作: 方亦楷2.0 评论
   ✅ 已执行 1 个动作
   ```

## 注意事项

- 调度器使用`localStorage`存储，容量有限（通常5-10MB）
- 建议延迟时间不要超过5分钟（避免用户关闭浏览器）
- 调度器每秒检查一次，执行精度为±1秒
- 可以通过`clearAllScheduledActions()`手动清除所有待执行动作

## 相关文件

- `src/utils/momentsAI/actionScheduler.ts` - 持久化调度器
- `src/utils/momentsAI/director.ts` - AI导演主控制器
- `src/utils/momentsAI/index.ts` - 模块导出
- `src/App.tsx` - 调度器初始化
