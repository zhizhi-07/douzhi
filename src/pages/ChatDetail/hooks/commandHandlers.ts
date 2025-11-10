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
  pattern: /[\[【]接收转账[\]】]/,
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
  pattern: /[\[【]退还转账[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    setMessages(prev => {
      const lastPending = [...prev].reverse().find(
        msg => msg.messageType === 'transfer' && msg.type === 'sent' && msg.transfer?.status === 'pending'
      )

      if (!lastPending) return prev

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
 */
export const locationHandler: CommandHandler = {
  pattern: /[\[【]位置[:\：](.+?)(?:[:\：]|[\s]*-[\s]*)(.+?)[\]】]/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    const locationName = match[1].trim()
    const locationAddress = match[2].trim()

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
  pattern: /[\[【]照片[:\：](.+?)[\]】]/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    const photoDescription = match[1]

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
 * AI根据描述查找匹配的表情包发送
 */
export const emojiHandler: CommandHandler = {
  pattern: /[\[【]表情(?:包)?[:\：](.+?)[\]】]/,
  handler: async (match, content, { setMessages, chatId, isBlocked }) => {
    const emojiDesc = match[1].trim()
    
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
      console.log(`⚠️ 未找到匹配"${emojiDesc}"的表情包`)
      // 如果找不到匹配的表情包，转为普通文本
      return {
        handled: false
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

/**
 * 引用指令处理器
 */
export const quoteHandler: CommandHandler = {
  pattern: /[\[【]引用[:\：]\s*(.+?)[\]】]/,
  handler: async (match, content, { messages, character }) => {
    const quoteRef = match[1].trim()
    let quotedMsg: Message['quotedMessage'] | undefined

    const currentMessages = messages
    let quoted: Message | undefined

    const quotedId = parseInt(quoteRef)
    if (!isNaN(quotedId)) {
      quoted = currentMessages.find(m => m.id === quotedId)
    } else {
      let lowerRef = quoteRef.toLowerCase()
      
      // 提取引号内的内容作为关键词
      const quoteMatch = quoteRef.match(/["「『"'"](.+?)["」』"'"]/)
      if (quoteMatch) {
        lowerRef = quoteMatch[1].toLowerCase()
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
        // 模糊搜索消息内容
        quoted = [...currentMessages].reverse().find(m => {
          const msgContent = (m.content || m.voiceText || m.photoDescription || m.emoji?.description || '').toLowerCase()
          return msgContent.includes(lowerRef)
        })
      }
    }

    if (quoted) {
      quotedMsg = {
        id: quoted.id,
        content: quoted.content || quoted.voiceText || quoted.photoDescription || quoted.location?.name || quoted.emoji?.description || '特殊消息',
        senderName: quoted.type === 'sent' ? '我' : (character?.realName || 'AI'),
        type: quoted.type === 'system' ? 'sent' : quoted.type
      }
    }

    // 保留引用指令后的所有内容（不要trim，保持原样）
    const remainingText = content.replace(match[0], '')
    return { 
      handled: true, 
      quotedMsg, 
      messageContent: remainingText
    }
  }
}

/**
 * 亲密付指令处理器
 */
export const intimatePayHandler: CommandHandler = {
  pattern: /[\[【]亲密付[:\：]\s*(\d+\.?\d*)[\]】]/,
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
  handler: async (match, content, { setMessages, character, chatId }) => {
    let monthlyLimit = 0
    
    setMessages(prev => {
      const lastPending = [...prev].reverse().find(
        msg => msg.messageType === 'intimatePay' && msg.type === 'sent' && msg.intimatePay?.status === 'pending'
      )

      if (!lastPending || !lastPending.intimatePay) return prev
      
      // 保存信息用于创建亲密付关系
      monthlyLimit = lastPending.intimatePay.monthlyLimit

      return prev.map(msg =>
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
    })

    // 创建亲密付关系（用户给AI开通，AI接受，类型是 user_to_character）
    if (monthlyLimit > 0 && character) {
      createIntimatePayRelation(
        character.id,
        character.nickname || character.realName,
        monthlyLimit,
        character.avatar,
        'user_to_character'
      )
    }

    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: '对方已接受亲密付',
      aiReadableContent: `${character?.nickname || character?.realName || '对方'}接受了你的亲密付邀请`,
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
 * 拒绝亲密付指令处理器
 */
export const rejectIntimatePayHandler: CommandHandler = {
  pattern: /[\[【]拒绝亲密付[\]】]/,
  handler: async (match, content, { setMessages, chatId, character }) => {
    setMessages(prev => {
      const lastPending = [...prev].reverse().find(
        msg => msg.messageType === 'intimatePay' && msg.type === 'sent' && msg.intimatePay?.status === 'pending'
      )

      if (!lastPending) return prev

      return prev.map(msg =>
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
    })

    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: '对方已拒绝亲密付',
      aiReadableContent: `${character?.nickname || character?.realName || '对方'}拒绝了你的亲密付邀请`,
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
 * 拉黑用户指令处理器
 */
export const blockUserHandler: CommandHandler = {
  pattern: /[\[【]拉黑用户[\]】]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    if (!character) return { handled: false }
    
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
  pattern: /\[个性签名:(.+?)\]/,
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
 */
export const statusHandler: CommandHandler = {
  pattern: /[\[【]状态[:\：](.+?)[\]】]/,
  handler: async (match, content, { character, refreshCharacter }) => {
    if (!character) {
      console.warn('⚠️ 更新状态失败: 没有character信息')
      return { handled: false }
    }
    
    const newActivity = match[1].trim()
    
    console.log(`🎭 AI更新状态: ${newActivity}`)
    
    // 更新角色状态
    characterService.update(character.id, { currentActivity: newActivity })
    
    // 🔥 立即刷新界面上的character
    if (refreshCharacter) {
      refreshCharacter()
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
  handler: async (match, content, { setMessages, character, chatId, isBlocked }) => {
    const songTitle = match[1].trim()
    const songArtist = match[2].trim()
    
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
    
    // 🔥 手动保存到IndexedDB
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
  pattern: /(好啊|走起|来吧|可以呀|行呀|好的|好嘛|好呀|走吧|听听|一起听吧|冲|安排|好滋|没问题|同意|接受)/,
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
  pattern: /^(不想听|下次吧|不听|算了|不要|不行|不了|pass|拒绝)[！!。，,、\s]*$/,
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
    
    // 检查是否正在一起听
    const listeningData = localStorage.getItem('listening_together')
    if (!listeningData) {
      return { handled: false }
    }
    
    try {
      const data = JSON.parse(listeningData)
      if (data.characterId !== chatId) {
        return { handled: false }
      }
      
      // 更新一起听状态
      localStorage.setItem('listening_together', JSON.stringify({
        ...data,
        songTitle,
        songArtist,
        changedAt: Date.now()
      }))
      
      // 触发播放器更新事件
      window.dispatchEvent(new CustomEvent('change-song', {
        detail: { songTitle, songArtist }
      }))
      
      // 发送系统消息
      const systemMsg: Message = {
        id: Date.now() + Math.random(),
        type: 'system',
        content: `${character?.nickname || character?.realName}切换歌曲为《${songTitle}》- ${songArtist}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      }
      
      setMessages(prev => [...prev, systemMsg])
      
      const remainingText = content.replace(match[0], '').trim()
      return {
        handled: true,
        remainingText,
        skipTextMessage: !remainingText
      }
    } catch (e) {
      return { handled: false }
    }
  }
}

/**
 * AI随笔处理器
 */
export const aiMemoHandler: CommandHandler = {
  pattern: /\[随笔:(.*?)\]/,
  handler: async (match, content, { setMessages, character, chatId }) => {
    if (!character) return { handled: false }
    
    const noteContent = match[1].trim()
    
    // 添加到随笔
    addAIMemo(character.id, character.nickname || character.realName, noteContent)
    
    console.log(`📝 ${character.nickname || character.realName} 写随笔:`, noteContent)
    
    // 创建系统提示消息（用户和AI都能看到）
    const systemMsg = createMessageObj('system', {
      content: `${character.nickname || character.realName} 在小本子上记了点东西`,
      aiReadableContent: `✅ 已记录到你的小本子：${noteContent}`,
      type: 'system'
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
 * 所有指令处理器
 */
export const commandHandlers: CommandHandler[] = [
  transferHandler,
  receiveTransferHandler,
  rejectTransferHandler,
  intimatePayHandler,
  acceptIntimatePayHandler,
  rejectIntimatePayHandler,
  videoCallHandler,
  endCallHandler,
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
  quoteHandler
]
