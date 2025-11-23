/**
 * 语音输入组件（文字模拟）
 */

import { useState, useEffect } from 'react'
import { getImage } from '../utils/unifiedStorage'

interface VoiceInputProps {
  show: boolean
  onClose: () => void
  onConfirm: (voiceText: string) => void
}

const VoiceInput = ({ show, onClose, onConfirm }: VoiceInputProps) => {
  const [voiceText, setVoiceText] = useState('')
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
      setVoiceText('')
    }
  }, [show])

  if (!show) return null

  const handleConfirm = () => {
    if (!voiceText.trim()) {
      alert('请输入语音内容')
      return
    }
    onConfirm(voiceText.trim())
  }

  const estimatedDuration = Math.ceil(voiceText.length / 5)

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
        <h2 className="text-xl font-bold text-gray-900 mb-4">🎤 发送语音</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            语音内容（文字模拟）：
          </label>
          <textarea
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder="输入语音内容..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-base resize-none"
            autoFocus
          />
        </div>

        {voiceText && (
          <div className="mb-4 text-sm text-gray-500">
            预计时长：约 {estimatedDuration} 秒
          </div>
        )}

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
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

export default VoiceInput
