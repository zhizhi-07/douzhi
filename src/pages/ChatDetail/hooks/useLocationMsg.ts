/**
 * 位置分享功能Hook
 * 负责：位置发送逻辑
 */

import { useCallback, useState } from 'react'
import type { Message } from '../../../types/chat'
import { addMessage } from '../../../utils/simpleMessageManager'
import { blacklistManager } from '../../../utils/blacklistManager'

export const useLocationMsg = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  chatId: string
) => {
  const [showLocationSender, setShowLocationSender] = useState(false)

  /**
   * 发送位置消息
   */
  const handleSendLocation = useCallback((name: string, address: string) => {
    if (!name.trim()) return
    
    const isUserBlocked = blacklistManager.isBlockedByMe(`character_${chatId}`, 'user')

    const locationMsg: Message = {
      id: Date.now(),
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'location',
      blockedByReceiver: isUserBlocked,
      location: {
        name: name.trim(),
        address: address.trim() || '位置详情'
      }
    }

    // 🔥 保存到IndexedDB（触发new-message事件，自动更新React状态）
    addMessage(chatId, locationMsg)
    setShowLocationSender(false)
  }, [setMessages, chatId])

  return {
    showLocationSender,
    setShowLocationSender,
    handleSendLocation
  }
}
