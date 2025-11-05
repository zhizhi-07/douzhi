/**
 * 视频通话Hook
 * 管理视频通话状态和消息
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Message, Character } from '../../../types/chat'
import { getApiSettings, buildVideoCallPrompt, callAIApi, ChatApiError } from '../../../utils/chatApi'

export interface CallMessage {
  id: number
  type: 'user' | 'ai' | 'narrator'
  content: string
  time: string
}

export const useVideoCall = (
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
  const shouldAISpeakFirst = useRef(false) // 用ref来标记AI是否应该先说话
  const requestAIReplyRef = useRef<() => void>()

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
    }, 500)
  }, [])
  
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
   */
  const receiveIncomingCall = useCallback(() => {
    console.log('📞 收到AI视频通话')
    setShowIncomingCall(true)
    setIsAIInitiated(true) // 标记为AI发起的通话
  }, [])

  /**
   * 接听来电
   */
  const acceptCall = useCallback(() => {
    console.log('✅ 接听视频通话, AI发起:', isAIInitiated)
    setShowIncomingCall(false)
    
    // 如果是AI主动打来的，标记AI应该先说话
    if (isAIInitiated) {
      console.log('🤖 AI主动打来的电话，标记让AI先说话')
      shouldAISpeakFirst.current = true
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
    
    // 添加拒绝提示
    const rejectMsg: Message = {
      id: Date.now(),
      type: 'system',
      content: '你拒绝了视频通话',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: Date.now(),
      messageType: 'system'
    }
    setMessages(prev => [...prev, rejectMsg])
  }, [setMessages])

  /**
   * 结束视频通话
   */
  const endCall = useCallback(() => {
    console.log('📹 结束视频通话')
    
    // 保存通话记录到聊天消息
    if (callMessages.length > 0) {
      const duration = Math.floor((Date.now() - callStartTime) / 1000)
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
          messages: callMessages
        }
      }
      setMessages(prev => [...prev, recordMessage])
    }

    setIsCallActive(false)
    setCallMessages([])
    setCallStartTime(0)
    setIsAITyping(false)
  }, [callMessages, callStartTime, setMessages])

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
   * 添加AI消息
   */
  const addAIMessage = useCallback((content: string) => {
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
  }, [])

  /**
   * 添加旁白消息（画面描述）
   */
  const addNarratorMessage = useCallback((content: string) => {
    const newMessage: CallMessage = {
      id: Date.now(),
      type: 'narrator',
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

      const systemPrompt = buildVideoCallPrompt(character)

      // 构建对话历史
      const apiMessages = [
        { role: 'system' as 'system', content: systemPrompt },
        // 添加最近的聊天上下文（最多5条）
        ...chatMessages.slice(-5).map(msg => ({
          role: msg.type === 'sent' ? ('user' as 'user') : ('assistant' as 'assistant'),
          content: msg.content || msg.voiceText || '...'
        })),
        // 添加视频通话对话
        ...callMessages.map(msg => {
          if (msg.type === 'narrator') {
            return { role: 'system' as 'system', content: `[画面: ${msg.content}]` }
          }
          return {
            role: msg.type === 'user' ? ('user' as 'user') : ('assistant' as 'assistant'),
            content: msg.content
          }
        })
      ]

      const aiReply = await callAIApi(apiMessages, settings)

      // 解析AI回复：分离对话和画面描述
      const lines = aiReply.split('\n').filter(l => l.trim())
      
      for (const line of lines) {
        // 检测画面描述 [画面:...] 或 【画面：...】
        const narratorMatch = line.match(/[\[【]画面[:\：](.+?)[\]】]/)
        if (narratorMatch) {
          addNarratorMessage(narratorMatch[1].trim())
          continue
        }

        // 普通对话
        if (line.trim()) {
          addAIMessage(line.trim())
        }
      }
    } catch (error) {
      console.error('AI回复失败:', error)
      if (error instanceof ChatApiError) {
        addAIMessage('抱歉，网络有点卡...')
      }
    } finally {
      setIsAITyping(false)
    }
  }, [character, chatMessages, callMessages, isAITyping, addAIMessage, addNarratorMessage])
  
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
    requestAIReply,
    receiveIncomingCall,
    acceptCall,
    rejectCall
  }
}
