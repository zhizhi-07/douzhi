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
}

const ChatHeader = ({ characterName, characterId, characterAvatar, isAiTyping, onBack, onMenuClick, onAvatarClick, tokenStats, onTokenStatsClick }: ChatHeaderProps) => {
  const navigate = useNavigate()
  const [aiStatus, setAiStatus] = useState<string>('')
  const [fullStatus, setFullStatus] = useState<AIStatus | null>(null)

  // 获取AI状态
  useEffect(() => {
    const updateStatus = async () => {
      if (characterId && characterName) {
        // 🔥 使用 getOrCreateAIStatus 确保状态存在且不过期
        const { getOrCreateAIStatus } = await import('../../../utils/aiStatusManager')
        const status = getOrCreateAIStatus(characterId, characterName)
        setAiStatus(formatStatusShort(status))
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
    <div className="glass-effect rounded-b-[20px]">
      <StatusBar />
      <div className="px-4 py-3 flex items-center justify-between">
        {/* 左侧：返回按钮 + 头像 + 名字状态 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={handleBack}
            className="text-gray-700 btn-press-fast touch-ripple-effect p-2 rounded-full flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
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
            <p className="text-xs text-gray-500 truncate w-full text-left" title={aiStatus}>
              {isAiTyping ? '正在输入...' : (aiStatus || '在线')}
            </p>
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
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatHeader
