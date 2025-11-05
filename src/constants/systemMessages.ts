/**
 * 系统消息文本常量
 * 统一管理所有系统提示文本，便于国际化和统一修改
 */

/**
 * 亲密付相关消息
 */
export const INTIMATE_PAY_MESSAGES = {
  ACCEPTED: '对方已接受亲密付',
  REJECTED: '对方已拒绝亲密付',
  ALREADY_EXISTS: '已经开通过了',
  INSUFFICIENT: '亲密付额度不足',
  
  // 使用通知
  USED: (characterName: string, recipient: string, amount: number, remark?: string) => 
    `💳 ${characterName} 的亲密付被使用了\n给 ${recipient} 转账 ¥${amount.toFixed(2)}${remark ? `\n备注：${remark}` : ''}`,
} as const

/**
 * 转账相关消息
 */
export const TRANSFER_MESSAGES = {
  RECEIVED: (amount: number) => `已收款¥${amount.toFixed(2)}`,
  REJECTED: '你已退还转账',
  INSUFFICIENT_BALANCE: '余额不足，无法转账',
  INVALID_AMOUNT: '请输入有效金额',
} as const

/**
 * 情侣空间相关消息
 */
export const COUPLE_SPACE_MESSAGES = {
  ACCEPTED: (name: string) => `${name} 接受了你的情侣空间邀请`,
  REJECTED: (name: string) => `${name} 拒绝了你的情侣空间邀请`,
  
  // 邀请失败原因
  INVITE_ALREADY_SENT: (name: string) => 
    `${name} 尝试邀请你建立情侣空间，但邀请已发送过，等待你的回复`,
  INVITE_ALREADY_PENDING: (name: string, existingName: string) => 
    `${name} 尝试邀请你建立情侣空间，但你已经收到 ${existingName} 的邀请`,
  INVITE_ALREADY_ACTIVE_SELF: (name: string) => 
    `${name} 尝试邀请你建立情侣空间，但你们已经建立了`,
  INVITE_ALREADY_ACTIVE_OTHER: (name: string, existingName: string) => 
    `${name} 尝试邀请你建立情侣空间，但你已经和 ${existingName} 建立了情侣空间`,
  INVITE_FAILED: '无法发送邀请',
} as const

/**
 * 视频通话相关消息
 */
export const VIDEO_CALL_MESSAGES = {
  REJECTED: '你拒绝了视频通话',
  CONNECTED: '视频通话已接通...',
  ENDED: (duration: number) => 
    `视频通话 ${Math.floor(duration / 60)}分${duration % 60}秒`,
  NETWORK_ERROR: '抱歉，网络有点卡...',
} as const

/**
 * API 错误消息
 */
export const API_ERROR_MESSAGES = {
  NO_CONFIG: '请先配置API',
  INVALID_KEY: 'API密钥无效',
  RATE_LIMIT: '请求过于频繁，请稍后再试',
  NETWORK_ERROR: '网络连接失败，请检查网络',
  GENERIC_ERROR: '操作失败，请稍后重试',
  AI_REPLY_FAILED: 'AI回复失败，请稍后重试',
} as const

/**
 * 验证错误消息
 */
export const VALIDATION_MESSAGES = {
  INVALID_AMOUNT: '请输入有效金额',
  AMOUNT_TOO_LOW: (min: number) => `金额不能低于¥${min.toFixed(2)}`,
  AMOUNT_TOO_HIGH: (max: number) => `金额不能超过¥${max.toFixed(2)}`,
  EMPTY_MESSAGE: '消息不能为空',
  MESSAGE_TOO_LONG: (max: number) => `消息长度不能超过${max}个字符`,
} as const
