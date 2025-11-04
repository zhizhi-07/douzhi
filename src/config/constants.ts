/**
 * 全局配置常量
 * 集中管理所有魔法数字和字符串，便于维护和修改
 */

/**
 * API配置
 */
export const API_CONFIG = {
  /** API请求超时时间（毫秒） */
  TIMEOUT_MS: 60000,
  
  /** 默认温度参数 */
  DEFAULT_TEMPERATURE: 0.7,
  
  /** 默认最大token数 */
  DEFAULT_MAX_TOKENS: 4000,
  
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  
  /** 重试延迟（毫秒） */
  RETRY_DELAY_MS: 1000
} as const

/**
 * 消息配置
 */
export const MESSAGE_CONFIG = {
  /** 发送给AI的最大历史消息数 */
  MAX_HISTORY_COUNT: 20,
  
  /** AI分段发送消息的延迟（毫秒） */
  MESSAGE_DELAY_MS: 300,
  
  /** 消息最大长度 */
  MAX_MESSAGE_LENGTH: 5000,
  
  /** 消息撤回时限（毫秒）- 2分钟 */
  RECALL_TIME_LIMIT_MS: 120000
} as const

/**
 * 存储键名
 */
export const STORAGE_KEYS = {
  /** 聊天列表 */
  CHAT_LIST: 'chat_list',
  
  /** 聊天消息前缀 */
  CHAT_MESSAGES_PREFIX: 'chat_messages_',
  
  /** API配置 */
  API_SETTINGS: 'apiSettings',
  
  /** 当前API ID */
  CURRENT_API_ID: 'currentApiId',
  
  /** API配置列表 */
  API_CONFIGS: 'apiConfigs',
  
  /** 角色列表 */
  CHARACTERS: 'characters',
  
  /** 当前用户 */
  CURRENT_USER: 'currentUser'
} as const

/**
 * UI配置
 */
export const UI_CONFIG = {
  /** 动画持续时间（毫秒） */
  ANIMATION_DURATION_MS: 300,
  
  /** 输入框最大高度（像素） */
  INPUT_MAX_HEIGHT: 200,
  
  /** 头像尺寸（像素） */
  AVATAR_SIZE: 40,
  
  /** 消息气泡最大宽度（百分比） */
  MESSAGE_MAX_WIDTH_PERCENT: 70
} as const

/**
 * 调试配置
 */
export const DEBUG_CONFIG = {
  /** 是否启用提示词日志 */
  ENABLE_PROMPT_LOG: true,
  
  /** 是否启用API日志 */
  ENABLE_API_LOG: true,
  
  /** 是否启用状态日志 */
  ENABLE_STATE_LOG: false,
  
  /** 是否启用性能监控 */
  ENABLE_PERFORMANCE_LOG: false
} as const

/**
 * 时间格式配置
 */
export const TIME_FORMAT = {
  /** 时间显示格式 */
  TIME: {
    hour: '2-digit' as const,
    minute: '2-digit' as const
  },
  
  /** 日期显示格式 */
  DATE: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
    weekday: 'long' as const
  },
  
  /** 语言 */
  LOCALE: 'zh-CN'
} as const

/**
 * SillyTavern变量
 */
export const ST_VARIABLES = {
  CHAR: '{{char}}',
  USER: '{{user}}',
  PERSONALITY: '{{personality}}',
  DESCRIPTION: '{{description}}'
} as const

/**
 * HTTP状态码
 */
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500
} as const

/**
 * 错误代码
 */
export const ERROR_CODES = {
  NO_API_SETTINGS: 'NO_API_SETTINGS',
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  API_ERROR: 'API_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

/**
 * 获取聊天消息的storage key
 */
export const getChatMessagesKey = (chatId: string): string => {
  return `${STORAGE_KEYS.CHAT_MESSAGES_PREFIX}${chatId}`
}

/**
 * 时间段判断
 */
export const getTimeOfDay = (hour: number = new Date().getHours()): string => {
  if (hour >= 0 && hour < 6) return '凌晨'
  if (hour >= 6 && hour < 9) return '早上'
  if (hour >= 9 && hour < 12) return '上午'
  if (hour >= 12 && hour < 14) return '中午'
  if (hour >= 14 && hour < 18) return '下午'
  if (hour >= 18 && hour < 22) return '晚上'
  return '深夜'
}
