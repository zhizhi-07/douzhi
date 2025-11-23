import { useState } from 'react'

interface RedPacketOpenModalProps {
  show: boolean
  onClose: () => void
  onOpen: () => void
  senderName: string
  senderAvatar: string
  blessing: string
}

const RedPacketOpenModal = ({
  show,
  onClose,
  onOpen,
  senderName,
  senderAvatar,
  blessing
}: RedPacketOpenModalProps) => {
  const [isOpening, setIsOpening] = useState(false)

  if (!show) return null

  const handleOpen = () => {
    setIsOpening(true)
    // 播放动画1秒后触发打开逻辑
    setTimeout(() => {
      onOpen()
      setIsOpening(false)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* 红包弹窗主体 */}
      <div 
        className="relative w-[320px] h-[480px] bg-[#cf3c32] rounded-[20px] shadow-2xl overflow-hidden modal-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部半圆装饰 */}
        <div className="absolute top-0 left-0 right-0 h-[350px] bg-[#d9594c] rounded-b-[50%] scale-x-150 translate-y-[-100px] shadow-lg z-0" />

        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white/80 hover:text-white p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 发送者信息 */}
        <div className="absolute top-[80px] left-0 right-0 z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#fceea6] overflow-hidden mb-3 shadow-md bg-gray-200">
            {senderAvatar ? (
              <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-xl">
                {senderName[0]}
              </div>
            )}
          </div>
          <div className="text-[#fceea6] text-lg font-medium mb-1">
            {senderName} 的红包
          </div>
          <div className="text-[#fceea6]/90 text-xl px-8 text-center mt-4 font-medium">
            {blessing || '恭喜发财，大吉大利'}
          </div>
        </div>

        {/* 拆红包按钮 */}
        <div className="absolute top-[280px] left-0 right-0 z-20 flex justify-center">
          <button
            onClick={handleOpen}
            disabled={isOpening}
            className={`w-24 h-24 rounded-full bg-[#fceea6] shadow-lg flex items-center justify-center active:scale-95 transition-all duration-500 ${isOpening ? 'rotate-y' : ''}`}
            style={{
              border: '4px solid #fceea6',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <span className={`text-[#cf3c32] text-4xl font-bold ${isOpening ? 'hidden' : 'block'}`}>
              開
            </span>
            {isOpening && (
              <div className="w-full h-full rounded-full border-4 border-[#cf3c32] border-t-transparent animate-spin" />
            )}
          </button>
        </div>

        {/* 底部装饰 */}
        <div className="absolute bottom-8 left-0 right-0 text-center z-10">
          <div className="text-[#fceea6]/60 text-sm">
            查看大家的手气 &gt;
          </div>
        </div>
      </div>

      <style>{`
        .rotate-y {
          animation: flip-horizontal 0.6s infinite linear;
        }
        @keyframes flip-horizontal {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  )
}

export default RedPacketOpenModal
