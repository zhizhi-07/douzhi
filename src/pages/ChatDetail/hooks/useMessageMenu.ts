/**
 * 消息菜单Hook
 * 负责：长按消息菜单状态、位置和所有操作处理
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { deleteMessage, updateMessage } from '../../../utils/simpleMessageManager'

interface MenuPosition {
  x: number
  y: number
}

export const useMessageMenu = (
  chatId: string,
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  onEnterMultiSelect?: () => void
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
   * 删除消息（永久删除，从localStorage删除）
   */
  const handleDeleteMessage = useCallback(() => {
    if (!longPressedMessage) return
    
    const confirmed = window.confirm('确定要永久删除这条消息吗？删除后无法恢复。')
    if (!confirmed) return
    
    console.log('🗑️ 永久删除消息:', longPressedMessage.id)
    
    // 从localStorage删除
    deleteMessage(chatId, longPressedMessage.id)
    
    // 从React状态删除
    setMessages(prev => prev.filter(m => m.id !== longPressedMessage.id))
    
    console.log('✅ 消息已永久删除')
    setShowMessageMenu(false)
  }, [longPressedMessage, chatId, setMessages])
  
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
   * 编辑消息（永久修改，改变AI记忆）
   */
  const handleEditMessage = useCallback(() => {
    if (!longPressedMessage) return
    
    const newContent = window.prompt('编辑消息内容：', longPressedMessage.content)
    if (newContent === null) return // 用户取消
    if (!newContent.trim()) {
      alert('消息内容不能为空')
      return
    }
    
    console.log('✏️ 编辑消息:', longPressedMessage.id, '新内容:', newContent)
    
    // 创建更新后的消息
    const updatedMessage: Message = {
      ...longPressedMessage,
      content: newContent.trim()
    }
    
    // 更新localStorage
    updateMessage(chatId, updatedMessage)
    
    // 更新React状态
    setMessages(prev => prev.map(m => 
      m.id === longPressedMessage.id ? updatedMessage : m
    ))
    
    console.log('✅ 消息已永久修改，AI记忆已更新')
    setShowMessageMenu(false)
  }, [longPressedMessage, chatId, setMessages])
  
  /**
   * 进入多选模式
   */
  const handleBatchDelete = useCallback(() => {
    console.log('📋 进入多选模式')
    setShowMessageMenu(false)
    if (onEnterMultiSelect) {
      onEnterMultiSelect()
    }
  }, [onEnterMultiSelect])
  
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
