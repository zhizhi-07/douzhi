import { useState, useEffect } from 'react'

interface EmojiDrawInviteCardProps {
  inviterName: string
  onAccept?: () => void
  status?: 'pending' | 'accepted'
  isSent?: boolean // 是否是用户发送的邀请
}

const EmojiDrawInviteCard = ({
  inviterName,
  onAccept,
  status = 'pending',
  isSent = false
}: EmojiDrawInviteCardProps) => {
  const [currentStatus, setCurrentStatus] = useState(status)

  useEffect(() => {
    setCurrentStatus(status)
  }, [status])

  const handleAccept = () => {
    console.log('🎨 EmojiDrawInviteCard: AI接受邀请')
    setCurrentStatus('accepted')
    onAccept?.()
  }

  return (
    <div className="w-64 bg-white/95 backdrop-blur-sm rounded-sm shadow-md border border-gray-300/80 relative overflow-hidden font-serif">
      {/* 试卷纹理背景 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b8b8b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* 顶部红色机密印章效果 */}
      <div className="absolute top-2 right-2 border-2 border-red-500 rounded px-1 py-0.5 transform rotate-[-10deg] opacity-60">
        <span className="text-[8px] font-bold text-red-500 tracking-widest">机密</span>
      </div>

      <div className="p-5 relative z-0">
        {/* 标题区域 */}
        <div className="border-b-2 border-gray-800 pb-2 mb-3 text-center">
          <h3 className="font-bold text-gray-900 text-lg tracking-wide font-serif">默契挑战</h3>
          <p className="text-[10px] text-gray-500 tracking-[0.2em]">你画我猜</p>
        </div>

        {/* 信息区域 */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-baseline border-b border-gray-300 border-dashed pb-1">
            <span className="text-xs font-bold text-gray-600">邀请人：</span>
            <span className="text-sm font-mono text-gray-900">{inviterName}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-gray-300 border-dashed pb-1">
            <span className="text-xs font-bold text-gray-600">类型：</span>
            <span className="text-sm font-mono text-gray-900">你画我猜</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-gray-300 border-dashed pb-1">
            <span className="text-xs font-bold text-gray-600">日期：</span>
            <span className="text-sm font-mono text-gray-900">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* 状态/按钮区域 */}
        <div className="mt-4">
          {currentStatus === 'accepted' ? (
            <div className="w-full py-2 border-2 border-green-600 text-green-700 rounded-sm text-xs font-bold text-center bg-green-50/50 uppercase tracking-wider relative overflow-hidden">
              <div className="absolute inset-0 border border-green-600 m-0.5"></div>
              挑战已开始
            </div>
          ) : isSent ? (
            <div className="w-full py-2 border border-gray-400 text-gray-500 rounded-sm text-xs font-medium text-center bg-gray-50 uppercase tracking-wider flex items-center justify-center gap-2">
              <span className="animate-pulse">●</span> 等待回应中
            </div>
          ) : (
            <button
              onClick={handleAccept}
              className="w-full py-2 bg-gray-900 text-white rounded-sm text-xs font-bold hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 uppercase tracking-widest shadow-sm border border-black"
            >
              开始挑战
            </button>
          )}
        </div>
        
        {/* 底部备注 */}
        <p className="text-[8px] text-center text-gray-400 mt-3 italic">
          * 发挥你的画功，让TA猜出来吧
        </p>
      </div>
    </div>
  )
}

export default EmojiDrawInviteCard
