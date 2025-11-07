/**
 * 拍照功能Hook
 * 负责：拍照发送逻辑
 */

import { useCallback, useState } from 'react'
import type { Message } from '../../../types/chat'
import { addMessage } from '../../../utils/simpleMessageManager'
import { blacklistManager } from '../../../utils/blacklistManager'

export const usePhoto = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  chatId: string
) => {
  const [showPhotoSender, setShowPhotoSender] = useState(false)

  /**
   * 发送照片消息
   */
  const handleSendPhoto = useCallback((description: string) => {
    if (!description.trim()) return
    
    const isUserBlocked = blacklistManager.isBlockedByMe(`character_${chatId}`, 'user')

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
      blockedByReceiver: isUserBlocked,
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
