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
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
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

// 🔥 消息ID计数器（避免同一毫秒内ID冲突）
let msgIdCounter = 0

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

    // 🔥 生成唯一消息ID
    const now = Date.now()
    const uniqueId = `msg_${now}_${++msgIdCounter}`
    
    // 🔥 创建消息对象
    const newMsg: GroupMessage = {
      id: uniqueId,
      groupId,
      userId: 'user',
      userName: '我',
      userAvatar: getMemberAvatar('user'),
      content: trimmedText,
      type: 'text',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
      quotedMessage: currentQuote ? {
        id: currentQuote.id,
        content: currentQuote.content,
        userName: currentQuote.userName
      } : undefined
    }

    // 🔥 立即更新 UI（只追加新消息，不替换整个数组）
    setMessages(prev => [...prev, newMsg])
    
    // 🔥 添加到缓存
    const existingMessages = groupChatManager.getMessages(groupId)
    if (!existingMessages.some(m => m.id === newMsg.id)) {
      existingMessages.push(newMsg)
    }
    
    // 🔥 异步保存到 IndexedDB（完全后台）
    setTimeout(() => {
      import('../../../utils/indexedDBManager').then(IDB => {
        IDB.setItem(IDB.STORES.MESSAGES, `group_${groupId}`, existingMessages)
      })
      console.log('✅ [发送完成]', uniqueId)
    }, 0)
    
    // 🔥 立即清除标志
    isSendingRef.current = false
    isSendingMessage = false
  }, [groupId, isAiTyping, setMessages, setInputText, setQuotedMessage, scrollToBottom])

  return {
    handleSend,
    isSending: isSendingRef.current
  }
}
