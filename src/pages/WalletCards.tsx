/**
 * 卡包页面 - 亲密付管理
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { getIntimatePayRelations, IntimatePayRelation } from '../utils/walletUtils'

const WalletCards = () => {
  const navigate = useNavigate()
  const [relations, setRelations] = useState<IntimatePayRelation[]>([])

  // 加载亲密付关系
  useEffect(() => {
    const loadRelations = () => {
      setRelations(getIntimatePayRelations())
    }
    
    loadRelations()
    
    // 监听页面可见性，回到页面时刷新
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadRelations()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 计算剩余额度
  const getRemainingAmount = (relation: IntimatePayRelation) => {
    return relation.monthlyLimit - relation.usedAmount
  }

  // 计算使用百分比
  const getUsagePercentage = (relation: IntimatePayRelation) => {
    return (relation.usedAmount / relation.monthlyLimit) * 100
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
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-6">卡包</h1>
        </div>
      </div>

      {/* 亲密付标题区域 */}
      <div className="px-4 pt-4 mb-3">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">亲密付</h2>
              <p className="text-xs text-gray-500 mt-0.5">为家人朋友代付</p>
            </div>
          </div>
        </div>
      </div>

      {/* 亲密付列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {relations.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-2">还没有开通亲密付</p>
            <p className="text-xs text-gray-400">在聊天中点击 [+] → [亲密付] 为对方开通</p>
          </div>
        ) : (
          <>
            {relations.map((relation) => {
              const remaining = getRemainingAmount(relation)
              const percentage = getUsagePercentage(relation)
              
              return (
                <div 
                  key={relation.id}
                  onClick={() => navigate(`/wallet/intimate-pay/${relation.characterId}`)}
                  className="glass-card rounded-2xl p-4 mb-3 cursor-pointer hover:scale-[0.99] active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {relation.characterAvatar ? (
                        <img src={relation.characterAvatar} alt={relation.characterName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-lg">{relation.characterName[0]}</span>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-base font-medium text-gray-900">{relation.characterName}</div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">
                          {relation.type === 'user_to_character' ? '你开通' : 'TA开通'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {relation.type === 'user_to_character' ? 'TA本月剩余' : '你本月剩余'} ¥{remaining.toFixed(2)}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  
                  {/* 额度进度条 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>已用 ¥{relation.usedAmount.toFixed(2)}</span>
                      <span>总额度 ¥{relation.monthlyLimit.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-400 to-red-400 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export default WalletCards
