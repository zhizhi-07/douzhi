/**
 * 聊天页面头部导航栏
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../../../components/StatusBar'
import { playSystemSound } from '../../../utils/soundManager'
import { formatStatusShort } from '../../../utils/aiStatusManager'

interface ChatHeaderProps {
  characterName: string
  characterId?: string
  isAiTyping?: boolean
  onBack?: () => void
  onMenuClick?: () => void
  onStatusClick?: () => void
  topBarImage?: string | null
  customIcons?: Record<string, string>
  topBarScale?: number
  topBarX?: number
  topBarY?: number
}

const ChatHeader = ({ characterName, characterId, isAiTyping, onBack, onMenuClick, onStatusClick, topBarImage, customIcons = {}, topBarScale, topBarX, topBarY }: ChatHeaderProps) => {
  const navigate = useNavigate()
  const [aiStatus, setAiStatus] = useState<string>('')

  // 获取AI状态
  useEffect(() => {
    const updateStatus = async () => {
      if (characterId && characterName) {
        const { getOrCreateAIStatus } = await import('../../../utils/aiStatusManager')
        const status = getOrCreateAIStatus(characterId, characterName)
        setAiStatus(status ? formatStatusShort(status) : '在线')
      }
    }

    updateStatus()

    // 每30秒检查一次状态
    const interval = setInterval(() => {
      updateStatus()
    }, 30 * 1000)

    return () => clearInterval(interval)
  }, [characterId, characterName])

  const handleBack = () => {
    playSystemSound() // 🎵 统一使用通用点击音效
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="relative glass-effect rounded-b-[20px]">
      {/* 顶栏装饰背景 */}
      {topBarImage && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 rounded-b-[20px] overflow-hidden"
          style={{
            backgroundImage: `url(${topBarImage})`,
            backgroundSize: `${topBarScale || 100}%`,
            backgroundPosition: `calc(50% + ${topBarX || 0}px) calc(50% + ${topBarY || 0}px)`
          }}
        />
      )}
      <div className="relative z-10">
        <StatusBar />
      </div>
      <div className="relative z-10 px-4 py-3 flex items-center justify-between">
        {/* 左侧：返回按钮 */}
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={handleBack}
            className="text-gray-700 btn-press-fast touch-ripple-effect p-2 rounded-full"
          >
            {customIcons['chat-back'] ? (
              <img src={customIcons['chat-back']} alt="返回" className="w-8 h-8 object-contain rounded-full" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* 中间：名字和状态居中 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center max-w-[60%]">
          <h1 className="text-base font-semibold text-gray-900 whitespace-nowrap truncate max-w-full">
            {characterName}
          </h1>
          {/* 状态栏：绿色圆点 + 状态文字 - 可点击查看详情 */}
          <button
            onClick={() => {
              playSystemSound()
              onStatusClick?.()
            }}
            className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 max-w-full btn-press-fast touch-ripple-effect px-2 py-0.5 rounded-full hover:bg-gray-100/50 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="truncate">
              {isAiTyping ? '正在输入...' : aiStatus}
            </span>
          </button>
        </div>

        {/* 右侧：功能按钮 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* 更多菜单按钮 */}
          <button
            onClick={() => {
              playSystemSound()
              onMenuClick?.()
            }}
            className="text-gray-700 btn-press-fast touch-ripple-effect p-2 rounded-full"
          >
            {customIcons['chat-more'] ? (
              <img src={customIcons['chat-more']} alt="更多" className="w-8 h-8 object-contain" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatHeader
