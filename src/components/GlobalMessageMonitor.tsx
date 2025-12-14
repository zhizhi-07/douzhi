/**
 * 全局消息监听器
 * 监听所有聊天的消息变化，触发通知和未读标记
 */

import { useEffect, useRef } from 'react'
import { characterService } from '../services/characterService'
import { loadMessages } from '../utils/simpleMessageManager'
import { incrementUnread } from '../utils/unreadMessages'
import { groupChatManager } from '../utils/groupChatManager'

const NOTIFIED_MESSAGES_KEY = 'notified_message_ids'

const GlobalMessageMonitor = () => {
  console.log('🔔 [GlobalMessageMonitor] 组件已挂载')
  
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
      // 静默处理
    }
    
    // 初始化：记录所有现有消息的最后ID
    const allCharacters = characterService.getAll()
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
    
    // 监听消息保存事件（立即响应）
    const handleMessageSaved = (event: CustomEvent) => {
      const { chatId, messageType } = event.detail
      console.log(`🔔 [GlobalMessageMonitor] 收到消息保存事件: chatId=${chatId}, messageType=${messageType}`)
      
      // 🔥 区分私聊和群聊
      const isGroupChat = messageType === 'group'
      let messages: any[] = []
      
      if (isGroupChat) {
        // 群聊消息
        messages = groupChatManager.getMessages(chatId)
      } else {
        // 私聊消息
        messages = loadMessages(chatId)
      }
      
      console.log(`🔔 [GlobalMessageMonitor] 加载消息: count=${messages.length}`)
      if (messages.length === 0) return
      
      const lastMessage = messages[messages.length - 1]
      const lastRecordedId = lastMessageIdsRef.current[chatId]
      
      console.log(`🔔 [GlobalMessageMonitor] 最后消息: id=${lastMessage.id}, type=${lastMessage.type}, messageType=${lastMessage.messageType}, lastRecordedId=${lastRecordedId}`)
      
      // 过滤掉线下模式的消息
      if (lastMessage.sceneMode === 'offline') {
        console.log(`🔔 [GlobalMessageMonitor] 线下模式消息，跳过`)
        return
      }
      
      // 🔥 判断是否是新的AI消息
      const isAIMessage = isGroupChat 
        ? (lastMessage.userId !== 'user' && lastMessage.type !== 'system')  // 群聊：非用户且非系统消息
        : (lastMessage.type === 'received' && lastMessage.messageType !== 'system')  // 私聊：received类型且非系统消息
      
      console.log(`🔔 [GlobalMessageMonitor] isAIMessage=${isAIMessage}, isNewMessage=${lastMessage.id !== lastRecordedId}`)
      
      if (isAIMessage && lastMessage.id !== lastRecordedId) {
        // 更新记录
        lastMessageIdsRef.current[chatId] = lastMessage.id
        
        // 保存到 localStorage
        localStorage.setItem(NOTIFIED_MESSAGES_KEY, JSON.stringify(lastMessageIdsRef.current))
        
        // 如果用户不在这个聊天窗口
        const currentPath = window.location.pathname
        const isInCurrentChat = isGroupChat 
          ? currentPath === `/group/${chatId}`  // 群聊路径
          : currentPath === `/chat/${chatId}`   // 私聊路径
        
        console.log(`🔔 [GlobalMessageMonitor] 用户当前路径=${currentPath}, 是否在当前聊天=${isInCurrentChat}`)
        
        if (!isInCurrentChat) {
          let title = ''
          let avatar = ''
          
          if (isGroupChat) {
            // 群聊：显示群名
            const group = groupChatManager.getGroup(chatId)
            title = group?.name || '群聊'
            avatar = group?.avatar || ''
          } else {
            // 私聊：显示角色名
            const character = characterService.getById(chatId)
            if (!character) {
              console.log(`🔔 [GlobalMessageMonitor] 找不到角色: ${chatId}`)
              return
            }
            title = character.remark || character.nickname || character.realName
            avatar = character.avatar || ''
          }
          
          // 增加未读
          console.log(`🔔 [GlobalMessageMonitor] 增加未读: chatId=${chatId}`)
          incrementUnread(chatId, 1)
          
          // 触发通知
          const messageContent = lastMessage.content || lastMessage.voiceText || '[消息]'
          window.dispatchEvent(new CustomEvent('background-chat-message', {
            detail: {
              title: isGroupChat ? `${title}: ${lastMessage.userName}` : title,  // 群聊显示"群名: 发送者"
              message: messageContent,
              chatId: chatId,
              avatar: avatar
            }
          }))
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
