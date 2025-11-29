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
  convertToApiMessages,
  StatusRecord
} from '../../../utils/messageUtils'
import { getScheduleHistory } from '../../../utils/aiScheduleHistory'
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
import { getCoupleSpaceRelation } from '../../../utils/coupleSpaceUtils'

export const useChatAI = (
  chatId: string,
  character: Character | null,
  messages: Message[],
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  setError: (error: string | null) => void,
  onVideoCallRequest?: () => void,
  refreshCharacter?: () => void,
  onEndCall?: () => void
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
      
      // 🔥 清理 quotedMessage，只保留可序列化的字段
      const cleanQuotedMessage = quotedMessage ? {
        id: quotedMessage.id,
        content: quotedMessage.content || quotedMessage.voiceText || quotedMessage.photoDescription || '...',
        senderName: quotedMessage.type === 'sent' ? '我' : (character?.realName || 'AI'),
        type: quotedMessage.type
      } : undefined
      
      const userMessage: Message = {
        ...createMessage(inputValue, 'sent'),
        blockedByReceiver: isUserBlocked,
        sceneMode: sceneMode || 'online',  // 添加场景模式
        quotedMessage: cleanQuotedMessage
      }
      
      console.log('📤 [handleSend] 发送消息:', {
        content: inputValue.substring(0, 20),
        messageId: userMessage.id,
        blocked: isUserBlocked
      })
      
      // 保存用户消息（addMessage内部会自动备份到localStorage）
      saveMessageToStorage(chatId, userMessage)
      
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
   * @param forceSceneMode 强制指定场景模式（用于线下模式）
   */
  const handleAIReply = useCallback(async (forceSceneMode?: 'online' | 'offline') => {
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

      // 🔍 检查是否需要识别用户头像（首次聊天或头像变化）
      const { getUserInfo } = await import('../../../utils/userUtils')
      const { hasAvatarChanged } = await import('../../../utils/userAvatarManager')

      const userInfo = getUserInfo()
      
      // 🔥 强制日志：检查用户头像状态
      console.log('📷 [头像检查] 用户头像状态:', {
        hasAvatar: !!userInfo.avatar,
        avatarLength: userInfo.avatar?.length || 0,
        avatarPreview: userInfo.avatar?.substring(0, 50) || '无'
      })
      
      const needsAvatarRecognition = userInfo.avatar && hasAvatarChanged(userInfo.avatar)
      
      console.log('📷 [头像检查] needsAvatarRecognition:', needsAvatarRecognition)

      if (needsAvatarRecognition) {
        console.log('🖼️ [头像识别] 检测到用户头像变化或首次识别，将在聊天时一起识别')
      } else {
        console.log('📷 [头像检查] 不需要识别头像，原因:', !userInfo.avatar ? '用户没有设置头像' : '头像未变化')
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
      
      // 🔥 修复：使用 React 状态中的 messages，确保包含最新的用户消息
      // 而不是从存储重新加载（IndexedDB 写入可能有延迟）
      const allMessages = messages
      
      // 检查最后一条消息的场景模式（优先使用强制指定的模式）
      const currentSceneMode = forceSceneMode || (allMessages.filter(m => m.type === 'sent').pop()?.sceneMode || 'online')
      console.log(`🎬 [场景模式] 当前模式: ${currentSceneMode}${forceSceneMode ? ' (强制指定)' : ''}`)
      
      // 根据场景模式选择提示词
      let systemPrompt: string
      if (currentSceneMode === 'offline') {
        systemPrompt = await buildOfflinePrompt(character)
      } else {
        // 🎭 读取小剧场功能开关（提前读取，用于系统提示词）
        const chatSettingsRaw = localStorage.getItem(`chat_settings_${chatId}`)
        let enableTheatreCardsForPrompt = false // 默认关闭
        if (chatSettingsRaw) {
          try {
            const parsed = JSON.parse(chatSettingsRaw)
            enableTheatreCardsForPrompt = parsed.enableTheatreCards ?? false
          } catch (e) {
            console.error('[useChatAI] 解析聊天设置失败:', e)
          }
        }
        systemPrompt = await buildSystemPrompt(character, '用户', messages, enableTheatreCardsForPrompt)
      }
      
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
          const hasLore = systemPrompt.includes('世界观与背景知识') || systemPrompt.includes('【世界书信息】')
          if (!hasLore) {
            let lorebookPrompt = '\n\n══════════════════════════════════\n\n'
            lorebookPrompt += '【世界书信息】（背景知识和设定）\n\n'
            lorebookPrompt += lorebookContextText
            lorebookPrompt += '\n\n💡 提示：这些是世界观和背景设定，请在对话中自然地体现\n'
            lorebookPrompt += '══════════════════════════════════'
            
            systemPrompt = systemPrompt + lorebookPrompt
            console.log('📚 [世界书] 已注入世界书上下文')
          } else {
            console.log('📚 [世界书] 已包含世界书上下文，跳过重复注入')
          }
        }
      }
      
      // 🔥 注入记忆条目（优先级高于时间线）
      const { memoryManager } = await import('../../../utils/memorySystem')
      const memorySystem = memoryManager.getSystem(chatId)
      const memorySummary = memorySystem.generateMemorySummary()
      
      if (memorySummary && memorySummary !== '暂无重要记忆。') {
        let memoryPrompt = '\n\n══════════════════════════════════\n\n'
        memoryPrompt += '【关于对方的记忆】（你记住的关于TA的重要信息）\n\n'
        memoryPrompt += memorySummary
        memoryPrompt += '\n\n💡 重要提示：\n'
        memoryPrompt += '- 当对方问起之前聊过的事、TA的习惯、你们的约定时，**优先从上面的记忆里找答案**\n'
        memoryPrompt += '- 如果记忆里有记录，就直接用这些信息回答，不要说"不记得"或"你说过吗"\n'
        memoryPrompt += '- 如果记忆里确实没有相关记录，才可以说不记得\n'
        memoryPrompt += '- 平时聊天时不要逐条复述记忆，但要让这些记忆自然地体现在你的回复里\n'
        memoryPrompt += '══════════════════════════════════'
        
        systemPrompt = systemPrompt + memoryPrompt
        console.log('🧠 [记忆] 已注入记忆摘要')
      } else {
        console.log('🧠 [记忆] 暂无记忆条目')
      }
      
      // 读取记忆时间线（用于长期上下文）
      const timelineKey = `memory_timeline_${chatId}`
      const timelineRaw = localStorage.getItem(timelineKey) || ''
      if (timelineRaw) {
        const maxTimelineLength = 4000
        const timelineText = timelineRaw.length > maxTimelineLength
          ? timelineRaw.slice(-maxTimelineLength)
          : timelineRaw

        memoryContextText = timelineText

        let timelinePrompt = '\n\n══════════════════════════════════\n\n'
        timelinePrompt += '【互动时间线】（你和TA过去的重要事件和阶段性变化）\n\n'
        timelinePrompt += timelineText
        timelinePrompt += '\n\n💡 提示：\n'
        timelinePrompt += '- 时间线记录了你们互动的大致过程，可以帮助你回忆起聊天的背景和氛围\n'
        timelinePrompt += '- 具体的事实信息（如对方几点上班、喜欢什么）请优先参考上面的【关于对方的记忆】\n'
        timelinePrompt += '══════════════════════════════════'

        systemPrompt = systemPrompt + timelinePrompt
        console.log('🧠 [时间线] 已注入记忆时间线，长度:', timelineText.length)
      } else {
        console.log('🧠 [时间线] 没有找到已生成的记忆时间线')
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
      
      // 🔥 检测拉黑状态变化：如果上次被拉黑，这次解除了，需要主动告知AI
      const lastBlockedStateKey = `last_blocked_${chatId}`
      const wasBlockedBefore = localStorage.getItem(lastBlockedStateKey) === 'true'
      
      // 如果用户拉黑了AI，在最前面添加警告提示（确保AI优先看到）
      if (isBlocked) {
        const blacklistWarning = buildBlacklistPrompt('用户')
        systemPrompt = blacklistWarning + '\n\n' + systemPrompt
        console.log('🚨 AI被用户拉黑，已在提示词最前面添加警告')
        console.log('警告内容：', blacklistWarning.substring(0, 200))
        localStorage.setItem(lastBlockedStateKey, 'true')
      } else if (wasBlockedBefore) {
        // 🔥 关键修复：如果上次被拉黑，这次解除了，主动告知AI
        const unblockNotice = `
✅ 系统通知：用户已经将你从黑名单中移除了！

现在你们的关系已经恢复正常，你可以：
- 正常回复用户的消息
- 不需要再道歉或提及之前被拉黑的事情（除非用户主动提起）
- 像往常一样自然地聊天

请自然地继续对话，不要刻意强调这个状态变化。
`
        systemPrompt = unblockNotice + '\n\n' + systemPrompt
        console.log('✅ 用户已解除拉黑，已通知AI恢复正常状态')
        localStorage.setItem(lastBlockedStateKey, 'false')
      } else {
        // 正常状态，确保标记为未拉黑
        localStorage.setItem(lastBlockedStateKey, 'false')
      }
      
      // 🔥 检测AI拉黑用户的状态变化
      const lastAIBlockedStateKey = `last_ai_blocked_${chatId}`
      const wasAIBlockedBefore = localStorage.getItem(lastAIBlockedStateKey) === 'true'
      
      // 如果AI拉黑了用户，添加状态提醒（让AI记住这个状态）
      if (hasAIBlockedUser) {
        const aiBlockedReminder = buildAIBlockedUserPrompt('用户')
        systemPrompt = aiBlockedReminder + '\n\n' + systemPrompt
        console.log('🔥 AI已拉黑用户，已在提示词中添加状态提醒')
        console.log('提醒内容：', aiBlockedReminder.substring(0, 200))
        localStorage.setItem(lastAIBlockedStateKey, 'true')
      } else if (wasAIBlockedBefore) {
        // 🔥 关键修复：如果AI之前拉黑了用户，现在解除了，主动告知AI
        const aiUnblockNotice = `
✅ 系统通知：你已经将用户从黑名单中移除了！

现在你们的关系已经恢复正常，你可以：
- 正常回复用户的消息
- 不需要再提及之前拉黑的事情（除非用户主动提起）
- 像往常一样自然地聊天

请自然地继续对话。
`
        systemPrompt = aiUnblockNotice + '\n\n' + systemPrompt
        console.log('✅ AI已解除对用户的拉黑，已通知AI恢复正常状态')
        localStorage.setItem(lastAIBlockedStateKey, 'false')
      } else {
        // 正常状态，确保标记为未拉黑
        localStorage.setItem(lastAIBlockedStateKey, 'false')
      }
      
      // 🔥 关键修复：AI应该读取所有消息，而不是只读当前显示的分页消息
      // 从 IndexedDB 读取所有消息，而不是从缓存读取
      const { ensureMessagesLoaded } = await import('../../../utils/simpleMessageManager')
      const currentMessages = await ensureMessagesLoaded(chatId)
      const recentMessages = getRecentMessages(currentMessages, chatId)
      
      // 🎭 读取"隐藏小剧场历史"设置
      const chatSettingsForHistory = localStorage.getItem(`chat_settings_${chatId}`)
      let hideTheatreHistory = false // 默认不隐藏
      if (chatSettingsForHistory) {
        try {
          const parsed = JSON.parse(chatSettingsForHistory)
          hideTheatreHistory = parsed.hideTheatreHistory ?? false
        } catch (e) {
          console.error('[useChatAI] 解析隐藏小剧场历史设置失败:', e)
        }
      }
      
      // 🔥 获取今天的状态/行程记录，注入到消息流中
      const statusRecords: StatusRecord[] = character ? getScheduleHistory(character.id) : []
      
      let apiMessages = convertToApiMessages(recentMessages, hideTheatreHistory, true, statusRecords)
      
      // 🔥 详细日志：显示AI实际读取的所有消息
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📖 [AI读取消息] 总消息数: ${currentMessages.length}条`)
      console.log(`📖 [AI读取消息] 实际读取: ${recentMessages.length}条 (根据设置)`)
      console.log(`📖 [AI读取消息] 转为API消息: ${apiMessages.length}条`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // 输出读取的消息详情
      console.table(recentMessages.map((msg, i) => ({
        序号: i + 1,
        角色: msg.type === 'sent' ? '用户' : 'AI',
        时间: new Date(msg.timestamp).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        内容预览: (msg.content || msg.voiceText || '[特殊消息]').substring(0, 50),
        类型: msg.messageType || 'text'
      })))
      
      // 输出转换后的API消息
      console.log('\n📤 [API消息格式] 发送给AI的消息列表:')
      apiMessages.forEach((msg, i) => {
        const contentPreview = typeof msg.content === 'string' 
          ? msg.content.substring(0, 100)
          : '[多模态消息]'
        console.log(`  ${i + 1}. [${msg.role}] ${contentPreview}${contentPreview.length >= 100 ? '...' : ''}`)
      })
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // 🖼️ 如果需要识别头像，在系统提示词中添加识别请求，并在最后一条用户消息中附加头像图片
      if (needsAvatarRecognition && userInfo.avatar) {
        // 🔥 降级处理：检查API是否支持视觉识别
        if (!settings.supportsVision) {
          console.warn('⚠️ [头像识别] 当前API不支持视觉识别，跳过头像识别')
          console.warn('💡 [头像识别] 如需使用头像识别功能，请切换到支持视觉识别的API（如Gemini）')
        } else {
          console.log('🖼️ [头像识别] 在聊天请求中附加头像图片')

        // 在系统提示词末尾添加识别请求（简化版，减少token消耗）
        systemPrompt += `

🖼️ 用户换了头像，回复时用[头像描述:简短描述]记录，15字内，只说主体和特征。例：[头像描述:橘猫，圆眼睛，很萌]`

        // 找到最后一条用户消息，附加头像图片
        console.log('🔍 [头像识别] apiMessages数量:', apiMessages.length)
        
        if (apiMessages.length > 0) {
          const lastUserMsgIndex = apiMessages.map((m, i) => ({ msg: m, index: i }))
            .filter(item => item.msg.role === 'user')
            .pop()?.index

          console.log('🔍 [头像识别] 最后一条用户消息索引:', lastUserMsgIndex)

          if (lastUserMsgIndex !== undefined) {
            const lastUserMsg = apiMessages[lastUserMsgIndex]
            const originalContent = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : JSON.stringify(lastUserMsg.content)
            
            console.log('🔍 [头像识别] 原始消息内容:', originalContent.substring(0, 100))
            console.log('🔍 [头像识别] 头像URL长度:', userInfo.avatar?.length || 0)

            // 将文本消息转换为多模态消息
            apiMessages[lastUserMsgIndex] = {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: typeof lastUserMsg.content === 'string' ? lastUserMsg.content : ''
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: userInfo.avatar
                  }
                }
              ]
            }

            console.log('✅ [头像识别] 已在最后一条用户消息中附加头像图片')
            console.log('🔍 [头像识别] 修改后消息格式:', JSON.stringify(apiMessages[lastUserMsgIndex]).substring(0, 200))
          } else {
            console.warn('⚠️ [头像识别] 找不到最后一条用户消息！')
          }
        } else {
          console.warn('⚠️ [头像识别] apiMessages为空！')
        }
        }
      }

      Logger.log('发送API请求', {
        messageCount: apiMessages.length,
        lastMessage: apiMessages[apiMessages.length - 1],
        isBlocked
      })
      
      // 🔥 输出系统提示词完整内容
      console.log('\n📝 [系统提示词] AI读取的完整提示词:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(systemPrompt)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📏 [提示词长度] ${systemPrompt.length} 字符`)
      console.log(`📊 [统计信息] 消息条数: ${apiMessages.length}, 用户拉黑AI: ${isBlocked}, AI拉黑用户: ${hasAIBlockedUser}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      // ⏱ 开始计时
      const startTime = Date.now()
      
      // 🔥 设置当前场景模式标记（供API检测流式）
      localStorage.setItem('current-scene-mode', currentSceneMode)

      // 🎭 读取小剧场功能开关
      const chatSettingsRaw = localStorage.getItem(`chat_settings_${chatId}`)
      let enableTheatreCards = false // 默认关闭
      if (chatSettingsRaw) {
        try {
          const parsed = JSON.parse(chatSettingsRaw)
          enableTheatreCards = parsed.enableTheatreCards ?? false
        } catch (e) {
          console.error('[useChatAI] 解析聊天设置失败:', e)
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('🎭 [小剧场] 功能状态:', enableTheatreCards ? '已启用' : '已关闭')
      }

      const apiResult = await callAIApi(
        [{ role: 'system', content: systemPrompt }, ...apiMessages],
        settings,
        enableTheatreCards
      )
      
      let aiReply = apiResult.content
      
      // 🔥 强制清除AI回复中模仿的时间间隔标记（[5分钟后] 等格式）
      if (typeof aiReply === 'string') {
        const before = aiReply
        // 匹配 [X分钟后]、[X小时后]、[隔了X天] 等格式
        aiReply = aiReply
          .replace(/\[\d+分钟后\]/g, '')
          .replace(/\[\d+小时\d*分*钟*后\]/g, '')
          .replace(/\[隔了[一\d]+天\]/g, '')
          .trim()
        if (before !== aiReply) {
          console.log('🧹 [时间间隔清理] 已移除AI模仿的标记:', before, '=>', aiReply)
        }
      }
      
      // 🎭 处理小剧场 tool_calls（Function Calling）
      if ((apiResult as any).tool_calls && Array.isArray((apiResult as any).tool_calls)) {
        const toolCalls = (apiResult as any).tool_calls
        console.log('🎭 [小剧场] AI 调用了小剧场卡片:', toolCalls)
        
        // 导入转换函数
        const { convertTheatreToolCallToMessage } = await import('../../../utils/theatreTools')
        
        // 获取角色头像
        const characterAvatar = character?.avatar || '🤖'
        
        // 为每个 tool call 创建一条小剧场消息
        for (const toolCall of toolCalls) {
          const theatreMessageData = convertTheatreToolCallToMessage(toolCall, characterAvatar)
          
          const theatreMessage: Message = {
            ...createMessage('', 'received'),
            ...theatreMessageData,
            sceneMode: currentSceneMode
          }
          
          console.log('🎭 [小剧场] 插入卡片消息:', {
            template_id: toolCall.template_id,
            data: Object.keys(toolCall.data || {})
          })
          
          // 保存小剧场消息
          saveMessageToStorage(chatId, theatreMessage)
          
          // 更新 React 状态
          setMessages(prev => [...prev, theatreMessage])
          
          // 延迟一下，让卡片逐个出现
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      // 🔍 检查API返回的finish_reason，诊断是否被截断
      if (apiResult.usage && (apiResult as any).finish_reason) {
        const finishReason = (apiResult as any).finish_reason
        console.log(`🏁 [完成原因] finish_reason: ${finishReason}`)
        if (finishReason === 'length') {
          console.warn('⚠️ [截断警告] AI回复因达到长度限制而被截断！')
          console.warn('💡 当前max_tokens设置:', localStorage.getItem('current-scene-mode') === 'offline' ? '未设置（应该不限制）' : '默认限制')
        }
      }
      
      // 🚧 早期对话边界：非亲密关系下，禁止主动使用[表情]/[状态]/[随笔]
      try {
        const allMsgs = messages
        const totalNonSystem = allMsgs.filter(m => m.type === 'sent' || m.type === 'received').length
        const isEarly = totalNonSystem < 6
        const relation = getCoupleSpaceRelation()
        const isCoupleActive = !!(relation && relation.status === 'active' && character && relation.characterId === character.id)
        const personaSuggestsIntimate = /恋|情侣|对象|男朋友|女朋友|伴侣|cp/i.test((userInfo.persona || '') + (character?.personality || ''))
        const isIntimate = !!(isCoupleActive || personaSuggestsIntimate)
        if (isEarly && !isIntimate && typeof aiReply === 'string') {
          const before = aiReply
          aiReply = aiReply
            // 移除早期不允许的功能指令（仅限少数类型）
            .replace(/\[(表情|状态|随笔):[^\]\n]{0,100}\]/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
          if (!aiReply) {
            // 保底，避免全被清空
            aiReply = '你好。'
          }
          if (import.meta.env.DEV && before !== aiReply) {
            console.log('🛡️ [边界保护] 已过滤早期指令。原始/过滤后：', before.substring(0,120), '=>', aiReply.substring(0,120))
          }
        }
      } catch (e) {
        console.warn('边界过滤出错，已忽略：', e)
      }
      let usage = apiResult.usage
      
      // 🌊 处理流式响应（仅线下模式+开启流式）
      if ((apiResult as any).isStream && currentSceneMode === 'offline') {
        console.log('🌊 [流式] 检测到流式响应，开始逐字显示')
        
        const response = (apiResult as any).response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        if (reader) {
          let accumulatedText = ''
          
          // 创建临时消息用于逐步更新
          const tempMessageId = Date.now()
          const tempMessage: Message = {
            ...createMessage('', 'received'),
            id: tempMessageId,
            sceneMode: 'offline'
          }
          
          setMessages(prev => [...prev, tempMessage])
          
          try {
            let chunkCount = 0
            while (true) {
              const { done, value } = await reader.read()
              
              if (done) {
                console.log(`🏁 [流式] reader返回done=true，读取结束`)
                console.log(`📊 [流式] 统计: 共处理 ${chunkCount} 个数据块，累积文本长度: ${accumulatedText.length}`)
                break
              }
              
              chunkCount++
              const chunk = decoder.decode(value, { stream: true })
              console.log(`📦 [流式] 收到数据块 #${chunkCount}，大小: ${chunk.length}`)
              console.log(`📄 [流式] 原始数据:`, chunk)
              
              const lines = chunk.split('\n')
              console.log(`📋 [流式] 分割成 ${lines.length} 行`)
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  
                  if (data === '[DONE]') {
                    console.log('🏁 [流式] 收到 [DONE] 信号')
                    continue
                  }
                  
                  try {
                    const parsed = JSON.parse(data)
                    console.log('🔍 [流式] 解析后的数据:', parsed)
                    
                    // 🔥 尝试多种格式提取内容
                    let content = ''
                    
                    // OpenAI格式
                    if (parsed.choices?.[0]?.delta?.content) {
                      content = parsed.choices[0].delta.content
                      console.log(`✅ [流式] OpenAI格式提取: "${content}"`)
                    }
                    // Gemini格式
                    else if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                      content = parsed.candidates[0].content.parts[0].text
                      console.log(`✅ [流式] Gemini格式提取: "${content}"`)
                    }
                    
                    if (content) {
                      accumulatedText += content
                      console.log(`📝 [流式] 累积文本长度: ${accumulatedText.length}`)
                      
                      // 更新临时消息
                      setMessages(prev => prev.map(m => 
                        m.id === tempMessageId 
                          ? { ...m, content: accumulatedText }
                          : m
                      ))
                    }
                    
                    // 检查是否有 finish_reason
                    const finishReason = parsed.choices?.[0]?.finish_reason || parsed.candidates?.[0]?.finishReason
                    if (finishReason) {
                      console.log(`🛑 [流式] 收到停止信号: ${finishReason}`)
                      // 🔥 不要在这里break！让它继续读取直到done=true
                      // 因为可能还有剩余的数据块没读完
                    }
                  } catch (e) {
                    console.warn('⚠️ [流式] 解析错误:', e, '原始数据:', data.substring(0, 100))
                  }
                } else if (line.trim()) {
                  console.log(`⚠️ [流式] 非data行:`, line)
                }
              }
            }
            
            aiReply = accumulatedText
            
            // 🔥 流式模式也要清除AI模仿的时间间隔标记
            const beforeClean = aiReply
            aiReply = aiReply
              .replace(/\[\d+分钟后\]/g, '')
              .replace(/\[\d+小时\d*分*钟*后\]/g, '')
              .replace(/\[隔了[一\d]+天\]/g, '')
              .trim()
            if (beforeClean !== aiReply) {
              console.log('🧹 [流式时间间隔清理] 已移除:', beforeClean, '=>', aiReply)
            }
            
            console.log('✅ [流式] 流式接收完成，总长度:', aiReply.length, '字符')
            
            // 保存到IndexedDB
            setTimeout(() => {
              setMessages(prev => {
                saveMessages(chatId, prev)
                return prev
              })
              scrollToBottom()
            }, 100)
            
            setIsAiTyping(false)
            ;(window as any).__AI_REPLYING__ = false
            console.log('🚦 [流式] AI回复结束，清除全局标志')
            return // 直接返回，跳过后续处理
            
          } catch (streamError) {
            console.error('❌ [流式] 流式处理错误:', streamError)
            setMessages(prev => prev.filter(m => m.id !== tempMessageId))
            throw streamError
          }
        }
      }
      
      // ⏱ 计算响应时间
      const responseTime = Date.now() - startTime
      
      // 📊 计算Token统计
      // 优先使用API返回的实际token数
      let stats: TokenStats
      
      // 人设（角色卡）文本，用于单独统计
      const characterPersonalityText = character?.personality || ''
      const characterTokens = characterPersonalityText
        ? estimateTokens(characterPersonalityText)
        : 0
      
      if (usage?.prompt_tokens) {
        // API返回了准确的token数
        console.log('✅ 使用API返回的输入Token:', usage.prompt_tokens)
        
        // 单独统计各部分（用于显示分类）
        const baseSystemPrompt = systemPrompt
          .split('【世界书信息】')[0]
          .split('【相关记忆】')[0]
        const baseSystemTokens = estimateTokens(baseSystemPrompt)
        // systemPrompt 中减去人设占用，防止重复统计
        const systemPromptTokens = Math.max(baseSystemTokens - characterTokens, 0)
        
        const messageStrings = apiMessages.map(m => {
          const content = m.content || ''
          return typeof content === 'string' ? content : String(content)
        })
        
        stats = {
          systemPrompt: systemPromptTokens,
          character: characterTokens,
          lorebook: estimateTokens(lorebookContextText),
          memory: estimateTokens(memoryContextText),
          messages: messageStrings.reduce((sum, msg) => sum + estimateTokens(String(msg)), 0),
          total: usage.prompt_tokens, // 使用API返回的准确值
          remaining: 0,
          percentage: 0,
          responseTime
        }
      } else {
        // API未返回token数，使用估算
        console.log('⚠️ API未返回输入token数，使用估算值')
        
        const messageStrings = apiMessages.map(m => {
          const content = m.content || ''
          // 🔥 处理content可能是字符串或对象数组的情况
          if (typeof content === 'string') {
            return content
          } else if (Array.isArray(content)) {
            // 如果是对象数组，提取text字段
            return content.map(c => c.text || '').join('')
          }
          return String(content)
        })
        const baseSystemPrompt = systemPrompt
          .split('【世界书信息】')[0]
          .split('【相关记忆】')[0]
        const baseSystemTokens = estimateTokens(baseSystemPrompt)
        const systemPromptTokens = Math.max(baseSystemTokens - characterTokens, 0)
        
        stats = {
          systemPrompt: systemPromptTokens,
          character: characterTokens,
          lorebook: estimateTokens(lorebookContextText),
          memory: estimateTokens(memoryContextText),
          messages: messageStrings.reduce((sum, msg) => sum + estimateTokens(String(msg)), 0),
          total: 0,
          remaining: 0,
          percentage: 0,
          responseTime
        }
        
        stats.total =
          stats.systemPrompt +
          stats.character +
          stats.lorebook +
          stats.memory +
          stats.messages
      }
      
      console.log('📊 Token详细统计:', {
        系统提示: stats.systemPrompt,
        人设: stats.character,
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
      const aiName = character?.nickname || character?.realName || 'AI'
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
        const success = await executeAIMomentsPost(aiMomentsPost)
        
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
        const deletedContent = await executeAIMomentsDelete(deleteCmd)
        
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
      
      // 🖼️ 首先移除头像描述指令（在所有处理之前）
      const { removeAvatarDescriptionCommand, extractAvatarDescription, setUserAvatarDescription } = await import('../../../utils/userAvatarManager')
      
      // 如果需要识别头像，先提取头像描述（在移除之前）
      if (needsAvatarRecognition && userInfo.avatar) {
        const avatarDesc = extractAvatarDescription(messageAfterDelete)

        if (avatarDesc) {
          setUserAvatarDescription(avatarDesc, userInfo.avatar)
          console.log('✅ [头像识别] 从AI回复中提取并保存头像描述:', avatarDesc)
        } else {
          console.warn('⚠️ [头像识别] AI回复中未找到头像描述，下次继续尝试')
        }
      }
      
      // 移除头像描述指令（不显示给用户）
      const messageWithoutAvatar = removeAvatarDescriptionCommand(messageAfterDelete)
      
      // 🖼️ 提取并保存朋友圈图片识别结果
      const momentImageMatches = messageWithoutAvatar.matchAll(/\[图片识别[:：]([^|]+)\|([^|]+)\|([^\]]+)\]/g)
      const imageUpdates: Array<{ momentId: string; imageId: string; description: string }> = []
      
      for (const match of momentImageMatches) {
        imageUpdates.push({
          momentId: match[1].trim(),
          imageId: match[2].trim(),
          description: match[3].trim()
        })
      }
      
      if (imageUpdates.length > 0) {
        const { updateMomentImageDescriptions } = await import('../../../utils/momentsManager')
        const savedCount = updateMomentImageDescriptions(imageUpdates)
        console.log(`✅ [朋友圈图片识别] 保存了 ${savedCount} 张图片的描述`)
      }
      
      // 移除图片识别指令（不显示给用户）
      const messageWithoutImageRecog = messageWithoutAvatar.replace(/\[图片识别[:：][^\]]+\]\n?/g, '')
      
      // 再解析朋友圈互动指令
      const { interactions, cleanedMessage: messageAfterMoments } = parseMomentsInteractions(messageWithoutImageRecog, aiName, aiId)

      console.log('🔍 [朋友圈互动解析] 原始消息:', messageWithoutImageRecog)
      console.log('🔍 [朋友圈互动解析] 清理后消息:', messageAfterMoments)
      console.log('🔍 [朋友圈互动解析] 互动数量:', interactions.length)
      
      // 🔥 清理思维链和 HTML 标签（支持预设自定义正则）
      console.log('📥 [AI原始输出] ==================')
      console.log(messageAfterMoments)
      console.log('==================')
      
      let cleanedMessage = messageAfterMoments
      
      try {
        // 检查预设是否有自定义的正则过滤规则
        const customPreset = localStorage.getItem('offline-preset')
        let hasCustomRegex = false
        
        if (customPreset && currentSceneMode === 'offline') {
          try {
            const preset = JSON.parse(customPreset)
            
            // 支持 SillyTavern 的 regex_scripts 字段
            if (preset.regex_scripts && Array.isArray(preset.regex_scripts)) {
              console.log(`🔧 [正则过滤] 预设包含 ${preset.regex_scripts.length} 个正则规则`)
              
              for (const script of preset.regex_scripts) {
                if (!script.enabled) continue
                
                try {
                  // SillyTavern 格式：{ find_regex: "...", replace_string: "...", flags: "gi" }
                  const flags = script.flags || 'gi'
                  const regex = new RegExp(script.find_regex, flags)
                  const replacement = script.replace_string || ''
                  
                  const before = cleanedMessage.length
                  cleanedMessage = cleanedMessage.replace(regex, replacement)
                  const after = cleanedMessage.length
                  
                  console.log(`✅ [正则过滤] 应用规则: ${script.script_name || '未命名'}, 长度变化: ${before} -> ${after}`)
                  hasCustomRegex = true
                } catch (e) {
                  console.error(`❌ [正则过滤] 规则应用失败: ${script.script_name}`, e)
                }
              }
            }
          } catch (e) {
            console.error('❌ [正则过滤] 预设解析失败:', e)
          }
        }
        
        // 如果没有自定义正则，不做任何清理（保留原始输出）
        if (!hasCustomRegex) {
          console.log('💡 [清理] 预设没有正则规则，保留原始输出')
        } else {
          // 移除多余的空行（仅在使用自定义正则时执行）
          cleanedMessage = cleanedMessage.replace(/\n{3,}/g, '\n\n').trim()
        }
        
        console.log('🧹 [清理] 最终清理后长度:', cleanedMessage.length)
        console.log('📤 [清理后输出] ==================')
        console.log(cleanedMessage)
        console.log('==================')
      } catch (e) {
        console.error('❌ [清理] 清理过程出错，使用原始消息:', e)
        cleanedMessage = messageAfterMoments
      }

      // 🎭 解析文本格式的 call:send_theatre_card{...} 指令（支持两种格式）
      // 格式1: [call_tool:send_theatre_card|{...}]（旧格式）
      // 格式2: call:send_theatre_card{...}（新简化格式）
      const toolCallMatches: Array<{fullMatch: string, jsonStr: string}> = []
      
      // 先匹配简化格式 call:send_theatre_card{...}
      const simpleCallPattern = /call:send_theatre_card\{/g
      let match
      
      while ((match = simpleCallPattern.exec(cleanedMessage)) !== null) {
        const startPos = match.index + match[0].length - 1 // -1 因为要包含 {
        let braceCount = 0
        let endPos = startPos
        let foundStart = false
        
        // 从 { 开始，找到匹配的 }
        for (let i = startPos; i < cleanedMessage.length; i++) {
          const char = cleanedMessage[i]
          if (char === '{') {
            braceCount++
            foundStart = true
          } else if (char === '}') {
            braceCount--
            if (foundStart && braceCount === 0) {
              endPos = i + 1
              break
            }
          }
        }
        
        if (foundStart && braceCount === 0) {
          const jsonStr = cleanedMessage.substring(startPos, endPos)
          const fullMatch = cleanedMessage.substring(match.index, endPos)
          toolCallMatches.push({ fullMatch, jsonStr })
          console.log('🎭 [小剧场简化格式] 提取JSON长度:', jsonStr.length)
        }
      }
      
      // 再匹配旧格式 [call_tool:send_theatre_card|{...}]
      const callToolStart = /\[call_tool:send_theatre_card\|/g
      
      while ((match = callToolStart.exec(cleanedMessage)) !== null) {
        const startPos = match.index + match[0].length
        let braceCount = 0
        let endPos = startPos
        let foundStart = false
        
        // 从 { 开始，找到匹配的 }
        for (let i = startPos; i < cleanedMessage.length; i++) {
          const char = cleanedMessage[i]
          if (char === '{') {
            braceCount++
            foundStart = true
          } else if (char === '}') {
            braceCount--
            if (foundStart && braceCount === 0) {
              endPos = i + 1
              break
            }
          }
        }
        
        if (foundStart && braceCount === 0) {
          const jsonStr = cleanedMessage.substring(startPos, endPos)
          const fullMatch = cleanedMessage.substring(match.index, endPos + 1) // 包含 ]
          toolCallMatches.push({ fullMatch, jsonStr })
          console.log('🎭 [小剧场文本格式] 提取JSON长度:', jsonStr.length)
        }
      }
      
      if (toolCallMatches.length > 0) {
        console.log(`🎭 [小剧场文本格式] 检测到 ${toolCallMatches.length} 个 call_tool 指令`)
        
        const { convertTheatreToolCallToMessage } = await import('../../../utils/theatreTools')
        
        // 获取角色头像
        const characterAvatar = character?.avatar || '🤖'
        
        for (const match of toolCallMatches) {
          try {
            let jsonStr = match.jsonStr
            console.log('🎭 [小剧场文本格式] 原始JSON:', jsonStr.substring(0, 100) + '...')
            
            // 转换无引号的key为标准JSON格式
            // 匹配 word: 格式（后面跟着值），并加上引号
            jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
            console.log('🎭 [小剧场文本格式] 标准化后:', jsonStr.substring(0, 100) + '...')
            
            const toolCallData = JSON.parse(jsonStr)
            
            if (toolCallData.template_id && toolCallData.data) {
              const theatreMessageData = convertTheatreToolCallToMessage(toolCallData, characterAvatar)
              
              const theatreMessage: Message = {
                ...createMessage('', 'received'),
                ...theatreMessageData,
                sceneMode: currentSceneMode
              }
              
              console.log('🎭 [小剧场文本格式] 插入卡片消息:', {
                template_id: toolCallData.template_id,
                data: Object.keys(toolCallData.data || {})
              })
              
              // 保存小剧场消息
              saveMessageToStorage(chatId, theatreMessage)
              
              // 更新 React 状态
              setMessages(prev => [...prev, theatreMessage])
              
              // 延迟一下，让卡片逐个出现
              await new Promise(resolve => setTimeout(resolve, 200))
            }
          } catch (e) {
            console.error('❌ [小剧场文本格式] 解析失败:', e, '原始数据:', match.jsonStr.substring(0, 200))
          }
        }
        
        // 从消息中移除 call_tool 指令
        for (const match of toolCallMatches) {
          cleanedMessage = cleanedMessage.replace(match.fullMatch, '')
        }
        cleanedMessage = cleanedMessage.trim()
        console.log('🧹 [小剧场文本格式] 已从消息中移除 call_tool 指令')
      }

      // 🔥 提取并保存AI状态更新（行程历史由 statusHandler 统一保存，这里只更新状态）
      const { extractStatusFromReply, setAIStatus, getForceUpdateFlag, clearForceUpdateFlag } = await import('../../../utils/aiStatusManager')
      const statusUpdate = extractStatusFromReply(cleanedMessage, aiId)
      if (statusUpdate) {
        setAIStatus(statusUpdate)
        console.log('💫 [AI状态] 已更新状态:', statusUpdate.action)
        
        // 如果有强制更新标记，清除它
        if (getForceUpdateFlag(aiId)) {
          clearForceUpdateFlag(aiId)
          console.log('✅ [状态修正] AI已响应状态修正要求，清除标记')
        }
      }

      // 如果有朋友圈互动指令，执行它们
      if (interactions.length > 0) {
        console.log('📱 检测到朋友圈互动指令:', interactions)
        const interactionResults = await executeMomentsInteractions(interactions)
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
            
            // 🔥 只在线上模式显示通知弹窗，线下模式不显示
            if (currentSceneMode !== 'offline') {
              showNotification(
                chatId,
                result.aiName,
                notificationMessage,
                character?.avatar || '🤖'
              )
              console.log(`🔔 [朋友圈互动] 通知已显示: ${notificationMessage}`)
            } else {
              console.log(`🔇 [朋友圈互动] 线下模式，跳过通知显示`)
            }
          }
        }
      }
      
      cleanedMessage = cleanedMessage.replace(/[\[【][^\]】]+[\]】]/g, (m) => {
        if (m.includes('引用') && !/回复[:：]/.test(m)) return ''
        return m
      })
      
      // 🔥 预处理：检测多个连续的引用指令，将它们拆分成独立的消息段
      const preprocessMultipleQuotes = (text: string): string[] => {
        // 仅匹配严格格式的引用指令：[引用:关键词 回复:内容] 或 【引用：关键词 回复：内容】
        const quotePattern = /[\[【]引用[:\：]\s*[^】\]]+?\s+回复[:\：]\s*[^】\]]+[\]】]/g
        const quotes = text.match(quotePattern)
        
        if (!quotes || quotes.length <= 1) {
          // 没有引用或只有一个引用，不需要拆分
          return [text]
        }
        
        console.log(`🔍 [多引用检测] 发现 ${quotes.length} 个引用指令，准备拆分`)
        
        // 将消息按引用指令拆分
        const segments: string[] = []
        let remaining = text
        
        for (const quote of quotes) {
          const index = remaining.indexOf(quote)
          if (index === -1) continue
          
          // 提取引用前的内容
          const before = remaining.substring(0, index).trim()
          if (before) {
            segments.push(before)
          }
          
          // 提取引用后的内容（到下一个引用或结尾）
          remaining = remaining.substring(index + quote.length)
          const nextQuoteIndex = remaining.search(quotePattern)
          
          if (nextQuoteIndex === -1) {
            // 🔥 修复：这是最后一个引用，只包含同一行的内容，换行后的内容作为独立消息
            const firstLineEnd = remaining.indexOf('\n')
            if (firstLineEnd === -1) {
              // 没有换行，包含所有剩余内容
              segments.push(quote + remaining)
              remaining = ''
            } else {
              // 有换行，只包含第一行
              const firstLine = remaining.substring(0, firstLineEnd).trim()
              segments.push(quote + (firstLine ? ' ' + firstLine : ''))
              remaining = remaining.substring(firstLineEnd + 1).trim()
            }
            break
          } else {
            // 还有更多引用，只取到下一个引用之前
            const content = remaining.substring(0, nextQuoteIndex).trim()
            segments.push(quote + (content ? ' ' + content : ''))
            remaining = remaining.substring(nextQuoteIndex)
          }
        }
        
        // 如果还有剩余内容，添加到最后
        if (remaining.trim()) {
          segments.push(remaining.trim())
        }
        
        console.log(`✂️ [多引用拆分] 拆分成 ${segments.length} 段:`, segments)
        return segments.filter(s => s.trim())
      }
      
      // 使用清理后的消息内容继续处理
      // 线下模式不分段，直接作为一整条消息
      let aiMessagesList: string[]
      if (currentSceneMode === 'offline') {
        aiMessagesList = [cleanedMessage]
      } else {
        // 先拆分多引用，再按换行拆分
        const quoteSegments = preprocessMultipleQuotes(cleanedMessage)
        aiMessagesList = quoteSegments.flatMap(segment => parseAIMessages(segment))
      }
      console.log('📝 AI消息拆分结果:', aiMessagesList)
      
      // 🔥 在处理前先自动格式修正，确保非标准格式也能被识别
      const { correctAIMessageFormat } = await import('../../../utils/formatCorrector')
      aiMessagesList = aiMessagesList.map(msg => {
        const result = correctAIMessageFormat(msg)
        if (result.corrected) {
          console.log(`🔧 [自动格式修正] ${result.corrections.join(', ')}`)
          console.log(`   原文: ${result.original}`)
          console.log(`   修正: ${result.fixed}`)
          return result.fixed
        }
        return msg
      })
      
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
                onEndCall,  // 🔥 传入onEndCall，让AI挂断电话
                refreshCharacter  // 🔥 传入refreshCharacter，让AI改名后立即更新界面
              })

              if (result.handled) {
                // 检查是否跳过文本消息
                if (result.skipTextMessage) {
                  skipTextMessage = true
                }
                
                // 特殊处理引用指令
                if ('quotedMsg' in result) {
                  // 🔥 修复：只有当找到被引用的消息时才更新 quotedMsg，避免覆盖继承的引用
                  if (result.quotedMsg !== undefined) {
                    quotedMsg = result.quotedMsg
                  }
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
        
        // 消息未保存的情况（纯指令消息）- 移除烦人的调试弹窗
        if (skipTextMessage || !messageContent || !messageContent.trim()) {
          console.log(`ℹ️ 纯指令消息（无文本）: skipTextMessage=${skipTextMessage}, messageContent="${messageContent}"`)
        }
        
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
          
          // 🔥 计算语音播放时间，避免下一条消息覆盖
          let voiceDelay = 300 // 默认延迟
          
          // 检查是否有语音设置
          const settingsStr = localStorage.getItem(`chat_settings_${chatId}`)
          if (settingsStr) {
            try {
              const settings = JSON.parse(settingsStr)
              if (settings.voiceId && messageContent.trim()) {
                // 粗略估算语音播放时间：中文按每分钟200字计算
                const textLength = messageContent.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').length
                const estimatedDuration = Math.max(1000, textLength * 300) // 每字300ms，最少1秒
                voiceDelay = Math.min(estimatedDuration, 8000) // 最多8秒
                console.log(`🎵 [语音延迟] 文本长度: ${textLength}字, 预计播放时间: ${voiceDelay}ms`)
              }
            } catch (e) {
              console.warn('解析语音设置失败:', e)
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, voiceDelay))
          
          // 保存AI消息（addMessage内部会自动备份到localStorage）
          saveMessageToStorage(chatId, aiMessage)
          
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
      console.log('✅ [AI回复] 结束')
      
      // 🧠 全局记忆提取：每15次互动自动提取一次
      try {
        const { recordInteraction } = await import('../../../services/memoryExtractor')
        const triggered = await recordInteraction(chatId, character?.realName || 'AI')
        if (triggered) {
          console.log('🧠 [全局记忆] 已达到15次互动，触发记忆提取')
        }
      } catch (memoryError) {
        console.error('❌ [全局记忆] 记录互动失败:', memoryError)
      }
      
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

                  // 从 localStorage 读取上次记忆/时间线已经处理到的时间戳
                  const lastProcessedStr = localStorage.getItem(`memory_last_processed_ts_${chatId}`)
                  const lastProcessedTs = lastProcessedStr ? parseInt(lastProcessedStr, 10) : 0

                  // 🔥 本次处理「上次标记之后的所有消息」，确保连贯性
                  // 一次API调用处理完所有未总结的消息（例如：上次总结到第10轮，现在到第100轮，就一次性处理10-100这90轮）
                  const newMessages = msgs.filter(m => {
                    const ts = m.timestamp || 0
                    return ts > lastProcessedTs
                  })

                  if (newMessages.length === 0) {
                    console.log('[自动总结] 最近没有新的消息需要提取，跳过')
                    return
                  }
                  
                  console.log(`[自动总结] 🔥 本次将一次性处理 ${newMessages.length} 条消息（从上次总结标记到现在）`)
                  
                  // 🔥 批量处理：将消息组织成对话对，一次性提取记忆
                  const conversationPairs: Array<{userMsg: string, aiMsg: string, timestamp: number}> = []
                  
                  for (let i = 0; i < newMessages.length - 1; i++) {
                    const msg1 = newMessages[i]
                    const msg2 = newMessages[i + 1]
                    
                    // 确保是一对用户-AI对话
                    if (msg1.type === 'sent' && msg2.type === 'received') {
                      let userContent = msg1.content || msg1.photoDescription || msg1.voiceText || ''
                      let aiContent = msg2.content || msg2.photoDescription || msg2.voiceText || ''
                      
                      // 处理视频通话记录
                      if (msg1.videoCallRecord) {
                        const conversations = msg1.videoCallRecord.messages
                          .map(callMsg => {
                            const speaker = callMsg.type === 'user' ? '用户' : (callMsg.type === 'ai' ? character?.realName || 'AI' : '旁白')
                            return `${speaker}: ${callMsg.content}`
                          })
                          .join('\n')
                        userContent = `[视频通话]\n${conversations}`
                      }
                      
                      if (msg2.videoCallRecord) {
                        const conversations = msg2.videoCallRecord.messages
                          .map(callMsg => {
                            const speaker = callMsg.type === 'user' ? '用户' : (callMsg.type === 'ai' ? character?.realName || 'AI' : '旁白')
                            return `${speaker}: ${callMsg.content}`
                          })
                          .join('\n')
                        aiContent = `[视频通话]\n${conversations}`
                      }
                      
                      conversationPairs.push({
                        userMsg: userContent,
                        aiMsg: aiContent,
                        timestamp: msg1.timestamp || Date.now()
                      })
                      i++ // 跳过下一条消息
                    }
                  }
                  
                  if (conversationPairs.length === 0) {
                    console.log('[自动总结] 没有找到有效的对话对，跳过')
                    return
                  }
                  
                  console.log(`[自动总结] 本次增量处理 ${conversationPairs.length} 组对话`)
                  
                  // 🔥 批量合并对话内容，一次API调用处理所有对话
                  const batchUserContent = conversationPairs.map((pair, idx) => 
                    `[对话${idx + 1}] ${pair.userMsg}`
                  ).join('\n\n')
                  
                  const batchAiContent = conversationPairs.map((pair, idx) => 
                    `[对话${idx + 1}] ${pair.aiMsg}`
                  ).join('\n\n')
                  
                  const memorySystem = memoryManager.getSystem(chatId)
                  const result = await memorySystem.extractMemoriesFromConversation(
                    batchUserContent,
                    batchAiContent,
                    character?.realName || 'AI',
                    character?.personality || '',
                    '用户'  // 用户名，暂时固定，后续可以从用户系统获取
                  )

                  if (result.summary && result.summary.trim()) {
                    const oldSummary = localStorage.getItem(`memory_summary_${chatId}`) || ''
                    const timestamp = new Date().toLocaleString('zh-CN')
                    const newEntry = `【自动总结 - ${timestamp}】\n基于最近 ${conversationPairs.length} 轮对话生成\n\n${result.summary}`
                    
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

                  // 更新“已处理到哪里”的时间戳标记，供下次增量使用
                  const lastMsg = newMessages[newMessages.length - 1]
                  const newLastTs = lastMsg.timestamp || Date.now()
                  localStorage.setItem(`memory_last_processed_ts_${chatId}`, String(newLastTs))
                  console.log('[自动总结] 已更新 last_processed_timestamp 为', newLastTs)
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
  }, [character, chatId, setMessages, setError, onVideoCallRequest, messages])  // 🔥 添加 messages 依赖，确保使用最新的消息列表

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
