/**
 * 长按检测Hook
 * 负责：长按消息的检测和处理，记录菜单位置
 * 优化：使用全局事件监听检测移动/滚动，解决滑动时误触发问题
 */

import { useRef, useCallback, useEffect } from 'react'
import type { Message } from '../../../types/chat'
import { playLongPressSound } from '../../../utils/soundManager'

interface MenuPosition {
  x: number
  y: number
}

// 移动阈值（像素），超过此距离取消长按
const MOVE_THRESHOLD = 8

export const useLongPress = (
  onLongPress: (message: Message, position: MenuPosition) => void,
  delay: number = 500
) => {
  const longPressTimerRef = useRef<number | null>(null)
  const startPositionRef = useRef<{ x: number; y: number } | null>(null)
  const pendingMessageRef = useRef<{ message: Message; x: number; y: number } | null>(null)
  
  // 取消长按的函数
  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    startPositionRef.current = null
    pendingMessageRef.current = null
  }, [])
  
  // 全局 touchmove 监听 - 检测任何移动都取消长按
  useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!startPositionRef.current || !longPressTimerRef.current) return
      
      const touch = e.touches[0]
      if (!touch) return
      
      const deltaX = Math.abs(touch.clientX - startPositionRef.current.x)
      const deltaY = Math.abs(touch.clientY - startPositionRef.current.y)
      
      // 任何移动超过阈值就取消
      if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
        cancelLongPress()
      }
    }
    
    // 滚动时也取消长按
    const handleScroll = () => {
      cancelLongPress()
    }
    
    // 使用 passive: false 确保能检测到移动
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    
    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [cancelLongPress])
  
  /**
   * 长按开始
   */
  const handleLongPressStart = useCallback((
    message: Message,
    event: React.TouchEvent | React.MouseEvent
  ) => {
    // 获取点击位置
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    // 记录初始位置
    startPositionRef.current = { x: clientX, y: clientY }
    pendingMessageRef.current = { message, x: clientX, y: clientY }
    
    longPressTimerRef.current = window.setTimeout(() => {
      if (pendingMessageRef.current) {
        playLongPressSound()
        onLongPress(pendingMessageRef.current.message, { 
          x: pendingMessageRef.current.x, 
          y: pendingMessageRef.current.y 
        })
        // 振动反馈
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }
      cancelLongPress()
    }, delay)
  }, [onLongPress, delay, cancelLongPress])
  
  /**
   * 长按移动检测（保留作为备用）
   */
  const handleLongPressMove = useCallback((
    event: React.TouchEvent | React.MouseEvent
  ) => {
    if (!startPositionRef.current || !longPressTimerRef.current) {
      return
    }
    
    const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY
    
    if (clientX === undefined || clientY === undefined) return
    
    const deltaX = Math.abs(clientX - startPositionRef.current.x)
    const deltaY = Math.abs(clientY - startPositionRef.current.y)
    
    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      cancelLongPress()
    }
  }, [cancelLongPress])
  
  /**
   * 长按结束
   */
  const handleLongPressEnd = useCallback(() => {
    cancelLongPress()
  }, [cancelLongPress])
  
  return {
    handleLongPressStart,
    handleLongPressMove,
    handleLongPressEnd
  }
}
