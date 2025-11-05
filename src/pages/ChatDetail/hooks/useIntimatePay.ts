/**
 * 亲密付功能Hook
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'

export const useIntimatePay = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void
) => {
  const [showIntimatePaySender, setShowIntimatePaySender] = useState(false)

  /**
   * 开通亲密付（发送请求给AI）
   */
  const handleSendIntimatePay = useCallback((monthlyLimit: number, characterName: string) => {
    const msg: Message = {
      id: Date.now(),
      type: 'sent',
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

    setMessages(prev => [...prev, msg])
    setShowIntimatePaySender(false)
  }, [setMessages])

  return {
    showIntimatePaySender,
    setShowIntimatePaySender,
    handleSendIntimatePay
  }
}
