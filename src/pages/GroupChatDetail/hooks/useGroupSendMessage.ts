import { getStoredUserProfileJSON } from '../../../utils/userProfileStorage'
/**
 * 群聊发送消息 Hook
 * 🔥 优化：完全异步，零阻塞UI
 */

import { useCallback, useRef } from 'react'
import { groupChatManager, type GroupMessage } from '../../../utils/groupChatManager'

// 获取成员头像（缓存）
let cachedUserAvatar: string = ''
const getMemberAvatar = (userId: string): string => {
  if (userId === 'user') {
    if (cachedUserAvatar) return cachedUserAvatar
    try {
      const userInfo = JSON.parse(getStoredUserProfileJSON() || '{}')
      cachedUserAvatar = userInfo.avatar || ''
      return cachedUserAvatar
    } catch {
      return ''
    }
  }
  return ''
}

// 🔥 全局标志：是否正在发送消息（用于阻止 storage 事件）
export let isSendingMessage = false

interface UseGroupSendMessageProps {
  groupId: string | undefined
  isAiTyping: boolean
  quotedMessage: GroupMessage | null
  setMessages: React.Dispatch<React.SetStateAction<GroupMessage[]>>
  setInputText: React.Dispatch<React.SetStateAction<string>>
  setQuotedMessage: React.Dispatch<React.SetStateAction<GroupMessage | null>>
  scrollToBottom: (smooth?: boolean, force?: boolean) => void
}

export const useGroupSendMessage = ({
  groupId,
  isAiTyping,
  quotedMessage,
  setMessages,
  setInputText,
  setQuotedMessage,
  scrollToBottom
}: UseGroupSendMessageProps) => {
  const isSendingRef = useRef(false)
  // 🔥 缓存引用，避免闭包问题
  const quotedMessageRef = useRef(quotedMessage)
  quotedMessageRef.current = quotedMessage

  const handleSend = useCallback((inputText: string) => {
    // 🔥 防止重复发送
    if (isSendingRef.current) {
      console.log('🚫 [发送] 正在发送中，跳过')
      return
    }
    
    const trimmedText = inputText.trim()
    if (!trimmedText || !groupId || isAiTyping) {
      return
    }

    // 🔥 立即设置标志，防止重复
    isSendingRef.current = true
    isSendingMessage = true

    // 🔥 立即清空输入框（同步操作）
    setInputText('')
    
    // 🔥 捕获当前引用消息
    const currentQuote = quotedMessageRef.current
    setQuotedMessage(null)

    // Use the shared durable path; detached full-history writes race with AI updates/deletes.
    const newMsg = groupChatManager.addMessage(groupId, {
      userId: 'user', userName: '我', userAvatar: getMemberAvatar('user'),
      content: trimmedText, type: 'text',
      quotedMessage: currentQuote ? { id: currentQuote.id, content: currentQuote.content, userName: currentQuote.userName } : undefined
    }, true)
    setMessages(prev => [...prev, newMsg])
    requestAnimationFrame(() => scrollToBottom(false))

    // 🔥 立即清除标志
    isSendingRef.current = false
    isSendingMessage = false
  }, [groupId, isAiTyping, setMessages, setInputText, setQuotedMessage, scrollToBottom])

  return {
    handleSend,
    isSending: isSendingRef.current
  }
}
