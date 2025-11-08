/**
 * 情侣空间内容输入弹窗
 */

import { useState } from 'react'

interface CoupleSpaceInputModalProps {
  isOpen: boolean
  type: 'photo' | 'message' | 'anniversary' | null
  onClose: () => void
  onSubmit: (content: string, data?: { date?: string, title?: string }) => void
}

const CoupleSpaceInputModal = ({
  isOpen,
  type,
  onClose,
  onSubmit
}: CoupleSpaceInputModalProps) => {
  const [content, setContent] = useState('')
  const [date, setDate] = useState('')
  const [title, setTitle] = useState('')

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
    },
    anniversary: {
      title: '添加纪念日',
      placeholder: '备注（可选）...\n例如：第一次见面的日子',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      hint: '纪念日将显示在纪念日页面'
    }
  }

  const handleSubmit = () => {
    if (type === 'anniversary') {
      if (!date || !title.trim()) {
        alert('请填写日期和标题')
        return
      }
      onSubmit(content.trim(), { date, title: title.trim() })
    } else {
      if (!content.trim()) {
        alert('请输入内容')
        return
      }
      onSubmit(content.trim())
    }
    setContent('')
    setDate('')
    setTitle('')
    onClose()
  }

  const currentConfig = config[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      
      <div 
        className="relative w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-gray-600">{currentConfig.icon}</div>
          <h3 className="text-lg font-semibold text-gray-900">{currentConfig.title}</h3>
        </div>
        
        {type === 'anniversary' ? (
          <>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：在一起100天"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">备注（可选）</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={currentConfig.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none text-sm"
                  rows={3}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">{currentConfig.hint}</p>
          </>
        ) : (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={currentConfig.placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none text-sm"
              rows={4}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 mb-4">{currentConfig.hint}</p>
          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 active:bg-pink-700 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

export default CoupleSpaceInputModal
