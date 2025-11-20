/**
 * 聊天详情页面（重构版）
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import { getChatWallpaper, getWallpaperStyle } from '../utils/wallpaperManager'
import { getUserInfo } from '../utils/userUtils'
import AddMenu from '../components/AddMenu'
import AlbumSelector from '../components/AlbumSelector'
import MessageMenu from '../components/MessageMenu.floating'
import TransferSender from '../components/TransferSender'
import VoiceSender from '../components/VoiceSender'
import LocationSender from '../components/LocationSender'
import PhotoSender from '../components/PhotoSender'
import VideoCallScreen from '../components/VideoCallScreen'
import IncomingCallScreen from '../components/IncomingCallScreen'
import CoupleSpaceQuickMenu from '../components/CoupleSpaceQuickMenu'
import CoupleSpaceInputModal from '../components/CoupleSpaceInputModal'
import Avatar from '../components/Avatar'
import ForwardModal from '../components/ForwardModal'
import ForwardedChatViewer from '../components/ForwardedChatViewer'
import EmojiPanel from '../components/EmojiPanel'
import MusicInviteSelector from '../components/MusicInviteSelector'
import AIMemoModal from '../components/AIMemoModal'
import AIStatusModal from '../components/AIStatusModal'
import PostGenerator from '../components/PostGenerator'
import type { Message } from '../types/chat'
import { loadMessages, saveMessages } from '../utils/simpleMessageManager'
import { correctAIMessageFormat } from '../utils/formatCorrector'
import { getAllUIIcons } from '../utils/iconStorage'
import { useChatState, useChatAI, useAddMenu, useMessageMenu, useLongPress, useTransfer, useVoice, useLocationMsg, usePhoto, useVideoCall, useChatNotifications, useCoupleSpace, useModals, useIntimatePay, useMultiSelect, useMusicInvite, useEmoji, useForward, usePaymentRequest, usePostGenerator } from './ChatDetail/hooks'
import ChatModals from './ChatDetail/components/ChatModals'
import ChatHeader from './ChatDetail/components/ChatHeader'
import IntimatePaySender from './ChatDetail/components/IntimatePaySender'
import VirtualMessageList from './ChatDetail/components/VirtualMessageList'
import LoadingSkeleton from './ChatDetail/components/LoadingSkeleton'
import OfflineRecordDialog from './ChatDetail/components/OfflineRecordDialog'
import OfflineSummaryCard from './ChatDetail/components/OfflineSummaryCard'
import { useChatBubbles } from '../hooks/useChatBubbles'
import { MessageBubble } from './ChatDetail/components/MessageBubble'
import { SpecialMessageRenderer } from './ChatDetail/components/SpecialMessageRenderer'
import { playLoadMoreSound, playMenuOpenSound, playCloseSound } from '../utils/soundManager'

const ChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // 壁纸
  const [wallpaper, setWallpaper] = useState(() =>
    id ? getChatWallpaper(id) : null
  )

  // 气泡样式
  useChatBubbles(id)
  
  // Token 统计详情面板状态
  const [showTokenDetail, setShowTokenDetail] = useState(false)

  // 场景模式状态
  const [sceneMode, setSceneMode] = useState<'online' | 'offline'>('online')
  
  // 线下记录对话框状态
  const [showOfflineRecordDialog, setShowOfflineRecordDialog] = useState(false)
  const [editingOfflineRecord, setEditingOfflineRecord] = useState<Message | null>(null)
  
  // 装饰图片状态
  const [chatDecorations, setChatDecorations] = useState({
    topBar: localStorage.getItem('chat_top_bar_image'),
    bottomBar: localStorage.getItem('chat_bottom_bar_image'),
    plusButton: localStorage.getItem('chat_plus_button_image'),
    emojiButton: localStorage.getItem('chat_emoji_button_image'),
    sendButtonNormal: localStorage.getItem('chat_send_button_normal_image'),
    sendButtonActive: localStorage.getItem('chat_send_button_active_image')
  })
  
  // 自定义UI图标
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({})
  
  // 监听装饰更新
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
    window.addEventListener('globalDecorationUpdate', handleDecorationUpdate)
    return () => window.removeEventListener('globalDecorationUpdate', handleDecorationUpdate)
  }, [])

  // 加载自定义UI图标
  useEffect(() => {
    const loadCustomIcons = async () => {
      try {
        // 优先从IndexedDB加载
        let icons = await getAllUIIcons()
        
        // 如果IndexedDB为空，从localStorage恢复
        if (Object.keys(icons).length === 0) {
          const saved = localStorage.getItem('ui_custom_icons')
          if (saved) {
            icons = JSON.parse(saved)
            console.log('📦 ChatDetail从localStorage恢复图标')
          }
        }
        
        setCustomIcons(icons)
        console.log('✅ ChatDetail加载自定义图标:', Object.keys(icons).length, '个')
      } catch (error) {
        console.error('❌ 加载自定义图标失败:', error)
        // 出错时从localStorage恢复
        try {
          const saved = localStorage.getItem('ui_custom_icons')
          if (saved) {
            setCustomIcons(JSON.parse(saved))
            console.log('✅ 从localStorage备份恢复')
          }
        } catch (err) {
          console.error('备份恢复失败:', err)
        }
      }
    }
    
    loadCustomIcons()
    
    // 监听图标更新事件
    const handleIconsChange = () => {
      loadCustomIcons()
    }
    window.addEventListener('uiIconsChanged', handleIconsChange)
    
    return () => {
      window.removeEventListener('uiIconsChanged', handleIconsChange)
    }
  }, [])

  // 备忘录弹窗状态
  const [showAIMemoModal, setShowAIMemoModal] = useState(false)

  // AI状态弹窗
  const [showAIStatusModal, setShowAIStatusModal] = useState(false)
  const [currentAIStatus, setCurrentAIStatus] = useState<any>(null)
  
  // 读取聊天设置（包括是否隐藏Token）
  const [hideTokenStats, setHideTokenStats] = useState(false)
  useEffect(() => {
    if (!id) return
    const saved = localStorage.getItem(`chat_settings_${id}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setHideTokenStats(data.hideTokenStats ?? false)
      } catch (error) {
        console.error('读取聊天设置失败:', error)
      }
    }
  }, [id])
  
  // 调试：监听备忘录弹窗状态变化
  useEffect(() => {
    console.log('备忘录弹窗状态变化:', showAIMemoModal)
  }, [showAIMemoModal])
  
  // 监听壁纸变化
  useEffect(() => {
    if (!id) return
    const checkWallpaper = () => {
      setWallpaper(getChatWallpaper(id))
    }
    
    // 监听 storage 事件（其他标签页的修改）
    window.addEventListener('storage', checkWallpaper)
    
    // 监听自定义事件（当前标签页的修改）
    const handleWallpaperChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ chatId: string }>
      if (customEvent.detail.chatId === id) {
        setWallpaper(getChatWallpaper(id))
      }
    }
    window.addEventListener('chatWallpaperChanged', handleWallpaperChange)
    
    checkWallpaper()
    
    return () => {
      window.removeEventListener('storage', checkWallpaper)
      window.removeEventListener('chatWallpaperChanged', handleWallpaperChange)
    }
  }, [id])
  
  const chatState = useChatState(id || '')
  
  // 移除组件卸载时的保存逻辑，因为addMessage已经会自动备份了
  // 组件卸载时保存可能会用过时的React状态覆盖最新的备份
  
  const videoCall = useVideoCall(id || '', chatState.character, chatState.messages, chatState.setMessages)
  const chatAI = useChatAI(id || '', chatState.character, chatState.messages, chatState.setMessages, chatState.setError, videoCall.receiveIncomingCall, chatState.refreshCharacter, videoCall.endCall)
  const transfer = useTransfer(chatState.setMessages, chatState.character?.nickname || chatState.character?.realName || '未知', id || '')
  const voice = useVoice(chatState.setMessages, id || '')
  const locationMsg = useLocationMsg(chatState.setMessages, id || '')
  const photo = usePhoto(chatState.setMessages, id || '')
  const intimatePay = useIntimatePay(chatState.setMessages, id || '')
  const paymentRequest = usePaymentRequest(
    id || '',
    chatState.character?.id || '',
    chatState.character?.nickname || chatState.character?.realName || 'AI',
    chatState.setMessages
  )
  
  // 通知和未读消息管理
  useChatNotifications({
    chatId: id
  })
  
  const coupleSpace = useCoupleSpace(id, chatState.character, chatState.setMessages)
  const modals = useModals()
  const musicInvite = useMusicInvite(id || '', chatState.setMessages, id)
  const emoji = useEmoji(id || '', chatState.setMessages)
  const forward = useForward(id || '', chatState.setMessages)
  const postGenerator = usePostGenerator(
    chatState.setMessages,
    id || '',
    chatState.character?.nickname || chatState.character?.realName || 'AI',
    chatState.character?.personality
  )
  
  // 格式修正处理器
  const handleFormatCorrection = useCallback(() => {
    if (!id) return
    
    // 找到最后一轮AI消息（从最后一条用户消息之后的所有AI消息）
    const messages = chatState.messages
    const lastUserMsgIndex = messages.map((m, i) => m.type === 'sent' ? i : -1).filter(i => i !== -1).pop() ?? -1
    const lastRoundAIMessages = messages.slice(lastUserMsgIndex + 1).filter(m => m.type === 'received')
    
    if (lastRoundAIMessages.length === 0) {
      alert('没有找到AI消息')
      return
    }
    
    // 修正所有消息
    let totalCorrections: string[] = []
    const updatedMessages = messages.map(msg => {
      const isTargetMessage = lastRoundAIMessages.some(m => m.id === msg.id)
      if (!isTargetMessage) return msg
      
      const result = correctAIMessageFormat(msg.content || '')
      if (result.corrected) {
        totalCorrections.push(...result.corrections.map(c => `[${String(msg.id).slice(0, 8)}] ${c}`))
        return { ...msg, content: result.fixed }
      }
      return msg
    })
    
    if (totalCorrections.length === 0) {
      alert('格式正确，无需修正')
      return
    }
    
    // 保存到存储
    saveMessages(id, updatedMessages)
    
    // 更新React状态
    chatState.setMessages(updatedMessages)
    
    // 显示修正结果
    alert(`已修正最后一轮 ${lastRoundAIMessages.length} 条消息，共 ${totalCorrections.length} 处格式错误：\n${totalCorrections.join('\n')}`)
  }, [id, chatState.messages, chatState.setMessages])
  
  const addMenu = useAddMenu(
    chatAI.handleRegenerate,
    () => transfer.setShowTransferSender(true),
    () => voice.setShowVoiceSender(true),
    () => locationMsg.setShowLocationSender(true),
    () => photo.setShowPhotoSender(true),
    () => photo.setShowAlbumSelector(true),
    coupleSpace.openMenu,
    () => intimatePay.setShowIntimatePaySender(true),
    () => setShowAIMemoModal(true),
    () => navigate(`/chat/${id}/offline`),  // 线下模式
    () => navigate(`/chat/${id}/payment-request`),  // 外卖（已合并给TA点外卖功能）
    () => navigate(`/chat/${id}/shopping`),  // 网购商店
    () => postGenerator.setShowPostGenerator(true),  // 帖子生成
    handleFormatCorrection  // 格式修正
  )
  
  // 多选模式
  const multiSelect = useMultiSelect(id || '', chatState.messages, chatState.setMessages)
  
  // 处理转发确认
  const handleForwardConfirm = useCallback((targetCharacterId: string) => {
    const selectedMessages = multiSelect.getSelectedMessages()
    const characterName = chatState.character?.nickname || chatState.character?.realName || '对方'
    
    // 转换消息格式
    const formattedMessages = selectedMessages.map(msg => ({
      senderName: msg.type === 'sent' ? '我' : characterName,
      content: msg.content || msg.voiceText || msg.photoDescription || msg.location?.name || '[特殊消息]',
      messageType: msg.messageType,
      time: msg.time
    }))
    
    forward.forwardMessages(targetCharacterId, formattedMessages as any)
    multiSelect.exitMultiSelectMode()
  }, [multiSelect, chatState.character, forward])
  
  const messageMenu = useMessageMenu(id || '', chatState.setMessages, multiSelect.enterMultiSelectMode)
  const longPress = useLongPress((msg, position) => {
    // 多选模式下不显示菜单
    if (multiSelect.isMultiSelectMode) return

    messageMenu.setLongPressedMessage(msg)
    messageMenu.setMenuPosition(position)
    messageMenu.setShowMessageMenu(true)
  })

  // 🔥 禁用虚拟化，只使用分页加载（虚拟化有白屏bug）
  const shouldUseVirtualization = false

  // 🔥 优化：使用useCallback确保返回按钮始终可用
  const handleBack = useCallback(() => {
    navigate('/wechat')
  }, [navigate])

  // 处理添加/编辑线下记录
  const handleSaveOfflineRecord = useCallback((title: string, summary: string, timestamp: number) => {
    const offlineSummaryMessage: Message = {
      id: editingOfflineRecord ? editingOfflineRecord.id : Date.now(), // 🔥 修复：编辑时保持原ID，新建时使用唯一ID
      type: 'system',
      messageType: 'offline-summary',
      content: title,
      time: new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: timestamp,
      sceneMode: 'online',
      offlineSummary: {
        title,
        summary,
        memoryId: editingOfflineRecord?.offlineSummary?.memoryId || `offline-${Date.now()}` // 🔥 保持原memoryId
      },
      aiReadableContent: `[系统记录：线下经历 - ${title}]\n总结：${summary}`
    }

    if (editingOfflineRecord) {
      // 编辑模式：替换原有消息，保持ID不变
      const updatedMessages = chatState.messages.map(m =>
        m.id === editingOfflineRecord.id ? offlineSummaryMessage : m
      ).sort((a, b) => a.timestamp - b.timestamp)
      
      chatState.setMessages(updatedMessages)
      saveMessages(id || '', updatedMessages)
      console.log('✅ 线下记录已更新')
    } else {
      // 新建模式：添加新消息
      const updatedMessages = [...chatState.messages, offlineSummaryMessage]
        .sort((a, b) => a.timestamp - b.timestamp)
      
      chatState.setMessages(updatedMessages)
      saveMessages(id || '', updatedMessages)
      console.log('✅ 线下记录已添加')
    }

    // 关闭对话框
    setShowOfflineRecordDialog(false)
    setEditingOfflineRecord(null)
  }, [chatState, editingOfflineRecord, id])

  // 🔥 优化：输入框处理函数，避免重复创建
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    chatState.setInputValue(e.target.value)
  }, [chatState])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !chatAI.isAiTyping) {
      e.preventDefault()
      if (chatState.inputValue.trim()) {
        chatAI.handleSend(chatState.inputValue, chatState.setInputValue, modals.quotedMessage, () => modals.setQuotedMessage(null))
      } else {
        chatAI.handleAIReply()
      }
    }
  }, [chatAI, chatState, modals])

  // 检测未接来电（用户返回聊天页面时）
  useEffect(() => {
    // 检查是否从全局弹窗接受来电
    const acceptCallKey = `accept_call_${id}`
    const acceptCallData = sessionStorage.getItem(acceptCallKey)
    if (acceptCallData) {
      console.log('📞 检测到接受来电标记，自动接听')
      sessionStorage.removeItem(acceptCallKey)
      setTimeout(() => {
        videoCall.receiveIncomingCall()
        setTimeout(() => {
          videoCall.acceptCall()
        }, 100)
      }, 500)
      return
    }
    
    if (!id || !chatState.character) return
    
    const missedCallKey = `missed_call_${id}`
    const missedCallData = sessionStorage.getItem(missedCallKey)
    
    if (missedCallData) {
      try {
        const missedCall = JSON.parse(missedCallData)
        const timeDiff = Date.now() - missedCall.timestamp
        
        // 如果未接来电在1分钟内，重新触发来电界面
        if (timeDiff < 60000) {
          console.log('📞 检测到未接来电，重新显示来电界面')
          // 清除未接来电记录
          sessionStorage.removeItem(missedCallKey)
          
          // 触发来电界面
          setTimeout(() => {
            videoCall.receiveIncomingCall()
          }, 500)
        } else {
          // 超过1分钟，清除记录并添加未接来电提示
          sessionStorage.removeItem(missedCallKey)
          
          const missedCallMsg: Message = {
            id: Date.now(),
            type: 'system',
            content: `未接来电：${chatState.character.nickname || chatState.character.realName}`,
            time: new Date(missedCall.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            timestamp: missedCall.timestamp,
            messageType: 'system'
          }
          chatState.setMessages(prev => [...prev, missedCallMsg])
        }
      } catch (e) {
        console.error('处理未接来电失败:', e)
        sessionStorage.removeItem(missedCallKey)
      }
    }
  }, [id, chatState.character, videoCall, chatState.setMessages])
  
  const handleRecallMessage = (message: Message) => {
    const isUserMessage = message.type === 'sent'
    const originalMessageType = message.type === 'sent' ? 'sent' as const : 'received' as const
    
    // 从IndexedDB加载消息
    const messages = loadMessages(id || '')
    const updatedMessages = messages.map(msg => 
      msg.id === message.id 
        ? { 
            ...msg, 
            isRecalled: true,
            recalledContent: msg.content || msg.voiceText || msg.photoDescription || msg.location?.name || '特殊消息',
            recallReason: '',
            originalType: originalMessageType,
            content: isUserMessage ? '你撤回了一条消息' : (chatState.character?.realName || '对方') + '撤回了一条消息',
            type: 'system' as const,
            messageType: 'system' as const
          }
        : msg
    )
    
    // 保存到IndexedDB
    saveMessages(id || '', updatedMessages)
    
    // 更新React状态
    chatState.setMessages(() => updatedMessages)
  }
  
  const isInitialLoadRef = useRef(true)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // 使用 ref 记录"用户是否在底部"，由滚动事件维护
  const isNearBottomRef = useRef(true)

  // 🔥 分页加载相关的 ref
  const previousMessageCountRef = useRef(chatState.messages.length)
  const previousScrollHeightRef = useRef(0)
  const previousScrollTopRef = useRef(0)
  const loadMoreTriggeredRef = useRef(false)

  const updateNearBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const threshold = 150 // 距离底部150px以内认为是在底部
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    isNearBottomRef.current = nearBottom
  }, [])

  // 供其他逻辑读取当前“是否在底部”状态
  const isNearBottom = useCallback(() => {
    return isNearBottomRef.current
  }, [])

  // 滚动到底部的函数（必须在useEffect之前定义）
  const scrollToBottom = useCallback((smooth = true, force = false) => {
    const container = scrollContainerRef.current
    if (!container) return

    // 🔥 如果不是强制滚动，且用户不在底部附近，就不要自动滚动
    if (!force && !isNearBottomRef.current) {
      console.log('📜 [滚动] 用户正在查看历史消息，跳过自动滚动')
      return
    }

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  // 初始加载时立即跳到底部，不要动画
  useEffect(() => {
    if (isInitialLoadRef.current && chatState.messages.length > 0) {
      // 使用setTimeout确保DOM已经渲染完成
      setTimeout(() => {
        scrollToBottom(false, true) // 初始加载强制滚动
        // 初始加载完成后启用平滑滚动
        if (scrollContainerRef.current) {
          scrollContainerRef.current.classList.add('enable-smooth')
        }
      }, 100) // 增加延迟确保虚拟化渲染完成
      isInitialLoadRef.current = false
    }
  }, [chatState.messages, scrollToBottom])

  // 🔥 后续消息更新时使用平滑滚动（但加载更多时不滚动）
  const lastMessageIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isInitialLoadRef.current && chatState.messages.length > 0) {
      const lastMessage = chatState.messages[chatState.messages.length - 1]
      const lastMessageId = lastMessage?.id

      // 🔥 只有当最后一条消息的ID变化时才滚动（说明是新消息，不是加载更多）
      if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMessageId
        // 使用setTimeout确保DOM更新后再滚动
        // 用户自己发送的消息：无论当前位置，强制滚动到底部
        // 其他类型（AI 回复 / 系统消息）：仅在接近底部时根据 scrollToBottom 内部判断
        const forceToBottom = lastMessage.type === 'sent'
        setTimeout(() => scrollToBottom(true, forceToBottom), 50)
      }
    }
  }, [chatState.messages, scrollToBottom])

  // AI打字时滚动
  useEffect(() => {
    if (chatAI.isAiTyping) {
      // 🔥 只有用户在底部附近时才自动滚动
      setTimeout(() => scrollToBottom(true, false), 50)
    }
  }, [chatAI.isAiTyping, scrollToBottom])
  
  // 🔥 滚动检测和自动加载更多
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || shouldUseVirtualization) return // 虚拟化模式下不需要

    const handleScroll = () => {
      // 始终先更新"是否在底部"的状态，供自动滚动逻辑使用
      updateNearBottom()
      
      // 🔥 滚动到顶部时自动加载更多历史消息
      const { scrollTop, scrollHeight } = container
      if (scrollTop < 100 && chatState.hasMoreMessages && !chatState.isLoadingMessages && !loadMoreTriggeredRef.current) {
        loadMoreTriggeredRef.current = true
        
        // 记录当前滚动状态，用于加载后恢复位置
        previousScrollHeightRef.current = scrollHeight
        previousScrollTopRef.current = scrollTop
        
        console.log('📜 [自动加载] 滚动到顶部，触发加载更多')
        chatState.loadMoreMessages()
        
        // 防止频繁触发
        setTimeout(() => {
          loadMoreTriggeredRef.current = false
        }, 500)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [shouldUseVirtualization, updateNearBottom, chatState.hasMoreMessages, chatState.isLoadingMessages, chatState.loadMoreMessages])
  
  // 🔥 加载更多后保持滚动位置不跳动
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    // 检测是否是加载更多导致的消息增加
    if (previousMessageCountRef.current > 0 && chatState.messages.length > previousMessageCountRef.current) {
      const isLoadMore = previousScrollTopRef.current < 200 // 之前在顶部附近
      
      if (isLoadMore && previousScrollHeightRef.current > 0) {
        // 计算新增内容的高度
        const newScrollHeight = container.scrollHeight
        const addedHeight = newScrollHeight - previousScrollHeightRef.current
        
        // 保持视觉位置不变
        if (addedHeight > 0) {
          container.scrollTop = previousScrollTopRef.current + addedHeight
          console.log(`📜 [保持位置] 新增高度: ${addedHeight}px, 调整滚动位置`)
        }
      }
    }
    
    previousMessageCountRef.current = chatState.messages.length
  }, [chatState.messages])

  // 🔥 显示加载状态而不是"角色不存在"
  if (!chatState.character) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f7fa]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }
  
  const character = chatState.character

  // 减少日志频率，避免输入时刷屏
  if (import.meta.env.DEV && chatState.messages.length % 10 === 0) {
    console.log(`📊 [ChatDetail] 消息数量: ${chatState.messages.length}, 虚拟化: ${shouldUseVirtualization ? '✅启用' : '❌关闭'}, 还有更多: ${chatState.hasMoreMessages}`)
  }
  
  return (
    <div 
      className="h-screen flex flex-col"
      style={wallpaper ? getWallpaperStyle(wallpaper) : { backgroundColor: '#f5f7fa' }}
    >
      <ChatHeader
        characterName={character.nickname || character.realName}
        characterId={id}
        characterAvatar={character.avatar}
        isAiTyping={chatAI.isAiTyping}
        onBack={handleBack}
        onMenuClick={() => navigate(`/chat/${id}/settings`)}
        onAvatarClick={async () => {
          // 获取最新的AI状态
          if (id) {
            const { getAIStatus } = await import('../utils/aiStatusManager')
            const status = getAIStatus(id)
            setCurrentAIStatus(status)
            setShowAIStatusModal(true)
          }
        }}
        tokenStats={chatAI.tokenStats}
        onTokenStatsClick={() => setShowTokenDetail(!showTokenDetail)}
        topBarImage={customIcons['chat-topbar-bg'] || chatDecorations.topBar}
        customIcons={customIcons}
        onAddOfflineRecord={() => {
          setEditingOfflineRecord(null)
          setShowOfflineRecordDialog(true)
        }}
      />
      
      {/* Token 详情面板 - 显示在头部下方 */}
      {showTokenDetail && chatAI.tokenStats.total > 0 && (
        <div className="mx-4 mt-2 p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">本次请求统计</span>
            <button 
              onClick={() => setShowTokenDetail(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Token 使用 */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 font-medium">输入 Token</span>
              <span className="text-xs font-semibold text-blue-600">{chatAI.tokenStats.total.toLocaleString()} tokens</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">系统提示</span>
              <span className="text-gray-700">{chatAI.tokenStats.systemPrompt.toLocaleString()}</span>
            </div>
            {chatAI.tokenStats.character > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">人设</span>
                <span className="text-gray-700">{chatAI.tokenStats.character.toLocaleString()}</span>
              </div>
            )}
            {chatAI.tokenStats.lorebook > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">世界书</span>
                <span className="text-gray-700">{chatAI.tokenStats.lorebook.toLocaleString()}</span>
              </div>
            )}
            {chatAI.tokenStats.memory > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">记忆</span>
                <span className="text-gray-700">{chatAI.tokenStats.memory.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">消息历史</span>
              <span className="text-gray-700">{chatAI.tokenStats.messages.toLocaleString()}</span>
            </div>
          </div>
          
          {/* 输出Token */}
          {chatAI.tokenStats.outputTokens && chatAI.tokenStats.outputTokens > 0 && (
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 font-medium">输出 Token</span>
                <span className="text-xs font-semibold text-green-600">{chatAI.tokenStats.outputTokens.toLocaleString()} tokens</span>
              </div>
            </div>
          )}
          
          {/* 响应时间 */}
          {chatAI.tokenStats.responseTime && chatAI.tokenStats.responseTime > 0 && (
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">响应时间</span>
                <span className="text-gray-600">{(chatAI.tokenStats.responseTime/1000).toFixed(2)}s</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {chatState.error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
          {chatState.error}
        </div>
      )}
      
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll"
        style={{
          WebkitOverflowScrolling: 'touch',
          willChange: 'scroll-position',
          transform: 'translateZ(0)' // 🚀 GPU加速
        }}
      >
        {/* 🔥 加载状态骨架屏 */}
        {chatState.isLoadingMessages && chatState.messages.length === 0 ? (
          <LoadingSkeleton />
        ) : shouldUseVirtualization ? (
          <VirtualMessageList
            messages={chatState.messages.filter(m => m.sceneMode !== 'offline')}
            character={character}
            isAiTyping={chatAI.isAiTyping}
            onMessageLongPress={longPress.handleLongPressStart}
            onMessageLongPressEnd={longPress.handleLongPressEnd}
            onViewRecalledMessage={modals.setViewingRecalledMessage}
            onViewCallRecord={modals.setViewingCallRecord}
            onReceiveTransfer={transfer.handleReceiveTransfer}
            onRejectTransfer={transfer.handleRejectTransfer}
            onPlayVoice={(messageId) => voice.handlePlayVoice(messageId, 0)}
            onToggleVoiceText={(messageId) => voice.handleToggleVoiceText(messageId)}
            playingVoiceId={voice.playingVoiceId}
            showVoiceTextMap={voice.showVoiceTextMap}
            onUpdateIntimatePayStatus={async (messageId, newStatus) => {
              let updatedMessages: Message[] = []
              chatState.setMessages(prev => {
                updatedMessages = prev.map(msg =>
                  msg.id === messageId && msg.intimatePay
                    ? { ...msg, intimatePay: { ...msg.intimatePay, status: newStatus } }
                    : msg
                )
                return updatedMessages
              })
              // 🔥 保存到IndexedDB
              if (id && updatedMessages.length > 0) {
                await saveMessages(id, updatedMessages)
                console.log('💾 [亲密付状态更新] 已保存到数据库')
              }
            }}
            onAcceptCoupleSpace={coupleSpace.acceptInvite}
            onRejectCoupleSpace={coupleSpace.rejectInvite}
            onAcceptMusicInvite={musicInvite.acceptInvite}
            onRejectMusicInvite={musicInvite.rejectInvite}
            onEditOfflineRecord={(message) => {
              setEditingOfflineRecord(message)
              setShowOfflineRecordDialog(true)
            }}
            hasMoreMessages={chatState.hasMoreMessages}
            isLoadingMessages={chatState.isLoadingMessages}
            onLoadMore={chatState.loadMoreMessages}
          />
        ) : (
          <>
            {/* 🔥 加载更多按钮 - 显示在消息列表顶部 */}
            {chatState.hasMoreMessages && (
              <div className="flex justify-center py-3 mb-2">
                {chatState.isLoadingMessages ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <span>加载中...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      playLoadMoreSound() // 🎵 播放加载音效
                      // 🔥 点击前记录当前滚动状态
                      if (scrollContainerRef.current) {
                        previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight
                        previousScrollTopRef.current = scrollContainerRef.current.scrollTop
                        console.log('📜 [ChatDetail] 点击加载更多，记录状态', {
                          scrollHeight: scrollContainerRef.current.scrollHeight,
                          scrollTop: scrollContainerRef.current.scrollTop
                        })
                      }
                      chatState.loadMoreMessages()
                    }}
                    className="text-sm text-blue-500 hover:text-blue-600 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors active:scale-95"
                  >
                    点击加载更多历史消息
                  </button>
                )}
              </div>
            )}

            {chatState.messages
              .filter(m => m.sceneMode !== 'offline')  // 🔥 过滤掉线下模式的消息
              .map((message, index) => {
          // 获取过滤后的消息列表用于计算时间戳
          const visibleMessages = chatState.messages.filter(m => m.sceneMode !== 'offline')
          // 判断是否需要显示5分钟时间戳（固定时间刻度）
          const prevMsg = visibleMessages[index - 1]
          let shouldShow5MinTimestamp = false
          
          if (index === 0) {
            shouldShow5MinTimestamp = true
          } else if (message.timestamp && prevMsg?.timestamp) {
            // 计算当前消息和上一条消息所在的5分钟时间段（向下取整）
            const current5MinSlot = Math.floor(message.timestamp / (5 * 60 * 1000))
            const prev5MinSlot = Math.floor(prevMsg.timestamp / (5 * 60 * 1000))
            // 如果跨越了5分钟时间段，显示时间戳
            shouldShow5MinTimestamp = current5MinSlot !== prev5MinSlot
          }
          
          // 格式化5分钟时间戳
          let timestamp5MinText = ''
          if (shouldShow5MinTimestamp) {
            const msgDate = new Date(message.timestamp)
            const today = new Date()
            
            // 判断是否是今天
            const isToday = msgDate.getDate() === today.getDate() &&
                           msgDate.getMonth() === today.getMonth() &&
                           msgDate.getFullYear() === today.getFullYear()
            
            if (isToday) {
              // 今天只显示时间
              timestamp5MinText = msgDate.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              })
            } else {
              // 昨天及以前显示日期+时间
              timestamp5MinText = msgDate.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          }
          
          if (message.type === 'system') {
            if (message.isRecalled && message.recalledContent) {
              return (
                <div key={message.id}>
                  {shouldShow5MinTimestamp && (
                    <div className="flex justify-center my-2">
                      <div className="bg-gray-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <div className="text-xs text-gray-500">{timestamp5MinText}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center my-1">
                    <div 
                      className="text-xs text-gray-400 px-4 py-1 cursor-pointer hover:text-gray-600 transition-colors"
                      onClick={() => modals.setViewingRecalledMessage(message)}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              )
            }
            
            // 视频通话记录
            if (message.messageType === 'video-call-record' && message.videoCallRecord) {
              return (
                <div key={message.id}>
                  {shouldShow5MinTimestamp && (
                    <div className="flex justify-center my-2">
                      <div className="bg-gray-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <div className="text-xs text-gray-500">{timestamp5MinText}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center my-1">
                    <div 
                      className="bg-white/80 backdrop-blur-sm rounded-[32px] p-3 border border-gray-200/50 shadow-sm cursor-pointer hover:bg-white transition-colors"
                      onClick={() => modals.setViewingCallRecord(message)}
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="2" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                          <path d="M18 10l4-2v8l-4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                        <span>{message.content}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            
            // 🔥 线下记录
            if (message.messageType === 'offline-summary' && message.offlineSummary) {
              return (
                <div key={message.id}>
                  <OfflineSummaryCard 
                    message={message} 
                    onEdit={(msg: Message) => {
                      setEditingOfflineRecord(msg)
                      setShowOfflineRecordDialog(true)
                    }}
                  />
                </div>
              )
            }
            
            // 带有头像提示词的系统消息（AI 换头像），点击可查看详细提示词
            const avatarPrompt = (message as any).avatarPrompt as string | undefined

            return (
              <div key={message.id}>
                {shouldShow5MinTimestamp && (
                  <div className="flex justify-center my-2">
                    <div className="bg-gray-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <div className="text-xs text-gray-500">{timestamp5MinText}</div>
                    </div>
                  </div>
                )}
                <div className="flex justify-center my-1">
                  {avatarPrompt ? (
                    <button
                      className="text-xs text-gray-500 px-4 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:text-gray-700 transition-colors"
                      onClick={() => {
                        alert(`本次换头像使用的提示词:\n\n${avatarPrompt}`)
                      }}
                    >
                      {message.content}
                    </button>
                  ) : (
                    <div className="text-xs text-gray-400 px-4 py-1">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            )
          }

          // 线下模式消息不在聊天窗口显示
          if (message.sceneMode === 'offline') {
            return null
          }

          const isSelectable = multiSelect.isMessageSelectable(message)
          const isSelected = multiSelect.selectedMessageIds.has(message.id)
          
          return (
            <div key={message.id} className="flex flex-col gap-0.5">
            {/* 5分钟时间戳 */}
            {shouldShow5MinTimestamp && (
              <div className="flex justify-center my-2">
                <div className="bg-gray-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="text-xs text-gray-500">{timestamp5MinText}</div>
                </div>
              </div>
            )}
            <div
              className={'message-container flex items-start gap-1.5 my-1 message-enter ' + (message.type === 'sent' ? 'sent flex-row-reverse message-enter-right' : 'received flex-row message-enter-left')}
            >
              {/* 多选模式下的复选框 */}
              {multiSelect.isMultiSelectMode && (
                <div 
                  className="flex items-center justify-center flex-shrink-0 mt-1"
                  onClick={() => isSelectable && multiSelect.toggleMessageSelection(message.id)}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    !isSelectable
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                      : isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400 bg-white cursor-pointer active:scale-90'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-center flex-shrink-0">
                <Avatar 
                  type={message.type}
                  avatar={character.avatar}
                  name={character.realName}
                  chatId={id}
                />
              </div>
              
              <div className={'flex flex-col ' + (message.coupleSpaceInvite ? '' : 'max-w-[70%] ') + (message.type === 'sent' ? 'items-end' : 'items-start')}>
                {/* 引用消息（显示在所有消息类型上方） */}
                {message.quotedMessage && (
                  <div className={'mb-1.5 px-2.5 py-1.5 rounded max-w-full ' + (
                    message.type === 'sent' 
                      ? 'bg-gray-200' 
                      : 'bg-gray-200'
                  )}>
                    <div className={'text-xs font-semibold mb-0.5 ' + (message.type === 'sent' ? 'text-gray-900' : 'text-blue-500')}>
                      {message.quotedMessage.senderName}
                    </div>
                    <div className={'text-xs opacity-80 overflow-hidden text-ellipsis whitespace-nowrap ' + (message.type === 'sent' ? 'text-gray-700' : 'text-gray-600')}>
                      {message.quotedMessage.content}
                    </div>
                  </div>
                )}
                
                {/* 消息内容和拉黑标记的容器 */}
                <div className="flex items-end gap-2">
                
                {/* 用户被AI拉黑的警告图标（左侧） */}
                {message.blockedByReceiver && message.type === 'sent' && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                
                {/* 消息内容：特殊消息或文本气泡 */}
                {message.coupleSpaceInvite || 
                 message.messageType === 'intimatePay' || 
                 message.messageType === 'forwarded-chat' || 
                 message.messageType === 'emoji' || 
                 message.messageType === 'transfer' || 
                 message.messageType === 'voice' || 
                 message.messageType === 'location' || 
                 message.messageType === 'photo' ||
                 message.messageType === 'paymentRequest' ||
                 message.messageType === 'productCard' ||
                 message.messageType === 'post' ||
                 (message.messageType as any) === 'musicInvite' ? (
                  <SpecialMessageRenderer
                    message={message}
                    characterId={chatState.character?.id || ''}
                    characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
                    onAcceptInvite={coupleSpace.acceptInvite}
                    onRejectInvite={coupleSpace.rejectInvite}
                    onAcceptMusicInvite={musicInvite.acceptInvite}
                    onRejectMusicInvite={musicInvite.rejectInvite}
                    onUpdateIntimatePayStatus={async (messageId, newStatus) => {
                      let updatedMessages: Message[] = []
                      chatState.setMessages(prev => {
                        updatedMessages = prev.map(msg =>
                          msg.id === messageId && msg.intimatePay
                            ? { ...msg, intimatePay: { ...msg.intimatePay, status: newStatus as 'pending' | 'accepted' | 'rejected' } }
                            : msg
                        )
                        return updatedMessages
                      })
                      // 🔥 保存到IndexedDB
                      if (id && updatedMessages.length > 0) {
                        await saveMessages(id, updatedMessages)
                        console.log('💾 [亲密付状态更新] 已保存到数据库')
                      }
                    }}
                    onViewForwardedChat={forward.setViewingForwardedChat}
                    onReceiveTransfer={transfer.handleReceiveTransfer}
                    onRejectTransfer={transfer.handleRejectTransfer}
                    onPlayVoice={voice.handlePlayVoice}
                    onToggleVoiceText={voice.handleToggleVoiceText}
                    playingVoiceId={voice.playingVoiceId}
                    showVoiceTextMap={voice.showVoiceTextMap}
                    onAcceptPayment={paymentRequest.acceptPayment}
                    onRejectPayment={paymentRequest.rejectPayment}
                  />
                ) : (
                  <MessageBubble
                    message={message}
                    onLongPressStart={longPress.handleLongPressStart}
                    onLongPressEnd={longPress.handleLongPressEnd}
                  />
                )}
                
                {/* AI被拉黑的警告图标 - 和消息在同一行 */}
                {message.blocked && message.type === 'received' && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}
                
                </div>
                
                {/* 时间戳 - 显示在气泡下方居中 */}
                <div className="flex justify-center mt-1">
                  <div className="text-xs text-gray-400">
                    {message.time}
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* 用户被AI拉黑的提示文字 - 独立居中显示 */}
            {message.blockedByReceiver && message.type === 'sent' && (
              <div className="flex justify-center w-full">
                <div className="text-xs text-gray-400">
                  消息已送达但对方拒收了
                </div>
              </div>
            )}
          </div>
          )
        })}
          </>
        )}
        
        {chatAI.isAiTyping && (
          <div className="flex items-start gap-1.5 my-1 message-enter message-enter-left">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <Avatar 
                type="received"
                avatar={character.avatar}
                name={character.realName}
                chatId={id}
              />
            </div>
            
            <div className="flex flex-col items-start">
              <div className="bg-white px-3 py-2 rounded-lg rounded-tl-none shadow-sm typing-indicator text-sm">
                <div className="flex gap-1">
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                  <span className="dot-pulse"></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 消息结束标记 - 用于滚动定位 */}
        <div ref={chatAI.messagesEndRef} id="messages-end" />
      </div>
      
      {/* 多选模式底部操作栏 */}
      {multiSelect.isMultiSelectMode && (
        <div className="backdrop-blur-sm bg-white/90 border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => multiSelect.exitMultiSelectMode()}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <span className="text-sm text-gray-600">
                已选择 {multiSelect.selectedMessageIds.size} 条
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* 转发按钮 */}
              <button
                onClick={multiSelect.openForwardModal}
                disabled={multiSelect.selectedMessageIds.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  multiSelect.selectedMessageIds.size > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                转发
              </button>
              {/* 删除按钮 */}
              <button
                onClick={multiSelect.deleteSelectedMessages}
                disabled={multiSelect.selectedMessageIds.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  multiSelect.selectedMessageIds.size > 0
                    ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 底部输入栏 - 毛玻璃效果 */}
      {!multiSelect.isMultiSelectMode && (
      <div className="relative bg-transparent">
        {/* 底栏装饰背景 */}
        {(customIcons['chat-bottombar-bg'] || chatDecorations.bottomBar) && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <img 
              src={customIcons['chat-bottombar-bg'] || chatDecorations.bottomBar!} 
              alt="底栏装饰" 
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        {modals.quotedMessage && (
          <div className="relative z-10 px-4 py-2 bg-gray-100 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-blue-600 font-medium">
                {modals.quotedMessage.type === 'sent' ? '我' : character.nickname || character.realName}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {modals.quotedMessage.content}
              </div>
            </div>
            <button
              onClick={() => modals.setQuotedMessage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="relative z-10 px-2 py-2 flex items-center gap-1">
          <button
            onClick={() => {
              playMenuOpenSound() // 🎵 播放菜单音效
              addMenu.setShowAddMenu(true)
            }}
            className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
          >
            {(customIcons['chat-add-btn'] || chatDecorations.plusButton) ? (
              <img src={customIcons['chat-add-btn'] || chatDecorations.plusButton!} alt="加号" className="w-6 h-6 object-contain" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
          <div 
            className="flex-1 flex items-center bg-white/30 backdrop-blur-xl rounded-full px-4 py-2 min-w-0"
            style={customIcons['chat-input-bg'] ? {
              backgroundImage: `url(${customIcons['chat-input-bg']})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            <input
              type="text"
              value={chatState.inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="发送消息"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-sm min-w-0"
              style={{
                transform: 'translateZ(0)', // 🚀 GPU加速
                willChange: 'contents'
              }}
            />
          </div>
          <button 
            onClick={() => emoji.setShowEmojiPanel(true)}
            className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
          >
            {customIcons['chat-emoji'] ? (
              <img src={customIcons['chat-emoji']} alt="表情" className="w-5 h-5 object-contain" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          {chatState.inputValue.trim() ? (
            <button
              onClick={() => chatAI.handleSend(chatState.inputValue, chatState.setInputValue, modals.quotedMessage, () => modals.setQuotedMessage(null))}
              disabled={chatAI.isAiTyping}
              className="w-9 h-9 flex items-center justify-center ios-button bg-gray-900 text-white rounded-full shadow-lg disabled:opacity-50 ios-spring btn-press-fast flex-shrink-0"
            >
              {customIcons['chat-send'] ? (
                <img src={customIcons['chat-send']} alt="发送" className="w-4 h-4 object-contain" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          ) : (
            <button 
              onClick={() => chatAI.handleAIReply()}
              disabled={chatAI.isAiTyping}
              className="w-9 h-9 flex items-center justify-center ios-button text-gray-700 disabled:opacity-50 btn-press-fast touch-ripple-effect flex-shrink-0"
            >
              {chatAI.isAiTyping ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : customIcons['chat-ai'] ? (
                <img src={customIcons['chat-ai']} alt="AI回复" className="w-5 h-5 object-contain" />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          )}
        </div>
        <div className="flex justify-center pb-2">
          <div className="w-32 h-1 bg-gray-900 rounded-full opacity-40"></div>
        </div>
      </div>
      )}

      <AddMenu
        isOpen={addMenu.showAddMenu}
        onClose={() => {
          playCloseSound() // 🎵 关闭时播放音效
          addMenu.setShowAddMenu(false)
        }}
        onSelectRecall={addMenu.handlers.handleSelectRecall}
        onSelectImage={addMenu.handlers.handleSelectImage}
        onSelectCamera={addMenu.handlers.handleSelectCamera}
        onSelectTransfer={addMenu.handlers.handleSelectTransfer}
        onSelectIntimatePay={addMenu.handlers.handleSelectIntimatePay}
        onSelectCoupleSpaceInvite={addMenu.handlers.handleSelectCoupleSpace}
        onSelectLocation={addMenu.handlers.handleSelectLocation}
        onSelectVoice={addMenu.handlers.handleSelectVoice}
        onSelectVideoCall={() => videoCall.startCall()}
        onSelectMusicInvite={() => musicInvite.setShowMusicInviteSelector(true)}
        onSelectAIMemo={addMenu.handlers.handleSelectAIMemo}
        onSelectOffline={addMenu.handlers.handleSelectOffline}
        onSelectPaymentRequest={addMenu.handlers.handleSelectPaymentRequest}
        onSelectShopping={addMenu.handlers.handleSelectShopping}
        onSelectPost={addMenu.handlers.handleSelectPost}
        onSelectFormatCorrector={addMenu.handlers.handleSelectFormatCorrector}
        hasCoupleSpaceActive={coupleSpace.hasCoupleSpace}
        customIcons={customIcons}
      />

      {/* 表情包面板 */}
      <EmojiPanel
        show={emoji.showEmojiPanel}
        onClose={() => emoji.setShowEmojiPanel(false)}
        onSelect={emoji.sendEmoji}
      />

      {/* 音乐邀请选择器 */}
      {musicInvite.showMusicInviteSelector && (
        <MusicInviteSelector
          onClose={() => musicInvite.setShowMusicInviteSelector(false)}
          onSend={musicInvite.sendMusicInvite}
        />
      )}

      {/* AI备忘录弹窗 */}
      <AIMemoModal
        isOpen={showAIMemoModal}
        onClose={() => setShowAIMemoModal(false)}
        characterId={id || ''}
        characterName={chatState.character?.nickname || chatState.character?.realName || 'AI'}
      />

      <MessageMenu
        isOpen={messageMenu.showMessageMenu}
        message={messageMenu.longPressedMessage}
        menuPosition={messageMenu.menuPosition}
        onClose={() => {
          messageMenu.setShowMessageMenu(false)
          messageMenu.setLongPressedMessage(null)
        }}
        onCopy={messageMenu.handlers.handleCopyMessage}
        onDelete={messageMenu.handlers.handleDeleteMessage}
        onRecall={() => messageMenu.handlers.handleRecallMessage(handleRecallMessage)}
        onQuote={() => messageMenu.handlers.handleQuoteMessage(modals.setQuotedMessage)}
        onEdit={messageMenu.handlers.handleEditMessage}
        onBatchDelete={messageMenu.handlers.handleBatchDelete}
      />

      <TransferSender
        show={transfer.showTransferSender}
        onClose={() => transfer.setShowTransferSender(false)}
        onSend={transfer.handleSendTransfer}
        characterId={chatState.character?.id}
        characterName={chatState.character?.nickname || chatState.character?.realName}
      />

      <VoiceSender
        show={voice.showVoiceSender}
        onClose={() => voice.setShowVoiceSender(false)}
        onSend={voice.handleSendVoice}
      />

      <LocationSender
        show={locationMsg.showLocationSender}
        onClose={() => locationMsg.setShowLocationSender(false)}
        onSend={locationMsg.handleSendLocation}
      />

      <PhotoSender
        isOpen={photo.showPhotoSender}
        onClose={() => photo.setShowPhotoSender(false)}
        onSend={photo.handleSendPhoto}
      />

      <AlbumSelector
        isOpen={photo.showAlbumSelector}
        onClose={() => photo.setShowAlbumSelector(false)}
        onConfirm={photo.handleSendPhotos}
      />

      <IntimatePaySender
        show={intimatePay.showIntimatePaySender}
        onClose={() => intimatePay.setShowIntimatePaySender(false)}
        onSend={intimatePay.handleSendIntimatePay}
        characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
      />


      <IncomingCallScreen
        show={videoCall.showIncomingCall}
        character={{
          name: character.nickname || character.realName,
          avatar: character.avatar
        }}
        isVideoCall={true}
        onAccept={videoCall.acceptCall}
        onReject={videoCall.rejectCall}
      />

      <VideoCallScreen
        show={videoCall.isCallActive}
        character={{
          name: character.nickname || character.realName,
          avatar: character.avatar,
          realName: character.realName
        }}
        onEnd={videoCall.endCall}
        onSendMessage={videoCall.sendMessage}
        onRequestAIReply={videoCall.requestAIReply}
        onAddNarratorMessage={videoCall.addNarratorMessage}
        messages={videoCall.callMessages}
        isAITyping={videoCall.isAITyping}
      />

      <CoupleSpaceQuickMenu
        isOpen={coupleSpace.showMenu}
        onClose={() => coupleSpace.setShowMenu(false)}
        onSelectPhoto={() => {
          coupleSpace.setInputType('photo')
          coupleSpace.setShowInput(true)
        }}
        onSelectMessage={() => {
          coupleSpace.setInputType('message')
          coupleSpace.setShowInput(true)
        }}
        onSelectAnniversary={() => {
          coupleSpace.setInputType('anniversary')
          coupleSpace.setShowInput(true)
        }}
      />

      <CoupleSpaceInputModal
        isOpen={coupleSpace.showInput}
        type={coupleSpace.inputType}
        onClose={() => {
          coupleSpace.setShowInput(false)
          coupleSpace.setInputType(null)
        }}
        onSubmit={coupleSpace.submitContent}
      />

      <ChatModals
        character={character}
        viewingRecalledMessage={modals.viewingRecalledMessage}
        onCloseRecalledMessage={() => modals.setViewingRecalledMessage(null)}
        viewingCallRecord={modals.viewingCallRecord}
        onCloseCallRecord={() => modals.setViewingCallRecord(null)}
      />

      {/* 转发弹窗 */}
      <ForwardModal
        isOpen={multiSelect.showForwardModal}
        onClose={multiSelect.closeForwardModal}
        onConfirm={handleForwardConfirm}
      />

      {/* 查看转发记录弹窗 */}
      {forward.viewingForwardedChat && forward.viewingForwardedChat.forwardedChat && (
        <ForwardedChatViewer
          isOpen={true}
          onClose={() => forward.setViewingForwardedChat(null)}
          title={forward.viewingForwardedChat.forwardedChat.title}
          messages={forward.viewingForwardedChat.forwardedChat.messages}
        />
      )}

      {/* AI帖子生成器 */}
      <PostGenerator
        isOpen={postGenerator.showPostGenerator}
        onClose={() => postGenerator.setShowPostGenerator(false)}
        onGenerate={postGenerator.handleGeneratePost}
        onSend={postGenerator.handleSendPost}
        characterName={chatState.character?.nickname || chatState.character?.realName}
        characterAvatar={chatState.character?.avatar}
        characterId={chatState.character?.id}
        userAvatar={getUserInfo().avatar}
        generatedPost={postGenerator.generatedPost}
        onClearPost={() => postGenerator.setGeneratedPost(null)}
      />

      {/* 🔥 Token统计悬浮按钮 - 右上角玻璃质感 */}
      {!hideTokenStats && chatAI.tokenStats && chatAI.tokenStats.total > 0 && (
        <button
          onClick={() => setShowTokenDetail(!showTokenDetail)}
          className="fixed top-[120px] right-4 z-40 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 btn-press-fast"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'rgba(100, 100, 100, 0.7)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          <span className="font-medium">{(chatAI.tokenStats.total / 1000).toFixed(1)}k</span>
          {chatAI.tokenStats.responseTime && chatAI.tokenStats.responseTime > 0 && (
            <span className="text-[9px] opacity-60">·{(chatAI.tokenStats.responseTime/1000).toFixed(1)}s</span>
          )}
        </button>
      )}

      {/* AI状态详情弹窗 */}
      {showAIStatusModal && (
        <>
          {/* 点击外部关闭 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowAIStatusModal(false)}
          />
          <AIStatusModal
            isOpen={showAIStatusModal}
            onClose={() => setShowAIStatusModal(false)}
            characterName={character.nickname || character.realName}
            characterAvatar={character.avatar}
            status={currentAIStatus}
            onForceUpdate={async () => {
              // 设置强制更新标记
              const { setForceUpdateFlag } = await import('../utils/aiStatusManager')
              setForceUpdateFlag(id || '')
              alert('✅ 已标记状态修正，AI将在下一轮对话时强制更新状态')
            }}
          />
        </>
      )}

      {/* 线下记录对话框 */}
      <OfflineRecordDialog
        isOpen={showOfflineRecordDialog}
        onClose={() => {
          setShowOfflineRecordDialog(false)
          setEditingOfflineRecord(null)
        }}
        onSave={handleSaveOfflineRecord}
        editingMessage={editingOfflineRecord}
      />
    </div>
  )
}

export default ChatDetail
