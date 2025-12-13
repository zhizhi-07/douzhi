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
  const messageIdCounterRef = useRef(0) // 🔥 消息ID计数器，确保唯一性

  /**
   * 添加AI消息并播放语音
   * 🔥 修复：先生成语音，再显示文字，避免用户看到文字后立即关闭导致听不到语音
   */
  const addAIMessage = useCallback(async (content: string) => {
    console.log('🎬 [addAIMessage] 开始处理:', { content: content.substring(0, 50) })
    
    // 🔥 生成绝对唯一的ID：时间戳 * 10000 + 计数器
    const now = Date.now()
    const uniqueId = now * 10000 + (messageIdCounterRef.current++)
    
    console.log('🎯 [addAIMessage] 生成消息ID:', { uniqueId, now, counter: messageIdCounterRef.current - 1 })
    
    const newMessage: CallMessage = {
      id: uniqueId,
      type: 'ai',
      content,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // 🔥 关键修复：先生成语音，再显示文字
    try {
      // 读取角色的音色ID配置
      const settingsKey = `chat_settings_${chatId}`
      const settingsStr = localStorage.getItem(settingsKey)
      const settings = settingsStr ? JSON.parse(settingsStr) : null
      const voiceId = settings?.voiceId
      
      console.log('🔍 [addAIMessage] 音色配置:', { voiceId, hasSettings: !!settings })
      
      if (voiceId) {
        console.log('🎤 [视频通话] 开始生成AI语音:', { content: content.substring(0, 30), voiceId })
        
        // 先生成语音（等待完成）
        const ttsResult = await callMinimaxTTS(content, undefined, undefined, voiceId)
        console.log('✅ [视频通话] 语音生成完成:', ttsResult)
        
        // 停止之前的音频
        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
          currentAudioRef.current = null
        }
        
        // 语音生成完成后，显示文字
        setCallMessages(prev => {
          // 🔥 防重复检查
          const isDuplicate = prev.some(m => m.id === uniqueId)
          if (isDuplicate) {
            console.warn('⚠️ [视频通话] 检测到重复消息ID:', uniqueId, '，跳过添加')
            return prev
          }
          console.log('📝 [视频通话] 正在更新消息列表，添加文字, ID:', uniqueId)
          return [...prev, newMessage]
        })
        console.log('✅ [视频通话] 文字已添加到状态, ID:', uniqueId)
        
        // 立即播放音频
        const audio = new Audio(ttsResult.audioUrl)
        currentAudioRef.current = audio
        
        audio.onended = () => {
          currentAudioRef.current = null
          console.log('🔇 [视频通话] 语音播放结束')
        }
        
        await audio.play()
        console.log('🔊 [视频通话] 语音开始播放')
      } else {
        // 没有配置语音，直接显示文字
        console.warn('⚠️ [视频通话] 未配置音色ID，跳过语音生成，直接显示文字')
        setCallMessages(prev => {
          // 🔥 防重复检查
          const isDuplicate = prev.some(m => m.id === uniqueId)
          if (isDuplicate) {
            console.warn('⚠️ [视频通话] 检测到重复消息ID:', uniqueId, '，跳过添加')
            return prev
          }
          console.log('📝 [视频通话] 直接添加文字（无语音）, ID:', uniqueId)
          return [...prev, newMessage]
        })
        console.log('✅ [视频通话] 文字已添加（无语音模式）, ID:', uniqueId)
      }
    } catch (error) {
      console.error('❌ [视频通话] 语音生成失败:', error)
      console.error('❌ 错误详情:', error)
      // 语音失败也要显示文字
      setCallMessages(prev => {
        // 🔥 防重复检查
        const isDuplicate = prev.some(m => m.id === uniqueId)
        if (isDuplicate) {
          console.warn('⚠️ [视频通话] 检测到重复消息ID:', uniqueId, '，跳过添加')
          return prev
        }
        console.log('📝 [视频通话] 语音失败，添加文字, ID:', uniqueId)
        return [...prev, newMessage]
      })
      console.log('✅ [视频通话] 文字已添加（语音失败后）, ID:', uniqueId)
    }
    
    console.log('🏁 [addAIMessage] 处理完成')
  }, [chatId])

  /**
   * 添加旁白消息（画面描述）
   */
  const addNarratorMessage = useCallback((content: string) => {
    console.log('📺 [useVideoCall] 添加旁白消息:', content)
    
    // 🔥 生成绝对唯一的ID
    const now = Date.now()
    const uniqueId = now * 10000 + (messageIdCounterRef.current++)
    
    const newMessage: CallMessage = {
      id: uniqueId,
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
      // 🔥 修复：无论有没有开场白，都要标记为AI发起
      isAIInitiatedRef.current = true
      
      // 检查是否有开场白
      if (openingLinesRef.current && openingLinesRef.current.trim()) {
        console.log('🎤 AI已在第1次回复中说了开场白，直接显示，不调用API')
        // 不需要再调用API，标记不让AI先说话
        shouldAISpeakFirst.current = false
      } else {
        console.log('⚠️ 开场白为空！AI主动打来的电话，标记让AI先说话（需要调用API）')
        shouldAISpeakFirst.current = true
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
      aiReadableContent: `[重要]用户拒绝了你的视频通话请求。你主动打给用户的视频电话被拒绝了，用户不想接听。`,  // AI读取的文本
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: Date.now(),
      messageType: 'system'
    }
    
    // 🔥 保存到IndexedDB（触发new-message事件，自动更新React状态）
    addMessage(chatId, rejectMsg)
    console.log('💾 [useVideoCall] 拒绝通话消息已保存')
    
    // 清空开场白
    openingLinesRef.current = null
    setIsAIInitiated(false)
  }, [setMessages, chatId])

  /**
   * 结束视频通话
   */
  const endCall = useCallback(async () => {
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
      hasRealConversation,
      isAIInitiated: isAIInitiatedRef.current
    })
    
    if (!hasRealConversation && duration >= 0) {
      // 🔥 修复：区分AI主动发起和用户主动拨打
      let cancelMessage: Message
      
      if (isAIInitiatedRef.current) {
        // AI主动打来的电话，用户接听了但没说话就挂了
        console.log('📞 AI主动发起通话，用户接听但无对话，时长:', duration, '秒')
        
        cancelMessage = {
          id: Date.now(),
          type: 'system',
          content: `视频通话 ${duration}秒`,  // 用户看到的
          aiReadableContent: `[重要]用户接听了你主动发起的视频通话，但通话中没有说话，${duration}秒后用户挂断了电话。`,  // AI看到的：让AI知道用户接听了
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: Date.now(),
          messageType: 'system'
        }
      } else {
        // 用户打了电话但没有接通就挂断了（包括0秒的情况）
        console.log('📞 用户拨打但未接通，时长:', duration, '秒')
        
        cancelMessage = {
          id: Date.now(),
          type: 'system',
          content: `你拨打了视频通话 ${duration}秒（未接通）`,  // 用户看到的
          aiReadableContent: `[重要]用户给你打了视频电话，拨打了${duration}秒，但没有接通，被用户取消了。`,  // AI看到的
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: Date.now(),
          messageType: 'system'
        }
      }
      
      addMessage(chatId, cancelMessage)
      console.log('💾 [useVideoCall] 已保存通话记录')
      
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
        aiReadableContent: `[重要]你们进行了${Math.floor(duration / 60)}分${duration % 60}秒的视频通话。通话内容：${dialogMessages.map(msg => {
          const speaker = msg.type === 'user' ? '用户' : '你'
          return `${speaker}: ${msg.content}`
        }).join('; ')}`,
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
      console.log('💾 [useVideoCall] localStorage保存完成')
      
      // 更新React状态（用于UI显示）
      setMessages(prev => {
        console.log(`📊 [useVideoCall] 更新React状态: ${prev.length} -> ${prev.length + 1}`)
        const newMessages = [...prev, recordMessage]
        console.log('📋 [useVideoCall] 新消息列表最后一条:', newMessages[newMessages.length - 1])
        return newMessages
      })
      
      // 等待50ms确保保存完成（给IndexedDB写入时间）
      await new Promise(resolve => setTimeout(resolve, 50))
      console.log('✅ [useVideoCall] 视频通话记录保存等待完成')
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
    // 🔥 生成绝对唯一的ID
    const now = Date.now()
    const uniqueId = now * 10000 + (messageIdCounterRef.current++)
    
    console.log('💬 [sendMessage] 用户发送消息, ID:', uniqueId, 'content:', content.substring(0, 30))
    
    const newMessage: CallMessage = {
      id: uniqueId,
      type: 'user',
      content,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    setCallMessages(prev => {
      // 🔥 防重复检查
      const isDuplicate = prev.some(m => m.id === uniqueId)
      if (isDuplicate) {
        console.warn('⚠️ [sendMessage] 检测到重复消息ID:', uniqueId, '，跳过添加')
        return prev
      }
      return [...prev, newMessage]
    })
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

      // 🔥 修复：从localStorage重新读取最新消息（确保包含视频通话记录）
      const { loadMessages } = await import('../../../utils/simpleMessageManager')
      const allStoredMessages = loadMessages(chatId)
      console.log('📦 [视频通话AI回复] 从localStorage读取消息:', allStoredMessages.length)
      
      // 构建对话历史（使用用户设置的消息条数）
      const recentMessages = getRecentMessages(allStoredMessages, chatId)
      const recentChatContext = recentMessages.map(msg => ({
        role: msg.type === 'sent' ? ('user' as 'user') : ('assistant' as 'assistant'),
        content: msg.content || msg.voiceText || '...'
      }))
      
      console.log('📊 [视频通话AI回复] 聊天历史:', {
        总消息数: allStoredMessages.length,
        最近消息数: recentMessages.length,
        包含视频通话记录: recentMessages.some(m => m.messageType === 'video-call-record')
      })
      
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

      // 🔥 临时禁用流式响应（视频通话需要语音合成，必须等待完整响应）
      const originalStreaming = localStorage.getItem('offline-streaming')
      localStorage.setItem('offline-streaming', 'false')
      
      let result
      try {
        result = await callAIApi(apiMessages, settings)
      } finally {
        // 🔥 无论成功还是失败，都要恢复原设置
        if (originalStreaming) {
          localStorage.setItem('offline-streaming', originalStreaming)
        } else {
          localStorage.removeItem('offline-streaming')
        }
        console.log('🔄 [视频通话] 已恢复流式设置:', originalStreaming || '(removed)')
      }
      
      console.log('📦 [视频通话] API返回的完整结果:', result)
      console.log('📊 [视频通话] Token使用情况:', result.usage)
      
      const aiReply = result.content  // 🔥 修复：提取 content 字段
      
      console.log('✅ [视频通话] AI回复内容:', {
        长度: aiReply.length,
        前100字符: aiReply.substring(0, 100),
        完整内容: aiReply
      })
      
      // 🔥 检查 AI 是否返回空内容
      if (!aiReply || aiReply.trim().length === 0) {
        console.error('❌ [视频通话] AI返回空内容！')
        addAIMessage('...')  // 显示省略号表示AI无话可说
        return
      }

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
        // 🔥 修复：先移除[挂断电话]指令，再解析对话
        const hangUpMatch = aiReply.match(/[\[【]挂断电话[\]】]/)
        if (!hangUpMatch) {
          console.error('❌ [视频通话] 检测到挂断指令但找不到匹配的文本！')
          endCall()
          return
        }
        
        // 获取挂断前的内容（不包括[挂断电话]）
        const contentBeforeEnd = aiReply.split(hangUpMatch[0])[0]
        console.log('📞 [视频通话] 挂断前的内容:', contentBeforeEnd.substring(0, 100))
        
        // 清理所有控制指令
        const cleaned = removeControlCommands(contentBeforeEnd)
        const parsed = parseDialogueLines(cleaned)
        
        // 🔥 逐句显示，每句之间有延迟
        for (let i = 0; i < parsed.length; i++) {
          const item = parsed[i]
          if (item.type === 'narrator') {
            addNarratorMessage(item.content)
            await new Promise(resolve => setTimeout(resolve, 300))
          } else {
            await addAIMessage(item.content)
            // 每句话之间延迟
            if (i < parsed.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800))
            }
          }
        }
        
        // 延迟挂断，让最后一句消息显示出来
        setTimeout(() => {
          endCall()
        }, 1500)
        
        return
      }
      
      // 正常解析：分离对话和画面描述（排除控制指令）
      const cleaned = removeControlCommands(aiReply)
      console.log('🧹 [视频通话] 清理指令后的内容:', cleaned)
      
      const parsed = parseDialogueLines(cleaned)
      console.log('📝 [视频通话] 解析结果:', parsed)
      
      if (parsed.length === 0) {
        console.warn('⚠️ [视频通话] 解析后没有内容！AI可能只返回了指令或空内容')
        console.warn('原始回复:', aiReply)
        console.warn('清理后:', cleaned)
        // 显示省略号，避免完全不出字
        addAIMessage('...')
        return
      }
      
      // 🔥 逐句显示，每句之间有延迟，更自然
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i]
        console.log(`🔄 [视频通话] 处理项目 [${i+1}/${parsed.length}]:`, item)
        
        if (item.type === 'narrator') {
          addNarratorMessage(item.content)
          // 旁白后短暂延迟
          await new Promise(resolve => setTimeout(resolve, 300))
        } else {
          console.log(`📢 [视频通话] 准备调用 addAIMessage:`, item.content)
          await addAIMessage(item.content)
          console.log(`✅ [视频通话] addAIMessage 完成`)
          
          // 每句话之间延迟，让用户有时间阅读（最后一句不延迟）
          if (i < parsed.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800))
          }
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
          addAIMessage('API权限验证失败，请检查API密钥')
        } else if (error.message.includes('timeout') || error.message.includes('超时')) {
          addAIMessage('API响应超时，请稍后重试')
        } else if (error.message.includes('network') || error.message.includes('网络')) {
          addAIMessage('网络连接失败，请检查网络')
        } else {
          addAIMessage(`API调用失败: ${error.message}`)
        }
      } else {
        addAIMessage('发生错误，请重试')
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
