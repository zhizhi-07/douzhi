/**
 * 聊天页面头部导航栏
 */

import { useNavigate } from 'react-router-dom'
import StatusBar from '../../../components/StatusBar'

interface ChatHeaderProps {
  characterName: string
  isAiTyping: boolean
  onBack?: () => void
  onMenuClick?: () => void
}

const ChatHeader = ({ characterName, isAiTyping, onBack, onMenuClick }: ChatHeaderProps) => {
  const navigate = useNavigate()
  
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }
  
  return (
    <div className="glass-effect">
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
          {isAiTyping ? (
            <span className="flex items-center gap-2">
              正在输入
              <span className="typing-indicator flex gap-1">
                <span className="dot-pulse bg-gray-600"></span>
                <span className="dot-pulse bg-gray-600"></span>
                <span className="dot-pulse bg-gray-600"></span>
              </span>
            </span>
          ) : (
            characterName
          )}
        </h1>
        
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
  )
}

export default ChatHeader
