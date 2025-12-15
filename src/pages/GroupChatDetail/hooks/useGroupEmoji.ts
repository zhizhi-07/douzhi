/**
 * 群聊表情包和语音Hook
 * 处理表情包发送和语音播放
 */

import { useState, useCallback, useRef } from 'react'
import { groupChatManager, type GroupMessage } from '../../../utils/groupChatManager'
import type { Emoji } from '../../../utils/emojiStorage'

// 获取成员头像（缓存）
let cachedUserAvatar: string = ''
let avatarLoaded = false
const getMemberAvatar = (userId: string): string => {
  if (userId === 'user') {
    if (avatarLoaded) return cachedUserAvatar
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
      cachedUserAvatar = userInfo.avatar || ''
      avatarLoaded = true
      return cachedUserAvatar
    } catch {
      return ''
    }
  }
  return ''
}

// 🔥 表情包消息ID计数器
let emojiMsgIdCounter = 0

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
  
  // 🔥 防止重复发送
  const isSendingRef = useRef(false)

  // 发送表情包
  const handleSelectEmoji = useCallback((emoji: Emoji) => {
    if (!groupId || isSendingRef.current) return
    
    isSendingRef.current = true
    
    // 🔥 生成唯一ID
    const now = Date.now()
    const uniqueId = `msg_${now}_emoji_${++emojiMsgIdCounter}`
    
    // 🔥 创建消息对象
    const newMsg: GroupMessage = {
      id: uniqueId,
      groupId,
      userId: 'user',
      userName: '我',
      userAvatar: getMemberAvatar('user'),
      content: emoji.description,
      type: 'emoji',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
      emojiUrl: emoji.url,
      emojiDescription: emoji.description
    }
    
    // 🔥 立即更新 UI
    setMessages(prev => {
      if (prev.some(m => m.id === uniqueId)) return prev
      return [...prev, newMsg]
    })
    
    // 🔥 异步保存到数据库（silent模式）
    queueMicrotask(() => {
      groupChatManager.addMessage(groupId, {
        userId: 'user',
        userName: '我',
        userAvatar: getMemberAvatar('user'),
        content: emoji.description,
        type: 'emoji',
        timestamp: now,
        emojiUrl: emoji.url,
        emojiDescription: emoji.description
      }, true)  // silent = true
      
      console.log('✅ [表情包发送完成]', uniqueId)
    })
    
    // 🔥 不再强制滚动，让虚拟列表自动处理
    setTimeout(() => {
      isSendingRef.current = false
    }, 100)
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
