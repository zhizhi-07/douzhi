/**
 * 群聊红包处理Hook
 * 处理红包打开、领取、转账接收/退还等
 */

import { useState, useCallback } from 'react'
import { groupChatManager, type GroupMessage } from '../../../utils/groupChatManager'
import { getUserInfo } from '../../../utils/userUtils'

// 获取成员头像
const getMemberAvatar = (userId: string): string => {
  if (userId === 'user') {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
      return userInfo.avatar || ''
    } catch (e) {
      return ''
    }
  }
  return ''
}

export const useGroupRedPacket = (
  groupId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<GroupMessage[]>>,
  scrollToBottom: () => void
) => {
  // 红包弹窗状态
  const [openRedPacketId, setOpenRedPacketId] = useState<number | null>(null)
  const [showRedPacketDetail, setShowRedPacketDetail] = useState(false)
  const [detailRedPacketId, setDetailRedPacketId] = useState<string | null>(null)

  // 打开红包（抢红包）- 显示拆红包弹窗
  const handleOpenRedPacket = useCallback((messageId: number) => {
    if (!groupId) return
    
    const messages = groupChatManager.getMessages(groupId)
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
  }, [groupId])

  // 确认拆开红包
  const handleConfirmOpenRedPacket = useCallback(() => {
    if (!groupId || !openRedPacketId) return

    const messageId = openRedPacketId
    const messages = groupChatManager.getMessages(groupId)
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
    const userAvatar = getMemberAvatar('user')
    const userName = userInfo.nickname || userInfo.realName || '用户'
    
    const updatedRedPacket = {
      ...redPacket,
      remaining: Math.round((redPacket.remaining - amount) * 100) / 100,
      remainingCount: redPacket.remainingCount - 1,
      received: [
        ...redPacket.received,
        {
          userId: 'user',
          userName: userName,
          userAvatar: userAvatar,
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
    const systemMsg = groupChatManager.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content: `${userName}领取了${redPacketMsg.userName}的红包 ￥${amount.toFixed(2)}`,
      type: 'system'
    })
    updatedMessages.push(systemMsg)
    
    // 保存更新
    groupChatManager.replaceAllMessages(groupId, updatedMessages)
    setMessages([...updatedMessages])
    
    // 关闭拆红包弹窗，打开详情页
    setOpenRedPacketId(null)
    setTimeout(() => {
      setDetailRedPacketId(redPacketMsg.id)
      setShowRedPacketDetail(true)
    }, 300)
  }, [groupId, openRedPacketId, setMessages])

  // 接收转账
  const handleReceiveTransfer = useCallback((messageId: number) => {
    if (!groupId) return
    
    const allMessages = groupChatManager.getMessages(groupId)
    const transferMsg = allMessages.find(m => 
      m.id === messageId.toString() || 
      m.id === `msg_${messageId}` ||
      parseInt(m.id.replace(/[^0-9]/g, '')) === messageId
    )
    
    if (!transferMsg || (transferMsg as any).messageType !== 'transfer') return
    
    const transfer = (transferMsg as any).transfer
    if (!transfer || transfer.status !== 'pending') return
    
    // 检查是否是发给用户的
    if (transfer.toUserId !== 'user') {
      alert('这不是发给你的转账')
      return
    }
    
    const fromName = transferMsg.userName || '未知'
    const amount = transfer.amount || 0
    
    // 更新转账状态
    const updatedMessages = allMessages.map(msg => 
      msg.id === transferMsg.id
        ? { ...msg, transfer: { ...transfer, status: 'received' } }
        : msg
    )
    
    // 添加系统消息
    const userInfo = getUserInfo()
    const systemMsg = groupChatManager.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content: `${userInfo.realName}已接收${fromName}的转账 ￥${amount.toFixed(2)}`,
      type: 'system'
    })
    updatedMessages.push(systemMsg)
    
    groupChatManager.replaceAllMessages(groupId, updatedMessages as any)
    setMessages([...updatedMessages])
    setTimeout(scrollToBottom, 100)
  }, [groupId, setMessages, scrollToBottom])

  // 退还转账
  const handleRejectTransfer = useCallback((messageId: number) => {
    if (!groupId) return
    
    const allMessages = groupChatManager.getMessages(groupId)
    const transferMsg = allMessages.find(m => 
      m.id === messageId.toString() || 
      m.id === `msg_${messageId}` ||
      parseInt(m.id.replace(/[^0-9]/g, '')) === messageId
    )
    
    if (!transferMsg || (transferMsg as any).messageType !== 'transfer') return
    
    const transfer = (transferMsg as any).transfer
    if (!transfer || transfer.status !== 'pending') return
    
    // 检查是否是发给用户的
    if (transfer.toUserId !== 'user') {
      alert('这不是发给你的转账')
      return
    }
    
    const fromName = transferMsg.userName || '未知'
    const amount = transfer.amount || 0
    
    // 更新转账状态
    const updatedMessages = allMessages.map(msg => 
      msg.id === transferMsg.id
        ? { ...msg, transfer: { ...transfer, status: 'refunded' } }
        : msg
    )
    
    // 添加系统消息
    const userInfo = getUserInfo()
    const systemMsg = groupChatManager.addMessage(groupId, {
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content: `${userInfo.realName}已退还${fromName}的转账 ￥${amount.toFixed(2)}`,
      type: 'system'
    })
    updatedMessages.push(systemMsg)
    
    groupChatManager.replaceAllMessages(groupId, updatedMessages as any)
    setMessages([...updatedMessages])
    setTimeout(scrollToBottom, 100)
  }, [groupId, setMessages, scrollToBottom])

  // 关闭红包弹窗
  const closeRedPacketModal = useCallback(() => {
    setOpenRedPacketId(null)
  }, [])

  // 关闭红包详情
  const closeRedPacketDetail = useCallback(() => {
    setShowRedPacketDetail(false)
    setDetailRedPacketId(null)
  }, [])

  return {
    // 状态
    openRedPacketId,
    showRedPacketDetail,
    detailRedPacketId,
    
    // 操作
    handleOpenRedPacket,
    handleConfirmOpenRedPacket,
    handleReceiveTransfer,
    handleRejectTransfer,
    closeRedPacketModal,
    closeRedPacketDetail
  }
}
