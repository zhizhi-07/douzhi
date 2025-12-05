# 你画我猜游戏重构 - 设计文档

## 概述

重构现有的你画我猜游戏系统，简化游戏流程，实现自动答案判断，提供更流畅的用户体验。核心改进是移除手动确认机制，让系统自动检测AI回复中的答案并判断对错。

## 架构

### 系统组件

```
┌─────────────────────────────────────────────────────────┐
│                    ChatDetail 页面                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │           useTacitGame Hook (状态管理)            │  │
│  │  - 游戏状态                                        │  │
│  │  - 题目管理                                        │  │
│  │  - 答案判断逻辑                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ TacitGame    │  │ TacitTopic   │  │ TacitDraw    │  │
│  │ Select       │  │ Card         │  │ Panel        │  │
│  │ (选择界面)    │  │ (题目卡片)    │  │ (画板)        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Answer Matcher (答案匹配器)               │   │
│  │  - 模糊匹配                                       │   │
│  │  - 同义词支持                                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 数据流

```
用户选择游戏 → 生成题目 → 用户创作 → 发送消息 → 触发AI
                                                    ↓
游戏结束 ← 发送成功消息 ← 答案匹配 ← AI回复
         ↓ (猜错)
    保持游戏状态，允许继续尝试
```

## 组件和接口

### 1. useTacitGame Hook

**职责**: 管理游戏状态和逻辑

**状态**:
```typescript
interface TacitGameState {
  showGameSelect: boolean      // 是否显示游戏选择界面
  gameType: 'draw' | 'act' | null  // 当前游戏类型
  topic: string                // 当前题目
  showPanel: boolean           // 是否显示画板/输入面板
  canvasDataRef: React.MutableRefObject<string | null>  // 画布数据
  descriptionRef: React.MutableRefObject<string>  // 描述文本
}
```

**核心方法**:
```typescript
interface TacitGameActions {
  // 游戏控制
  openGameSelect: () => void
  closeGameSelect: () => void
  startGame: (type: 'draw' | 'act') => void
  endGame: () => void
  changeTopic: () => void
  
  // 面板控制
  openPanel: () => void
  closePanel: () => void
  
  // 发送内容
  sendDrawing: (imageData: string) => void
  sendDescription: (description: string) => void
  
  // 答案判断（新增）
  checkAnswer: (aiResponse: string) => boolean
}
```

### 2. Answer Matcher 模块

**职责**: 判断AI回复是否包含正确答案

**接口**:
```typescript
interface AnswerMatcher {
  /**
   * 检查AI回复是否包含正确答案
   * @param aiResponse AI的回复文本
   * @param correctAnswer 正确答案
   * @returns 是否匹配
   */
  isAnswerCorrect(aiResponse: string, correctAnswer: string): boolean
  
  /**
   * 标准化文本（去除标点、空格、转小写）
   * @param text 原始文本
   * @returns 标准化后的文本
   */
  normalizeText(text: string): string
  
