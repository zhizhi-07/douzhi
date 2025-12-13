/**
 * 全局AI主动发消息管理器
 * 在后台运行，监控所有角色，触发主动消息
 */

import { useEffect, useRef } from 'react'
import { characterService } from '../services/characterService'
import { loadMessages, addMessage as saveMessageToStorage, saveMessages } from '../utils/simpleMessageManager'
import { getApiSettings, callAIApi, buildSystemPrompt } from '../utils/chatApi'
import { getRecentMessages, convertToApiMessages, parseAIMessages, createMessage } from '../utils/messageUtils'
import { summaryApiService } from '../services/summaryApiService'
import { Logger } from '../utils/logger'
import { commandHandlers } from '../pages/ChatDetail/hooks/commandHandlers'
import type { Message } from '../types/chat'

/**
 * 发送系统通知（浏览器原生通知）
 */
const sendSystemNotification = (title: string, body: string, icon?: string) => {
  // 检查浏览器是否支持通知
  if (!('Notification' in window)) {
    Logger.warn('[系统通知] 浏览器不支持通知')
    return
  }

  // 如果已授权，直接发送
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      tag: `ai-message-${Date.now()}`, // 每条消息独立通知
      requireInteraction: false, // 不需要用户手动关闭
    })
    
    // 点击通知时聚焦窗口
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    
    // 5秒后自动关闭
    setTimeout(() => notification.close(), 5000)
    
    Logger.info(`[系统通知] 已发送: ${title} - ${body.substring(0, 20)}...`)
  } else if (Notification.permission !== 'denied') {
    // 请求权限
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        sendSystemNotification(title, body, icon)
      }
    })
  }
}

interface ProactiveMessageSettings {
  enabled: boolean
  mode: 'fixed' | 'thinking'
  interval: number  // 分钟
}

interface CharacterTimerState {
  lastUserMessageTime: number
  hasTriggered: boolean
}

