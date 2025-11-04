/**
 * AI交互逻辑Hook
 * 负责：AI回复、输入状态、消息发送等
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
  createSystemMessage,
  convertToApiMessages,
  getRecentMessages,
  parseAIMessages
} from '../../../utils/messageUtils'
import { Logger } from '../../../utils/logger'

export const useChatAI = (
  character: Character | null,
  messages: Message[],
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  setError: (error: string | null) => void
) => {
  const [isAiTyping, setIsAiTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  /**
   * 滚动到消息底部
   * @param instant 是否立即跳转（不使用平滑滚动）
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
    
    const newMessage: Message = {
      ...createMessage(inputValue, 'sent'),
      quotedMessage: quotedMessage ? {
        id: quotedMessage.id,
        content: quotedMessage.content || quotedMessage.voiceText || quotedMessage.photoDescription || quotedMessage.location?.name || '特殊消息',
        senderName: quotedMessage.type === 'sent' ? '我' : (character?.realName || 'AI'),
        type: quotedMessage.type === 'system' ? 'sent' : quotedMessage.type
      } : undefined
    }
    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    clearQuote?.()
    setError(null)
  }, [isAiTyping, setMessages, setError, character])
  
  /**
   * 触发AI回复（核心逻辑，被handleAIReply和handleRegenerate复用）
   */
  const generateAIReply = useCallback(async () => {
    if (!character) return
    
    try {
      // 获取API配置
      const settings = getApiSettings()
      if (!settings) {
        throw new ChatApiError('请先配置API', 'NO_API_SETTINGS')
      }
      
      // 构建消息历史
      const recentMessages = getRecentMessages(messages)
      const apiMessages = convertToApiMessages(recentMessages)
      
      // 构建系统提示词
      const systemPrompt = buildSystemPrompt(character, '用户')
      
      // 调试：打印系统提示词
      Logger.prompt('系统提示词', systemPrompt)
      
      // 调用AI API
      const aiReply = await callAIApi(
        [
          { role: 'system', content: systemPrompt },
          ...apiMessages
        ],
        settings
      )
      
      // 解析AI回复（支持多条消息）
      const aiMessagesList = parseAIMessages(aiReply)
      
      // 分段发送AI消息
      for (const content of aiMessagesList) {
        // 检测转账指令 [转账:金额:说明] 或 【转账：金额：说明】（兼容中文标点，支持¥符号和"说明:"）
        const transferMatch = content.match(/[\[【]转账[:\：]\s*[¥￥]?\s*(\d+\.?\d*)\s*(?:[:\：]?\s*说明[:\：]?\s*)?(.*)[\]】]/)
        if (transferMatch) {
          const amount = parseFloat(transferMatch[1])
          // 提取说明文本
          const transferMessage = (transferMatch[2] || '').trim()
          
          // 创建转账消息
          const transferMsg: Message = {
            id: Date.now(),
            type: 'received',
            content: '',
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            timestamp: Date.now(),
            messageType: 'transfer',
            transfer: {
              amount,
              message: transferMessage,
              status: 'pending'
            }
          }
          await new Promise(resolve => setTimeout(resolve, 300))
          setMessages(prev => [...prev, transferMsg])
          
          // 检查是否还有剩余文字（转账指令后的文字）
          const remainingText = content.replace(/[\[【]转账[:\：]\s*[¥￥]?\s*\d+\.?\d*\s*(?:[:\：]?\s*说明[:\：]?\s*)?.*?[\]】]/, '').trim()
          if (remainingText) {
            const textMessage = createMessage(remainingText, 'received')
            await new Promise(resolve => setTimeout(resolve, 300))
            setMessages(prev => [...prev, textMessage])
          }
          continue
        }
        
        // 检测接收转账指令 [接收转账] 或 【接收转账】（兼容中文标点）
        const receiveMatch = content.match(/[\[【]接收转账[\]】]/)
        if (receiveMatch) {
          // 找到最后一笔待处理的用户转账
          setMessages(prev => {
            const lastPendingTransfer = [...prev].reverse().find(
              msg => msg.messageType === 'transfer' && msg.type === 'sent' && msg.transfer?.status === 'pending'
            )
            
            if (!lastPendingTransfer) return prev
            
            return prev.map(msg => {
              if (msg.id === lastPendingTransfer.id) {
                return {
                  ...msg,
                  transfer: {
                    ...msg.transfer!,
                    status: 'received' as const
                  }
                }
              }
              return msg
            })
          })
          
          // 添加系统提示
          const systemMsg = createSystemMessage('对方已收款')
          await new Promise(resolve => setTimeout(resolve, 300))
          setMessages(prev => [...prev, systemMsg])
          continue
        }
        
        // 检测退还转账指令 [退还转账] 或 【退还转账】（兼容中文标点）
        const rejectMatch = content.match(/[\[【]退还转账[\]】]/)
        if (rejectMatch) {
          // 找到最后一笔待处理的用户转账
          setMessages(prev => {
            const lastPendingTransfer = [...prev].reverse().find(
              msg => msg.messageType === 'transfer' && msg.type === 'sent' && msg.transfer?.status === 'pending'
            )
            
            if (!lastPendingTransfer) return prev
            
            return prev.map(msg => {
              if (msg.id === lastPendingTransfer.id) {
                return {
                  ...msg,
                  transfer: {
                    ...msg.transfer!,
                    status: 'expired' as const
                  }
                }
              }
              return msg
            })
          })
          
          // 添加系统提示
          const systemMsg = createSystemMessage('对方已退还转账')
          await new Promise(resolve => setTimeout(resolve, 300))
          setMessages(prev => [...prev, systemMsg])
          continue
        }
        
        // 检测语音指令 [语音:文本内容] 或 【语音：文本内容】（兼容中文标点）
        const voiceMatch = content.match(/[\[【]语音[:\：](.+?)[\]】]/)
        if (voiceMatch) {
          const voiceText = voiceMatch[1]
          
          // 创建语音消息
          const voiceMsg: Message = {
            id: Date.now(),
            type: 'received',
            content: '',
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            timestamp: Date.now(),
            messageType: 'voice',
            voiceText: voiceText
          }
          await new Promise(resolve => setTimeout(resolve, 300))
          setMessages(prev => [...prev, voiceMsg])
          
          // 检查是否还有剩余文字（语音指令后的文字）
          const remainingText = content.replace(/[\[【]语音[:\：].+?[\]】]/, '').trim()
          if (remainingText) {
            const textMessage = createMessage(remainingText, 'received')
            await new Promise(resolve => setTimeout(resolve, 300))
            setMessages(prev => [...prev, textMessage])
          }
          continue
        }
        
        // 检测位置指令（兼容多种格式和中文标点）
        // 格式1: [位置:地点:地址] 或 【位置：地点：地址】
        // 格式2: [位置:地点 - 地址] 或 【位置：地点 - 地址】
        const locationMatch = content.match(/[\[【]位置[:\：](.+?)(?:[:\：]|[\s]*-[\s]*)(.+?)[\]】]/)
        if (locationMatch) {
          const locationName = locationMatch[1].trim()
          const locationAddress = locationMatch[2].trim()
          
          // 创建位置消息
          const locationMsg: Message = {
            id: Date.now(),
            type: 'received',
            content: '',
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            timestamp: Date.now(),
            messageType: 'location',
            location: {
              name: locationName,
              address: locationAddress
            }
          }
          await new Promise(resolve => setTimeout(resolve, 300))
          setMessages(prev => [...prev, locationMsg])
          
          // 检查是否还有剩余文字
          const remainingText = content.replace(/[\[【]位置[:\：].+?(?:[:\：]|[\s]*-[\s]*).+?[\]】]/, '').trim()
          if (remainingText) {
            const textMessage = createMessage(remainingText, 'received')
            await new Promise(resolve => setTimeout(resolve, 300))
            setMessages(prev => [...prev, textMessage])
          }
          continue
        }
        
        // 检测照片指令 [照片:描述] 或 【照片：描述】（兼容中文标点）
        const photoMatch = content.match(/[\[【]照片[:\：](.+?)[\]】]/)
        if (photoMatch) {
          const photoDescription = photoMatch[1].trim()
          
          // 创建照片消息
          const photoMsg: Message = {
            id: Date.now(),
            type: 'received',
            content: '',
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            timestamp: Date.now(),
            messageType: 'photo',
            photoDescription: photoDescription
          }
          await new Promise(resolve => setTimeout(resolve, 300))
          setMessages(prev => [...prev, photoMsg])
          
          // 检查是否还有剩余文字
          const remainingText = content.replace(/[\[【]照片[:\：].+?[\]】]/, '').trim()
          if (remainingText) {
            const textMessage = createMessage(remainingText, 'received')
            await new Promise(resolve => setTimeout(resolve, 300))
            setMessages(prev => [...prev, textMessage])
          }
          continue
        }
        
        // 检测撤回指令 [撤回消息:理由] 或 [撤回消息]（兼容中文标点）
        const recallMatch = content.match(/[\[【]撤回消息(?:[:\：](.+?))?[\]】]/)
        if (recallMatch) {
          const recallReason = recallMatch[1]?.trim() || ''
          
          // 找到AI的上一条消息进行撤回
          setMessages(prev => {
            const aiMessages = [...prev].reverse().filter(msg => msg.type === 'received')
            if (aiMessages.length === 0) return prev
            
            const lastAiMessage = aiMessages[0]
            
            return prev.map(msg => 
              msg.id === lastAiMessage.id
                ? {
                    ...msg,
                    isRecalled: true,
                    recalledContent: msg.content || msg.voiceText || msg.photoDescription || '特殊消息',
                    recallReason: recallReason,
                    originalType: 'received' as const,
                    content: (character?.realName || '对方') + '撤回了一条消息',
                    type: 'system' as const,
                    messageType: 'system' as const
                  }
                : msg
            )
          })
          continue
        }
        
        // 检测引用指令 [引用:ID或描述] 或 【引用：ID或描述】（兼容中文标点）
        const quoteMatch = content.match(/[\[【]引用[:\：]\s*(.+?)[\]】]/)
        let quotedMsg: Message['quotedMessage'] | undefined
        let messageContent = content
        if (quoteMatch) {
          const quoteRef = quoteMatch[1].trim()
          
          setMessages(prev => {
            let quoted: Message | undefined
            
            // 尝试作为ID解析
            const quotedId = parseInt(quoteRef)
            if (!isNaN(quotedId)) {
              quoted = prev.find(m => m.id === quotedId)
            } else {
              // 作为描述查找消息
              const lowerRef = quoteRef.toLowerCase()
              
              // 查找包含关键词的最近消息
              if (lowerRef.includes('上一条') || lowerRef.includes('上条') || lowerRef.includes('刚才')) {
                quoted = [...prev].reverse().find(m => m.type === 'sent' || m.type === 'received')
              } else if (lowerRef.includes('语音')) {
                quoted = [...prev].reverse().find(m => m.messageType === 'voice')
              } else if (lowerRef.includes('照片') || lowerRef.includes('图片')) {
                quoted = [...prev].reverse().find(m => m.messageType === 'photo')
              } else if (lowerRef.includes('位置')) {
                quoted = [...prev].reverse().find(m => m.messageType === 'location')
              } else if (lowerRef.includes('转账')) {
                quoted = [...prev].reverse().find(m => m.messageType === 'transfer')
              } else if (lowerRef.includes('用户') || lowerRef.includes('你问') || lowerRef.includes('你说')) {
                // 查找用户的最近消息
                quoted = [...prev].reverse().find(m => m.type === 'sent')
              } else if (lowerRef.includes('我说') || lowerRef.includes('我发') || lowerRef.includes('自己')) {
                // 查找AI自己的最近消息
                quoted = [...prev].reverse().find(m => m.type === 'received')
              } else {
                // 模糊匹配内容
                quoted = [...prev].reverse().find(m => {
                  const msgContent = (m.content || m.voiceText || m.photoDescription || '').toLowerCase()
                  return msgContent.includes(lowerRef)
                })
              }
            }
            
            if (quoted) {
              quotedMsg = {
                id: quoted.id,
                content: quoted.content || quoted.voiceText || quoted.photoDescription || quoted.location?.name || '特殊消息',
                senderName: quoted.type === 'sent' ? '我' : (character?.realName || 'AI'),
                type: quoted.type === 'system' ? 'sent' : quoted.type
              }
            }
            return prev
          })
          // 移除引用指令
          messageContent = content.replace(/[\[【]引用[:\：]\s*.+?[\]】]/, '').trim()
        }
        
        // 普通文本消息
        const aiMessage: Message = {
          ...createMessage(messageContent, 'received'),
          quotedMessage: quotedMsg
        }
        await new Promise(resolve => setTimeout(resolve, 300))
        setMessages(prev => [...prev, aiMessage])
      }
      
    } catch (error) {
      console.error('AI回复失败:', error)
      
      if (error instanceof ChatApiError) {
        setError(error.message)
      } else {
        setError('AI回复失败，请稍后重试')
      }
    }
  }, [character, messages, setMessages, setError])
  
  /**
   * 触发AI回复
   */
  const handleAIReply = useCallback(async () => {
    if (isAiTyping || !character) return
    
    setIsAiTyping(true)
    setError(null)
    
    await generateAIReply()
    
    setIsAiTyping(false)
  }, [isAiTyping, character, generateAIReply, setError])
  
  /**
   * 重新生成AI回复（重回功能）
   * 删除最后一轮AI的所有消息（可能多条），保留用户消息，重新生成
   */
  const handleRegenerate = useCallback(async () => {
    if (isAiTyping || !character) return
    
    // 检查最后一条消息是否是AI回复
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.type !== 'received') {
      setError('没有可重新生成的AI回复')
      return
    }
    
    setIsAiTyping(true)
    setError(null)
    
    // 找到最后一轮AI消息的数量（从后往前找连续的AI消息）
    let countToDelete = 0
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'received') {
        countToDelete++
      } else {
        // 遇到用户消息就停止
        break
      }
    }
    
    // 删除最后一轮的所有AI消息
    setMessages(prev => prev.slice(0, -countToDelete))
    
    // 等待一下确保状态更新
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 重新生成
    await generateAIReply()
    
    setIsAiTyping(false)
  }, [isAiTyping, character, messages, setMessages, generateAIReply, setError])
  
  return {
    isAiTyping,
    handleSend,
    handleAIReply,
    handleRegenerate,
    scrollToBottom,
    messagesEndRef
  }
}
