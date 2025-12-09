/**
 * 零钱页面
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { getBalance, recharge } from '../utils/walletUtils'

const Wallet = () => {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)

  // 加载余额
  useEffect(() => {
    const loadBalance = () => {
      setBalance(getBalance())
    }
    
    loadBalance()
    
    // 监听页面可见性，回到页面时刷新余额
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadBalance()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 充值
  const handleRecharge = () => {
    const amount = prompt('请输入充值金额：')
    if (!amount || isNaN(parseFloat(amount))) return
    
    const rechargeAmount = parseFloat(amount)
    if (rechargeAmount <= 0) {
      alert('请输入有效金额')
      return
    }

    const success = recharge(rechargeAmount)
    if (success) {
      setBalance(getBalance())
      alert(`充值成功！当前余额：¥${getBalance().toFixed(2)}`)
    }
  }

  const menuItems = [
    {
      icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>,
      label: '零钱明细',
      onClick: () => navigate('/wallet/transactions')
    },
    {
      icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>,
      label: '卡包',
      onClick: () => navigate('/wallet/cards')
    }
  ]

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa] soft-page-enter">
      {/* 顶部导航 */}
      <div className="glass-effect border-b border-gray-200">
        <StatusBar />
        <div className="px-4 py-4 flex items-center">
          <button onClick={() => navigate('/me')} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-6">零钱</h1>
        </div>
      </div>

      {/* 余额卡片 */}
      <div className="px-4 pt-4 mb-4">
        <div className="glass-card rounded-3xl p-6 shadow-lg">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">零钱余额（元）</div>
            <div className="text-5xl font-bold text-gray-900 mb-6">
              {balance.toFixed(2)}
            </div>
            <button
              onClick={handleRecharge}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold shadow-lg hover:scale-[0.98] active:scale-[0.95] transition-all"
            >
              充值
            </button>
          </div>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="px-4">
        <div className="glass-card rounded-2xl overflow-hidden">
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={item.onClick}
                className="w-full flex items-center px-4 py-4 text-left active:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-gray-600 shadow-md">
                  {item.icon}
                </div>
                <span className="ml-4 flex-1 text-gray-900 font-medium">
                  {item.label}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {index < menuItems.length - 1 && (
                <div className="ml-16 border-b border-gray-100" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 帮助说明 */}
      <div className="px-4 mt-4">
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900 mb-1">什么是零钱？</div>
              <div className="text-xs text-blue-700 leading-relaxed">
                零钱可用于发红包、转账、开通亲密付等功能。你可以随时充值或提现。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wallet
