/**
 * 物流功能Hook
 * 负责：物流弹窗状态（只读，不再发送消息）
 */

import { useState, useCallback } from 'react'

export const useLogistics = () => {
  const [showLogisticsModal, setShowLogisticsModal] = useState(false)

  /**
   * 打开物流弹窗
   */
  const openLogistics = useCallback(() => {
    setShowLogisticsModal(true)
  }, [])

  /**
   * 关闭物流弹窗
   */
  const closeLogistics = useCallback(() => {
    setShowLogisticsModal(false)
  }, [])


  return {
    showLogisticsModal,
    openLogistics,
    closeLogistics
  }
}
