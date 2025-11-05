/**
 * 全局消息监听器
 * 监听所有聊天的消息变化，触发通知和未读标记
 */

import { useEffect, useRef } from 'react'
import { characterService } from '../services/characterService'
import { loadChatMessages } from '../utils/messageUtils'
import { incrementUnread } from '../utils/unreadMessages'

const GlobalMessageMonitor = () => {
  // 记录每个聊天的最后消息ID
  const lastMessageIdsRef = useRef<Record<string, number>>({})
  
  useEffect(() => {
    // 初始化：记录所有现有消息的最后ID
    const allCharacters = characterService.getAll()
    allCharacters.forEach(character => {
      const messages = loadChatMessages(character.id)
      if (messages.length > 0) {
        lastMessageIdsRef.current[character.id] = messages[messages.length - 1].id
      }
    })
    console.log('🔍 全局消息监听器已初始化')
    
    // 监听消息保存事件（立即响应）
    const handleMessageSaved = (event: CustomEvent) => {
      const { chatId } = event.detail
      const messages = loadChatMessages(chatId)
      
      if (messages.length === 0) return
      
      const lastMessage = messages[messages.length - 1]
      const lastRecordedId = lastMessageIdsRef.current[chatId]
      
      // 如果是新消息且是AI发的
      if (lastMessage.type === 'received' && 
          lastMessage.messageType !== 'system' &&
          lastMessage.id !== lastRecordedId) {
        
        // 更新记录
        lastMessageIdsRef.current[chatId] = lastMessage.id
        
        // 如果用户不在这个聊天窗口
        const currentPath = window.location.pathname
        const isInCurrentChat = currentPath === `/chat/${chatId}`
        
        if (!isInCurrentChat) {
          const character = characterService.getById(chatId)
          if (!character) return
          
          // 增加未读
          incrementUnread(chatId, 1)
          
          // 触发通知
          const messageContent = lastMessage.content || lastMessage.voiceText || '[消息]'
          window.dispatchEvent(new CustomEvent('background-chat-message', {
            detail: {
              title: character.nickname || character.realName,
              message: messageContent,
              chatId: chatId,
              avatar: character.avatar
            }
          }))
          
          console.log(`📬 检测到${character.nickname || character.realName}的新消息，已触发通知`)
        }
      }
    }
    
    window.addEventListener('chat-message-saved', handleMessageSaved as EventListener)
    
    return () => {
      window.removeEventListener('chat-message-saved', handleMessageSaved as EventListener)
    }
  }, [])
  
  return null
}

export default GlobalMessageMonitor
