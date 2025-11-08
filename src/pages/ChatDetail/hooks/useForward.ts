import { useCallback, useState } from 'react'
import { Message } from '../../../types/chat'
import { addMessage } from '../../../utils/simpleMessageManager'

export const useForward = (
  chatId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const [viewingForwardedChat, setViewingForwardedChat] = useState<Message | null>(null)

  const forwardMessages = useCallback((targetCharacterId: string, selectedMessages: any[]) => {
    const forwardedMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'forwarded-chat',
      forwardedChat: {
        title: `聊天记录`,
        messages: selectedMessages,
        messageCount: selectedMessages.length
      }
    }

    addMessage(targetCharacterId, forwardedMessage)
    
    // 如果是转发到当前聊天
    if (targetCharacterId === chatId) {
      setMessages(prev => [...prev, forwardedMessage])
    }

    console.log(`📤 转发 ${selectedMessages.length} 条消息到:`, targetCharacterId)
  }, [chatId, setMessages])

  return {
    viewingForwardedChat,
    setViewingForwardedChat,
    forwardMessages
  }
}
