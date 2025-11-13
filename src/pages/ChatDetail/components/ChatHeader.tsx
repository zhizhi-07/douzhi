/**
 * 聊天页面头部导航栏
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../../../components/StatusBar'
import { TokenStats } from '../../../utils/tokenCounter'
import { playBackSound, playClickBrightSound } from '../../../utils/soundManager'
import { getAIStatus, formatStatusShort } from '../../../utils/aiStatusManager'

interface ChatHeaderProps {
  characterName: string
  characterId?: string
  isAiTyping: boolean
  onBack?: () => void
  onMenuClick?: () => void
  tokenStats?: TokenStats | null
  onTokenStatsClick?: () => void
}

const ChatHeader = ({ characterName, characterId, isAiTyping, onBack, onMenuClick, tokenStats, onTokenStatsClick }: ChatHeaderProps) => {
  const navigate = useNavigate()
  const [aiStatus, setAiStatus] = useState<string>('')

  // 获取AI状态
  useEffect(() => {
    if (characterId) {
      const status = getAIStatus(characterId)
      if (status) {
        setAiStatus(formatStatusShort(status))
      }
    }

    // 每30秒更新一次状态
    const interval = setInterval(() => {
      if (characterId) {
        const status = getAIStatus(characterId)
        if (status) {
          setAiStatus(formatStatusShort(status))
        }
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [characterId])

  const handleBack = () => {
    playBackSound() // 🎵 播放返回音效
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

          {/* 头像 */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {characterName.charAt(0)}
          </div>

          {/* 名字和状态 */}
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {characterName}
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {isAiTyping ? '正在输入...' : (aiStatus || '在线')}
            </p>
          </div>
        </div>

        {/* 右侧：功能按钮 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Token 统计按钮 */}
          {tokenStats && tokenStats.total > 0 && (
            <button
              onClick={onTokenStatsClick}
              className="text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <span className="font-medium">{(tokenStats.total / 1000).toFixed(1)}k</span>
            </button>
          )}

          <button
            onClick={() => {
              playClickBrightSound()
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
