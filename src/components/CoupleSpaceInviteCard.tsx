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
    <div className="w-64 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      {/* 主要内容区域 - 模仿小程序分享卡片 */}
      <div className="p-4 flex gap-3">
        <div className="flex-1 flex flex-col justify-between py-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-gray-900">情侣空间</span>
          </div>
          <div className="text-xs text-gray-500 leading-relaxed">
            发起了情侣空间
          </div>
        </div>
        {/* 右侧粉色爱心图标 */}
        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            {/* 小心心 */}
            <path d="M18.5 15.5c0 1.93-1.57 3.5-3.5 3.5-1.93 0-3.5-1.57-3.5-3.5 0-1.93 1.57-3.5 3.5-3.5 1.93 0 3.5 1.57 3.5 3.5z" fill="white" opacity="0.9" transform="scale(0.5) translate(24, 24)" />
          </svg>
        </div>
      </div>

      {/* 底部来源标识 */}
      <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="p-0.5 bg-pink-100 rounded-full">
            <svg className="w-2.5 h-2.5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <span className="text-[10px] text-gray-400">情侣空间</span>
        </div>
        {/* 非pending状态显示结果 */}
        {status !== 'pending' && (
          <span className={`text-[10px] ${status === 'accepted' ? 'text-pink-500' : 'text-gray-400'}`}>
            {status === 'accepted' ? '已开启' : '已拒绝'}
          </span>
        )}
      </div>

      {/* 操作按钮区 (仅pending状态且为接收方显示) */}
      {isReceived && status === 'pending' && (
        <div className="flex border-t border-gray-100 divide-x divide-gray-100">
          <button
            onClick={handleReject}
            disabled={processing}
            className="flex-1 py-3 text-sm text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium"
          >
            拒绝
          </button>
          <button
            onClick={handleAccept}
            disabled={processing}
            className="flex-1 py-3 text-sm text-pink-500 hover:bg-pink-50 active:bg-pink-100 transition-colors font-medium"
          >
            {processing ? '处理中...' : '接受邀请'}
          </button>
        </div>
      )}
    </div>
  )
}

export default CoupleSpaceInviteCard
