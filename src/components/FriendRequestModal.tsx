/**
 * 添加好友申请弹窗
 */

import { useState } from 'react'

interface FriendRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (message: string) => void
  characterName: string
}

const FriendRequestModal = ({ isOpen, onClose, onSend, characterName }: FriendRequestModalProps) => {
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim())
      setMessage('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/50 ring-1 ring-black/5 transform transition-all">
        {/* 装饰光晕 */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="p-8 relative z-10">
          {/* 头部 */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-medium text-gray-800 mb-1">添加好友</h3>
            <p className="text-sm text-gray-500">需要对方验证通过</p>
          </div>

          {/* 内容 */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <div className="inline-block px-3 py-1 rounded-full bg-gray-100/50 text-xs text-gray-500 border border-gray-200/50">
                发送给 <span className="font-medium text-gray-700 mx-1">{characterName}</span>
              </div>
            </div>
            <div className="relative group">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="你好，我是..."
                className="w-full h-32 px-5 py-4 bg-white/50 border border-gray-200/60 rounded-2xl resize-none focus:outline-none focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all text-gray-700 placeholder-gray-400 text-sm leading-relaxed"
                maxLength={100}
              />
              <div className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-mono transition-opacity opacity-50 group-hover:opacity-100">
                {message.length}/100
              </div>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-white/50 text-gray-600 rounded-2xl text-sm font-medium hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-300"
            >
              取消
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex-1 py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-medium hover:bg-black hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FriendRequestModal
