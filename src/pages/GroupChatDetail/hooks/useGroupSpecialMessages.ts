/**
 * 群聊特殊消息发送Hook
 * 处理图片、语音、位置、转账、红包等特殊消息
 */

import { useState, useCallback } from 'react'
import { groupChatManager, type GroupMessage } from '../../../utils/groupChatManager'
import { getUserInfo } from '../../../utils/userUtils'

export const useGroupSpecialMessages = (
  groupId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<GroupMessage[]>>,
  scrollToBottom: () => void
) => {
  // 各种弹窗状态
  const [showPhotoInput, setShowPhotoInput] = useState(false)
  const [showCameraInput, setShowCameraInput] = useState(false)
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [showRedPacketSender, setShowRedPacketSender] = useState(false)
  const [showPollCreator, setShowPollCreator] = useState(false)
  
  // 转账相关
  const [showMemberSelect, setShowMemberSelect] = useState(false)
  const [showTransferSender, setShowTransferSender] = useState(false)
  const [selectedTransferMember, setSelectedTransferMember] = useState<{ id: string, name: string } | null>(null)

  // ===== 图片相关 =====
  const handleImageSelect = useCallback(() => {
    setShowPhotoInput(true)
  }, [])

  const handleConfirmPhoto = useCallback((description: string) => {
    if (!groupId) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(groupId, {
      userId: 'user',
      userName: userInfo.realName,
      userAvatar: '',
      content: `[图片: ${description}]`,
      type: 'image',
      messageType: 'photo',
      photoDescription: description
    })
    setShowPhotoInput(false)
    
    const updatedMsgs = groupChatManager.getMessages(groupId)
    setMessages(updatedMsgs)
    setTimeout(scrollToBottom, 100)
  }, [groupId, setMessages, scrollToBottom])

  // ===== 拍照相关 =====
  const handleCameraSelect = useCallback(() => {
    setShowCameraInput(true)
  }, [])

  const handleConfirmCamera = useCallback((description: string) => {
    if (!groupId) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(groupId, {
      userId: 'user',
      userName: userInfo.realName,
      userAvatar: '',
      content: `[拍照: ${description}]`,
      type: 'image',
      messageType: 'photo',
      photoDescription: description
    })
    setShowCameraInput(false)
    
    const updatedMsgs = groupChatManager.getMessages(groupId)
    setMessages(updatedMsgs)
    setTimeout(scrollToBottom, 100)
  }, [groupId, setMessages, scrollToBottom])

  // ===== 转账相关 =====
  const handleTransferStart = useCallback(() => {
    setShowMemberSelect(true)
  }, [])

  const handleSelectTransferMember = useCallback((toUserId: string, toUserName: string) => {
    setSelectedTransferMember({ id: toUserId, name: toUserName })
    setShowMemberSelect(false)
    setShowTransferSender(true)
  }, [])

  const handleSendTransfer = useCallback((amount: number, message: string) => {
    if (!groupId || !selectedTransferMember) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(groupId, {
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
    
    const updatedMsgs = groupChatManager.getMessages(groupId)
    setMessages(updatedMsgs)
    setTimeout(scrollToBottom, 100)
  }, [groupId, selectedTransferMember, setMessages, scrollToBottom])

  const cancelTransfer = useCallback(() => {
    setShowTransferSender(false)
    setSelectedTransferMember(null)
  }, [])

  // ===== 位置相关 =====
  const handleLocationSelect = useCallback(() => {
    setShowLocationInput(true)
  }, [])

  const handleConfirmLocation = useCallback((name: string, address: string) => {
    if (!groupId) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(groupId, {
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
    
    const updatedMsgs = groupChatManager.getMessages(groupId)
    setMessages(updatedMsgs)
    setTimeout(scrollToBottom, 100)
  }, [groupId, setMessages, scrollToBottom])

  // ===== 语音相关 =====
  const handleVoiceSelect = useCallback(() => {
    setShowVoiceInput(true)
  }, [])

  const handleConfirmVoice = useCallback((voiceText: string) => {
    if (!groupId) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(groupId, {
      userId: 'user',
      userName: userInfo.realName,
      userAvatar: '',
      content: voiceText,
      type: 'voice',
      messageType: 'voice',
      voiceText: voiceText,
      duration: Math.ceil(voiceText.length / 5)
    })
    setShowVoiceInput(false)
    
    const updatedMsgs = groupChatManager.getMessages(groupId)
    setMessages(updatedMsgs)
    setTimeout(scrollToBottom, 100)
  }, [groupId, setMessages, scrollToBottom])

  // ===== 红包相关 =====
  const handleSendRedPacket = useCallback((totalAmount: number, count: number, blessing: string) => {
    if (!groupId) return
    
    const userInfo = getUserInfo()
    groupChatManager.addMessage(groupId, {
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
    
    const updatedMsgs = groupChatManager.getMessages(groupId)
    setMessages(updatedMsgs)
    setTimeout(scrollToBottom, 100)
  }, [groupId, setMessages, scrollToBottom])

  return {
    // 弹窗状态
    showPhotoInput,
    setShowPhotoInput,
    showCameraInput,
    setShowCameraInput,
    showLocationInput,
    setShowLocationInput,
    showVoiceInput,
    setShowVoiceInput,
    showRedPacketSender,
    setShowRedPacketSender,
    showPollCreator,
    setShowPollCreator,
    showMemberSelect,
    setShowMemberSelect,
    showTransferSender,
    setShowTransferSender,
    selectedTransferMember,
    
    // 处理函数
    handleImageSelect,
    handleConfirmPhoto,
    handleCameraSelect,
    handleConfirmCamera,
    handleTransferStart,
    handleSelectTransferMember,
    handleSendTransfer,
    cancelTransfer,
    handleLocationSelect,
    handleConfirmLocation,
    handleVoiceSelect,
    handleConfirmVoice,
    handleSendRedPacket
  }
}
