/**
 * 转账功能Hook
 * 负责：转账发送、接收、退还等逻辑
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { addNotificationToChat } from '../../../utils/messageUtils'
import { sendTransfer, receiveTransfer, getIntimatePayRelations, useIntimatePay as deductIntimatePayAmount } from '../../../utils/walletUtils'
import { blacklistManager } from '../../../utils/blacklistManager'
import { addMessage as saveMessageToStorage, ensureMessagesLoaded, saveMessages } from '../../../utils/simpleMessageManager'
import { getUserInfo } from '../../../utils/userUtils'

export const useTransfer = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  characterName: string,
  chatId: string
) => {
  const [showTransferSender, setShowTransferSender] = useState(false)

  /**
   * 发送转账
   */
  const handleSendTransfer = useCallback((
    amount: number, 
    message: string, 
    useIntimatePay?: boolean, 
    intimatePayCharacterName?: string
  ) => {
    // 检查AI是否拉黑了用户
    const isUserBlocked = blacklistManager.isBlockedByMe(characterName, 'user')

    // 如果使用亲密付，扣除亲密付额度
    if (useIntimatePay && intimatePayCharacterName) {
      const success = deductIntimatePayAmount(intimatePayCharacterName, amount)
      
      if (!success) {
        alert('亲密付额度不足')
        return
      }
      
      // 找到提供亲密付的角色ID
      const relations = getIntimatePayRelations()
      const intimatePayRelation = relations.find(r => 
        r.characterName === intimatePayCharacterName && 
        r.type === 'character_to_user'
      )
      
      if (intimatePayRelation) {
        // 构建通知消息（显示具体是谁的亲密付被使用）
        const notificationContent = `💳 ${intimatePayCharacterName} 的亲密付被使用了\n给 ${characterName} 转账 ¥${amount.toFixed(2)}${message ? `\n备注：${message}` : ''}`
        
        console.log('📬 准备发送亲密付通知:', {
          提供亲密付的角色: intimatePayCharacterName,
          角色ID: intimatePayRelation.characterId,
          转账给: characterName,
          金额: amount,
          通知内容: notificationContent
        })
        
        // 向提供亲密付的角色聊天记录添加通知
        addNotificationToChat(intimatePayRelation.characterId, notificationContent)
      }
    } else {
      // 使用自己的余额
      const success = sendTransfer(amount, characterName, message)
      
      if (!success) {
        alert('余额不足，无法转账')
        return
      }
    }
    
    // 构建content给AI看
    let content = ''
    if (useIntimatePay && intimatePayCharacterName) {
      content = `[使用${intimatePayCharacterName}的亲密付转账¥${amount.toFixed(2)}${message ? `，备注：${message}` : ''}]`
    }

    const transferMsg: Message = {
      id: Date.now(),
      type: 'sent',
      content,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'transfer',
      blockedByReceiver: isUserBlocked,  // 🔥 添加拉黑标记
      transfer: {
        amount,
        message,
        status: 'pending',
        paidByIntimatePay: useIntimatePay,
        intimatePayCharacterName
      }
    }

    // 保存到IndexedDB
    saveMessageToStorage(chatId, transferMsg)
    
    setMessages(prev => [...prev, transferMsg])
    setShowTransferSender(false)
  }, [setMessages, characterName, chatId])

  /**
   * 领取AI发来的转账
   */
  const handleReceiveTransfer = useCallback(async (messageId: number) => {
    // 🔥 关键修复：确保消息已加载
    const messages = await ensureMessagesLoaded(chatId)
    const transferMsg = messages.find(msg => msg.id === messageId)
    const amount = transferMsg?.transfer?.amount || 0
    const transferMessage = transferMsg?.transfer?.message || '转账'

    // 获取用户真实名字
    const userInfo = getUserInfo()
    const userName = userInfo.nickname || userInfo.realName

    // 更新转账状态
    const updated = messages.map(msg => {
      if (msg.id === messageId && msg.messageType === 'transfer' && msg.type === 'received') {
        return {
          ...msg,
          transfer: {
            ...msg.transfer!,
            status: 'received' as const
          },
          // 🔥 添加AI可读内容，使用用户的真实网名
          aiReadableContent: `[${userName}领取了你的转账¥${amount.toFixed(2)}${transferMessage ? `，备注：${transferMessage}` : ''}]`
        }
      }
      return msg
    })

    // 增加余额
    receiveTransfer(amount, characterName, transferMessage)

    // 保存更新后的消息列表
    saveMessages(chatId, updated)

    // 🔥 使用函数式更新，避免触发滚动
    setMessages(prev => {
      // 只更新对应的消息，保持数组引用稳定
      return prev.map(msg => {
        if (msg.id === messageId && msg.messageType === 'transfer' && msg.type === 'received') {
          return {
            ...msg,
            transfer: {
              ...msg.transfer!,
              status: 'received' as const
            },
            aiReadableContent: `[${userName}领取了你的转账¥${amount.toFixed(2)}${transferMessage ? `，备注：${transferMessage}` : ''}]`
          }
        }
        return msg
      })
    })
  }, [setMessages, characterName, chatId])

  /**
   * 退还AI发来的转账
   */
  const handleRejectTransfer = useCallback(async (messageId: number) => {
    // 🔥 关键修复：确保消息已加载
    const messages = await ensureMessagesLoaded(chatId)
    const transferMsg = messages.find(msg => msg.id === messageId)
    const amount = transferMsg?.transfer?.amount || 0
    const transferMessage = transferMsg?.transfer?.message || ''

    // 获取用户真实名字
    const userInfo = getUserInfo()
    const userName = userInfo.nickname || userInfo.realName

    // 更新转账状态
    const updated = messages.map(msg => {
      if (msg.id === messageId && msg.messageType === 'transfer' && msg.type === 'received') {
        return {
          ...msg,
          transfer: {
            ...msg.transfer!,
            status: 'expired' as const
          },
          // 🔥 添加AI可读内容，使用用户的真实网名
          aiReadableContent: `[${userName}退还了你的转账¥${amount.toFixed(2)}${transferMessage ? `，备注：${transferMessage}` : ''}]`
        }
      }
      return msg
    })

    // 保存更新后的消息列表
    saveMessages(chatId, updated)

    // 🔥 使用函数式更新，避免触发滚动
    setMessages(prev => {
      return prev.map(msg => {
        if (msg.id === messageId && msg.messageType === 'transfer' && msg.type === 'received') {
          return {
            ...msg,
            transfer: {
              ...msg.transfer!,
              status: 'expired' as const  // 🔥 修复：使用正确的状态值'expired'而非'rejected'
            },
            aiReadableContent: `[${userName}退还了你的转账¥${amount.toFixed(2)}${transferMessage ? `，备注：${transferMessage}` : ''}]`
          }
        }
        return msg
      })
    })
  }, [setMessages, chatId])

  return {
    showTransferSender,
    setShowTransferSender,
    handleSendTransfer,
    handleReceiveTransfer,
    handleRejectTransfer
  }
}
