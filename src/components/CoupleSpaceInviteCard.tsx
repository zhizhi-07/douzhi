/**
 * 情侣空间邀请卡片
 */

import { useState } from 'react'

interface CoupleSpaceInviteCardProps {
  senderName: string
  senderAvatar?: string
  status: 'pending' | 'accepted' | 'rejected'
  onAccept?: () => void
  onReject?: () => void
  isReceived: boolean  // true: 收到的邀请, false: 发出的邀请
}

const CoupleSpaceInviteCard = ({
  senderName,
  senderAvatar,
  status,
  onAccept,
  onReject,
  isReceived
}: CoupleSpaceInviteCardProps) => {
  const [processing, setProcessing] = useState(false)

  const handleAccept = async () => {
    if (processing || !onAccept) return
    setProcessing(true)
    try {
      await onAccept()
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (processing || !onReject) return
    setProcessing(true)
    try {
      await onReject()
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="glass-card rounded-2xl overflow-hidden shadow-lg border border-white/30">
        {/* 横向布局 */}
        <div className="flex items-stretch">
          {/* 左侧：爱心图标（居中） */}
          <div className="flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-8 py-4">
            {/* 爱心图标 */}
            <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center shadow-md border border-white/40">
              <svg className="w-9 h-9 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>

          {/* 右侧：信息和按钮 */}
          <div className="flex-1 bg-white/50 px-4 py-4 flex flex-col justify-between">
            {/* 标题和描述 */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{senderName}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {isReceived ? '邀请你加入情侣空间' : '已发送情侣空间邀请'}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {status === 'pending' 
                  ? (isReceived ? '建立专属情侣空间，共同记录美好时光' : '等待对方回应中...')
                  : (status === 'accepted' ? '已建立情侣空间' : '邀请已拒绝')}
              </p>
            </div>

            {/* 按钮区域 */}
            {isReceived && status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 py-2 rounded-lg glass-card text-gray-700 text-sm font-medium shadow-sm border border-white/30 hover:scale-[0.98] active:scale-[0.95] transition-all disabled:opacity-50"
                >
                  拒绝
                </button>
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm font-semibold shadow-sm hover:scale-[0.98] active:scale-[0.95] transition-all disabled:opacity-50"
                >
                  {processing ? '处理中...' : '接受'}
                </button>
              </div>
            )}

            {/* 状态显示 */}
            {status !== 'pending' && (
              <div className={`mt-3 text-center text-sm font-medium ${
                status === 'accepted' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {status === 'accepted' 
                  ? isReceived ? '✓ 已接受邀请' : '✓ 对方已接受'
                  : isReceived ? '✕ 已拒绝邀请' : '✕ 对方已拒绝'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoupleSpaceInviteCard
