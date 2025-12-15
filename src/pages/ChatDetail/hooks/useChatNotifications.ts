/**
 * 聊天通知和未读消息管理 Hook
 */

import { useEffect } from 'react'
import { clearUnread } from '../../../utils/simpleNotificationManager'
import { clearUnread as clearUnreadMessages } from '../../../utils/unreadMessages'

interface UseChatNotificationsProps {
  chatId: string | undefined
}

export const useChatNotifications = ({ chatId }: UseChatNotificationsProps) => {
  // 进入聊天时清除未读消息
  useEffect(() => {
    if (chatId) {
      clearUnread(chatId)
      clearUnreadMessages(chatId)
      console.log('✅ [useChatNotifications] 已清除未读消息:', chatId)
    }
  }, [chatId])
}
