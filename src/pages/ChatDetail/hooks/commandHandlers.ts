/**
 * AI指令处理器
 * 统一处理所有AI指令，消除重复代码
 */

import type { Message } from '../../../types/chat'
import { createMessage } from '../../../utils/messageUtils'
import { characterService } from '../../../services/characterService'
import { addCouplePhoto, addCoupleMessage, addCoupleAnniversary } from '../../../utils/coupleSpaceContentUtils'
import { createIntimatePayRelation } from '../../../utils/walletUtils'
import { blacklistManager } from '../../../utils/blacklistManager'
import {
  acceptCoupleSpaceInvite,
  rejectCoupleSpaceInvite,
  getCoupleSpaceRelation,
  createCoupleSpaceInvite,
  endCoupleSpaceRelation,
  getCoupleSpacePrivacy
} from '../../../utils/coupleSpaceUtils'
import { getEmojis } from '../../../utils/emojiStorage'
import { addMessage as saveMessageToStorage, saveMessages } from '../../../utils/simpleMessageManager'
import { callMinimaxTTS } from '../../../utils/voiceApi'
import { addAIMemo } from '../../../utils/aiMemoManager'
import { extractStatusFromReply, setAIStatus, getForceUpdateFlag, clearForceUpdateFlag } from '../../../utils/aiStatusManager'
import { generateAvatarForAI } from '../../../utils/imageGenerator'
import { getUserInfo } from '../../../utils/userUtils'

/**
 * 指令处理器接口
 */
export interface CommandHandler {
  pattern: RegExp
  handler: (
    match: RegExpMatchArray,
    content: string,
    context: CommandContext
  ) => Promise<CommandResult>
}

/**
 * 指令上下文
 */
export interface CommandContext {
  messages: Message[]
  setMessages: (fn: (prev: Message[]) => Message[]) => void
  character: any // Character类型
  chatId: string  // 🔥 关键：需要chatId来保存消息
  isBlocked?: boolean  // 🔥 拉黑状态：用于显示感叹号标记
  onVideoCallRequest?: (openingLines?: string | null) => void
  onEndCall?: () => void
  refreshCharacter?: () => void  // 🔥 刷新角色信息
  onAddNarratorMessage?: (content: string) => void  // 🔥 添加旁白消息（视频通话）
}

/**
 * 指令处理结果
 */
export interface CommandResult {
  handled: boolean
  remainingText?: string
  quotedMsg?: Message['quotedMessage']
  messageContent?: string
  skipTextMessage?: boolean  // 跳过发送文本消息
}

/**
 * 辅助函数：延迟
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 辅助函数：添加消息
 * CRITICAL: 必须同时保存到IndexedDB，否则组件卸载时消息会消失！
 */
const addMessage = async (
  message: Message,
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  chatId?: string
) => {
  await delay(300)
  
  if (chatId) {
    // 🔥 直接保存到IndexedDB（不依赖React状态，确保即使组件卸载也能保存）
    // addMessage会触发new-message事件
    saveMessageToStorage(chatId, message)
    console.log('💾 [addMessage] 消息已保存到存储:', {
      chatId,
      messageId: message.id,
      messageType: message.messageType
    })
  }
  
  // 同时更新React状态（如果组件还挂载，更新UI）
  setMessages(prev => [...prev, message])
  console.log('📱 [addMessage] React状态已更新')
}

/**
 * 消息ID生成器（防止同一毫秒内重复）
 */
let lastMessageTime = 0
let messageCounter = 0

const generateMessageId = (): number => {
  const now = Date.now()
  if (now === lastMessageTime) {
    messageCounter++
  } else {
    lastMessageTime = now
    messageCounter = 0
  }
  return now + messageCounter
}

/**
 * 辅助函数：创建消息对象
 * @param isBlocked - 拉黑状态，用于显示感叹号
 */
const createMessageObj = (type: Message['messageType'], data: any, isBlocked?: boolean): Message => {
  return {
    id: generateMessageId(),
    type: data.type || 'received',  // 🔥 使用data.type，如果没有则默认为'received'
    content: '',
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: Date.now(),
    messageType: type,
    blocked: isBlocked,  // 🔥 添加拉黑标记，确保特殊消息也能显示感叹号
    ...data
  }
}

/**
 * 转账指令处理器
 */
export const transferHandler: CommandHandler = {
  pattern: /[\[【]转账[:\：]\s*[¥￥]?\s*(\d+\.?\d*)\s*(?:[:\：]?\s*说明[:\：]?\s*)?(.*?)[\]】]/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    const amount = parseFloat(match[1])
    let transferMessage = (match[2] || '').trim()
    transferMessage = transferMessage.replace(/^[:\：\s]+/, '')

    const transferMsg = createMessageObj('transfer', {
      transfer: {
        amount,
        message: transferMessage,
        status: 'pending'
      }
    }, isBlocked)

    await addMessage(transferMsg, setMessages, chatId)

    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 接收转账指令处理器
 */
export const receiveTransferHandler: CommandHandler = {
  pattern: /[\[【](?:接收转账|转账[:\：]接受|转账[:\：]收下)[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    setMessages(prev => {
      const lastPending = [...prev].reverse().find(
        msg => msg.messageType === 'transfer' && msg.type === 'sent' && msg.transfer?.status === 'pending'
      )

      if (!lastPending) return prev

      return prev.map(msg =>
        msg.id === lastPending.id
          ? { ...msg, transfer: { ...msg.transfer!, status: 'received' as const } }
          : msg
      )
    })

    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: '对方已收款',
      aiReadableContent: `${character?.nickname || character?.realName || '对方'}接受了你的转账`,
      type: 'system'
    })
    await addMessage(systemMsg, setMessages, chatId)

    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: true  // 跳过文本消息
    }
  }
}

/**
 * 退还转账指令处理器
 */
export const rejectTransferHandler: CommandHandler = {
  pattern: /[\[【](?:退还(?:转账)?|转账[:\：]拒绝|转账[:\：]退还)[\]】]|^退还$/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    setMessages(prev => {
      // 查找最近的待处理转账（只有pending状态才能退还）
      const lastPending = [...prev].reverse().find(
        msg => msg.messageType === 'transfer' && msg.type === 'sent' && msg.transfer?.status === 'pending'
      )

      if (!lastPending) {
        console.log('❌ 没有找到可退还的转账')
        return prev
      }

      const updated = prev.map(msg =>
        msg.id === lastPending.id
          ? { ...msg, transfer: { ...msg.transfer!, status: 'expired' as const } }
          : msg
      )
      
      // 🔥 手动保存到IndexedDB
      saveMessages(chatId, updated)
      console.log('💾 [转账退还] 状态已保存到IndexedDB')
      
      return updated
    })

    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: '对方已退还',
      aiReadableContent: `${character?.nickname || character?.realName || '对方'}退还了你的转账`,
      type: 'system'
    })
    await addMessage(systemMsg, setMessages, chatId)

    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 视频通话指令处理器
 */
export const videoCallHandler: CommandHandler = {
  pattern: /[\[【]视频通话[\]】]/,
  handler: async (match, content, { onVideoCallRequest, character }) => {
    console.log('📞 视频通话指令处理:', { content, match: match[0] })
    
    // 触发全局视频通话事件（用于不在聊天页面时的弹窗）
    if (character) {
      window.dispatchEvent(new CustomEvent('incoming-video-call', {
        detail: {
          chatId: character.id,
          characterName: character.nickname || character.realName,
          avatar: character.avatar
        }
      }))
      console.log('📡 已触发全局视频通话事件')
    }
    
    const remainingText = content.replace(match[0], '').trim()
    
    console.log('📞 视频通话处理结果:', { remainingText })
    
    if (onVideoCallRequest) {
      onVideoCallRequest(remainingText || null)
    }
    
    // [视频通话]指令总是跳过文本消息，开场白在视频通话界面显示
    return { 
      handled: true, 
      remainingText: '',  // 清空剩余文本，不在聊天中显示
      skipTextMessage: true  // 总是跳过
    }
  }
}

/**
 * 挂断电话指令处理器
 */
export const endCallHandler: CommandHandler = {
  pattern: /[\[【]挂断电话[\]】]/,
  handler: async (match, content, { onEndCall }) => {
    console.log('📴 挂断电话指令处理:', { content, match: match[0] })

    if (onEndCall) {
      onEndCall()
    }

    const remainingText = content.replace(match[0], '').trim()

    console.log('📴 挂断电话处理结果:', { remainingText })

    return {
      handled: true,
      remainingText: '',  // 清空剩余文本，因为挂断后不需要显示
      skipTextMessage: true  // 跳过文本消息
    }
  }
}

/**
 * AI静音处理器
 */
