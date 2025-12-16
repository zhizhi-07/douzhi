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
  onOpenPhoto?: () => void,
  onOpenAlbum?: () => void,
  onOpenCoupleSpace?: () => void,
  onOpenIntimatePay?: () => void,
  onOpenAIMemo?: () => void,
  onOpenOffline?: () => void,
  onOpenPaymentRequest?: () => void,
  onOpenShopping?: () => void,
  onOpenPost?: () => void,
  onFormatCorrector?: () => void,
  onOpenWeather?: () => void,
  onOpenEnvelope?: () => void,
  onOpenJudgment?: () => void,
  onOpenLogistics?: () => void,
  onOpenContactCard?: () => void
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
    setShowAddMenu(false)
    if (onOpenAlbum) {
      onOpenAlbum()
    }
  }, [onOpenAlbum])
  
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
    setShowAddMenu(false)
    if (onOpenIntimatePay) {
      onOpenIntimatePay()
    }
  }, [onOpenIntimatePay])
  
  /**
   * 情侣空间
   */
  const handleSelectCoupleSpace = useCallback(() => {
    setShowAddMenu(false)
    if (onOpenCoupleSpace) {
      onOpenCoupleSpace()
    }
  }, [onOpenCoupleSpace])
  
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
    // 由ChatDetail处理
  }, [])
  
  /**
   * AI随笔
   */
  const handleSelectAIMemo = useCallback(() => {
    console.log('🎯 点击随笔按钮')
    setShowAddMenu(false)
    if (onOpenAIMemo) {
      console.log('✅ 调用onOpenAIMemo')
      onOpenAIMemo()
    } else {
      console.warn('⚠️ onOpenAIMemo 未定义')
    }
  }, [onOpenAIMemo])
  
  /**
   * 线下模式
   */
  const handleSelectOffline = useCallback(() => {
    setShowAddMenu(false)
    if (onOpenOffline) {
      onOpenOffline()
    }
  }, [onOpenOffline])
  
  /**
   * 代付
   */
  const handleSelectPaymentRequest = useCallback(() => {
    setShowAddMenu(false)
    if (onOpenPaymentRequest) {
      onOpenPaymentRequest()
    }
  }, [onOpenPaymentRequest])
  
  /**
   * 网购商店
   */
  const handleSelectShopping = useCallback(() => {
    setShowAddMenu(false)
    if (onOpenShopping) {
      onOpenShopping()
    }
  }, [onOpenShopping])
  
  /**
   * AI帖子生成
   */
  const handleSelectPost = useCallback(() => {
    setShowAddMenu(false)
    if (onOpenPost) {
      onOpenPost()
    }
  }, [onOpenPost])
  
  /**
   * 格式修正
   */
  const handleSelectFormatCorrector = useCallback(() => {
    console.log('🔧 点击格式修正按钮')
    setShowAddMenu(false)
    if (onFormatCorrector) {
      console.log('✅ 调用onFormatCorrector')
      onFormatCorrector()
    } else {
      console.warn('⚠️ onFormatCorrector 未定义')
    }
  }, [onFormatCorrector])

  /**
   * 天气
   */
  const handleSelectWeather = useCallback(() => {
    console.log('🌤️ 点击天气按钮')
    setShowAddMenu(false)
    if (onOpenWeather) {
      onOpenWeather()
    }
  }, [onOpenWeather])

  /**
   * 信封
   */
  const handleSelectEnvelope = useCallback(() => {
    console.log('✉️ 点击信封按钮')
    setShowAddMenu(false)
    if (onOpenEnvelope) {
      onOpenEnvelope()
    }
  }, [onOpenEnvelope])

  /**
   * 判定对错
   */
  const handleSelectJudgment = useCallback(() => {
    console.log('⚖️ 点击判定对错按钮')
    setShowAddMenu(false)
    if (onOpenJudgment) {
      onOpenJudgment()
    }
  }, [onOpenJudgment])

  /**
   * 物流信息
   */
  const handleSelectLogistics = useCallback(() => {
    console.log('🚚 点击物流按钮')
    setShowAddMenu(false)
    if (onOpenLogistics) {
      onOpenLogistics()
    }
  }, [onOpenLogistics])

  /**
   * 发送名片
   */
  const handleSelectContactCard = useCallback(() => {
    console.log('📇 点击名片按钮')
    setShowAddMenu(false)
    if (onOpenContactCard) {
      onOpenContactCard()
    }
  }, [onOpenContactCard])

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
      handleSelectMusicInvite,
      handleSelectAIMemo,
      handleSelectOffline,
      handleSelectPaymentRequest,
      handleSelectShopping,
      handleSelectPost,
      handleSelectFormatCorrector,
      handleSelectWeather,
      handleSelectEnvelope,
      handleSelectJudgment,
      handleSelectLogistics,
      handleSelectContactCard
    }
  }
}