  /**
   * 获取同义词列表
   * @param word 原词
   * @returns 同义词数组
   */
  getSynonyms(word: string): string[]
}
```

**同义词映射**:
```typescript
const SYNONYMS_MAP: Record<string, string[]> = {
  '汽车': ['车', '小汽车', '轿车'],
  '太阳': ['日', '太阳公公'],
  '月亮': ['月', '月球'],
  '房子': ['房', '屋子', '房屋'],
  '跑步': ['跑', '奔跑'],
  '做饭': ['烹饪', '煮饭', '炒菜'],
  // ... 更多同义词
}
```

### 3. TacitTopicCard 组件

**职责**: 显示当前题目和游戏控制按钮

**Props**:
```typescript
interface TacitTopicCardProps {
  topic: string
  gameType: 'draw' | 'act'
  onChangeTopic: () => void
  onClose: () => void
  onOpenPanel: () => void
  isPanelOpen: boolean
  isAiThinking?: boolean  // 新增：AI是否正在思考
}
```

**UI变化**:
- 移除"猜对了"按钮
- 添加"AI正在猜测..."状态提示
- 简化按钮布局

### 4. TacitDrawPanel 组件

**职责**: 提供绘画界面

**Props**:
```typescript
interface TacitDrawPanelProps {
  onSendImage: (imageData: string) => void
  onClose: () => void
  canvasDataRef: React.MutableRefObject<string | null>
}
```

**功能**:
- 画布绘制
- 清空画布
- 保存/恢复画布状态
- 发送画作

### 5. TacitActPanel 组件

**职责**: 提供文字描述界面

**Props**:
```typescript
interface TacitActPanelProps {
  onSendDescription: (description: string) => void
  onClose: () => void
  descriptionRef: React.MutableRefObject<string>
}
```

## 数据模型

### 游戏消息格式

**你画我猜消息**:
```typescript
{
  id: number
  type: 'sent'
  messageType: 'photo'
  content: '[你画我猜]'  // 用户可见，不显示答案
  aiReadableContent: '这是一幅画，猜猜画的是什么？'  // AI可见
  photoBase64: string
  photoDescription: '你画我猜游戏'
  time: string
  timestamp: number
}
```

**你演我猜消息**:
```typescript
{
  id: number
  type: 'sent'
  messageType: 'text'
  content: string  // 用户的描述
  aiReadableContent: `根据这个描述猜猜是什么动作：${description}`
  time: string
  timestamp: number
}
```

**成功消息**:
```typescript
{
  id: number
  type: 'sent'
  messageType: 'system'
  content: `🎉 ${gameTypeName}成功！答案是「${topic}」`
  time: string
  timestamp: number
}
```

## 核心逻辑

### 答案判断算法

```typescript
function isAnswerCorrect(aiResponse: string, correctAnswer: string): boolean {
  // 1. 标准化文本
  const normalizedResponse = normalizeText(aiResponse)
  const normalizedAnswer = normalizeText(correctAnswer)
  
  // 2. 直接匹配
  if (normalizedResponse.includes(normalizedAnswer)) {
    return true
  }
  
  // 3. 同义词匹配
  const synonyms = getSynonyms(correctAnswer)
  for (const synonym of synonyms) {
    if (normalizedResponse.includes(normalizeText(synonym))) {
      return true
    }
  }
  
  return false
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[，。！？、；：""''（）《》【】\s,\.!?;:()"'<>\[\]]/g, '')
}
```

### 游戏流程

**启动游戏**:
```typescript
function startGame(type: 'draw' | 'act') {
  setGameType(type)
  setTopic(getRandomTopic(type))
  setShowPanel(true)
  setShowGameSelect(false)
  // 清理之前的数据
  canvasDataRef.current = null
  descriptionRef.current = ''
}
```

**发送画作**:
```typescript
function sendDrawing(imageData: string) {
  // 1. 创建消息
  const message = createDrawingMessage(imageData, topic)
  
  // 2. 保存消息
  setMessages(prev => [...prev, message])
  saveMessages(characterId, [...messages, message])
  
  // 3. 关闭画板但保留题目卡片
  setShowPanel(false)
  
  // 4. 触发AI回复（由ChatDetail的现有逻辑处理）
  // AI回复后会触发checkAnswer
}
```

**检查答案**:
```typescript
function checkAnswer(aiResponse: string) {
  if (!topic || !gameType) return
  
  // 判断答案
  if (isAnswerCorrect(aiResponse, topic)) {
    // 猜对了，发送成功消息
    const successMessage = createSuccessMessage(gameType, topic)
    setMessages(prev => [...prev, successMessage])
    saveMessages(characterId, [...messages, successMessage])
    
    // 结束游戏
    endGame()
  }
  // 猜错了，不做任何操作，保持游戏状态
}
```

**结束游戏**:
```typescript
function endGame() {
  setGameType(null)
  setTopic('')
  setShowPanel(false)
  canvasDataRef.current = null
  descriptionRef.current = ''
}
```

### AI回复监听

在 `ChatDetail` 组件中，需要监听AI的新回复：

```typescript
useEffect(() => {
  // 当有新的AI回复时
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.type === 'received' && gameType && topic) {
    // 检查答案
    checkAnswer(lastMessage.content)
  }
}, [messages, gameType, topic])
```

## 错误处理

### 1. 画布为空
- **场景**: 用户未绘画就点击发送
- **处理**: 禁用发送按钮，直到用户开始绘画

### 2. 描述为空
- **场景**: 用户未输入描述就点击发送
- **处理**: 禁用发送按钮，直到用户输入内容

### 3. AI回复异常
- **场景**: AI回复为空或出错
- **处理**: 不进行答案判断，保持游戏状态，允许用户继续尝试

### 4. 题目生成失败
- **场景**: 题库为空或随机函数出错
- **处理**: 使用默认题目"猫"或"跑步"

## 测试策略

### 单元测试

**Answer Matcher 测试**:
```typescript
describe('AnswerMatcher', () => {
  test('直接匹配 - 完全相同', () => {
    expect(isAnswerCorrect('我猜是猫', '猫')).toBe(true)
  })
  
  test('直接匹配 - 包含答案', () => {
    expect(isAnswerCorrect('这应该是一只猫吧', '猫')).toBe(true)
  })
  
  test('忽略标点符号', () => {
    expect(isAnswerCorrect('我猜是：猫！', '猫')).toBe(true)
  })
  
  test('忽略空格', () => {
    expect(isAnswerCorrect('我猜是 汽 车', '汽车')).toBe(true)
  })
  
  test('同义词匹配', () => {
    expect(isAnswerCorrect('这是一辆车', '汽车')).toBe(true)
  })
  
  test('错误答案', () => {
    expect(isAnswerCorrect('这是一只狗', '猫')).toBe(false)
  })
})
```

**游戏流程测试**:
```typescript
describe('useTacitGame', () => {
  test('启动游戏应该生成题目', () => {
    const { result } = renderHook(() => useTacitGame(props))
    act(() => result.current.startGame('draw'))
    expect(result.current.topic).toBeTruthy()
    expect(result.current.gameType).toBe('draw')
  })
  
  test('换题应该生成新题目', () => {
    const { result } = renderHook(() => useTacitGame(props))
    act(() => result.current.startGame('draw'))
    const oldTopic = result.current.topic
    act(() => result.current.changeTopic())
    expect(result.current.topic).not.toBe(oldTopic)
  })
  
  test('发送画作应该关闭画板', () => {
    const { result } = renderHook(() => useTacitGame(props))
    act(() => result.current.startGame('draw'))
    act(() => result.current.sendDrawing('data:image/png;base64,...'))
    expect(result.current.showPanel).toBe(false)
  })
})
```

### 集成测试

1. **完整游戏流程测试**:
   - 启动游戏 → 画画 → 发送 → AI猜对 → 显示成功消息 → 游戏结束

2. **多轮尝试测试**:
   - 启动游戏 → 画画 → 发送 → AI猜错 → 继续画 → 发送 → AI猜对 → 游戏结束

3. **画板状态持久化测试**:
   - 画画 → 关闭画板 → 重新打开 → 验证画布内容恢复

### 用户体验测试

1. 测试AI猜测的准确性（通过不同质量的画作）
2. 测试答案匹配的准确性（各种表达方式）
3. 测试游戏流程的流畅性（无卡顿、无需手动确认）

## 性能考虑

1. **答案判断**: 在AI回复后立即执行，使用简单的字符串匹配，性能开销可忽略
2. **画布保存**: 使用ref存储，避免不必要的重渲染
3. **同义词查找**: 使用Map数据结构，O(1)查找时间

## 安全考虑

1. **输入验证**: 限制描述文本长度（50字符）
2. **XSS防护**: 所有用户输入在显示前进行转义
3. **数据清理**: 游戏结束时清理所有临时数据

## 迁移计划

### 向后兼容

- 保持现有的消息格式
- 保持现有的组件接口
- 仅修改内部逻辑

### 迁移步骤

1. 创建新的 `answerMatcher.ts` 工具模块
2. 修改 `useTacitGame.ts` Hook，添加答案判断逻辑
3. 修改 `TacitTopicCard` 组件，移除"猜对了"按钮
4. 简化AI提示词
5. 在 `ChatDetail` 中添加AI回复监听
6. 测试完整流程
7. 清理旧代码

## 未来扩展

1. **难度等级**: 简单/中等/困难题目
2. **计时功能**: 限时猜测增加挑战
3. **提示系统**: AI猜错后给出提示
4. **多人模式**: 支持多个AI角色同时猜测
5. **题目自定义**: 允许用户添加自己的题目
6. **统计功能**: 记录游戏胜率、用时等数据
