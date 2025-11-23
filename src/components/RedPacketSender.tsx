/**
 * 红包发送组件
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface RedPacketSenderProps {
  show: boolean
  onClose: () => void
  onSend: (totalAmount: number, count: number, blessing: string) => void
}

const RedPacketSender = ({ show, onClose, onSend }: RedPacketSenderProps) => {
  const [totalAmount, setTotalAmount] = useState('')
  const [count, setCount] = useState('')
  const [blessing, setBlessing] = useState('恭喜发财，大吉大利')
  
  // 每次打开弹窗时重置表单
  useEffect(() => {
    if (show) {
      setTotalAmount('')
      setCount('')
      setBlessing('恭喜发财，大吉大利')
    }
  }, [show])

  if (!show) return null

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d.]/g, '')
    const parts = value.split('.')
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('')
    }
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2)
    }
    setTotalAmount(value)
  }

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    setCount(value)
  }

  const handleSend = () => {
    const amount = parseFloat(totalAmount)
    const num = parseInt(count)
    
    if (!amount || amount <= 0) {
      alert('请输入有效金额')
      return
    }
    
    if (!num || num <= 0) {
      alert('请输入红包个数')
      return
    }
    
    if (num > 100) {
      alert('红包个数不能超过100个')
      return
    }
    
    if (amount < num * 0.01) {
      alert(`${num}个红包至少需要¥${(num * 0.01).toFixed(2)}`)
      return
    }
    
    onSend(amount, num, blessing.trim() || '恭喜发财，大吉大利')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div 
        className="relative w-full max-w-[320px] bg-[#f3f3f3] rounded-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="relative h-12 flex items-center justify-center bg-[#f3f3f3] border-b border-gray-200/50">
          <span className="font-medium text-gray-900">发红包</span>
          <button 
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 红包个数输入 */}
          <div className="flex items-center bg-white rounded-lg px-4 py-3">
            <label className="text-gray-900 font-medium w-20">红包个数</label>
            <input
              type="text"
              value={count}
              onChange={handleCountChange}
              placeholder="填写个数"
              className="flex-1 text-right bg-transparent outline-none text-gray-900 placeholder-gray-300"
            />
            <span className="ml-2 text-gray-900">个</span>
          </div>

          {/* 总金额输入 */}
          <div className="flex items-center bg-white rounded-lg px-4 py-3">
            <div className="flex items-center w-20">
              <div className="bg-[#d64a28] text-white text-[10px] px-1 rounded mr-1">拼</div>
              <label className="text-gray-900 font-medium">总金额</label>
            </div>
            <input
              type="text"
              value={totalAmount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="flex-1 text-right bg-transparent outline-none text-gray-900 placeholder-gray-300"
              autoFocus
            />
            <span className="ml-2 text-gray-900">元</span>
          </div>
          
          {/* 提示文本 */}
          <div className="text-xs text-gray-400 px-1">
            当前为拼手气红包
          </div>

          {/* 祝福语 */}
          <div className="bg-white rounded-lg px-4 py-3">
            <input
              type="text"
              value={blessing}
              onChange={(e) => setBlessing(e.target.value)}
              placeholder="恭喜发财，大吉大利"
              className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-300"
              maxLength={20}
            />
          </div>

          {/* 大金额显示 */}
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-gray-900">
              ¥{totalAmount || '0.00'}
            </div>
          </div>

          {/* 塞钱按钮 */}
          <button
            onClick={handleSend}
            disabled={!totalAmount || !count}
            className={`w-full py-3.5 rounded-lg font-medium text-white text-base transition-colors ${
              !totalAmount || !count
                ? 'bg-[#ea5f39]/50 cursor-not-allowed'
                : 'bg-[#ea5f39] hover:bg-[#d64a28] active:scale-95'
            }`}
          >
            塞钱进红包
          </button>
        </div>
      </div>
    </div>
  )
}

export default RedPacketSender
