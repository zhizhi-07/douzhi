/**
 * 转账功能Hook
 * 负责：转账发送、接收、退还等逻辑
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { createSystemMessage } from '../../../utils/messageUtils'

export const useTransfer = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void
) => {
  const [showTransferSender, setShowTransferSender] = useState(false)

  /**
   * 发送转账
   */
  const handleSendTransfer = useCallback((amount: number, message: string) => {
    const transferMsg: Message = {
      id: Date.now(),
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'transfer',
      transfer: {
        amount,
        message,
        status: 'pending'
      }
    }

    setMessages(prev => [...prev, transferMsg])
    setShowTransferSender(false)
  }, [setMessages])

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

      // 获取转账金额
      const transferMsg = prev.find(msg => msg.id === messageId)
      const amount = transferMsg?.transfer?.amount || 0

      // 添加系统提示告诉AI
      const systemMessage = createSystemMessage(`已收款¥${amount.toFixed(2)}`)

      return [...updated, systemMessage]
    })
  }, [setMessages])

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
