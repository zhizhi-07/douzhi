/**
 * 聊天通知和未读消息管理 Hook
 */

import { useEffect, useRef } from 'react'
import { Message } from '../../../types/chat'
import { incrementUnread, clearUnread } from '../../../utils/unreadMessages'
import { Character } from '../../../types/chat'

interface UseChatNotificationsProps {
  chatId: string | undefined
  character: Character | undefined
  messages: Message[]
}

export const useChatNotifications = ({ chatId, character, messages }: UseChatNotificationsProps) => {
  // 跟踪页面是否可见（用于后台AI回复）
  const isPageVisibleRef = useRef(true)
  
  // 跟踪最后处理的消息ID，避免重复处理
  const lastProcessedMessageIdRef = useRef<number | null>(null)
  
  // 监听页面可见性（用户是否在当前聊天页面）
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
      console.log('👁️ 页面可见性变化:', isPageVisibleRef.current ? '可见' : '隐藏')
    }
    
    // 初始化为可见
    isPageVisibleRef.current = !document.hidden
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  // 实时监听AI消息，立即触发通知和未读消息
  useEffect(() => {
    if (!chatId || !character || messages.length === 0) return
    
    const lastMessage = messages[messages.length - 1]
    
    // 只处理AI发送的消息，并且不是已经处理过的消息
    if (lastMessage && 
        lastMessage.type === 'received' && 
        lastMessage.messageType !== 'system' &&
        lastMessage.id !== lastProcessedMessageIdRef.current) {
      
      // 记录已处理的消息ID
      lastProcessedMessageIdRef.current = lastMessage.id
      // 判断用户是否在当前聊天页面
      const isInCurrentChat = !document.hidden && window.location.pathname === `/chat/${chatId}`
      
      // 如果不在当前页面，立即增加未读并发送通知
      if (!isInCurrentChat) {
        const messageContent = lastMessage.content || lastMessage.voiceText || '[消息]'
        
        // 检测是否是视频通话
        const isVideoCall = messageContent.includes('[视频通话]') || 
                           messageContent.includes('[你给用户发起了视频通话')
        
        if (isVideoCall) {
          // 视频通话：发送特殊通知
          window.dispatchEvent(new CustomEvent('background-chat-message', {
            detail: {
              title: character.nickname || character.realName,
              message: '📹 发起了视频通话',
              chatId: chatId,
              avatar: character.avatar
            }
          }))
          
          // 保存未接来电状态
          sessionStorage.setItem(`missed_call_${chatId}`, JSON.stringify({
            characterId: chatId,
            characterName: character.nickname || character.realName,
            timestamp: Date.now()
          }))
          
          console.log('📞 AI发起视频通话但用户不在页面，已保存未接来电')
        } else {
          // 普通消息：增加未读
          incrementUnread(chatId, 1)
          
          // 发送通知事件
          window.dispatchEvent(new CustomEvent('background-chat-message', {
            detail: {
              title: character.nickname || character.realName,
              message: messageContent,
              chatId: chatId,
              avatar: character.avatar
            }
          }))
          
          console.log('📬 AI回复时不在聊天页面，已增加未读+1')
        }
      }
    }
  }, [messages, chatId, character])
  
  // 进入聊天时清除未读消息，并重置处理记录
  useEffect(() => {
    if (chatId) {
      clearUnread(chatId)
      // 切换聊天时重置最后处理的消息ID
      lastProcessedMessageIdRef.current = null
      console.log('✅ 已清除未读消息:', chatId)
    }
  }, [chatId])
  
  return {
    isPageVisibleRef
  }
}
