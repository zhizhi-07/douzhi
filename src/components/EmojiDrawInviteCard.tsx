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
    <div className="w-64 rounded-[18px] overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100">
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* 图标 - 柔和紫配色 */}
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          
          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-[15px] leading-tight tracking-tight">你画我猜</h3>
            <p className="text-xs text-gray-500 mt-1 truncate font-medium tracking-wide">
              {isSent ? `等待 ${inviterName} 接受` : `${inviterName} 邀请你`}
            </p>
          </div>
        </div>

        {/* 状态/按钮区域 */}
        <div className="mt-5">
          {currentStatus === 'accepted' ? (
            <div className="w-full py-2.5 bg-green-50 text-green-600 rounded-xl text-xs font-bold text-center border border-green-100 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              游戏已开始
            </div>
          ) : isSent ? (
            <div className="w-full py-2.5 bg-gray-50 text-gray-400 rounded-xl text-xs font-medium text-center border border-gray-100 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              等待回应
            </div>
          ) : (
            <button
              onClick={handleAccept}
              className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 active:scale-[0.98] transition-all duration-200 shadow-sm shadow-purple-200"
            >
              接受邀请
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmojiDrawInviteCard
