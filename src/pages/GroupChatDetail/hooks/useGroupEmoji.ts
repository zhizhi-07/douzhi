/**
 * 群聊表情包和语音Hook
 * 处理表情包发送和语音播放
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { groupChatManager, type GroupMessage } from '../../../utils/groupChatManager'
import type { Emoji } from '../../../utils/emojiStorage'

import { getUserInfo } from '../../../utils/userUtils'
const getMemberAvatar = (userId: string): string => userId === 'user' ? getUserInfo().avatar || '' : ''

// 🔥 表情包消息ID计数器

export const useGroupEmoji = (
  groupId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<GroupMessage[]>>,
  scrollToBottom: () => void
) => {
  // 表情面板状态
  
  // 语音播放状态
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null)
  const [showVoiceTextMap, setShowVoiceTextMap] = useState<Record<number, boolean>>({})
  
  // 🔥 防止重复发送
  const isSendingRef = useRef(false)

  // 发送表情包
  const handleSelectEmoji = useCallback((emoji: Emoji) => {
    if (!groupId || isSendingRef.current) return
    
    isSendingRef.current = true
    
    const newMsg = groupChatManager.addMessage(groupId, {
      userId: 'user', userName: '我', userAvatar: getMemberAvatar('user'),
      content: emoji.description, type: 'emoji', emojiUrl: emoji.url, emojiDescription: emoji.description
    }, true)
    setMessages(previous => [...previous, newMsg])

    // 🔥 不再强制滚动，让虚拟列表自动处理
    setTimeout(() => {
      isSendingRef.current = false
    }, 100)
  }, [groupId, setMessages, scrollToBottom])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => () => { audioRef.current?.pause(); audioRef.current = null }, [groupId])

  const handlePlayVoice = useCallback((messageId: number, _duration: number) => {
    if (!groupId) return
    audioRef.current?.pause()
    if (playingVoiceId === messageId) { setPlayingVoiceId(null); return }
    const message = groupChatManager.getMessages(groupId).find(msg => msg.id === String(messageId) || msg.id === `msg_${messageId}`)
    if (!message?.voiceUrl) {
      setPlayingVoiceId(null)
      setShowVoiceTextMap(prev => ({ ...prev, [messageId]: true }))
      alert('这条语音只有文字，没有音频文件，已显示文字')
      return
    }
    const audio = new Audio(message.voiceUrl)
    audioRef.current = audio
    const stop = () => { if (audioRef.current === audio) { setPlayingVoiceId(null); audioRef.current = null } }
    audio.onended = stop
    audio.onerror = () => { stop(); alert('语音播放失败，请检查音频文件') }
    setPlayingVoiceId(messageId)
    void audio.play().catch(() => { stop(); alert('无法播放音频，请重试') })
  }, [groupId, playingVoiceId])

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
    handleSelectEmoji,
    
    // 语音
    playingVoiceId,
    showVoiceTextMap,
    handlePlayVoice,
    handleToggleVoiceText
  }
}
