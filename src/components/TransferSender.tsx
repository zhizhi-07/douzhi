/**
 * 转账发送组件（简化版）
 */

import { useState, useEffect } from 'react'
import { getIntimatePayRelations, type IntimatePayRelation } from '../utils/walletUtils'

interface TransferSenderProps {
  show: boolean
  onClose: () => void
  onSend: (amount: number, message: string, useIntimatePay?: boolean, intimatePayCharacterName?: string) => void
  characterId?: string
  characterName?: string
}

const TransferSender = ({ show, onClose, onSend, characterId, characterName }: TransferSenderProps) => {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [useIntimatePay, setUseIntimatePay] = useState(false)
  const [availableIntimatePayList, setAvailableIntimatePayList] = useState<IntimatePayRelation[]>([])
  const [selectedIntimatePayIndex, setSelectedIntimatePayIndex] = useState(0)
  
  // 每次打开弹窗时重置表单并检查亲密付
  useEffect(() => {
    if (show) {
      setAmount('')
      setMessage('')
      setUseIntimatePay(false)
      
      // 检查所有可用的亲密付（任何人给用户开通的）
      const relations = getIntimatePayRelations()
      const availableRelations = relations.filter(r => 
        r.type === 'character_to_user' && 
        r.monthlyLimit - r.usedAmount > 0
      )
      
      setAvailableIntimatePayList(availableRelations)
      setSelectedIntimatePayIndex(0)
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
    const selectedIntimatePay = useIntimatePay && availableIntimatePayList[selectedIntimatePayIndex]
    onSend(
      amountNum, 
      finalMessage, 
      useIntimatePay, 
      selectedIntimatePay ? selectedIntimatePay.characterName : undefined
    )
    
    // 重置表单
    setAmount('')
    setMessage('')
    setUseIntimatePay(false)
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
        className="w-full max-w-md bg-white rounded-t-[48px] shadow-2xl"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-[32px] text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-[32px] text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="添加转账说明（可选）"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={20}
            />
          </div>
          
          {availableIntimatePayList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-[32px]">
                <input
                  type="checkbox"
                  id="useIntimatePay"
                  checked={useIntimatePay}
                  onChange={(e) => setUseIntimatePay(e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <label htmlFor="useIntimatePay" className="text-sm text-gray-700 cursor-pointer">
                  使用亲密付
                </label>
              </div>
              
              {useIntimatePay && availableIntimatePayList.length > 1 && (
                <select
                  value={selectedIntimatePayIndex}
                  onChange={(e) => setSelectedIntimatePayIndex(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-pink-300 rounded-[32px] text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {availableIntimatePayList.map((relation, index) => (
                    <option key={relation.id} value={index}>
                      {relation.characterName} 的亲密付 (剩余: ¥{(relation.monthlyLimit - relation.usedAmount).toFixed(2)})
                    </option>
                  ))}
                </select>
              )}
              
              {useIntimatePay && availableIntimatePayList.length === 1 && (
                <div className="px-4 py-2 bg-white border border-pink-200 rounded-[32px] text-sm text-gray-700">
                  使用 <span className="font-medium text-pink-600">{availableIntimatePayList[0].characterName}</span> 的亲密付
                  <span className="text-xs text-gray-500 ml-2">
                    (剩余: ¥{(availableIntimatePayList[0].monthlyLimit - availableIntimatePayList[0].usedAmount).toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          )}
          
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
