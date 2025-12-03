/**
 * 拍照发送组件
 * 用户输入照片描述（模拟拍照）
 */

import { useState, useEffect } from 'react'
import { getImage } from '../utils/unifiedStorage'

interface PhotoSenderProps {
  isOpen: boolean
  onClose: () => void
  onSend: (description: string) => void
}

const PhotoSender = ({ isOpen, onClose, onSend }: PhotoSenderProps) => {
  const [description, setDescription] = useState('')
  const [functionBg, setFunctionBg] = useState('')

  // 加载功能背景
  useEffect(() => {
    const loadFunctionBg = async () => {
      const bg = await getImage('function_bg')
      console.log('PhotoSender - 功能背景加载:', bg ? '成功' : '未找到')
      console.log('PhotoSender - 背景数据长度:', bg ? bg.length : 0)
      if (bg) setFunctionBg(bg)
    }
    loadFunctionBg()
  }, [])

  // 每次打开弹窗时重置表单
  useEffect(() => {
    if (isOpen) {
      setDescription('')
      console.log('PhotoSender - 弹窗打开，当前functionBg:', functionBg ? `有数据(${functionBg.substring(0, 50)}...)` : '无数据')
    }
  }, [isOpen, functionBg])

  const handleSend = () => {
    if (!description.trim()) {
      alert('请输入照片描述')
      return
    }

    onSend(description.trim())

    // 重置表单
    setDescription('')
  }

  const handleClose = () => {
    setDescription('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className="w-full max-w-md mx-auto shadow-2xl"
        style={{ 
          animation: 'slideUp 0.3s ease-out',
          backgroundColor: functionBg ? 'transparent' : 'white',
          backgroundImage: functionBg ? `url(${functionBg})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="p-6 bg-white/90">
          <div className="text-xl font-semibold text-gray-900 text-center">拍照</div>
        </div>

        <div className="p-6 space-y-6 bg-white/80">
          <p className="text-sm text-gray-600 text-center">
            输入照片内容描述（模拟拍照）
          </p>

          {/* 输入框 */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：阳光下的咖啡和书本..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-[32px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
            maxLength={200}
          />

          <div className="text-xs text-gray-400 text-right">
            {description.length}/200
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 px-6 py-3 glass-card rounded-full font-medium transition-colors"
              onClick={handleClose}
            >
              取消
            </button>
            <button
              className="flex-1 px-6 py-3 glass-card rounded-full font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--global-button-color)', color: 'white' }}
              onClick={handleSend}
              disabled={!description.trim()}
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

export default PhotoSender
