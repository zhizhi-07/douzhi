/**
 * 语音发送组件
 * 用户输入文本，模拟发送语音
 */

import { useState, useEffect } from 'react'

interface VoiceSenderProps {
  show: boolean
  onClose: () => void
  onSend: (voiceText: string) => void
}

const VoiceSender = ({ show, onClose, onSend }: VoiceSenderProps) => {
  const [voiceText, setVoiceText] = useState('')

  // 每次打开弹窗时重置表单
  useEffect(() => {
    if (show) {
      setVoiceText('')
    }
  }, [show])

  const handleSend = () => {
    if (!voiceText.trim()) {
      alert('请输入语音内容')
      return
    }

    onSend(voiceText.trim())

    // 重置表单
    setVoiceText('')
  }

  const handleClose = () => {
    setVoiceText('')
    onClose()
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-[48px] shadow-2xl"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-xl font-semibold text-gray-900 text-center">发送语音消息</div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 text-center">
            输入语音内容（模拟语音转文字）
          </p>

          {/* 输入框 */}
          <textarea
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder="请输入语音内容..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-[32px] resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
            maxLength={200}
          />

          <div className="text-xs text-gray-400 text-right">
            {voiceText.length}/200
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              onClick={handleClose}
            >
              取消
            </button>
            <button
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              onClick={handleSend}
              disabled={!voiceText.trim()}
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default VoiceSender
