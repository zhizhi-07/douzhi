/**
 * 群聊消息操作Hook
 * 处理撤回、删除、复制、引用等操作
 */

import { useState, useRef, useCallback } from 'react'
import { groupChatManager, type GroupMessage } from '../../../utils/groupChatManager'

interface MenuPosition {
  x: number
  y: number
}

export const useGroupMessageActions = (
  groupId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<GroupMessage[]>>
) => {
  // 消息菜单状态
  const [showMessageMenu, setShowMessageMenu] = useState(false)
  const [menuMessage, setMenuMessage] = useState<GroupMessage | null>(null)
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 })
  
  // 引用消息状态
  const [quotedMessage, setQuotedMessage] = useState<GroupMessage | null>(null)
  
  // 查看撤回的消息
  const [viewingRecalledMessage, setViewingRecalledMessage] = useState<GroupMessage | null>(null)
  
  // 长按计时器和移动检测
  const longPressTimer = useRef<number | null>(null)
  const startPositionRef = useRef<{ x: number; y: number } | null>(null)
  const isMovedRef = useRef(false)
  const MOVE_THRESHOLD = 10 // 移动阈值（像素）

  // 长按开始
  const handleLongPressStart = useCallback((msg: GroupMessage, event?: React.MouseEvent | React.TouchEvent) => {
    // 记录初始位置
    if (event) {
      if ('touches' in event && event.touches[0]) {
        startPositionRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
      } else if ('clientX' in event) {
        startPositionRef.current = { x: event.clientX, y: event.clientY }
      }
    }
    isMovedRef.current = false

    longPressTimer.current = window.setTimeout(() => {
      // 如果已经移动过，不触发长按
      if (isMovedRef.current) return

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
    }, 600) // 延迟从500ms改为600ms
  }, [])

  // 长按移动检测
  const handleLongPressMove = useCallback((event?: React.MouseEvent | React.TouchEvent) => {
    if (!startPositionRef.current || !longPressTimer.current) return

    let clientX = 0, clientY = 0
    if (event) {
      if ('touches' in event && event.touches[0]) {
        clientX = event.touches[0].clientX
        clientY = event.touches[0].clientY
      } else if ('clientX' in event) {
        clientX = event.clientX
        clientY = event.clientY
      }
    }

    // 计算移动距离
    const deltaX = Math.abs(clientX - startPositionRef.current.x)
    const deltaY = Math.abs(clientY - startPositionRef.current.y)

    // 如果移动超过阈值，取消长按计时器
    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      isMovedRef.current = true
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }, [])

  // 长按结束
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    startPositionRef.current = null
    isMovedRef.current = false
  }, [])

  // 撤回消息
  const handleRecallMessage = useCallback(() => {
    if (!menuMessage || !groupId) return
    
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
    
    groupChatManager.recallMessage(groupId, menuMessage.id, '我')
    setShowMessageMenu(false)
    setMenuMessage(null)
    
    // 刷新消息列表
    const updatedMsgs = groupChatManager.getMessages(groupId)
    setMessages(updatedMsgs)
  }, [menuMessage, groupId, setMessages])

  // 删除消息
  const handleDeleteMessage = useCallback(() => {
    if (!menuMessage || !groupId) return
    
    const confirmed = window.confirm('确定要永久删除这条消息吗？删除后无法恢复。')
    if (!confirmed) return
    
    console.log('🗑️ 永久删除群聊消息:', menuMessage.id)
    
    const currentMessages = groupChatManager.getMessages(groupId)
    const updatedMessages = currentMessages.filter(m => m.id !== menuMessage.id)
    groupChatManager.replaceAllMessages(groupId, updatedMessages)
    
    setShowMessageMenu(false)
    setMenuMessage(null)
    setMessages(updatedMessages)
    console.log('✅ 消息已永久删除')
  }, [menuMessage, groupId, setMessages])

  // 复制消息
  const handleCopyMessage = useCallback(() => {
    if (!menuMessage) return
    navigator.clipboard.writeText(menuMessage.content)
    alert('已复制到剪贴板')
    setShowMessageMenu(false)
  }, [menuMessage])

  // 引用消息
  const handleQuoteMessage = useCallback((inputRef?: React.RefObject<HTMLInputElement>) => {
    if (!menuMessage) return
    setQuotedMessage(menuMessage)
    setShowMessageMenu(false)
    inputRef?.current?.focus()
  }, [menuMessage])

  // 取消引用
  const cancelQuote = useCallback(() => {
    setQuotedMessage(null)
  }, [])

  // 关闭消息菜单
  const closeMessageMenu = useCallback(() => {
    setShowMessageMenu(false)
    setMenuMessage(null)
  }, [])

  // 关闭撤回消息查看
  const closeViewingRecalled = useCallback(() => {
    setViewingRecalledMessage(null)
  }, [])

  return {
    // 菜单状态
    showMessageMenu,
    menuMessage,
    menuPosition,
    // 引用
    quotedMessage,
    setQuotedMessage,
    cancelQuote,
    // 撤回查看
    viewingRecalledMessage,
    setViewingRecalledMessage,
    closeViewingRecalled,
    // 操作
    handleLongPressStart,
    handleLongPressMove,
    handleLongPressEnd,
    handleRecallMessage,
    handleDeleteMessage,
    handleCopyMessage,
    handleQuoteMessage,
    closeMessageMenu
  }
}
