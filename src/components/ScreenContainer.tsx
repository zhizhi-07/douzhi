import { ReactNode, useEffect, useState } from 'react'

interface ScreenContainerProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  // 是否应用顶部边距（某些页面如桌面可能不需要）
  applyTopOffset?: boolean
  // 是否应用底部边距
  applyBottomOffset?: boolean
}

/**
 * 屏幕容器组件
 * 用于包装页面内容，应用屏幕边距设置
 * 让内容正确显示在iOS全屏模式下
 */
const ScreenContainer = ({ 
  children, 
  className = '', 
  style = {},
  applyTopOffset = true,
  applyBottomOffset = true
}: ScreenContainerProps) => {
  const [offsets, setOffsets] = useState({
    top: parseInt(localStorage.getItem('screen_top_offset') || '0'),
    bottom: parseInt(localStorage.getItem('screen_bottom_offset') || '0')
  })

  useEffect(() => {
    const handleScreenSettingsChange = () => {
      setOffsets({
        top: parseInt(localStorage.getItem('screen_top_offset') || '0'),
        bottom: parseInt(localStorage.getItem('screen_bottom_offset') || '0')
      })
    }

    window.addEventListener('screenSettingsChanged', handleScreenSettingsChange)
    return () => window.removeEventListener('screenSettingsChanged', handleScreenSettingsChange)
  }, [])

  // 计算内容区域的样式
  const containerStyle: React.CSSProperties = {
    ...style,
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  }

  // 内容包装器样式，用于应用边距
  const contentStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    // 顶部偏移：正值向下移动内容，负值向上延伸背景
    top: applyTopOffset && offsets.top !== 0 ? `${Math.max(offsets.top, 0)}px` : 0,
    // 底部偏移：正值向上移动内容，负值向下延伸背景
    bottom: applyBottomOffset && offsets.bottom !== 0 ? `${Math.max(offsets.bottom, 0)}px` : 0,
    overflow: 'auto',
    // 如果有负值偏移，需要调整高度
    ...(applyTopOffset && offsets.top < 0 ? { paddingTop: `${Math.abs(offsets.top)}px` } : {}),
    ...(applyBottomOffset && offsets.bottom < 0 ? { paddingBottom: `${Math.abs(offsets.bottom)}px` } : {})
  }

  return (
    <div className={`screen-container ${className}`} style={containerStyle}>
      <div className="screen-content" style={contentStyle}>
        {children}
      </div>
    </div>
  )
}

export default ScreenContainer
