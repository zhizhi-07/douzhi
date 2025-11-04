/**
 * 撤回理由输入弹窗
 */

import { useState, useEffect } from 'react'

interface RecallReasonModalProps {
  show: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

const RecallReasonModal = ({ show, onClose, onConfirm }: RecallReasonModalProps) => {
  const [reason, setReason] = useState('')

  // 每次打开弹窗时重置
  useEffect(() => {
    if (show) {
      setReason('')
    }
  }, [show])

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('请填写撤回理由')
      return
    }

    onConfirm(reason.trim())
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl m-4"
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="text-xl font-semibold text-gray-900 text-center">撤回理由</div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 text-center">
            请说明撤回这条消息的原因
          </p>

          {/* 输入框 */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例如：说错了/发错了..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            maxLength={100}
          />

          <div className="text-xs text-gray-400 text-right">
            {reason.length}/100
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              onClick={handleClose}
            >
              取消
            </button>
            <button
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              onClick={handleConfirm}
              disabled={!reason.trim()}
            >
              确认撤回
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default RecallReasonModal
