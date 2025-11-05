/**
 * 消息工厂函数 - 统一创建各种类型的消息
 * 消除重复的消息创建代码
 */

import type { Message } from '../types/chat'

/**
 * 基础消息配置
 */
interface BaseMessageConfig {
  type?: Message['type']
  timestamp?: number
}

/**
 * 系统消息配置
 */
interface SystemMessageConfig extends BaseMessageConfig {
  content: string
}

/**
 * 创建系统消息
 */
export const createSystemMessage = (config: SystemMessageConfig | string): Message => {
  const content = typeof config === 'string' ? config : config.content
  const messageConfig = typeof config === 'string' ? {} : config
  
  return {
    id: messageConfig.timestamp || Date.now(),
    type: messageConfig.type || 'system',
    content,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: messageConfig.timestamp || Date.now(),
    messageType: 'system'
  }
}

/**
 * 创建转账消息
 */
export const createTransferMessage = (
  amount: number,
  message: string,
  type: 'sent' | 'received',
  options?: {
    paidByIntimatePay?: boolean
    intimatePayCharacterName?: string
  }
): Message => {
  const content = options?.paidByIntimatePay && options?.intimatePayCharacterName
    ? `[使用${options.intimatePayCharacterName}的亲密付转账¥${amount.toFixed(2)}${message ? `，备注：${message}` : ''}]`
    : ''

  return {
    id: Date.now(),
    type,
    content,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: Date.now(),
    messageType: 'transfer',
    transfer: {
      amount,
      message,
      status: 'pending',
      paidByIntimatePay: options?.paidByIntimatePay,
      intimatePayCharacterName: options?.intimatePayCharacterName
    }
  }
}

/**
 * 创建亲密付邀请消息
 */
export const createIntimatePayMessage = (
  monthlyLimit: number,
  characterName: string,
  type: 'sent' | 'received'
): Message => {
  return {
    id: Date.now(),
    type,
    content: `[亲密付:${monthlyLimit}]`,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: Date.now(),
    messageType: 'intimatePay',
    intimatePay: {
      monthlyLimit,
      status: 'pending',
      characterName
    }
  }
}

/**
 * 创建语音消息
 */
export const createVoiceMessage = (
  voiceText: string,
  type: 'sent' | 'received' = 'received'
): Message => {
  return {
    id: Date.now(),
    type,
    content: '',
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: Date.now(),
    messageType: 'voice',
    voiceText
  }
}

/**
 * 创建位置消息
 */
export const createLocationMessage = (
  location: { name: string; address: string; lat: number; lng: number },
  type: 'sent' | 'received' = 'received'
): Message => {
  return {
    id: Date.now(),
    type,
    content: '',
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: Date.now(),
    messageType: 'location',
    location
  }
}

/**
 * 创建照片消息
 */
export const createPhotoMessage = (
  description: string,
  type: 'sent' | 'received' = 'received'
): Message => {
  return {
    id: Date.now(),
    type,
    content: '',
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: Date.now(),
    messageType: 'photo',
    photoDescription: description
  }
}

/**
 * 创建视频通话记录消息
 */
export const createVideoCallRecordMessage = (
  duration: number,
  messages: any[]
): Message => {
  return {
    id: Date.now(),
    type: 'system',
    content: `视频通话 ${Math.floor(duration / 60)}分${duration % 60}秒`,
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: Date.now(),
    messageType: 'video-call-record',
    videoCallRecord: {
      duration,
      messages
    }
  }
}

/**
 * 创建情侣空间邀请消息
 */
export const createCoupleSpaceInviteMessage = (
  senderName: string,
  senderAvatar?: string
): Message => {
  return {
    id: Date.now(),
    type: 'received',
    content: '',
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: Date.now(),
    messageType: 'text',
    coupleSpaceInvite: {
      status: 'pending',
      senderName,
      senderAvatar
    }
  }
}
