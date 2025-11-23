/**
 * 图片描述输入组件
 */

import { useState, useEffect } from 'react'
import { getImage } from '../utils/unifiedStorage'

interface PhotoDescriptionInputProps {
  show: boolean
  onClose: () => void
  onConfirm: (description: string) => void
  title?: string
  placeholder?: string
  defaultValue?: string
}

const PhotoDescriptionInput = ({ 
  show, 
  onClose, 
  onConfirm,
  title = '拍照内容描述',
  placeholder = '请描述这张照片',
  defaultValue = ''
}: PhotoDescriptionInputProps) => {
  const [description, setDescription] = useState('')
  const [functionBg, setFunctionBg] = useState('')
  
  // 加载功能背景
  useEffect(() => {
    const loadFunctionBg = async () => {
      const bg = await getImage('function_bg')
      if (bg) setFunctionBg(bg)
    }
    loadFunctionBg()
  }, [])

  // 每次打开弹窗时重置表单
  useEffect(() => {
    if (show) {
      setDescription(defaultValue)
    }
  }, [show, defaultValue])

  if (!show) return null

  const handleConfirm = () => {
    if (!description.trim()) {
      alert('请输入照片描述')
      return
    }
    onConfirm(description.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div 
        className="relative glass-card rounded-3xl p-6 mx-4 w-full max-w-sm shadow-2xl modal-slide-up"
        style={functionBg ? {
          backgroundImage: `url(${functionBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            照片描述：
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-base"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirm()
              }
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 active:scale-95 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 active:scale-95 transition-all shadow-lg"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

export default PhotoDescriptionInput