export const aiMuteHandler: CommandHandler = {
  pattern: /[\[【]静音[\]】]/,
  handler: async (match, content, { character, onAddNarratorMessage }) => {
    console.log('🎙️ [AI静音] AI静音了')

    if (!character) return { handled: false }

    const charName = character.nickname || character.realName

    // 添加旁白消息
    if (onAddNarratorMessage) {
      onAddNarratorMessage(`${charName}静音了，你听不见${charName}的声音了`)
    }

    // 移除静音指令
    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * AI取消静音处理器
 */
export const aiUnmuteHandler: CommandHandler = {
  pattern: /[\[【]取消静音[\]】]/,
  handler: async (match, content, { character, onAddNarratorMessage }) => {
    console.log('🎙️ [AI取消静音] AI取消静音了')

    if (!character) return { handled: false }

    const charName = character.nickname || character.realName

    // 添加旁白消息
    if (onAddNarratorMessage) {
      onAddNarratorMessage(`${charName}取消静音了，你可以听见${charName}的声音了`)
    }

    // 移除取消静音指令
    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * AI关闭摄像头处理器
 */
export const aiCameraOffHandler: CommandHandler = {
  pattern: /[\[【]关闭摄像头[\]】]/,
  handler: async (match, content, { character, onAddNarratorMessage }) => {
    console.log('📹 [AI关闭摄像头] AI关闭了摄像头')

    if (!character) return { handled: false }

    const charName = character.nickname || character.realName

    // 添加旁白消息
    if (onAddNarratorMessage) {
      onAddNarratorMessage(`${charName}关闭了摄像头，你看不见${charName}了`)
    }

    // 移除关闭摄像头指令
    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * AI打开摄像头处理器
 */
export const aiCameraOnHandler: CommandHandler = {
  pattern: /[\[【]打开摄像头[\]】]/,
  handler: async (match, content, { character, onAddNarratorMessage }) => {
    console.log('📹 [AI打开摄像头] AI打开了摄像头')

    if (!character) return { handled: false }

    const charName = character.nickname || character.realName

    // 添加旁白消息
    if (onAddNarratorMessage) {
      onAddNarratorMessage(`${charName}打开了摄像头，你可以看见${charName}了`)
    }

    // 移除打开摄像头指令
    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 语音指令处理器
 * 匹配格式：
 * - [角色名说了xxx]
 * - [角色名的语音：xxx]
 * - [语音:xxx] (兼容旧格式)
 */
export const voiceHandler: CommandHandler = {
  pattern: /[\[【](?:([^说]+)说了(.+?)|([^的]+)的语音[:\：](.+?)|语音[:\：](.+?))[\]】]/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    // 提取语音文本：根据匹配到的格式选择对应的捕获组
    const voiceText = match[2] || match[4] || match[5] || match[1]

    console.log('🎤 开始处理语音指令:', voiceText)

    // 先创建一个基础的语音消息（不含音频）
    const voiceMsg = createMessageObj('voice', {
      voiceText
    }, isBlocked)

    await addMessage(voiceMsg, setMessages, chatId)

    // 异步生成TTS音频
    try {
      // 读取角色的音色ID配置
      console.log('🔍 [语音处理] 开始读取音色ID配置, chatId:', chatId)
      const settingsKey = `chat_settings_${chatId}`
      const settingsStr = localStorage.getItem(settingsKey)
      console.log('🔍 [语音处理] localStorage key:', settingsKey)
      console.log('🔍 [语音处理] localStorage value:', settingsStr)
      
      const settings = settingsStr ? JSON.parse(settingsStr) : null
      const voiceId = settings?.voiceId || ''
      
      console.log('🔍 [语音处理] 解析后的settings:', settings)
      console.log('🔍 [语音处理] 音色ID:', voiceId)

      if (voiceId) {
        console.log('🎤 使用音色ID生成语音:', voiceId)
        const ttsResult = await callMinimaxTTS(voiceText, undefined, undefined, voiceId)
        
        console.log('🎤 TTS结果:', {
          audioUrl: ttsResult.audioUrl?.substring(0, 50),
          duration: ttsResult.duration
        })
        
        // 更新消息，添加音频URL
        if (chatId) {
          saveMessageToStorage(chatId, {
            ...voiceMsg,
            voiceUrl: ttsResult.audioUrl,
            duration: ttsResult.duration
          })
        }
        
        // 更新React状态
        setMessages(prev => prev.map(m => 
          m.id === voiceMsg.id 
            ? { ...m, voiceUrl: ttsResult.audioUrl, duration: ttsResult.duration }
            : m
        ))
        
        console.log('✅ 语音生成成功，已更新消息')
      } else {
        console.warn('⚠️ 未配置音色ID，跳过TTS生成')
        console.warn('⚠️ 请在聊天设置中配置音色ID')
      }
    } catch (error) {
      console.error('❌ 语音生成失败:', error)
      console.error('❌ 错误详情:', error instanceof Error ? error.message : error)
      // 失败也不影响消息发送，只是没有音频
    }

    const remainingText = content.replace(match[0], '').trim()
    
    console.log('🎤 语音指令处理完成:', { voiceText, remainingText, hasRemaining: !!remainingText })
    
    // 返回结果，标记跳过纯语音指令的文本消息
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText // 如果没有剩余文本，跳过文本消息
    }
  }
}

/**
 * 位置指令处理器
 * 支持两种格式：
 * 1. [位置:名称:地址] 或 [位置:名称 - 地址]
 * 2. [位置:名称] （地址默认为"详细地址"）
 */
export const locationHandler: CommandHandler = {
  pattern: /[\[【]位置[:\：](.+?)[\]】]/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    const fullLocation = match[1].trim()

    // 尝试分割名称和地址
    let locationName: string
    let locationAddress: string

    // 检查是否有分隔符（: 或 -）
    const colonMatch = fullLocation.match(/^(.+?)[:\：](.+)$/)
    const dashMatch = fullLocation.match(/^(.+?)\s*-\s*(.+)$/)

    if (colonMatch) {
      locationName = colonMatch[1].trim()
      locationAddress = colonMatch[2].trim()
    } else if (dashMatch) {
      locationName = dashMatch[1].trim()
      locationAddress = dashMatch[2].trim()
    } else {
      // 只有一个参数，作为名称，地址默认
      locationName = fullLocation
      locationAddress = '详细地址'
    }

    console.log('📍 [位置指令]', { locationName, locationAddress })

    const locationMsg = createMessageObj('location', {
      location: {
        name: locationName,
        address: locationAddress
      }
    }, isBlocked)

    await addMessage(locationMsg, setMessages, chatId)

    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 照片指令处理器
 */
export const photoHandler: CommandHandler = {
  // 支持三种写法：
  // 1. [照片:描述]
  // 2. [你发了照片：描述]
  // 3. [我发了照片：描述]
  pattern: /[\[【](?:照片|(?:你|我)发了照片)[:\：](.+?)[\]】]/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    const photoDescription = match[1].trim()

    const photoMsg = createMessageObj('photo', {
      photoDescription
    }, isBlocked)

    await addMessage(photoMsg, setMessages, chatId)

    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 表情包指令处理器
 * 格式：[表情:描述] 或 [表情包:描述]
 * 🔥 兼容错误格式：[你发了表情包：描述] 或 [我发了表情包：描述]
 * AI根据描述查找匹配的表情包发送
 */
export const emojiHandler: CommandHandler = {
  pattern: /[\[【](?:(?:你|我)发了)?表情(?:包)?[:\：](.+?)[\]】]/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    const emojiDesc = match[1].trim()
    
    console.log('🎯 [表情包指令] 匹配到:', { 
      原始文本: match[0], 
      提取的描述: emojiDesc 
    })
    
    // 从存储中查找匹配的表情包
    const emojis = await getEmojis()
    
    // 查找描述匹配的表情包（模糊匹配）
    const matchedEmoji = emojis.find(emoji => 
      emoji.description.includes(emojiDesc) || emojiDesc.includes(emoji.description)
    )
    
    if (matchedEmoji) {
      // 找到匹配的表情包，发送表情包消息
      const emojiMsg = createMessageObj('emoji', {
        content: `[表情包]`,
        emoji: {
          id: matchedEmoji.id,
          url: matchedEmoji.url,
          name: matchedEmoji.name,
          description: matchedEmoji.description
        }
      }, isBlocked)  // 🔥 传入拉黑状态，显示感叹号
      
      console.log('📤 AI准备发送表情包消息:', {
        chatId,
        messageType: emojiMsg.messageType,
        emoji: emojiMsg.emoji,
        fullMessage: emojiMsg
      })
      
      await addMessage(emojiMsg, setMessages, chatId)  // 🔥 传入chatId
      console.log(`✅ AI发送表情包完成: ${matchedEmoji.description}`)
      
      // 验证保存
      console.log('🔍 验证表情包消息是否保存:', JSON.stringify(emojiMsg, null, 2))
    } else {
      console.log(`⚠️ 未找到匹配"${emojiDesc}"的表情包，隐藏指令`)
      // 如果找不到匹配的表情包，直接删除/隐藏这个指令，不显示任何内容
    }

    // 移除表情包指令，继续处理剩余文本
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 撤回消息指令处理器
 * 格式：[撤回消息:要撤回的内容:理由]
 * 兼容：[我撤回了消息："内容"]（错误格式，自动提取）
 */
export const recallHandler: CommandHandler = {
  pattern: /[\[【](?:我)?撤回(?:了)?(?:一条)?消息[:\：][""]?(.+?)[""]?(?:[:\：](.+?))?[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    const messageToRecall = match[1].trim()
    const reason = (match[2] || '').trim()

    setMessages(prev => {
      const now = Date.now()
      const twoMinutesAgo = now - 2 * 60 * 1000 // 2分钟前
      
      // 查找2分钟内包含指定内容的AI消息（从后往前找，找最近的）
      const targetMessage = [...prev].reverse().find(msg => {
        if (msg.type !== 'received') return false
        
        // 检查时间（如果有timestamp）
        if (msg.timestamp && msg.timestamp < twoMinutesAgo) {
          return false // 超过2分钟，不能撤回
        }
        
        const msgContent = msg.content || msg.voiceText || msg.photoDescription || msg.location?.name || msg.emoji?.description || ''
        return msgContent.includes(messageToRecall)
      })

      if (!targetMessage) {
        console.log(`⚠️ 未找到2分钟内包含"${messageToRecall}"的消息`)
        return prev
      }
      
      console.log(`✅ 找到要撤回的消息: "${targetMessage.content}"，理由: ${reason}`)

      const updated = prev.map(msg =>
        msg.id === targetMessage.id
          ? {
              ...msg,
              isRecalled: true,
              recalledContent: msg.content || msg.voiceText || msg.photoDescription || msg.location?.name || msg.emoji?.description || '特殊消息',
              recallReason: reason,
              originalType: 'received' as const,
              content: (character?.realName || '对方') + '撤回了一条消息',
              type: 'system' as const,
              messageType: 'system' as const
            }
          : msg
      )
      
      // 🔥 手动保存到IndexedDB
      saveMessages(chatId, updated)
      console.log('💾 [撤回消息] 已保存到IndexedDB')
      
      return updated
    })

    // 处理剩余文本
    const remainingText = content.replace(match[0], '').trim()
    
    return { 
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 情侣空间：接受邀请
 */
export const coupleSpaceAcceptHandler: CommandHandler = {
  pattern: /[\[【]情侣空间[:\：]\s*接受[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    if (!character) return { handled: false }
    
    const success = acceptCoupleSpaceInvite(character.id)
    
    if (success) {
      // 更新邀请卡片状态
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.coupleSpaceInvite && msg.coupleSpaceInvite.status === 'pending'
            ? { ...msg, coupleSpaceInvite: { ...msg.coupleSpaceInvite, status: 'accepted' as const } }
            : msg
        )
        // 🔥 手动保存到IndexedDB
        saveMessages(chatId, updated)
        console.log('💾 [情侣空间接受] 状态已保存到IndexedDB')
        return updated
      })
      
      // 添加系统消息
      const systemMsg = createMessageObj('system', {
        content: `${character.nickname || character.realName} 接受了你的情侣空间邀请`,
        aiReadableContent: `${character.nickname || character.realName} 接受了你的情侣空间邀请，你们现在可以使用情侣空间的相册、留言板、纪念日等功能了`,
        type: 'system'
      })
      await addMessage(systemMsg, setMessages, chatId)
    }
    
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText  // 如果没有其他文本，跳过发送
    }
  }
}

/**
 * 情侣空间：拒绝邀请
 */
export const coupleSpaceRejectHandler: CommandHandler = {
  pattern: /[\[【]情侣空间[:\：]\s*拒绝[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    if (!character) return { handled: false }
    
    const success = rejectCoupleSpaceInvite(character.id)
    
    if (success) {
      // 更新邀请卡片状态
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.coupleSpaceInvite && msg.coupleSpaceInvite.status === 'pending'
            ? { ...msg, coupleSpaceInvite: { ...msg.coupleSpaceInvite, status: 'rejected' as const } }
            : msg
        )
        // 🔥 手动保存到IndexedDB
        saveMessages(chatId, updated)
        console.log('💾 [情侣空间拒绝] 状态已保存到IndexedDB')
        return updated
      })
      
      // 添加系统消息
      const systemMsg = createMessageObj('system', {
        content: `${character.nickname || character.realName} 拒绝了你的情侣空间邀请`,
        aiReadableContent: `${character.nickname || character.realName} 拒绝了你的情侣空间邀请`,
        type: 'system'
      })
      await addMessage(systemMsg, setMessages, chatId)
    }
    
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 情侣空间邀请处理器（AI主动发送邀请）
 */
export const coupleSpaceInviteHandler: CommandHandler = {
  pattern: /[\[【]情侣空间邀请[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    if (!character) return { handled: false }
    
    // 🔒 检查用户是否设置了私密
    const privacy = getCoupleSpacePrivacy()
    const relation = getCoupleSpaceRelation()
    const charName = character.nickname || character.realName
    
    // 如果用户设置了私密且已经有active的情侣空间，驳回邀请
    if (privacy === 'private' && relation && relation.status === 'active') {
      const userMessage = `系统提示：对方已经建立了情侣空间，邀请被驳回`
      const aiMessage = `【系统提示】你发送的情侣空间邀请被驳回了，原因：对方已经和别人建立了情侣空间。看来对方隐瞒了这件事...`
      
      // 添加系统消息（用户和AI都能看到，但显示不同内容）
      const systemMsg = createMessageObj('system', {
        content: userMessage,
        aiReadableContent: aiMessage,
        type: 'system'
      })
      await addMessage(systemMsg, setMessages, chatId)
      
      const remainingText = content.replace(match[0], '').trim()
      return { 
        handled: true, 
        remainingText,
        skipTextMessage: !remainingText
      }
    }
    
    // 检查是否可以发送邀请
    if (relation) {
      // 已有情侣空间关系
      let message = ''
      
      if (relation.status === 'pending' && relation.characterId === character.id) {
        // 当前AI已经发送过邀请
        message = `${charName} 尝试邀请你建立情侣空间，但邀请已发送过，等待你的回复`
      } else if (relation.status === 'pending') {
        // 其他AI发送过邀请
        message = `${charName} 尝试邀请你建立情侣空间，但你已经收到 ${relation.characterName} 的邀请`
      } else if (relation.status === 'active' && relation.characterId === character.id) {
        // 和当前AI已有情侣空间
        message = `${charName} 尝试邀请你建立情侣空间，但你们已经建立了`
      } else if (relation.status === 'active') {
        // 和其他AI已有情侣空间
        message = `${charName} 尝试邀请你建立情侣空间，但你已经和 ${relation.characterName} 建立了情侣空间`
      }
      
      // 添加系统消息
      const systemMsg = createMessageObj('system', {
        content: message,
        aiReadableContent: message,  // 确保错误消息也被AI读取
        type: 'system'
      })
      await addMessage(systemMsg, setMessages, chatId)
      
      const remainingText = content.replace(match[0], '').trim()
      return { 
        handled: true, 
        remainingText,
        skipTextMessage: !remainingText
      }
    }
    
    // 创建邀请关系（status为pending）
    const newRelation = createCoupleSpaceInvite(
      'user',
      character.id,
      character.nickname || character.realName,
      character.avatar,
      'character'  // AI发起的邀请
    )
    
    if (!newRelation) {
      // 添加失败消息
      const systemMsg = createMessageObj('system', {
        content: '无法发送邀请',
        aiReadableContent: '系统提示：无法发送情侣空间邀请',
        type: 'system'
      })
      await addMessage(systemMsg, setMessages, chatId)
      
      const remainingText = content.replace(match[0], '').trim()
      return { 
        handled: true, 
        remainingText,
        skipTextMessage: !remainingText
      }
    }
    
    // 创建情侣空间邀请消息
    const inviteMsg = createMessageObj('text', {
      content: '',
      coupleSpaceInvite: {
        status: 'pending' as const,
        senderName: character.nickname || character.realName,
        senderAvatar: character.avatar
      }
    })
    
    console.log('🎊 创建情侣空间邀请消息:', inviteMsg)
    
    await addMessage(inviteMsg, setMessages, chatId)
    
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 情侣空间：添加照片到相册
 */
export const coupleSpacePhotoHandler: CommandHandler = {
  pattern: /[\[【]相册[:\：]\s*(.+?)[\]】]/,
  handler: async (match, content, { character, setMessages, chatId }) => {
    if (!character) return { handled: false }
    
    // 检查是否有活跃的情侣空间
    const relation = getCoupleSpaceRelation()
    if (relation && relation.status === 'active' && relation.characterId === character.id) {
      const description = match[1].trim()
      
      // 添加到相册
      addCouplePhoto(
        character.id,
        character.nickname || character.realName,
        description
      )
      
      // 添加系统提示
      const charName = character.nickname || character.realName
      const systemMsg = createMessageObj('system', {
        content: `${charName}在相册中记录了${description}`,
        aiReadableContent: `${charName}在情侣空间的相册中分享了一张照片，描述为：${description}`,
        type: 'system'
      })
      await addMessage(systemMsg, setMessages, chatId)
      
      console.log(`📸 已添加照片到情侣空间相册: ${description}`)
    }
    
    // 继续发送文本消息（不移除指令）
    return { handled: false }
  }
}

/**
 * 情侣空间：发留言
 */
export const coupleSpaceMessageHandler: CommandHandler = {
  pattern: /[\[【]留言[:\：]\s*(.+?)[\]】]/,
  handler: async (match, content, { character, setMessages, chatId }) => {
    if (!character) return { handled: false }
    
    // 检查是否有活跃的情侣空间
    const relation = getCoupleSpaceRelation()
    if (relation && relation.status === 'active' && relation.characterId === character.id) {
      const messageContent = match[1].trim()
      
      // 添加留言
      addCoupleMessage(
        character.id,
        character.nickname || character.realName,
        messageContent
      )
      
      // 添加系统提示
      const charName = character.nickname || character.realName
      const systemMsg = createMessageObj('system', {
        content: `${charName}在留言中写到${messageContent}`,
        aiReadableContent: `${charName}在情侣空间的留言板留言：${messageContent}`,
        type: 'system'
      })
      await addMessage(systemMsg, setMessages, chatId)
      
      console.log(`💌 已添加留言到情侣空间: ${messageContent}`)
    }
    
    // 继续发送文本消息（不移除指令）
    return { handled: false }
  }
}

/**
 * 情侣空间：添加纪念日
 */
export const coupleSpaceAnniversaryHandler: CommandHandler = {
  pattern: /[\[【]纪念日[:\：]\s*(.+?)[:\：]\s*(.+?)[\]】]/,
  handler: async (match, content, { character, setMessages, chatId }) => {
    if (!character) return { handled: false }
    
    // 检查是否有活跃的情侣空间
    const relation = getCoupleSpaceRelation()
    if (relation && relation.status === 'active' && relation.characterId === character.id) {
      const date = match[1].trim()
      const title = match[2].trim()
      
      // 添加纪念日
      addCoupleAnniversary(
        character.id,
        date,
        title,
        '' // 描述为空
      )
      
      // 添加系统提示
      const charName = character.nickname || character.realName
      const systemMsg = createMessageObj('system', {
        content: `${charName}添加了纪念日：${title}（${date}）`,
        aiReadableContent: `${charName}在情侣空间添加了一个纪念日，标题是「${title}」，日期是${date}`,
        type: 'system'
      })
      await addMessage(systemMsg, setMessages, chatId)
      
      console.log(`🎂 已添加纪念日: ${title} - ${date}`)
    }
    
    // 继续发送文本消息（不移除指令）
    return { handled: false }
  }
}

/**
 * 情侣空间：解除关系
 */
export const coupleSpaceEndHandler: CommandHandler = {
  pattern: /[\[【]解除情侣空间[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    if (!character) return { handled: false }
    
    const success = endCoupleSpaceRelation()
    
    if (success) {
      // 添加系统消息
      const charName = character.nickname || character.realName
      const systemMsg = createMessageObj('system', {
        content: `${charName}解除了情侣空间`,
        aiReadableContent: `${charName}解除了和你的情侣空间关系，但之前的照片、留言、纪念日等内容都保留着，等待下次重新绑定`,
        type: 'system'
      })
      
      console.log('💔 [情侣空间解除] 创建系统消息:', {
        content: systemMsg.content,
        type: systemMsg.type,
        messageType: systemMsg.messageType,
        aiReadableContent: systemMsg.aiReadableContent
      })
      
      await addMessage(systemMsg, setMessages, chatId)
      console.log(`✅ [情侣空间解除] 系统消息已保存`)
    }
    
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

export const quoteOnlyHandler: CommandHandler = {
  pattern: /[\[【]引用(?:了?(?:你的消息)?)?[:\：]\s*(.+?)[\]】]/,
  handler: async (match, content, { messages, character }) => {
    const quoteRef = match[1].trim()
    let quotedMsg: Message['quotedMessage'] | undefined

    // 如果同一对括号内包含“回复:”，交给 quoteHandler 处理
    if (/回复[:：]/.test(match[0])) {
      return { handled: false }
    }

    if (/(所有|全部|这些|全部引用|所有消息)/.test(quoteRef)) {
      const remainingText = content.replace(match[0], '')
      return {
        handled: true,
        quotedMsg: undefined,
        messageContent: remainingText
      }
    }

    const currentMessages = messages
    let quoted: Message | undefined

    let lowerRef = quoteRef.toLowerCase()
    const quotedId = parseInt(quoteRef)
    if (!isNaN(quotedId)) {
      quoted = currentMessages.find(m => m.id === quotedId)
    }

    if (!quoted) {
      const quoteMatch = quoteRef.match(/["「『"'"](.+?)["」』"'"]/)
      if (quoteMatch) {
        lowerRef = quoteMatch[1].toLowerCase()
      }

      if (lowerRef.length > 20) {
        lowerRef = lowerRef.substring(0, 20)
      }

      if (lowerRef.includes('上一条') || lowerRef.includes('上条') || lowerRef.includes('刚才')) {
        quoted = [...currentMessages].reverse().find(m => m.type === 'sent' || m.type === 'received')
      } else if (lowerRef.includes('语音')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'voice')
      } else if (lowerRef.includes('照片') || lowerRef.includes('图片')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'photo')
      } else if (lowerRef.includes('位置')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'location')
      } else if (lowerRef.includes('表情')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'emoji')
      } else if (lowerRef.includes('转账')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'transfer')
      } else if (lowerRef.includes('用户') || lowerRef.includes('你问') || lowerRef.includes('你说') || lowerRef.includes('你发')) {
        quoted = [...currentMessages].reverse().find(m => m.type === 'sent')
      } else if (lowerRef.includes('我说') || lowerRef.includes('我发') || lowerRef.includes('自己')) {
        quoted = [...currentMessages].reverse().find(m => m.type === 'received')
      } else {
        quoted = [...currentMessages].reverse().find(m => {
          if (m.type !== 'sent' && m.type !== 'received') return false
          const aiReadable = (m as any).aiReadableContent || ''
          const msgContent = (m.content || m.voiceText || m.photoDescription || m.emoji?.description || '').toLowerCase()
          const searchContent = (aiReadable || msgContent).toLowerCase()
          return searchContent.includes(lowerRef)
        })

        if (!quoted) {
          quoted = [...currentMessages].reverse().find(m => {
            if (m.type !== 'sent' && m.type !== 'received') return false
            const raw = (m.content || m.voiceText || m.photoDescription || m.emoji?.description || '').trim()
            if (!raw) return false
            const msgLower = raw.toLowerCase()
            if (msgLower.length < 2 && !/^[0-9]+$/.test(msgLower)) return false
            return lowerRef.includes(msgLower)
          })
        }
      }
    }

    if (quoted) {
      // 🔥 如果是表情包消息，优先使用emoji.description
      let quotedContent = quoted.emoji?.description || quoted.content || quoted.voiceText || quoted.photoDescription || quoted.location?.name || '特殊消息'
      quotedContent = quotedContent
        .replace(/\[用户发了表情包\]\s*/g, '')
        .replace(/\[AI发了表情包\]\s*/g, '')
        .replace(/\[表情[:\：][^\]]*?\]/g, '')  // 🔥 清理表情包指令标记
        .replace(/【表情[:\：][^】]*?】/g, '')  // 🔥 清理全角表情包指令标记
        .replace(/\[引用了?[^\]]*?\]/g, '')
        .replace(/【引用了?[^】]*?】/g, '')
        .trim()
      
      // 🔥 如果清理后为空，说明是纯表情包消息，显示[表情包]
      if (!quotedContent && quoted.messageType === 'emoji') {
        quotedContent = '[表情包]'
      }

      const MAX_QUOTE_LENGTH = 100
      if (quotedContent.length > MAX_QUOTE_LENGTH) {
        quotedContent = quotedContent.substring(0, MAX_QUOTE_LENGTH) + '...'
      }

      quotedMsg = {
        id: quoted.id,
        content: quotedContent,
        senderName: quoted.type === 'sent' ? '我' : (character?.realName || 'AI'),
        type: quoted.type === 'system' ? 'sent' : quoted.type
      }
    }

    const remainingText = content.replace(match[0], '')
    return {
      handled: true,
      quotedMsg,
      messageContent: remainingText
    }
  }
}

/**
 * 引用指令处理器
 * 支持多种引用格式，提高AI的表达灵活性
 * 🔥 修复：支持缺少前括号的情况（AI有时会漏掉[）
 */
export const quoteHandler: CommandHandler = {
  // 🔥 新格式：[引用:关键词 回复:内容]
  pattern: /[\[【]引用[:\：]\s*(.+?)\s+回复[:\：]\s*(.+?)[\]】]/,
  handler: async (match, content, { messages, character }) => {
    // 提取引用关键词和回复内容
    const quoteRef = match[1].trim()
    const replyContent = match[2].trim()
    console.log('🔍 [quoteHandler] 开始处理引用指令:', { quoteRef, replyContent, fullMatch: match[0] })
    let quotedMsg: Message['quotedMessage'] | undefined

    // 🚫 屏蔽模糊引用指令：凡是包含“所有”“全部”“这些”等模糊词的引用，一律视为无效
    // 目的：强制AI使用“某一句话的关键词”来引用，避免“把我所有消息引用”“全部引用了”等乱写
    if (/(所有|全部|这些|全部引用|所有消息)/.test(quoteRef)) {
      const remainingText = content.replace(match[0], '')
      console.warn('🚫 [quoteHandler] 检测到模糊引用指令，已忽略引用:', quoteRef)
      return {
        handled: true,
        quotedMsg: undefined,
        messageContent: remainingText
      }
    }

    const currentMessages = messages
    console.log('🔍 [quoteHandler] 开始搜索:', {
      quoteRef,
      messagesCount: currentMessages.length,
      最近5条消息: currentMessages.slice(-5).map(m => ({
        type: m.type,
        content: m.content?.substring(0, 30),
        messageType: m.messageType
      }))
    })
    let quoted: Message | undefined

    // 先尝试按ID精确匹配（引用内容是纯数字时）
    let lowerRef = quoteRef.toLowerCase()
    const quotedId = parseInt(quoteRef)
    if (!isNaN(quotedId)) {
      quoted = currentMessages.find(m => m.id === quotedId)
      if (quoted) {
        console.log('🔢 [quoteHandler] 通过消息ID匹配到引用:', { quotedId, quotedContent: quoted.content?.substring(0, 30) })
      }
    }

    // 如果按ID没有匹配到，再走文本匹配流程
    if (!quoted) {
      // 提取引号内的内容作为关键词
      const quoteMatch = quoteRef.match(/["「『"'"](.+?)["」』"'"]/)
      if (quoteMatch) {
        lowerRef = quoteMatch[1].toLowerCase()
      }
      
      // 🔥 如果引用内容太长（超过20字），只取前面部分进行搜索
      // 这样可以提高匹配成功率，避免因内容不完整而无法匹配
      if (lowerRef.length > 20) {
        lowerRef = lowerRef.substring(0, 20)
        console.log('📏 [quoteHandler] 引用内容过长，截取前20字搜索:', lowerRef)
      }

      if (lowerRef.includes('上一条') || lowerRef.includes('上条') || lowerRef.includes('刚才')) {
        quoted = [...currentMessages].reverse().find(m => m.type === 'sent' || m.type === 'received')
      } else if (lowerRef.includes('语音')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'voice')
      } else if (lowerRef.includes('照片') || lowerRef.includes('图片')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'photo')
      } else if (lowerRef.includes('位置')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'location')
      } else if (lowerRef.includes('表情')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'emoji')
      } else if (lowerRef.includes('转账')) {
        quoted = [...currentMessages].reverse().find(m => m.messageType === 'transfer')
      } else if (lowerRef.includes('用户') || lowerRef.includes('你问') || lowerRef.includes('你说') || lowerRef.includes('你发')) {
        // 🔍 明确指的是“你”的消息（用户消息）
        quoted = [...currentMessages].reverse().find(m => m.type === 'sent')
      } else if (lowerRef.includes('我说') || lowerRef.includes('我发') || lowerRef.includes('自己')) {
        // 🔍 明确指的是“我”的消息（AI自己的消息）
        quoted = [...currentMessages].reverse().find(m => m.type === 'received')
      } else {
        // 默认情况：在所有普通消息里搜索（包括用户和AI）
        // 🔥 修复：允许AI引用自己的消息，不再仅限用户消息
        quoted = [...currentMessages].reverse().find(m => {
          if (m.type !== 'sent' && m.type !== 'received') return false
          const aiReadable = (m as any).aiReadableContent || ''
          const msgContent = (m.content || m.voiceText || m.photoDescription || m.emoji?.description || '').toLowerCase()
          const searchContent = (aiReadable || msgContent).toLowerCase()
          return searchContent.includes(lowerRef)
        })

        // 🔁 兜底：如果还没找到，反向匹配——看“消息内容”是否被包含在引用文本里
        // 典型场景：AI 把多条短消息串成一个引用，例如 [引用:引用消息多引用几条1]
        // 这时 lowerRef 是整串，而每条消息内容只是其中的一部分
        if (!quoted) {
          quoted = [...currentMessages].reverse().find(m => {
            if (m.type !== 'sent' && m.type !== 'received') return false
            const raw = (m.content || m.voiceText || m.photoDescription || m.emoji?.description || '').trim()
            if (!raw) return false
            const msgLower = raw.toLowerCase()
            // 避免一些特别短的非数字字符造成误匹配，例如单个标点
            if (msgLower.length < 2 && !/^[0-9]+$/.test(msgLower)) return false
            return lowerRef.includes(msgLower)
          })
          if (quoted) {
            console.log('🔁 [quoteHandler] 通过反向包含匹配到引用消息:', {
              quoteRef,
              matchedContent: quoted.content?.substring(0, 30),
              matchedId: quoted.id
            })
          }
        }
      }
    }

    if (quoted) {
      // 🔥 如果是表情包消息，优先使用emoji.description
      let quotedContent = quoted.emoji?.description || quoted.content || quoted.voiceText || quoted.photoDescription || quoted.location?.name || '特殊消息'
      
      // 🔥 清理系统提示标签和嵌套引用
      quotedContent = quotedContent
        .replace(/\[用户发了表情包\]\s*/g, '')
        .replace(/\[AI发了表情包\]\s*/g, '')
        .replace(/\[表情[:\：][^\]]*?\]/g, '')  // 🔥 清理表情包指令标记
        .replace(/【表情[:\：][^】]*?】/g, '')  // 🔥 清理全角表情包指令标记
        // 清理嵌套的引用指令（避免引用中包含引用）
        .replace(/\[引用了?[^\]]*?\]/g, '')
        .replace(/【引用了?[^】]*?】/g, '')
        .trim()
      
      // 🔥 如果清理后为空，说明是纯表情包消息，显示[表情包]
      if (!quotedContent && quoted.messageType === 'emoji') {
        quotedContent = '[表情包]'
      }
      
      // 🔥 限制引用内容长度，避免显示混乱（最多100字）
      const MAX_QUOTE_LENGTH = 100
      if (quotedContent.length > MAX_QUOTE_LENGTH) {
        quotedContent = quotedContent.substring(0, MAX_QUOTE_LENGTH) + '...'
      }
      
      quotedMsg = {
        id: quoted.id,
        content: quotedContent,
        senderName: quoted.type === 'sent' ? '我' : (character?.realName || 'AI'),
        type: quoted.type === 'system' ? 'sent' : quoted.type
      }
      console.log('✅ [quoteHandler] 找到被引用的消息:', {
        quoteRef,
        quotedContent: quotedMsg.content,
        quotedId: quotedMsg.id
      })
    } else {
      console.warn('⚠️ [quoteHandler] 未找到被引用的消息:', quoteRef)
    }

    // 🔥 新格式：回复内容已经在指令里了，直接使用
    // 移除引用指令，保留回复内容
    const remainingText = content.replace(match[0], replyContent)
    return { 
      handled: true, 
      quotedMsg, 
      messageContent: remainingText
    }
  }
}

/**
 * 亲密付指令处理器
 * 支持两种格式：
 * 1. [亲密付:3000]
 * 2. [亲密付:月额度:3000]
 */
export const intimatePayHandler: CommandHandler = {
  pattern: /[\[【]亲密付[:\：](?:月额度[:\：])?(\d+\.?\d*)[\]】]/,
  handler: async (match, content, { setMessages, character, chatId, isBlocked }) => {
    const monthlyLimit = parseFloat(match[1])

    const intimatePayMsg = createMessageObj('intimatePay', {
      intimatePay: {
        monthlyLimit,
        status: 'pending',
        characterName: character?.nickname || character?.realName || '对方'
      }
    }, isBlocked)

    await addMessage(intimatePayMsg, setMessages, chatId)

    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 接受亲密付指令处理器
 */
export const acceptIntimatePayHandler: CommandHandler = {
  pattern: /[\[【]接受亲密付[\]】]/,
  handler: async (match, content, { setMessages, character, chatId, messages }) => {
    console.log('🎯 [接受亲密付] 处理器被调用')
    
    // 🔥 修复：先从 messages 中查找待处理的亲密付
    const lastPending = [...messages].reverse().find(
      msg => msg.messageType === 'intimatePay' && msg.type === 'sent' && msg.intimatePay?.status === 'pending'
    )
    
    if (!lastPending || !lastPending.intimatePay) {
      console.warn('⚠️ [接受亲密付] 没有找到待处理的亲密付消息')
      return { handled: false }
    }
    
    const monthlyLimit = lastPending.intimatePay.monthlyLimit
    console.log('✅ [接受亲密付] 找到待处理消息:', {
      messageId: lastPending.id,
      monthlyLimit
    })
    
    // 更新消息状态为已接受
    let updatedMessages: Message[] = []
    setMessages(prev => {
      updatedMessages = prev.map(msg =>
        msg.id === lastPending.id
          ? {
              ...msg,
              intimatePay: {
                ...msg.intimatePay!,
                status: 'accepted' as const
              }
            }
          : msg
      )
      return updatedMessages
    })

    // 🔥 保存到IndexedDB
    if (chatId && updatedMessages.length > 0) {
      await saveMessages(chatId, updatedMessages)
      console.log('💾 [接受亲密付] 消息状态已保存到数据库')
    }

    // 创建亲密付关系（用户给AI开通，AI接受，类型是 user_to_character）
    if (character) {
      const success = createIntimatePayRelation(
        character.id,
        character.nickname || character.realName,
        monthlyLimit,
        character.avatar,
        'user_to_character'
      )
      console.log('💳 [接受亲密付] 创建关系:', success ? '成功' : '失败（可能已存在）')
    }

    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: '对方已接受亲密付',
      aiReadableContent: `${character?.nickname || character?.realName || '对方'}接受了你的亲密付邀请`,
      type: 'system'
    })
    console.log('📝 [接受亲密付] 添加系统消息:', systemMsg.content)
    await addMessage(systemMsg, setMessages, chatId)

    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 拒绝亲密付指令处理器
 */
export const rejectIntimatePayHandler: CommandHandler = {
  pattern: /[\[【]拒绝亲密付[\]】]/,
  handler: async (match, content, { setMessages, chatId, character, messages }) => {
    console.log('🎯 [拒绝亲密付] 处理器被调用')
    
    // 🔥 修复：先从 messages 中查找待处理的亲密付
    const lastPending = [...messages].reverse().find(
      msg => msg.messageType === 'intimatePay' && msg.type === 'sent' && msg.intimatePay?.status === 'pending'
    )

    if (!lastPending) {
      console.warn('⚠️ [拒绝亲密付] 没有找到待处理的亲密付消息')
      return { handled: false }
    }
    
    console.log('✅ [拒绝亲密付] 找到待处理消息:', lastPending.id)

    // 更新消息状态为已拒绝
    let updatedMessages: Message[] = []
    setMessages(prev => {
      updatedMessages = prev.map(msg =>
        msg.id === lastPending.id
          ? {
              ...msg,
              intimatePay: {
                ...msg.intimatePay!,
                status: 'rejected' as const
              }
            }
          : msg
      )
      return updatedMessages
    })

    // 🔥 保存到IndexedDB
    if (chatId && updatedMessages.length > 0) {
      await saveMessages(chatId, updatedMessages)
      console.log('💾 [拒绝亲密付] 消息状态已保存到数据库')
    }

    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: '对方已拒绝亲密付',
      aiReadableContent: `${character?.nickname || character?.realName || '对方'}拒绝了你的亲密付邀请`,
      type: 'system'
    })
    console.log('📝 [拒绝亲密付] 添加系统消息:', systemMsg.content)
    await addMessage(systemMsg, setMessages, chatId)

    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 拉黑用户指令处理器
 */
export const blockUserHandler: CommandHandler = {
  pattern: /[\[【]拉黑用户[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    if (!character) return { handled: false }
    
    // 🔥 检查是否已经拉黑，避免重复拉黑
    const alreadyBlocked = blacklistManager.isBlockedByMe(`character_${character.id}`, 'user')
    if (alreadyBlocked) {
      console.warn(`⚠️ ${character.nickname || character.realName} 已经拉黑了用户，忽略重复的拉黑指令`)
      // 移除指令但不执行任何操作
      const remainingText = content.replace(match[0], '').trim()
      return { 
        handled: true, 
        remainingText,
        skipTextMessage: !remainingText
      }
    }
    
    // AI拉黑用户（character拉黑user）
    blacklistManager.blockUser(`character_${character.id}`, 'user')
    console.log(`🚫 ${character.nickname || character.realName} 拉黑了用户`)
    
    // 注意：不需要修改现有消息
    // 用户发送新消息时会自动检测拉黑状态并标记（见 useChatAI.ts）
    
    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: `${character.nickname || character.realName}拉黑了你`,
      aiReadableContent: `${character.nickname || character.realName}把你拉入了黑名单，你发送的消息对方将拒收`,
      type: 'system'
    })
    await addMessage(systemMsg, setMessages, chatId)
    
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 解除拉黑指令处理器
 */
export const unblockUserHandler: CommandHandler = {
  pattern: /[\[【]解除拉黑[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    if (!character) return { handled: false }
    
    // AI解除拉黑
    blacklistManager.unblockUser(`character_${character.id}`, 'user')
    console.log(`✅ ${character.nickname || character.realName} 解除了对用户的拉黑`)
    
    // 注意：不需要修改现有消息
    // 历史消息保持原样（显示真实的拉黑状态）
    // 解除拉黑后的新消息会自动不显示感叹号
    
    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: `${character.nickname || character.realName}解除了拉黑`,
      aiReadableContent: `${character.nickname || character.realName}将你从黑名单中移除，现在可以正常聊天了`,
      type: 'system'
    })
    await addMessage(systemMsg, setMessages, chatId)
    
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * AI修改网名处理器
 */
export const changeNicknameHandler: CommandHandler = {
  pattern: /\[网名:(.+?)\]/,
  handler: async (match, content, { setMessages, character, chatId, refreshCharacter }) => {
    if (!character) {
      console.warn('⚠️ AI修改网名失败: 没有character信息')
      return { handled: false }
    }
    
    const newNickname = match[1].trim()
    const oldNickname = character.nickname || character.realName
    
    console.log(`✏️ AI修改网名: ${oldNickname} → ${newNickname}`)
    
    // 更新角色信息
    characterService.update(character.id, { nickname: newNickname })
    
    // 🔥 立即刷新界面上的character，让名字立刻显示
    if (refreshCharacter) {
      refreshCharacter()
    }
    
    // 创建系统消息
    const systemMsg: Message = {
      ...createMessage(`${oldNickname}更改了网名为"${newNickname}"`, 'system'),
      aiReadableContent: `[系统通知：你将自己的网名从"${oldNickname}"改成了"${newNickname}"，用户会看到灰色小字提示]`,
      messageType: 'system'
    }
    await addMessage(systemMsg, setMessages, chatId)
    
    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * AI修改个性签名处理器
 */
export const changeSignatureHandler: CommandHandler = {
  // 支持格式：
  // [个性签名:xxxx]
  // [个性签名：xxxx]
  // 【个性签名:xxxx】
  // 【个性签名：xxxx】
  pattern: /[\[【]个性签名[:：](.+?)[\]】]/,
  handler: async (match, content, { setMessages, character, chatId, refreshCharacter }) => {
    if (!character) {
      console.warn('⚠️ AI修改个性签名失败: 没有character信息')
      return { handled: false }
    }
    
    const newSignature = match[1].trim()
    
    console.log(`✏️ AI修改个性签名: ${newSignature}`)
    
    // 更新角色信息
    characterService.update(character.id, { signature: newSignature })
    
    // 🔥 立即刷新界面上的character
    if (refreshCharacter) {
      refreshCharacter()
    }
    
    // 创建系统消息
    const systemMsg: Message = {
      ...createMessage(`${character.nickname || character.realName}更改了个性签名为"${newSignature}"`, 'system'),
      aiReadableContent: `[系统通知：你将自己的个性签名改成了"${newSignature}"，用户会看到灰色小字提示]`,
      messageType: 'system'
    }
    await addMessage(systemMsg, setMessages, chatId)
    
    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 状态管理处理器
 * 支持格式：[状态:正在吃火锅] 或 [状态更新:躺在床上]
 */
export const statusHandler: CommandHandler = {
  pattern: /[\[【]状态(?:更新)?[:\：](.+?)[\]】]/,
  handler: async (match, content, { character }) => {
    if (!character) {
      console.warn('⚠️ 更新状态失败: 没有character信息')
      return { handled: false }
    }

    const newAction = match[1].trim()

    console.log(`💫 [AI状态] 更新状态: ${newAction}`)

    // 使用新的状态管理器
    const statusUpdate = extractStatusFromReply(match[0], character.id)
    if (statusUpdate) {
      setAIStatus(statusUpdate)
      console.log(`💫 [AI状态] 已保存状态:`, statusUpdate)
      
      // 如果有强制更新标记，清除它
      if (getForceUpdateFlag(character.id)) {
        clearForceUpdateFlag(character.id)
        console.log('✅ [状态修正] AI已响应状态修正要求，清除标记')
      }
    }

    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 一起听：AI发送邀请
 */
export const musicInviteHandler: CommandHandler = {
  pattern: /[\[【]一起听[:\：]\s*(.+?)[:\：]\s*(.+?)[\]】]/,
  handler: async (match, content, { setMessages, character, chatId, isBlocked, messages }) => {
    const songTitle = match[1].trim()
    const songArtist = match[2].trim()

    // 1️⃣ 先检查是否已经有用户发出的待处理一起听邀请
    const pendingUserInvite = messages
      .slice()
      .reverse()
      .find(msg =>
        msg.type === 'sent' &&
        (msg as any).musicInvite &&
        (msg as any).musicInvite.status === 'pending'
      ) as Message | undefined

    if (pendingUserInvite && (pendingUserInvite as any).musicInvite) {
      // ✅ 用户已经发过一起听卡片：AI 此时不再发送新卡，而是当作“接受邀请”

      // 更新邀请状态
      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === pendingUserInvite.id
            ? { ...msg, musicInvite: { ...(msg as any).musicInvite, status: 'accepted' as const } }
            : msg
        )
        saveMessages(chatId, updated)
        console.log('💾 [音乐邀请接受-来自指令] 已保存到IndexedDB')
        return updated
      })

      const inviteData = (pendingUserInvite as any).musicInvite

      // 保存一起听状态到 localStorage
      if (inviteData && chatId) {
        localStorage.setItem('listening_together', JSON.stringify({
          characterId: chatId,
          songTitle: inviteData.songTitle,
          songArtist: inviteData.songArtist,
          startTime: Date.now()
        }))
      }

      // 系统提示：AI 已加入一起听
      const systemMsg: Message = {
        id: Date.now() + Math.random(),
        type: 'system',
        content: `${character?.nickname || character?.realName}已加入一起听`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, systemMsg])

      // 触发播放器切歌
      window.dispatchEvent(
        new CustomEvent('change-song', {
          detail: {
            songTitle: inviteData.songTitle,
            songArtist: inviteData.songArtist
          }
        })
      )

      const remainingTextAfterAccept = content.replace(match[0], '').trim()
      return {
        handled: true,
        remainingText: remainingTextAfterAccept,
        skipTextMessage: !remainingTextAfterAccept
      }
    }

    // 2️⃣ 没有用户发出的邀请时，AI 正常发送一起听卡片
    const musicInviteMsg: Message = {
      id: Date.now() + Math.random(),
      type: 'received',
      messageType: 'musicInvite' as any,
      content: `${character?.nickname || character?.realName}想和你一起听《${songTitle}》`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      musicInvite: {
        songTitle,
        songArtist,
        songCover: '',
        inviterName: character?.nickname || character?.realName || 'AI',
        status: 'pending'
      },
      blockedByReceiver: isBlocked
    }

    setMessages(prev => {
      const updated = [...prev, musicInviteMsg]
      saveMessages(chatId, updated)
      console.log('💾 [音乐邀请] 已保存到IndexedDB')
      return updated
    })

    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 一起听：AI接受邀请（自然语言识别）
 */
export const musicAcceptHandler: CommandHandler = {
  pattern: /[\[【]接受一起听[\]】]|(好啊|走起|来吧|可以呀|行呀|好的|好嘛|好呀|走吧|听听|一起听吧|冲|安排|好滋|没问题|同意|接受)/,
  handler: async (match, content, { setMessages, character, messages, chatId }) => {
    // 检查是否有待处理的音乐邀请
    const pendingMusicInvite = messages.slice().reverse().find(msg => 
      msg.type === 'sent' && 
      (msg as any).musicInvite && 
      (msg as any).musicInvite.status === 'pending'
    )
    
    if (!pendingMusicInvite) {
      return { handled: false }
    }
    
    // 更新邀请状态为已接受
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === pendingMusicInvite.id
          ? { ...msg, musicInvite: { ...(msg as any).musicInvite, status: 'accepted' } }
          : msg
      )
      // 🔥 手动保存到IndexedDB
      saveMessages(chatId, updated)
      console.log('💾 [音乐邀请接受] 已保存到IndexedDB')
      return updated
    })
    
    // 保存一起听状态到localStorage
    const inviteData = (pendingMusicInvite as any).musicInvite
    if (inviteData && chatId) {
      localStorage.setItem('listening_together', JSON.stringify({
        characterId: chatId,
        songTitle: inviteData.songTitle,
        songArtist: inviteData.songArtist,
        startTime: Date.now()
      }))
    }
    
    // 添加系统提示
    const systemMsg: Message = {
      id: Date.now() + Math.random(),
      type: 'system',
      content: `${character?.nickname || character?.realName}已加入一起听`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, systemMsg])
    
    // 触发播放器切歌
    window.dispatchEvent(new CustomEvent('change-song', {
      detail: { 
        songTitle: inviteData.songTitle, 
        songArtist: inviteData.songArtist 
      }
    }))
    
    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 一起听：AI拒绝邀请（自然语言识别）
 */
export const musicRejectHandler: CommandHandler = {
  pattern: /[\[【]拒绝一起听[\]】]|^(不想听|下次吧|不听|算了|不要|不行|不了|pass|拒绝)[！!。，,、\s]*$/,
  handler: async (match, content, { setMessages, character, messages, chatId }) => {
    // 检查是否有待处理的音乐邀请
    const pendingMusicInvite = messages.slice().reverse().find(msg => 
      msg.type === 'sent' && 
      (msg as any).musicInvite && 
      (msg as any).musicInvite.status === 'pending'
    )
    
    if (!pendingMusicInvite) {
      return { handled: false }
    }
    
    // 更新邀请状态为已拒绝
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === pendingMusicInvite.id
          ? { ...msg, musicInvite: { ...(msg as any).musicInvite, status: 'rejected' } }
          : msg
      )
      // 🔥 手动保存到IndexedDB
      saveMessages(chatId, updated)
      console.log('💾 [音乐邀请拒绝] 已保存到IndexedDB')
      return updated
    })
    
    return {
      handled: true,
      remainingText: '',
      skipTextMessage: true
    }
  }
}

/**
 * 一起听：AI切歌
 */
export const changeSongHandler: CommandHandler = {
  pattern: /[\[【]切歌[:\：]\s*(.+?)[:\：]\s*(.+?)[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    const songTitle = match[1].trim()
    const songArtist = match[2].trim()

    // 无论当前是否在一起听，直接更新一起听状态并切歌
    const listeningState = {
      characterId: chatId,
      songTitle,
      songArtist,
      startTime: Date.now(),
      changedAt: Date.now()
    }
    localStorage.setItem('listening_together', JSON.stringify(listeningState))

    // 触发播放器更新事件（MusicPlayerContext 会负责搜索+获取 URL+播放）
    window.dispatchEvent(
      new CustomEvent('change-song', {
        detail: { songTitle, songArtist }
      })
    )

    // 发送系统消息
    const systemMsg: Message = {
      id: Date.now() + Math.random(),
      type: 'system',
      content: `${character?.nickname || character?.realName}切换歌曲为《${songTitle}》- ${songArtist}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }

    setMessages(prev => {
      const updated = [...prev, systemMsg]
      saveMessages(chatId, updated)
      console.log('💾 [切歌] 系统消息已保存到IndexedDB')
      return updated
    })

    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * AI随笔处理器
 * 🔥 支持全角和半角方括号：[随笔:...] 或 【随笔：...】
 * 系统自动添加时间戳，AI只需写内容即可
 */
export const aiMemoHandler: CommandHandler = {
  pattern: /[\[【]随笔[:\：]([^\]】]+)[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    console.log('🎯 [随笔处理器] 被调用!', { match: match[0], content })
    
    if (!character) return { handled: false }
    
    const noteContent = match[1].trim()
    
    // 添加到随笔（系统自动生成时间戳）
    addAIMemo(character.id, character.nickname || character.realName, noteContent)
    
    console.log(`📝 ${character.nickname || character.realName} 写随笔:`, noteContent)
    
    // 创建系统提示消息（用户和AI都能看到）
    const systemMsg = createMessageObj('system', {
      content: `${character.nickname || character.realName} 在小本子上记了点东西`,
      aiReadableContent: `✅ 已记录到你的小本子：${noteContent}`,
      type: 'system',
      messageType: 'ai-memo',  // 标记为AI随笔类型
      memoContent: noteContent  // 保存随笔内容用于显示
    })
    await addMessage(systemMsg, setMessages, chatId)
    
    // 移除随笔指令，保留其他文本
    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * AI换头像处理器
 * 支持三种方式：
 * 1. [换头像:生成:描述] - AI生成新头像
 * 2. [换头像:用户头像] - 使用用户的头像
 * 3. [换头像:图片:消息ID] - 使用某条消息中的图片
 */
export const changeAvatarHandler: CommandHandler = {
  pattern: /[\[【]换头像[:\：](.+?)[\]】]/,
  handler: async (match, content, { character, setMessages, chatId, messages, refreshCharacter }) => {
    if (!character) return { handled: false }

    const param = match[1].trim()
    console.log('🖼️ [AI换头像] 参数:', param)

    let newAvatar: string | null = null
    let usedPrompt = ''

    // 方式1: 生成新头像
    if (param.startsWith('生成:') || param.startsWith('生成：')) {
      const description = param.replace(/^生成[:\：]/, '').trim()
      console.log('🎨 [AI换头像] 生成新头像，描述:', description)

      newAvatar = await generateAvatarForAI(description)
      usedPrompt = description

      if (!newAvatar) {
        console.error('❌ [AI换头像] 生成失败，添加降级提示')
        // 🔥 降级处理：生成失败时，添加系统消息但继续处理，不中断AI回复
        const failMsg = createMessageObj('system', {
          content: `${character.nickname || character.realName} 想换头像，但生成失败了`,
          aiReadableContent: `[系统通知：头像生成失败，可能是网络问题或API不可用]`,
          type: 'system'
        })
        await addMessage(failMsg, setMessages, chatId)
        // 继续处理，不返回 handled: false
        newAvatar = null
      }
    }
    // 方式2: 使用用户头像
    else if (param === '用户头像' || param === '对方头像') {
      console.log('👤 [AI换头像] 使用用户头像')
      const userInfo = getUserInfo()

      if (!userInfo.avatar) {
        console.warn('⚠️ [AI换头像] 用户未设置头像')
        return { handled: false }
      }

      newAvatar = userInfo.avatar
      usedPrompt = '使用用户头像'
    }
    // 方式3: 使用消息中的图片
    else if (param.startsWith('图片:') || param.startsWith('图片：')) {
      const messageIdStr = param.replace(/^图片[:\：]/, '').trim()
      
      console.log('🖼️ [AI换头像] 使用消息图片，ID字符串:', messageIdStr)

      // 🔥 支持数字ID和字符串ID（如 msg-xxx）
      let targetMessage = null
      
      // 先尝试按数字ID查找
      const numericId = parseInt(messageIdStr)
      if (!isNaN(numericId)) {
        targetMessage = messages.find(m => m.id === numericId)
      }
      
      // 如果没找到，尝试按字符串ID查找（兼容 msg-xxx 格式）
      if (!targetMessage) {
        targetMessage = messages.find(m => String(m.id) === messageIdStr || (m as any).clientMessageId === messageIdStr)
      }
      
      // 🔥 检查消息是否存在
      if (!targetMessage) {
        console.warn('⚠️ [AI换头像] 未找到消息，ID:', messageIdStr)
        const failMsg = createMessageObj('system', {
          content: `${character.nickname || character.realName} 想换头像，但没找到那张图片`,
          aiReadableContent: `[系统通知：换头像失败，未找到指定的图片消息]`,
          type: 'system'
        })
        await addMessage(failMsg, setMessages, chatId)
        
        const remainingText = content.replace(match[0], '').trim()
        return {
          handled: true,  // 🔥 标记为已处理，避免指令文本显示
          remainingText,
          skipTextMessage: !remainingText
        }
      }
      
      // 🔥 检查消息是否有图片（支持 images 数组或 photoBase64）
      const hasImages = (targetMessage as any).images && (targetMessage as any).images.length > 0
      const hasPhotoBase64 = targetMessage.photoBase64
      
      if (!hasImages && !hasPhotoBase64) {
        console.warn('⚠️ [AI换头像] 消息没有图片，ID:', messageIdStr)
        const failMsg = createMessageObj('system', {
          content: `${character.nickname || character.realName} 想换头像，但那条消息没有图片`,
          aiReadableContent: `[系统通知：换头像失败，指定的消息不包含图片]`,
          type: 'system'
        })
        await addMessage(failMsg, setMessages, chatId)
        
        const remainingText = content.replace(match[0], '').trim()
        return {
          handled: true,
          remainingText,
          skipTextMessage: !remainingText
        }
      }

      // 🔥 优先使用 images 数组，否则使用 photoBase64
      if (hasImages) {
        newAvatar = (targetMessage as any).images[0].url
      } else if (hasPhotoBase64) {
        // 如果是 base64 格式，需要转换为完整的 data URL
        const base64Data = hasPhotoBase64.startsWith('data:') 
          ? hasPhotoBase64 
          : `data:image/jpeg;base64,${hasPhotoBase64}`
        newAvatar = base64Data
      }
      
      usedPrompt = '使用聊天图片'
    }
    else {
      console.warn('⚠️ [AI换头像] 未知参数格式:', param)
      // 🔥 未知格式也添加系统提示
      const failMsg = createMessageObj('system', {
        content: `${character.nickname || character.realName} 想换头像，但指令格式不对`,
        aiReadableContent: `[系统通知：换头像失败，指令格式错误]`,
        type: 'system'
      })
      await addMessage(failMsg, setMessages, chatId)
      
      const remainingText = content.replace(match[0], '').trim()
      return {
        handled: true,  // 🔥 标记为已处理
        remainingText,
        skipTextMessage: !remainingText
      }
    }

    // 更新AI头像
    if (newAvatar) {
      characterService.update(character.id, { avatar: newAvatar })
      console.log('✅ [AI换头像] 头像更换成功')

      // 保存头像指纹（用于检测头像变化）
      localStorage.setItem(`character_avatar_fingerprint_${character.id}`, newAvatar.substring(0, 200))
      localStorage.setItem(`character_avatar_recognized_at_${character.id}`, Date.now().toString())

      // 使用生成时的提示词作为描述
      if (usedPrompt) {
        localStorage.setItem(`character_avatar_description_${character.id}`, usedPrompt)
      }

      // 🔥 同步更新情侣空间头像
      const { getCoupleSpaceRelation } = await import('../../../utils/coupleSpaceUtils')
      const relation = getCoupleSpaceRelation()
      if (relation && relation.characterId === character.id && relation.status === 'active') {
        relation.characterAvatar = newAvatar
        localStorage.setItem('couple_space_relation', JSON.stringify(relation))
        console.log('✅ [AI换头像] 已同步更新情侣空间头像')
      }

      // 刷新角色信息
      if (refreshCharacter) {
        refreshCharacter()
      }

      // 添加系统消息
      const systemMsg = createMessageObj('system', {
        content: `${character.nickname || character.realName} 更换了头像`,
        aiReadableContent: `[系统通知：你成功更换了头像]`,
        type: 'system',
        avatarPrompt: usedPrompt
      })
      await addMessage(systemMsg, setMessages, chatId)
    }

    const remainingText = content.replace(match[0], '').trim()
    return {
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 代付：AI同意代付
 */
export const acceptPaymentHandler: CommandHandler = {
  pattern: /[\[【]同意代付[\]】]/,
  handler: async (match, content, { setMessages, character, messages, chatId }) => {
    console.log('💰 [同意代付] 处理器被调用')
    
    // 查找最近的待确认代付请求
    const pendingPayment = messages.slice().reverse().find(msg => 
      msg.type === 'sent' && 
      msg.messageType === 'paymentRequest' &&
      msg.paymentRequest?.status === 'pending' &&
      msg.paymentRequest?.paymentMethod === 'ai'
    )
    
    if (!pendingPayment || !pendingPayment.paymentRequest) {
      console.warn('⚠️ [同意代付] 未找到待确认的代付请求')
      // 🔥 移除指令但不报错，避免AI重复发送
      const remainingText = content.replace(match[0], '').trim()
      return { 
        handled: true,
        remainingText,
        skipTextMessage: !remainingText
      }
    }
    
    // 🔥 防止重复：检查最近3秒内是否已经有相同的代付成功系统消息
    const recentSystemMsgs = messages.filter(msg => 
      msg.type === 'system' &&
      msg.messageType === 'system' &&
      msg.timestamp && Date.now() - msg.timestamp < 3000
    )
    const hasSamePayment = recentSystemMsgs.some(msg => {
      const content = msg.content || ''
      return content.includes('已代付') && content.includes(pendingPayment.paymentRequest!.itemName)
    })
    if (hasSamePayment) {
      console.warn('⚠️ [同意代付] 检测到重复处理，忽略')
      const remainingText = content.replace(match[0], '').trim()
      return { 
        handled: true,
        remainingText,
        skipTextMessage: !remainingText
      }
    }
    
    console.log('✅ [同意代付] 找到待确认的代付请求:', pendingPayment.paymentRequest)
    
    // 更新代付状态为已支付
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === pendingPayment.id && msg.paymentRequest
          ? { ...msg, paymentRequest: { ...msg.paymentRequest, status: 'paid' as const } }
          : msg
      )
      
      // 🔥 防止重复：检查是否已经存在相同的系统消息
      const systemMsgContent = `${character?.nickname || character?.realName || 'AI'} 已代付 ${pendingPayment.paymentRequest!.itemName} ¥${pendingPayment.paymentRequest!.amount.toFixed(2)}`
      const hasSystemMsg = updated.some(msg => 
        msg.type === 'system' && 
        msg.content === systemMsgContent
      )
      
      if (hasSystemMsg) {
        console.warn('⚠️ [同意代付] 系统消息已存在，跳过创建')
        return updated
      }
      
      // 添加系统消息
      const systemMsg: Message = {
        id: Date.now(),
        type: 'system',
        content: systemMsgContent,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'system'
      }
      
      const finalUpdated = [...updated, systemMsg]
      saveMessages(chatId, finalUpdated)
      console.log('💾 [同意代付] 已保存到IndexedDB')
      return finalUpdated
    })
    
    return {
      handled: true,
      hideCommand: true,
      shouldRespond: false
    }
  }
}

/**
 * 代付：AI拒绝代付
 */
export const rejectPaymentHandler: CommandHandler = {
  pattern: /[\[【]拒绝代付[\]】]/,
  handler: async (match, content, { setMessages, character, messages, chatId }) => {
    console.log('💰 [拒绝代付] 处理器被调用')
    
    // 查找最近的待确认代付请求
    const pendingPayment = messages.slice().reverse().find(msg => 
      msg.type === 'sent' && 
      msg.messageType === 'paymentRequest' &&
      msg.paymentRequest?.status === 'pending' &&
      msg.paymentRequest?.paymentMethod === 'ai'
    )
    
    if (!pendingPayment || !pendingPayment.paymentRequest) {
      console.warn('⚠️ [拒绝代付] 未找到待确认的代付请求')
      return { handled: false }
    }
    
    console.log('❌ [拒绝代付] 找到待确认的代付请求:', pendingPayment.paymentRequest)
    
    // 更新代付状态为已拒绝
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === pendingPayment.id && msg.paymentRequest
          ? { ...msg, paymentRequest: { ...msg.paymentRequest, status: 'rejected' as const } }
          : msg
      )
      
      // 添加系统消息
      const systemMsg: Message = {
        id: Date.now(),
        type: 'system',
        content: `${character?.nickname || character?.realName || 'AI'} 拒绝了代付请求`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        messageType: 'system'
      }
      
      const finalUpdated = [...updated, systemMsg]
      saveMessages(chatId, finalUpdated)
      console.log('💾 [拒绝代付] 已保存到IndexedDB')
      return finalUpdated
    })
    
    return { 
      handled: true,
      hideCommand: true,
      shouldRespond: false
    }
  }
}

/**
 * AI主动点外卖
 * 格式：[外卖:商品1,价格1,商品2,价格2:备注]
 * 示例：[外卖:奶茶,19,排骨汤,88:多吃点宝宝]
 */
export const aiOrderFoodHandler: CommandHandler = {
  pattern: /[\[【]外卖[:：]([^:：\]】]+)(?:[:：]([^\]】]+))?[\]】]/,
  handler: async (match, content, { setMessages, character, messages, chatId }) => {
    console.log('🍔 [AI点外卖] 处理器被调用')
    
    const itemsStr = match[1]
    const note = match[2] || ''
    
    // 解析商品列表：商品1,价格1,商品2,价格2
    const parts = itemsStr.split(',').map(s => s.trim())
    if (parts.length < 2 || parts.length % 2 !== 0) {
      console.warn('⚠️ [AI点外卖] 格式错误，应为：商品1,价格1,商品2,价格2')
      return { handled: false }
    }
    
    // 解析商品和价格
    const items: { name: string; price: number }[] = []
    let totalAmount = 0
    
    for (let i = 0; i < parts.length; i += 2) {
      const name = parts[i]
      const priceStr = parts[i + 1]
      const price = parseFloat(priceStr)
      
      if (isNaN(price)) {
        console.warn(`⚠️ [AI点外卖] 价格解析失败: ${priceStr}`)
        return { handled: false }
      }
      
      items.push({ name, price })
      totalAmount += price
    }
    
    // 生成商品列表描述
    const itemNames = items.map(item => `${item.name} ¥${item.price.toFixed(2)}`).join('、')
    
    console.log('✅ [AI点外卖] 解析成功:', { items, totalAmount, note })
    
    // 生成唯一ID（使用时间戳 + 随机数）
    const baseTimestamp = Date.now()
    const paymentMessageId = baseTimestamp + Math.floor(Math.random() * 1000)
    const systemMessageId = baseTimestamp + 1000 + Math.floor(Math.random() * 1000)
    
    // 创建代付消息（AI给用户点外卖，状态直接为已支付）
    const paymentMessage: Message = {
      id: paymentMessageId,
      type: 'received',
      content: `[外卖] ${itemNames}`,
      aiReadableContent: `[AI给用户点外卖] 商品：${itemNames}，总金额：¥${totalAmount.toFixed(2)}${note ? `，备注：${note}` : ''}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: baseTimestamp,
      messageType: 'paymentRequest',
      paymentRequest: {
        itemName: items.map(item => item.name).join('、'),
        amount: totalAmount,
        note: note || undefined,
        paymentMethod: 'ai',
        status: 'paid',
        requesterId: character?.id || 'ai',
        requesterName: character?.nickname || character?.realName || 'AI',
        payerId: character?.id || 'ai',
        payerName: character?.nickname || character?.realName || 'AI'
      }
    }
    
    // 添加系统消息
    const systemMsg: Message = {
      id: systemMessageId,
      type: 'system',
      content: `${character?.nickname || character?.realName || 'AI'} 给你点了外卖：${itemNames}，共 ¥${totalAmount.toFixed(2)}${note ? `（${note}）` : ''}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: baseTimestamp + 1,
      messageType: 'system'
    }
    
    setMessages(prev => {
      const updated = [...prev, paymentMessage, systemMsg]
      saveMessages(chatId, updated)
      console.log('💾 [AI点外卖] 已保存到IndexedDB')
      return updated
    })
    
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * AI请求代付处理器
 * 格式：[代付:商品1,价格1,商品2,价格2:备注]
 */
export const aiRequestPaymentHandler: CommandHandler = {
  pattern: /[\[【]代付[:：]([^:：\]】]+)(?:[:：]([^\]】]+))?[\]】]/,
  handler: async (match, content, { setMessages, character, messages, chatId }) => {
    console.log('💳 [AI请求代付] 处理器被调用')
    
    const itemsStr = match[1]
    const note = match[2] || ''
    
    // 🔥 防止重复：检查最近5秒内是否有相同的代付请求
    const recentPayments = messages.filter(msg => 
      msg.messageType === 'paymentRequest' && 
      msg.type === 'received' &&
      msg.timestamp && Date.now() - msg.timestamp < 5000
    )
    if (recentPayments.length > 0) {
      const hasSameRequest = recentPayments.some(msg => {
        const content = msg.content || ''
        return content.includes(itemsStr)
      })
      if (hasSameRequest) {
        console.warn('⚠️ [AI请求代付] 检测到重复请求，忽略')
        const remainingText = content.replace(match[0], '').trim()
        return { 
          handled: true,
          remainingText,
          skipTextMessage: !remainingText
        }
      }
    }
    
    // 解析商品列表：商品1,价格1,商品2,价格2
    const parts = itemsStr.split(',').map(s => s.trim())
    if (parts.length < 2 || parts.length % 2 !== 0) {
      console.warn('⚠️ [AI请求代付] 格式错误，应为：商品1,价格1,商品2,价格2')
      return { handled: false }
    }
    
    // 解析商品和价格
    const items: { name: string; price: number }[] = []
    let totalAmount = 0
    
    for (let i = 0; i < parts.length; i += 2) {
      const name = parts[i]
      const priceStr = parts[i + 1]
      const price = parseFloat(priceStr)
      
      if (isNaN(price)) {
        console.warn(`⚠️ [AI请求代付] 价格解析失败: ${priceStr}`)
        return { handled: false }
      }
      
      items.push({ name, price })
      totalAmount += price
    }
    
    // 生成商品列表描述
    const itemNames = items.map(item => `${item.name} ¥${item.price.toFixed(2)}`).join('、')
    
    console.log('✅ [AI请求代付] 解析成功:', { items, totalAmount, note })
    
    // 生成唯一ID（使用时间戳 + 随机数）
    const baseTimestamp = Date.now()
    const paymentMessageId = baseTimestamp + Math.floor(Math.random() * 1000)
    
    // 创建代付请求消息（AI向用户请求代付，状态为待确认）
    const paymentMessage: Message = {
      id: paymentMessageId,
      type: 'received',
      content: `[代付请求] ${itemNames}`,
      aiReadableContent: `[AI请求用户代付] 商品：${itemNames}，总金额：¥${totalAmount.toFixed(2)}${note ? `，备注：${note}` : ''}，等待用户确认`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: baseTimestamp,
      messageType: 'paymentRequest',
      paymentRequest: {
        itemName: items.map(item => item.name).join('、'),
        amount: totalAmount,
        note: note || undefined,
        paymentMethod: 'ai',
        status: 'pending',
        requesterId: character?.id || 'ai',
        requesterName: character?.nickname || character?.realName || 'AI',
        payerId: 'user',
        payerName: '我'
      }
    }
    
    setMessages(prev => {
      const updated = [...prev, paymentMessage]
      saveMessages(chatId, updated)
      console.log('💾 [AI请求代付] 已保存到IndexedDB')
      return updated
    })
    
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * AI发送帖子处理器
 * 格式：[帖子:帖子内容]
 */
export const postHandler: CommandHandler = {
  pattern: /[\[【]帖子[:：]([^\]】]+)[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    console.log('📋 [AI发送帖子] 处理器被调用')
    
    const postContent = match[1].trim()
    
    if (!postContent) {
      console.warn('⚠️ [AI发送帖子] 帖子内容为空')
      return { handled: false }
    }
    
    console.log('✅ [AI发送帖子] 帖子内容:', postContent)
    
    // 生成唯一ID
    const postMessageId = generateMessageId()
    
    // 创建帖子卡片消息
    const postMsg: Message = {
      id: postMessageId,
      type: 'received',
      content: postContent,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'post',
      post: {
        content: postContent,
        prompt: `${character?.nickname || character?.realName || 'AI'} 分享的帖子`
      }
    }
    
    await addMessage(postMsg, setMessages, chatId)
    
    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true,
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 所有指令处理器
 */
export const commandHandlers: CommandHandler[] = [
  transferHandler,
  receiveTransferHandler,
  rejectTransferHandler,
  intimatePayHandler,
  acceptIntimatePayHandler,
  rejectIntimatePayHandler,
  acceptPaymentHandler,  // AI同意代付
  rejectPaymentHandler,  // AI拒绝代付
  aiOrderFoodHandler,  // AI主动点外卖
  aiRequestPaymentHandler,  // AI请求用户代付
  postHandler,  // AI发送帖子
  videoCallHandler,
  endCallHandler,
  aiMuteHandler,  // AI静音
  aiUnmuteHandler,  // AI取消静音
  aiCameraOffHandler,  // AI关闭摄像头
  aiCameraOnHandler,  // AI打开摄像头
  voiceHandler,
  locationHandler,
  photoHandler,
  emojiHandler,
  recallHandler,
  blockUserHandler,
  unblockUserHandler,
  changeNicknameHandler,
  changeSignatureHandler,
  statusHandler,  // AI更新状态
  coupleSpaceInviteHandler,
  coupleSpaceAcceptHandler,
  coupleSpaceRejectHandler,
  musicInviteHandler,  // AI发送一起听邀请
  musicAcceptHandler,  // AI接受一起听
  musicRejectHandler,  // AI拒绝一起听
  changeSongHandler,  // AI切歌
  coupleSpacePhotoHandler,
  coupleSpaceMessageHandler,
  coupleSpaceAnniversaryHandler,
  coupleSpaceEndHandler,  // 解除情侣空间
  aiMemoHandler,  // AI备忘录
  quoteHandler,
  changeAvatarHandler  // AI换头像
]
