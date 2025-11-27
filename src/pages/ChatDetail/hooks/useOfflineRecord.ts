/**
 * 线下记录Hook
 */

import { useState, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { saveMessages } from '../../../utils/simpleMessageManager'

export const useOfflineRecord = (
  chatId: string | undefined,
  messages: Message[],
  setMessages: (messages: Message[]) => void
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
    }

    setShowOfflineRecordDialog(false)
    setEditingOfflineRecord(null)
  }, [messages, setMessages, editingOfflineRecord, chatId])

  return {
    showOfflineRecordDialog,
    setShowOfflineRecordDialog,
    editingOfflineRecord,
    setEditingOfflineRecord,
    handleSaveOfflineRecord
  }
}
