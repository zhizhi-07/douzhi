/**
 * 全局消息监听器
 * 监听所有聊天的消息变化，触发通知和未读标记
 */

import { useEffect, useRef } from 'react'
import { characterService } from '../services/characterService'
import { loadMessages } from '../utils/simpleMessageManager'
import { incrementUnread } from '../utils/unreadMessages'

const NOTIFIED_MESSAGES_KEY = 'notified_message_ids'

const GlobalMessageMonitor = () => {
  // 记录每个聊天的最后消息ID（持久化）
  const lastMessageIdsRef = useRef<Record<string, number>>({})
  
  useEffect(() => {
    console.log('🚀 [GlobalMessageMonitor] ===== 开始初始化 =====')
    
    // 从 localStorage 加载已通知的消息ID
    try {
      const saved = localStorage.getItem(NOTIFIED_MESSAGES_KEY)
      if (saved) {
        lastMessageIdsRef.current = JSON.parse(saved)
      }
      console.log('📋 [GlobalMessageMonitor] 已加载通知记录:', Object.keys(lastMessageIdsRef.current).length, '个聊天')
    } catch (e) {
      console.error('❌ [GlobalMessageMonitor] 加载已通知消息记录失败:', e)
    }
    
    // 初始化：记录所有现有消息的最后ID
    const allCharacters = characterService.getAll()
    console.log('👥 [GlobalMessageMonitor] 找到', allCharacters.length, '个角色')
    allCharacters.forEach(character => {
      const messages = loadMessages(character.id)
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
    console.log('✅ [GlobalMessageMonitor] 全局消息监听器已初始化')
    console.log('🎧 [GlobalMessageMonitor] 开始监听 chat-message-saved 事件')
    
    // 监听消息保存事件（立即响应）
    const handleMessageSaved = (event: CustomEvent) => {
      const { chatId } = event.detail
      console.log(`🔔 [GlobalMessageMonitor] ===== 开始处理消息保存事件 =====`)
      console.log(`🔔 [GlobalMessageMonitor] 监听到消息保存事件: chatId=${chatId}`)
      
      const messages = loadMessages(chatId)
      console.log(`📦 [GlobalMessageMonitor] 加载消息: chatId=${chatId}, 总数=${messages.length}`)
      
      if (messages.length === 0) {
        console.log(`⚠️ [GlobalMessageMonitor] 消息为空，跳过`)
        return
      }
      
      const lastMessage = messages[messages.length - 1]
      const lastRecordedId = lastMessageIdsRef.current[chatId]
      
      console.log(`🔍 [GlobalMessageMonitor] 检查消息`, {
        lastMessageId: lastMessage.id,
        lastRecordedId,
        messageType: lastMessage.type,
        messageSubType: lastMessage.messageType,
        isNew: lastMessage.id !== lastRecordedId
      })
      
      // 如果是新消息且是AI发的
      if (lastMessage.type === 'received' && 
          lastMessage.messageType !== 'system' &&
          lastMessage.id !== lastRecordedId) {
        
        console.log(`✅ [GlobalMessageMonitor] 这是新的AI消息`)
        
        // 更新记录
        lastMessageIdsRef.current[chatId] = lastMessage.id
        
        // 保存到 localStorage
        localStorage.setItem(NOTIFIED_MESSAGES_KEY, JSON.stringify(lastMessageIdsRef.current))
        
        // 如果用户不在这个聊天窗口
        const currentPath = window.location.pathname
        const isInCurrentChat = currentPath === `/chat/${chatId}`
        
        console.log(`🔍 [GlobalMessageMonitor] 用户位置检查`, {
          currentPath,
          chatPath: `/chat/${chatId}`,
          isInCurrentChat
        })
        
        if (!isInCurrentChat) {
          const character = characterService.getById(chatId)
          if (!character) {
            console.log(`❌ [GlobalMessageMonitor] 找不到角色: ${chatId}`)
            return
          }
          
          // 增加未读
          incrementUnread(chatId, 1)
          console.log(`📬 [GlobalMessageMonitor] 增加未读数: chatId=${chatId}`)
          
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
          
          console.log(`🔔 [GlobalMessageMonitor] 已触发通知: ${character.nickname || character.realName} - ${messageContent}`)
        } else {
          console.log(`ℹ️ [GlobalMessageMonitor] 用户在聊天窗口中，不触发通知`)
        }
      } else {
        console.log(`⏭️ [GlobalMessageMonitor] 跳过消息（不是新的AI消息）`)
      }
    }
    
    console.log('➕ [GlobalMessageMonitor] 添加事件监听器: chat-message-saved')
    window.addEventListener('chat-message-saved', handleMessageSaved as EventListener)
    
    return () => {
      console.log('➖ [GlobalMessageMonitor] 移除事件监听器: chat-message-saved')
      window.removeEventListener('chat-message-saved', handleMessageSaved as EventListener)
    }
  }, [])
  
  return null
}

export default GlobalMessageMonitor
