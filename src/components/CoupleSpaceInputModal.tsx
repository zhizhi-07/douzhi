/**
 * 情侣空间内容输入弹窗
 */

import { useState } from 'react'

interface CoupleSpaceInputModalProps {
  isOpen: boolean
  type: 'photo' | 'message' | null
  onClose: () => void
  onSubmit: (content: string) => void
}

const CoupleSpaceInputModal = ({
  isOpen,
  type,
  onClose,
  onSubmit
}: CoupleSpaceInputModalProps) => {
  const [content, setContent] = useState('')

  if (!isOpen || !type) return null

  const config = {
    photo: {
      title: '添加到相册',
      placeholder: '描述这张照片...\n例如：在咖啡厅的下午茶',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      hint: '照片描述将显示在相册中'
    },
    message: {
      title: '发送留言',
      placeholder: '写下你想说的话...\n例如：今天想你了',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      hint: '留言将显示在留言板中'
    }
  }

  const handleSubmit = () => {
    if (!content.trim()) {
      alert('请输入内容')
      return
    }
    onSubmit(content.trim())
    setContent('')
    onClose()
  }

  const currentConfig = config[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div 
        className="relative w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-gray-700">{currentConfig.icon}</div>
          <h3 className="text-xl font-bold text-gray-900">{currentConfig.title}</h3>
        </div>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={currentConfig.placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none text-sm focus:outline-none focus:border-pink-400 transition-colors"
          rows={4}
          autoFocus
        />
        
        <p className="text-xs text-gray-500 mt-2 mb-4">{currentConfig.hint}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl glass-card border border-white/30 text-gray-700 font-medium hover:scale-[0.98] active:scale-[0.95] transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold hover:scale-[0.98] active:scale-[0.95] transition-all"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

export default CoupleSpaceInputModal
