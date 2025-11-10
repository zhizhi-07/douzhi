/**
 * 视频通话Hook
 * 管理视频通话状态和消息
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Character, Message } from '../../../types/chat'
import { callAIApi, buildVideoCallPrompt, ChatApiError, getApiSettings } from '../../../utils/chatApi'
import { getRecentMessages } from '../../../utils/messageUtils'
import { addMessage } from '../../../utils/simpleMessageManager'
import { 
  detectCommands, 
  removeControlCommands, 
  parseDialogueLines,
  logApiContext
} from '../../../utils/videoCallUtils'
import { callMinimaxTTS } from '../../../utils/voiceApi'

export interface CallMessage {
  id: number
  type: 'user' | 'ai' | 'narrator'
  content: string
  time: string
}

export const useVideoCall = (
  chatId: string,
  character: Character | null,
  chatMessages: Message[],
  setMessages: (fn: (prev: Message[]) => Message[]) => void
) => {
  const [isCallActive, setIsCallActive] = useState(false)
  const [callMessages, setCallMessages] = useState<CallMessage[]>([])
  const [isAITyping, setIsAITyping] = useState(false)
  const [callStartTime, setCallStartTime] = useState<number>(0)
  const [showIncomingCall, setShowIncomingCall] = useState(false)
  const [isAIInitiated, setIsAIInitiated] = useState(false) // 标记是否AI主动发起
  const isAIInitiatedRef = useRef(false) // 用ref保存AI主动发起的状态（用于提示词）
  const shouldAISpeakFirst = useRef(false) // 用ref来标记AI是否应该先说话
  const openingLinesRef = useRef<string | null>(null) // 保存AI第1次回复中的开场白
  const requestAIReplyRef = useRef<() => void>()
  const currentAudioRef = useRef<HTMLAudioElement | null>(null) // 当前播放的音频

  /**
   * 添加AI消息并播放语音
   */
  const addAIMessage = useCallback(async (content: string) => {
    const newMessage: CallMessage = {
      id: Date.now(),
      type: 'ai',
      content,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    setCallMessages(prev => [...prev, newMessage])
    
    // 生成并播放语音
    try {
      // 读取角色的音色ID配置
      const settingsKey = `chat_settings_${chatId}`
      const settingsStr = localStorage.getItem(settingsKey)
      const settings = settingsStr ? JSON.parse(settingsStr) : null
      const voiceId = settings?.voiceId
      
      if (voiceId) {
        console.log('🎤 [视频通话] 生成AI语音:', { content: content.substring(0, 30), voiceId })
        const ttsResult = await callMinimaxTTS(content, undefined, undefined, voiceId)
        
        // 停止之前的音频
        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
          currentAudioRef.current = null
        }
        
        // 播放新音频
        const audio = new Audio(ttsResult.audioUrl)
        currentAudioRef.current = audio
        
        audio.onended = () => {
          currentAudioRef.current = null
        }
        
        await audio.play()
        console.log('✅ [视频通话] 语音播放成功')
      } else {
        console.warn('⚠️ [视频通话] 未配置音色ID，跳过语音生成')
      }
    } catch (error) {
      console.error('❌ [视频通话] 语音生成失败:', error)
      // 语音失败不影响文字显示
    }
  }, [chatId])

  /**
   * 添加旁白消息（画面描述）
   */
  const addNarratorMessage = useCallback((content: string) => {
    console.log('📺 [useVideoCall] 添加旁白消息:', content)
    const newMessage: CallMessage = {
      id: Date.now(),
      type: 'narrator',
      content,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    setCallMessages(prev => {
      const newMessages = [...prev, newMessage]
      console.log(`  当前通话消息数: ${newMessages.length}`)
      return newMessages
    })
  }, [])

  /**
   * 开始视频通话
   */
  const startCall = useCallback(() => {
    console.log('📹 开始视频通话')
    setIsCallActive(true)
    setCallMessages([])
    setCallStartTime(Date.now())

    // 添加开场旁白
    setTimeout(() => {
      addNarratorMessage('视频通话已接通...')
      
      // 如果有开场白，逐句解析并显示
      if (openingLinesRef.current) {
        console.log('🎤 解析并逐句显示AI的开场白:', openingLinesRef.current)
        
        setTimeout(async () => {
          const lines = openingLinesRef.current!.split('\n').filter(l => l.trim())
          
          // 逐句显示，每句之间延迟
          for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            
            // 提取所有画面描述标签 [画面:...] 或 【画面：...】
            const narratorMatches = line.matchAll(/[\[【]画面[:\：](.+?)[\]】]/g)
            
            for (const match of narratorMatches) {
              addNarratorMessage(match[1].trim())
              // 从原文本中移除标签
              line = line.replace(match[0], '')
            }

            // 剩余文本作为普通对话
            const remainingText = line.trim()
            if (remainingText) {
              addAIMessage(remainingText)
            }
            
            // 等待一段时间再显示下一句（最后一句不等待）
            if (i < lines.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800))
            }
          }
          
          // 清空开场白引用
          openingLinesRef.current = null
          console.log('✅ 开场白已全部显示完毕')
        }, 300)
      }
    }, 500)
  }, [addNarratorMessage, addAIMessage])
  
  // 监听通话开始，如果需要AI先说话
  useEffect(() => {
    if (isCallActive && shouldAISpeakFirst.current && requestAIReplyRef.current) {
      console.log('🤖 通话已接通，让AI先说话')
      shouldAISpeakFirst.current = false
      
      setTimeout(() => {
        requestAIReplyRef.current?.()
      }, 1500)
    }
  }, [isCallActive])

  /**
   * AI发起视频通话
   * @param openingLines AI在第1次回复中说的开场白（可选）
   */
  const receiveIncomingCall = useCallback((openingLines?: string | null) => {
    console.log('📞 收到AI视频通话', { openingLines })
    setShowIncomingCall(true)
    setIsAIInitiated(true) // 标记为AI发起的通话
    openingLinesRef.current = openingLines || null  // 保存开场白
  }, [])

  /**
   * 接听来电
   */
  const acceptCall = useCallback(() => {
    console.log('✅ 接听视频通话')
    console.log('  - AI发起:', isAIInitiated)
    console.log('  - 开场白ref:', openingLinesRef.current)
    console.log('  - 开场白长度:', openingLinesRef.current?.length || 0)
    
    setShowIncomingCall(false)
    
    // 如果是AI主动打来的
    if (isAIInitiated) {
      // 检查是否有开场白
      if (openingLinesRef.current && openingLinesRef.current.trim()) {
        console.log('🎤 AI已在第1次回复中说了开场白，直接显示，不调用API')
        // 不需要再调用API，标记不让AI先说话
        shouldAISpeakFirst.current = false
      } else {
        console.log('⚠️ 开场白为空！AI主动打来的电话，标记让AI先说话（需要调用API）')
        shouldAISpeakFirst.current = true
        isAIInitiatedRef.current = true // 保存到ref，用于提示词
      }
      setIsAIInitiated(false)
    }
    
    startCall()
  }, [startCall, isAIInitiated])

  /**
   * 拒绝来电
   */
  const rejectCall = useCallback(() => {
    console.log('❌ 拒绝视频通话')
    setShowIncomingCall(false)
    
    // 添加拒绝提示（系统消息）
    const rejectMsg: Message = {
      id: Date.now(),
      type: 'system',
      content: '你拒绝了视频通话',  // 用户看到的文本
      aiReadableContent: '用户拒绝了你的视频通话请求',  // AI读取的文本
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: Date.now(),
      messageType: 'system'
    }
    
    // 立即保存到localStorage
    addMessage(chatId, rejectMsg)
    console.log('💾 [useVideoCall] 拒绝通话消息已保存')
    
    // 更新React状态
    setMessages(prev => [...prev, rejectMsg])
    
    // 清空开场白
    openingLinesRef.current = null
    setIsAIInitiated(false)
  }, [setMessages, chatId])

  /**
   * 结束视频通话
   */
  const endCall = useCallback(() => {
    console.log('📹 结束视频通话')
    
    // 停止当前播放的音频
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
      console.log('🔇 [视频通话] 已停止音频播放')
    }
    
    const duration = Math.floor((Date.now() - callStartTime) / 1000)
    
    // 检查是否有实际对话（排除开场旁白"视频通话已接通..."）
    const hasRealConversation = callMessages.some(msg => {
      // 如果是旁白，检查是否不是开场旁白
      if (msg.type === 'narrator') {
        return !msg.content.includes('视频通话已接通')
      }
      // 如果是用户或AI消息，就算有实际对话
      return true
    })
    
    console.log('📊 通话状态检查:', {
      duration,
      callMessagesCount: callMessages.length,
      hasRealConversation
    })
    
    if (!hasRealConversation && duration >= 0) {
      // 用户打了电话但没有接通就挂断了（包括0秒的情况）
      console.log('📞 用户拨打但未接通，时长:', duration, '秒')
      
      const cancelMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: `你拨打了视频通话 ${duration}秒（未接通）`,  // 用户看到的
        aiReadableContent: `用户给你打了视频电话，拨打了${duration}秒，但没有接通，被用户取消了`,  // AI看到的
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: Date.now(),
        messageType: 'system'
      }
      
      addMessage(chatId, cancelMessage)
      console.log('💾 [useVideoCall] 已保存拨打未接通记录')
      
      // 更新React状态
      setMessages(prev => {
        const newMessages = [...prev, cancelMessage]
        console.log('📊 [useVideoCall] 更新React状态:', prev.length, '->', newMessages.length)
        return newMessages
      })
    } else {
      // 接通后的通话记录（即使没有消息也要保存）
      // 过滤掉narrator消息（画面描述），只保存对话内容
      const dialogMessages = callMessages.filter(msg => msg.type !== 'narrator')
      
      // 正常通话记录
      const recordMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: `视频通话 ${Math.floor(duration / 60)}分${duration % 60}秒`,
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: Date.now(),
        messageType: 'video-call-record',
        videoCallRecord: {
          duration,
          messages: dialogMessages
        }
      }
      
      console.log('💾 [useVideoCall] 保存通话记录到localStorage', {
        duration: `${Math.floor(duration / 60)}分${duration % 60}秒`,
        原始消息数: callMessages.length,
        对话消息数: dialogMessages.length,
        chatId,
        recordMessageId: recordMessage.id
      })
      
      // 立即保存到localStorage
      addMessage(chatId, recordMessage)
      console.log('✅ [useVideoCall] localStorage保存完成')
      
      // 更新React状态（用于UI显示）
      setMessages(prev => {
        console.log(`📊 [useVideoCall] 更新React状态: ${prev.length} -> ${prev.length + 1}`)
        const newMessages = [...prev, recordMessage]
        console.log('📋 [useVideoCall] 新消息列表最后一条:', newMessages[newMessages.length - 1])
        return newMessages
      })
    }

    setIsCallActive(false)
    setCallMessages([])
    setCallStartTime(0)
    setIsAITyping(false)
    isAIInitiatedRef.current = false // 重置AI主动发起标记
  }, [callMessages, callStartTime, setMessages, chatId])

  /**
   * 发送用户消息
   */
  const sendMessage = useCallback((content: string) => {
    const newMessage: CallMessage = {
      id: Date.now(),
      type: 'user',
      content,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    setCallMessages(prev => [...prev, newMessage])
  }, [])

  /**
   * 请求AI回复
   */
  const requestAIReply = useCallback(async () => {
    if (!character || isAITyping) return

    setIsAITyping(true)

    try {
      const settings = getApiSettings()
      if (!settings) {
        addAIMessage('抱歉，API配置未设置')
        return
      }

      const systemPrompt = buildVideoCallPrompt(character, '用户', isAIInitiatedRef.current)

      // 构建对话历史（使用用户设置的消息条数）
      const recentMessages = getRecentMessages(chatMessages, chatId)
      const recentChatContext = recentMessages.map(msg => ({
        role: msg.type === 'sent' ? ('user' as 'user') : ('assistant' as 'assistant'),
        content: msg.content || msg.voiceText || '...'
      }))
      
      const callContext = callMessages.map(msg => {
        if (msg.type === 'narrator') {
          return { role: 'system' as 'system', content: `[画面: ${msg.content}]` }
        }
        return {
          role: msg.type === 'user' ? ('user' as 'user') : ('assistant' as 'assistant'),
          content: msg.content
        }
      })
      
      const apiMessages = [
        { role: 'system' as 'system', content: systemPrompt },
        ...recentChatContext,
        ...callContext
      ]
      
      // 输出到控制台：AI读取的提示词和记忆
      logApiContext({
        title: '[视频通话] AI读取的提示词和记忆',
        systemPrompt,
        chatContext: recentChatContext,
        callContext
      })

      const aiReply = await callAIApi(apiMessages, settings)

      // 检测并处理所有通话控制指令
      const detectedCommands = detectCommands(aiReply)
      const charName = character?.nickname || character?.realName || 'AI'
      
      let hasHangUpCommand = false
      for (const { command } of detectedCommands) {
        const message = command.message(charName)
        console.log(`${command.emoji} ${message}`)
        
        if (command.type === 'hang-up') {
          hasHangUpCommand = true
        } else {
          addNarratorMessage(message)
        }
      }
      
      // 处理挂断电话指令
      if (hasHangUpCommand) {
        // 解析挂断前的对话（排除所有指令）
        const hangUpMatch = aiReply.match(/[\[【]挂断电话[\]】]/)
        const contentBeforeEnd = hangUpMatch ? aiReply.split(hangUpMatch[0])[0] : aiReply
        const cleaned = removeControlCommands(contentBeforeEnd)
        const parsed = parseDialogueLines(cleaned)
        
        for (const item of parsed) {
          if (item.type === 'narrator') {
            addNarratorMessage(item.content)
          } else {
            addAIMessage(item.content)
          }
        }
        
        // 延迟挂断，让消息显示出来
        setTimeout(() => {
          endCall()
        }, 1500)
        
        return
      }
      
      // 正常解析：分离对话和画面描述（排除控制指令）
      const cleaned = removeControlCommands(aiReply)
      const parsed = parseDialogueLines(cleaned)
      
      for (const item of parsed) {
        if (item.type === 'narrator') {
          addNarratorMessage(item.content)
        } else {
          addAIMessage(item.content)
        }
      }
      
      // AI已经说过第一句话了，重置标记
      if (isAIInitiatedRef.current) {
        console.log('🤖 AI已说过开场白，重置isAIInitiated标记')
        isAIInitiatedRef.current = false
      }
    } catch (error) {
      console.error('AI回复失败:', error)
      if (error instanceof ChatApiError) {
        // 403错误特殊处理
        if (error.message.includes('403')) {
          addAIMessage('抱歉，API权限验证失败，请检查API密钥是否有效...')
        } else {
          addAIMessage('抱歉，网络有点卡...')
        }
      }
    } finally {
      setIsAITyping(false)
    }
  }, [character, chatId, chatMessages, callMessages, isAITyping, addAIMessage, addNarratorMessage, endCall])
  
  // 将 requestAIReply 存入 ref
  useEffect(() => {
    requestAIReplyRef.current = requestAIReply
  }, [requestAIReply])

  return {
    isCallActive,
    callMessages,
    isAITyping,
    showIncomingCall,
    startCall,
    endCall,
    sendMessage,
    addNarratorMessage,
    requestAIReply,
    receiveIncomingCall,
    acceptCall,
    rejectCall
  }
}
