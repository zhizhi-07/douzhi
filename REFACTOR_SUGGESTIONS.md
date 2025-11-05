# 代码重构建议

## 已完成的优化 ✅

### 1. 创建消息工厂 (`src/utils/messageFactory.ts`)
**问题：** 重复的消息创建代码散布在各个文件中
**解决：** 统一消息创建逻辑到工厂函数

**使用示例：**
```typescript
// 修复前
const systemMsg = {
  id: Date.now(),
  type: 'system',
  content: '对方已接受亲密付',
  time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  timestamp: Date.now(),
  messageType: 'system'
}

// 修复后
import { createSystemMessage } from '../../../utils/messageFactory'
const systemMsg = createSystemMessage('对方已接受亲密付')
```

---

## 需要进一步优化的部分 🔄

### 2. 指令处理器模块化

**当前问题：**
- `commandHandlers.ts` 文件过长 (826行)
- 所有指令处理器在一个文件中

**建议：** 按功能拆分为独立文件
```
src/pages/ChatDetail/hooks/commandHandlers/
├── index.ts           # 导出所有处理器
├── transfer.ts        # 转账相关指令
├── intimatePay.ts     # 亲密付相关指令
├── coupleSpace.ts     # 情侣空间相关指令
├── media.ts           # 语音、照片、位置等
├── videoCall.ts       # 视频通话指令
└── quote.ts           # 引用指令
```

### 3. 提取重复的系统提示文本

**当前问题：**
- 系统提示文本硬编码在各处
- 不利于国际化和统一修改

**建议：** 创建 `src/constants/messages.ts`
```typescript
export const SYSTEM_MESSAGES = {
  INTIMATE_PAY: {
    ACCEPTED: '对方已接受亲密付',
    REJECTED: '对方已拒绝亲密付',
    USED: (characterName: string, recipient: string, amount: number) => 
      `💳 ${characterName} 的亲密付被使用了\n给 ${recipient} 转账 ¥${amount.toFixed(2)}`,
    INSUFFICIENT: '亲密付额度不足'
  },
  TRANSFER: {
    RECEIVED: (amount: number) => `已收款¥${amount.toFixed(2)}`,
    REJECTED: '你已退还转账',
    INSUFFICIENT: '余额不足，无法转账'
  },
  COUPLE_SPACE: {
    INVITE_SENT: (name: string) => `${name} 尝试邀请你建立情侣空间`,
    ALREADY_EXISTS: (name: string) => `但你已经和 ${name} 建立了情侣空间`,
    ALREADY_PENDING: (name: string) => `但你已经收到 ${name} 的邀请`
  }
}
```

### 4. 统一API错误处理

**当前问题：**
- 错误处理逻辑分散
- try-catch重复代码多

**建议：** 创建统一错误处理中间件
```typescript
// src/utils/errorHandler.ts
export class ApiErrorHandler {
  static handle(error: unknown, context: string): string {
    console.error(`[${context}] 错误:`, error)
    
    if (error instanceof ChatApiError) {
      return this.getChatApiErrorMessage(error)
    }
    
    if (error instanceof NetworkError) {
      return '网络连接失败，请检查网络'
    }
    
    return '操作失败，请稍后重试'
  }
  
  private static getChatApiErrorMessage(error: ChatApiError): string {
    const ERROR_MESSAGES: Record<string, string> = {
      'NO_API_CONFIG': '请先配置API',
      'INVALID_API_KEY': 'API密钥无效',
      'RATE_LIMIT': '请求过于频繁，请稍后再试'
    }
    
    return ERROR_MESSAGES[error.code] || error.message
  }
}
```

### 5. 钱包操作事务化

**当前问题：**
- 钱包操作没有事务保证
- 可能出现数据不一致

**建议：** 创建钱包事务管理器
```typescript
// src/utils/walletTransaction.ts
export class WalletTransaction {
  private operations: Array<() => void> = []
  private rollbacks: Array<() => void> = []
  
  addOperation(execute: () => void, rollback: () => void) {
    this.operations.push(execute)
    this.rollbacks.push(rollback)
  }
  
  async commit(): Promise<boolean> {
    try {
      for (const operation of this.operations) {
        operation()
      }
      return true
    } catch (error) {
      console.error('事务失败，开始回滚:', error)
      for (const rollback of this.rollbacks) {
        try {
          rollback()
        } catch (rollbackError) {
          console.error('回滚失败:', rollbackError)
        }
      }
      return false
    }
  }
}

// 使用示例
const transaction = new WalletTransaction()
transaction.addOperation(
  () => deductIntimatePayAmount(name, amount),
  () => refundIntimatePayAmount(name, amount)
)
transaction.addOperation(
  () => addNotificationToChat(id, content),
  () => removeNotificationFromChat(id)
)
await transaction.commit()
```

### 6. 类型定义优化

**当前问题：**
- 有些类型定义过于宽松 (any)
- 缺少严格的类型检查

**建议：** 加强类型定义
```typescript
// src/types/wallet.ts
export interface IntimatePayTransaction {
  readonly id: string
  readonly fromCharacterId: string
  readonly toCharacterId: string
  readonly amount: number
  readonly timestamp: number
  readonly type: 'deduct' | 'refund'
}

export interface WalletBalance {
  readonly total: number
  readonly available: number
  readonly frozen: number
}

// 使用类型守卫
export function isIntimatePayRelation(obj: any): obj is IntimatePayRelation {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.characterId === 'string' &&
    typeof obj.monthlyLimit === 'number' &&
    ['user_to_character', 'character_to_user'].includes(obj.type)
  )
}
```

### 7. 配置集中管理

**当前问题：**
- 魔法数字散布在代码中
- 配置项不易修改

**建议：** 创建配置中心
```typescript
// src/config/app.config.ts
export const APP_CONFIG = {
  MESSAGE: {
    MAX_LENGTH: 5000,
    HISTORY_LIMIT: 50,
    AUTO_SAVE_DELAY: 500
  },
  VIDEO_CALL: {
    AI_FIRST_SPEAK_DELAY: 1500,
    CONNECTION_TIMEOUT: 30000,
    MAX_DURATION: 3600
  },
  INTIMATE_PAY: {
    MIN_AMOUNT: 0.01,
    MAX_MONTHLY_LIMIT: 100000,
    RESET_DAY: 1  // 每月1号重置
  },
  WALLET: {
    INITIAL_BALANCE: 10000,
    MIN_TRANSFER: 0.01,
    MAX_TRANSFER: 99999.99
  }
} as const
```

### 8. 日志系统优化

**当前问题：**
- console.log 散布各处
- 生产环境也会输出调试日志
- 缺少日志级别

**建议：** 创建统一日志系统
```typescript
// src/utils/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private static level: LogLevel = 
    process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
  
  static debug(message: string, data?: any) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`🔍 [DEBUG] ${message}`, data || '')
    }
  }
  
  static info(message: string, data?: any) {
    if (this.level <= LogLevel.INFO) {
      console.log(`ℹ️ [INFO] ${message}`, data || '')
    }
  }
  
  static warn(message: string, data?: any) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, data || '')
    }
  }
  
  static error(message: string, error?: any) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`, error || '')
    }
  }
}

export default Logger
```

---

## 性能优化建议 ⚡

### 1. 消息列表虚拟滚动
**问题：** 大量消息时渲染性能下降
**解决：** 使用 react-window 或 react-virtualized

### 2. 图片懒加载
**问题：** 照片消息全部加载影响性能
**解决：** 使用 Intersection Observer API

### 3. LocalStorage操作优化
**问题：** 频繁读写localStorage
**解决：** 
- 使用内存缓存
- 批量写入
- 使用IndexedDB存储大数据

---

## 测试覆盖建议 🧪

### 1. 单元测试
```typescript
// messageFactory.test.ts
describe('createSystemMessage', () => {
  it('应该创建系统消息', () => {
    const msg = createSystemMessage('测试消息')
    expect(msg.type).toBe('system')
    expect(msg.content).toBe('测试消息')
    expect(msg.messageType).toBe('system')
  })
})
```

### 2. 集成测试
- 转账流程测试
- 亲密付流程测试
- 情侣空间流程测试

### 3. E2E测试
- 完整聊天流程
- 视频通话流程
- 支付流程

---

## 优先级排序 📊

### 高优先级 (P0)
1. ✅ **创建消息工厂** - 已完成
2. **统一错误处理** - 影响用户体验
3. **配置集中管理** - 便于维护

### 中优先级 (P1)
4. **指令处理器模块化** - 提升可读性
5. **日志系统优化** - 便于调试
6. **类型定义优化** - 提升代码质量

### 低优先级 (P2)
7. **钱包事务化** - 增强数据一致性
8. **性能优化** - 优化用户体验
9. **测试覆盖** - 保证代码质量

---

## 下一步行动 🚀

### 立即可做：
1. ✅ 使用消息工厂替换重复代码
2. 创建系统消息常量文件
3. 优化日志输出

### 短期计划（1-2周）：
1. 拆分commandHandlers文件
2. 统一错误处理
3. 添加基础单元测试

### 长期规划（1个月+）：
1. 完整的测试覆盖
2. 性能优化
3. 架构升级（考虑状态管理库）
