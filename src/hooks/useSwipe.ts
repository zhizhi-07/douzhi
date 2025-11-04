import { useRef } from 'react'

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  minSwipeDistance?: number
}

export const useSwipe = ({ 
  onSwipeLeft, 
  onSwipeRight, 
  minSwipeDistance = 50 
}: UseSwipeOptions) => {
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }

  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current
    const diffY = Math.abs(touchEndY.current - touchStartY.current)

    // 只在水平滑动时触发（X方向移动大于Y方向）
    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffX) > diffY) {
      if (diffX > 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (diffX < 0 && onSwipeRight) {
        onSwipeRight()
      }
    }
  }

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}
