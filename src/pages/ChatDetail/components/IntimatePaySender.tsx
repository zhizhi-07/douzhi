/**
 * 亲密付开通界面
 */

import { useState } from 'react'

interface IntimatePaySenderProps {
  show: boolean
  onClose: () => void
  onSend: (monthlyLimit: number, characterName: string) => void
  characterName: string
}

const IntimatePaySender = ({ show, onClose, onSend, characterName }: IntimatePaySenderProps) => {
  const [amount, setAmount] = useState('')

  const quickAmounts = [500, 1000, 2000, 3000, 5000, 10000]

  const handleSend = () => {
    const limit = parseFloat(amount)
    if (!amount || isNaN(limit) || limit <= 0) {
      alert('请输入有效的月额度')
      return
    }

    onSend(limit, characterName)
    setAmount('')
    onClose()
  }

  if (!show) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">开通亲密付</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 说明 */}
        <div className="mb-6 p-4 bg-pink-50 rounded-2xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-gray-700 mb-1">为对方开通亲密付后：</p>
              <p className="text-xs text-gray-500">• 对方可以使用你的零钱消费</p>
              <p className="text-xs text-gray-500">• 每月自动重置额度</p>
              <p className="text-xs text-gray-500">• 随时可以修改或关闭</p>
            </div>
          </div>
        </div>

        {/* 金额输入 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">月消费额度</label>
          <div className="flex items-center border-2 border-pink-500 rounded-xl px-4 py-3 bg-white">
            <span className="text-2xl text-gray-900 mr-2">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-2xl outline-none"
              autoFocus
            />
            <span className="text-sm text-gray-500 ml-2">/月</span>
          </div>
        </div>

        {/* 快捷金额 */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="py-2 px-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-pink-100 hover:text-pink-600 active:bg-pink-200 transition-colors"
              >
                ¥{amt}
              </button>
            ))}
          </div>
        </div>

        {/* 确认按钮 */}
        <button
          onClick={handleSend}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-red-400 text-white font-semibold shadow-lg hover:scale-[0.98] active:scale-[0.95] transition-all"
        >
          立即开通
        </button>
      </div>
    </div>
  )
}

export default IntimatePaySender
