/**
 * 聊天详情页面（重构版）
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { getUserInfo } from '../utils/userUtils'
import { isMainAccount, getCurrentAccount } from '../utils/accountManager'
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
import EmojiPicker, { type EmojiPickerHandle } from '../components/EmojiPicker'
import MusicInviteSelector from '../components/MusicInviteSelector'
import AIMemoModal from '../components/AIMemoModal'
import AIStatusModal from '../components/AIStatusModal'
import PostGenerator from '../components/PostGenerator'
import FriendRequestModal from '../components/FriendRequestModal'
import JudgmentInputModal from '../components/JudgmentModal'
import ShopManager from '../components/ShopManager'
import ShopViewer from '../components/ShopViewer'
import { TacitGameSelect, TacitTopicCard, TacitDrawPanel, TacitActPanel } from '../components/TacitGamePanel'
import type { Message } from '../types/chat'
import { loadMessages, saveMessages } from '../utils/simpleMessageManager'
import { correctAIMessageFormat } from '../utils/formatCorrector'
import { useChatState, useChatAI, useAddMenu, useMessageMenu, useLongPress, useTransfer, useVoice, useLocationMsg, usePhoto, useVideoCall, useChatNotifications, useCoupleSpace, useModals, useIntimatePay, useMultiSelect, useMusicInvite, useEmoji, useForward, usePaymentRequest, usePostGenerator, usePoke, useWallpaper, useOfflineRecord, useCustomIcons, useJudgment, useTacitGame, useLogistics } from './ChatDetail/hooks'
import LogisticsModal from '../components/LogisticsModal'
import ContactCardSelector from '../components/ContactCardSelector'
import GomokuGame from '../components/GomokuGame'
import ChatModals from './ChatDetail/components/ChatModals'
import ChatHeader from './ChatDetail/components/ChatHeader'
import IntimatePaySender from './ChatDetail/components/IntimatePaySender'
import { useMeasuredMessageWindow } from '../hooks/useMeasuredMessageWindow'
import LoadingSkeleton from './ChatDetail/components/LoadingSkeleton'
import OfflineRecordDialog from './ChatDetail/components/OfflineRecordDialog'
import OfflineSummaryCard from './ChatDetail/components/OfflineSummaryCard'
import { useChatBubbles } from '../hooks/useChatBubbles'
import { MessageBubble } from './ChatDetail/components/MessageBubble'
import { SpecialMessageRenderer } from './ChatDetail/components/SpecialMessageRenderer'
import CheckInCard from '../components/CheckInCard'
import { playLoadMoreSound, playSystemSound } from '../utils/soundManager'
import { blacklistManager } from '../utils/blacklistManager'

// 检测消息是否只包含五子棋指令（应该隐藏）
const isGomokuOnlyMessage = (content?: string): boolean => {
  if (!content) return false
  // 移除五子棋相关指令后检查是否还有其他内容
  const cleaned = content
    .replace(/[\[【]五子棋[\]】]/g, '')
    .replace(/[\[【]下棋[:\：][A-Oa-o]\d{1,2}[\]】]/g, '')
    .replace(/[\[【]悔棋[\]】]/g, '')
    .replace(/[\[【]认输[\]】]/g, '')
    .replace(/[\[【]五子棋[:\：]重新开始[\]】]/g, '')
    .trim()
  // 如果清理后没有内容，说明这条消息只包含五子棋指令
  return cleaned.length === 0
}

const ChatDetail = () => {
  const emojiPickerRef = useRef<EmojiPickerHandle>(null)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // 核心状态
  const chatState = useChatState(id || '')

  // 使用新的hooks
  const { wallpaperStyle, hasCustomWallpaper } = useWallpaper(id)
  const { showOfflineRecordDialog, setShowOfflineRecordDialog, editingOfflineRecord, setEditingOfflineRecord, handleSaveOfflineRecord, handleDeleteOfflineRecord } = useOfflineRecord(id, chatState.messages, chatState.setMessages, chatState.character?.realName)
  const { chatDecorations, customIcons, topBarScale, topBarX, topBarY, bottomBarScale, bottomBarX, bottomBarY } = useCustomIcons()

  const { cssLoaded: bubbleCssLoaded } = useChatBubbles(id)
  const onlineMessages = useMemo(() => chatState.messages.filter(message => message.sceneMode !== 'offline' && message.messageType !== 'gomoku' && !isGomokuOnlyMessage(message.content)), [chatState.messages])
  const paginationBusy = useRef(false)
  const loadOlderMessages = useCallback(() => {
    if (paginationBusy.current || chatState.isLoadingMessages || !chatState.hasMoreMessages) return
    paginationBusy.current = true
    void chatState.loadMoreMessages().finally(() => { paginationBusy.current = false })
  }, [chatState.loadMoreMessages, chatState.isLoadingMessages, chatState.hasMoreMessages])
  const onlineIndices = useMemo(() => new Map(onlineMessages.map((message, index) => [message.id, index])), [onlineMessages])
  const { displayedMessages, virtualStyle, scrollContainerRef: attachScrollContainer, scrollToBottom, isNearBottom, resetVirtualList } = useMeasuredMessageWindow(onlineMessages, bubbleCssLoaded && !!chatState.character)
  useEffect(() => {
    resetVirtualList()
    window.addEventListener('accountSwitched', resetVirtualList)
    return () => window.removeEventListener('accountSwitched', resetVirtualList)
  }, [id, resetVirtualList])

  // 隐藏时间戳设置
  const [hideTimestamp, setHideTimestamp] = useState(() => {
    return localStorage.getItem('hide_message_timestamp') === 'true'
  })
  const [timestampInBubble, setTimestampInBubble] = useState(() => {
    return localStorage.getItem('timestamp_in_bubble') === 'true'
  })
  // 用于强制消息列表刷新的key
  const [timestampRefreshKey, setTimestampRefreshKey] = useState(0)
  
  useEffect(() => {
    const handleTimestampUpdate = () => {
      setHideTimestamp(localStorage.getItem('hide_message_timestamp') === 'true')
      setTimestampInBubble(localStorage.getItem('timestamp_in_bubble') === 'true')
      // 强制消息列表刷新
      setTimestampRefreshKey(k => k + 1)
    }
    window.addEventListener('timestampVisibilityUpdate', handleTimestampUpdate)
    return () => window.removeEventListener('timestampVisibilityUpdate', handleTimestampUpdate)
  }, [])

  // Token 统计详情面板状态
  const [showTokenDetail, setShowTokenDetail] = useState(false)

  // 备忘录弹窗状态
  const [showAIMemoModal, setShowAIMemoModal] = useState(false)

  // 判定对错功能状态由useJudgment hook管理（在下方chatAI初始化后使用）

  // AI状态弹窗
  const [showAIStatusModal, setShowAIStatusModal] = useState(false)
  const [currentAIStatus, setCurrentAIStatus] = useState<any>(null)

  // 🔥 小号总结功能
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryResult, setSummaryResult] = useState<string | null>(null)

  // 🔥 被拉黑状态（AI拉黑了用户）
  const [isBlockedByAI, setIsBlockedByAI] = useState(false)
  // 🔥 好友申请状态：pending=等待对方同意, null=正常
  const [friendRequestStatus, setFriendRequestStatus] = useState<'pending' | null>(null)
  // 🔥 添加好友弹窗
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false)

  // 🛍️ 商城相关状态
  const [showShopManager, setShowShopManager] = useState(false)
  const [showShopViewer, setShowShopViewer] = useState(false)
  const [viewingShopId, setViewingShopId] = useState<string | null>(null)

  // 📇 名片选择器状态
  const [showContactCardSelector, setShowContactCardSelector] = useState(false)

  // ⚫ 五子棋游戏状态
  const [showGomokuGame, setShowGomokuGame] = useState(false)
  const [gomokuAIMove, setGomokuAIMove] = useState<string | undefined>(undefined)

  // 监听AI五子棋落子事件
  useEffect(() => {
    const handleAIMove = (e: CustomEvent<{ position: string }>) => {
      console.log('⚫ [五子棋] 收到AI落子:', e.detail.position)
      setGomokuAIMove(e.detail.position)
    }
    window.addEventListener('gomoku-ai-move', handleAIMove as EventListener)
    return () => window.removeEventListener('gomoku-ai-move', handleAIMove as EventListener)
  }, [])

  // 检测拉黑状态 & 好友申请状态
  useEffect(() => {
    if (!id) return
    const checkBlockStatus = () => {
      const status = blacklistManager.getBlockStatus(`character_${id}`, 'user')
      setIsBlockedByAI(status.blockedByMe) // AI拉黑了用户

      // 检查用户发给AI的好友申请状态
      const pendingRequest = localStorage.getItem(`friend_request_${id}`)
      if (pendingRequest === 'pending') {
        setFriendRequestStatus('pending')
      } else {
        setFriendRequestStatus(null)
      }
    }
    checkBlockStatus()

    // 监听拉黑状态变化
    const handleBlockChange = () => checkBlockStatus()
    window.addEventListener('blacklist-changed', handleBlockChange)
    window.addEventListener('friend-request-changed', handleBlockChange)
    return () => {
      window.removeEventListener('blacklist-changed', handleBlockChange)
      window.removeEventListener('friend-request-changed', handleBlockChange)
    }
  }, [id])

  // 发送好友申请
  const handleSendFriendRequest = useCallback((message: string) => {
    if (!id || !chatState.character) return

    const characterName = chatState.character.nickname || chatState.character.realName
    const now = Date.now()
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    // 保存好友申请状态
    localStorage.setItem(`friend_request_${id}`, 'pending')
    setFriendRequestStatus('pending')

    // 添加系统消息：你已添加对方为好友，等待对方同意
    const systemMsg: Message = {
      id: now,
      type: 'system',
      messageType: 'system',
      content: `你已添加${characterName}为好友，等待对方同意\n验证消息：${message}`,
      time: timeStr,
      timestamp: now,
      aiReadableContent: `[用户发送了好友申请，验证消息: "${message}"，请决定是否接受，使用[接受好友]或[拒绝好友]回应]`
    }

    chatState.setMessages(prev => {
      const updated = [...prev, systemMsg]
      saveMessages(id, updated)
      return updated
    })

    console.log('📤 已发送好友申请:', message)
  }, [id, chatState])

  // 🔥 当前账号头像（考虑小号）
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('')
  useEffect(() => {
    const loadCurrentUserAvatar = async () => {
      const { getCurrentUserInfoWithAvatar } = await import('../utils/userUtils')
      const userInfo = await getCurrentUserInfoWithAvatar()
      setCurrentUserAvatar(userInfo.avatar || '')
    }
    loadCurrentUserAvatar()

    // 监听账号切换事件
    const handleAccountSwitch = () => { loadCurrentUserAvatar() }
    window.addEventListener('accountSwitched', handleAccountSwitch)
    window.addEventListener('accountUpdated', handleAccountSwitch)
    return () => {
      window.removeEventListener('accountSwitched', handleAccountSwitch)
      window.removeEventListener('accountUpdated', handleAccountSwitch)
    }
  }, [])

  const handleSubAccountSummary = async () => {
    if (!id || !chatState.character || isSummarizing) return

    const account = getCurrentAccount()
    if (!account || account.isMain) return

    setIsSummarizing(true)
    try {
      const { generateSummary, saveSummary } = await import('../utils/subAccountSummary')
      const messages = loadMessages(id)

      if (messages.length === 0) {
        setSummaryResult('暂无聊天记录可总结')
        return
      }

      const summary = await generateSummary(
        id,
        chatState.character.nickname || chatState.character.realName,
        account.id,
        account.name,
        messages
      )

      // 获取对话时间范围
      const startTime = messages.length > 0 ? messages[0].timestamp : Date.now()
      const endTime = messages.length > 0 ? messages[messages.length - 1].timestamp : Date.now()

      saveSummary({
        accountId: account.id,
        accountName: account.name,
        characterId: id,
        summary,
        timestamp: Date.now(),
        messageCount: messages.length,
        startTime,
        endTime
      })

      setSummaryResult(summary)
    } catch (error) {
      console.error('总结失败:', error)
      setSummaryResult('总结失败：' + (error as Error).message)
    } finally {
      setIsSummarizing(false)
    }
  }

  // 处理状态栏点击
  const handleStatusClick = async () => {
    if (!id || !chatState.character) return
    const { getOrCreateAIStatus } = await import('../utils/aiStatusManager')
    const status = getOrCreateAIStatus(id, chatState.character.nickname || chatState.character.realName)
    setCurrentAIStatus(status)
    setShowAIStatusModal(true)
  }

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

  // 监听角色信息更新事件
  useEffect(() => {
    const handleCharacterUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ characterId: string }>
      if (customEvent.detail.characterId === id) {
        console.log('🔄 检测到角色信息更新，刷新角色数据')
        chatState.refreshCharacter()
      }
    }

    window.addEventListener('character-updated', handleCharacterUpdate)
    return () => window.removeEventListener('character-updated', handleCharacterUpdate)
  }, [id, chatState])

  // 📇 发送名片
  const handleSendContactCard = useCallback((targetCharacter: { id: string; realName: string; nickname?: string; avatar?: string; signature?: string }) => {
    if (!id || !chatState.character) return

    const now = Date.now()
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const targetName = targetCharacter.nickname || targetCharacter.realName

    // 创建名片消息
    const contactCardMsg: Message = {
      id: now,
      type: 'sent',
      messageType: 'contactCard',
      content: `[名片] ${targetName}`,
      aiReadableContent: `[用户发送了${targetName}的名片给你，你可以使用[添加好友:${targetCharacter.id}]来添加这个人]`,
      time: timeStr,
      timestamp: now,
      contactCard: {
        characterId: targetCharacter.id,
        characterName: targetName,
        characterAvatar: targetCharacter.avatar,
        signature: targetCharacter.signature,
        addedByAI: false
      }
    }

    chatState.setMessages(prev => {
      const updated = [...prev, contactCardMsg]
      saveMessages(id, updated)
      return updated
    })

    console.log('📇 发送名片:', targetName)
  }, [id, chatState])

  // 移除组件卸载时的保存逻辑，因为addMessage已经会自动备份了
  // 组件卸载时保存可能会用过时的React状态覆盖最新的备份

  const videoCall = useVideoCall(id || '', chatState.character, chatState.messages, chatState.setMessages)
  const chatAI = useChatAI(id || '', chatState.character, chatState.messages, chatState.setMessages, chatState.setError, videoCall.receiveIncomingCall, chatState.refreshCharacter, videoCall.endCall, showGomokuGame)

  // 清理宠物领养标记（不自动触发AI回复，让用户自己决定）
  useEffect(() => {
    if (!id) return
    const pendingAdoption = localStorage.getItem('pending_pet_adoption')
    if (pendingAdoption) {
      try {
        const data = JSON.parse(pendingAdoption)
        if (data.characterId === id) {
          localStorage.removeItem('pending_pet_adoption')
        }
      } catch (e) {
        localStorage.removeItem('pending_pet_adoption')
      }
    }
  }, [id])

  // 判定对错功能
  const judgment = useJudgment(id, chatState.character, chatState.messages, chatState.setMessages)

  // 💕 默契游戏 Hook
  const tacitGame = useTacitGame({
    characterId: id,
    characterName: chatState.character?.nickname || chatState.character?.realName || 'TA',
    saveMessages,
    setMessages: chatState.setMessages,
    messages: chatState.messages,
    scrollToBottom: () => chatAI.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
    playSound: playSystemSound
  })

  // 拍一拍功能
  const { handlePoke } = usePoke(id, chatState.character, chatState.messages, chatState.setMessages)

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

  // 物流功能（只读模式，不再发送消息）
  const logistics = useLogistics()

  // 格式修正处理器
  const handleFormatCorrection = useCallback(async () => {
    if (!id) return

    // 获取最后一轮AI消息（从最后一条用户消息之后的所有AI消息）
    const lastUserMsgIndex = [...chatState.messages].reverse().findIndex(m => m.type === 'sent')
    if (lastUserMsgIndex === -1) {
      alert('没有找到用户消息')
      return
    }

    const actualIndex = chatState.messages.length - 1 - lastUserMsgIndex
    const lastRoundAIMessages = chatState.messages.slice(actualIndex + 1).filter(m => m.type === 'received')

    if (lastRoundAIMessages.length === 0) {
      alert('没有找到AI消息')
      return
    }

    // 修正所有消息
    let totalCorrections: string[] = []
    const updatedMessages = chatState.messages.map(msg => {
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

    // 🔥 重新执行命令处理：从 commandHandlers 导入
    const { commandHandlers } = await import('./ChatDetail/hooks/commandHandlers')

    // 记录需要移除的消息ID（纯指令消息处理后应该删除）
    const messagesToRemove: Set<number | string> = new Set()

    // 处理每条修正后的消息
    for (const msg of updatedMessages) {
      const isTargetMessage = lastRoundAIMessages.some(m => m.id === msg.id)
      if (!isTargetMessage || !msg.content) continue

      let currentContent = msg.content
      let hasCommand = true

      // 循环处理所有指令
      while (hasCommand) {
        hasCommand = false
        for (const handler of commandHandlers) {
          const match = currentContent.match(handler.pattern)
          if (match) {
            console.log(`🔧 [格式修正] 检测到指令，重新执行:`, match[0])
            const result = await handler.handler(match, currentContent, {
              messages: updatedMessages,
              setMessages: chatState.setMessages,
              character: chatState.character,
              chatId: id,
              isBlocked: false
            })
            
            // 🔥 更新消息内容为剩余文本
            if (result.handled && result.remainingText !== undefined) {
              currentContent = result.remainingText
              msg.content = currentContent
              hasCommand = !!currentContent.trim() // 如果还有内容，继续检查其他指令
            }
            break
          }
        }
      }

      // 如果处理后消息内容为空，标记为需要移除
      if (!msg.content || !msg.content.trim()) {
        messagesToRemove.add(msg.id)
      }
    }

    // 过滤掉空消息
    const finalMessages = updatedMessages.filter(m => !messagesToRemove.has(m.id))

    // 保存到存储
    saveMessages(id, finalMessages)

    // 更新React状态
    chatState.setMessages(finalMessages)

    // 显示修正结果
    alert(`已修正最后一轮 ${lastRoundAIMessages.length} 条消息，共 ${totalCorrections.length} 处格式错误：\n${totalCorrections.join('\n')}\n\n命令已重新执行，请查看效果`)
  }, [id, chatState.messages, chatState.setMessages, chatState.character])

  // 分享音乐处理
  const handleShareMusic = useCallback((title: string, artist: string, cover?: string) => {
    if (!id) return

    // 创建音乐分享消息
    const musicShareMsg: Message = {
      id: Date.now() + Math.random(),
      type: 'sent',
      messageType: 'musicShare',
      content: `分享音乐：${title} - ${artist}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      musicShare: {
        songTitle: title,
        songArtist: artist,
        songCover: cover
      },
      aiReadableContent: `[用户分享了音乐: ${title} - ${artist}]`
    }

    // 添加到消息列表并保存
    chatState.setMessages(prev => {
      const updated = [...prev, musicShareMsg]
      saveMessages(id, updated)
      return updated
    })

    console.log('🎵 分享音乐:', title, '-', artist)
  }, [id, chatState])

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
    handleFormatCorrection,  // 格式修正
    () => navigate(`/chat/${id}/weather`),  // 天气
    () => navigate(`/envelope?characterId=${id}`),  // 信封
    () => judgment.setShowJudgmentModal(true),  // 判定对错
    () => logistics.openLogistics(),  // 物流
    () => setShowContactCardSelector(true),  // 名片
    () => setShowGomokuGame(true)  // 五子棋
  )

  // 多选模式
  const multiSelect = useMultiSelect(
    id || '',
    chatState.messages,
    chatState.setMessages,
    chatState.character?.nickname || chatState.character?.realName,
    chatState.character?.avatar
  )

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

  const shouldUseVirtualization = onlineMessages.length > 60


  // 🔥 优化：使用useCallback确保返回按钮始终可用
  const handleBack = useCallback(() => {
    navigate('/wechat')
  }, [navigate])



  // 🔥 优化：输入框处理函数，避免重复创建
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    chatState.setInputValue(e.target.value)
  }, [chatState])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !chatAI.isAiTyping) {
      e.preventDefault()
      if (chatState.inputValue.trim()) {
        chatAI.handleSend(chatState.inputValue, chatState.setInputValue, modals.quotedMessage, () => modals.setQuotedMessage(null))
      } else if (!tacitGame.gameType || tacitGame.hasSent) {
        // 游戏模式下已发送画作/描述后也可以触发AI回复
        chatAI.handleAIReply()
      }
    }
  }, [chatAI, chatState, modals, tacitGame.gameType, tacitGame.hasSent])

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

    // 🔥 生成更详细的撤回内容描述，让AI能理解撤回了什么
    const getRecalledContentDescription = (msg: Message): string => {
      // 情侣空间邀请
      if (msg.coupleSpaceInvite) {
        return `[情侣空间邀请] 发起人:${msg.coupleSpaceInvite.senderName} 状态:${msg.coupleSpaceInvite.status}`
      }
      // 亲密付
      if (msg.intimatePay) {
        return `[亲密付邀请] 额度:${msg.intimatePay.monthlyLimit}元 状态:${msg.intimatePay.status}`
      }
      // 表情包
      if (msg.emoji) {
        return `[表情包] ${msg.emoji.name}: ${msg.emoji.description}`
      }
      // 小剧场
      if (msg.theatre) {
        return `[小剧场卡片] ${msg.theatre.templateName}: ${msg.theatre.rawData}`
      }
      // 中插HTML小剧场
      if (msg.messageType === 'theatre-html') {
        return `[中插HTML小剧场] ${msg.content?.substring(0, 100) || 'HTML卡片'}`
      }
      // 转账
      if (msg.transfer) {
        return `[转账] ${msg.transfer.amount}元 ${msg.transfer.message || ''} 状态:${msg.transfer.status}`
      }
      // 语音
      if (msg.voiceText || msg.messageType === 'voice') {
        return `[语音消息] ${msg.voiceText || '语音'} 时长:${msg.duration || 0}秒`
      }
      // 照片
      if (msg.photoDescription || msg.messageType === 'photo') {
        return `[照片] ${msg.photoDescription || '图片'}`
      }
      // 位置
      if (msg.location) {
        return `[位置] ${msg.location.name}: ${msg.location.address}`
      }
      // 音乐邀请
      if (msg.musicInvite) {
        return `[一起听邀请] ${msg.musicInvite.songTitle} - ${msg.musicInvite.songArtist}`
      }
      // 音乐分享
      if (msg.musicShare) {
        return `[音乐分享] ${msg.musicShare.songTitle} - ${msg.musicShare.songArtist}`
      }
      // 代付请求
      if (msg.paymentRequest) {
        return `[代付请求] ${msg.paymentRequest.itemName} ${msg.paymentRequest.amount}元`
      }
      // 商品卡片
      if (msg.productCard) {
        return `[商品] ${msg.productCard.name} ${msg.productCard.price}元`
      }
      // 帖子
      if (msg.post) {
        return `[帖子] ${msg.post.prompt || msg.post.content?.substring(0, 50)}`
      }
      // 拍一拍
      if (msg.poke) {
        return `[拍一拍] ${msg.poke.fromName}拍了拍${msg.poke.toName}${msg.poke.suffix || ''}`
      }
      // 购物车
      if (msg.shoppingCart) {
        return `[购物车] ${msg.shoppingCart.items.length}件商品 共${msg.shoppingCart.totalAmount}元`
      }
      // 名片
      if (msg.contactCard) {
        return `[名片] ${msg.contactCard.characterName}`
      }
      // 普通文本
      return msg.content || '消息'
    }

    // 从IndexedDB加载消息
    const messages = loadMessages(id || '')
    const updatedMessages = messages.map(msg =>
      msg.id === message.id
        ? {
          ...msg,
          isRecalled: true,
          recalledContent: getRecalledContentDescription(msg),
          recallReason: '',
          originalType: originalMessageType,
          content: isUserMessage ? '你撤回了一条消息' : (chatState.character?.realName || '对方') + '撤回了一条消息',
          // 🔥 添加AI可读内容，让AI知道撤回了什么
          aiReadableContent: `[撤回消息] ${isUserMessage ? '用户' : chatState.character?.realName || '对方'}撤回了: ${getRecalledContentDescription(msg)}`,
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

  // 🛍️ 商城功能处理函数
  const handleSelectShop = () => {
    playSystemSound()
    setShowShopManager(true)
  }

  const handleShareShop = (shareData: any) => {
    // 使用完整商品列表让AI看到所有商品
    const productsInfo = (shareData.allProducts || shareData.previewProducts || [])
      .map((p: any) => `${p.name}(¥${p.price}${p.description ? `, ${p.description}` : ''})`)
      .join('、')
    
    const message: Message = {
      id: Date.now(),
      type: 'sent',
      messageType: 'shop',
      content: `[店铺] ${shareData.shopName}`,
      aiReadableContent: `[用户分享了自己的店铺"${shareData.shopName}"，里面有${shareData.productCount}件商品，完整商品列表：${productsInfo}。你可以用[购买:商品名,价格:备注]格式购买这些商品，购买后用户的零钱会增加]`,
      shopShare: shareData,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }

    chatState.setMessages(prev => {
      const updated = [...prev, message]
      if (id) saveMessages(id, updated)
      return updated
    })

    chatAI.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleViewShop = (shopId: string) => {
    setViewingShopId(shopId)
    setShowShopViewer(true)
  }

  const handlePurchaseProduct = (product: any) => {
    const message: Message = {
      id: Date.now(),
      type: 'sent',
      content: `我要购买：${product.name}`,
      aiReadableContent: `[用户想要购买"${product.name}"(¥${product.price})，这是一个${product.category}商品：${product.description}。请回复购买确认或者拒绝]`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }

    chatState.setMessages(prev => {
      const updated = [...prev, message]
      if (id) saveMessages(id, updated)
      return updated
    })

    setShowShopViewer(false)
    setViewingShopId(null)

    // 触发AI回复
    setTimeout(() => {
      chatAI.handleAIReply()
    }, 500)
  }

  // 🛍️ 监听店铺查看事件
  useEffect(() => {
    const handleViewShopEvent = (e: any) => {
      handleViewShop(e.detail.shopId)
    }
    window.addEventListener('view-shop', handleViewShopEvent)
    return () => window.removeEventListener('view-shop', handleViewShopEvent)
  }, [])

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
      className="h-screen flex flex-col soft-page-enter"
      style={wallpaperStyle}
      {...(hasCustomWallpaper ? { 'data-chat-wallpaper': true } : {})}
    >
      <ChatHeader
        characterName={character.remark || character.nickname || character.realName}
        characterId={id}
        isAiTyping={chatAI.isAiTyping}
        onBack={handleBack}
        onMenuClick={() => {
          if (isMainAccount()) {
            navigate(`/chat/${id}/settings`)
          } else {
            handleSubAccountSummary()
          }
        }}
        onStatusClick={handleStatusClick}
        topBarImage={customIcons['chat-topbar-bg'] || chatDecorations.topBar}
        topBarScale={topBarScale}
        topBarX={topBarX}
        topBarY={topBarY}
        customIcons={customIcons}
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
                <span className="text-gray-600">{(chatAI.tokenStats.responseTime / 1000).toFixed(2)}s</span>
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

      {/* 💕 默契游戏悬浮题目卡片 */}
      {tacitGame.gameType && tacitGame.topic && (
        <TacitTopicCard
          topic={tacitGame.topic}
          gameType={tacitGame.gameType}
          onChangeTopic={tacitGame.changeTopic}
          onSetCustomTopic={tacitGame.setCustomTopic}
          onClose={tacitGame.endGame}
          onOpenPanel={tacitGame.openPanel}
          isPanelOpen={tacitGame.showPanel}
          hasSent={tacitGame.hasSent}
          isAiTyping={chatAI.isAiTyping}
          isJudging={tacitGame.isJudging}
          isRefreshing={tacitGame.isRefreshing}
          remainingCount={tacitGame.remainingCount}
        />
      )}

      <div
        ref={attachScrollContainer} data-testid="private-message-list" data-loaded-count={onlineMessages.length} onScroll={event => { if (event.currentTarget.scrollTop < 100) loadOlderMessages() }}
        className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll"
        style={{
          WebkitOverflowScrolling: 'touch',
          overflowAnchor: 'none',
          willChange: 'scroll-position',
          transform: 'translateZ(0)', // 🚀 GPU加速
          paddingTop: tacitGame.gameType ? '100px' : undefined // 给题目卡片留空间
        }}
      >
        {/* 🔥 加载状态骨架屏 - 等待消息和气泡CSS都加载完成 */}
        {(chatState.isLoadingMessages && chatState.messages.length === 0) || !bubbleCssLoaded ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* 🔥 加载更多按钮 - 显示在消息列表顶部 */}
            {chatState.hasMoreMessages && (
              <div data-message-header className="flex justify-center py-3 mb-2">
                {chatState.isLoadingMessages ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <span>加载中...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      playLoadMoreSound() // 🎵 播放加载音效
                      loadOlderMessages()
                    }}
                    className="text-sm text-blue-500 hover:text-blue-600 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors active:scale-95"
                  >
                    点击加载更多历史消息
                  </button>
                )}
              </div>
            )}

            <div style={{ height: virtualStyle.paddingTop }} />
            {displayedMessages.map((message) => {
              const renderMessage = () => {
                const index = onlineIndices.get(message.id) || 0
                const prevMsg = onlineMessages[index - 1]
                // 判断是否需要显示时间戳（两条消息间隔超过5分钟就显示）
                let shouldShow5MinTimestamp = false

                if (index === 0) {
                  shouldShow5MinTimestamp = true
                } else if (message.timestamp && prevMsg?.timestamp) {
                  // 计算两条消息之间的时间差
                  const timeDiff = message.timestamp - prevMsg.timestamp
                  // 如果时间差超过5分钟，显示时间戳
                  shouldShow5MinTimestamp = timeDiff >= 5 * 60 * 1000  // 5分钟 = 300000毫秒
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
                  // 🔥 如果是只给AI看的消息，不在界面显示
                  if (message.aiOnly) {
                    return null
                  }

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
                    const isSelectable = multiSelect.isMessageSelectable(message)
                    const isSelected = multiSelect.selectedMessageIds.has(message.id)
                    return (
                      <div key={message.id} className="flex items-start gap-2">
                        {/* 多选复选框 */}
                        {multiSelect.isMultiSelectMode && (
                          <div
                            className="flex items-center justify-center flex-shrink-0 mt-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              isSelectable && multiSelect.toggleMessageSelection(message.id)
                            }}
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!isSelectable
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
                        <div className="flex-1">
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
                              onClick={() => {
                                if (multiSelect.isMultiSelectMode) {
                                  isSelectable && multiSelect.toggleMessageSelection(message.id)
                                } else {
                                  modals.setViewingCallRecord(message)
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <rect x="2" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                                  <path d="M18 10l4-2v8l-4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </svg>
                                <span>{message.content}</span>
                              </div>
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

                  // 🔥 忙碌/不回消息卡片（用 SpecialMessageRenderer 渲染）
                  if (message.messageType === 'busy') {
                    const isSelectable = multiSelect.isMessageSelectable(message)
                    const isSelected = multiSelect.selectedMessageIds.has(message.id)
                    return (
                      <div 
                        key={message.id}
                        className="flex items-start gap-2"
                      >
                        {/* 多选复选框 */}
                        {multiSelect.isMultiSelectMode && (
                          <div
                            className="flex items-center justify-center flex-shrink-0 mt-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              isSelectable && multiSelect.toggleMessageSelection(message.id)
                            }}
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!isSelectable
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
                        <div className="flex-1">
                          {shouldShow5MinTimestamp && (
                            <div className="flex justify-center my-2">
                              <div className="bg-gray-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                <div className="text-xs text-gray-500">{timestamp5MinText}</div>
                              </div>
                            </div>
                          )}
                          <SpecialMessageRenderer
                            message={message}
                            characterId={chatState.character?.id || ''}
                            characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
                            characterAvatar={chatState.character?.avatar}
                          />
                        </div>
                      </div>
                    )
                  }

                  // 🎭 中插HTML小剧场卡片（用 SpecialMessageRenderer 渲染）
                  if (message.messageType === 'theatre-html') {
                    const isSelectable = multiSelect.isMessageSelectable(message)
                    const isSelected = multiSelect.selectedMessageIds.has(message.id)
                    return (
                      <div 
                        key={message.id}
                        className="flex items-start gap-2"
                      >
                        {/* 多选复选框 */}
                        {multiSelect.isMultiSelectMode && (
                          <div
                            className="flex items-center justify-center flex-shrink-0 mt-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              isSelectable && multiSelect.toggleMessageSelection(message.id)
                            }}
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!isSelectable
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
                        <div className="flex-1">
                          {shouldShow5MinTimestamp && (
                            <div className="flex justify-center my-2">
                              <div className="bg-gray-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                <div className="text-xs text-gray-500">{timestamp5MinText}</div>
                              </div>
                            </div>
                          )}
                          <SpecialMessageRenderer
                            message={message}
                            characterId={chatState.character?.id || ''}
                            characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
                            characterAvatar={chatState.character?.avatar}
                          />
                        </div>
                      </div>
                    )
                  }

                  // 🎯 默契游戏结果卡片（用 SpecialMessageRenderer 渲染）
                  if (message.messageType === 'tacitGameResult' && message.tacitGameResult) {
                    const isSelectable = multiSelect.isMessageSelectable(message)
                    const isSelected = multiSelect.selectedMessageIds.has(message.id)
                    return (
                      <div 
                        key={message.id}
                        className="flex items-start gap-2"
                      >
                        {/* 多选复选框 */}
                        {multiSelect.isMultiSelectMode && (
                          <div
                            className="flex items-center justify-center flex-shrink-0 mt-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              isSelectable && multiSelect.toggleMessageSelection(message.id)
                            }}
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!isSelectable
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
                        <div className="flex-1">
                          {shouldShow5MinTimestamp && (
                            <div className="flex justify-center my-2">
                              <div className="bg-gray-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                <div className="text-xs text-gray-500">{timestamp5MinText}</div>
                              </div>
                            </div>
                          )}
                          <SpecialMessageRenderer
                            message={message}
                            characterId={chatState.character?.id || ''}
                            characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
                            characterAvatar={chatState.character?.avatar}
                          />
                        </div>
                      </div>
                    )
                  }

                  // 🐾 宠物领养卡片（用 SpecialMessageRenderer 渲染）
                  if ((message as any).petAdoption) {
                    const isSelectable = multiSelect.isMessageSelectable(message)
                    const isSelected = multiSelect.selectedMessageIds.has(message.id)
                    return (
                      <div 
                        key={message.id}
                        className="flex items-start gap-2"
                      >
                        {multiSelect.isMultiSelectMode && (
                          <div
                            className="flex items-center justify-center flex-shrink-0 mt-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              isSelectable && multiSelect.toggleMessageSelection(message.id)
                            }}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!isSelectable
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
                        <div className="flex-1">
                          {shouldShow5MinTimestamp && (
                            <div className="flex justify-center my-2">
                              <div className="bg-gray-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                <div className="text-xs text-gray-500">{timestamp5MinText}</div>
                              </div>
                            </div>
                          )}
                          <SpecialMessageRenderer
                            message={message}
                            characterId={chatState.character?.id || ''}
                            characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
                            characterAvatar={chatState.character?.avatar}
                            onAcceptInvite={() => {}}
                            onRejectInvite={() => {}}
                            onUpdateIntimatePayStatus={() => {}}
                            onViewForwardedChat={() => {}}
                          />
                        </div>
                      </div>
                    )
                  }

                  // 🛍️ 购买消息卡片（用 SpecialMessageRenderer 渲染）
                  if (message.messageType === 'purchase' && message.purchaseData) {
                    const isSelectable = multiSelect.isMessageSelectable(message)
                    const isSelected = multiSelect.selectedMessageIds.has(message.id)
                    return (
                      <div 
                        key={message.id}
                        className="flex items-start gap-2"
                      >
                        {/* 多选复选框 */}
                        {multiSelect.isMultiSelectMode && (
                          <div
                            className="flex items-center justify-center flex-shrink-0 mt-4"
                            onClick={(e) => {
                              e.stopPropagation()
                              isSelectable && multiSelect.toggleMessageSelection(message.id)
                            }}
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!isSelectable
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
                        <div className="flex-1">
                          {shouldShow5MinTimestamp && (
                            <div className="flex justify-center my-2">
                              <div className="bg-gray-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                <div className="text-xs text-gray-500">{timestamp5MinText}</div>
                              </div>
                            </div>
                          )}
                          <SpecialMessageRenderer
                            message={message}
                            characterId={chatState.character?.id || ''}
                            characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
                            characterAvatar={chatState.character?.avatar}
                          />
                        </div>
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
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!isSelectable
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
                          onPoke={message.type === 'received' ? handlePoke : undefined}
                        />
                      </div>

                      <div 
                        className={'flex flex-col ' + (message.coupleSpaceInvite ? '' : 'max-w-[70%] ') + (message.type === 'sent' ? 'items-end' : 'items-start')}
                        onTouchStart={(e) => longPress.handleLongPressStart(message, e)}
                        onTouchEnd={longPress.handleLongPressEnd}
                        onMouseDown={(e) => longPress.handleLongPressStart(message, e)}
                        onMouseUp={longPress.handleLongPressEnd}
                        onMouseLeave={longPress.handleLongPressEnd}
                      >
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

                          {/* 🔥 HTML消息检测 - 用iframe渲染 */}
                          {(message.messageType === 'html' || 
                            (message.content && (
                              message.content.includes('<!DOCTYPE') || 
                              message.content.includes('<html') ||
                              message.content.includes('<body')
                            ))
                          ) ? (
                            <div className="html-message-content">
                              <iframe
                                srcDoc={message.content || ''}
                                style={{
                                  width: '280px',
                                  height: '420px',
                                  border: 'none',
                                  borderRadius: '12px',
                                  background: '#fff'
                                }}
                                sandbox="allow-same-origin allow-scripts"
                                title="HTML内容"
                              />
                            </div>
                          ) : message.coupleSpaceInvite ||
                            (message as any).petAdoption ||
                            message.messageType === 'intimatePay' ||
                            message.messageType === 'forwarded-chat' ||
                            message.messageType === 'emoji' ||
                            message.messageType === 'transfer' ||
                            message.messageType === 'voice' ||
                            message.messageType === 'location' ||
                            message.messageType === 'photo' ||
                            message.messageType === 'paymentRequest' ||
                            message.messageType === 'productCard' ||
                            message.messageType === 'shoppingCart' ||
                            message.messageType === 'cartPaymentRequest' ||
                            message.messageType === 'post' ||
                            message.messageType === 'theatre' ||
                            message.messageType === 'poke' ||
                            message.messageType === 'purchase' ||
                            message.messageType === 'musicShare' ||
                            message.messageType === 'friendRequest' ||
                            message.messageType === 'judgment' ||
                            message.messageType === 'shop' ||
                            message.messageType === 'busy' ||
                            message.messageType === 'contactCard' ||
                            (message.messageType as any) === 'musicInvite' ||
                            (message.messageType as any) === 'emojiDrawInvite' ||
                            (message.messageType as any) === 'emojiDraw' ||
                            (message.messageType as any) === 'guessResult' ? (
                            <SpecialMessageRenderer
                              message={message}
                              characterId={chatState.character?.id || ''}
                              characterName={chatState.character?.nickname || chatState.character?.realName || '对方'}
                              onAcceptInvite={coupleSpace.acceptInvite}
                              onRejectInvite={coupleSpace.rejectInvite}
                              onAcceptMusicInvite={musicInvite.acceptInvite}
                              onRejectMusicInvite={musicInvite.rejectInvite}
                              onUpdateIntimatePayStatus={async (messageId, newStatus) => {
                                // 🔥 获取用户名称
                                const userInfo = getUserInfo()
                                const userName = userInfo.nickname || userInfo.realName || '用户'
                                const characterName = chatState.character?.nickname || chatState.character?.realName || '对方'

                                let updatedMessages: Message[] = []
                                chatState.setMessages(prev => {
                                  updatedMessages = prev.map(msg => {
                                    if (msg.id === messageId && msg.intimatePay) {
                                      // 🔥 根据状态生成AI可读内容
                                      const monthlyLimit = msg.intimatePay.monthlyLimit
                                      let aiReadableContent = ''
                                      if (msg.type === 'received') {
                                        // AI发给用户的亲密付
                                        if (newStatus === 'accepted') {
                                          aiReadableContent = `[${userName}接受了你的亲密付邀请，额度¥${monthlyLimit.toFixed(2)}/月]`
                                        } else if (newStatus === 'rejected') {
                                          aiReadableContent = `[${userName}拒绝了你的亲密付邀请，额度¥${monthlyLimit.toFixed(2)}/月]`
                                        }
                                      } else {
                                        // 用户发给AI的亲密付
                                        if (newStatus === 'accepted') {
                                          aiReadableContent = `[${characterName}接受了你的亲密付邀请，额度¥${monthlyLimit.toFixed(2)}/月]`
                                        } else if (newStatus === 'rejected') {
                                          aiReadableContent = `[${characterName}拒绝了你的亲密付邀请，额度¥${monthlyLimit.toFixed(2)}/月]`
                                        }
                                      }
                                      return {
                                        ...msg,
                                        intimatePay: { ...msg.intimatePay, status: newStatus as 'pending' | 'accepted' | 'rejected' },
                                        aiReadableContent
                                      }
                                    }
                                    return msg
                                  })
                                  return updatedMessages
                                })
                                // 🔥 保存到IndexedDB
                                if (id && updatedMessages.length > 0) {
                                  await saveMessages(id, updatedMessages)
                                  console.log('💾 [亲密付状态更新] 已保存到数据库，AI可读内容已添加')
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
                              onAcceptCartPayment={paymentRequest.acceptCartPayment}
                              onRejectCartPayment={paymentRequest.rejectCartPayment}
                              onAcceptFriendRequest={(messageId) => {
                                // 解除拉黑
                                if (id) {
                                  blacklistManager.unblockUser('user', `character_${id}`)
                                  localStorage.removeItem(`ai_friend_request_${id}`)
                                }
                                // 更新消息状态：更新好友申请卡片 + 清除所有AI消息的blocked标记
                                chatState.setMessages(prev => {
                                  const updated = prev.map(msg => {
                                    // 更新好友申请卡片状态
                                    if (msg.id === messageId && msg.friendRequest) {
                                      return {
                                        ...msg,
                                        blocked: false,
                                        friendRequest: { ...msg.friendRequest, status: 'accepted' as const },
                                        aiReadableContent: '[用户接受了你的好友申请，现在可以正常聊天了]'
                                      }
                                    }
                                    // 清除所有AI消息的blocked标记
                                    if (msg.type === 'received' && msg.blocked) {
                                      return { ...msg, blocked: false }
                                    }
                                    return msg
                                  })
                                  saveMessages(id!, updated)
                                  return updated
                                })
                                // 添加系统消息
                                const characterName = chatState.character?.nickname || chatState.character?.realName || '对方'
                                const systemMsg: Message = {
                                  id: Date.now(),
                                  type: 'system',
                                  messageType: 'system',
                                  content: `你已通过${characterName}的好友申请`,
                                  time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                                  timestamp: Date.now(),
                                  aiReadableContent: '[用户接受了你的好友申请]'
                                }
                                chatState.setMessages(prev => {
                                  const updated = [...prev, systemMsg]
                                  saveMessages(id!, updated)
                                  return updated
                                })
                                window.dispatchEvent(new CustomEvent('blacklist-changed'))
                                window.dispatchEvent(new CustomEvent('friend-request-changed'))
                              }}
                              onRejectFriendRequest={(messageId) => {
                                // 清除申请状态但保持拉黑
                                if (id) {
                                  localStorage.removeItem(`ai_friend_request_${id}`)
                                }
                                // 更新消息状态
                                chatState.setMessages(prev => {
                                  const updated = prev.map(msg => {
                                    if (msg.id === messageId && msg.friendRequest) {
                                      return {
                                        ...msg,
                                        friendRequest: { ...msg.friendRequest, status: 'rejected' as const },
                                        aiReadableContent: '[用户拒绝了你的好友申请]'
                                      }
                                    }
                                    return msg
                                  })
                                  saveMessages(id!, updated)
                                  return updated
                                })
                                // 添加系统消息
                                const characterName = chatState.character?.nickname || chatState.character?.realName || '对方'
                                const systemMsg: Message = {
                                  id: Date.now(),
                                  type: 'system',
                                  messageType: 'system',
                                  content: `你已拒绝${characterName}的好友申请`,
                                  time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                                  timestamp: Date.now(),
                                  aiReadableContent: '[用户拒绝了你的好友申请]'
                                }
                                chatState.setMessages(prev => {
                                  const updated = [...prev, systemMsg]
                                  saveMessages(id!, updated)
                                  return updated
                                })
                                window.dispatchEvent(new CustomEvent('friend-request-changed'))
                              }}
                              onRequestJudgment={judgment.requestJudgment}
                              onRespondToAppeal={judgment.startRespondToAppeal}
                              isJudging={judgment.isJudging}
                            />
                          ) : message.messageType === 'checkIn' && message.checkIn ? (
                            <CheckInCard message={message} />
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

                        {/* 时间戳 - 显示在气泡下方居中（如果不是在气泡内显示） */}
                        {!hideTimestamp && !timestampInBubble && (
                          <div className="flex justify-center mt-1">
                            <div className="text-xs text-gray-400">
                              {message.time}
                            </div>
                          </div>
                        )}

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
              }
              return <div key={`${message.id}-${timestampRefreshKey}`} data-message-id={message.id} style={{ display: 'flow-root' }}>{renderMessage()}</div>
              })}
            <div style={{ height: virtualStyle.paddingBottom }} />
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
                onPoke={handlePoke}
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
              {/* 收藏按钮 */}
              <button
                onClick={multiSelect.favoriteSelectedMessages}
                disabled={multiSelect.selectedMessageIds.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${multiSelect.selectedMessageIds.size > 0
                  ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                收藏
              </button>
              {/* 转发按钮 */}
              <button
                onClick={multiSelect.openForwardModal}
                disabled={multiSelect.selectedMessageIds.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${multiSelect.selectedMessageIds.size > 0
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
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${multiSelect.selectedMessageIds.size > 0
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
        <div className="chat-bottombar relative" style={(() => {
          try {
            const saved = localStorage.getItem('chat_custom_css')
            if (saved) {
              const data = JSON.parse(saved)
              if (data.custom?.bottomBar) {
                const styleObj: Record<string, string> = {}
                data.custom.bottomBar.split(';').forEach((rule: string) => {
                  const colonIndex = rule.indexOf(':')
                  if (colonIndex > 0) {
                    const key = rule.substring(0, colonIndex).trim()
                    const value = rule.substring(colonIndex + 1).trim().replace(/!important/gi, '').trim()
                    if (key && value) {
                      const camelKey = key.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
                      styleObj[camelKey] = value
                    }
                  }
                })
                if (Object.keys(styleObj).length > 0) return styleObj
              }
            }
          } catch {}
          return undefined
        })()}>
          {/* 底栏装饰背景 */}
          {(customIcons['chat-bottombar-bg'] || chatDecorations.bottomBar) && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: `url(${customIcons['chat-bottombar-bg'] || chatDecorations.bottomBar})`,
                backgroundSize: `${bottomBarScale}%`,
                backgroundPosition: `calc(50% + ${bottomBarX}px) calc(50% + ${bottomBarY}px)`
              }}
            />
          )}

          {/* 🔥 AI拉黑用户/用户发送好友申请提示条 */}
          {(isBlockedByAI || friendRequestStatus === 'pending') && (
            <div className="relative z-10 mx-4 mb-3 p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.07)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${friendRequestStatus === 'pending' ? 'bg-amber-100/50 text-amber-600' : 'bg-rose-100/50 text-rose-500'}`}>
                    {friendRequestStatus === 'pending' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    )}
                  </div>
                  <div>
                    {friendRequestStatus === 'pending' ? (
                      <>
                        <div className="text-sm font-medium text-gray-800/90">好友申请已发送</div>
                        <div className="text-xs text-gray-500/80 mt-0.5">等待对方通过验证</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-gray-800/90">对方不是你的好友</div>
                        <div className="text-xs text-gray-500/80 mt-0.5">发送好友申请后才能聊天</div>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowFriendRequestModal(true)}
                  className="px-5 py-2 bg-white/50 hover:bg-white/80 text-gray-700 text-sm font-medium rounded-xl backdrop-blur-sm border border-white/60 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  {friendRequestStatus === 'pending' ? '重新申请' : '添加好友'}
                </button>
              </div>
            </div>
          )}

          {modals.quotedMessage && (
            <div className="relative z-10 px-4 py-2 bg-gray-100 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-600 font-medium">
                  {modals.quotedMessage.type === 'sent' ? '我' : character.remark || character.nickname || character.realName}
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

          <div className="chat-input-row relative z-10 px-2 py-2 flex items-center gap-1">
            <button
              onClick={() => {
                playSystemSound() // 🎵 统一使用系统点击音效
                addMenu.setShowAddMenu(true)
              }}
              className="chat-add-btn w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
            >
              {(customIcons['chat-add-btn'] || chatDecorations.plusButton) ? (
                <img src={customIcons['chat-add-btn'] || chatDecorations.plusButton!} alt="加号" className="w-8 h-8 object-contain" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
            <div
              className="chat-input-box flex-1 flex items-center bg-white/30 backdrop-blur-xl rounded-full px-4 py-2 min-w-0"
              style={(() => {
                const baseStyle = customIcons['chat-input-bg'] ? {
                  backgroundImage: `url(${customIcons['chat-input-bg']})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}
                try {
                  const saved = localStorage.getItem('chat_custom_css')
                  if (saved) {
                    const data = JSON.parse(saved)
                    if (data.custom?.inputBox) {
                      const styleObj: Record<string, string> = { ...baseStyle }
                      data.custom.inputBox.split(';').forEach((rule: string) => {
                        const colonIndex = rule.indexOf(':')
                        if (colonIndex > 0) {
                          const key = rule.substring(0, colonIndex).trim()
                          const value = rule.substring(colonIndex + 1).trim().replace(/!important/gi, '').trim()
                          if (key && value) {
                            const camelKey = key.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
                            styleObj[camelKey] = value
                          }
                        }
                      })
                      return styleObj
                    }
                  }
                } catch {}
                return baseStyle
              })()}
            >
              <input
                type="text"
                value={chatState.inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="发送消息"
                className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-sm min-w-0"
                style={{
                  transform: 'translateZ(0)',
                  willChange: 'contents'
                }}
              />
            </div>
            <button
              onClick={() => emojiPickerRef.current?.open()} aria-label="打开表情包"
              className="chat-emoji-btn w-9 h-9 flex items-center justify-center ios-button text-gray-700 btn-press-fast touch-ripple-effect flex-shrink-0"
            >
              {customIcons['chat-emoji'] ? (
                <img src={customIcons['chat-emoji']} alt="表情" className="w-8 h-8 object-contain" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            {chatState.inputValue.trim() ? (
              customIcons['chat-send'] ? (
                <img 
                  src={customIcons['chat-send']} 
                  alt="发送" 
                  onClick={() => chatAI.handleSend(chatState.inputValue, chatState.setInputValue, modals.quotedMessage, () => modals.setQuotedMessage(null))}
                  className="w-9 h-9 object-contain cursor-pointer flex-shrink-0 ios-spring btn-press-fast"
                />
              ) : (
                <button
                  onClick={() => chatAI.handleSend(chatState.inputValue, chatState.setInputValue, modals.quotedMessage, () => modals.setQuotedMessage(null))}
                  disabled={chatAI.isAiTyping}
                  className="chat-send-btn w-9 h-9 flex items-center justify-center ios-button bg-gray-900 text-white rounded-full shadow-lg disabled:opacity-50 ios-spring btn-press-fast flex-shrink-0"
                  style={(() => {
                    try {
                      const saved = localStorage.getItem('chat_custom_css')
                      if (saved) {
                        const data = JSON.parse(saved)
                        if (data.custom?.sendButton) {
                          const styleObj: Record<string, string> = {}
                          data.custom.sendButton.split(';').forEach((rule: string) => {
                            const colonIndex = rule.indexOf(':')
                            if (colonIndex > 0) {
                              const key = rule.substring(0, colonIndex).trim()
                              const value = rule.substring(colonIndex + 1).trim().replace(/!important/gi, '').trim()
                              if (key && value) {
                                const camelKey = key.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
                                styleObj[camelKey] = value
                              }
                            }
                          })
                          if (Object.keys(styleObj).length > 0) return styleObj
                        }
                      }
                    } catch {}
                    return undefined
                  })()}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              )
            ) : (
              <button
                onClick={() => chatAI.handleAIReply()}
                disabled={chatAI.isAiTyping || (!!tacitGame.gameType && !tacitGame.hasSent)}
                className="chat-ai-btn w-9 h-9 flex items-center justify-center ios-button text-gray-700 disabled:opacity-50 btn-press-fast touch-ripple-effect flex-shrink-0"
                style={customIcons['chat-ai'] ? { background: 'transparent' } : {}}
              >
                {chatAI.isAiTyping ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : customIcons['chat-ai'] ? (
                  <img src={customIcons['chat-ai']} alt="AI回复" className="w-8 h-8 object-contain" />
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <AddMenu
        isOpen={addMenu.showAddMenu}
        onClose={() => {
          playSystemSound() // 🎵 统一使用系统点击音效
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
        onSelectWeather={addMenu.handlers.handleSelectWeather}
        onSelectEnvelope={addMenu.handlers.handleSelectEnvelope}
        onSelectJudgment={addMenu.handlers.handleSelectJudgment}
        onSelectShop={handleSelectShop}
        onSelectTacitGame={tacitGame.openGameSelect}
        onSelectLogistics={addMenu.handlers.handleSelectLogistics}
        onSelectContactCard={addMenu.handlers.handleSelectContactCard}
        onSelectGomoku={addMenu.handlers.handleSelectGomoku}
        hasCoupleSpaceActive={coupleSpace.hasCoupleSpace}
        customIcons={customIcons}
      />

      {/* 名片选择器 */}
      <ContactCardSelector
        isOpen={showContactCardSelector}
        onClose={() => setShowContactCardSelector(false)}
        onSelect={handleSendContactCard}
        currentCharacterId={id || ''}
      />

      {/* 五子棋游戏 */}
      <GomokuGame
        isOpen={showGomokuGame}
        onClose={() => {
          setShowGomokuGame(false)
          setGomokuAIMove(undefined)
        }}
        onSendMove={(moveText) => {
          // 发送下棋消息（隐藏消息，不显示在聊天列表，但AI能看到）
          const now = Date.now()
          const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          const msg: Message = {
            id: now,
            type: 'sent',
            messageType: 'gomoku',  // 特殊类型，用于隐藏
            content: moveText,
            time: timeStr,
            timestamp: now,
            aiReadableContent: `[五子棋] ${moveText}`
          }
          chatState.setMessages(prev => {
            const updated = [...prev, msg]
            if (id) saveMessages(id, updated)
            return updated
          })
          // 不自动触发AI回复，让用户自己发消息触发
        }}
        onGameEnd={(userWin) => {
          // 游戏结束，发送结果卡片
          const now = Date.now()
          const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          const resultMsg: Message = {
            id: now,
            type: 'system',
            messageType: 'gomokuResult',
            content: userWin ? '五子棋对弈 - 你赢了！' : '五子棋对弈 - 你输了',
            time: timeStr,
            timestamp: now,
            gomokuResult: {
              userWin,
              userName: '你',
              aiName: chatState.character?.nickname || chatState.character?.realName || 'AI',
              aiAvatar: chatState.character?.avatar
            }
          }
          chatState.setMessages(prev => {
            const updated = [...prev, resultMsg]
            if (id) saveMessages(id, updated)
            return updated
          })
        }}
        aiMove={gomokuAIMove}
        onAIMoveProcessed={() => setGomokuAIMove(undefined)}
        characterName={chatState.character?.nickname || chatState.character?.realName}
        characterAvatar={chatState.character?.avatar}
      />

      {/* 物流弹窗 */}
      <LogisticsModal
        isOpen={logistics.showLogisticsModal}
        onClose={logistics.closeLogistics}
        chatId={id || ''}
      />

      {/* 表情包面板 */}
      <EmojiPicker ref={emojiPickerRef} onSelect={emoji.sendEmoji} />

      {/* 音乐选择器 */}
      {musicInvite.showMusicInviteSelector && (
        <MusicInviteSelector
          onClose={() => musicInvite.setShowMusicInviteSelector(false)}
          onSend={musicInvite.sendMusicInvite}
          onShare={handleShareMusic}
        />
      )}

      {/* AI备忘录弹窗 */}
      <AIMemoModal
        isOpen={showAIMemoModal}
        onClose={() => setShowAIMemoModal(false)}
        characterId={id || ''}
        characterName={chatState.character?.nickname || chatState.character?.realName || 'AI'}
      />

      {/* 小号总结弹窗 */}
      {(summaryResult !== null || isSummarizing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !isSummarizing && setSummaryResult(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              聊天总结
            </h3>
            {isSummarizing ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full" />
                <span className="ml-3 text-gray-500">正在生成...</span>
              </div>
            ) : (
              <>
                <textarea
                  value={summaryResult || ''}
                  onChange={(e) => setSummaryResult(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none focus:outline-none focus:border-green-500"
                  placeholder="编辑总结内容..."
                />
                <p className="text-xs text-gray-400 mt-2 mb-4">可以手动修改，保存后切回主账号AI可以看到</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSummaryResult(null)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      // 保存修改后的总结
                      const account = getCurrentAccount()
                      if (account && !account.isMain && id && summaryResult) {
                        const msgs = chatState.messages
                        const startTime = msgs.length > 0 ? msgs[0].timestamp : Date.now()
                        const endTime = msgs.length > 0 ? msgs[msgs.length - 1].timestamp : Date.now()
                        import('../utils/subAccountSummary').then(({ saveSummary }) => {
                          saveSummary({
                            accountId: account.id,
                            accountName: account.name,
                            characterId: id,
                            summary: summaryResult,
                            timestamp: Date.now(),
                            messageCount: msgs.length,
                            startTime,
                            endTime
                          })
                        })
                      }
                      setSummaryResult(null)
                    }}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
          name: character.remark || character.nickname || character.realName,
          avatar: character.avatar
        }}
        isVideoCall={true}
        onAccept={videoCall.acceptCall}
        onReject={videoCall.rejectCall}
      />

      <VideoCallScreen
        show={videoCall.isCallActive}
        character={{
          name: character.remark || character.nickname || character.realName,
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
        userAvatar={currentUserAvatar}
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
            <span className="text-[9px] opacity-60">·{(chatAI.tokenStats.responseTime / 1000).toFixed(1)}s</span>
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
            characterName={character.remark || character.nickname || character.realName}
            characterId={id || ''}
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
        onDelete={handleDeleteOfflineRecord}
        editingMessage={editingOfflineRecord}
      />

      {/* 🔥 添加好友弹窗 */}
      <FriendRequestModal
        isOpen={showFriendRequestModal}
        onClose={() => setShowFriendRequestModal(false)}
        onSend={handleSendFriendRequest}
        characterName={character.remark || character.nickname || character.realName}
      />

      {/* ⚖️ 判定对错输入弹窗 */}
      <JudgmentInputModal
        isOpen={judgment.showJudgmentModal}
        onClose={() => judgment.setShowJudgmentModal(false)}
        characterName={character.remark || character.nickname || character.realName}
        onSubmit={judgment.respondingToAppealId ? judgment.sendAppealResponse : judgment.sendJudgmentRequest}
        isRespondingToAppeal={!!judgment.respondingToAppealId}
      />

      {/* 🛍️ 商城管理 */}
      <ShopManager
        isOpen={showShopManager}
        onClose={() => setShowShopManager(false)}
        onShare={handleShareShop}
      />

      {/* 🛍️ 店铺查看器 */}
      {viewingShopId && (
        <ShopViewer
          isOpen={showShopViewer}
          onClose={() => {
            setShowShopViewer(false)
            setViewingShopId(null)
          }}
          shopId={viewingShopId}
          onPurchase={handlePurchaseProduct}
        />
      )}

      {/* 💕 默契游戏选择菜单 */}
      <TacitGameSelect
        isOpen={tacitGame.showGameSelect}
        onClose={tacitGame.closeGameSelect}
        onSelectGame={tacitGame.startGame}
        characterName={chatState.character?.realName || 'TA'}
      />

      {/* 💕 你画我猜悬浮画板 */}
      {tacitGame.gameType === 'draw' && tacitGame.showPanel && (
        <TacitDrawPanel
          onSendImage={tacitGame.sendDrawing}
          onClose={tacitGame.closePanel}
          canvasDataRef={tacitGame.canvasDataRef}
        />
      )}

      {/* 💕 你演我猜悬浮面板 */}
      {tacitGame.gameType === 'act' && tacitGame.showPanel && (
        <TacitActPanel
          onSendDescription={tacitGame.sendDescription}
          onClose={tacitGame.closePanel}
          descriptionRef={tacitGame.descriptionRef}
        />
      )}
    </div>
  )
}

export default ChatDetail
