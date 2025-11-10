/**
 * 语音卡片组件
 * 简约风格的语音消息UI
 */

import type { Message } from '../types/chat'

interface VoiceCardProps {
  message: Message
  isPlaying?: boolean
  showText?: boolean
  onPlay?: (messageId: number, duration: number, voiceUrl?: string) => void
  onToggleText?: (messageId: number) => void
}

const VoiceCard = ({ 
  message, 
  isPlaying = false,
  showText = false,
  onPlay,
  onToggleText
}: VoiceCardProps) => {
  if (!message.voiceText) return null

  const isSent = message.type === 'sent'
  // 优先使用真实音频时长，如果没有则按字数估算
  const duration = message.duration || Math.min(Math.max(Math.ceil(message.voiceText.length / 5), 1), 60)

  return (
    <div className={`flex flex-col gap-1.5 ${isSent ? 'items-end' : 'items-start'}`}>
      {/* 语音卡片 - 简约设计 */}
      <div
        className={`message-bubble rounded-full px-3 py-2 ${
          isSent
            ? ''
            : 'bg-white shadow-md'
        }`}
        style={{ 
          width: '120px'
        }}
      >
        <div className="flex items-center gap-2">
          {/* 播放按钮 */}
          <button
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              isSent 
                ? 'bg-white/20' 
                : 'bg-gray-900'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onPlay?.(message.id, duration, message.voiceUrl)
            }}
          >
            {isPlaying ? (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* 简洁波形 */}
          <div
            className="flex items-center gap-0.5 flex-1 h-4 cursor-pointer"
            onClick={() => onToggleText?.(message.id)}
          >
            {[40, 60, 80, 60, 50, 70, 55, 75, 65].map((height, i) => (
              <div
                key={i}
                className={`w-0.5 rounded-full ${
                  isSent 
                    ? 'bg-white/60' 
                    : 'bg-gray-400'
                } ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
                style={{
                  height: `${height}%`,
                  maxHeight: '14px',
                  minHeight: '4px',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>

          {/* 时长 */}
          <div className={`text-xs ${
            isSent ? 'text-white' : 'text-gray-600'
          }`}>
            {duration}"
          </div>
        </div>
      </div>

      {/* 转文字显示 */}
      {showText && (
        <div
          className="px-3 py-2 rounded-2xl text-xs bg-gray-50 text-gray-700"
          style={{
            width: '120px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {message.voiceText}
        </div>
      )}
    </div>
  )
}

export default VoiceCard
