/**
 * 语音功能Hook
 * 负责：语音发送、播放、转文字等逻辑
 */

import { useState, useCallback, useRef } from 'react'
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
  const currentAudioRef = useRef<HTMLAudioElement | null>(null) // 保存当前播放的音频

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
      // 暂停当前音频
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      setPlayingVoiceId(null)
    } else {
      // 停止之前的音频
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      
      // 播放新音频
      setPlayingVoiceId(messageId)
      
      if (voiceUrl) {
        // 有音频URL，播放真实音频
        try {
          const audio = new Audio(voiceUrl)
          currentAudioRef.current = audio
          
          audio.onended = () => {
            setPlayingVoiceId(null)
            currentAudioRef.current = null
          }
          
          audio.onerror = () => {
            console.error('音频播放失败')
            setPlayingVoiceId(null)
            currentAudioRef.current = null
          }
          
          await audio.play()
        } catch (error) {
          console.error('播放音频出错:', error)
          setPlayingVoiceId(null)
          currentAudioRef.current = null
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