const GlobalProactiveMessageManager = () => {
  // 记录每个角色的状态
  const characterStatesRef = useRef<Record<string, CharacterTimerState>>({})
  const timerRef = useRef<number | null>(null)
  const isInitializedRef = useRef<boolean>(false)

  /**
   * 获取角色的主动消息设置
   */
  const getSettings = (chatId: string): ProactiveMessageSettings => {
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
        return { enabled: false, mode: 'thinking', interval: 5 }
      }
    }
    return { enabled: false, mode: 'thinking', interval: 5 }
  }

  /**
   * 使用副API判断是否要发消息
   */
  const thinkAboutSending = async (chatId: string): Promise<boolean> => {
    try {
      const summaryApi = summaryApiService.get()
      const character = characterService.getById(chatId)
      if (!character) return false

      const state = characterStatesRef.current[chatId]
      if (!state) return false

      // 极简提示词，只告诉AI身份和人设
      const coreSystemPrompt = `你是${character.remark || character.nickname || character.realName}。
性格：${character.personality || '普通人，有自己的生活。'}`

      // 构建判断提示词
      const minutesPassed = Math.floor((Date.now() - state.lastUserMessageTime) / 60000)
      const thinkingPrompt = `距离用户最后一条消息已经过了${minutesPassed}分钟，用户还没有回复你。

根据上面的聊天记录和你的性格，你现在需要主动发消息给用户吗？

只回复"是"或"否"。`

      // 获取最近50条对话历史
      const messages = loadMessages(chatId)
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

      Logger.info(`[全局主动发消息] 🔥 ${character.nickname} - 调用副API判断...`)
      Logger.info(`[全局主动发消息] - 消息数量: ${apiMessages.length}`)
      Logger.info(`[全局主动发消息] - 最近对话: ${recentMessages.length}条`)
      
      const response = await callAIApi(apiMessages, summaryApi as any)
      
      const shouldSend = response.content.trim().includes('是')
      Logger.info(`[全局主动发消息] - ${character.nickname} 决定: ${shouldSend ? '✅ 发送' : '❌ 不发送'}`)
      Logger.info(`[全局主动发消息] - AI原始回复: "${response.content.trim()}"`)
      
      return shouldSend
    } catch (error) {
      Logger.error('[全局主动发消息] 思考失败:', error)
      return false
    }
  }

  /**
   * AI主动发送消息
   */
  const sendProactiveMessage = async (chatId: string) => {
    try {
      const character = characterService.getById(chatId)
      if (!character) return

      Logger.info(`[全局主动发消息] 💬 ${character.nickname} - 准备发送主动消息...`)

      const messages = loadMessages(chatId)
      const apiSettings = getApiSettings()
      if (!apiSettings) {
        Logger.error(`[全局主动发消息] ${character.nickname} - API设置不存在`)
        return
      }

      const recentMessages = getRecentMessages(messages)
      const apiMessages = convertToApiMessages(recentMessages)
      
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
            const { getMasksWithAvatars } = await import('../utils/maskManager')
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
          console.error('[全局主动发消息] 解析聊天设置失败:', e)
        }
      }
      
      const systemPrompt = await buildSystemPrompt(character, chatId, messages, enableTheatreCards, characterIndependence, false, maskInfo)

      apiMessages.unshift({
        role: 'system',
        content: systemPrompt
      })

      apiMessages.push({
        role: 'user',
        content: '(现在主动发消息给对方，根据你的性格和之前的对话自然地开启话题)'
      })

      const response = await callAIApi(apiMessages, apiSettings)
      const aiMessagesList = parseAIMessages(response.content)

      // 🔥 使用commandHandlers处理AI消息（支持照片、语音等指令）
      let currentMessages = loadMessages(chatId)
      
      // 模拟setMessages函数
      const setMessages = (updater: (prev: Message[]) => Message[]) => {
        const newMessages = updater(currentMessages)
        saveMessages(chatId, newMessages)
        currentMessages = newMessages  // 更新当前消息列表
        return newMessages
      }

      // 处理每条AI消息
      for (let messageContent of aiMessagesList) {
        Logger.info(`[全局主动发消息] 💬 ${character.nickname} - 处理消息: ${messageContent.substring(0, 30)}`)
        
        let isCommand = false
        
        // 遍历所有指令处理器
        for (const handler of commandHandlers) {
          const match = messageContent.match(handler.pattern)
          if (match) {
            Logger.info(`[全局主动发消息] 🎯 匹配到指令: ${handler.pattern.toString()}`)
            
            const result = await handler.handler(match, messageContent, {
              messages: currentMessages,
              character,
              setMessages,
              chatId,
              isBlocked: false
            })
            
            // 如果有剩余内容，继续处理
            if (result.remainingText) {
              messageContent = result.remainingText
            } else if (result.handled) {
              isCommand = true
              break
            }
          }
        }
        
        // 如果不是指令或有剩余内容，创建普通消息
        if (!isCommand && messageContent.trim()) {
          const msg = createMessage(messageContent, 'received')
          saveMessageToStorage(chatId, msg)
          Logger.info(`[全局主动发消息] ✅ ${character.nickname} - 保存普通消息`)
          
          // 🔔 保存消息时立即发送系统通知
          const displayMessage = messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent
          sendSystemNotification(
            character.remark || character.nickname || character.realName || 'AI',
            displayMessage,
            character.avatar
          )
          
          // 同时触发应用内通知事件
          window.dispatchEvent(new CustomEvent('background-chat-message', {
            detail: {
              title: character.remark || character.nickname || character.realName,
              message: displayMessage,
              chatId,
              avatar: character.avatar
            }
          }))
        } else if (isCommand) {
          Logger.info(`[全局主动发消息] ✅ ${character.nickname} - 已处理指令`)
        }
      }

      Logger.success(`[全局主动发消息] ${character.nickname} - 成功发送${aiMessagesList.length}条消息`)
    } catch (error) {
      Logger.error('[全局主动发消息] 发送失败:', error)
    }
  }

  /**
   * 检查单个角色是否需要触发主动消息
   */
  const checkCharacter = async (chatId: string) => {
    // 🔥 先检查角色是否存在
    const character = characterService.getById(chatId)
    if (!character) {
      // 角色不存在，静默跳过，不打印日志避免刷屏
      return
    }

    const settings = getSettings(chatId)
    if (!settings.enabled) return

    // 初始化状态
    if (!characterStatesRef.current[chatId]) {
      const messages = loadMessages(chatId)
      const lastUserMessage = [...messages].reverse().find(m => m.type === 'sent')
      
      characterStatesRef.current[chatId] = {
        lastUserMessageTime: lastUserMessage?.timestamp || 0,
        hasTriggered: false
      }
      
      if (lastUserMessage?.timestamp) {
        const timeStr = new Date(lastUserMessage.timestamp).toLocaleTimeString('zh-CN')
        Logger.info(`[全局主动发消息] 初始化 ${character.nickname} - 最后消息时间: ${timeStr}`)
      }
    }

    const state = characterStatesRef.current[chatId]
    
    // 如果未初始化，跳过
    if (state.lastUserMessageTime === 0) {
      Logger.info(`[全局主动发消息] ⏭️ ${character.nickname} - 未初始化，跳过`)
      return
    }

    const now = Date.now()
    const timeSinceLastMessage = now - state.lastUserMessageTime
    const intervalMs = settings.interval * 60 * 1000
    const minutesPassed = Math.floor(timeSinceLastMessage / 60000)
    const secondsPassed = Math.floor(timeSinceLastMessage / 1000)

    Logger.info(`[全局主动发消息] 🔍 ${character.nickname} - 检查: 已过${minutesPassed}分${secondsPassed % 60}秒 / 设定${settings.interval}分钟`)

    // 只有时间到了才处理
    if (timeSinceLastMessage >= intervalMs) {
      Logger.info(`[全局主动发消息] ⏰ ${character.nickname} - ✅ 时间到了(${minutesPassed}分钟)`)

      if (settings.mode === 'thinking') {
        // AI思考模式
        const shouldSend = await thinkAboutSending(chatId)
        
        if (shouldSend) {
          await sendProactiveMessage(chatId)
          // 🔥 发送后重置时间，继续下个周期的思考
          state.lastUserMessageTime = Date.now()
          state.hasTriggered = false
          Logger.info(`[全局主动发消息] 🔄 ${character.nickname} - 已发送，${settings.interval}分钟后继续思考`)
        } else {
          // 不发送，更新检查时间
          state.lastUserMessageTime = Date.now()
          Logger.info(`[全局主动发消息] ⏭️ ${character.nickname} - 不发送，${settings.interval}分钟后再次思考`)
        }
      } else {
        // 固定模式：直接发送
        await sendProactiveMessage(chatId)
        // 🔥 发送后重置时间，继续下个周期
        state.lastUserMessageTime = Date.now()
        state.hasTriggered = false
        Logger.info(`[全局主动发消息] 🔄 ${character.nickname} - 已发送，${settings.interval}分钟后继续发送`)
      }
    }
  }

  /**
   * 监听消息变化，更新状态
   */
  useEffect(() => {
    const handleMessageSaved = (event: CustomEvent) => {
      const { chatId } = event.detail
      
      // 🔥 先检查角色是否存在
      const character = characterService.getById(chatId)
      if (!character) {
        // 角色不存在，静默跳过
        return
      }
      
      const messages = loadMessages(chatId)
      const lastUserMessage = [...messages].reverse().find(m => m.type === 'sent')
      
      if (lastUserMessage?.timestamp) {
        const state = characterStatesRef.current[chatId]
        
        // 只有新消息才重置
        if (!state || lastUserMessage.timestamp !== state.lastUserMessageTime) {
          characterStatesRef.current[chatId] = {
            lastUserMessageTime: lastUserMessage.timestamp,
            hasTriggered: false
          }
          
          Logger.info(`[全局主动发消息] 📬 ${character.nickname} - 收到用户新消息，重置计时器`)
        }
      }
    }

    window.addEventListener('chat-message-saved', handleMessageSaved as EventListener)
    
    return () => {
      window.removeEventListener('chat-message-saved', handleMessageSaved as EventListener)
    }
  }, [])

  /**
   * 全局定时检查
   */
  useEffect(() => {
    // 🔥 防止重复初始化（React StrictMode会重复挂载）
    if (isInitializedRef.current) {
      Logger.info('[全局主动发消息] ⚠️ 已初始化，跳过重复启动')
      return
    }
    
    isInitializedRef.current = true
    Logger.info('[全局主动发消息] 🚀 管理器启动')

    // 每30秒检查所有角色
    const checkFrequency = 30000
    
    const checkAll = async () => {
      const allCharacters = characterService.getAll()
      Logger.info(`[全局主动发消息] ⏰ 定时检查，共${allCharacters.length}个角色`)
      
      // 只检查真正存在的角色
      for (const character of allCharacters) {
        if (character && character.id) {
          await checkCharacter(character.id)
        }
      }
    }

    // 立即检查一次
    checkAll()

    // 定期检查
    timerRef.current = setInterval(() => {
      checkAll()
    }, checkFrequency) as unknown as number

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      isInitializedRef.current = false
      Logger.info('[全局主动发消息] 管理器停止')
    }
  }, [])

  return null
}

export default GlobalProactiveMessageManager
