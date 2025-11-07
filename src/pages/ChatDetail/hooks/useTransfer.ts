/**
 * 转账功能Hook
 * 负责：转账发送、接收、退还等逻辑
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { createSystemMessage, addNotificationToChat } from '../../../utils/messageUtils'
import { sendTransfer, receiveTransfer, getIntimatePayRelations, useIntimatePay as deductIntimatePayAmount } from '../../../utils/walletUtils'
import { blacklistManager } from '../../../utils/blacklistManager'

export const useTransfer = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  characterName: string
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

    setMessages(prev => [...prev, transferMsg])
    setShowTransferSender(false)
  }, [setMessages, characterName])

  /**
   * 领取AI发来的转账
   */
  const handleReceiveTransfer = useCallback((messageId: number) => {
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId && msg.messageType === 'transfer' && msg.type === 'received') {
          return {
            ...msg,
            transfer: {
              ...msg.transfer!,
              status: 'received' as const
            }
          }
        }
        return msg
      })

      // 获取转账金额和消息
      const transferMsg = prev.find(msg => msg.id === messageId)
      const amount = transferMsg?.transfer?.amount || 0
      const transferMessage = transferMsg?.transfer?.message || '转账'

      // 增加余额
      receiveTransfer(amount, characterName, transferMessage)

      // 添加系统提示告诉AI
      const systemMessage = createSystemMessage(`已收款¥${amount.toFixed(2)}`)

      return [...updated, systemMessage]
    })
  }, [setMessages, characterName])

  /**
   * 退还AI发来的转账
   */
  const handleRejectTransfer = useCallback((messageId: number) => {
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId && msg.messageType === 'transfer' && msg.type === 'received') {
          return {
            ...msg,
            transfer: {
              ...msg.transfer!,
              status: 'expired' as const
            }
          }
        }
        return msg
      })

      // 添加系统提示告诉AI
      const systemMessage = createSystemMessage('你已退还转账')

      return [...updated, systemMessage]
    })
  }, [setMessages])

  return {
    showTransferSender,
    setShowTransferSender,
    handleSendTransfer,
    handleReceiveTransfer,
    handleRejectTransfer
  }
}
