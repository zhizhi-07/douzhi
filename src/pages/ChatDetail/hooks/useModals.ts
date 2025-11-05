/**
 * 各种弹窗状态管理
 */

import { useState } from 'react'
import type { Message } from '../../../types/chat'

export const useModals = () => {
  const [viewingRecalledMessage, setViewingRecalledMessage] = useState<Message | null>(null)
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null)
  const [viewingCallRecord, setViewingCallRecord] = useState<Message | null>(null)

  return {
    // 撤回消息查看
    viewingRecalledMessage,
    setViewingRecalledMessage,
    // 引用消息
    quotedMessage,
    setQuotedMessage,
    // 通话记录查看
    viewingCallRecord,
    setViewingCallRecord
  }
}
