/**
 * 群聊详情页面
 */

import { useNavigate, useParams } from 'react-router-dom'
import React, { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import StatusBar from '../components/StatusBar'
import Avatar from '../components/Avatar'
import { generateGroupChatReply, type GroupMember } from '../utils/groupChatApi'
import { generateGroupChatSummary } from '../utils/groupChatSummary'
import { groupChatManager, type GroupMessage } from '../utils/groupChatManager'
import { characterService } from '../services/characterService'
import EmojiPanel from '../components/EmojiPanel'
import type { Emoji } from '../utils/emojiStorage'
import { getEmojis } from '../utils/emojiStorage'
import { getUserInfo } from '../utils/userUtils'
import { useChatBubbles } from '../hooks/useChatBubbles'
import GroupAddMenu from '../components/GroupAddMenu'
import { getAllUIIcons } from '../utils/iconStorage'
import { SpecialMessageRenderer } from './ChatDetail/components/SpecialMessageRenderer'
import MessageMenu from '../components/MessageMenu'
import TransferSender from '../components/TransferSender'
import PhotoDescriptionInput from '../components/PhotoDescriptionInput'
import LocationInput from '../components/LocationInput'
import VoiceInput from '../components/VoiceInput'
import RedPacketSender from '../components/RedPacketSender'
import RedPacketOpenModal from '../components/RedPacketOpenModal'
import RedPacketDetailModal from '../components/RedPacketDetailModal'

// 获取成员头像
const getMemberAvatar = (userId: string): string => {
  if (userId === 'user') return ''
  const char = characterService.getById(userId)
  return char?.avatar || ''
}

// ... (rest of the code remains the same)

const GroupChatDetail = () => {
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
  const [quotedMessage, setQuotedMessage] = useState<GroupMessage | null>(null)
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showMemberSelect, setShowMemberSelect] = useState(false)
  const [showTransferSender, setShowTransferSender] = useState(false)
  const [selectedTransferMember, setSelectedTransferMember] = useState<{ id: string, name: string } | null>(null)
  const [showPhotoInput, setShowPhotoInput] = useState(false)
  const [showCameraInput, setShowCameraInput] = useState(false)
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [showRedPacketSender, setShowRedPacketSender] = useState(false)
  const [openRedPacketId, setOpenRedPacketId] = useState<number | null>(null)
  const [showRedPacketDetail, setShowRedPacketDetail] = useState(false)
  const [detailRedPacketId, setDetailRedPacketId] = useState<string | null>(null)
  const [showMessageMenu, setShowMessageMenu] = useState(false)
  const [menuMessage, setMenuMessage] = useState<GroupMessage | null>(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  
  // 🎨 装饰图片状态（与私聊同步）
  const [chatDecorations, setChatDecorations] = useState({
    topBar: localStorage.getItem('chat_top_bar_image'),
    bottomBar: localStorage.getItem('chat_bottom_bar_image'),
    plusButton: localStorage.getItem('chat_plus_button_image'),
    emojiButton: localStorage.getItem('chat_emoji_button_image'),
    sendButtonNormal: localStorage.getItem('chat_send_button_normal_image'),
    sendButtonActive: localStorage.getItem('chat_send_button_active_image')
  })
  
  // 🎨 自定义UI图标（与私聊同步）
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const longPressTimer = useRef<number | null>(null)
  const isAIReplying = useRef(false)  // 标志位：AI是否正在回复中

  // 🎨 气泡样式
  useChatBubbles(id)

  // 🎨 监听装饰更新（与私聊同步）
  useEffect(() => {
    const handleDecorationUpdate = () => {
      setChatDecorations({
        topBar: localStorage.getItem('chat_top_bar_image'),
        bottomBar: localStorage.getItem('chat_bottom_bar_image'),
        plusButton: localStorage.getItem('chat_plus_button_image'),
        emojiButton: localStorage.getItem('chat_emoji_button_image'),
        sendButtonNormal: localStorage.getItem('chat_send_button_normal_image'),
        sendButtonActive: localStorage.getItem('chat_send_button_active_image')
      })
    }
    window.addEventListener('decoration-updated', handleDecorationUpdate)
    return () => window.removeEventListener('decoration-updated', handleDecorationUpdate)
  }, [])

  // 🎨 加载自定义UI图标（与私聊同步）
  useEffect(() => {
    const loadCustomIcons = async () => {
      try {
        let icons = await getAllUIIcons()
        if (Object.keys(icons).length === 0) {
          try {
            const saved = localStorage.getItem('ui_custom_icons')
            if (saved) {
              icons = JSON.parse(saved)
            }
          } catch (err) {
            console.error('从localStorage恢复图标失败:', err)
          }
        }
        setCustomIcons(icons)
        console.log('✅ GroupChatDetail加载自定义图标:', Object.keys(icons).length, '个')
      } catch (error) {
        console.error('❌ 加载自定义图标失败:', error)
      }
    }
    
    loadCustomIcons()
    
    const handleIconsChange = () => {
      loadCustomIcons()
    }
    window.addEventListener('ui-icons-changed', handleIconsChange)
    return () => window.removeEventListener('ui-icons-changed', handleIconsChange)
  }, [])

  useEffect(() => {
    if (!id) return
    
    // 加载群聊信息
    const group = groupChatManager.getGroup(id)
    if (group) {
      setGroupName(group.name)
      setGroupAvatar(group.avatar || '')
    }
    
    // 🔥 异步加载消息（等待IndexedDB加载完成）
    const loadMessages = async () => {
      // 先尝试同步获取（可能返回缓存或空数组）
      const msgs = groupChatManager.getMessages(id)
      setMessages(msgs)
      
      // 等待100ms让异步加载完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 再次获取（此时应该已经从IndexedDB加载完成）
      const updatedMsgs = groupChatManager.getMessages(id)
      if (updatedMsgs.length > 0 || msgs.length === 0) {
        setMessages(updatedMsgs)
        scrollToBottom()
      }
    }
    
    loadMessages()
    
    // 监听storage事件以更新消息
    const handleStorageChange = () => {
      // 🔥 AI回复期间不响应storage事件，避免消息一次性显示
      if (isAIReplying.current) {
        console.log('🚫 [storage事件] AI回复中，忽略storage事件')
        return
      }
      const updatedMsgs = groupChatManager.getMessages(id)
      setMessages(updatedMsgs)
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

  // 长按开始
  const handleLongPressStart = (msg: GroupMessage, event?: React.MouseEvent | React.TouchEvent) => {
    longPressTimer.current = window.setTimeout(() => {
      // 获取点击位置
      let x = 0, y = 0
      if (event) {
        if ('touches' in event && event.touches[0]) {
          x = event.touches[0].clientX
          y = event.touches[0].clientY
        } else if ('clientX' in event) {
          x = event.clientX
          y = event.clientY
        }
      }
      
      setMenuMessage(msg)
      setMenuPosition({ x, y })
      setShowMessageMenu(true)
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // 撤回消息
  const handleRecallMessage = () => {
    if (!menuMessage || !id) return
    
    // 检查是否可以撤回
    const canRecall = !menuMessage.transfer && 
                     (!menuMessage.messageType ||
                     menuMessage.messageType === 'text' ||
                     menuMessage.messageType === 'voice' ||
                     menuMessage.messageType === 'photo' ||
                     menuMessage.messageType === 'location')
    
    if (!canRecall) {
      alert('转账等特殊消息不支持撤回')
      return
    }
    
    groupChatManager.recallMessage(id, menuMessage.id)
    setShowMessageMenu(false)
    setMenuMessage(null)
  }

  // 删除消息
  const handleDeleteMessage = () => {
    if (!menuMessage || !id) return
    
    const confirmed = window.confirm('确定要永久删除这条消息吗？删除后无法恢复。')
    if (!confirmed) return
    
    console.log('🗑️ 永久删除群聊消息:', menuMessage.id)
    
    const currentMessages = groupChatManager.getMessages(id)
    const updatedMessages = currentMessages.filter(m => m.id !== menuMessage.id)
    groupChatManager.replaceAllMessages(id, updatedMessages)
    
    setShowMessageMenu(false)
    setMenuMessage(null)
    console.log('✅ 消息已永久删除')
  }

  // 复制消息
  const handleCopyMessage = () => {
    if (!menuMessage) return
    navigator.clipboard.writeText(menuMessage.content)
    alert('已复制到剪贴板')
    setShowMessageMenu(false)
  }

  // 引用消息
  const handleQuoteMessage = () => {
    if (!menuMessage) return
    setQuotedMessage(menuMessage)
    setShowMessageMenu(false)
    inputRef.current?.focus()
  }

  // 发送表情包
  const handleSelectEmoji = (emoji: Emoji) => {
    if (!id) return

    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: '我',
      userAvatar: getMemberAvatar('user'),
      content: emoji.description,
      type: 'emoji',
      timestamp: Date.now(),
      emojiUrl: emoji.url,
      emojiDescription: emoji.description
    })

    // 🔥 不再手动刷新消息列表，让storage事件处理，避免重复渲染
    // const updatedMsgs = groupChatManager.getMessages(id)
    // setMessages(updatedMsgs)
    
    setTimeout(scrollToBottom, 100)
  }

  // ===== 新消息类型处理函数 =====

  // 处理图片选择
  const handleImageSelect = () => {
    setShowPhotoInput(true)
  }

  // 确认发送图片
  const handleConfirmPhoto = (description: string) => {
    if (!id) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: userInfo.realName,
      userAvatar: '',
      content: `[图片: ${description}]`,
      type: 'image',
      messageType: 'photo',
      photoDescription: description
    })
    setShowPhotoInput(false)
    setTimeout(scrollToBottom, 100)
  }

  // 处理拍照
  const handleCameraSelect = () => {
    setShowCameraInput(true)
  }

  // 确认发送拍照
  const handleConfirmCamera = (description: string) => {
    if (!id) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: userInfo.realName,
      userAvatar: '',
      content: `[拍照: ${description}]`,
      type: 'image',
      messageType: 'photo',
      photoDescription: description
    })
    setShowCameraInput(false)
    setTimeout(scrollToBottom, 100)
  }

  // 处理转账开始 - 先选择成员
  const handleTransferStart = () => {
    setShowMemberSelect(true)
  }

  // 处理选择转账对象
  const handleSelectTransferMember = (toUserId: string, toUserName: string) => {
    setSelectedTransferMember({ id: toUserId, name: toUserName })
    setShowMemberSelect(false)
    setShowTransferSender(true)
  }

  // 处理发送转账
  const handleSendTransfer = (amount: number, message: string) => {
    if (!id || !selectedTransferMember) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: userInfo.realName,
      userAvatar: '',
      content: `[转账] 给${selectedTransferMember.name}转账¥${amount}`,
      type: 'text',
      messageType: 'transfer',
      transfer: {
        amount: amount,
        message: message,
        toUserId: selectedTransferMember.id,
        toUserName: selectedTransferMember.name,
        status: 'pending'
      }
    })
    
    setShowTransferSender(false)
    setSelectedTransferMember(null)
    setTimeout(scrollToBottom, 100)
  }

  // 处理位置选择
  const handleLocationSelect = () => {
    setShowLocationInput(true)
  }

  // 确认发送位置
  const handleConfirmLocation = (name: string, address: string) => {
    if (!id) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: userInfo.realName,
      userAvatar: '',
      content: `[位置] ${name}`,
      type: 'text',
      messageType: 'location',
      location: {
        name: name,
        address: address
      }
    })
    setShowLocationInput(false)
    setTimeout(scrollToBottom, 100)
  }

  // 处理语音选择
  const handleVoiceSelect = () => {
    setShowVoiceInput(true)
  }

  // 确认发送语音
  const handleConfirmVoice = (voiceText: string) => {
    if (!id) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: userInfo.realName,
      userAvatar: '',
      content: voiceText,
      type: 'voice',
      messageType: 'voice',
      voiceText: voiceText,
      duration: Math.ceil(voiceText.length / 5) // 模拟时长
    })
    setShowVoiceInput(false)
    setTimeout(scrollToBottom, 100)
  }

  // 发送红包
  const handleSendRedPacket = (totalAmount: number, count: number, blessing: string) => {
    if (!id) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: userInfo.realName,
      userAvatar: '',
      content: `[红包] ${blessing}`,
      type: 'text',
      messageType: 'redPacket',
      redPacket: {
        totalAmount,
        count,
        blessing,
        received: [],
        remaining: totalAmount,
        remainingCount: count
      }
    } as any)
    
    setShowRedPacketSender(false)
    setTimeout(scrollToBottom, 100)
  }

  // 打开红包（抢红包） - 显示拆红包弹窗
  const handleOpenRedPacket = (messageId: number) => {
    if (!id) return
    
    const messages = groupChatManager.getMessages(id)
    const redPacketMsg = messages.find(m => m.id === messageId.toString() || m.id === `msg_${messageId}`)
    
    if (!redPacketMsg || !redPacketMsg.redPacket) return
    
    // 检查是否已领取
    const hasReceived = redPacketMsg.redPacket.received.some(r => r.userId === 'user')
    
    if (hasReceived) {
      // 已领取，显示详情页
      setDetailRedPacketId(redPacketMsg.id)
      setShowRedPacketDetail(true)
      return
    }

    // 检查是否已抢完
    if (redPacketMsg.redPacket.remainingCount <= 0 || redPacketMsg.redPacket.remaining <= 0) {
      // 已抢完，显示详情页
      setDetailRedPacketId(redPacketMsg.id)
      setShowRedPacketDetail(true)
      return
    }

    // 打开拆红包弹窗
    setOpenRedPacketId(messageId)
  }

  // 确认拆开红包
  const handleConfirmOpenRedPacket = () => {
    if (!id || !openRedPacketId) return

    const messageId = openRedPacketId
    const messages = groupChatManager.getMessages(id)
    const redPacketMsg = messages.find(m => m.id === messageId.toString() || m.id === `msg_${messageId}`)
    
    if (!redPacketMsg || !redPacketMsg.redPacket) {
      setOpenRedPacketId(null)
      return
    }
    
    const { redPacket } = redPacketMsg
    
    // 计算领取金额（简单的二倍均值算法）
    let amount = 0
    if (redPacket.remainingCount === 1) {
      amount = Math.round(redPacket.remaining * 100) / 100
    } else {
      const max = (redPacket.remaining / redPacket.remainingCount) * 2
      amount = Math.round(Math.random() * max * 100) / 100
      if (amount < 0.01) amount = 0.01
    }
    
    // 更新红包状态
    const userInfo = getUserInfo()
    const updatedRedPacket = {
      ...redPacket,
      remaining: Math.round((redPacket.remaining - amount) * 100) / 100,
      remainingCount: redPacket.remainingCount - 1,
      received: [
        ...redPacket.received,
        {
          userId: 'user',
          userName: userInfo.nickname || userInfo.realName,
          userAvatar: getMemberAvatar('user'),
          amount,
          timestamp: Date.now()
        }
      ]
    }
    
    const updatedMessages = messages.map(msg => 
      msg.id === redPacketMsg.id
        ? { ...msg, redPacket: updatedRedPacket }
        : msg
    )
    
    // 添加系统提示
    const systemMsg = groupChatManager.addMessage(id, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content: `你领取了${redPacketMsg.userName}的红包`,
      type: 'system'
    })
    updatedMessages.push(systemMsg)
    
    // 保存更新
    groupChatManager.replaceAllMessages(id, updatedMessages)
    
    // 立即刷新UI
    flushSync(() => {
      setMessages([...updatedMessages])
    })
    
    // 关闭拆红包弹窗，打开详情页
    setOpenRedPacketId(null)
    setTimeout(() => {
      setDetailRedPacketId(redPacketMsg.id)
      setShowRedPacketDetail(true)
    }, 300)
  }

  // AI主动回复（用户不发消息，只触发AI聊天）
  const handleAIReply = async () => {
    if (!id || isAiTyping) return
    
    setIsAiTyping(true)
    isAIReplying.current = true  // 🔥 设置AI回复标志
    console.log('🔒 [AI回复] 已设置isAIReplying标志，storage事件将被忽略')
    try {
      // 获取群聊信息
      const group = groupChatManager.getGroup(id)
      if (!group) return
      
      // 🔥 先从 groupChatManager 重新读取最新消息
      let latestMessages = groupChatManager.getMessages(id)
      
      // 🔥 不再删除上一轮的AI回复，直接接着聊
      console.log(`📝 [AI回复] 接着当前对话继续，消息数: ${latestMessages.length}`)
      
      // 构建成员列表（包含角色和头衔）
      const members: GroupMember[] = group.memberIds.map(memberId => {
        const memberDetail = group.members?.find(m => m.id === memberId)
        
        if (memberId === 'user') {
          const userInfo = getUserInfo()
          return {
            id: 'user',
            name: userInfo.nickname || userInfo.realName,
            description: '',
            type: 'user',
            role: memberDetail?.role,
            title: memberDetail?.title
          }
        }
        const char = characterService.getById(memberId)
        return {
          id: memberId,
          name: char?.realName || char?.nickname || '未知',
          description: char?.personality || '',
          type: 'character',
          role: memberDetail?.role,
          title: memberDetail?.title
        }
      })
      
      // 构建消息历史（使用最新的消息列表）
      const chatMessages = latestMessages.map(msg => {
        // 如果是表情包消息，标注出来
        if (msg.type === 'emoji' || msg.emojiDescription || msg.emojiUrl) {
          const description = msg.emojiDescription || msg.content || '表情包'
          console.log(`📦 检测到表情包消息: ${msg.userName} - ${description} (type=${msg.type})`)
          return {
            userId: msg.userId,
            userName: msg.userName,
            content: `[发送了表情包：${description}]`,
            id: msg.id  // 包含消息ID用于引用
          }
        }
        return {
          userId: msg.userId,
          userName: msg.userName,
          content: msg.content,
          id: msg.id  // 包含消息ID用于引用
        }
      })
      
      console.log(`📝 传给AI的消息历史 (${chatMessages.length}条):`)
      chatMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg.userName}: ${msg.content}`)
      })
      
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
        const minReplyCount = group.minReplyCount || 10
        script = await generateGroupChatReply(
          id,  // 群聊ID
          group.name,
          members,
          chatMessages,
          triggerEvent,
          emojis,
          group.announcement,
          parsedOldSummary || undefined,
          minReplyCount,
          group.lorebookId  // 传递世界书ID
        )
      } else {
        // 🎬 无总结：正常生成剧本
        console.log('🎬 [正常模式] 生成剧本')
        const minReplyCount = group.minReplyCount || 10
        script = await generateGroupChatReply(
          id,  // 群聊ID
          group.name,
          members,
          chatMessages,
          triggerEvent,
          emojis,
          group.announcement,
          undefined,  // 不使用总结
          minReplyCount,
          group.lorebookId  // 传递世界书ID
        )
      }
      
      if (!script) {
        console.error('生成群聊回复失败')
        return
      }
      
      // 🔥 维护一个本地消息数组，用于逐条显示
      const currentMessages = [...latestMessages]
      
      // 逐条添加AI回复（第一条立即显示，后续间隔1.5秒）
      console.log(`🎬 [AI回复] 开始添加${script.actions.length}条消息，延迟显示`)
      
      for (let i = 0; i < script.actions.length; i++) {
        const action = script.actions[i]
        
        // 第一条消息立即显示，后续消息延迟1.5秒
        if (i > 0) {
          console.log(`⏰ [AI回复] 等待1.5秒后显示第${i + 1}条消息...`)
          await new Promise(resolve => setTimeout(resolve, 1500))
          console.log(`✅ [AI回复] 延迟结束，现在显示第${i + 1}条消息`)
        } else {
          console.log(`⚡ [AI回复] 立即显示第1条消息`)
        }
        
        // 查找成员
        const member = members.find(m => m.name === action.actorName && m.type === 'character')
        if (!member) {
          console.warn('找不到成员:', action.actorName)
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
          groupChatManager.recallMessage(id, targetMsgId)
          
          // 从内容中移除指令部分
          content = content.replace(/\[撤回:msg_\w+\]/, '').trim()
          hasCommand = true
        }
        
        // 检查踢出指令：[踢出:成员名]
        const kickMatch = content.match(/\[踢出:(.+?)\]/)
        if (kickMatch) {
          const targetName = kickMatch[1]
          console.log(`👢 [AI指令] ${member.name} 踢出成员: ${targetName}`)
          
          // 查找目标成员
          const targetMember = members.find(m => m.name === targetName)
          if (targetMember && targetMember.type === 'character') {
            groupChatManager.removeMember(id, targetMember.id, true, member.name)
          } else {
            console.warn('找不到目标成员或无法踢出:', targetName)
          }
          
          // 从内容中移除指令部分
          content = content.replace(/\[踢出:.+?\]/, '').trim()
          hasCommand = true
        }
        
        // 检查群公告指令：[群公告:内容]
        const announcementMatch = content.match(/\[群公告:(.+?)\]/)
        if (announcementMatch) {
          const newAnnouncement = announcementMatch[1]
          console.log(`📢 [AI指令] ${member.name} 修改群公告: ${newAnnouncement}`)
          groupChatManager.updateAnnouncement(id, newAnnouncement, member.name)
          
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
            groupChatManager.setTitle(id, targetMember.id, newTitle, member.name)
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
          
          // 查找该成员待接收的转账
          const pendingTransfer = currentMessages.find(msg => 
            (msg as any).messageType === 'transfer' &&
            (msg as any).transfer?.toUserId === member.id &&
            (msg as any).transfer?.status === 'pending' &&
            msg.userId === 'user'
          )
          
          if (pendingTransfer) {
            const transferAmount = (pendingTransfer as any).transfer?.amount || 0
            
            // 更新转账状态为已接收
            const updatedMessages = currentMessages.map(msg => 
              msg.id === pendingTransfer.id
                ? { ...msg, transfer: { ...(msg as any).transfer, status: 'received' } }
                : msg
            )
            
            // 添加系统提示消息
            const systemMsg = groupChatManager.addMessage(id, {
              userId: 'system',
              userName: '系统',
              userAvatar: '',
              content: `${member.name}已收款¥${transferAmount}`,
              type: 'system'
            })
            updatedMessages.push(systemMsg)
            
            // 更新数据库和本地数组
            groupChatManager.replaceAllMessages(id, updatedMessages as any)
            currentMessages.length = 0
            currentMessages.push(...updatedMessages)
            
            // 立即刷新UI
            flushSync(() => {
              setMessages([...currentMessages])
            })
            
            console.log(`✅ [转账] ${member.name} 已接收转账`)
          }
          
          // 从内容中移除指令部分
          content = content.replace(/\[接收转账\]/, '').trim()
          hasCommand = true
        }

        // 检查退还转账指令：[退还]
        if (content.includes('[退还]')) {
          console.log(`💸 [AI指令] ${member.name} 退还转账`)
          
          // 查找该成员待接收的转账
          const pendingTransfer = currentMessages.find(msg => 
            (msg as any).messageType === 'transfer' &&
            (msg as any).transfer?.toUserId === member.id &&
            (msg as any).transfer?.status === 'pending' &&
            msg.userId === 'user'
          )
          
          if (pendingTransfer) {
            const transferAmount = (pendingTransfer as any).transfer?.amount || 0
            
            // 更新转账状态为已过期（退还）
            const updatedMessages = currentMessages.map(msg => 
              msg.id === pendingTransfer.id
                ? { ...msg, transfer: { ...(msg as any).transfer, status: 'expired' } }
                : msg
            )
            
            // 添加系统提示消息
            const systemMsg = groupChatManager.addMessage(id, {
              userId: 'system',
              userName: '系统',
              userAvatar: '',
              content: `${member.name}已退还转账¥${transferAmount}`,
              type: 'system'
            })
            updatedMessages.push(systemMsg)
            
            // 更新数据库和本地数组
            groupChatManager.replaceAllMessages(id, updatedMessages as any)
            currentMessages.length = 0
            currentMessages.push(...updatedMessages)
            
            // 立即刷新UI
            flushSync(() => {
              setMessages([...currentMessages])
            })
            
            console.log(`✅ [转账] ${member.name} 已退还转账`)
          }
          
          // 从内容中移除指令部分
          content = content.replace(/\[退还\]/, '').trim()
          hasCommand = true
        }

        // 检查领取红包指令：[领取红包]
        if (content.includes('[领取红包]')) {
          console.log(`🧧 [AI指令] ${member.name} 领取红包`)
          
          // 查找可领取的红包（用户发的，还有剩余，且该成员未领取过）
          const availableRedPacket = currentMessages.find(msg => 
            (msg as any).messageType === 'redPacket' &&
            (msg as any).redPacket?.remainingCount > 0 &&
            msg.userId === 'user' &&
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
            
            // 更新红包状态
            const updatedRedPacket = {
              ...redPacket,
              remaining: Math.round((redPacket.remaining - amount) * 100) / 100,
              remainingCount: redPacket.remainingCount - 1,
              received: [
                ...redPacket.received,
                {
                  userId: member.id,
                  userName: member.name,
                  userAvatar: getMemberAvatar(member.id),
                  amount,
                  timestamp: Date.now()
                }
              ]
            }
            
            const updatedMessages = currentMessages.map(msg => 
              msg.id === availableRedPacket.id
                ? { ...msg, redPacket: updatedRedPacket }
                : msg
            )
            
            // 添加系统提示消息
            const systemMsg = groupChatManager.addMessage(id, {
              userId: 'system',
              userName: '系统',
              userAvatar: '',
              content: `${member.name}领取了你的红包`,
              type: 'system'
            })
            updatedMessages.push(systemMsg)
            
            // 更新数据库和本地数组
            groupChatManager.replaceAllMessages(id, updatedMessages as any)
            currentMessages.length = 0
            currentMessages.push(...updatedMessages)
            
            // 立即刷新UI
            flushSync(() => {
              setMessages([...currentMessages])
            })
            
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
          
          // 查找接收者
          const receiver = members.find(m => m.name === toName)
          if (receiver) {
            groupChatManager.addMessage(id, {
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
          }
          
          content = content.replace(/\[转账:[^:]+:\d+(?:\.\d+)?:.+?\]/, '').trim()
          hasCommand = true
          if (!content) continue
        }

        // 检查语音指令：[语音:文字内容]
        const voiceMatch = content.match(/\[语音:(.+?)\]/)
        if (voiceMatch) {
          const voiceText = voiceMatch[1].trim()
          console.log(`🎤 [AI指令] ${member.name} 发送语音: ${voiceText}`)
          
          groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: voiceText,
            type: 'voice',
            messageType: 'voice',
            voiceText: voiceText,
            duration: Math.ceil(voiceText.length / 5)
          } as any)
          
          content = content.replace(/\[语音:.+?\]/, '').trim()
          hasCommand = true
          if (!content) continue
        }

        // 检查图片指令：[图片:描述]
        const photoMatch = content.match(/\[图片:(.+?)\]/)
        if (photoMatch) {
          const description = photoMatch[1].trim()
          console.log(`📷 [AI指令] ${member.name} 发送图片: ${description}`)
          
          groupChatManager.addMessage(id, {
            userId: member.id,
            userName: member.name,
            userAvatar: getMemberAvatar(member.id),
            content: `[图片: ${description}]`,
            type: 'image',
            messageType: 'photo',
            photoDescription: description
          } as any)
          
          content = content.replace(/\[图片:.+?\]/, '').trim()
          hasCommand = true
          if (!content) continue
        }

        // 检查位置指令：[位置:地点名称]
        const locationMatch = content.match(/\[位置:(.+?)\]/)
        if (locationMatch) {
          const locationName = locationMatch[1].trim()
          console.log(`📍 [AI指令] ${member.name} 分享位置: ${locationName}`)
          
          groupChatManager.addMessage(id, {
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
          
          content = content.replace(/\[位置:.+?\]/, '').trim()
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
        
        // 🔥 追加到本地数组并立即更新UI
        currentMessages.push(newMessage)
        console.log(`📨 [AI回复] 第${i + 1}条消息已添加到UI: ${action.actorName} - ${action.content?.substring(0, 20)}`)
        console.log(`📊 [AI回复] 当前UI显示消息总数: ${currentMessages.length}`)
        
        // 使用flushSync强制同步渲染
        flushSync(() => {
          setMessages([...currentMessages])
        })
        
        // 滚动到底部
        scrollToBottom()
      }
      
      // 🔥 AI回复完成后，后台生成/更新总结（如果开启了智能总结）
      if (smartSummaryEnabled) {
        const currentMessages = groupChatManager.getMessages(id)
        // 统计用户发的消息数量（按轮数计算）
        const userMessageCount = currentMessages.filter(m => m.userId === 'user').length
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
          ).then(newSummary => {
            if (newSummary && id) {
              console.log('📊 [后台任务] 总结生成成功，保存到群聊数据')
              const updatedGroup = groupChatManager.getGroup(id)
              groupChatManager.updateGroup(id, {
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
      setIsAiTyping(false)
      isAIReplying.current = false  // 🔥 清除AI回复标志
      console.log('🔓 [AI回复] 已清除isAIReplying标志，storage事件恢复响应')
    }
  }

  const handleSend = async () => {
    if (!inputText.trim() || !id || isAiTyping) return
    
    const userMessage = inputText
    console.log('📤 [发送消息] 仅发送用户消息，不触发AI回复')
    
    // 发送消息（带引用）
    groupChatManager.addMessage(id, {
      userId: 'user',
      userName: '我',
      userAvatar: getMemberAvatar('user'),
      content: userMessage,
      type: 'text',
      timestamp: Date.now(),
      quotedMessage: quotedMessage ? {
        id: quotedMessage.id,
        content: quotedMessage.content,
        userName: quotedMessage.userName
      } : undefined
    })
    
    // 🔥 不再手动刷新消息列表，让storage事件处理，避免重复渲染
    // const updatedMsgs = groupChatManager.getMessages(id)
    // setMessages(updatedMsgs)
    
    setInputText('')
    setQuotedMessage(null)  // 清除引用
    setTimeout(scrollToBottom, 100)
    
    // 🔥 修复：不再自动触发AI回复，用户需要手动点击空发送按钮触发
    console.log('✅ [发送完成] 消息已发送，未触发AI回复')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="glass-effect border-b border-gray-200/30">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate('/wechat')}
            className="p-1 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-medium text-gray-900">{groupName}</h1>
          <button 
            onClick={() => navigate(`/group/${id}/settings`)}
            className="p-1 active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            暂无消息
          </div>
        ) : (
          messages.map((msg, index) => {
            // 判断是否显示时间戳（两条消息间隔超过5分钟就显示）
            const prevMsg = messages[index - 1]
            let shouldShowTimestamp = false
            
            if (index === 0) {
              shouldShowTimestamp = true
            } else if (msg.timestamp && prevMsg?.timestamp) {
              // 计算两条消息之间的时间差
              const timeDiff = msg.timestamp - prevMsg.timestamp
              // 如果时间差超过5分钟，显示时间戳
              shouldShowTimestamp = timeDiff >= 5 * 60 * 1000  // 5分钟 = 300000毫秒
            }
            
            // 系统消息（撤回）
            if (msg.type === 'system' || msg.isRecalled) {
              return (
                <div key={msg.id}>
                  {shouldShowTimestamp && msg.timestamp && (
                    <div className="flex justify-center my-3">
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {new Date(msg.timestamp).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-center my-2">
                    <span className="text-xs text-gray-400">{msg.content}</span>
                  </div>
                </div>
              )
            }

            const isSent = msg.userId === 'user'
            const avatar = msg.userAvatar || getMemberAvatar(msg.userId)
            const char = msg.userId !== 'user' ? characterService.getById(msg.userId) : null

            // 计算显示名称：网名 + 角色 + 头衔
            const memberDetail = currentGroup?.members?.find(m => m.id === msg.userId)

            let baseName: string
            if (msg.userId === 'user') {
              const userInfo = getUserInfo()
              baseName = userInfo.nickname || userInfo.realName || '我'
            } else {
              baseName = char?.nickname || char?.realName || msg.userName
            }

            let roleLabel: string | undefined
            if (memberDetail?.role === 'owner') roleLabel = '群主'
            else if (memberDetail?.role === 'admin') roleLabel = '管理员'

            const titleLabel = memberDetail?.title
            const displayName = [baseName, roleLabel, titleLabel].filter(Boolean).join(' ')
            
            return (
              <div key={msg.id}>
                {/* 时间戳 */}
                {shouldShowTimestamp && msg.timestamp && (
                  <div className="flex justify-center my-3">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {new Date(msg.timestamp).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                
                <div className={`message-container flex items-start gap-1.5 my-1 ${
                  isSent ? 'sent flex-row-reverse' : 'received flex-row'
                }`}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <Avatar 
                    type={isSent ? 'sent' : 'received'}
                    avatar={isSent ? undefined : avatar}
                    name={displayName}
                  />
                </div>
                
                <div className={`flex flex-col max-w-[70%] ${
                  isSent ? 'items-end' : 'items-start'
                }`}>
                  {!isSent && (
                    <div className="text-xs text-gray-500 mb-1 px-1">{displayName}</div>
                  )}
                  <div
                    onClick={() => {
                      // 点击消息可以引用（非系统消息）
                      if (!msg.isRecalled) {
                        setQuotedMessage(msg)
                        inputRef.current?.focus()
                      }
                    }}
                    onTouchStart={(e) => handleLongPressStart(msg, e)}
                    onTouchEnd={handleLongPressEnd}
                    onMouseDown={(e) => handleLongPressStart(msg, e)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    className="cursor-pointer"
                  >
                    {/* 特殊消息类型：转账、语音、位置、图片、红包等 */}
                    {(msg.messageType === 'transfer' || 
                      msg.messageType === 'voice' || 
                      msg.messageType === 'location' || 
                      msg.messageType === 'photo' ||
                      msg.messageType === 'redPacket' ||
                      (msg as any).redPacket) ? (
                      <SpecialMessageRenderer
                        message={{
                          ...msg,
                          id: parseInt(msg.id.replace(/[^0-9]/g, '')) || Date.now(),
                          type: msg.userId === 'user' ? 'sent' : 'received',
                          time: msg.time,
                          timestamp: msg.timestamp || Date.now(),
                          content: msg.content
                        } as any}
                        characterId={msg.userId}
                        characterName={displayName}
                        onAcceptInvite={() => {}}
                        onRejectInvite={() => {}}
                        onUpdateIntimatePayStatus={() => {}}
                        onViewForwardedChat={() => {}}
                        onReceiveTransfer={() => {}}
                        onRejectTransfer={() => {}}
                        onPlayVoice={() => {}}
                        onToggleVoiceText={() => {}}
                        playingVoiceId={null}
                        showVoiceTextMap={{}}
                        onOpenRedPacket={handleOpenRedPacket}
                      />
                    ) : msg.type === 'emoji' && msg.emojiUrl ? (
                      /* 表情包消息 */
                      <div>
                        {msg.quotedMessage && (
                          <div className="mb-2 pb-2 px-2 bg-white/80 rounded-lg">
                            <div className="text-[11px] text-gray-500">
                              {msg.quotedMessage.userName}:
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {msg.quotedMessage.content}
                            </div>
                          </div>
                        )}
                        <img
                          src={msg.emojiUrl}
                          alt={msg.emojiDescription || msg.content}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      /* 文本消息 */
                      <div className={`message-bubble px-3 py-2 rounded-2xl break-words ${
                        isSent 
                          ? 'bg-[#95ec69] text-gray-900' 
                          : 'bg-white text-gray-900 shadow-sm'
                      }`}>
                        {msg.quotedMessage && (
                          <div className="mb-2 pb-2 px-2 py-1.5 -mx-1 -mt-1 rounded-t-xl border-b bg-gray-50 border-gray-200">
                            <div className="text-[11px] text-gray-500">
                              {msg.quotedMessage.userName}:
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {msg.quotedMessage.content}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {renderMessageContent(msg.content)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>
            )
          })
        )}
        {/* AI正在输入提示 */}
        {isAiTyping && (
          <div className="flex items-center gap-2 my-2 px-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {groupAvatar ? (
                <img src={groupAvatar} alt="群头像" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs">👥</span>
              )}
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入栏 */}
      <div className="bg-[#f5f7fa] border-t border-gray-200/50">
        {/* 引用消息显示区域 */}
        {quotedMessage && (
          <div className="px-4 pt-3 pb-1">
            <div className="bg-gray-100 rounded-xl p-2 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-700 mb-0.5">
                  {quotedMessage.userName}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {quotedMessage.content}
                </div>
              </div>
              <button
                onClick={() => setQuotedMessage(null)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* @成员列表 */}
        {showMentionList && (
          <div className="px-4 pb-2 max-h-40 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              {getFilteredMembers().map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMention(member.name)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0 border-gray-100"
                >
                  <span className="text-sm text-gray-900">{member.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="px-2 py-2 flex items-center gap-1">
          <button 
            onClick={() => setShowAddMenu(true)}
            className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
          >
            {(customIcons['chat-add-btn'] || chatDecorations.plusButton) ? (
              <img src={customIcons['chat-add-btn'] || chatDecorations.plusButton!} alt="加号" className="w-8 h-8 object-contain" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
          <div className="flex-1 flex items-center bg-white rounded-full px-3 py-1.5 shadow-sm touch-transition focus-within:shadow-md focus-within:scale-[1.01] min-w-0 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isAiTyping) {
                  if (inputText.trim()) {
                    handleSend()  // 有文字：发送用户消息
                  } else {
                    handleAIReply()  // 无文字：触发 AI 回复
                  }
                }
              }}
              placeholder={isAiTyping ? 'AI正在回复...' : '发送消息'}
              disabled={isAiTyping}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-sm min-w-0 disabled:opacity-50"
            />
          </div>
          <button 
            onClick={() => setShowEmojiPanel(true)}
            className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
          >
            {customIcons['chat-emoji'] ? (
              <img src={customIcons['chat-emoji']} alt="表情" className="w-8 h-8 object-contain" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          {inputText.trim() ? (
            <button
              onClick={handleSend}
              disabled={isAiTyping}
              className="w-9 h-9 flex items-center justify-center ios-button bg-green-500 text-white rounded-full shadow-lg ios-spring btn-press-fast flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {customIcons['chat-send'] ? (
                <img src={customIcons['chat-send']} alt="发送" className="w-6 h-6 object-contain" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          ) : (
            <button 
              onClick={handleAIReply}
              disabled={isAiTyping}
              className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="触发AI回复"
              style={customIcons['chat-ai'] ? { background: 'transparent' } : {}}
            >
              {isAiTyping ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : customIcons['chat-ai'] ? (
                <img src={customIcons['chat-ai']} alt="AI回复" className="w-8 h-8 object-contain" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

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
        onClose={() => {
          setShowMessageMenu(false)
          setMenuMessage(null)
        }}
        onCopy={handleCopyMessage}
        onDelete={handleDeleteMessage}
        onRecall={handleRecallMessage}
        onQuote={handleQuoteMessage}
        onEdit={() => {
          alert('群聊暂不支持编辑消息')
          setShowMessageMenu(false)
        }}
        onBatchDelete={() => {
          alert('群聊暂不支持批量删除')
          setShowMessageMenu(false)
        }}
      />

      {/* 表情包面板 */}
      <EmojiPanel
        show={showEmojiPanel}
        onClose={() => setShowEmojiPanel(false)}
        onSelect={handleSelectEmoji}
      />

      {/* 添加菜单 */}
      <GroupAddMenu
        isOpen={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        onSelectImage={() => handleImageSelect()}
        onSelectCamera={() => handleCameraSelect()}
        onSelectTransfer={() => handleTransferStart()}
        onSelectLocation={() => handleLocationSelect()}
        onSelectVoice={() => handleVoiceSelect()}
        onSelectRedPacket={() => setShowRedPacketSender(true)}
        customIcons={customIcons}
      />

      {/* 转账发送界面 */}
      <TransferSender
        show={showTransferSender}
        onClose={() => {
          setShowTransferSender(false)
          setSelectedTransferMember(null)
        }}
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
      />

      {/* 拆红包弹窗 */}
      {openRedPacketId && (() => {
        const msg = messages.find(m => m.id === openRedPacketId.toString() || m.id === `msg_${openRedPacketId}`)
        if (!msg || !msg.redPacket) return null
        
        return (
          <RedPacketOpenModal
            show={true}
            onClose={() => setOpenRedPacketId(null)}
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
            onClose={() => {
              setShowRedPacketDetail(false)
              setDetailRedPacketId(null)
            }}
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
    </div>
  )
}

export default GroupChatDetail
