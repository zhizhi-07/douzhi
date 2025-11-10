/**
 * AI交互逻辑Hook（重构版）
 * 使用指令处理器模式，消除重复代码
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Character, Message } from '../../../types/chat'
import {
  getApiSettings,
  buildSystemPrompt,
  buildOfflinePrompt,
  callAIApi,
  ChatApiError
} from '../../../utils/chatApi'
import {
  createMessage,
  getRecentMessages,
  parseAIMessages,
  convertToApiMessages
} from '../../../utils/messageUtils'
import { loadMessages, addMessage as saveMessageToStorage, saveMessages } from '../../../utils/simpleMessageManager'
import { showNotification } from '../../../utils/simpleNotificationManager'
import { Logger } from '../../../utils/logger'
import { commandHandlers } from './commandHandlers'
import { blacklistManager } from '../../../utils/blacklistManager'
import { buildBlacklistPrompt, buildAIBlockedUserPrompt } from '../../../utils/prompts'
import { parseMomentsInteractions, executeMomentsInteractions } from '../../../utils/momentsInteractionParser'
import { parseAIMomentsPost, executeAIMomentsPost, parseAIMomentsDelete, executeAIMomentsDelete } from '../../../utils/aiMomentsPostParser'
import { triggerAIMomentsInteraction } from '../../../utils/momentsAI'
import { loadMoments } from '../../../utils/momentsManager'
import { playMessageSendSound, playMessageNotifySound } from '../../../utils/soundManager'
import { memoryManager } from '../../../utils/memorySystem'
import { groupChatManager } from '../../../utils/groupChatManager'
import { lorebookManager } from '../../../utils/lorebookSystem'
import { TokenStats, estimateTokens } from '../../../utils/tokenCounter'

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
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    total: 0,
    remaining: 0,
    percentage: 0,
    systemPrompt: 0,
    character: 0,
    lorebook: 0,
    memory: 0,
    messages: 0,
    responseTime: 0,
    outputTokens: 0
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sendTimeoutRef = useRef<number>()
  const conversationCountRef = useRef<number>(0)  // 对话轮数计数器
  const isGeneratingSummaryRef = useRef<boolean>(false)  // 防止重复生成总结

  // 初始化：从 localStorage 加载计数器
  useEffect(() => {
    const savedCount = localStorage.getItem(`conversation_count_${chatId}`)
    if (savedCount) {
      conversationCountRef.current = parseInt(savedCount) || 0
      console.log(`[自动总结] 加载已保存的对话轮数: ${conversationCountRef.current}`)
    }
  }, [chatId])

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
    clearQuote?: () => void,
    sceneMode?: 'online' | 'offline'
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
        sceneMode: sceneMode || 'online',  // 添加场景模式
        quotedMessage: quotedMessage ? {
          id: quotedMessage.id,
          content: quotedMessage.content || quotedMessage.voiceText || quotedMessage.photoDescription || '...',
          senderName: quotedMessage.type === 'sent' ? '我' : (character?.realName || 'AI'),
          type: quotedMessage.type
        } : undefined
      }
      
      console.log('📤 [handleSend] 发送消息:', {
        content: inputValue.substring(0, 20),
        messageId: userMessage.id,
        blocked: isUserBlocked
      })
      
      // 🔥 直接保存到IndexedDB
      saveMessageToStorage(chatId, userMessage)
      console.log(`💾 [handleSend] 用户消息已保存到存储, id=${userMessage.id}`)
      
      // 更新React状态（更新UI）
      setMessages(prev => {
        console.log(`📱 [handleSend] 更新React状态, 当前消息数=${prev.length}, 新消息id=${userMessage.id}`)
        return [...prev, userMessage]
      })
      setInputValue('')
      if (clearQuote) clearQuote()
      
      // 播放发送音效
      playMessageSendSound()
      
      // 延迟滚动和重置发送状态
      sendTimeoutRef.current = setTimeout(() => {
        scrollToBottom(false)
        setIsSending(false)
      }, 100)
      
    } catch (error) {
      console.error('发送消息失败:', error)
      setIsSending(false)
    }
  }, [isAiTyping, isSending, character, chatId, setMessages, scrollToBottom])
  
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
    
    // 🔥 设置AI回复标志，阻止messages-loaded事件触发重新加载
    ;(window as any).__AI_REPLYING__ = true
    console.log('🚦 [AI回复] 开始，设置全局标志')

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
      
      // 📊 保存各部分上下文用于Token统计
      let lorebookContextText = ''
      let memoryContextText = ''
      
      // 读取所有消息（用于多个地方）
      const allMessages = loadMessages(chatId)
      
      // 检查最后一条消息的场景模式
      const lastUserMessage = allMessages.filter(m => m.type === 'sent').pop()
      const currentSceneMode = lastUserMessage?.sceneMode || 'online'
      console.log(`🎬 [场景模式] 当前模式: ${currentSceneMode}`)
      
      // 根据场景模式选择提示词
      let systemPrompt = currentSceneMode === 'offline' 
        ? await buildOfflinePrompt(character)
        : await buildSystemPrompt(character)
      
      // 🔥 注入世界书上下文（基于关键词触发）
      if (character) {
        // 获取最近的消息文本用于匹配关键词（最近10条）
        const recentMsgs = allMessages.slice(-10)
        const recentText = recentMsgs
          .map(m => m.content || m.voiceText || m.photoDescription || '')
          .filter(Boolean)
          .join('\n')
        
        lorebookContextText = lorebookManager.buildContext(
          character.id, 
          recentText, 
          2000,
          character.realName || character.nickname || '角色',
          '你',
          character // 传入完整角色信息用于变量替换
        )
        
        if (lorebookContextText) {
          let lorebookPrompt = '\n\n══════════════════════════════════\n\n'
          lorebookPrompt += '【世界书信息】（背景知识和设定）\n\n'
          lorebookPrompt += lorebookContextText
          lorebookPrompt += '\n\n💡 提示：这些是世界观和背景设定，请在对话中自然地体现\n'
          lorebookPrompt += '══════════════════════════════════'
          
          systemPrompt = systemPrompt + lorebookPrompt
          console.log('📚 [世界书] 已注入世界书上下文')
        }
      }
      
      // 🔥 注入相关记忆（根据用户消息内容检索）
      const memorySystem = memoryManager.getSystem(chatId)
      const userMessageContent = lastUserMessage?.content || lastUserMessage?.photoDescription || lastUserMessage?.voiceText || ''
      
      const relevantMemories = memorySystem.getRelevantMemories(userMessageContent, 10)
      
      if (relevantMemories.length > 0) {
        // 保存记忆内容用于Token统计
        memoryContextText = relevantMemories.map(m => m.content).join('\n')
        
        let memoryPrompt = '\n\n══════════════════════════════════\n\n'
        memoryPrompt += '【相关记忆】（这些是你和TA之间的重要信息）\n\n'
        
        relevantMemories.forEach(memory => {
          memoryPrompt += `- ${memory.content}\n`
        })
        
        memoryPrompt += '\n💡 提示：对话中提到相关内容时，自然地表现出你知道这些事\n'
        memoryPrompt += '\n══════════════════════════════════'
        
        systemPrompt = systemPrompt + memoryPrompt
        console.log(`🧠 [记忆系统] 注入了 ${relevantMemories.length} 条相关记忆`)
        console.log('注入的记忆:', relevantMemories.map(m => m.content))
      } else {
        console.log('🧠 [记忆系统] 未找到相关记忆')
      }
      
      // 🔥 注入群聊消息（如果启用了群聊消息同步）
      const chatSettings = localStorage.getItem(`chat_settings_${chatId}`)
      if (chatSettings) {
        try {
          const settings = JSON.parse(chatSettings)
          if (settings.groupChatSync?.enabled && settings.groupChatSync?.messageCount > 0) {
            const allGroups = groupChatManager.getAllGroups()
            const relevantGroups = allGroups.filter(g => g.memberIds.includes(chatId))
            
            if (relevantGroups.length > 0) {
              const groupMessages: Array<{ groupName: string, content: string, time: string }> = []
              
              relevantGroups.forEach(group => {
                const messages = groupChatManager.getMessages(group.id)
                const aiMessages = messages
                  .filter(m => m.userId === chatId)
                  .slice(-settings.groupChatSync.messageCount)
                
                aiMessages.forEach(msg => {
                  groupMessages.push({
                    groupName: group.name,
                    content: msg.content,
                    time: msg.time
                  })
                })
              })
              
              if (groupMessages.length > 0) {
                // 按时间排序
                groupMessages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
                
                let groupChatPrompt = '\n\n══════════════════════════════════\n\n'
                groupChatPrompt += '【你在群聊中的发言记录】（这些是你最近在群聊中说过的话）\n\n'
                
                groupMessages.slice(-settings.groupChatSync.messageCount).forEach(msg => {
                  groupChatPrompt += `[${msg.groupName}] ${msg.content}\n`
                })
                
                groupChatPrompt += '\n💡 提示：保持你在群聊和私聊中的一致性\n'
                groupChatPrompt += '\n══════════════════════════════════'
                
                systemPrompt = systemPrompt + groupChatPrompt
                console.log(`💬 [群聊同步] 注入了 ${groupMessages.length} 条群聊消息`)
              }
            }
          }
        } catch (error) {
          console.error('读取群聊同步配置失败:', error)
        }
      }
      
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

      // ⏱ 开始计时
      const startTime = Date.now()

      const apiResult = await callAIApi(
        [{ role: 'system', content: systemPrompt }, ...apiMessages],
        settings
      )
      
      const aiReply = apiResult.content
      const usage = apiResult.usage
      
      // ⏱ 计算响应时间
      const responseTime = Date.now() - startTime
      
      // 📊 计算Token统计
      // 优先使用API返回的实际token数
      let stats: TokenStats
      
      if (usage?.prompt_tokens) {
        // API返回了准确的token数
        console.log('✅ 使用API返回的输入Token:', usage.prompt_tokens)
        
        // 单独统计各部分（用于显示分类）
        const baseSystemPrompt = systemPrompt.split('【世界书信息】')[0].split('【相关记忆】')[0]
        const messageStrings = apiMessages.map(m => m.content || '')
        
        stats = {
          systemPrompt: estimateTokens(baseSystemPrompt),
          character: 0,
          lorebook: estimateTokens(lorebookContextText),
          memory: estimateTokens(memoryContextText),
          messages: messageStrings.reduce((sum, msg) => sum + estimateTokens(msg), 0),
          total: usage.prompt_tokens, // 使用API返回的准确值
          remaining: 0,
          percentage: 0,
          responseTime
        }
      } else {
        // API未返回token数，使用估算
        console.log('⚠️ API未返回输入token数，使用估算值')
        
        const messageStrings = apiMessages.map(m => m.content || '')
        const baseSystemPrompt = systemPrompt.split('【世界书信息】')[0].split('【相关记忆】')[0]
        
        stats = {
          systemPrompt: estimateTokens(baseSystemPrompt),
          character: 0,
          lorebook: estimateTokens(lorebookContextText),
          memory: estimateTokens(memoryContextText),
          messages: messageStrings.reduce((sum, msg) => sum + estimateTokens(msg), 0),
          total: 0,
          remaining: 0,
          percentage: 0,
          responseTime
        }
        
        stats.total = stats.systemPrompt + stats.lorebook + stats.memory + stats.messages
      }
      
      console.log('📊 Token详细统计:', {
        系统提示: stats.systemPrompt,
        世界书: stats.lorebook,
        记忆: stats.memory,
        消息历史: stats.messages,
        总计: stats.total,
        消息条数: apiMessages.length
      })
      
      // 计算输出token（AI回复的token数）
      // 优先使用API返回的实际token数（包含思维链等）
      if (usage?.completion_tokens) {
        stats.outputTokens = usage.completion_tokens
        console.log('✅ 使用API返回的输出Token:', stats.outputTokens, '（包含思维链）')
      } else {
        // 如果API没返回，则估算
        stats.outputTokens = estimateTokens(aiReply)
        console.log('⚠️ API未返回token数，使用估算值:', stats.outputTokens)
      }
      
      // 更新Token统计状态
      setTokenStats(stats)
      
      // 输出Token统计
      console.log('📊 Token统计:', stats)
      
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
          
          // 更新React状态
          setMessages(prev => {
            const updated = [...prev, systemMessage]
            // 🔥 手动保存到IndexedDB
            saveMessages(chatId, updated)
            return updated
          })
          console.log(`💾 [AI发朋友圈] 系统消息已保存到IndexedDB: ${systemContent}`)
          
          // 记录到AI互动记忆（重要！让AI记得自己发过朋友圈）
          const { recordAIInteraction } = await import('../../../utils/aiInteractionMemory')
          recordAIInteraction({
            characterId: aiId,
            characterName: aiName,
            actionType: 'post',
            content: aiMomentsPost.content,
            context: `发布朋友圈："${aiMomentsPost.content}"`
          })
          console.log(`🧠 [AI发朋友圈] 已记录到AI互动记忆`)
          
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
      
      // 再解析删除朋友圈指令
      const { deleteCmd, cleanedMessage: messageAfterDelete } = parseAIMomentsDelete(
        messageAfterMomentsPost,
        aiId,
        aiName
      )
      
      // 如果AI删除了朋友圈，执行删除操作
      if (deleteCmd) {
        console.log('🗑️ [AI删除朋友圈] 检测到AI删除朋友圈指令:', deleteCmd)
        const deletedContent = executeAIMomentsDelete(deleteCmd)
        
        if (deletedContent) {
          // 创建系统消息
          const systemContent = `${aiName}删除了朋友圈："${deletedContent}"`
          const systemMessage: Message = {
            ...createMessage(systemContent, 'system'),
            aiReadableContent: `[系统通知：你删除了朋友圈"${deletedContent}"]`
          }
          
          // 延迟300ms后添加系统消息
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // 更新React状态
          setMessages(prev => {
            const updated = [...prev, systemMessage]
            // 🔥 手动保存到IndexedDB
            saveMessages(chatId, updated)
            return updated
          })
          console.log(`💾 [AI删除朋友圈] 系统消息已保存到IndexedDB: ${systemContent}`)
          
          // 记录到AI互动记忆
          const { recordAIInteraction } = await import('../../../utils/aiInteractionMemory')
          recordAIInteraction({
            characterId: aiId,
            characterName: aiName,
            actionType: 'delete',
            content: deletedContent,
            context: `删除朋友圈："${deletedContent}"`
          })
          console.log(`🧠 [AI删除朋友圈] 已记录到AI互动记忆`)
        }
      }
      
      // 再解析朋友圈互动指令
      const { interactions, cleanedMessage } = parseMomentsInteractions(messageAfterDelete, aiName, aiId)
      
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
            
            // 更新React状态
            setMessages(prev => {
              const updated = [...prev, systemMessage]
              // 🔥 手动保存到IndexedDB
              saveMessages(chatId, updated)
              return updated
            })
            console.log(`💾 [朋友圈互动] 系统消息已保存到IndexedDB: ${systemContent}`)
            
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
      // 线下模式不分段，直接作为一整条消息
      const aiMessagesList = currentSceneMode === 'offline' 
        ? [cleanedMessage] 
        : parseAIMessages(cleanedMessage)
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
            blocked: isBlocked,  // 添加拉黑标记
            sceneMode: currentSceneMode  // 继承场景模式
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
          
          console.log(`💬 [useChatAI] 准备保存AI消息, id=${aiMessage.id}, content="${messageContent.substring(0, 20)}"`)
          
          // 🔥 直接保存消息到IndexedDB（不依赖React状态，确保即使组件卸载也能保存）
          // addMessage会触发new-message事件，用于通知和未读标记
          saveMessageToStorage(chatId, aiMessage)
          console.log(`💾 [useChatAI] AI消息已保存到存储, id=${aiMessage.id}`)
          
          // 同时更新React状态（如果组件还挂载，更新UI）
          setMessages(prev => {
            console.log(`📱 [useChatAI] 更新React状态, 当前消息数=${prev.length}, 新AI消息id=${aiMessage.id}`)
            return [...prev, aiMessage]
          })
          
          // 播放消息通知音效
          playMessageNotifySound()
          
          pendingQuotedMsg = undefined // 引用已使用，清除
          
        } else if (quotedMsg && !messageContent.trim()) {
          // 引用指令单独一行，保留到下一条消息
          pendingQuotedMsg = quotedMsg
          
        } else {
          pendingQuotedMsg = undefined
        }
      }
      
    } catch (error) {
      console.error('🐞 AI生成失败:', error)
      setError(error instanceof ChatApiError ? error.message : '生成回复失败')
    } finally {
      setIsAiTyping(false)
      ;(window as any).__AI_REPLYING__ = false
      console.log('✅ [AI回复] 结束，清除全局标志')
      
      // 自动总结逻辑
      try {
        const settingsStr = localStorage.getItem(`chat_settings_${chatId}`)
        if (settingsStr) {
          const settings = JSON.parse(settingsStr)
          if (settings.autoMemorySummary && settings.memorySummaryInterval) {
            conversationCountRef.current++
            // 保存计数器到 localStorage
            localStorage.setItem(`conversation_count_${chatId}`, conversationCountRef.current.toString())
            console.log(`[自动总结] 对话轮数: ${conversationCountRef.current}/${settings.memorySummaryInterval}`)
            
            // 防止重复生成
            if (conversationCountRef.current >= settings.memorySummaryInterval && !isGeneratingSummaryRef.current) {
              console.log('[自动总结] 达到阈值，开始生成总结...')
              conversationCountRef.current = 0  // 立即重置计数器
              localStorage.setItem(`conversation_count_${chatId}`, '0')  // 保存重置后的值
              isGeneratingSummaryRef.current = true  // 设置生成标志
              
              // 异步生成总结，不阻塞UI
              setTimeout(async () => {
                try {
                  const msgs = loadMessages(chatId)
                  const recentMessages = msgs.slice(-settings.memorySummaryInterval * 2)  // 获取最近的消息
                  
                  const userMessages = recentMessages.filter(m => m.type === 'sent')
                  const aiMessages = recentMessages.filter(m => m.type === 'received')
                  
                  if (userMessages.length === 0 || aiMessages.length === 0) {
                    console.log('[自动总结] 消息不足，跳过')
                    return
                  }
                  
                  const roundCount = Math.min(userMessages.length, aiMessages.length)
                  
                  const userContent = userMessages.map(m => {
                    if (m.videoCallRecord) {
                      // 提取视频通话内容
                      const conversations = m.videoCallRecord.messages
                        .map(msg => {
                          const speaker = msg.type === 'user' ? '用户' : (msg.type === 'ai' ? character?.realName || 'AI' : '旁白')
                          return `${speaker}: ${msg.content}`
                        })
                        .join('\n')
                      return `[视频通话]\n${conversations}`
                    }
                    return m.content || m.photoDescription || m.voiceText || ''
                  }).join('\n')
                  
                  const aiContent = aiMessages.map(m => {
                    if (m.videoCallRecord) {
                      // 提取视频通话内容
                      const conversations = m.videoCallRecord.messages
                        .map(msg => {
                          const speaker = msg.type === 'user' ? '用户' : (msg.type === 'ai' ? character?.realName || 'AI' : '旁白')
                          return `${speaker}: ${msg.content}`
                        })
                        .join('\n')
                      return `[视频通话]\n${conversations}`
                    }
                    return m.content || m.photoDescription || m.voiceText || ''
                  }).join('\n')
                  
                  const memorySystem = memoryManager.getSystem(chatId)
                  const result = await memorySystem.extractMemoriesFromConversation(
                    userContent,
                    aiContent,
                    character?.realName || 'AI',
                    character?.personality || '',
                    '用户'  // 用户名，暂时固定，后续可以从用户系统获取
                  )
                  
                  if (result.summary && result.summary.trim()) {
                    const oldSummary = localStorage.getItem(`memory_summary_${chatId}`) || ''
                    const timestamp = new Date().toLocaleString('zh-CN')
                    const newEntry = `【自动总结 - ${timestamp}】\n基于最近 ${roundCount} 轮对话生成\n\n${result.summary}`
                    
                    // 限制总结历史数量（只保留最近5次）
                    let summaryHistory = oldSummary
                    if (oldSummary) {
                      const entries = oldSummary.split('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n')
                      // 只保留最近4次（加上新的这次就是5次）
                      if (entries.length >= 5) {
                        summaryHistory = entries.slice(-4).join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n')
                      }
                    }
                    
                    const separator = summaryHistory ? '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' : ''
                    const newSummary = summaryHistory + separator + newEntry
                    
                    localStorage.setItem(`memory_summary_${chatId}`, newSummary)
                    console.log(`[自动总结] 总结已保存，提取了 ${result.memories.length} 条记忆，历史总结数量已限制`)
                  }
                } catch (error) {
                  console.error('[自动总结] 生成失败:', error)
                } finally {
                  // 5秒后才允许再次生成（防抖）
                  setTimeout(() => {
                    isGeneratingSummaryRef.current = false
                  }, 5000)
                }
              }, 1000)
            }
          }
        }
      } catch (error) {
        console.error('[自动总结] 检查失败:', error)
      }
    }
  }, [character, chatId, setMessages, setError, onVideoCallRequest])  // chatId和setMessages必须保留

  /**
   * 重新生成AI回复
   */
  const handleRegenerate = useCallback(() => {
    setMessages(prev => {
      // 从后往前找到最后一条AI消息
      const lastAIIndex = [...prev].reverse().findIndex(msg => msg.type === 'received')
      if (lastAIIndex === -1) {
        setError('没有可重新生成的AI回复')
        return prev
      }
      
      const actualLastAIIndex = prev.length - 1 - lastAIIndex
      
      // 从最后一条AI消息往前找，删除这一轮AI的所有消息
      // 直到遇到用户消息或到达消息开头
      let deleteFromIndex = actualLastAIIndex
      for (let i = actualLastAIIndex - 1; i >= 0; i--) {
        if (prev[i].type === 'sent') {
          // 遇到用户消息，停止
          break
        }
        if (prev[i].type === 'received') {
          // 是AI消息，继续往前删除
          deleteFromIndex = i
        }
      }
      
      const newMessages = prev.slice(0, deleteFromIndex)
      const deletedCount = prev.length - newMessages.length
      console.log(`🔄 重回：删除从索引 ${deleteFromIndex} 到 ${prev.length - 1} 的 ${deletedCount} 条消息`)
      
      // 🔥 真正从 IndexedDB 删除（覆盖保存整个消息列表）
      console.log(`💾 覆盖保存消息列表: chatId=${chatId}, 剩余=${newMessages.length}条`)
      saveMessages(chatId, newMessages)
      
      return newMessages
    })
    
    setTimeout(() => {
      handleAIReply()
    }, 100)
  }, [chatId, setMessages, setError, handleAIReply])

  return {
    isAiTyping,
    messagesEndRef,
    scrollToBottom,
    handleSend,
    handleAIReply,
    handleRegenerate,
    tokenStats
  }
}
