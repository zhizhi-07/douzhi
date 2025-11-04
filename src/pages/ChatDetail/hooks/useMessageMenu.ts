/**
 * 消息菜单Hook
 * 负责：长按消息菜单状态、位置和所有操作处理
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'

interface MenuPosition {
  x: number
  y: number
}

export const useMessageMenu = (
  setMessages?: (fn: (prev: Message[]) => Message[]) => void
) => {
  const [showMessageMenu, setShowMessageMenu] = useState(false)
  const [longPressedMessage, setLongPressedMessage] = useState<Message | null>(null)
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 })
  
  /**
   * 复制消息
   */
  const handleCopyMessage = useCallback(() => {
    if (!longPressedMessage) return
    navigator.clipboard.writeText(longPressedMessage.content)
    console.log('已复制:', longPressedMessage.content)
    // TODO: 显示复制成功提示
  }, [longPressedMessage])
  
  /**
   * 删除消息
   */
  const handleDeleteMessage = useCallback(() => {
    if (!longPressedMessage) return
    console.log('删除消息:', longPressedMessage.id)
    // TODO: 实现删除功能
  }, [longPressedMessage])
  
  /**
   * 撤回消息（直接撤回，不需要理由）
   */
  const handleRecallMessage = useCallback((onRecall: (message: Message) => void) => {
    if (!longPressedMessage) return
    
    // 检查是否可以撤回
    const canRecall = !longPressedMessage.transfer && 
                     (!longPressedMessage.messageType ||
                     longPressedMessage.messageType === 'text' ||
                     longPressedMessage.messageType === 'voice' ||
                     longPressedMessage.messageType === 'photo' ||
                     longPressedMessage.messageType === 'location')
    
    if (!canRecall) {
      alert('转账等特殊消息不支持撤回')
      return
    }
    
    // 直接撤回，不需要理由
    onRecall(longPressedMessage)
    setShowMessageMenu(false)
  }, [longPressedMessage])
  
  /**
   * 引用消息
   */
  const handleQuoteMessage = useCallback((onQuote: (message: Message) => void) => {
    if (!longPressedMessage) return
    
    onQuote(longPressedMessage)
    setShowMessageMenu(false)
  }, [longPressedMessage])
  
  /**
   * 编辑消息
   */
  const handleEditMessage = useCallback(() => {
    if (!longPressedMessage) return
    console.log('编辑消息:', longPressedMessage.id)
    // TODO: 实现编辑功能
  }, [longPressedMessage])
  
  /**
   * 批量删除
   */
  const handleBatchDelete = useCallback(() => {
    console.log('批量删除')
    // TODO: 实现批量删除功能
  }, [])
  
  return {
    showMessageMenu,
    longPressedMessage,
    menuPosition,
    setShowMessageMenu,
    setLongPressedMessage,
    setMenuPosition,
    handlers: {
      handleCopyMessage,
      handleDeleteMessage,
      handleRecallMessage,
      handleQuoteMessage,
      handleEditMessage,
      handleBatchDelete
    }
  }
}
