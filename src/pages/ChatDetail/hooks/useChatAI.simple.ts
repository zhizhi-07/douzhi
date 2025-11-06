/**
 * 简单版AI交互Hook
 * 不依赖复杂的状态管理，直接操作localStorage
 */

import { useState, useCallback, useRef } from 'react'
import type { Character, Message } from '../../../types/chat'
import { getApiSettings, buildSystemPrompt, callAIApi } from '../../../utils/chatApi'
import { loadMessages, addMessage, createTextMessage } from '../../../utils/simpleMessageManager'
import { convertToApiMessages, getRecentMessages } from '../../../utils/messageUtils'

export const useSimpleChatAI = (
  chatId: string,
  character: Character | null,
  setMessages: (messages: Message[]) => void,
  setError: (error: string | null) => void
) => {
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)

  /**
   * 发送消息
   */
  const handleSend = useCallback(async (inputValue: string, setInputValue: (val: string) => void) => {
    if (!inputValue.trim() || !character || isSending) return

    setIsSending(true)
    setError(null)

    try {
      // 创建用户消息并立即保存
      const userMessage = createTextMessage(inputValue.trim(), 'sent')
      addMessage(chatId, userMessage)
      
      // 更新UI
      const allMessages = loadMessages(chatId)
      setMessages(allMessages)
      setInputValue('')

      // 调用AI
      await handleAIReply()

    } catch (error) {
      console.error('发送失败:', error)
      setError('发送失败')
    } finally {
      setIsSending(false)
    }
  }, [chatId, character, isSending, setMessages, setError])

  /**
   * AI回复
   */
  const handleAIReply = useCallback(async () => {
    if (!character) return

    setIsAiTyping(true)
    setError(null)

    try {
      const settings = getApiSettings()
      if (!settings) {
        throw new Error('请先配置API')
      }

      // 从localStorage读取最新消息
      const allMessages = loadMessages(chatId)
      const recentMessages = getRecentMessages(allMessages, chatId)
      const apiMessages = convertToApiMessages(recentMessages)

      const systemPrompt = await buildSystemPrompt(character)
      const aiReply = await callAIApi(
        [{ role: 'system', content: systemPrompt }, ...apiMessages],
        settings
      )

      // 创建AI消息并立即保存
      const aiMessage = createTextMessage(aiReply, 'received')
      addMessage(chatId, aiMessage)

      // 更新UI
      const updatedMessages = loadMessages(chatId)
      setMessages(updatedMessages)

    } catch (error: any) {
      console.error('AI回复失败:', error)
      setError(error.message || 'AI回复失败')
    } finally {
      setIsAiTyping(false)
    }
  }, [chatId, character, setMessages, setError])

  return {
    isAiTyping,
    handleSend,
    handleAIReply
  }
}
