/**
 * 加号菜单Hook
 * 负责：加号菜单状态和所有功能处理
 */

import { useState, useCallback } from 'react'

export const useAddMenu = (
  onRegenerate?: () => void,
  onOpenTransfer?: () => void,
  onOpenVoice?: () => void,
  onOpenLocation?: () => void,
  onOpenPhoto?: () => void
) => {
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  /**
   * 重新生成AI回复
   */
  const handleSelectRecall = useCallback(() => {
    setShowAddMenu(false)
    if (onRegenerate) {
      onRegenerate()
    }
  }, [onRegenerate])
  
  /**
   * 选择相册
   */
  const handleSelectImage = useCallback(() => {
    console.log('选择相册')
    // TODO: 实现相册选择功能
  }, [])
  
  /**
   * 拍照
   */
  const handleSelectCamera = useCallback(() => {
    setShowAddMenu(false)
    if (onOpenPhoto) {
      onOpenPhoto()
    }
  }, [onOpenPhoto])
  
  /**
   * 转账
   */
  const handleSelectTransfer = useCallback(() => {
    setShowAddMenu(false)
    if (onOpenTransfer) {
      onOpenTransfer()
    }
  }, [onOpenTransfer])
  
  /**
   * 亲密付
   */
  const handleSelectIntimatePay = useCallback(() => {
    console.log('亲密付')
    // TODO: 实现亲密付功能
  }, [])
  
  /**
   * 情侣空间
   */
  const handleSelectCoupleSpace = useCallback(() => {
    console.log('情侣空间')
    // TODO: 实现情侣空间功能
  }, [])
  
  /**
   * 发送位置
   */
  const handleSelectLocation = useCallback(() => {
    setShowAddMenu(false)
    if (onOpenLocation) {
      onOpenLocation()
    }
  }, [onOpenLocation])
  
  /**
   * 语音消息
   */
  const handleSelectVoice = useCallback(() => {
    setShowAddMenu(false)
    if (onOpenVoice) {
      onOpenVoice()
    }
  }, [onOpenVoice])
  
  /**
   * 视频通话
   */
  const handleSelectVideoCall = useCallback(() => {
    console.log('视频通话')
    // TODO: 实现视频通话功能
  }, [])
  
  /**
   * 一起听音乐
   */
  const handleSelectMusicInvite = useCallback(() => {
    console.log('一起听音乐')
    // TODO: 实现一起听功能
  }, [])
  
  return {
    showAddMenu,
    setShowAddMenu,
    handlers: {
      handleSelectRecall,
      handleSelectImage,
      handleSelectCamera,
      handleSelectTransfer,
      handleSelectIntimatePay,
      handleSelectCoupleSpace,
      handleSelectLocation,
      handleSelectVoice,
      handleSelectVideoCall,
      handleSelectMusicInvite
    }
  }
}
