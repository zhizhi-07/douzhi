/**
 * 判定对错功能 - 用户立场输入弹窗
 * 用户填写立场后发送到聊天中
 */

import { useState, useEffect } from 'react'
import { playSystemSound } from '../utils/soundManager'

// 判定偏向类型
export type BiasType = 'neutral' | 'user' | 'ai'

interface JudgmentInputModalProps {
  isOpen: boolean
  onClose: () => void
  characterName: string
  onSubmit: (userReason: string, bias: BiasType) => void
}

const JudgmentInputModal = ({
  isOpen,
  onClose,
  characterName,
  onSubmit
}: JudgmentInputModalProps) => {
  const [userReason, setUserReason] = useState('')
  const [bias, setBias] = useState<BiasType>('neutral')

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setUserReason('')
      setBias('neutral')
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (!userReason.trim()) return
    playSystemSound()
    onSubmit(userReason.trim(), bias)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* 主面板 - 卷宗风格 */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-[#fdfbf7] rounded-[2px] z-50 max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-[#e8e4d8]">

        {/* 顶部红头文件装饰 */}
        <div className="h-1 bg-red-800/80 mx-6 mt-6 mb-1" />
        <div className="h-[1px] bg-red-800/80 mx-6 mb-4" />

        {/* 标题栏 */}
        <div className="px-6 pb-4 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-6 top-0 text-gray-400 hover:text-gray-600 font-serif text-xl"
          >
            ×
          </button>
          <h2 className="text-2xl font-serif font-bold text-gray-900 tracking-[0.5em]">起诉状</h2>
          <p className="text-[10px] font-serif text-gray-500 mt-1 tracking-widest uppercase">CIVIL COMPLAINT</p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">

          {/* 原告/被告信息栏 */}
          <div className="flex gap-8 mb-6 font-serif text-sm border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">原告：</span>
              <span className="border-b border-gray-800 px-2 min-w-[60px] text-center">我</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">被告：</span>
              <span className="border-b border-gray-800 px-2 min-w-[60px] text-center">{characterName}</span>
            </div>
          </div>

          {/* 事实与理由 */}
          <div className="mb-6">
            <div className="text-sm font-serif font-bold text-gray-900 mb-2">事实与理由：</div>
            <div className="relative">
              <textarea
                value={userReason}
                onChange={(e) => setUserReason(e.target.value)}
                placeholder="请在此处陈述案件详情、起因及经过..."
                className="w-full h-48 p-4 bg-[#fdfbf7] border border-gray-300 rounded-[2px] text-gray-800 resize-none focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800/20 transition-colors text-base leading-relaxed font-serif placeholder:text-gray-300"
                style={{ backgroundImage: 'linear-gradient(transparent 95%, #e5e5e5 95%)', backgroundSize: '100% 2rem', lineHeight: '2rem' }}
                autoFocus
              />
            </div>
          </div>

          {/* 诉讼请求 (Bias) */}
          <div className="mb-8">
            <div className="text-sm font-serif font-bold text-gray-900 mb-3">诉讼请求：</div>
            <div className="grid grid-cols-1 gap-3">
              <label className={`flex items-center p-3 border rounded-[2px] cursor-pointer transition-all ${bias === 'user'
                  ? 'border-red-800 bg-red-50/30'
                  : 'border-gray-200 hover:border-gray-300'
                }`}>
                <input
                  type="radio"
                  name="bias"
                  checked={bias === 'user'}
                  onChange={() => setBias('user')}
                  className="w-4 h-4 text-red-800 border-gray-300 focus:ring-red-800"
                />
                <span className="ml-3 font-serif text-sm text-gray-800">请求判决原告胜诉 (偏向我)</span>
              </label>

              <label className={`flex items-center p-3 border rounded-[2px] cursor-pointer transition-all ${bias === 'neutral'
                  ? 'border-red-800 bg-red-50/30'
                  : 'border-gray-200 hover:border-gray-300'
                }`}>
                <input
                  type="radio"
                  name="bias"
                  checked={bias === 'neutral'}
                  onChange={() => setBias('neutral')}
                  className="w-4 h-4 text-red-800 border-gray-300 focus:ring-red-800"
                />
                <span className="ml-3 font-serif text-sm text-gray-800">请求依法公正裁决 (中立)</span>
              </label>

              <label className={`flex items-center p-3 border rounded-[2px] cursor-pointer transition-all ${bias === 'ai'
                  ? 'border-red-800 bg-red-50/30'
                  : 'border-gray-200 hover:border-gray-300'
                }`}>
                <input
                  type="radio"
                  name="bias"
                  checked={bias === 'ai'}
                  onChange={() => setBias('ai')}
                  className="w-4 h-4 text-red-800 border-gray-300 focus:ring-red-800"
                />
                <span className="ml-3 font-serif text-sm text-gray-800">请求对被告从轻发落 (偏向{characterName})</span>
              </label>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!userReason.trim()}
              className={`px-8 py-3 rounded-[2px] font-serif font-bold tracking-widest text-sm transition-all shadow-sm ${userReason.trim()
                  ? 'bg-red-900 text-[#fdfbf7] hover:bg-red-800 border border-red-950'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              提交立案
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default JudgmentInputModal
