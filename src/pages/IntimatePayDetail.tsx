/**
 * 亲密付详情页面
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { getIntimatePayRelation, deleteIntimatePayRelation, updateIntimatePayLimit, getTransactions, IntimatePayRelation } from '../utils/walletUtils'

const IntimatePayDetail = () => {
  const navigate = useNavigate()
  const { characterId } = useParams<{ characterId: string }>()
  const [relation, setRelation] = useState<IntimatePayRelation | null>(null)
  const [showEditLimit, setShowEditLimit] = useState(false)
  const [newLimit, setNewLimit] = useState('')

  // 加载亲密付关系
  useEffect(() => {
    if (!characterId) return
    
    const loadRelation = () => {
      const rel = getIntimatePayRelation(characterId)
      setRelation(rel)
    }
    
    loadRelation()
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadRelation()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [characterId])

  // 关闭亲密付
  const handleClose = () => {
    if (!characterId || !relation) return
    
    const confirmed = window.confirm(
      `确定要关闭与${relation.characterName}的亲密付吗？\n\n关闭后对方将无法使用你的零钱消费。`
    )
    
    if (confirmed) {
      const success = deleteIntimatePayRelation(characterId, relation.type)
      if (success) {
        alert('已关闭亲密付')
        navigate('/wallet/cards')
      }
    }
  }

  // 修改额度
  const handleUpdateLimit = () => {
    if (!characterId || !relation) return
    
    const limit = parseFloat(newLimit)
    if (isNaN(limit) || limit <= 0) {
      alert('请输入有效的额度')
      return
    }
    
    if (relation.type !== 'user_to_character') {
      alert('只能修改你给对方开通的亲密付额度')
      return
    }
    
    const success = updateIntimatePayLimit(characterId, limit)
    if (success) {
      alert('额度修改成功')
      setShowEditLimit(false)
      setNewLimit('')
      setRelation(prev => prev ? { ...prev, monthlyLimit: limit } : null)
    }
  }

  // 获取相关交易记录
  const getRelatedTransactions = () => {
    if (!relation) return []
    
    const allTransactions = getTransactions()
    return allTransactions.filter(t => 
      t.characterName === relation.characterName &&
      t.type === 'intimate_pay'
    ).slice(0, 10) // 最近10条
  }

  if (!relation) {
    return (
      <div className="h-screen flex flex-col bg-[#f5f7fa]">
        <div className="glass-effect border-b border-gray-200">
          <StatusBar />
          <div className="px-4 py-4 flex items-center">
            <button onClick={() => navigate('/wallet/cards')} className="text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-6">亲密付详情</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">未找到亲密付信息</p>
        </div>
      </div>
    )
  }

  const remaining = relation.monthlyLimit - relation.usedAmount
  const percentage = (relation.usedAmount / relation.monthlyLimit) * 100
  const relatedTransactions = getRelatedTransactions()

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部导航 */}
      <div className="glass-effect border-b border-gray-200">
        <StatusBar />
        <div className="px-4 py-4 flex items-center">
          <button onClick={() => navigate('/wallet/cards')} className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-6">亲密付详情</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        {/* 用户信息卡片 */}
        <div className="glass-card rounded-3xl p-6 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-3">
              {relation.characterAvatar ? (
                <img src={relation.characterAvatar} alt={relation.characterName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500 text-2xl">{relation.characterName[0]}</span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{relation.characterName}</h2>
            <span className="text-xs px-3 py-1 rounded-full bg-pink-100 text-pink-600">
              {relation.type === 'user_to_character' ? '你为TA开通' : 'TA为你开通'}
            </span>
          </div>
        </div>

        {/* 额度信息 */}
        <div className="glass-card rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">本月额度</h3>
            {relation.type === 'user_to_character' && (
              <button
                onClick={() => setShowEditLimit(true)}
                className="text-sm text-pink-500 hover:text-pink-600"
              >
                修改
              </button>
            )}
          </div>
          
          <div className="flex items-baseline gap-2 mb-4">
            <div className="text-3xl font-bold text-gray-900">
              ¥{remaining.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              / ¥{relation.monthlyLimit.toFixed(2)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>已用 ¥{relation.usedAmount.toFixed(2)}</span>
              <span>剩余 ¥{remaining.toFixed(2)}</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 to-red-400 rounded-full transition-all"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 消费记录 */}
        {relatedTransactions.length > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">最近消费</h3>
            <div className="space-y-3">
              {relatedTransactions.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <div className="text-gray-900">{transaction.description}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(transaction.timestamp).toLocaleString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-gray-900 font-medium">-¥{transaction.amount}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <button
          onClick={handleClose}
          className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-medium hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          关闭亲密付
        </button>
      </div>

      {/* 修改额度弹窗 */}
      {showEditLimit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowEditLimit(false)}>
          <div 
            className="bg-white rounded-3xl p-6 m-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">修改月额度</h3>
            <div className="mb-4">
              <div className="flex items-center border-2 border-pink-500 rounded-xl px-4 py-3 bg-white">
                <span className="text-xl text-gray-900 mr-2">¥</span>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder={relation.monthlyLimit.toString()}
                  className="flex-1 text-xl outline-none"
                  autoFocus
                />
                <span className="text-sm text-gray-500">/月</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditLimit(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleUpdateLimit}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-red-400 text-white font-medium"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntimatePayDetail
