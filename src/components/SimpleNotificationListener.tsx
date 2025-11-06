/**
 * 简单通知监听器
 * 监听new-message事件，显示通知和更新未读数
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IOSNotification from './IOSNotification'
import IncomingCallScreen from './IncomingCallScreen'
import { incrementUnread, markMessageNotified, isMessageNotified } from '../utils/simpleNotificationManager'
import { characterService } from '../services/characterService'
import { addMessage } from '../utils/simpleMessageManager'
import type { Message } from '../types/chat'

export default function SimpleNotificationListener() {
  const navigate = useNavigate()
  const [notification, setNotification] = useState<{
    title: string
    message: string
    chatId: string
    avatar?: string
  } | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  
  // 视频通话状态
  const [incomingCall, setIncomingCall] = useState<{
    chatId: string
    characterName: string
    avatar?: string
  } | null>(null)
  const [showIncomingCall, setShowIncomingCall] = useState(false)

  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const { chatId, message } = event.detail

      // 检查是否是AI消息
      if (message.type !== 'received') return

      // 检查用户是否在当前聊天
      const currentPath = window.location.pathname
      if (currentPath === `/chat/${chatId}`) return

      // 检查是否已通知过
      if (isMessageNotified(message.id)) return

      // 标记已通知
      markMessageNotified(message.id)

      // 增加未读数
      incrementUnread(chatId)

      // 获取角色信息
      const character = characterService.getById(chatId)
      if (!character) return

      // 显示通知
      setNotification({
        title: character.nickname || character.realName,
        message: message.content || '[消息]',
        chatId,
        avatar: character.avatar
      })
      setShowNotification(true)

      console.log(`📬 新消息通知: ${character.nickname || character.realName}`)
    }

    // 监听视频通话事件
    const handleIncomingVideoCall = (event: CustomEvent) => {
      const { chatId, characterName, avatar } = event.detail
      
      // 检查用户是否在当前聊天
      const currentPath = window.location.pathname
      if (currentPath === `/chat/${chatId}`) {
        console.log('📞 用户在聊天页面，由页面内组件处理来电')
        return
      }
      
      // 不在聊天页面，显示来电弹窗
      console.log('📞 用户不在聊天页面，显示全局来电弹窗')
      setIncomingCall({ chatId, characterName, avatar })
      setShowIncomingCall(true)
    }

    window.addEventListener('new-message', handleNewMessage as EventListener)
    window.addEventListener('incoming-video-call', handleIncomingVideoCall as EventListener)

    return () => {
      window.removeEventListener('new-message', handleNewMessage as EventListener)
      window.removeEventListener('incoming-video-call', handleIncomingVideoCall as EventListener)
    }
  }, [])

  const handleClose = () => {
    setShowNotification(false)
    setTimeout(() => setNotification(null), 300)
  }

  const handleClick = () => {
    if (!notification) return
    navigate(`/chat/${notification.chatId}`)
  }

  // 视频通话处理
  const handleAcceptCall = () => {
    if (!incomingCall) return
    setShowIncomingCall(false)
    
    // 保存标记，让ChatDetail页面自动接听
    sessionStorage.setItem(`accept_call_${incomingCall.chatId}`, Date.now().toString())
    
    navigate(`/chat/${incomingCall.chatId}`)
  }

  const handleRejectCall = () => {
    if (!incomingCall) return
    
    console.log('❌ 全局拒绝视频通话:', incomingCall.chatId)
    setShowIncomingCall(false)
    
    // 保存拒绝消息到localStorage，让AI知道被拒绝了
    const rejectMsg: Message = {
      id: Date.now(),
      type: 'system',
      content: '你拒绝了视频通话',  // 用户看到的
      aiReadableContent: '用户拒绝了你的视频通话请求',  // AI看到的
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: Date.now(),
      messageType: 'system'
    }
    
    addMessage(incomingCall.chatId, rejectMsg)
    console.log('💾 拒绝消息已保存到localStorage')
    
    setTimeout(() => setIncomingCall(null), 300)
  }

  return (
    <>
      {notification && (
        <IOSNotification
          show={showNotification}
          title="微信"
          subtitle={notification.title}
          message={notification.message}
          icon={notification.avatar || "💬"}
          onClose={handleClose}
          onClick={handleClick}
          duration={5000}
        />
      )}
      
      {incomingCall && (
        <IncomingCallScreen
          show={showIncomingCall}
          character={{
            name: incomingCall.characterName,
            avatar: incomingCall.avatar
          }}
          isVideoCall={true}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </>
  )
}
