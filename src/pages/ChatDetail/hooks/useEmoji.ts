import { useCallback, useState } from 'react'
import { Message } from '../../../types/chat'
import { blacklistManager } from '../../../utils/blacklistManager'
import type { Emoji } from '../../../utils/emojiStorage'

export const useEmoji = (
  chatId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)

  const sendEmoji = useCallback((emoji: Emoji) => {
    // 检查AI是否拉黑了用户
    const isUserBlocked = blacklistManager.isBlockedByMe(`character_${chatId}`, 'user')
    
    const emojiMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: `[表情包:${emoji.id}]`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'emoji',
      blockedByReceiver: isUserBlocked,
      emoji: {
        id: emoji.id,
        url: emoji.url,
        name: emoji.name,
        description: emoji.description
      }
    }
    
    // 只使用 setMessages，它会自动保存到 IndexedDB
    setMessages(prev => [...prev, emojiMessage])
    
    console.log('📤 发送表情包:', emoji.name, isUserBlocked ? '(被AI拉黑)' : '')
  }, [chatId, setMessages])

  return {
    showEmojiPanel,
    setShowEmojiPanel,
    sendEmoji
  }
}
