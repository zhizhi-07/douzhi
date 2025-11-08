/**
 * AI交互逻辑Hook（重构版）
 * 使用指令处理器模式，消除重复代码
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Character, Message } from '../../../types/chat'
import {
  getApiSettings,
  buildSystemPrompt,
  callAIApi,
  ChatApiError
} from '../../../utils/chatApi'
import {
  createMessage,
  getRecentMessages,
  parseAIMessages,
  convertToApiMessages
} from '../../../utils/messageUtils'
import { loadMessages } from '../../../utils/simpleMessageManager'
import { showNotification } from '../../../utils/simpleNotificationManager'
import { Logger } from '../../../utils/logger'
import { commandHandlers } from './commandHandlers'
import { blacklistManager } from '../../../utils/blacklistManager'
import { buildBlacklistPrompt, buildAIBlockedUserPrompt } from '../../../utils/prompts'
import { parseMomentsInteractions, executeMomentsInteractions } from '../../../utils/momentsInteractionParser'
import { parseAIMomentsPost, executeAIMomentsPost } from '../../../utils/aiMomentsPostParser'
import { triggerAIMomentsInteraction } from '../../../utils/momentsAI'
import { loadMoments } from '../../../utils/momentsManager'

export const useChatAI = (
  chatId: string,
  character: Character | null,
  messages: Message[],
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  setError: (error: string | null) => void,
  onVideoCallRequest?: () => void,
  refreshCharacter?: () => void
) => {
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sendTimeoutRef = useRef<number>()
  
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
    // 防止重复发送和空消息
    if (!inputValue.trim() || isAiTyping || isSending) {
      return
    }
    
    // 清除之前的延迟
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current)
    }
    
    // 设置发送中状态
    setIsSending(true)
    
    try {
      // 检查AI是否拉黑了用户
      const isUserBlocked = blacklistManager.isBlockedByMe(`character_${chatId}`, 'user')
      
      const userMessage: Message = {
        ...createMessage(inputValue, 'sent'),
        blockedByReceiver: isUserBlocked,
        quotedMessage: quotedMessage ? {
          id: quotedMessage.id,
          content: quotedMessage.content || quotedMessage.voiceText || quotedMessage.photoDescription || '...',
          senderName: quotedMessage.type === 'sent' ? '我' : (character?.realName || 'AI'),
          type: quotedMessage.type
        } : undefined
      }
      
      console.log('📤 发送消息:', inputValue.substring(0, 20), isUserBlocked ? '(被AI拉黑)' : '')
      
      // 更新React状态（setMessages会自动保存到IndexedDB）
      setMessages(prev => [...prev, userMessage])
      setInputValue('')
      if (clearQuote) clearQuote()
      
      // 延迟滚动和重置发送状态
      sendTimeoutRef.current = setTimeout(() => {
        scrollToBottom(false)
        setIsSending(false)
      }, 100)
      
    } catch (error) {
      console.error('发送消息失败:', error)
      setIsSending(false)
    }
  }, [isAiTyping, isSending, character, setMessages, scrollToBottom])
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current)
      }
    }
  }, [])

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

      // 检查用户是否拉黑了AI
      const isBlocked = blacklistManager.isBlockedByMe('user', chatId)
      console.log(`🔍 [拉黑检查] 用户拉黑了AI: ${isBlocked}, chatId=${chatId}`)
      
      // 检查AI是否拉黑了用户
      const hasAIBlockedUser = blacklistManager.isBlockedByMe(`character_${chatId}`, 'user')
      console.log(`🔍 [拉黑检查] AI拉黑了用户: ${hasAIBlockedUser}`)
      
      let systemPrompt = await buildSystemPrompt(character)
      
      // 如果用户拉黑了AI，在最前面添加警告提示（确保AI优先看到）
      if (isBlocked) {
        const blacklistWarning = buildBlacklistPrompt('用户')
        systemPrompt = blacklistWarning + '\n\n' + systemPrompt
        console.log('🚨 AI被用户拉黑，已在提示词最前面添加警告')
        console.log('警告内容：', blacklistWarning.substring(0, 200))
      }
      
      // 如果AI拉黑了用户，添加状态提醒（让AI记住这个状态）
      if (hasAIBlockedUser) {
        const aiBlockedReminder = buildAIBlockedUserPrompt('用户')
        systemPrompt = aiBlockedReminder + '\n\n' + systemPrompt
        console.log('🚫 AI已拉黑用户，已在提示词中添加状态提醒')
        console.log('提醒内容：', aiBlockedReminder.substring(0, 200))
      }
      
      // 从localStorage读取最新消息，避免闭包问题
      const currentMessages = loadMessages(chatId)
      const recentMessages = getRecentMessages(currentMessages, chatId)
      const apiMessages = convertToApiMessages(recentMessages)

      Logger.log('发送API请求', {
        messageCount: apiMessages.length,
        lastMessage: apiMessages[apiMessages.length - 1],
        isBlocked
      })
      
      // 输出到控制台：AI读取的提示词和记忆
      console.group('🤖 [私信聊天] AI读取的提示词和记忆')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 系统提示词：')
      console.log(systemPrompt)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('💭 聊天记录（发送给AI的消息）：')
      console.table(apiMessages.map((msg, i) => ({
        序号: i + 1,
        角色: msg.role === 'user' ? '用户' : (msg.role === 'assistant' ? 'AI' : '系统'),
        内容: msg.content ? msg.content.substring(0, 80) + (msg.content.length > 80 ? '...' : '') : ''
      })))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📊 统计信息：', {
        系统提示词长度: systemPrompt.length,
        聊天记录条数: apiMessages.length,
        总消息数: apiMessages.length + 1,
        用户拉黑了AI: isBlocked,
        AI拉黑了用户: hasAIBlockedUser
      })
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📤 完整API请求：')
      console.log([{ role: 'system', content: systemPrompt }, ...apiMessages])
      console.groupEnd()

      const aiReply = await callAIApi(
        [{ role: 'system', content: systemPrompt }, ...apiMessages],
        settings
      )
      
      Logger.log('收到AI回复', aiReply)
      
      // AI基本信息
      const aiName = character?.realName || 'AI'
      const aiId = character?.id || chatId
      const aiAvatar = character?.avatar || '🤖'
      
      // 先解析AI发朋友圈指令
      const { post: aiMomentsPost, cleanedMessage: messageAfterMomentsPost } = parseAIMomentsPost(
        aiReply,
        aiName,
        aiId,
        aiAvatar
      )
      
      // 如果AI发布了朋友圈，执行发布操作
      if (aiMomentsPost) {
        console.log('📱 [AI发朋友圈] 检测到AI发朋友圈指令:', aiMomentsPost)
        const success = executeAIMomentsPost(aiMomentsPost)
        
        if (success) {
          // 创建系统消息
          const systemContent = `${aiName}发布了朋友圈："${aiMomentsPost.content}"`
          const systemMessage: Message = {
            ...createMessage(systemContent, 'system'),
            aiReadableContent: `[系统通知：你发布了朋友圈"${aiMomentsPost.content}"，其他人可能会看到并互动]`
          }
          
          // 延迟300ms后添加系统消息
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // 更新React状态（setMessages会自动保存）
          setMessages(prev => [...prev, systemMessage])
          console.log(`💾 [AI发朋友圈] 系统消息已保存: ${systemContent}`)
          
          // 调用朋友圈导演系统，让其他AI根据内容进行互动
          // 获取刚发布的朋友圈对象
          const moments = loadMoments()
          const justPostedMoment = moments.find(m => m.userId === aiId && m.content === aiMomentsPost.content)
          
          if (justPostedMoment) {
            console.log('🎬 [AI发朋友圈] 触发导演系统，准备编排其他AI互动...')
            // 异步调用导演系统，不阻塞当前流程
            triggerAIMomentsInteraction(justPostedMoment).catch(error => {
              console.error('❌ [AI发朋友圈] 导演系统调用失败:', error)
            })
          }
        }
      }
      
      // 再解析朋友圈互动指令
      const { interactions, cleanedMessage } = parseMomentsInteractions(messageAfterMomentsPost, aiName, aiId)
      
      // 如果有朋友圈互动指令，执行它们
      if (interactions.length > 0) {
        console.log('📱 检测到朋友圈互动指令:', interactions)
        const interactionResults = executeMomentsInteractions(interactions)
        console.log('✅ 朋友圈互动执行结果:', interactionResults)
        
        // 为每个成功的互动创建系统消息
        for (const result of interactionResults) {
          if (result.success) {
            let systemContent = ''
            let notificationMessage = ''
            
            if (result.type === 'like') {
              systemContent = `${result.aiName}点赞了你的朋友圈`
              notificationMessage = `点赞了你的朋友圈："${result.momentContent}"`
            } else if (result.type === 'comment') {
              systemContent = `${result.aiName}在你的朋友圈评论了"${result.commentContent}"`
              notificationMessage = `评论了你的朋友圈："${result.commentContent}"`
            } else if (result.type === 'reply') {
              systemContent = `${result.aiName}在你的朋友圈回复${result.replyTo}"${result.commentContent}"`
              notificationMessage = `回复了${result.replyTo}："${result.commentContent}"`
            }
            
            // 创建系统消息
            const systemMessage: Message = {
              ...createMessage(systemContent, 'system'),
              aiReadableContent: `[系统通知：${systemContent}，这是朋友圈互动通知，用户会看到灰色小字提示]`
            }
            
            // 延迟300ms后添加系统消息
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // 更新React状态（setMessages会自动保存）
            setMessages(prev => [...prev, systemMessage])
            console.log(`💾 [朋友圈互动] 系统消息已保存: ${systemContent}`)
            
            // 显示通知弹窗
            showNotification(
              chatId,
              result.aiName,
              notificationMessage,
              character?.avatar || '🤖'
            )
            console.log(`🔔 [朋友圈互动] 通知已显示: ${notificationMessage}`)
          }
        }
      }
      
      // 使用清理后的消息内容继续处理
      const aiMessagesList = parseAIMessages(cleanedMessage)
      console.log('📝 AI消息拆分结果:', aiMessagesList)
      
      // 使用指令处理器处理每条消息
      let pendingQuotedMsg: Message['quotedMessage'] | undefined // 保存跨消息的引用
      
      for (let i = 0; i < aiMessagesList.length; i++) {
        const content = aiMessagesList[i]
        console.log(`🔄 处理消息 [${i+1}/${aiMessagesList.length}]: "${content}"`)
        
        let quotedMsg: Message['quotedMessage'] | undefined = pendingQuotedMsg // 继承上一条的引用
        let messageContent = content
        let skipTextMessage = false

        // 持续处理指令直到没有更多匹配（最多10次防止死循环）
        let shouldContinue = true
        let loopCount = 0
        const MAX_LOOPS = 10
        
        while (shouldContinue && loopCount < MAX_LOOPS) {
          shouldContinue = false
          loopCount++
          
          // 遍历所有指令处理器
          for (const handler of commandHandlers) {
            const match = messageContent.match(handler.pattern)
            if (match) {
              console.log(`🎯 [commandHandler] 处理指令，isBlocked=${isBlocked}`, {
                pattern: handler.pattern.toString(),
                match: match[0],
                isBlocked
              })
              
              const result = await handler.handler(match, messageContent, {
                messages,
                setMessages,
                character,
                chatId,  // 🔥 传入chatId，确保消息能保存到localStorage
                isBlocked,  // 🔥 传入拉黑状态，确保特殊消息也能显示感叹号
                onVideoCallRequest,
                refreshCharacter  // 🔥 传入refreshCharacter，让AI改名后立即更新界面
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

        if (loopCount >= MAX_LOOPS) {
          console.error('⚠️ 指令处理循环次数过多，强制退出')
        }

        // 如果有剩余文本且不是纯指令消息，发送普通消息
        console.log(`✅ 最终状态: skipTextMessage=${skipTextMessage}, messageContent="${messageContent}", hasQuote=${!!quotedMsg}`)
        
        if (!skipTextMessage && messageContent && messageContent.trim()) {
          console.log(`💬 创建普通消息: "${messageContent}"${quotedMsg ? ' [带引用]' : ''}`)
          const aiMessage: Message = {
            ...createMessage(messageContent, 'received'),
            quotedMessage: quotedMsg,
            blocked: isBlocked  // 添加拉黑标记
          }
          
          // 调试：输出引用消息信息
          if (quotedMsg) {
            console.log('📎 创建带引用的消息:', {
              quotedMsg,
              messageContent,
              fullMessage: aiMessage
            })
          }
          
          if (isBlocked) {
            console.log('🚫 消息已标记为被拉黑状态')
          }
          
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // 更新React状态（setMessages会自动保存）
          setMessages(prev => [...prev, aiMessage])
          console.log(`💾 [useChatAI] AI消息已保存`)
          
          pendingQuotedMsg = undefined // 引用已使用，清除
          
        } else if (quotedMsg && !messageContent.trim()) {
          // 引用指令单独一行，保留到下一条消息
          pendingQuotedMsg = quotedMsg
          
        } else {
          pendingQuotedMsg = undefined
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
  }, [character, chatId, setMessages, setError, onVideoCallRequest])  // chatId和setMessages必须保留

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
