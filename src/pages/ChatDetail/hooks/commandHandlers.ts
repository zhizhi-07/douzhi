/**
 * AI指令处理器
 * 统一处理所有AI指令，消除重复代码
 */

import type { Message, Character } from '../../../types/chat'
import { 
  getCoupleSpaceRelation, 
  acceptCoupleSpaceInvite, 
  rejectCoupleSpaceInvite,
  createCoupleSpaceInvite
} from '../../../utils/coupleSpaceUtils'
import { addCouplePhoto, addCoupleMessage, addCoupleAnniversary } from '../../../utils/coupleSpaceContentUtils'
import { createIntimatePayRelation } from '../../../utils/walletUtils'
import { blacklistManager } from '../../../utils/blacklistManager'
import { getEmojis } from '../../../utils/emojiStorage'

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
  character: Character | null
  onVideoCallRequest?: (openingLines?: string | null) => void
  onEndCall?: () => void
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
 */
const addMessage = async (
  message: Message,
  setMessages: (fn: (prev: Message[]) => Message[]) => void
) => {
  await delay(300)
  setMessages(prev => [...prev, message])
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
 */
const createMessageObj = (type: Message['messageType'], data: any): Message => {
  return {
    id: generateMessageId(),
    type: 'received',
    content: '',
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: Date.now(),
    messageType: type,
    ...data
  }
}

/**
 * 转账指令处理器
 */
export const transferHandler: CommandHandler = {
  pattern: /[\[【]转账[:\：]\s*[¥￥]?\s*(\d+\.?\d*)\s*(?:[:\：]?\s*说明[:\：]?\s*)?(.*?)[\]】]/,
  handler: async (match, content, { setMessages }) => {
    const amount = parseFloat(match[1])
    let transferMessage = (match[2] || '').trim()
    transferMessage = transferMessage.replace(/^[:\：\s]+/, '')

    const transferMsg = createMessageObj('transfer', {
      transfer: {
        amount,
        message: transferMessage,
        status: 'pending'
      }
    })

    await addMessage(transferMsg, setMessages)

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
  handler: async (match, content, { setMessages, character }) => {
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
      type: 'system'
    })
    await addMessage(systemMsg, setMessages)

    const remainingText = content.replace(match[0], '').trim()
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: !remainingText
    }
  }
}

/**
 * 退还转账指令处理器
 */
