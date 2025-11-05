/**
 * 来电弹窗组件
 */

interface IncomingCallScreenProps {
  show: boolean
  character: {
    name: string
    avatar?: string
  }
  isVideoCall: boolean
  onAccept: () => void
  onReject: () => void
}

const IncomingCallScreen = ({ show, character, isVideoCall, onAccept, onReject }: IncomingCallScreenProps) => {
  if (!show) return null

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9998] w-[90%] max-w-sm animate-slide-down">
      {/* 来电卡片 */}
      <div 
        className="rounded-[28px] p-5 border"
        style={{
          background: 'linear-gradient(135deg, rgba(60, 60, 70, 0.85) 0%, rgba(45, 45, 55, 0.90) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderColor: 'rgba(255, 255, 255, 0.18)',
          boxShadow: `
            0 20px 60px -12px rgba(0, 0, 0, 0.5),
            0 8px 20px -6px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.2)
          `
        }}
      >
        <div className="flex items-center gap-4">
          {/* 头像 */}
          <div 
            className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(80, 80, 90, 0.9), rgba(60, 60, 70, 0.9))',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
            }}
          >
            {character.avatar ? (
              <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-lg font-semibold flex items-center justify-center h-full">
                {character.name.charAt(0)}
              </span>
            )}
          </div>

          {/* 名字和通话类型 */}
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-[17px] truncate mb-0.5"
              style={{
                color: 'rgba(255, 255, 255, 0.95)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
            >
              {character.name}
            </h3>
            <p 
              className="text-[13px]"
              style={{
                color: 'rgba(255, 255, 255, 0.65)',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
              }}
            >
              {isVideoCall ? '视频通话' : '语音通话'}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            {/* 接听按钮 */}
            <button
              onClick={onAccept}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #34C759 0%, #30B350 100%)',
                boxShadow: `
                  0 4px 16px rgba(52, 199, 89, 0.4),
                  0 2px 8px rgba(0, 0, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.25)
                `
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))' }}>
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </button>

            {/* 挂断按钮 */}
            <button
              onClick={onReject}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #FF3B30 0%, #E8352A 100%)',
                boxShadow: `
                  0 4px 16px rgba(255, 59, 48, 0.4),
                  0 2px 8px rgba(0, 0, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.25)
                `
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))' }}>
                <path d="M12,9C10.4,9,8.85,9.25,7.4,9.72v2.09C7.4,12.46,6.86,13,6.21,13H3.78c-0.65,0-1.18-0.54-1.18-1.18v-1.09 C2.6,5.88,6.88,1.6,11.73,1.6h0.55c4.85,0,9.13,4.28,9.13,9.13v1.09c0,0.65-0.54,1.18-1.18,1.18h-2.43 c-0.65,0-1.18-0.54-1.18-1.18V9.72C15.15,9.25,13.6,9,12,9z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 下滑动画 */}
      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default IncomingCallScreen
