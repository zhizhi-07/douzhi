/**
 * 聊天页面头部导航栏
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../../../components/StatusBar'
import { TokenStats } from '../../../utils/tokenCounter'
import { playSystemSound } from '../../../utils/soundManager'
import { formatStatusShort, AIStatus } from '../../../utils/aiStatusManager'

interface ChatHeaderProps {
  characterName: string
  characterId?: string
  characterAvatar?: string
  isAiTyping: boolean
  onBack?: () => void
  onMenuClick?: () => void
  onAvatarClick?: () => void
  tokenStats?: TokenStats | null
  onTokenStatsClick?: () => void
  topBarImage?: string | null
  customIcons?: Record<string, string>
  onAddOfflineRecord?: () => void  // 新增：添加线下记录
}

const ChatHeader = ({ characterName, characterId, characterAvatar, isAiTyping, onBack, onMenuClick, onAvatarClick, tokenStats, onTokenStatsClick, topBarImage, customIcons = {}, onAddOfflineRecord }: ChatHeaderProps) => {
  const navigate = useNavigate()
  const [aiStatus, setAiStatus] = useState<string>('')
  const [fullStatus, setFullStatus] = useState<AIStatus | null>(null)

  // 获取AI状态
  useEffect(() => {
    const updateStatus = async () => {
      if (characterId && characterName) {
        // 🔥 获取状态，如果没有则返回 null（不自动生成）
        const { getOrCreateAIStatus } = await import('../../../utils/aiStatusManager')
        const status = getOrCreateAIStatus(characterId, characterName)
        // 如果有状态就显示，否则显示"在线"
        setAiStatus(status ? formatStatusShort(status) : '在线')
        setFullStatus(status) // 保存完整状态
      }
    }

    updateStatus()

    // 🔥 每30秒检查一次状态是否需要更新
    const interval = setInterval(() => {
      updateStatus()
    }, 30 * 1000) // 30秒

    return () => clearInterval(interval)
  }, [characterId, characterName])

  // 处理头像点击
  const handleAvatarClick = () => {
    if (onAvatarClick) {
      onAvatarClick()
    }
  }

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
        <div className="absolute inset-0 pointer-events-none z-0 rounded-b-[20px] overflow-hidden">
          <img src={topBarImage} alt="顶栏装饰" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="relative z-10">
        <StatusBar />
      </div>
      <div className="relative z-10 px-4 py-3 flex items-center justify-between">
        {/* 左侧：返回按钮 + 头像 + 名字状态 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={handleBack}
            className="text-gray-700 btn-press-fast touch-ripple-effect p-2 rounded-full flex-shrink-0"
          >
            {customIcons['chat-back'] ? (
              <img src={customIcons['chat-back']} alt="返回" className="w-8 h-8 object-contain rounded-full" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>

          {/* 头像 - 可点击 */}
          <button
            onClick={handleAvatarClick}
            className="flex-shrink-0 btn-press-fast"
          >
            {characterAvatar ? (
              <img
                src={characterAvatar}
                alt={characterName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {characterName.charAt(0)}
              </div>
            )}
          </button>

          {/* 名字和状态 - 可点击 */}
          <button
            onClick={handleAvatarClick}
            className="flex flex-col min-w-0 flex-1 items-start btn-press-fast"
          >
            <h1 className="text-base font-semibold text-gray-900 truncate w-full text-left">
              {characterName}
            </h1>
            {/* 状态栏：绿色圆点 + 状态文字 */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate w-full">
              {/* 绿色在线圆点（像QQ那样） */}
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
              <span className="truncate" title={aiStatus}>
                {isAiTyping ? '正在输入...' : aiStatus}
              </span>
            </div>
          </button>
        </div>

        {/* 右侧：功能按钮 */}
        <div className="flex items-center gap-1 flex-shrink-0">
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
