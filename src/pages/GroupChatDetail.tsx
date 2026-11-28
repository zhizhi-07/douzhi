import { getStoredUserProfileJSON } from '../utils/userProfileStorage'
import SafeHtml from '../components/SafeHtml'
/**
 * 群聊详情页面
 */

import { useNavigate, useParams } from 'react-router-dom'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import StatusBar from '../components/StatusBar'
import { generateGroupChatReply, type GroupMember } from '../utils/groupChatApi'
import { generateGroupChatSummary } from '../utils/groupChatSummary'
import { groupChatManager, type GroupMessage, setBatchMode } from '../utils/groupChatManager'
import { characterService } from '../services/characterService'
import EmojiPicker, { type EmojiPickerHandle } from '../components/EmojiPicker'
import { getEmojis } from '../utils/emojiStorage'
import { getUserInfo } from '../utils/userUtils'
import { useChatBubbles } from '../hooks/useChatBubbles'
import GroupAddMenu from '../components/GroupAddMenu'
import PollCreator from '../components/PollCreator'
import MessageMenu from '../components/MessageMenu.floating'
import TransferSender from '../components/TransferSender'
import PhotoDescriptionInput from '../components/PhotoDescriptionInput'
import LocationInput from '../components/LocationInput'
import VoiceInput from '../components/VoiceInput'
import RedPacketSender from '../components/RedPacketSender'
import RedPacketOpenModal from '../components/RedPacketOpenModal'
import RedPacketDetailModal from '../components/RedPacketDetailModal'
import { GroupMessageItem, GroupInputBar, MentionList } from './GroupChatDetail/components'
import {
  useGroupVirtualList,
  useGroupCustomIcons,
  useGroupMessageActions,
  useGroupSpecialMessages,
  useGroupRedPacket,
  useGroupEmoji,
  useGroupSendMessage,
  isSendingMessage
} from './GroupChatDetail/hooks'

// 获取成员头像（返回IndexedDB引用或直接URL）
const getMemberAvatar = (userId: string): string => {
  if (userId === 'user') {
    // 返回用户头像
    try {
      const userInfo = JSON.parse(getStoredUserProfileJSON() || '{}')
      const avatar = userInfo.avatar || ''
      // 🔥 直接返回IndexedDB引用，在渲染时加载
      return avatar
    } catch (e) {
      console.error('🖼️ [getMemberAvatar] 获取用户头像失败:', e)
      return ''
    }
  }
  const char = characterService.getById(userId)
  return char?.avatar || ''
}

// ... (rest of the code remains the same)

const GroupChatDetail = () => {
  const emojiPickerRef = useRef<EmojiPickerHandle>(null)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [groupName, setGroupName] = useState('')
  const [groupAvatar, setGroupAvatar] = useState('')
  const [inputText, setInputText] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)  // 🔥 添加消息加载状态
  
  const inputRef = useRef<HTMLInputElement>(null)
  const isAIReplying = useRef(false)  // 标志位：AI是否正在回复中

  // 🎨 气泡样式
  const { cssLoaded: bubbleCssLoaded } = useChatBubbles(id)

  // 📄 虚拟列表 - 只渲染可见消息，解决消息过多卡顿问题
  const {
    displayedMessages,
    virtualStyle,
    scrollContainerRef,
    scrollToBottom,
    resetVirtualList,
    isNearBottom
  } = useGroupVirtualList(messages, !isLoadingMessages && bubbleCssLoaded)
  
  // 🎨 使用自定义图标 Hook
  const { chatDecorations, customIcons, topBarAdjust } = useGroupCustomIcons()
  const { scale: topBarScale, x: topBarX, y: topBarY } = topBarAdjust
  
  // 📝 消息操作 Hook
  const {
    showMessageMenu,
    menuMessage,
    menuPosition,
    quotedMessage,
    setQuotedMessage,
    viewingRecalledMessage,
    setViewingRecalledMessage,
    handleLongPressStart,
    handleLongPressMove,
    handleLongPressEnd,
    handleRecallMessage,
    handleDeleteMessage,
    handleCopyMessage,
    handleQuoteMessage,
    closeMessageMenu
  } = useGroupMessageActions(id, setMessages)
  
  // 📦 特殊消息 Hook
  const {
    showPhotoInput, setShowPhotoInput,
    showCameraInput, setShowCameraInput,
    showLocationInput, setShowLocationInput,
    showVoiceInput, setShowVoiceInput,
    showRedPacketSender, setShowRedPacketSender,
    showPollCreator, setShowPollCreator,
    showMemberSelect, setShowMemberSelect,
    showTransferSender, setShowTransferSender,
    selectedTransferMember,
    handleConfirmPhoto,
    handleConfirmCamera,
    handleSelectTransferMember,
    handleSendTransfer,
    cancelTransfer,
    handleConfirmLocation,
    handleConfirmVoice,
    handleSendRedPacket
  } = useGroupSpecialMessages(id, setMessages, scrollToBottom)
  
  // 🧧 红包 Hook
  const {
    openRedPacketId,
    showRedPacketDetail,
    detailRedPacketId,
    handleOpenRedPacket,
    handleConfirmOpenRedPacket,
    handleReceiveTransfer,
    handleRejectTransfer,
    closeRedPacketModal,
    closeRedPacketDetail
  } = useGroupRedPacket(id, setMessages, scrollToBottom)
  
  // 😊 表情和语音 Hook
  const {
    handleSelectEmoji,
    playingVoiceId,
    showVoiceTextMap,
    handlePlayVoice,
    handleToggleVoiceText
  } = useGroupEmoji(id, setMessages, scrollToBottom)

  // �  发送消息 Hook
  const { handleSend: sendMessage } = useGroupSendMessage({
    groupId: id,
    isAiTyping,
    quotedMessage,
    setMessages,
    setInputText,
    setQuotedMessage,
    scrollToBottom
  })

  // 🔥 对 displayedMessages 进行去重
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>()
    return displayedMessages.filter(msg => {
      if (seen.has(msg.id)) return false
      seen.add(msg.id)
      return true
    })
  }, [displayedMessages])

  // 🔥 找出需要完整渲染的HTML消息ID
  const renderableHtmlIds = useMemo(() => {
    const lastFew = displayedMessages.slice(-5)
    const htmlMsg = lastFew.find(msg => 
      (msg as any).messageType === 'theatre_html' || (msg as any).type === 'theatre_html'
    )
    return htmlMsg ? new Set([htmlMsg.id]) : new Set<string>()
  }, [displayedMessages])

  // 🔥 预缓存角色信息（只在组件挂载时计算一次）
  const characterCache = useMemo(() => {
    const cache = new Map<string, any>()
    const allChars = characterService.getAll()
    allChars.forEach(char => cache.set(char.id, char))
    return cache
  }, []) // 空依赖，只计算一次

  // 🔥 预缓存用户信息（只在组件挂载时计算一次）
  const cachedUserInfo = useMemo(() => getUserInfo(), [])

  // 🔥 预缓存群成员信息（只在群ID变化时重新计算）
  const memberDetailCache = useMemo(() => {
    const cache = new Map<string, any>()
    const group = id ? groupChatManager.getGroup(id) : null
    group?.members?.forEach(m => cache.set(m.id, m))
    return cache
  }, [id])

  useEffect(() => {
    if (!id) return
    
    let cancelled = false
    setIsLoadingMessages(true)
    setMessages([])
    // 🔥 重置虚拟列表状态
    resetVirtualList()
    
    // 加载群聊信息
    const group = groupChatManager.getGroup(id)
    if (group) {
      setGroupName(group.name)
      setGroupAvatar(group.avatar || '')
    }
    
    // 🔥 先尝试同步获取缓存消息，立即显示
    const cachedMessages = groupChatManager.getMessages(id)
    if (cachedMessages.length > 0) {
      console.log(`⚡ 快速显示缓存消息: ${cachedMessages.length}条`)
      setMessages(cachedMessages)
      setIsLoadingMessages(false)
    }
    
    // 🔥 异步加载完整消息（等待IndexedDB加载完成）
    const loadMessages = async () => {
      try {
        // 使用异步方法加载消息，确保 IndexedDB 数据加载完成
        const allMsgs = await groupChatManager.loadMessagesAsync(id)
        console.log(`📦 GroupChatDetail 加载消息: ${id}, 总数=${allMsgs.length}`)
        if (!cancelled) setMessages(allMsgs)
      } catch (error) {
        console.error('加载消息失败:', error)
      } finally {
        if (!cancelled) setIsLoadingMessages(false)
      }
      // 🔥 滚动由 callback ref 自动处理，这里不需要手动滚动
    }
    
    loadMessages()
    
    // 监听storage事件以更新消息
    const handleStorageChange = () => {
      // 🔥 AI回复期间不响应storage事件，避免消息一次性显示
      if (isAIReplying.current) {
        console.log('🚫 [storage事件] AI回复中，忽略storage事件')
        return
      }
      // 🔥 用户发送消息期间不响应storage事件，避免重复添加
      if (isSendingMessage) {
        console.log('🚫 [storage事件] 用户发送中，忽略storage事件')
        return
      }

      const allMsgs = groupChatManager.getMessages(id)
      setMessages(allMsgs)
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => { cancelled = true; window.removeEventListener('storage', handleStorageChange) }
  }, [id, resetVirtualList])

  // 获取当前群聊信息，用于渲染成员头衔/角色
  const currentGroup = id ? groupChatManager.getGroup(id) : null

  // 处理输入框变化（检测@）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputText(value)
    
    const position = e.target.selectionStart || 0
    setCursorPosition(position)
    
    // 检查是否输入了@
    const textBeforeCursor = value.substring(0, position)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // 如果@后面没有空格，显示成员列表
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt)
        setShowMentionList(true)
        return
      }
    }
    
    setShowMentionList(false)
  }

  // 选择@的成员
  const handleSelectMention = (memberName: string) => {
    const textBeforeCursor = inputText.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const beforeAt = inputText.substring(0, lastAtIndex)
      const afterCursor = inputText.substring(cursorPosition)
      const newValue = `${beforeAt}@${memberName} ${afterCursor}`
      
      setInputText(newValue)
      setShowMentionList(false)
      
      // 聚焦输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const newCursorPos = lastAtIndex + memberName.length + 2
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  // 获取过滤后的成员列表
  const getFilteredMembers = () => {
    if (!id) return []
    const group = groupChatManager.getGroup(id)
    if (!group) return []
    
    // 过滤掉用户自己，只显示AI成员
    const aiMembers = group.memberIds
      .filter(memberId => memberId !== 'user')
      .map(memberId => {
        const char = characterService.getById(memberId)
        return {
          id: memberId,
          name: char?.realName || char?.nickname || '未知',
        }
      })
      .filter(member => 
        member.name.toLowerCase().includes(mentionSearch.toLowerCase())
      )
    
    return aiMembers
  }

  // 格式化文本段落
  const formatParagraphs = (text: string) => {
    // 将文本按换行符分割成段落
    const paragraphs = text.split('\n')
    
    return paragraphs.map((para, index) => {
      const trimmedPara = para.trim()
      // 跳过空段落
      if (!trimmedPara) {
        // 保留空行，但限制连续空行数量
        if (index > 0 && paragraphs[index - 1].trim() === '') {
          return null // 跳过连续的空行
        }
        return <br key={`br-${index}`} />
      }
      
      return (
        <span key={`para-${index}`}>
          {index > 0 && <br />}
          {trimmedPara}
        </span>
      )
    }).filter(Boolean)
  }

  // 渲染带@高亮的消息内容（优化段落显示）
  const renderMessageContent = (content: string) => {
    // 🔥 修复：确保content是字符串，避免undefined或null导致的错误
    if (!content || typeof content !== 'string') {
      console.warn('⚠️ 消息内容无效:', content)
      return ''
    }
    
    if (!id) return formatParagraphs(content)
    const group = groupChatManager.getGroup(id)
    if (!group) return formatParagraphs(content)

    // 先按段落分割
    const paragraphs = content.split('\n')
    
    return paragraphs.map((para, paraIndex) => {
      const trimmedPara = para.trim()
      
      // 处理空段落
      if (!trimmedPara) {
        if (paraIndex > 0 && paragraphs[paraIndex - 1].trim() === '') {
          return null
        }
        return <br key={`br-${paraIndex}`} />
      }
      
      // 对每个段落处理@提及
      const mentionRegex = /@([^\s@]+)/g
      const parts: (string | JSX.Element)[] = []
      let lastIndex = 0
      let match

      while ((match = mentionRegex.exec(trimmedPara)) !== null) {
        // 添加@之前的文本
        if (match.index > lastIndex) {
          const textBefore = trimmedPara.substring(lastIndex, match.index)
          parts.push(<React.Fragment key={`text-${paraIndex}-${lastIndex}`}>{textBefore}</React.Fragment>)
        }

        // 添加@高亮
        const mentionedName = match[1]
        const isMentioned = group.memberIds.some(memberId => {
          const char = characterService.getById(memberId)
          return (char?.realName === mentionedName || char?.nickname === mentionedName)
        })
        
        if (isMentioned) {
          parts.push(
            <span key={`mention-${paraIndex}-${match.index}`} className="text-blue-600 font-medium bg-blue-50 px-1 rounded">
              @{mentionedName}
            </span>
          )
        } else {
          parts.push(<React.Fragment key={`at-${paraIndex}-${match.index}`}>@{mentionedName}</React.Fragment>)
        }

        lastIndex = match.index + match[0].length
      }

      // 添加剩余文本
      if (lastIndex < trimmedPara.length) {
        const remainingText = trimmedPara.substring(lastIndex)
        parts.push(<React.Fragment key={`text-${paraIndex}-${lastIndex}-end`}>{remainingText}</React.Fragment>)
      }

      // 🔥 修复：如果没有parts，直接返回文本内容
      if (parts.length === 0) {
        return (
          <span key={`para-${paraIndex}`}>
            {paraIndex > 0 && <br />}
            {trimmedPara}
          </span>
        )
      }

      return (
        <span key={`para-${paraIndex}`}>
          {paraIndex > 0 && <br />}
          {parts}
        </span>
      )
    }).filter(Boolean)
  }

  // 处理图片选择
  const handleImageSelect = () => {
    setShowPhotoInput(true)
  }

  // 处理拍照
  const handleCameraSelect = () => {
    setShowCameraInput(true)
  }

  // 处理转账开始 - 先选择成员
  const handleTransferStart = () => {
    setShowMemberSelect(true)
  }

  // 处理位置选择
  const handleLocationSelect = () => {
    setShowLocationInput(true)
  }

  // 处理语音选择
  const handleVoiceSelect = () => {
    setShowVoiceInput(true)
  }

  // 重回功能：删除最后一轮AI回复并重新生成
  const handleRegenerate = () => {
    if (!id || isAiTyping) return
    
    console.log('🔄 [重回] 开始删除最后一轮AI回复...')
    
    // 获取所有消息
    const allMessages = groupChatManager.getMessages(id)
    
    // 找到最后一条用户消息的位置
    let lastUserIndex = -1
    for (let i = allMessages.length - 1; i >= 0; i--) {
      if (allMessages[i].userId === 'user') {
        lastUserIndex = i
        break
      }
    }
    
    if (lastUserIndex === -1) {
      console.warn('⚠️ [重回] 没有找到用户消息')
      return
    }
    
    // 删除最后一条用户消息之后的所有AI消息
    const messagesToKeep = allMessages.slice(0, lastUserIndex + 1)
    const deletedCount = allMessages.length - messagesToKeep.length
    
    console.log(`🗑️ [重回] 删除了 ${deletedCount} 条AI消息`)
    
    // 更新消息列表（使用强制覆盖模式，确保删除的消息不会被合并回来）
    groupChatManager.replaceAllMessages(id, messagesToKeep, true)
    setMessages(messagesToKeep)
    
    // 立即触发AI重新回复
    setTimeout(() => {
      handleAIReply()
    }, 300)
  }
  
  // AI主动回复（用户不发消息，只触发AI聊天）
  const handleAIReply = async () => {
    console.log('🚀 [群聊AI] handleAIReply被调用')
    console.log('🚀 [群聊AI] id:', id, 'isAiTyping:', isAiTyping)
    
    if (!id || isAiTyping) {
      console.log('⚠️ [群聊AI] 提前返回：id为空或正在输入中')
      return
    }
    
    console.log('✅ [群聊AI] 开始处理AI回复...')
    setIsAiTyping(true)
    // 🔥 关键优化：防止重复调用
    if (isAIReplying.current) {
      console.warn('⚠️ [群聊AI] AI正在回复中，跳过重复调用')
      return
    }
    
    isAIReplying.current = true
    setBatchMode(true)
    
    try {
      // 获取群聊信息
      const group = groupChatManager.getGroup(id)
      if (!group) {
        console.log('❌ [群聊AI] 找不到群聊信息，id:', id)
        return
      }
      
      // 🔥 先从 groupChatManager 重新读取最新消息
      let latestMessages = groupChatManager.getMessages(id)
      console.log(`📝 [AI回复] 消息数: ${latestMessages.length}`)
      
      // 🔥 关键优化：使用缓存，避免重复获取
      const allChars = characterService.getAll()
      const charMap = new Map(allChars.map(c => [c.id, c]))
      
      // 🔥 先收集所有角色的基础名字，用于检测重名
      const baseNameCount = new Map<string, number>()
      group.memberIds.forEach(memberId => {
        if (memberId === 'user') return
        const char = charMap.get(memberId)
        const baseName = char?.realName || char?.nickname || '未知'
        baseNameCount.set(baseName, (baseNameCount.get(baseName) || 0) + 1)
      })
      
      // 🔥 记录每个重名名字已使用的次数，用于生成唯一标识
      const baseNameUsed = new Map<string, number>()
      
      const members: GroupMember[] = group.memberIds.map(memberId => {
        const memberDetail = group.members?.find(m => m.id === memberId)
        
        if (memberId === 'user') {
          const userInfo = getUserInfo()
          const userAliases = [userInfo.nickname, userInfo.realName].filter(Boolean) as string[]
          return {
            id: 'user',
            name: userInfo.nickname || userInfo.realName,
            description: '',
            type: 'user',
            role: memberDetail?.role,
            title: memberDetail?.title,
            aliases: userAliases
          }
        }
        const char = charMap.get(memberId)  // 🔥 使用缓存
        // 🔥 收集所有可能的名字：realName, nickname, 以及去掉后缀的版本
        const charAliases: string[] = []
        if (char?.realName) charAliases.push(char.realName)
        if (char?.nickname) charAliases.push(char.nickname)
        // 去掉常见后缀（如 "2.0", "v2" 等）的版本也加入
        charAliases.forEach(name => {
          const stripped = name.replace(/[\s]*(v?\d+(\.\d+)?|[二三四五六七八九十]+代?)$/i, '').trim()
          if (stripped && stripped !== name && !charAliases.includes(stripped)) {
            charAliases.push(stripped)
          }
        })
        
        // 🔥 处理重名：如果有多个角色同名，使用 nickname 或添加序号区分
        let baseName = char?.realName || char?.nickname || '未知'
        const count = baseNameCount.get(baseName) || 1
        if (count > 1) {
          // 有重名，尝试用不同的名字区分
          const usedCount = baseNameUsed.get(baseName) || 0
          baseNameUsed.set(baseName, usedCount + 1)
          
          // 如果 nickname 和 realName 不同，优先用组合名
          if (char?.nickname && char?.realName && char.nickname !== char.realName) {
            baseName = `${char.realName}(${char.nickname})`
          } else {
            // 否则添加序号
            baseName = `${baseName}#${usedCount + 1}`
          }
          console.log(`⚠️ [重名处理] 角色 ${memberId} 重名，使用唯一名: ${baseName}`)
        }
        
        return {
          id: memberId,
          name: baseName,
          description: char?.personality || '',
          type: 'character',
          role: memberDetail?.role,
          title: memberDetail?.title,
          aliases: charAliases
        }
      })
      
      // 🔥 关键优化：只取最近30条，减少处理时间
      const recentMessages = latestMessages.slice(-30)
      const chatMessages = recentMessages.map(msg => ({
        ...msg,
        content: msg.type === 'emoji' || msg.emojiDescription || msg.emojiUrl
          ? `[发送了表情包：${msg.emojiDescription || msg.content || '表情包'}]` : msg.content
      }))

      console.log(`📝 传给AI的消息历史: ${chatMessages.length}条`)
      
      // 🎨 加载表情包列表
      const emojis = await getEmojis()
      console.log(`📦 加载了 ${emojis.length} 个表情包`)
      
      // 🔥 获取最后一条消息作为触发事件
      const lastMessage = latestMessages[latestMessages.length - 1]
      
      let triggerEvent = '（群里有点安静，AI们可以主动聊天）'
      if (lastMessage) {
        if (lastMessage.userId === 'user') {
          // 最后一条是用户消息，作为触发事件
          if (lastMessage.type === 'emoji' || lastMessage.emojiDescription || lastMessage.emojiUrl) {
            const description = lastMessage.emojiDescription || lastMessage.content || '表情包'
            triggerEvent = `[发送了表情包：${description}]`
          } else {
            triggerEvent = lastMessage.content
          }
        } else {
          // 最后一条是 AI 消息，让 AI 接着聊
          triggerEvent = '（AI们接着刚才的话题继续聊）'
        }
      }
      
      console.log(`📢 触发事件: ${triggerEvent}`)
      
      // 🔥 检查是否开启智能总结
      const smartSummaryEnabled = group.smartSummary?.enabled || false
      const oldSummaryStr = group.smartSummary?.lastSummary
      
      let parsedOldSummary = null
      let script = null
      
      if (smartSummaryEnabled && oldSummaryStr) {
        // 🎬 有旧总结：基于总结生成剧本（不显示总结）
        console.log('📊 [双AI架构] 有旧总结，基于总结生成剧本')
        
        try {
          parsedOldSummary = JSON.parse(oldSummaryStr)
        } catch (error) {
          console.error('解析旧总结失败:', error)
        }
        
        // 基于总结生成剧本
        const minReplyCount = group.minReplyCount || 15
        script = await generateGroupChatReply(
          group.name,
          members,
          chatMessages,
          triggerEvent,
          emojis,
          group.announcement,
          parsedOldSummary || undefined,
          minReplyCount,
          group.lorebookId,  // 传递世界书ID
          group.enableTheatreCards ?? false,  // 中插HTML小剧场
          group.plotSummary  // 🔥 剧情摘要（避免 AI 失忆）
        )
      } else {
        // 🎬 无总结：正常生成剧本
        console.log('🎬 [正常模式] 生成剧本')
        const minReplyCount = group.minReplyCount || 15
        script = await generateGroupChatReply(
          group.name,
          members,
          chatMessages,
          triggerEvent,
          emojis,
          group.announcement,
          undefined,  // 不使用总结
          minReplyCount,
          group.lorebookId,  // 传递世界书ID
          group.enableTheatreCards ?? false,  // 中插HTML小剧场
          group.plotSummary  // 🔥 剧情摘要（避免 AI 失忆）
        )
      }
      
      if (!script) {
        console.error('生成群聊回复失败')
        // 🚨 只在控制台显示错误，不在聊天界面显示系统消息
        return
      }
      
      // 🔥 维护一个本地消息数组，用于逐条显示
      const currentMessages = [...latestMessages]
      
      // 🎭 处理小剧场调用（如红包）- 将其插入到 actions 开头
      const theatreCalls = (script as any).theatreCalls as Array<{templateId: string, data: any}> | undefined
      if (theatreCalls && theatreCalls.length > 0) {
        console.log(`🎭 [小剧场] 检测到 ${theatreCalls.length} 个小剧场调用`)
        
        for (const call of theatreCalls) {
          console.log(`🎭 [小剧场] 处理: ${call.templateId}`, call.data)
          
          // 根据模板类型处理
          if (call.templateId === 'red_packet') {
            // 红包 - 找一个AI成员作为发送者（取第一个AI成员或最近说话的）
            const sender = members.find(m => m.type === 'character') || members[0]
            if (sender) {
              const amount = call.data?.amount || 88
              const blessing = call.data?.blessing || '恭喜发财'
              
              // 添加红包消息到群聊
              const redPacketMsg = groupChatManager.addMessage(id, {
                userId: sender.id,
                userName: sender.name,
                userAvatar: getMemberAvatar(sender.id),
                content: `[红包] ${blessing}`,
                type: 'text',
                messageType: 'redPacket',
                redPacket: {
                  totalAmount: amount,
                  count: members.length, // 红包个数等于成员数
                  blessing: blessing,
                  received: [],
                  remaining: amount,
                  remainingCount: members.length
                }
              } as any)
              
              currentMessages.push(redPacketMsg)
              console.log(`🧧 [小剧场] ${sender.name} 发送红包 ¥${amount}`)
            }
          }
          // 可以添加更多模板类型的处理...
        }
      }
      
      // 🔥 关键优化：限制单次回复的消息数量，避免卡死
      const MAX_MESSAGES_PER_REPLY = 50  // 最多50条消息
      const actionsToProcess = script.actions.slice(0, MAX_MESSAGES_PER_REPLY)
      
      if (script.actions.length > MAX_MESSAGES_PER_REPLY) {
        console.warn(`⚠️ [AI回复] 消息过多(${script.actions.length}条)，已限制为${MAX_MESSAGES_PER_REPLY}条`)
      }
      
      console.log(`🎬 [AI回复] 开始批量处理${actionsToProcess.length}条消息`)
      
      for (let i = 0; i < actionsToProcess.length; i++) {
        const action = actionsToProcess[i]
        
        // 🎭 处理导演视角的小剧场HTML（独立于角色消息）
        if (action.actorName === '导演') {
          const htmlMatch = action.content?.match(/\[小剧场HTML\]([\s\S]*?)\[\/小剧场HTML\]/)
          if (htmlMatch) {
            const htmlContent = htmlMatch[1].trim()
            console.log('🎭 [导演小剧场] 渲染HTML卡片')
            
            // 添加为系统消息类型，用于特殊渲染
            const theatreMsg = groupChatManager.addMessage(id, {
              userId: 'director',
              userName: '导演',
              userAvatar: '',
              content: htmlContent,
              type: 'theatre_html' as any,  // 特殊类型
              messageType: 'theatre_html'
            } as any)
            
            currentMessages.push(theatreMsg)
            console.log(`📨 [AI回复] 第${i + 1}条消息已添加: 导演（小剧场）`)
            
            // 🔥 立即更新UI，显示小剧场
            setMessages(prev => [...prev, theatreMsg])
            
            // 🔥 添加延迟，让小剧场显示后再继续
            if (i < actionsToProcess.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
            }
          }
          continue  // 导演消息处理完毕，跳过后续角色消息处理
        }
        
        // 查找成员 - 🔥 支持多种名字匹配（realName、nickname、去后缀版本）
        const member = members.find(m => {
          if (m.type !== 'character') return false
          // 优先检查主名字
          if (m.name === action.actorName) return true
          // 检查所有别名
          if (m.aliases?.includes(action.actorName)) return true
          // 模糊匹配：去掉AI返回名字的后缀再匹配
          const strippedActorName = action.actorName.replace(/[\s]*(v?\d+(\.\d+)?|[二三四五六七八九十]+代?)$/i, '').trim()
          if (strippedActorName !== action.actorName) {
            if (m.name === strippedActorName || m.aliases?.includes(strippedActorName)) return true
          }
          return false
        })
        if (!member) {
          console.warn('找不到成员:', action.actorName, '| 可用成员:', members.filter(m => m.type === 'character').map(m => `${m.name}(${m.aliases?.join('/')})`).join(', '))
          continue
        }
        
        // 查找引用的消息
        let quotedMsg = undefined
        if (action.quotedMessageId) {
          const quoted = latestMessages.find(m => m.id === action.quotedMessageId)
          if (quoted) {
            quotedMsg = {
              id: quoted.id,
              content: quoted.content,
              userName: quoted.userName
            }
            console.log(`引用了消息: ${quoted.userName} - ${quoted.content}`)
          }
        }
        
        // 🔥 检查是否包含特殊指令，支持"台词+指令"组合
        let content = action.content || ''
        let hasCommand = false
        
        // 🔥 清理引用标记（AI可能在台词中包含[引用]xxx[/引用]）
        content = content.replace(/\[引用\](.+?)\[\/引用\]/g, '$1')
        
        // 检查撤回指令：[撤回:msg_xxx]
        const recallMatch = content.match(/\[撤回:(msg_\w+)\]/)
        if (recallMatch) {
          const targetMsgId = recallMatch[1]
          console.log(`🗑️ [AI指令] ${member.name} 撤回消息: ${targetMsgId}`)
          groupChatManager.recallMessage(id, targetMsgId, member.name)
          
          // 从内容中移除指令部分
          content = content.replace(/\[撤回:msg_\w+\]/, '').trim()
          hasCommand = true
        }
        
        // 🔥 移除无效的撤回指令（AI写了描述而不是真实ID）
        if (content.match(/\[撤回[:：].+?\]/)) {
          console.warn('⚠️ 移除无效撤回指令:', content)
          content = content.replace(/\[撤回[:：].+?\]/g, '').trim()
          hasCommand = true
          if (!content) continue
        }
        
        // 🎭 检查表情指令：[表情:描述] 或 [表情包:描述] 或 [发送了表情包：描述] 或 [表情:数字]
        const emojiMatch = content.match(/\[(?:表情包?|发送了表情包)[：:]\s*(.+?)\]/)
        if (emojiMatch) {
          const emojiKey = emojiMatch[1].trim()
          console.log(`🎭 [AI指令] ${member.name} 发送表情包: ${emojiKey}`)
          
          // 先尝试按数字匹配，再按描述匹配
          let emoji = null
          
          // 🔥 优先提取开头的数字（支持 "26 描述" 或 "26" 格式）
          const numberMatch = emojiKey.match(/^(\d+)/)
          if (numberMatch) {
            const idx = parseInt(numberMatch[1]) - 1
            if (idx >= 0 && idx < emojis.length) {
              emoji = emojis[idx]
              console.log(`🎯 [表情匹配] 数字索引匹配成功: ${idx + 1} -> ${emoji.description}`)
            }
          }
          
          // 如果数字匹配失败，尝试关键词匹配
          if (!emoji) {
            // 🔥 改进的模糊匹配：拆分关键词，计算匹配度
            const keywords = emojiKey.replace(/[的是在了]+/g, '').split('').filter(c => c.trim())
            let bestMatch = null
            let bestScore = 0
            
            for (const e of emojis) {
              const desc = e.description.replace(/[的是在了]+/g, '')
              // 计算关键词命中数
              let score = 0
              for (const kw of keywords) {
                if (desc.includes(kw)) score++
              }
              // 也检查反向包含
              if (desc.includes(emojiKey) || emojiKey.includes(desc)) {
                score += 5 // 完整包含加分
              }
              if (score > bestScore) {
                bestScore = score
                bestMatch = e
              }
            }
            
            // 至少要匹配2个关键词，或者有完整包含关系
            if (bestScore >= 2) {
              emoji = bestMatch
              console.log(`🎯 [表情匹配] 关键词匹配成功，得分: ${bestScore}，匹配到: ${bestMatch?.description}`)
            }
          }
          
          if (emoji) {
            const emojiMsg = groupChatManager.addMessage(id, {
              userId: member.id,
              userName: member.name,
              userAvatar: getMemberAvatar(member.id),
              content: emoji.description,
              type: 'emoji',
              emojiUrl: emoji.url,
              emojiDescription: emoji.description,
              quotedMessage: quotedMsg
            })
            
            currentMessages.push(emojiMsg)
            console.log(`✅ [表情] ${member.name} 发送了表情包: ${emoji.description}`)
            
            // 🔥 立即更新UI，显示表情包
            setMessages(prev => [...prev, emojiMsg])
          } else {
            console.warn('未找到匹配的表情包:', emojiKey)
          }
          
          // 从内容中移除指令部分（支持多种格式）
          content = content.replace(/\[(?:表情包?|发送了表情包)[：:]\s*.+?\]/, '').trim()
          hasCommand = true
          if (!content) {
            // 🔥 如果只有表情包没有文字，添加延迟后继续
            if (i < actionsToProcess.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
            }
            continue
          }
        }
        
        // 检查踢出指令：[踢出:成员名]
        const kickMatch = content.match(/\[踢出:(.+?)\]/)
        if (kickMatch) {
          const targetName = kickMatch[1]
          console.log(`👢 [AI指令] ${member.name} 踢出成员: ${targetName}`)
          
          // 查找目标成员
          const targetMember = members.find(m => m.name === targetName)
          if (targetMember && targetMember.type === 'character') {
            await groupChatManager.removeMember(id, targetMember.id, true, member.name)
          } else {
            console.warn('找不到目标成员或无法踢出:', targetName)
          }
          
          // 从内容中移除指令部分
          content = content.replace(/\[踢出:.+?\]/, '').trim()
          hasCommand = true
        }

        // 检查退群指令：[退群]
        if (content.includes('[退群]')) {
          console.log(`🚪 [AI指令] ${member.name} 主动退群`)
          
          // 移除该成员（isKicked=false表示主动退出）
          await groupChatManager.removeMember(id, member.id, false, member.name)
          
          // 从内容中移除指令部分
          content = content.replace(/\[退群\]/, '').trim()
          hasCommand = true
        }
        
        // 检查群公告指令：[群公告:内容]
        const announcementMatch = content.match(/\[群公告:(.+?)\]/)
        if (announcementMatch) {
          const newAnnouncement = announcementMatch[1]
          console.log(`📢 [AI指令] ${member.name} 修改群公告: ${newAnnouncement}`)
          await groupChatManager.updateAnnouncement(id, newAnnouncement, member.name)
          
          // 从内容中移除指令部分
          content = content.replace(/\[群公告:.+?\]/, '').trim()
          hasCommand = true
        }

        // 检查头衔指令：[头衔:成员名:新头衔]
        const titleMatch = content.match(/\[头衔:([^:]+?):(.+?)\]/)
        if (titleMatch) {
          const targetName = titleMatch[1].trim()
          const newTitle = titleMatch[2].trim()
          console.log(`🏷️ [AI指令] ${member.name} 修改头衔: ${targetName} -> ${newTitle}`)

          // 查找目标成员
          const targetMember = members.find(m => m.name === targetName)
          if (targetMember && targetMember.type === 'character') {
            await groupChatManager.setTitle(id, targetMember.id, newTitle, member.name)
          } else {
            console.warn('找不到目标成员或无法设置头衔:', targetName)
          }

          // 从内容中移除指令部分
          content = content.replace(/\[头衔:[^:]+?:.+?\]/, '').trim()
          hasCommand = true
        }

        // 检查接收转账指令：[接收转账]
        if (content.includes('[接收转账]')) {
          console.log(`💰 [AI指令] ${member.name} 接收转账`)
          
          // 查找该成员待接收的转账（任何人发的）
          const pendingTransfer = [...currentMessages].reverse().find(msg => 
            (msg as any).messageType === 'transfer' &&
            (msg as any).transfer?.toUserId === member.id &&
            (msg as any).transfer?.status === 'pending'
          )
          
          if (pendingTransfer) {
            const transferAmount = (pendingTransfer as any).transfer?.amount || 0
            const fromName = pendingTransfer.userName || '未知'
            
            // 🔥 从数据库重新读取完整消息列表，确保不丢失系统消息
            const allMessages = groupChatManager.getMessages(id)
            
            // 更新转账状态为已接收
            const updatedMessages = allMessages.map(msg => 
              msg.id === pendingTransfer.id
                ? { ...msg, transfer: { ...(msg as any).transfer, status: 'received' } }
                : msg
            )
            
            // 添加系统提示消息（显示谁给谁转账）
            const systemMsg = groupChatManager.addMessage(id, {
              userId: 'system',
              userName: '系统',
              userAvatar: '',
              content: `${member.name}已接收${fromName}的转账 ￥${transferAmount.toFixed(2)}`,
              type: 'system'
            })
            updatedMessages.push(systemMsg)
            
            // 更新数据库和本地数组
            groupChatManager.replaceAllMessages(id, updatedMessages as any)
            currentMessages.length = 0
            currentMessages.push(...updatedMessages)
            
            console.log(`✅ [转账] ${member.name} 已接收转账`)
          }
          
          // 从内容中移除指令部分
          content = content.replace(/\[接收转账\]/, '').trim()
          hasCommand = true
        }

        // 检查退还转账指令：[退还]
        if (content.includes('[退还]')) {
          console.log(`💸 [AI指令] ${member.name} 退还转账`)
          
          // 查找该成员待接收的转账（任何人发的）
          const pendingTransfer = [...currentMessages].reverse().find(msg => 
            (msg as any).messageType === 'transfer' &&
            (msg as any).transfer?.toUserId === member.id &&
            (msg as any).transfer?.status === 'pending'
          )
          
          if (pendingTransfer) {
            const transferAmount = (pendingTransfer as any).transfer?.amount || 0
            const fromName = pendingTransfer.userName || '未知'
            
            // 🔥 从数据库重新读取完整消息列表，确保不丢失系统消息
            const allMessages = groupChatManager.getMessages(id)
            
            // 更新转账状态为已过期（退还）
            const updatedMessages = allMessages.map(msg => 
              msg.id === pendingTransfer.id
                ? { ...msg, transfer: { ...(msg as any).transfer, status: 'refunded' } }
                : msg
            )
            
            // 添加系统提示消息（显示谁给谁转账）
            const systemMsg = groupChatManager.addMessage(id, {
              userId: 'system',
              userName: '系统',
              userAvatar: '',
              content: `${member.name}已退还${fromName}的转账 ￥${transferAmount.toFixed(2)}`,
              type: 'system'
            })
            updatedMessages.push(systemMsg)
            
            // 更新数据库和本地数组
            groupChatManager.replaceAllMessages(id, updatedMessages as any)
            currentMessages.length = 0
            currentMessages.push(...updatedMessages)
            
            console.log(`✅ [转账] ${member.name} 已退还转账`)
          }
          
          // 从内容中移除指令部分
          content = content.replace(/\[退还\]/, '').trim()
          hasCommand = true
        }

        // 检查领取红包指令：[领取红包]
        if (content.includes('[领取红包]')) {
          console.log(`🧧 [AI指令] ${member.name} 领取红包`)
          
          // 查找可领取的红包（任何人发的，还有剩余，且该成员未领取过）
          // 🔥 使用 findLast 找到最新的红包，而不是最旧的
          const availableRedPacket = [...currentMessages].reverse().find(msg => 
            (msg as any).messageType === 'redPacket' &&
            (msg as any).redPacket?.remainingCount > 0 &&
            !(msg as any).redPacket?.received?.some((r: any) => r.userId === member.id)
          )
          
          if (availableRedPacket) {
            const redPacket = (availableRedPacket as any).redPacket
            
            // 计算领取金额（手气红包算法）
            let amount = 0
            if (redPacket.remainingCount === 1) {
              amount = Math.round(redPacket.remaining * 100) / 100
            } else {
              const max = (redPacket.remaining / redPacket.remainingCount) * 2
              amount = Math.round(Math.random() * max * 100) / 100
              if (amount < 0.01) amount = 0.01
            }
            
            // 🔥 从数据库重新读取完整消息列表，确保不丢失系统消息
            const allMessages = groupChatManager.getMessages(id)
            
            // 更新红包状态
            const memberAvatar = getMemberAvatar(member.id)
            console.log(`🖼️ [红包] 获取${member.name}的头像:`, memberAvatar ? '✅ 有头像' : '❌ 无头像')
            
            const updatedRedPacket = {
              ...redPacket,
              remaining: Math.round((redPacket.remaining - amount) * 100) / 100,
              remainingCount: redPacket.remainingCount - 1,
              received: [
                ...redPacket.received,
                {
                  userId: member.id,
                  userName: member.name,
                  userAvatar: memberAvatar,
                  amount,
                  timestamp: Date.now()
                }
              ]
            }
            
            console.log(`💾 [红包] 领取记录:`, {
              userId: member.id,
              userName: member.name,
              userAvatar: memberAvatar,
              amount: amount.toFixed(2)
            })
            
            const updatedMessages = allMessages.map(msg => 
              msg.id === availableRedPacket.id
                ? { ...msg, redPacket: updatedRedPacket }
                : msg
            )
            
            // 添加系统提示消息（显示金额）
            const systemMsg = groupChatManager.addMessage(id, {
              userId: 'system',
              userName: '系统',
              userAvatar: '',
              content: `${member.name}领取了你的红包 ￥${amount.toFixed(2)}`,
              type: 'system'
            })
            updatedMessages.push(systemMsg)
            
            // 更新数据库和本地数组
            groupChatManager.replaceAllMessages(id, updatedMessages as any)
            currentMessages.length = 0
            currentMessages.push(...updatedMessages)
            
            console.log(`✅ [红包] ${member.name} 已领取红包 ¥${amount.toFixed(2)}`)
          }
          
          // 从内容中移除指令部分
          content = content.replace(/\[领取红包\]/, '').trim()
          hasCommand = true
        }

        // 检查转账指令：[转账:接收者:金额:留言]
        const transferMatch = content.match(/\[转账:([^:]+):(\d+(?:\.\d+)?):(.+?)\]/)
        if (transferMatch) {
          const toName = transferMatch[1].trim()
          const amount = parseFloat(transferMatch[2])
          const note = transferMatch[3].trim()
          console.log(`💰 [AI指令] ${member.name} 给${toName}转账 ¥${amount}`)
          
          // 🔥 查找接收者 - 支持多种匹配方式
          let receiver = members.find(m => m.name === toName)
          // 如果精确匹配失败，尝试别名匹配
          if (!receiver) {
            receiver = members.find(m => m.aliases?.includes(toName))
          }
          // 如果还是找不到，尝试模糊匹配（名字包含）
          if (!receiver) {
            receiver = members.find(m => m.name.includes(toName) || toName.includes(m.name))
          }
          console.log(`💰 [转账] 接收者查找: "${toName}" -> ${receiver ? receiver.name : '未找到'}`)
          if (receiver) {
            const transferMsg = groupChatManager.addMessage(id, {
              userId: member.id,
              userName: member.name,
              userAvatar: getMemberAvatar(member.id),
              content: `[转账] 给${toName}转账¥${amount}`,
              type: 'text',
              messageType: 'transfer',
              transfer: {
                amount: amount,
                message: note,
                toUserId: receiver.id,
                toUserName: toName,
                status: 'pending'
              }
            } as any)
            
            currentMessages.push(transferMsg)
            
            setMessages(prev => [...prev, transferMsg])
            
            content = content.replace(/\[转账:[^:]+:\d+(?:\.\d+)?:.+?\]/, '').trim()
            hasCommand = true
            if (!content) {
              // 🔥 添加延迟后继续
              if (i < actionsToProcess.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
              }
              continue
            }
          }
        }

        // 检查语音指令：[语音:文字内容]
        const voiceMatch = content.match(/\[语音:(.+?)\]/)
        if (voiceMatch) {
          let voiceText = voiceMatch[1].trim()
          console.log(`🎤 [AI指令] ${member.name} 发送语音: ${voiceText}`)
          
          // 🔥 过滤括号内容（声音描述），只保留要读的文字
          const textToRead = voiceText.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim()
          console.log(`📝 [语音过滤] 原文: ${voiceText}`)
          console.log(`📝 [语音过滤] 要读: ${textToRead}`)
          
          // 🎵 检查角色是否设置了音色，如果有则生成TTS
          let voiceUrl = ''
          const char = characterService.getById(member.id)
          if (char && textToRead) {
            const voiceSettings = localStorage.getItem(`voice_settings_${member.id}`)
            if (voiceSettings) {
              try {
                const settings = JSON.parse(voiceSettings)
                if (settings.voiceId) {
                  console.log(`🎵 [语音TTS] ${member.name} 有音色设置，开始生成...`)
                  const { callMinimaxTTS } = await import('../utils/voiceApi')
                  const ttsResult = await callMinimaxTTS(textToRead, settings.voiceId)
                  voiceUrl = ttsResult.audioUrl
                  console.log(`✅ [语音TTS] 生成成功`)
                }
              } catch (e) {
                console.warn(`⚠️ [语音TTS] 生成失败:`, e)
              }
            }
          }
          
          const voiceMsg = groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: voiceText,
            type: 'voice',
            messageType: 'voice',
            voiceText: voiceText,
            voiceUrl: voiceUrl || undefined,
            duration: Math.ceil(textToRead.length / 5)
          } as any)
          
          currentMessages.push(voiceMsg)
          
          // 🔥 立即更新UI
          setMessages(prev => [...prev, voiceMsg])
          
          content = content.replace(/\[语音:.+?\]/, '').trim()
          hasCommand = true
          if (!content) {
            // 🔥 添加延迟后继续
            if (i < actionsToProcess.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
            }
            continue
          }
        }

        // 检查图片指令：[图片:描述]
        const photoMatch = content.match(/\[图片:(.+?)\]/)
        if (photoMatch) {
          const description = photoMatch[1].trim()
          console.log(`📷 [AI指令] ${member.name} 发送图片: ${description}`)
          
          const photoMsg = groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: `[图片: ${description}]`,
            type: 'image',
            messageType: 'photo',
            photoDescription: description
          } as any)
          
          currentMessages.push(photoMsg)
          
          // 🔥 立即更新UI
          setMessages(prev => [...prev, photoMsg])
          
          content = content.replace(/\[图片:.+?\]/, '').trim()
          hasCommand = true
          if (!content) {
            // 🔥 添加延迟后继续
            if (i < actionsToProcess.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
            }
            continue
          }
        }

        // 检查位置指令：[位置:地点名称]
        const locationMatch = content.match(/\[位置:(.+?)\]/)
        if (locationMatch) {
          const locationName = locationMatch[1].trim()
          console.log(`📍 [AI指令] ${member.name} 分享位置: ${locationName}`)
          
          const locationMsg = groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: `[位置] ${locationName}`,
            type: 'text',
            messageType: 'location',
            location: {
              name: locationName,
              address: locationName
            }
          } as any)
          
          currentMessages.push(locationMsg)
          
          // 🔥 立即更新UI
          setMessages(prev => [...prev, locationMsg])
          
          content = content.replace(/\[位置:.+?\]/, '').trim()
          hasCommand = true
          if (!content) {
            // 🔥 添加延迟后继续
            if (i < actionsToProcess.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
            }
            continue
          }
        }

        // 🧧 检查红包指令：[红包:金额:个数:祝福语]
        const redPacketMatch = content.match(/\[红包:(\d+(?:\.\d+)?):(\d+):(.+?)\]/)
        if (redPacketMatch) {
          const amount = parseFloat(redPacketMatch[1])
          const count = parseInt(redPacketMatch[2]) || 5  // 默认5个
          const blessing = redPacketMatch[3].trim()
          console.log(`🧧 [AI指令] ${member.name} 发送红包: ¥${amount} / ${count}个 - ${blessing}`)
          
          const redPacketMsg = groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: `[红包] ${blessing}`,
            type: 'text',
            messageType: 'redPacket',
            redPacket: {
              totalAmount: amount,
              count: count,
              blessing: blessing,
              received: [],
              remaining: amount,
              remainingCount: count
            }
          } as any)
          
          currentMessages.push(redPacketMsg)
          
          // 🔥 立即更新UI
          setMessages(prev => [...prev, redPacketMsg])
          
          content = content.replace(/\[红包:\d+(?:\.\d+)?:\d+:.+?\]/, '').trim()
          hasCommand = true
          if (!content) {
            // 🔥 添加延迟后继续
            if (i < actionsToProcess.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
            }
            continue
          }
        }

        // 🗳️ 检查发起投票指令：[发起投票:标题:选项1:选项2:...]
        const createPollMatch = content.match(/\[发起投票:([^:\]]+):(.+?)\]/)
        if (createPollMatch) {
          const title = createPollMatch[1].trim()
          const optionsStr = createPollMatch[2]
          const options = optionsStr.split(':').map(o => o.trim()).filter(Boolean)
          
          if (options.length >= 2) {
            console.log(`🗳️ [投票] ${member.name} 发起投票: ${title}，选项: ${options.join(', ')}`)
            
            const pollMsg = groupChatManager.addMessage(id, {
              userId: member.id,
              userName: member.name,
              userAvatar: getMemberAvatar(member.id),
              content: title,
              type: 'text',
              messageType: 'poll',
              poll: {
                title,
                options: options.map((opt, idx) => ({ id: idx + 1, text: opt, votes: [] })),
                createdAt: Date.now(),
                creatorId: member.id,
                creatorName: member.name
              }
            } as any)
            
            currentMessages.push(pollMsg)
            
            // 🔥 立即更新UI
            setMessages(prev => [...prev, pollMsg])
            
            content = content.replace(/\[发起投票:[^\]]+\]/, '').trim()
            hasCommand = true
            if (!content) {
              // 🔥 添加延迟后继续
              if (i < actionsToProcess.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
              }
              continue
            }
          }
        }

        // 🗳️ 检查投票指令：[投票:选项序号]
        const voteMatch = content.match(/\[投票:(\d+)\]/)
        if (voteMatch) {
          const optionIndex = parseInt(voteMatch[1])
          // 找到最近的投票消息
          const pollMsg = [...currentMessages].reverse().find(m => (m as any).poll)
          if (pollMsg && (pollMsg as any).poll) {
            const poll = (pollMsg as any).poll
            const option = poll.options.find((o: any) => o.id === optionIndex)
            if (option) {
              // 检查是否已投票
              const hasVoted = poll.options.some((o: any) => o.votes.includes(member.id))
              if (!hasVoted) {
                option.votes.push(member.id)
                console.log(`🗳️ [投票] ${member.name} 投给了选项${optionIndex}: ${option.text}`)
                
                // 更新投票消息
                groupChatManager.replaceAllMessages(id, currentMessages)
                
                // 🔥 添加系统消息：XX投了XX
                const voteSystemMsg = groupChatManager.addMessage(id, {
                  userId: 'system',
                  userName: '系统',
                  userAvatar: '',
                  content: `${member.name}投了「${option.text}」`,
                  type: 'system'
                })
                currentMessages.push(voteSystemMsg)
              }
            }
          }
          
          content = content.replace(/\[投票:\d+\]/, '').trim()
          hasCommand = true
          if (!content) continue
        }

        // 🗳️ 检查添加选项指令：[添加选项:新选项内容]
        const addOptionMatch = content.match(/\[添加选项:([^\]]+)\]/)
        if (addOptionMatch) {
          const newOptionText = addOptionMatch[1].trim()
          // 找到最近的投票消息
          const pollMsg = [...currentMessages].reverse().find(m => (m as any).poll)
          if (pollMsg && (pollMsg as any).poll && newOptionText) {
            const poll = (pollMsg as any).poll
            // 检查选项是否已存在
            const exists = poll.options.some((o: any) => o.text === newOptionText)
            if (!exists && poll.options.length < 10) {
              const newId = poll.options.length + 1
              poll.options.push({ id: newId, text: newOptionText, votes: [], addedBy: member.name })
              console.log(`🗳️ [添加选项] ${member.name} 添加了新选项: ${newOptionText}`)
              
              // 更新投票消息
              groupChatManager.replaceAllMessages(id, currentMessages)
            }
          }
          
          content = content.replace(/\[添加选项:[^\]]+\]/, '').trim()
          hasCommand = true
          if (!content) continue
        }

        // 检查小剧场指令：[小剧场:模板名] 数据描述
        const theatreMatch = content.match(/\[小剧场:([^\]]+?)\]\s*(.*)/)
        if (theatreMatch) {
          const templateName = theatreMatch[1].trim()
          const dataDescription = theatreMatch[2].trim()
          console.log(`🎭 [AI指令] ${member.name} 发送小剧场: ${templateName}，数据: ${dataDescription}`)
          
          // 将文本描述转换为小剧场内容（简化版，让AI负责填充详细数据）
          const theatreContent = `[小剧场:${templateName}] ${dataDescription}`
          
          // 添加小剧场消息
          groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: theatreContent,
            type: 'text',
            quotedMessage: quotedMsg
          })
          
          // 从内容中移除指令部分
          content = content.replace(/\[小剧场:[^\]]+?\].*/, '').trim()
          hasCommand = true
          
          // 如果只有小剧场没有其他文本，跳过后续处理
          if (!content) {
            continue
          }
        }

        // 如果有指令且没有剩余文本，跳过添加消息
        if (hasCommand && !content) {
          // 🔥 不再手动刷新消息列表，让storage事件处理，避免重复渲染
          continue
        }
        
        // 🔥 添加消息到存储并获取返回的完整消息对象
        let newMessage
        // 检查是否是表情包消息
        if (action.emojiIndex && emojis.length > 0) {
          const emoji = emojis[action.emojiIndex - 1] // 编号从1开始，数组从0开始
          if (emoji) {
            // 发送表情包消息（带引用）
            newMessage = groupChatManager.addMessage(id, {
              userId: member.id,
              userName: member.name,
              userAvatar: getMemberAvatar(member.id),
              content: emoji.description,
              type: 'emoji',
              emojiUrl: emoji.url,
              emojiDescription: emoji.description,
              quotedMessage: quotedMsg
            })
          } else {
            console.warn('表情包编号超出范围:', action.emojiIndex)
            // 降级为文本消息
            newMessage = groupChatManager.addMessage(id, {
              userId: member.id,
              userName: member.name,
              userAvatar: getMemberAvatar(member.id),
              content: content,  // 使用处理后的content
              type: 'text',
              quotedMessage: quotedMsg
            })
          }
        } else {
          // 普通文本消息（带引用）
          newMessage = groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: content,  // 使用处理后的content
            type: 'text',
            quotedMessage: quotedMsg
          })
        }
        
        // 🔥 追加到本地数组
        currentMessages.push(newMessage)
        console.log(`📨 [AI回复] 第${i + 1}条消息已添加: ${action.actorName}`)
        
        // 🔥 立即更新UI，让用户看到消息一条条出现
        setMessages(prev => {
          // 检查是否已存在
          if (prev.some(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
        
        // 🔥 添加小延迟，让消息有“打字”感觉
        if (i < actionsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300))
        }
      }
      
      // 🔥 所有消息处理完成
      console.log(`📊 [AI回复完成] 共添加 ${actionsToProcess.length} 条消息`)
      
      // 🔥 保存 AI 生成的剧情摘要（用于下次回复时作为背景，避免 AI 失忆）
      if (script.relationships || script.plot) {
        const plotSummary = {
          relationships: script.relationships || '',
          plot: script.plot || '',
          updatedAt: Date.now()
        }
        await groupChatManager.updateGroup(id, { plotSummary })
        console.log(`📝 [剧情摘要] 已保存: ${script.plot?.substring(0, 50)}...`)
      }
      
      console.log(`💾 [AI回复完成] 当前消息数: ${currentMessages.length}`)
      
      // 🔥 AI回复完成后，后台生成/更新总结（如果开启了智能总结）
      if (smartSummaryEnabled) {
        const summaryMessages = groupChatManager.getMessages(id)
        // 统计用户发的消息数量（按轮数计算）
        const userMessageCount = summaryMessages.filter(m => m.userId === 'user').length
        const lastSummaryUserMessageCount = group.smartSummary?.lastSummaryUserMessageCount || 0
        const triggerInterval = group.smartSummary?.triggerInterval || 10
        
        // 检查是否达到触发间隔（按轮数）
        const shouldTrigger = (userMessageCount - lastSummaryUserMessageCount) >= triggerInterval
        
        if (shouldTrigger) {
          console.log(`📊 [后台任务] 已达到触发间隔(${triggerInterval}轮)，开始生成/更新总结...`)
          
          // 获取上次总结（如果有）
          let lastSummary = undefined
          if (group.smartSummary?.lastSummary) {
            try {
              lastSummary = JSON.parse(group.smartSummary.lastSummary)
            } catch (e) {
              console.warn('📊 解析上次总结失败，将进行全量总结')
            }
          }
          
          // 获取新消息（从上次总结后的消息）
          const messagesToSummarize = lastSummary 
            ? currentMessages.slice(-(userMessageCount - lastSummaryUserMessageCount) * 2) // 用户消息+AI回复
            : currentMessages  // 第一次总结，使用全部消息
          
          console.log(`📊 本次总结消息数: ${messagesToSummarize.length} (总共${currentMessages.length}条)`)
          
          // 异步执行，不阻塞UI
          generateGroupChatSummary(
            group.name,
            members,
            messagesToSummarize,
            lastSummary  // 传入上次总结
          ).then(async newSummary => {
            if (newSummary && id) {
              console.log('📊 [后台任务] 总结生成成功，保存到群聊数据')
              const updatedGroup = groupChatManager.getGroup(id)
              await groupChatManager.updateGroup(id, {
                smartSummary: {
                  ...updatedGroup?.smartSummary,
                  enabled: true,
                  triggerInterval: triggerInterval,
                  lastSummary: JSON.stringify(newSummary),
                  lastSummaryTime: new Date().toISOString(),
                  lastSummaryUserMessageCount: userMessageCount
                }
              })
            }
          }).catch(error => {
            console.error('📊 [后台任务] 总结生成失败:', error)
          })
        } else {
          console.log(`📊 [后台任务] 未达到触发间隔(当前${userMessageCount - lastSummaryUserMessageCount}/${triggerInterval}轮)，跳过总结`)
        }
      }
    } catch (error) {
      console.error('✅ AI回复失败:', error)
    } finally {
      // 🔥 关键修复：批量模式结束前，将所有消息保存到 IndexedDB
      // 批量模式期间 addMessage 只更新缓存不保存数据库，这里统一保存
      // 🔥 使用静默模式（silent=true），避免触发 storage 事件导致消息重复
      const allMessages = groupChatManager.getMessages(id)
      if (allMessages.length > 0) {
        console.log(`💾 [AI回复完成] 保存 ${allMessages.length} 条消息到 IndexedDB`)
        groupChatManager.replaceAllMessages(id, allMessages, false, true)  // silent=true
      }
      
      setIsAiTyping(false)
      setBatchMode(false)  // 🔥 关闭批量模式
      // 🔥 延迟清除AI回复标志，确保异步保存完成后再响应storage事件
      setTimeout(() => {
        isAIReplying.current = false
        console.log('🔓 [AI回复] 已清除isAIReplying标志，storage事件恢复响应')
      }, 500)
    }
  }

  // 🔥 发送消息（使用 hook）- 使用 useCallback 避免重渲染
  const handleSend = useCallback(() => {
    sendMessage(inputText)
  }, [sendMessage, inputText])

  return (
    <div className="h-screen flex flex-col bg-gray-50 soft-page-enter">
      {/* 顶部导航 - 与私聊同步美化设置 */}
      <div className="relative glass-effect rounded-b-[20px]">
        {/* 顶栏装饰背景 */}
        {(customIcons['chat-topbar-bg'] || chatDecorations.topBar) && (
          <div 
            className="absolute inset-0 pointer-events-none z-0 rounded-b-[20px] overflow-hidden"
            style={{
              backgroundImage: `url(${customIcons['chat-topbar-bg'] || chatDecorations.topBar})`,
              backgroundSize: `${topBarScale || 100}%`,
              backgroundPosition: `calc(50% + ${topBarX || 0}px) calc(50% + ${topBarY || 0}px)`
            }}
          />
        )}
        <div className="relative z-10">
          <StatusBar />
        </div>
        <div className="relative z-10 px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate('/wechat')}
            className="p-2 active:scale-95 transition-transform rounded-full"
          >
            {customIcons['chat-back'] ? (
              <img src={customIcons['chat-back']} alt="返回" className="w-8 h-8 object-contain rounded-full" />
            ) : (
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
          <h1 className="text-base font-medium text-gray-900">{groupName}</h1>
          <button 
            onClick={() => navigate(`/group/${id}/settings`)}
            className="p-2 active:scale-95 transition-transform rounded-full"
          >
            {customIcons['chat-more'] ? (
              <img src={customIcons['chat-more']} alt="更多" className="w-8 h-8 object-contain" />
            ) : (
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 pb-2 -webkit-overflow-scrolling-touch"
        style={{ WebkitOverflowScrolling: 'touch', overflowAnchor: 'none' }}
      >
        {/* 虚拟列表顶部占位 */}
        {virtualStyle.paddingTop > 0 && (
          <div style={{ height: virtualStyle.paddingTop }} />
        )}
        {!bubbleCssLoaded || isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            加载中...
          </div>
        ) : uniqueMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            暂无消息
          </div>
        ) : (
          // 使用预先去重的 uniqueMessages（O(n) 复杂度）
          uniqueMessages.map((msg, index) => {
            // 判断是否显示时间戳（两条消息间隔超过5分钟就显示）
            const prevMsg = uniqueMessages[index - 1]
            let shouldShowTimestamp = false
            
            if (index === 0) {
              shouldShowTimestamp = true
            } else if (msg.timestamp && prevMsg?.timestamp) {
              // 计算两条消息之间的时间差
              const timeDiff = msg.timestamp - prevMsg.timestamp
              // 如果时间差超过5分钟，显示时间戳
              shouldShowTimestamp = timeDiff >= 5 * 60 * 1000  // 5分钟 = 300000毫秒
            }
            
            // 系统消息（撤回）- 撤回消息可点击查看
            if (msg.type === 'system' || msg.isRecalled) {
              const isRecalledWithContent = msg.isRecalled && (msg as any).recalledContent
              return (
                <div key={msg.id} data-message-id={msg.id} style={{ display: 'flow-root' }}>
                  {shouldShowTimestamp && msg.timestamp && (
                    <div className="flex justify-center my-3">
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {new Date(msg.timestamp).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-center my-2">
                    <span 
                      className={`text-xs text-gray-400 ${isRecalledWithContent ? 'cursor-pointer hover:text-gray-600 transition-colors' : ''}`}
                      onClick={() => isRecalledWithContent && setViewingRecalledMessage(msg)}
                    >
                      {msg.content}
                    </span>
                  </div>
                </div>
              )
            }
            
            // 导演小剧场HTML（第三人称场景描写）
            if ((msg as any).messageType === 'theatre_html' || (msg as any).type === 'theatre_html') {
              // 只渲染最后3条HTML，旧的HTML显示简化版
              if (!renderableHtmlIds.has(msg.id)) {
                return (
                  <div key={msg.id} className="flex justify-center my-2" data-message-id={msg.id}>
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      小剧场
                    </span>
                  </div>
                )
              }
              return (
                <div key={msg.id} className="flex justify-center my-4 px-4" data-message-id={msg.id}>
                  <SafeHtml className="w-full max-w-[310px]" html={msg.content} />
                </div>
              )
            }

            // 🗳️ 投票卡片
            if ((msg as any).messageType === 'poll' && (msg as any).poll) {
              const poll = (msg as any).poll
              const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.votes.length, 0)
              const userVoted = poll.options.find((opt: any) => opt.votes.includes('user'))
              const isCreator = poll.creatorId === 'user'
              
              return (
                <div key={msg.id} className="flex justify-center my-4 px-4" data-message-id={msg.id}>
                  <div className="w-full max-w-[320px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* 头部 */}
                    <div className="px-4 pt-4 pb-2 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f7f7f7] flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-[#07c160]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-gray-900 line-clamp-2 leading-snug">
                          {poll.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                          <span className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-gray-500 text-[10px] font-medium">
                            {poll.options.length}项
                          </span>
                          <span>{isCreator ? '你' : poll.creatorName}发起</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 选项 */}
                    <div className="px-4 pb-2 space-y-2">
                      {poll.options.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          暂无选项，点击下方添加
                        </div>
                      ) : poll.options.map((opt: any) => {
                        const voteCount = opt.votes.length
                        const votePercent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
                        const isSelected = opt.votes.includes('user')
                        
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              if (!userVoted && id) {
                                opt.votes.push('user')
                                
                                // 🔥 添加系统消息：XX投了XX（使用 silent 模式避免触发 storage 事件）
                                const userInfo = getUserInfo()
                                const userName = userInfo.nickname || userInfo.realName || '你'
                                groupChatManager.addMessage(id, {
                                  userId: 'system',
                                  userName: '系统',
                                  userAvatar: '',
                                  content: `${userName}投了「${opt.text}」`,
                                  type: 'system'
                                }, true)  // silent = true
                                
                                // 🔥 只调用一次 setMessages，避免重复渲染
                                const finalMsgs = groupChatManager.getMessages(id)
                                groupChatManager.replaceAllMessages(id, finalMsgs)
                                setMessages([...finalMsgs])
                              }
                            }}
                            disabled={!!userVoted}
                            className="w-full group relative"
                          >
                            <div className={`relative w-full min-h-[40px] rounded-lg overflow-hidden transition-all ${
                              isSelected 
                                ? 'bg-[#e7f7ee] ring-1 ring-[#07c160]' 
                                : 'bg-[#f7f7f7] group-hover:bg-[#f0f0f0]'
                            }`}>
                              {/* 进度条 - 始终显示 */}
                              {votePercent > 0 && (
                                <div 
                                  className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${
                                    isSelected ? 'bg-[#d1f2de]' : 'bg-[#eaeaea]'
                                  }`}
                                  style={{ width: `${votePercent}%` }}
                                />
                              )}
                              
                              {/* 内容 */}
                              <div className="relative flex items-center justify-between px-3 py-2.5">
                                <span className={`text-sm font-medium truncate mr-2 ${
                                  isSelected ? 'text-[#07c160]' : 'text-gray-700'
                                }`}>
                                  {opt.text}
                                  {opt.addedBy && (
                                    <span className="text-xs font-normal text-gray-400 ml-1">
                                      ({opt.addedBy})
                                    </span>
                                  )}
                                </span>
                                
                                {/* 始终显示票数 */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-[#07c160]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  <span className={`text-xs ${isSelected ? 'text-[#07c160]' : 'text-gray-500'}`}>
                                    {voteCount}票
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* 底部统计 */}
                    <div className="px-4 py-2.5 border-t border-gray-100 bg-[#fafafa] flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {totalVotes} 人参与
                      </span>
                      <span className="text-xs text-gray-400">
                        {userVoted ? '已投票' : '点击选项投票'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }

            const isSent = msg.userId === 'user'
            // 🔥 使用缓存的角色信息，避免每条消息都调用 characterService.getById
            const char = msg.userId !== 'user' ? characterCache.get(msg.userId) : null

            // 🔥 使用缓存的成员信息
            const memberDetail = memberDetailCache.get(msg.userId)

            let baseName: string
            if (msg.userId === 'user') {
              // 🔥 使用缓存的用户信息
              baseName = cachedUserInfo.nickname || cachedUserInfo.realName || '我'
            } else {
              // 🔥 优先使用消息中存储的名字（已处理过重名），避免重名角色混淆
              baseName = msg.userName || char?.nickname || char?.realName || '未知'
            }

            let roleLabel: string | undefined
            if (memberDetail?.role === 'owner') roleLabel = '群主'
            else if (memberDetail?.role === 'admin') roleLabel = '管理员'

            const titleLabel = memberDetail?.title
            const displayName = [baseName, roleLabel, titleLabel].filter(Boolean).join(' ')
            
            return (
              <div key={msg.id} data-message-id={msg.id} style={{ display: 'flow-root' }}>
                {/* 时间戳 */}
                {shouldShowTimestamp && msg.timestamp && (
                  <div className="flex justify-center my-3">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {new Date(msg.timestamp).toLocaleString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                
                <GroupMessageItem
                  message={msg}
                  isSent={isSent}
                  displayName={displayName}
                  onLongPressStart={handleLongPressStart}
                  onLongPressMove={handleLongPressMove}
                  onLongPressEnd={handleLongPressEnd}
                  onQuoteMessage={(msg) => {
                    setQuotedMessage(msg)
                    inputRef.current?.focus()
                  }}
                  onOpenRedPacket={handleOpenRedPacket}
                  onReceiveTransfer={handleReceiveTransfer}
                  onRejectTransfer={handleRejectTransfer}
                  renderMessageContent={renderMessageContent}
                  playingVoiceId={playingVoiceId}
                  showVoiceTextMap={showVoiceTextMap}
                  onPlayVoice={handlePlayVoice}
                  onToggleVoiceText={handleToggleVoiceText}
                />
              </div>
            )
          })
        )}
        {/* AI正在输入提示 - 与私聊样式一致 */}
        {isAiTyping && (
          <div className="flex items-start gap-2 my-2 message-enter message-enter-left">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {groupAvatar ? (
                  <img src={groupAvatar} alt="群头像" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">👥</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <div className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm typing-indicator">
                <div className="flex gap-1">
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 虚拟列表底部占位 */}
        {virtualStyle.paddingBottom > 0 && (
          <div style={{ height: virtualStyle.paddingBottom }} />
        )}
      </div>

      {/* 底部输入栏 */}
      <>
        <MentionList
          show={showMentionList}
          members={getFilteredMembers()}
          onSelect={handleSelectMention}
        />
        
        <GroupInputBar
          inputText={inputText}
          isAiTyping={isAiTyping}
          quotedMessage={quotedMessage}
          customIcons={customIcons}
          chatDecorations={chatDecorations}
          inputRef={inputRef}
          onInputChange={handleInputChange}
          onSend={handleSend}
          onAIReply={handleAIReply}
          onCancelQuote={() => setQuotedMessage(null)}
          onOpenAddMenu={() => setShowAddMenu(true)}
          onOpenEmojiPanel={() => emojiPickerRef.current?.open()}
        />
      </>

      {/* 消息菜单 */}
      <MessageMenu
        isOpen={showMessageMenu}
        message={menuMessage ? {
          ...menuMessage,
          id: parseInt(menuMessage.id.replace(/[^0-9]/g, '')) || Date.now(),
          type: menuMessage.userId === 'user' ? 'sent' : 'received',
          timestamp: menuMessage.timestamp || Date.now()
        } as any : null}
        menuPosition={menuPosition}
        onClose={closeMessageMenu}
        onCopy={handleCopyMessage}
        onDelete={handleDeleteMessage}
        onRecall={handleRecallMessage}
        onQuote={() => handleQuoteMessage(inputRef)}
        onEdit={() => {
          alert('群聊暂不支持编辑消息')
          closeMessageMenu()
        }}
        onBatchDelete={() => {
          alert('群聊暂不支持批量删除')
          closeMessageMenu()
        }}
      />

      {/* 表情包面板 */}
      <EmojiPicker ref={emojiPickerRef} onSelect={handleSelectEmoji} />

      {/* 添加菜单 */}
      <GroupAddMenu
        isOpen={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        onSelectRecall={handleRegenerate}
        onSelectImage={() => handleImageSelect()}
        onSelectCamera={() => handleCameraSelect()}
        onSelectTransfer={() => handleTransferStart()}
        onSelectLocation={() => handleLocationSelect()}
        onSelectVoice={() => handleVoiceSelect()}
        onSelectRedPacket={() => setShowRedPacketSender(true)}
        onSelectPoll={() => setShowPollCreator(true)}
        customIcons={customIcons}
      />

      {/* 转账发送界面 */}
      <TransferSender
        show={showTransferSender}
        onClose={cancelTransfer}
        onSend={handleSendTransfer}
        characterName={selectedTransferMember?.name}
      />

      {/* 图片描述输入 */}
      <PhotoDescriptionInput
        show={showPhotoInput}
        onClose={() => setShowPhotoInput(false)}
        onConfirm={handleConfirmPhoto}
        title="选择图片"
        placeholder="请描述这张照片"
        defaultValue="一张图片"
      />

      {/* 拍照描述输入 */}
      <PhotoDescriptionInput
        show={showCameraInput}
        onClose={() => setShowCameraInput(false)}
        onConfirm={handleConfirmCamera}
        title="📷 拍照"
        placeholder="拍照内容描述"
        defaultValue="一张拍摄的照片"
      />

      {/* 位置输入 */}
      <LocationInput
        show={showLocationInput}
        onClose={() => setShowLocationInput(false)}
        onConfirm={handleConfirmLocation}
      />

      {/* 语音输入 */}
      <VoiceInput
        show={showVoiceInput}
        onClose={() => setShowVoiceInput(false)}
        onConfirm={handleConfirmVoice}
      />

      {/* 红包发送界面 */}
      <RedPacketSender
        show={showRedPacketSender}
        onClose={() => setShowRedPacketSender(false)}
        onSend={handleSendRedPacket}
        maxCount={currentGroup?.memberIds.length}
      />

      {/* 投票创建器 */}
      {showPollCreator && (
        <PollCreator
          onClose={() => setShowPollCreator(false)}
          onSubmit={(title: string, options: string[]) => {
            if (id) {
              const userInfo = getUserInfo()
              groupChatManager.addMessage(id, {
                userId: 'user',
                userName: userInfo.nickname || userInfo.realName || '我',
                userAvatar: getMemberAvatar('user'),
                content: title,
                type: 'text',
                messageType: 'poll',
                poll: {
                  title,
                  options: options.map((opt, idx) => ({ id: idx + 1, text: opt, votes: [] })),
                  createdAt: Date.now(),
                  creatorId: 'user',
                  creatorName: userInfo.nickname || userInfo.realName || '我'
                }
              } as any)
              
              const updatedMsgs = groupChatManager.getMessages(id)
              setMessages(updatedMsgs)
              setShowPollCreator(false)
              setTimeout(scrollToBottom, 100)
            }
          }}
        />
      )}

      {/* 拆红包弹窗 */}
      {openRedPacketId && (() => {
        const msg = messages.find(m => m.id === openRedPacketId.toString() || m.id === `msg_${openRedPacketId}`)
        if (!msg || !msg.redPacket) return null
        
        return (
          <RedPacketOpenModal
            show={true}
            onClose={closeRedPacketModal}
            onOpen={handleConfirmOpenRedPacket}
            senderName={msg.userName}
            senderAvatar={msg.userAvatar || getMemberAvatar(msg.userId)}
            blessing={msg.redPacket.blessing}
          />
        )
      })()}

      {/* 红包详情弹窗 */}
      {showRedPacketDetail && detailRedPacketId && (() => {
        const msg = messages.find(m => m.id === detailRedPacketId)
        if (!msg || !msg.redPacket) return null
        
        return (
          <RedPacketDetailModal
            isOpen={true}
            onClose={closeRedPacketDetail}
            blessing={msg.redPacket.blessing}
            senderName={msg.userName}
            senderAvatar={msg.userAvatar || getMemberAvatar(msg.userId)}
            totalAmount={msg.redPacket.totalAmount}
            count={msg.redPacket.count}
            received={msg.redPacket.received}
            remaining={msg.redPacket.remaining}
            remainingCount={msg.redPacket.remainingCount}
            currentUserId="user"
          />
        )
      })()}

      {/* 成员选择模态框（用于转账） */}
      {showMemberSelect && currentGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMemberSelect(false)}>
          <div 
            className="rounded-2xl w-full max-w-[320px] max-h-[80vh] flex flex-col overflow-hidden shadow-xl" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: '#ffffff', 
              background: '#ffffff',
              opacity: 1,
              isolation: 'isolate',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              zIndex: 51
            }}
          >
            <div className="p-4 border-b border-gray-100 text-center">
              <h3 className="text-base font-medium text-gray-900">选择转账对象</h3>
            </div>
            
            <div className="overflow-y-auto p-2">
              {currentGroup.memberIds
                .filter(memberId => memberId !== 'user')
                .map(memberId => {
                  const member = currentGroup.members?.find(m => m.id === memberId)
                  const char = characterService.getById(memberId)
                  const memberName = char?.nickname || char?.realName || 'AI成员'
                  const avatar = getMemberAvatar(memberId)
                  
                  return (
                    <button
                      key={memberId}
                      onClick={() => handleSelectTransferMember(memberId, memberName)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                        {avatar ? (
                          <img src={avatar} alt={memberName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            AI
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-gray-900 truncate">{memberName}</div>
                        {member?.title && (
                          <div className="text-xs text-gray-500 truncate">{member.title}</div>
                        )}
                      </div>
                    </button>
                  )
                })}
            </div>
            
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={() => setShowMemberSelect(false)}
                className="w-full py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 查看撤回消息弹窗 */}
      {viewingRecalledMessage && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setViewingRecalledMessage(null)}
        >
          <div 
            className="bg-white rounded-2xl w-[85%] max-w-sm overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-base font-medium text-gray-900 text-center">撤回的消息</h3>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-500 mb-2">
                {(viewingRecalledMessage as any).recalledBy || viewingRecalledMessage.userName || '未知'} 撤回了：
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 break-words">
                {(() => {
                  const recalledContent = (viewingRecalledMessage as any).recalledContent
                  // 检查是否有有效的原始内容
                  if (!recalledContent || 
                      recalledContent === '撤回了一条消息' || 
                      recalledContent === viewingRecalledMessage.content) {
                    return '原始内容不可用'
                  }
                  return recalledContent
                })()}
              </div>
              {(viewingRecalledMessage as any).recallReason && (
                <div className="mt-2 text-xs text-gray-400">
                  理由：{(viewingRecalledMessage as any).recallReason}
                </div>
              )}
            </div>
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={() => setViewingRecalledMessage(null)}
                className="w-full py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupChatDetail
