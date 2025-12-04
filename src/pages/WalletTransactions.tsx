/**
 * 零钱明细页面
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { getTransactions, Transaction } from '../utils/walletUtils'

const WalletTransactions = () => {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // 加载交易记录
  useEffect(() => {
    const loadTransactions = () => {
      setTransactions(getTransactions())
    }
    
    loadTransactions()
    
    // 监听页面可见性，回到页面时刷新交易记录
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTransactions()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (transactionDate.getTime() === today.getTime()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else if (transactionDate.getTime() === yesterday.getTime()) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  }


  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部导航 */}
      <div className="glass-effect border-b border-gray-200">
        <StatusBar />
        <div className="px-4 py-4 flex items-center">
          <button onClick={() => navigate('/wallet')} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-6">零钱明细</h1>
        </div>
      </div>

      {/* 交易列表 */}
      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
              </svg>
            </div>
            <p className="text-gray-400 text-sm">暂无交易记录</p>
          </div>
        ) : (
          <div className="px-4 pt-4">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === 'recharge' || 
                              transaction.type === 'red_envelope_receive' || 
                              transaction.type === 'transfer_receive' ||
                              transaction.type === 'income'  // 商品收入
              const isIntimatePay = transaction.type === 'intimate_pay'
              
              return (
                <div key={transaction.id} className="mb-3">
                  <div className="glass-card rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-medium text-gray-900">
                            {transaction.description}
                          </span>
                          {isIntimatePay && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-pink-100 text-pink-600">
                              亲密付
                            </span>
                          )}
                        </div>
                        {transaction.characterName && (
                          <div className="text-sm text-gray-500">
                            {transaction.characterName}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(transaction.timestamp)}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-xl font-semibold ${
                          isIncome ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {isIncome ? '+' : '-'}¥{transaction.amount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletTransactions
