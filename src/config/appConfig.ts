/**
 * 应用配置中心
 * 集中管理所有配置项和魔法数字
 */

/**
 * 消息相关配置
 */
export const MESSAGE_CONFIG = {
  /** 消息最大长度 */
  MAX_LENGTH: 5000,
  
  /** 聊天历史记录数量限制 */
  HISTORY_LIMIT: 50,
  
  /** 自动保存延迟 (毫秒) */
  AUTO_SAVE_DELAY: 500,
  
  /** 转账备注最大长度 */
  TRANSFER_REMARK_MAX_LENGTH: 20,
  
  /** AI打字间隔 (毫秒) */
  AI_TYPING_DELAY: 300,
} as const

/**
 * 视频通话配置
 */
export const VIDEO_CALL_CONFIG = {
  /** AI首次说话延迟 (毫秒) */
  AI_FIRST_SPEAK_DELAY: 1500,
  
  /** 连接超时时间 (毫秒) */
  CONNECTION_TIMEOUT: 30000,
  
  /** 最大通话时长 (秒) */
  MAX_DURATION: 3600,
  
  /** 开场旁白延迟 (毫秒) */
  NARRATOR_DELAY: 500,
} as const

/**
 * 亲密付配置
 */
export const INTIMATE_PAY_CONFIG = {
  /** 最小金额 */
  MIN_AMOUNT: 0.01,
  
  /** 最大月额度 */
  MAX_MONTHLY_LIMIT: 100000,
  
  /** 每月重置日期 */
  RESET_DAY: 1,
  
  /** 默认月额度 */
  DEFAULT_MONTHLY_LIMIT: 1000,
} as const

/**
 * 钱包配置
 */
export const WALLET_CONFIG = {
  /** 初始余额 */
  INITIAL_BALANCE: 10000,
  
  /** 最小转账金额 */
  MIN_TRANSFER: 0.01,
  
  /** 最大转账金额 */
  MAX_TRANSFER: 99999.99,
  
  /** 货币符号 */
  CURRENCY_SYMBOL: '¥',
  
  /** 小数位数 */
  DECIMAL_PLACES: 2,
} as const

/**
 * 情侣空间配置
 */
export const COUPLE_SPACE_CONFIG = {
  /** 最大相册照片数 */
  MAX_PHOTOS: 999,
  
  /** 最大留言数 */
  MAX_MESSAGES: 999,
  
  /** 最大纪念日数 */
  MAX_ANNIVERSARIES: 50,
  
  /** 照片描述最大长度 */
  PHOTO_DESC_MAX_LENGTH: 100,
  
  /** 留言最大长度 */
  MESSAGE_MAX_LENGTH: 500,
} as const

/**
 * LocalStorage 键名
 */
export const STORAGE_KEYS = {
  /** API 设置 */
  API_SETTINGS: 'api_settings',
  
  /** 角色列表 */
  CHARACTERS: 'characters',
  
  /** 聊天消息前缀 */
  CHAT_MESSAGE_PREFIX: 'chat_messages_',
  
  /** 钱包余额 */
  WALLET_BALANCE: 'wallet_balance',
  
  /** 钱包交易记录 */
  WALLET_TRANSACTIONS: 'wallet_transactions',
  
  /** 亲密付关系 */
  INTIMATE_PAY_RELATIONS: 'intimate_pay_relations',
  
  /** 情侣空间关系 */
  COUPLE_SPACE_RELATION: 'couple_space_relation',
  
  /** 情侣空间隐私 */
  COUPLE_SPACE_PRIVACY: 'couple_space_privacy',
  
  /** 情侣空间照片 */
  COUPLE_PHOTOS: 'couple_photos',
  
  /** 情侣空间留言 */
  COUPLE_MESSAGES: 'couple_messages',
  
  /** 情侣空间纪念日 */
  COUPLE_ANNIVERSARIES: 'couple_anniversaries',
  
  /** 用户信息 */
  USER_INFO: 'user_info',
  
  /** 未读消息 */
  UNREAD_MESSAGES: 'unread_messages',
} as const

/**
 * UI 配置
 */
export const UI_CONFIG = {
  /** 消息气泡最大宽度百分比 */
  MESSAGE_MAX_WIDTH: 70,
  
  /** 滚动到底部延迟 (毫秒) */
  SCROLL_DELAY: 100,
  
  /** Toast 显示时长 (毫秒) */
  TOAST_DURATION: 3000,
  
  /** 通知显示时长 (毫秒) */
  NOTIFICATION_DURATION: 5000,
} as const

/**
 * 时间格式配置
 */
export const TIME_FORMAT = {
  /** 消息时间格式 */
  MESSAGE_TIME: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
  
  /** 日期格式 */
  DATE: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
    weekday: 'long' as const,
  },
} as const

/**
 * 开发环境配置
 */
export const DEV_CONFIG = {
  /** 是否开发环境 */
  IS_DEV: import.meta.env.MODE === 'development',
  
  /** 是否启用调试日志 */
  ENABLE_DEBUG_LOG: import.meta.env.MODE === 'development',
  
  /** 是否启用性能监控 */
  ENABLE_PERFORMANCE: import.meta.env.MODE === 'development',
} as const

/**
 * API 配置
 */
export const API_CONFIG = {
  /** 请求超时时间 (毫秒) */
  TIMEOUT: 60000,
  
  /** 重试次数 */
  MAX_RETRIES: 3,
  
  /** 重试延迟 (毫秒) */
  RETRY_DELAY: 1000,
} as const