export const rejectTransferHandler: CommandHandler = {
  pattern: /[\[【]退还转账[\]】]/,
  handler: async (match, content, { setMessages, character }) => {
    setMessages(prev => {
      const lastPending = [...prev].reverse().find(
        msg => msg.messageType === 'transfer' && msg.type === 'sent' && msg.transfer?.status === 'pending'
      )

      if (!lastPending) return prev

      return prev.map(msg =>
        msg.id === lastPending.id
          ? { ...msg, transfer: { ...msg.transfer!, status: 'expired' as const } }
          : msg
      )
    })

    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: '对方已退还',
      type: 'system'
    })
    await addMessage(systemMsg, setMessages)

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
    
    if (onVideoCallRequest) {
      onVideoCallRequest()
    }

    const remainingText = content.replace(match[0], '').trim()
    const shouldSkip = !remainingText
    
    console.log('📞 视频通话处理结果:', { remainingText, shouldSkip })
    
    return { 
      handled: true, 
      remainingText,
      skipTextMessage: shouldSkip
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
 */
export const voiceHandler: CommandHandler = {
  pattern: /[\[【]语音[:\：](.+?)[\]】]/,
  handler: async (match, content, { setMessages }) => {
    const voiceText = match[1]

    const voiceMsg = createMessageObj('voice', {
      voiceText
    })

    await addMessage(voiceMsg, setMessages)

    const remainingText = content.replace(match[0], '').trim()
    
    console.log('🎤 语音指令处理:', { voiceText, remainingText, hasRemaining: !!remainingText })
    
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
  handler: async (match, content, { setMessages }) => {
    const locationName = match[1].trim()
    const locationAddress = match[2].trim()

    const locationMsg = createMessageObj('location', {
      location: {
        name: locationName,
        address: locationAddress
      }
    })

    await addMessage(locationMsg, setMessages)

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
  handler: async (match, content, { setMessages }) => {
    const photoDescription = match[1]

    const photoMsg = createMessageObj('photo', {
      photoDescription
    })

    await addMessage(photoMsg, setMessages)

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
  handler: async (match, content, { setMessages }) => {
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
      })
      
      await addMessage(emojiMsg, setMessages)
      console.log(`✅ AI发送表情包: ${matchedEmoji.description}`)
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
  handler: async (match, content, { setMessages, character }) => {
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


      return prev.map(msg =>
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
  handler: async (match, content, { setMessages, character }) => {
    if (!character) return { handled: false }
    
    const success = acceptCoupleSpaceInvite(character.id)
    
    if (success) {
      // 更新邀请卡片状态
      setMessages(prev => prev.map(msg => 
        msg.coupleSpaceInvite && msg.coupleSpaceInvite.status === 'pending'
          ? { ...msg, coupleSpaceInvite: { ...msg.coupleSpaceInvite, status: 'accepted' as const } }
          : msg
      ))
      
      // 添加系统消息
      const systemMsg = createMessageObj('system', {
        content: `${character.nickname || character.realName} 接受了你的情侣空间邀请`,
        type: 'system'
      })
      await addMessage(systemMsg, setMessages)
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
  handler: async (match, content, { setMessages, character }) => {
    if (!character) return { handled: false }
    
    const success = rejectCoupleSpaceInvite(character.id)
    
    if (success) {
      // 更新邀请卡片状态
      setMessages(prev => prev.map(msg => 
        msg.coupleSpaceInvite && msg.coupleSpaceInvite.status === 'pending'
          ? { ...msg, coupleSpaceInvite: { ...msg.coupleSpaceInvite, status: 'rejected' as const } }
          : msg
      ))
      
      // 添加系统消息
      const systemMsg = createMessageObj('system', {
        content: `${character.nickname || character.realName} 拒绝了你的情侣空间邀请`,
        type: 'system'
      })
      await addMessage(systemMsg, setMessages)
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
  handler: async (match, content, { setMessages, character }) => {
    if (!character) return { handled: false }
    
    // 检查是否可以发送邀请
    const relation = getCoupleSpaceRelation()
    if (relation) {
      // 已有情侣空间关系
      let message = ''
      const charName = character.nickname || character.realName
      
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
        type: 'system'
      })
      await addMessage(systemMsg, setMessages)
      
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
      character.avatar
    )
    
    if (!newRelation) {
      // 添加失败消息
      const systemMsg = createMessageObj('system', {
        content: '无法发送邀请',
        type: 'system'
      })
      await addMessage(systemMsg, setMessages)
      
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
    
    await addMessage(inviteMsg, setMessages)
    
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
  handler: async (match, content, { character, setMessages }) => {
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
        type: 'system'
      })
      await addMessage(systemMsg, setMessages)
      
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
  handler: async (match, content, { character, setMessages }) => {
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
        type: 'system'
      })
      await addMessage(systemMsg, setMessages)
      
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
  handler: async (match, content, { character, setMessages }) => {
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
        type: 'system'
      })
      await addMessage(systemMsg, setMessages)
      
      console.log(`🎂 已添加纪念日: ${title} - ${date}`)
    }
    
    // 继续发送文本消息（不移除指令）
    return { handled: false }
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
  handler: async (match, content, { setMessages, character }) => {
    const monthlyLimit = parseFloat(match[1])

    const intimatePayMsg = createMessageObj('intimatePay', {
      intimatePay: {
        monthlyLimit,
        status: 'pending',
        characterName: character?.nickname || character?.realName || '对方'
      }
    })

    await addMessage(intimatePayMsg, setMessages)

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
  handler: async (match, content, { setMessages, character }) => {
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
      type: 'system'
    })
    await addMessage(systemMsg, setMessages)

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
  handler: async (match, content, { setMessages }) => {
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
      type: 'system'
    })
    await addMessage(systemMsg, setMessages)

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
  handler: async (match, content, { setMessages, character }) => {
    if (!character) return { handled: false }
    
    // AI拉黑用户（character拉黑user）
    blacklistManager.blockUser(`character_${character.id}`, 'user')
    console.log(`🚫 ${character.nickname || character.realName} 拉黑了用户`)
    
    // 注意：不需要修改现有消息
    // 用户发送新消息时会自动检测拉黑状态并标记（见 useChatAI.ts）
    
    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: `${character.nickname || character.realName} 拉黑了你`,
      type: 'system'
    })
    await addMessage(systemMsg, setMessages)
    
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
  handler: async (match, content, { setMessages, character }) => {
    if (!character) return { handled: false }
    
    // AI解除拉黑
    blacklistManager.unblockUser(`character_${character.id}`, 'user')
    console.log(`✅ ${character.nickname || character.realName} 解除了对用户的拉黑`)
    
    // 注意：不需要修改现有消息
    // 历史消息保持原样（显示真实的拉黑状态）
    // 解除拉黑后的新消息会自动不显示感叹号
    
    // 添加系统消息
    const systemMsg = createMessageObj('system', {
      content: `${character.nickname || character.realName} 解除了对你的拉黑`,
      type: 'system'
    })
    await addMessage(systemMsg, setMessages)
    
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
  emojiHandler,  // 表情包处理器
  recallHandler,
  blockUserHandler,
  unblockUserHandler,
  coupleSpaceInviteHandler,
  coupleSpaceAcceptHandler,
  coupleSpaceRejectHandler,
  coupleSpacePhotoHandler,
  coupleSpaceMessageHandler,
  coupleSpaceAnniversaryHandler,
  quoteHandler
]
