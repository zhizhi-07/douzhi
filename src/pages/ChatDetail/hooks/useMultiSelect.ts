/**
 * 多选模式Hook
 * 用于批量操作消息（删除、转发等）
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { deleteMessage } from '../../../utils/simpleMessageManager'

export const useMultiSelect = (
  chatId: string,
  messages: Message[],
  setMessages: (fn: (prev: Message[]) => Message[]) => void
) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<number>>(new Set())
  const [showForwardModal, setShowForwardModal] = useState(false)

  /**
   * 进入多选模式
   */
  const enterMultiSelectMode = useCallback(() => {
    console.log('📋 进入多选模式')
    setIsMultiSelectMode(true)
    setSelectedMessageIds(new Set())
  }, [])

  /**
   * 退出多选模式
   */
  const exitMultiSelectMode = useCallback(() => {
    console.log('❌ 退出多选模式')
    setIsMultiSelectMode(false)
    setSelectedMessageIds(new Set())
  }, [])

  /**
   * 切换消息选中状态
   */
  const toggleMessageSelection = useCallback((messageId: number) => {
    setSelectedMessageIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
        console.log('➖ 取消选中:', messageId)
      } else {
        newSet.add(messageId)
        console.log('➕ 选中:', messageId)
      }
      return newSet
    })
  }, [])

  /**
   * 检查消息是否可以被选择
   */
  const isMessageSelectable = useCallback((message: Message) => {
    // 暂时不支持删除亲密付和情侣空间
    const unselectableTypes = ['intimatePay', 'coupleSpaceInvite']
    
    if (message.messageType && unselectableTypes.includes(message.messageType)) {
      return false
    }
    
    // 亲密付邀请消息（检查intimatePay字段）
    if (message.intimatePay) {
      return false
    }
    
    // 情侣空间邀请消息（检查coupleSpaceInvite字段）
    if (message.coupleSpaceInvite) {
      return false
    }
    
    return true
  }, [])

  /**
   * 批量删除选中的消息
   */
  const deleteSelectedMessages = useCallback(() => {
    if (selectedMessageIds.size === 0) {
      alert('请先选择要删除的消息')
      return
    }

    const confirmed = window.confirm(`确定要永久删除选中的 ${selectedMessageIds.size} 条消息吗？删除后无法恢复。`)
    if (!confirmed) return

    console.log('🗑️ 批量删除消息:', Array.from(selectedMessageIds))

    // 从localStorage删除每条消息
    selectedMessageIds.forEach(messageId => {
      deleteMessage(chatId, messageId)
    })

    // 从React状态删除
    setMessages(prev => prev.filter(m => !selectedMessageIds.has(m.id)))

    console.log(`✅ 已删除 ${selectedMessageIds.size} 条消息`)
    
    // 退出多选模式
    exitMultiSelectMode()
  }, [selectedMessageIds, chatId, setMessages, exitMultiSelectMode])

  /**
   * 全选
   */
  const selectAll = useCallback((messages: Message[]) => {
    const selectableIds = messages
      .filter(isMessageSelectable)
      .map(m => m.id)
    
    setSelectedMessageIds(new Set(selectableIds))
    console.log(`✅ 已全选 ${selectableIds.length} 条消息`)
  }, [isMessageSelectable])

  /**
   * 取消全选
   */
  const deselectAll = useCallback(() => {
    setSelectedMessageIds(new Set())
    console.log('❌ 已取消全选')
  }, [])

  /**
   * 获取选中的消息
   */
  const getSelectedMessages = useCallback(() => {
    return messages.filter(m => selectedMessageIds.has(m.id))
  }, [messages, selectedMessageIds])

  /**
   * 打开转发弹窗
   */
  const openForwardModal = useCallback(() => {
    if (selectedMessageIds.size === 0) {
      alert('请先选择要转发的消息')
      return
    }
    setShowForwardModal(true)
  }, [selectedMessageIds])

  /**
   * 关闭转发弹窗
   */
  const closeForwardModal = useCallback(() => {
    setShowForwardModal(false)
  }, [])

  return {
    isMultiSelectMode,
    selectedMessageIds,
    showForwardModal,
    enterMultiSelectMode,
    exitMultiSelectMode,
    toggleMessageSelection,
    isMessageSelectable,
    deleteSelectedMessages,
    selectAll,
    deselectAll,
    getSelectedMessages,
    openForwardModal,
    closeForwardModal
  }
}
