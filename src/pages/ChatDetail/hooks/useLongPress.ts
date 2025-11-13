/**
 * 长按检测Hook
 * 负责：长按消息的检测和处理，记录菜单位置
 */

import { useRef, useCallback } from 'react'
import type { Message } from '../../../types/chat'
import { playLongPressSound } from '../../../utils/soundManager'

interface MenuPosition {
  x: number
  y: number
}

export const useLongPress = (
  onLongPress: (message: Message, position: MenuPosition) => void,
  delay: number = 500
) => {
  const longPressTimerRef = useRef<number | null>(null)
  
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
    
    longPressTimerRef.current = window.setTimeout(() => {
      playLongPressSound() // 🎵 播放长按音效
      onLongPress(message, { x: clientX, y: clientY })
      // 振动反馈
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, delay)
  }, [onLongPress, delay])
  
  /**
   * 长按结束
   */
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])
  
  return {
    handleLongPressStart,
    handleLongPressEnd
  }
}
