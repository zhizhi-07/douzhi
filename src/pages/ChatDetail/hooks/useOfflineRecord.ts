/**
 * 线下记录Hook
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { saveMessages, ensureMessagesLoaded } from '../../../utils/simpleMessageManager'

export const useOfflineRecord = (
  chatId: string | undefined,
  messages: Message[],
  setMessages: (messages: Message[]) => void,
  characterName?: string // 角色名称，用于记忆计数
) => {
  const [showOfflineRecordDialog, setShowOfflineRecordDialog] = useState(false)
  const [editingOfflineRecord, setEditingOfflineRecord] = useState<Message | null>(null)

  const handleSaveOfflineRecord = useCallback((title: string, summary: string, timestamp: number) => {
    const offlineSummaryMessage: Message = {
      id: editingOfflineRecord ? editingOfflineRecord.id : Date.now(),
      type: 'system',
      messageType: 'offline-summary',
      content: title,
      time: new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: timestamp,
      sceneMode: 'online',
      offlineSummary: {
        title,
        summary,
        memoryId: editingOfflineRecord?.offlineSummary?.memoryId || `offline-${Date.now()}`
      },
      aiReadableContent: `[系统记录：线下经历 - ${title}]\n总结：${summary}`
    }

    if (editingOfflineRecord) {
      // 编辑模式
      const updatedMessages = messages.map(m =>
        m.id === editingOfflineRecord.id ? offlineSummaryMessage : m
      ).sort((a, b) => a.timestamp - b.timestamp)
      
      setMessages(updatedMessages)
      if (chatId) saveMessages(chatId, updatedMessages)
      console.log('✅ 线下记录已更新')
    } else {
      // 新建模式
      const updatedMessages = [...messages, offlineSummaryMessage]
        .sort((a, b) => a.timestamp - b.timestamp)
      
      setMessages(updatedMessages)
      if (chatId) saveMessages(chatId, updatedMessages)
      console.log('✅ 线下记录已添加')
      
      // 🧠 为该角色增加记忆计数（仅新建时）
      if (chatId && characterName) {
        import('../../../services/memoryExtractor').then(({ recordInteraction }) => {
          recordInteraction(chatId, characterName)
        })
      }
    }

    setShowOfflineRecordDialog(false)
    setEditingOfflineRecord(null)
  }, [messages, setMessages, editingOfflineRecord, chatId, characterName])

  // 🔥 删除线下记录
  const handleDeleteOfflineRecord = useCallback(async (messageId: number) => {
    if (!chatId) return
    
    // 🔥🔥🔥 关键修复：从IndexedDB读取完整消息列表，而不是使用React状态（可能只有30条分页数据）
    const fullMessages = await ensureMessagesLoaded(chatId)
    const updatedMessages = fullMessages.filter(m => m.id !== messageId)
    
    // 更新React状态
    setMessages(updatedMessages)
    // 🔥 关键：删除操作必须用 forceOverwrite=true，否则会被智能合并恢复
    saveMessages(chatId, updatedMessages, true)
    console.log(`🗑️ 线下记录已删除: ${messageId}（完整列表共${fullMessages.length}条，删除后${updatedMessages.length}条）`)
    
    // 关闭对话框
    setShowOfflineRecordDialog(false)
    setEditingOfflineRecord(null)
  }, [setMessages, chatId])

  return {
    showOfflineRecordDialog,
    setShowOfflineRecordDialog,
    editingOfflineRecord,
    setEditingOfflineRecord,
    handleSaveOfflineRecord,
    handleDeleteOfflineRecord
  }
}
