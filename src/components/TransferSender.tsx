/**
 * 转账发送组件（简化版）
 */

import { useState, useEffect } from 'react'

interface TransferSenderProps {
  show: boolean
  onClose: () => void
  onSend: (amount: number, message: string) => void
}

const TransferSender = ({ show, onClose, onSend }: TransferSenderProps) => {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  
  // 每次打开弹窗时重置表单
  useEffect(() => {
    if (show) {
      setAmount('')
      setMessage('')
    }
  }, [show])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d.]/g, '')
    const parts = value.split('.')
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('')
    }
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2)
    }
    setAmount(value)
  }

  const handleSend = () => {
    const amountNum = parseFloat(amount)
    
    if (!amountNum || amountNum <= 0) {
      alert('请输入有效金额')
      return
    }
    
    const finalMessage = message.trim()
    onSend(amountNum, finalMessage)
    
    // 重置表单
    setAmount('')
    setMessage('')
  }

  const handleClose = () => {
    setAmount('')
    setMessage('')
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
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-xl font-semibold text-gray-900 text-center">转账</div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">金额</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="请输入金额"
              value={amount}
              onChange={handleAmountChange}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">转账说明</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="添加转账说明（可选）"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={20}
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
              onClick={handleClose}
            >
              取消
            </button>
            <button 
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
              onClick={handleSend}
            >
              转账
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

export default TransferSender
