/**
 * 全局消息监听器
 * 监听所有聊天的消息变化，触发通知和未读标记
 */

import { useEffect, useRef } from 'react'
import { characterService } from '../services/characterService'
import { loadChatMessages } from '../utils/messageUtils'
import { incrementUnread } from '../utils/unreadMessages'

const NOTIFIED_MESSAGES_KEY = 'notified_message_ids'

const GlobalMessageMonitor = () => {
  // 记录每个聊天的最后消息ID（持久化）
  const lastMessageIdsRef = useRef<Record<string, number>>({})
  
  useEffect(() => {
    // 从 localStorage 加载已通知的消息ID
    try {
      const saved = localStorage.getItem(NOTIFIED_MESSAGES_KEY)
      if (saved) {
        lastMessageIdsRef.current = JSON.parse(saved)
      }
    } catch (e) {
      console.error('加载已通知消息记录失败:', e)
    }
    
    // 初始化：记录所有现有消息的最后ID
    const allCharacters = characterService.getAll()
    allCharacters.forEach(character => {
      const messages = loadChatMessages(character.id)
      if (messages.length > 0) {
        const lastId = messages[messages.length - 1].id
        // 如果没有记录，或者消息比记录的新，更新记录
        if (!lastMessageIdsRef.current[character.id] || lastId > lastMessageIdsRef.current[character.id]) {
          lastMessageIdsRef.current[character.id] = lastId
        }
      }
    })
    
    // 保存初始化后的记录
    localStorage.setItem(NOTIFIED_MESSAGES_KEY, JSON.stringify(lastMessageIdsRef.current))
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
        
        // 保存到 localStorage
        localStorage.setItem(NOTIFIED_MESSAGES_KEY, JSON.stringify(lastMessageIdsRef.current))
        
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
