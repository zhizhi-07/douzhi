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
  // 初始化为0，而不是Date.now()，这样第一次检查时会使用实际的最后一条消息时间
  const lastUserMessageTimeRef = useRef<number>(0)
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

      // 🔥 极简提示词，只告诉AI身份和人设
      const coreSystemPrompt = `你是${character.nickname || character.realName}。
性格：${character.personality || '普通人，有自己的生活。'}`

      // 构建判断提示词
      const minutesPassed = Math.floor((Date.now() - lastUserMessageTimeRef.current) / 60000)
      const thinkingPrompt = `距离用户最后一条消息已经过了${minutesPassed}分钟，用户还没有回复你。

根据上面的聊天记录和你的性格，你现在需要主动发消息给用户吗？

只回复"是"或"否"。`

      // 🔥 获取最近50条对话历史
      const recentMessages = getRecentMessages(messages, chatId, 50)
      const apiMessages = convertToApiMessages(recentMessages)
      
      // 添加精简的系统提示词
      apiMessages.unshift({
        role: 'system',
        content: coreSystemPrompt
      })
      
      // 添加思考提示
      apiMessages.push({
        role: 'user',
        content: thinkingPrompt
      })

      Logger.info(`[主动发消息] 🔥 准备调用副API...`)
      Logger.info(`[主动发消息] - API模型: ${summaryApi.model}`)
      Logger.info(`[主动发消息] - API地址: ${summaryApi.baseUrl}`)
      Logger.info(`[主动发消息] - 消息数量: ${apiMessages.length}`)
      Logger.info(`[主动发消息] - 最近对话: ${recentMessages.length}条`)
      Logger.info(`[主动发消息] - 核心提示词长度: ${coreSystemPrompt.length}字符 (已精简，不含表情包)`)
      
      const response = await callAIApi(apiMessages, summaryApi as any)
      
      Logger.info(`[主动发消息] ✅ API返回成功！`)
      Logger.info(`[主动发消息] - 原始回复: "${response}"`)
      Logger.info(`[主动发消息] - 回复长度: ${response.length}字符`)
      
      const shouldSend = response.trim().includes('是')
      Logger.info(`[主动发消息] - 最终决定: ${shouldSend ? '✅ 需要发送' : '❌ 不需要发送'}`)
      
      return shouldSend
    } catch (error) {
      Logger.error('[主动发消息] ❌ 思考失败:', error)
      Logger.error('[主动发消息] - 错误类型:', error instanceof Error ? error.name : typeof error)
      Logger.error('[主动发消息] - 错误消息:', error instanceof Error ? error.message : String(error))
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

      // 🎭 读取小剧场功能开关和面具设置
      const chatSettingsRaw = localStorage.getItem(`chat_settings_${chatId}`)
      let enableTheatreCards = false // 默认关闭
      let characterIndependence = false // 默认关闭
      let maskInfo: { nickname: string; realName?: string; signature?: string; persona?: string } | undefined = undefined
      
      if (chatSettingsRaw) {
        try {
          const parsed = JSON.parse(chatSettingsRaw)
          enableTheatreCards = parsed.enableTheatreCards ?? false
          characterIndependence = parsed.characterIndependence ?? false
          
          // 🎭 读取面具设置
          if (parsed.useMask && parsed.maskId) {
            const { getMasksWithAvatars } = await import('../../../utils/maskManager')
            const masks = await getMasksWithAvatars()
            const mask = masks.find(m => m.id === parsed.maskId)
            if (mask) {
              maskInfo = {
                nickname: mask.nickname,
                realName: mask.realName,
                signature: mask.signature,
                persona: mask.persona
              }
            }
          }
        } catch (e) {
          console.error('[主动发消息] 解析聊天设置失败:', e)
        }
      }
      
      // 使用主API生成消息
      const systemPrompt = await buildSystemPrompt(character, '用户', messages, enableTheatreCards, characterIndependence, false, maskInfo)
      // 使用用户设置的消息条数，而不是硬编码50条
      const recentMessages = getRecentMessages(messages, chatId)
      const apiMessages = convertToApiMessages(recentMessages)

      // 计算用户没有回复的时间
      const minutesPassed = Math.floor((Date.now() - lastUserMessageTimeRef.current) / 60000)
      const secondsPassed = Math.floor(((Date.now() - lastUserMessageTimeRef.current) % 60000) / 1000)
      
      // 添加主动发消息的提示（明确告诉AI用户没回复的时间）
      const proactivePrompt = `\n\n[系统提示] 用户已经${minutesPassed}分钟${secondsPassed}秒没有回复你了。请根据聊天记录和你的性格，主动发消息给用户。

你可以：
- 询问对方在做什么
- 分享你正在做的事情
- 继续之前的话题
- 表达你在等他/她
- 或者其他自然的开场

请自然地主动发起对话，让对话显得连贯自然，就像你真的在想他/她。`

      // 🔥 修改系统提示词，在主动发消息时明确告诉AI用户多久没回复
      const enhancedSystemPrompt = systemPrompt + `\n\n⚠️ 重要：用户已经${minutesPassed}分钟${secondsPassed}秒没有回复你了。你需要主动发起对话，让对话显得自然连贯。`
      
      apiMessages[0] = {
        role: 'system',
        content: enhancedSystemPrompt + proactivePrompt
      }

      const response = await callAIApi(apiMessages, apiSettings)
      
      // 解析AI消息
      const aiMessagesList = parseAIMessages(response)
      
      if (aiMessagesList.length === 0) {
        Logger.warn('[主动发消息] AI未返回有效消息')
        return
      }

      // 🔥 保存消息到IndexedDB（触发new-message事件，自动更新React状态）
      aiMessagesList.forEach((content) => {
        const msg = createMessage(content, 'received')
        saveMessageToStorage(chatId, msg)
      })

      Logger.success('[主动发消息] AI主动发送消息成功')
    } catch (error) {
      Logger.error('[主动发消息] 发送失败:', error)
    }
  }

  // 监听消息变化，更新最后一条用户消息的时间
  useEffect(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'sent')
    if (lastUserMessage && lastUserMessage.timestamp) {
      // 只有当用户发送了新消息时才更新时间和重置标志
      if (lastUserMessage.timestamp !== lastUserMessageTimeRef.current) {
        const timeStr = new Date(lastUserMessage.timestamp).toLocaleTimeString('zh-CN')
        Logger.info(`[主动发消息] 用户最后消息时间: ${timeStr}, 重置计时器`)
        lastUserMessageTimeRef.current = lastUserMessage.timestamp
        hasTriggeredRef.current = false  // 重置触发标志
      }
    } else if (lastUserMessage && !lastUserMessage.timestamp) {
      // 如果消息没有timestamp，使用当前时间
      const now = Date.now()
      Logger.info(`[主动发消息] 用户消息没有timestamp，使用当前时间`)
      lastUserMessageTimeRef.current = now
      hasTriggeredRef.current = false
    }
  }, [messages])

  // 设置定时检查
  useEffect(() => {
    const settings = getSettings()
    
    Logger.info(`[主动发消息] useEffect触发, enabled=${settings.enabled}, chatId=${chatId}`)
    
    if (!settings.enabled) {
      Logger.info(`[主动发消息] 功能未启用，清除定时器`)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // 清除旧的定时器
    if (timerRef.current) {
      Logger.info(`[主动发消息] 清除旧定时器`)
      clearInterval(timerRef.current)
    }

    // 在useEffect内部定义检查函数，能访问最新状态
    const checkAndTrigger = async () => {
      const currentSettings = getSettings()
      
      if (!currentSettings.enabled) return
      if (hasTriggeredRef.current) {
        // 已触发过，不再重复
        return
      }
      if (isAiTyping) return
      
      // 如果还没有初始化最后消息时间，不检查
      if (lastUserMessageTimeRef.current === 0) {
        Logger.info(`[主动发消息] ⏰ 定时器触发，但最后消息时间未初始化，跳过`)
        return
      }

      const now = Date.now()
      const timeSinceLastMessage = now - lastUserMessageTimeRef.current
      const intervalMs = currentSettings.interval * 60 * 1000
      const minutesPassed = Math.floor(timeSinceLastMessage / 60000)
      const secondsPassed = Math.floor(timeSinceLastMessage / 1000)
      
      // 每次检查都输出日志
      Logger.info(`[主动发消息] ⏰ 检查: 已过${minutesPassed}分${secondsPassed % 60}秒 / 设定${currentSettings.interval}分钟, 已触发=${hasTriggeredRef.current}`)

      // 只有时间到了才调用API
      if (timeSinceLastMessage >= intervalMs) {
        Logger.info(`[主动发消息] ✅ 时间到了！用户${minutesPassed}分钟未回复，触发检查`)

        if (currentSettings.mode === 'thinking') {
          // AI思考模式：先判断是否需要发送
          Logger.info('[主动发消息] 调用副API思考是否发送...')
          const shouldSend = await thinkAboutSending()
          
          if (shouldSend) {
            // AI决定发送，执行发送并设置已触发标志
            await sendProactiveMessage()
            hasTriggeredRef.current = true
            Logger.info('[主动发消息] ✅ 消息已发送，设置触发标志')
          } else {
            // AI决定不发送，更新最后检查时间，下个interval分钟后再检查
            lastUserMessageTimeRef.current = Date.now()
            Logger.info(`[主动发消息] ❌ AI决定不发送，${currentSettings.interval}分钟后再次检查`)
          }
        } else {
          // 固定模式：直接发送
          Logger.info('[主动发消息] 固定模式，直接发送')
          await sendProactiveMessage()
          hasTriggeredRef.current = true
          Logger.info('[主动发消息] ✅ 消息已发送，设置触发标志')
        }
      }
    }

    // 固定每30秒检查一次，足够精确
    const checkFrequency = 30000
    
    Logger.info(`[主动发消息] ✅ 定时器启动，每30秒检查一次（只有时间到了才会调用API）`)
    Logger.info(`[主动发消息] - 当前设置: mode=${settings.mode}, interval=${settings.interval}分钟`)
    Logger.info(`[主动发消息] - 最后消息时间: ${lastUserMessageTimeRef.current === 0 ? '未初始化' : new Date(lastUserMessageTimeRef.current).toLocaleTimeString('zh-CN')}`)
    
    timerRef.current = setInterval(() => {
      checkAndTrigger()
    }, checkFrequency) as unknown as number

    return () => {
      Logger.info(`[主动发消息] useEffect清理，移除定时器`)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [chatId, character, isAiTyping, messages]) // 依赖最新状态

  return {
    // 可以暴露一些方法，比如手动触发
    triggerProactiveMessage: sendProactiveMessage
  }
}
