/**
 * 位置分享功能Hook
 * 负责：位置发送逻辑
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'

export const useLocationMsg = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void
) => {
  const [showLocationSender, setShowLocationSender] = useState(false)

  /**
   * 发送位置消息
   */
  const handleSendLocation = useCallback((name: string, address: string) => {
    if (!name.trim()) return

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
      location: {
        name: name.trim(),
        address: address.trim() || '位置详情'
      }
    }

    setMessages(prev => [...prev, locationMsg])
    setShowLocationSender(false)
  }, [setMessages])

  return {
    showLocationSender,
    setShowLocationSender,
    handleSendLocation
  }
}
