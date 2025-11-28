import { useEffect, useState } from 'react'
import statusIcons from '../assets/status-icons.webp'

interface StatusBarProps {
  theme?: 'light' | 'dark'
}

const StatusBar = ({ theme = 'light' }: StatusBarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // 专注模式设置
  const [focusMode, setFocusMode] = useState(() => {
    const saved = localStorage.getItem('focus_mode')
    return saved ? JSON.parse(saved) : null
  })
  
  // 时间背景设置
  const [timeSettings, setTimeSettings] = useState(() => {
    const enabled = localStorage.getItem('time_background_enabled')
    const color = localStorage.getItem('time_background_color')
    return {
      showBg: enabled !== 'false',
      color: color || '#22c55e'
    }
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])
  
  // 监听专注模式和时间设置变化
  useEffect(() => {
    const handleFocusModeChange = () => {
      const saved = localStorage.getItem('focus_mode')
      setFocusMode(saved ? JSON.parse(saved) : null)
      console.log('📡 StatusBar收到专注模式更新:', saved)
    }
    
    const handleTimeSettingChange = () => {
      const enabled = localStorage.getItem('time_background_enabled')
      const color = localStorage.getItem('time_background_color')
      setTimeSettings({
        showBg: enabled !== 'false',
        color: color || '#22c55e'
      })
      console.log('📡 StatusBar收到时间设置更新')
    }
    
    // 监听自定义事件
    window.addEventListener('focusModeChanged', handleFocusModeChange)
    window.addEventListener('timeSettingChanged', handleTimeSettingChange)
    
    return () => {
      window.removeEventListener('focusModeChanged', handleFocusModeChange)
      window.removeEventListener('timeSettingChanged', handleTimeSettingChange)
    }
  }, [])

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <div 
      className={`status-bar flex items-center justify-between pl-6 pr-2 text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
    >
      {/* 左侧：时间（可自定义背景） */}
      <div className="flex items-center gap-2">
        <span 
          className="tracking-tight px-2 py-0.5 rounded-full text-sm font-bold"
          style={{
            backgroundColor: timeSettings.showBg !== false ? (timeSettings.color || '#22c55e') : 'transparent',
            color: timeSettings.showBg !== false ? 'white' : (theme === 'dark' ? 'white' : '#111827')
          }}
        >
          {formatTime(currentTime)}
        </span>
        
        {/* 专注模式图标和文字 */}
        {focusMode && (focusMode.icon || focusMode.name) && (
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{
              backgroundColor: focusMode.showBg !== false ? (focusMode.color || '#9333ea') : 'transparent',
              color: focusMode.showBg !== false ? 'white' : (theme === 'dark' ? 'white' : '#111827')
            }}
          >
            {focusMode.icon && (
              <img src={focusMode.icon} alt="专注模式" className="w-4 h-4 object-cover rounded" />
            )}
            {focusMode.name && <span>{focusMode.name}</span>}
          </div>
        )}
      </div>

      {/* 中间：摄像头凹槽区域（仅用于美观，可选） */}
      <div className="flex-1" />

      {/* 右侧：状态图标（信号、WiFi、电池）- 放大 */}
      <div className="flex items-center">
        <img src={statusIcons} alt="状态栏图标" className={`h-9 ${theme === 'dark' ? 'brightness-0 invert' : ''}`} />
      </div>
    </div>
  )
}

export default StatusBar
