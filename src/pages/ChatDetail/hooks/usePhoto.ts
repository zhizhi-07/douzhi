/**
 * 拍照功能Hook
 * 负责：拍照发送逻辑
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'

export const usePhoto = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void
) => {
  const [showPhotoSender, setShowPhotoSender] = useState(false)

  /**
   * 发送照片消息
   */
  const handleSendPhoto = useCallback((description: string) => {
    if (!description.trim()) return

    const photoMsg: Message = {
      id: Date.now(),
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'photo',
      photoDescription: description.trim()
    }

    setMessages(prev => [...prev, photoMsg])
    setShowPhotoSender(false)
  }, [setMessages])

  return {
    showPhotoSender,
    setShowPhotoSender,
    handleSendPhoto
  }
}
