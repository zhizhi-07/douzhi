import { useState } from 'react'

interface PaymentRequestSenderProps {
  onClose: () => void
  onSend: (itemName: string, amount: number, note: string, paymentMethod: 'ai' | 'self' | 'intimate') => void
  characterName: string
  hasIntimatePay: boolean  // 是否有可用的亲密付
}

/**
 * 代付发送弹窗组件
 */
const PaymentRequestSender = ({ onClose, onSend, characterName, hasIntimatePay }: PaymentRequestSenderProps) => {
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'ai' | 'self' | 'intimate'>('ai')

  const handleSend = () => {
    if (!itemName.trim()) {
      alert('请输入商品名称')
      return
    }

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      alert('请输入有效金额')
      return
    }

    if (amountNum > 999999.99) {
      alert('金额不能超过999999.99')
      return
    }

    onSend(itemName.trim(), amountNum, note.trim(), paymentMethod)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">发起代付</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-4 space-y-4">
          {/* 商品名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="例如：外卖、衣服、电影票"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              maxLength={50}
            />
          </div>

          {/* 金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              金额 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                max="999999.99"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注（选填）
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注信息..."
              rows={3}
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all resize-none"
            />
            <div className="text-xs text-gray-400 mt-1 text-right">{note.length}/100</div>
          </div>

          {/* 支付方式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              支付方式 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {/* AI 代付 */}
              <label className="flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all hover:bg-orange-50 hover:border-orange-300"
                style={{
                  borderColor: paymentMethod === 'ai' ? '#fb923c' : '#e5e7eb',
                  backgroundColor: paymentMethod === 'ai' ? '#fff7ed' : 'white'
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ai"
                  checked={paymentMethod === 'ai'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'ai')}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">请 {characterName} 代付</span>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">推荐</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">需要对方确认后支付</div>
                </div>
              </label>

              {/* 自己支付 */}
              <label className="flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300"
                style={{
                  borderColor: paymentMethod === 'self' ? '#fb923c' : '#e5e7eb',
                  backgroundColor: paymentMethod === 'self' ? '#fff7ed' : 'white'
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="self"
                  checked={paymentMethod === 'self'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'self')}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">自己支付</div>
                  <div className="text-xs text-gray-500 mt-0.5">使用自己的钱包余额</div>
                </div>
              </label>

              {/* 亲密付 */}
              <label className={`flex items-center p-3 border-2 rounded-xl transition-all ${
                hasIntimatePay ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300' : 'opacity-50 cursor-not-allowed'
              }`}
                style={{
                  borderColor: paymentMethod === 'intimate' ? '#fb923c' : '#e5e7eb',
                  backgroundColor: paymentMethod === 'intimate' ? '#fff7ed' : 'white'
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="intimate"
                  checked={paymentMethod === 'intimate'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'intimate')}
                  disabled={!hasIntimatePay}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-400"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">使用亲密付</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {hasIntimatePay ? `使用 ${characterName} 的亲密付额度` : '未开通亲密付'}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 active:scale-95 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSend}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-400 to-yellow-500 text-white rounded-xl font-medium hover:from-orange-500 hover:to-yellow-600 active:scale-95 transition-all shadow-md"
          >
            发起代付
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentRequestSender
