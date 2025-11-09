/**
 * 语音卡片组件
 * 微信风格的语音消息UI
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

  // 调试信息
  console.log('🎵 VoiceCard:', {
    messageId: message.id,
    hasVoiceUrl: !!message.voiceUrl,
    voiceUrl: message.voiceUrl?.substring(0, 50),
    duration
  })

  return (
    <div className="flex flex-col gap-2" style={{ width: '160px' }}>
      {/* 语音卡片 */}
      <div
        className={`rounded-2xl px-3 py-3 shadow-md ${
          isSent
            ? 'bg-green-500'
            : 'bg-white border border-gray-200'
        }`}
        style={{ width: '160px' }}
      >
        <div className="flex items-center gap-3">
          {/* 播放按钮 */}
          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              isSent 
                ? 'bg-white/20 hover:bg-white/30' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onPlay?.(message.id, duration, message.voiceUrl)
            }}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* 波形动画 */}
          <div
            className="flex items-center gap-0.5 flex-1 cursor-pointer"
            onClick={() => onToggleText?.(message.id)}
          >
            {[40, 60, 80, 60, 40, 70, 50, 90, 60, 40, 80, 50, 70].map((height, i) => (
              <div
                key={i}
                className={`w-0.5 rounded-full transition-all ${
                  isSent ? 'bg-white/60' : 'bg-gray-400'
                } ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
                style={{
                  height: isPlaying ? `${Math.random() * 100}%` : `${height}%`,
                  maxHeight: '16px',
                  minHeight: '4px',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>

          {/* 时长 */}
          <div className={`text-xs font-medium ${
            isSent ? 'text-white' : 'text-gray-600'
          }`}>
            {duration}"
          </div>
        </div>
      </div>

      {/* 转文字显示 */}
      {showText && (
        <div
          className={`px-3 py-2 rounded-xl text-sm ${
            isSent
              ? 'bg-white/10 text-gray-700'
              : 'bg-gray-100 text-gray-700'
          }`}
          style={{
            width: '160px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          <div className="text-xs text-gray-500 mb-1">转文字：</div>
          {message.voiceText}
        </div>
      )}
    </div>
  )
}

export default VoiceCard
