/**
 * 聊天页面头部导航栏
 */

import { useNavigate } from 'react-router-dom'
import StatusBar from '../../../components/StatusBar'
import { TokenStats } from '../../../utils/tokenCounter'

interface ChatHeaderProps {
  characterName: string
  isAiTyping: boolean
  onBack?: () => void
  onMenuClick?: () => void
  tokenStats?: TokenStats | null
  onTokenStatsClick?: () => void
}

const ChatHeader = ({ characterName, isAiTyping, onBack, onMenuClick, tokenStats, onTokenStatsClick }: ChatHeaderProps) => {
  const navigate = useNavigate()
  
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }
  
  return (
    <div className="glass-effect rounded-b-[20px]">
      <StatusBar />
      <div className="px-5 py-4 flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="text-gray-700 btn-press-fast touch-ripple-effect -ml-2 p-2 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-gray-900 transition-all duration-300">
          {isAiTyping ? '正在输入' : characterName}
        </h1>
        
        <div className="flex items-center gap-2">
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
              {tokenStats.responseTime && tokenStats.responseTime > 0 && (
                <span className="text-[9px] opacity-70">·{(tokenStats.responseTime/1000).toFixed(1)}s</span>
              )}
            </button>
          )}
          
          <button 
            onClick={onMenuClick}
            className="text-gray-700 btn-press-fast touch-ripple-effect -mr-2 p-2 rounded-full"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatHeader
