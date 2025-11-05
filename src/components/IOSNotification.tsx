/**
 * iOS风格通知组件
 */

import { useState, useEffect } from 'react'

interface IOSNotificationProps {
  show: boolean
  title: string
  subtitle?: string
  message: string
  icon?: string
  onClose: () => void
  onClick?: () => void
  duration?: number // 自动关闭时间（毫秒），默认5000ms
}

const IOSNotification = ({
  show,
  title,
  subtitle,
  message,
  icon,
  onClose,
  onClick,
  duration = 5000
}: IOSNotificationProps) => {
  const [visible, setVisible] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      
      // 自动关闭
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaY = e.touches[0].clientY - startY
    if (deltaY < 0) { // 只允许向上滑动
      setCurrentY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (currentY < -50) { // 滑动超过50px则关闭
      handleClose()
    }
    setCurrentY(0)
    setIsDragging(false)
  }

  const handleClick = () => {
    // 点击通知触发跳转
    if (onClick) {
      onClick()
    }
    handleClose()
  }

  if (!show && !visible) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div 
        className={`absolute top-0 left-0 right-0 flex justify-center px-2 pt-2 transition-all duration-300 pointer-events-auto ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{
          transform: `translateY(${visible ? currentY : -100}px)`
        }}
      >
        <div
          className="w-full max-w-[393px] bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl overflow-hidden cursor-pointer"
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          {/* 顶部指示条 */}
          <div className="w-full h-1 flex justify-center pt-1">
            <div className="w-9 h-1 bg-gray-300/60 rounded-full"></div>
          </div>

          {/* 通知内容 */}
          <div className="px-3 pt-2 pb-3">
            <div className="flex items-start gap-3">
              {/* 应用图标/头像 */}
              <div className="flex-shrink-0 mt-0.5">
                {icon ? (
                  // 判断是图片URL还是emoji
                  icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('/') ? (
                    <img 
                      src={icon} 
                      alt={title}
                      className="w-10 h-10 rounded-full object-cover shadow-md"
                    />
                  ) : (
                    // emoji图标
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-md text-lg">
                      {icon}
                    </div>
                  )
                ) : (
                  // 默认微信图标
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-md">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                      <path d="M8.5 3C4.91 3 2 5.686 2 9c0 1.846.906 3.471 2.333 4.667L3.5 16.5l3.167-1.5C7.553 15.326 8.48 15.5 9.5 15.5c.166 0 .33-.007.493-.02C9.373 14.457 9 13.264 9 12c0-3.314 2.686-6 6-6 .35 0 .693.03 1.027.088C15.41 4.19 12.286 3 8.5 3zm7.5 6c-2.761 0-5 2.015-5 4.5s2.239 4.5 5 4.5c.827 0 1.607-.15 2.316-.418L21.5 19l-1.167-2.333C21.591 15.471 22 14.028 22 12.5c0-2.485-2.239-4.5-5-4.5z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* 文字内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-gray-900 truncate">
                    {title}
                  </span>
                  <span className="text-[11px] text-gray-500 flex-shrink-0">
                    现在
                  </span>
                </div>
                
                {subtitle && (
                  <div className="text-[13px] text-gray-600 mb-1 truncate">
                    {subtitle}
                  </div>
                )}
                
                <div className="text-[13px] text-gray-900 leading-[18px] line-clamp-3">
                  {message}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IOSNotification
