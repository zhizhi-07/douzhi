/**
 * 语音功能Hook
 * 负责：语音发送、播放、转文字等逻辑
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { addMessage } from '../../../utils/simpleMessageManager'
import { blacklistManager } from '../../../utils/blacklistManager'

export const useVoice = (
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  chatId: string
) => {
  const [showVoiceSender, setShowVoiceSender] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null)
  const [showVoiceTextMap, setShowVoiceTextMap] = useState<Record<number, boolean>>({})

  /**
   * 发送语音消息
   */
  const handleSendVoice = useCallback((voiceText: string) => {
    if (!voiceText.trim()) return
    
    const isUserBlocked = blacklistManager.isBlockedByMe(`character_${chatId}`, 'user')

    const voiceMsg: Message = {
      id: Date.now(),
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'voice',
      blockedByReceiver: isUserBlocked,
      voiceText: voiceText.trim()
    }

    // 保存到IndexedDB
    addMessage(chatId, voiceMsg)
    
    setMessages(prev => [...prev, voiceMsg])
    setShowVoiceSender(false)
  }, [setMessages, chatId])

  /**
   * 播放/暂停语音
   */
  const handlePlayVoice = useCallback(async (messageId: number, duration: number, voiceUrl?: string) => {
    if (playingVoiceId === messageId) {
      // 暂停（TODO: 需要Audio对象的引用来真正暂停）
      setPlayingVoiceId(null)
    } else {
      // 播放
      setPlayingVoiceId(messageId)
      
      if (voiceUrl) {
        // 有音频URL，播放真实音频
        try {
          const audio = new Audio(voiceUrl)
          
          audio.onended = () => {
            setPlayingVoiceId(null)
          }
          
          audio.onerror = () => {
            console.error('音频播放失败')
            setPlayingVoiceId(null)
          }
          
          await audio.play()
        } catch (error) {
          console.error('播放音频出错:', error)
          setPlayingVoiceId(null)
        }
      } else {
        // 没有音频URL，模拟播放
        setTimeout(() => {
          setPlayingVoiceId(null)
        }, duration * 1000)
      }
    }
  }, [playingVoiceId])

  /**
   * 切换转文字显示
   */
  const handleToggleVoiceText = useCallback((messageId: number) => {
    setShowVoiceTextMap(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }, [])

  return {
    showVoiceSender,
    setShowVoiceSender,
    playingVoiceId,
    showVoiceTextMap,
    handleSendVoice,
    handlePlayVoice,
    handleToggleVoiceText
  }
}
