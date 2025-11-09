/**
 * AI主动发消息Hook
 * 监控用户无回复时间，触发AI主动发消息
 */

import { useEffect, useRef } from 'react'
import type { Character, Message } from '../../../types/chat'
import { getApiSettings, callAIApi, buildSystemPrompt } from '../../../utils/chatApi'
import { getRecentMessages, convertToApiMessages, parseAIMessages, createMessage } from '../../../utils/messageUtils'
import { addMessage as saveMessageToStorage } from '../../../utils/simpleMessageManager'
import { Logger } from '../../../utils/logger'
import { summaryApiService } from '../../../services/summaryApiService'

interface ProactiveMessageSettings {
  enabled: boolean
  mode: 'fixed' | 'thinking'
  interval: number  // 分钟
}

interface UseProactiveMessageProps {
  chatId: string
  character: Character | null
  messages: Message[]
  setMessages: (fn: (prev: Message[]) => Message[]) => void
  isAiTyping: boolean
}

export const useProactiveMessage = ({
  chatId,
  character,
  messages,
  setMessages,
  isAiTyping
}: UseProactiveMessageProps) => {
  const timerRef = useRef<number | null>(null)
  const lastUserMessageTimeRef = useRef<number>(Date.now())
  const hasTriggeredRef = useRef<boolean>(false)

  // 获取配置
  const getSettings = (): ProactiveMessageSettings => {
    const saved = localStorage.getItem(`chat_settings_${chatId}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        return data.aiProactiveMessage ?? {
          enabled: false,
          mode: 'thinking',
          interval: 5
        }
      } catch (e) {
        return {
          enabled: false,
          mode: 'thinking',
          interval: 5
        }
      }
    }
    return {
      enabled: false,
      mode: 'thinking',
      interval: 5
    }
  }

  /**
   * 使用副API调用，让AI思考是否要发消息
   */
  const thinkAboutSending = async (): Promise<boolean> => {
    try {
      // 直接使用现有的summaryApiService
      const summaryApi = summaryApiService.get()
      if (!character) return false

      // 构建思考提示词
      const thinkingPrompt = `你是${character.nickname || character.realName}。
用户已经${Math.floor((Date.now() - lastUserMessageTimeRef.current) / 60000)}分钟没有回复你了。

请思考：在当前的对话情境下，你是否需要主动发消息给用户？

考虑因素：
- 你们之前的对话内容和关系
- 对话是否已经自然结束
- 主动发消息是否符合你的性格
- 是否有值得分享或询问的事情

请只回复"是"或"否"，不要解释。`

      // 获取最近的对话历史
      const recentMessages = getRecentMessages(messages, chatId, 20)
      const apiMessages = convertToApiMessages(recentMessages)
      
      // 添加思考提示
      apiMessages.push({
        role: 'user',
        content: thinkingPrompt
      })

      Logger.info(`[主动发消息] 调用副API思考是否发送... (${summaryApi.model})`)
      const response = await callAIApi(apiMessages, summaryApi as any)
      
      const shouldSend = response.trim().includes('是')
      Logger.info(`[主动发消息] AI思考结果: ${shouldSend ? '需要发送' : '不需要发送'}`)
      
      return shouldSend
    } catch (error) {
      Logger.error('[主动发消息] 思考失败:', error)
      return false
    }
  }

  /**
   * AI主动发送消息
   */
  const sendProactiveMessage = async () => {
    if (!character || isAiTyping) return

    try {
      Logger.info('[主动发消息] 开始生成主动消息...')

      const apiSettings = getApiSettings()
      if (!apiSettings) {
        Logger.error('[主动发消息] 未配置API')
        return
      }

      // 使用主API生成消息
      const systemPrompt = await buildSystemPrompt(character, '用户')
      const recentMessages = getRecentMessages(messages, chatId, 50)
      const apiMessages = convertToApiMessages(recentMessages)

      // 添加主动发消息的提示
      const proactivePrompt = `\n\n[系统提示] 用户已经有一段时间没有回复了。你可以主动发消息，比如：
- 询问对方在做什么
- 分享你正在做的事情
- 继续之前的话题
- 或者其他自然的开场

请自然地主动发起对话。`

      apiMessages[0] = {
        role: 'system',
        content: systemPrompt + proactivePrompt
      }

      const response = await callAIApi(apiMessages, apiSettings)
      
      // 解析AI消息
      const aiMessagesList = parseAIMessages(response)
      
      if (aiMessagesList.length === 0) {
        Logger.warn('[主动发消息] AI未返回有效消息')
        return
      }

      // 添加消息到界面
      setMessages((prev) => {
        const newMessages = [...prev]
        aiMessagesList.forEach((content) => {
          const msg = createMessage(content, 'received')
          newMessages.push(msg)
          saveMessageToStorage(chatId, msg)
        })
        return newMessages
      })

      Logger.success('[主动发消息] AI主动发送消息成功')
    } catch (error) {
      Logger.error('[主动发消息] 发送失败:', error)
    }
  }

  /**
   * 检查是否需要触发主动发消息
   */
  const checkAndTrigger = async () => {
    const settings = getSettings()
    
    if (!settings.enabled) return
    if (hasTriggeredRef.current) {
      // 已触发过，不再重复
      return
    }
    if (isAiTyping) return

    const timeSinceLastMessage = Date.now() - lastUserMessageTimeRef.current
    const intervalMs = settings.interval * 60 * 1000
    const minutesPassed = Math.floor(timeSinceLastMessage / 60000)

    // 只有时间到了才调用API
    if (timeSinceLastMessage >= intervalMs) {
      hasTriggeredRef.current = true
      Logger.info(`[主动发消息] 时间到了！用户${minutesPassed}分钟未回复，触发检查`)

      if (settings.mode === 'thinking') {
        // AI思考模式：先判断是否需要发送
        Logger.info('[主动发消息] 调用副API思考是否发送...')
        const shouldSend = await thinkAboutSending()
        
        if (shouldSend) {
          await sendProactiveMessage()
        } else {
          Logger.info('[主动发消息] AI决定不发送消息')
        }
      } else {
        // 固定模式：直接发送
        Logger.info('[主动发消息] 固定模式，直接发送')
        await sendProactiveMessage()
      }
    }
  }

  // 监听消息变化，更新最后一条用户消息的时间
  useEffect(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'sent')
    if (lastUserMessage) {
      // 只有当用户发送了新消息时才更新时间和重置标志
      if (lastUserMessage.timestamp !== lastUserMessageTimeRef.current) {
        Logger.info(`[主动发消息] 用户发送了新消息，重置计时器`)
        lastUserMessageTimeRef.current = lastUserMessage.timestamp
        hasTriggeredRef.current = false  // 重置触发标志
      }
    }
  }, [messages])

  // 设置定时检查
  useEffect(() => {
    const settings = getSettings()
    
    if (!settings.enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // 固定每30秒检查一次，足够精确
    const checkFrequency = 30000
    
    Logger.info(`[主动发消息] 定时器启动，每30秒检查一次（只有时间到了才会调用API）`)
    
    timerRef.current = setInterval(() => {
      checkAndTrigger()
    }, checkFrequency) as unknown as number

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [chatId]) // 只依赖chatId，避免频繁重建定时器

  return {
    // 可以暴露一些方法，比如手动触发
    triggerProactiveMessage: sendProactiveMessage
  }
}
