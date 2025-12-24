/**
 * 长按检测Hook
 * 负责：长按消息的检测和处理，记录菜单位置
 * 优化：添加移动距离检测，滑动时不触发长按
 */

import { useRef, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { playLongPressSound } from '../../../utils/soundManager'

interface MenuPosition {
  x: number
  y: number
}

// 移动阈值（像素），超过此距离取消长按
const MOVE_THRESHOLD = 10

export const useLongPress = (
  onLongPress: (message: Message, position: MenuPosition) => void,
  delay: number = 600 // 默认延迟从500ms改为600ms，更不容易误触
) => {
  const longPressTimerRef = useRef<number | null>(null)
  const startPositionRef = useRef<{ x: number; y: number } | null>(null)
  const isMovedRef = useRef(false)
  
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
    isMovedRef.current = false
    
    longPressTimerRef.current = window.setTimeout(() => {
      // 如果已经移动过，不触发长按
      if (isMovedRef.current) {
        return
      }
      playLongPressSound() // 🎵 播放长按音效
      onLongPress(message, { x: clientX, y: clientY })
      // 振动反馈
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, delay)
  }, [onLongPress, delay])
  
  /**
   * 长按移动检测
   */
  const handleLongPressMove = useCallback((
    event: React.TouchEvent | React.MouseEvent
  ) => {
    if (!startPositionRef.current || !longPressTimerRef.current) {
      return
    }
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    // 计算移动距离
    const deltaX = Math.abs(clientX - startPositionRef.current.x)
    const deltaY = Math.abs(clientY - startPositionRef.current.y)
    
    // 如果移动超过阈值，取消长按计时器
    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      isMovedRef.current = true
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }, [])
  
  /**
   * 长按结束
   */
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    startPositionRef.current = null
    isMovedRef.current = false
  }, [])
  
  return {
    handleLongPressStart,
    handleLongPressMove,
    handleLongPressEnd
  }
}
