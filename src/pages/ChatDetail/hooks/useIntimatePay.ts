/**
 * 亲密付功能Hook
 */

import { useCallback, useState } from 'react'
import type { Message } from '../../../types/chat'
import { blacklistManager } from '../../../utils/blacklistManager'
import { addMessage as saveMessageToStorage } from '../../../utils/simpleMessageManager'

export const useIntimatePay = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  chatId: string
) => {
  const [showIntimatePaySender, setShowIntimatePaySender] = useState(false)

  /**
   * 开通亲密付（发送请求给AI）
   */
  const handleSendIntimatePay = useCallback((monthlyLimit: number, characterName: string) => {
    const isUserBlocked = blacklistManager.isBlockedByMe(`character_${chatId}`, 'user')
    
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
      blockedByReceiver: isUserBlocked,
      intimatePay: {
        monthlyLimit,
        status: 'pending',
        characterName
      }
    }

    // 🔥 保存到IndexedDB，确保退出后不丢失
    saveMessageToStorage(chatId, msg)
    console.log('💾 [亲密付] 消息已保存到IndexedDB')
    
    setMessages(prev => [...prev, msg])
    setShowIntimatePaySender(false)
  }, [setMessages, chatId])

  return {
    showIntimatePaySender,
    setShowIntimatePaySender,
    handleSendIntimatePay
  }
}
