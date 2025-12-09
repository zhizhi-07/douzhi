/**
 * 群聊表情包和语音Hook
 * 处理表情包发送和语音播放
 */

import { useState, useCallback } from 'react'
import { groupChatManager, type GroupMessage } from '../../../utils/groupChatManager'
import type { Emoji } from '../../../utils/emojiStorage'

// 获取成员头像
const getMemberAvatar = (userId: string): string => {
  if (userId === 'user') {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
      return userInfo.avatar || ''
    } catch (e) {
      return ''
    }
  }
  return ''
}

export const useGroupEmoji = (
  groupId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<GroupMessage[]>>,
  scrollToBottom: () => void
) => {
  // 表情面板状态
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  
  // 语音播放状态
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null)
  const [showVoiceTextMap, setShowVoiceTextMap] = useState<Record<number, boolean>>({})

  // 发送表情包
  const handleSelectEmoji = useCallback((emoji: Emoji) => {
    if (!groupId) return

    // 🔥 异步处理，避免阻塞 UI
    requestAnimationFrame(() => {
      const newMsg = groupChatManager.addMessage(groupId, {
        userId: 'user',
        userName: '我',
        userAvatar: getMemberAvatar('user'),
        content: emoji.description,
        type: 'emoji',
        timestamp: Date.now(),
        emojiUrl: emoji.url,
        emojiDescription: emoji.description
      })

      // 🔥 只追加新消息，不重新获取全部
      setMessages(prev => [...prev, newMsg])
      setTimeout(scrollToBottom, 50)
    })
  }, [groupId, setMessages, scrollToBottom])

  // 语音播放
  const handlePlayVoice = useCallback((messageId: number, duration: number) => {
    console.log('🎤 播放语音:', messageId)
    setPlayingVoiceId(messageId)
    setTimeout(() => {
      setPlayingVoiceId(null)
    }, duration * 1000)
  }, [])

  // 语音转文字切换
  const handleToggleVoiceText = useCallback((messageId: number) => {
    console.log('📝 切换语音文字:', messageId)
    setShowVoiceTextMap(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }, [])

  return {
    // 表情面板
    showEmojiPanel,
    setShowEmojiPanel,
    handleSelectEmoji,
    
    // 语音
    playingVoiceId,
    showVoiceTextMap,
    handlePlayVoice,
    handleToggleVoiceText
  }
}
