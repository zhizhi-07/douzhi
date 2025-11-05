/**
 * AI交互逻辑Hook（重构版）
 * 使用指令处理器模式，消除重复代码
 */

import { useState, useCallback, useRef } from 'react'
import type { Character, Message } from '../../../types/chat'
import {
  getApiSettings,
  buildSystemPrompt,
  callAIApi,
  ChatApiError
} from '../../../utils/chatApi'
import {
  createMessage,
  convertToApiMessages,
  getRecentMessages,
  parseAIMessages
} from '../../../utils/messageUtils'
import { Logger } from '../../../utils/logger'
import { commandHandlers } from './commandHandlers'

export const useChatAI = (
  character: Character | null,
  messages: Message[],
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  setError: (error: string | null) => void,
  onVideoCallRequest?: () => void
) => {
  const [isAiTyping, setIsAiTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  /**
   * 滚动到消息底部
   */
  const scrollToBottom = useCallback((instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' })
  }, [])
  
  /**
   * 发送用户消息
   */
  const handleSend = useCallback((
    inputValue: string, 
    setInputValue: (val: string) => void,
    quotedMessage?: Message | null,
    clearQuote?: () => void
  ) => {
    if (!inputValue.trim() || isAiTyping) return
    
    const userMessage: Message = {
      ...createMessage(inputValue, 'sent'),
      quotedMessage: quotedMessage ? {
        id: quotedMessage.id,
        content: quotedMessage.content || quotedMessage.voiceText || quotedMessage.photoDescription || '...',
        senderName: quotedMessage.type === 'sent' ? '我' : (character?.realName || 'AI'),
        type: quotedMessage.type
      } : undefined
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    if (clearQuote) clearQuote()
    
    setTimeout(() => scrollToBottom(false), 100)
  }, [isAiTyping, character, setMessages, scrollToBottom])

  /**
   * 处理AI回复
   */
  const handleAIReply = useCallback(async () => {
    if (!character) {
      setError('角色不存在')
      return
    }

    setIsAiTyping(true)
    setError(null)

    try {
      const settings = getApiSettings()
      if (!settings) {
        throw new ChatApiError('请先配置API', 'NO_API_CONFIG')
      }

      const systemPrompt = buildSystemPrompt(character)
      const recentMessages = getRecentMessages(messages)
      const apiMessages = convertToApiMessages(recentMessages)

      Logger.log('发送API请求', {
        messageCount: apiMessages.length,
        lastMessage: apiMessages[apiMessages.length - 1]
      })

      const aiReply = await callAIApi(
        [{ role: 'system', content: systemPrompt }, ...apiMessages],
        settings
      )
      
      Logger.log('收到AI回复', aiReply)
      
      const aiMessagesList = parseAIMessages(aiReply)
      console.log('📝 AI消息拆分结果:', aiMessagesList)
      
      // 使用指令处理器处理每条消息
      for (const content of aiMessagesList) {
        console.log(`🔄 处理消息: "${content}"`)
        let quotedMsg: Message['quotedMessage'] | undefined
        let messageContent = content
        let skipTextMessage = false

        // 持续处理指令直到没有更多匹配
        let shouldContinue = true
        while (shouldContinue) {
          shouldContinue = false
          
          // 遍历所有指令处理器
          for (const handler of commandHandlers) {
            const match = messageContent.match(handler.pattern)
            if (match) {
              const result = await handler.handler(match, messageContent, {
                messages,
                setMessages,
                character,
                onVideoCallRequest
              })

              if (result.handled) {
                // 检查是否跳过文本消息
                if (result.skipTextMessage) {
                  skipTextMessage = true
                }
                
                // 特殊处理引用指令
                if ('quotedMsg' in result) {
                  quotedMsg = result.quotedMsg
                  messageContent = result.messageContent || ''
                } else if (result.remainingText !== undefined) {
                  messageContent = result.remainingText
                }
                
                // 继续检查剩余文本中是否还有其他指令
                shouldContinue = true
                break
              }
            }
          }
        }

        // 如果有剩余文本且不是纯指令消息，发送普通消息
        console.log(`✅ 最终状态: skipTextMessage=${skipTextMessage}, messageContent="${messageContent}"`)
        
        if (!skipTextMessage && messageContent && messageContent.trim()) {
          console.log(`💬 创建普通消息: "${messageContent}"`)
          const aiMessage: Message = {
            ...createMessage(messageContent, 'received'),
            quotedMessage: quotedMsg
          }
          
          // 调试：输出引用消息信息
          if (quotedMsg) {
            console.log('📎 创建带引用的消息:', {
              quotedMsg,
              messageContent,
              aiMessage
            })
          }
          
          await new Promise(resolve => setTimeout(resolve, 300))
          setMessages(prev => [...prev, aiMessage])
        } else {
          console.log(`⏭️ 跳过创建消息`)
        }
      }
      
    } catch (error) {
      console.error('AI回复失败:', error)
      
      if (error instanceof ChatApiError) {
        setError(error.message)
      } else {
        setError('AI回复失败，请稍后重试')
      }
    } finally {
      setIsAiTyping(false)
    }
  }, [character, messages, setMessages, setError, onVideoCallRequest])

  /**
   * 重新生成AI回复
   */
  const handleRegenerate = useCallback(() => {
    setMessages(prev => {
      const lastAIIndex = [...prev].reverse().findIndex(msg => msg.type === 'received')
      if (lastAIIndex === -1) {
        setError('没有可重新生成的AI回复')
        return prev
      }
      
      const actualIndex = prev.length - 1 - lastAIIndex
      return prev.slice(0, actualIndex)
    })
    
    setTimeout(() => {
      handleAIReply()
    }, 100)
  }, [setMessages, setError, handleAIReply])

  return {
    isAiTyping,
    messagesEndRef,
    scrollToBottom,
    handleSend,
    handleAIReply,
    handleRegenerate
  }
}
