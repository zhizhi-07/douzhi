/**
 * 亲密付邀请卡片
 */

import { createIntimatePayRelation } from '../utils/walletUtils'

interface IntimatePayInviteCardProps {
  monthlyLimit: number
  status: 'pending' | 'accepted' | 'rejected'
  characterName: string
  characterId: string
  isSent: boolean  // 是否是自己发送的
  messageId: number
  onUpdateStatus: (newStatus: 'accepted' | 'rejected') => void
}

const IntimatePayInviteCard = ({
  monthlyLimit,
  status,
  characterName,
  characterId,
  isSent,
  messageId,
  onUpdateStatus
}: IntimatePayInviteCardProps) => {
  
  const handleAccept = () => {
    // 开通亲密付（AI给用户开通，类型是 character_to_user）
    const success = createIntimatePayRelation(
      characterId,
      characterName,
      monthlyLimit,
      undefined,
      'character_to_user'
    )
    
    if (success) {
      onUpdateStatus('accepted')
    } else {
      alert('已经开通过了')
    }
  }

  const handleReject = () => {
    onUpdateStatus('rejected')
  }

  return (
    <div className="glass-card rounded-2xl p-4 max-w-xs">
      {/* 头部图标 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-gray-900">亲密付</div>
          <div className="text-xs text-gray-500 mt-0.5">为你开通亲密付</div>
        </div>
      </div>

      {/* 额度信息 */}
      <div className="mb-4 py-3 border-t border-b border-gray-100">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">月消费额度</div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{monthlyLimit.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 状态显示 */}
      {status === 'pending' && !isSent && (
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            拒绝
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-red-400 text-white font-medium text-sm shadow-md hover:scale-[0.98] active:scale-[0.95] transition-all"
          >
            接受
          </button>
        </div>
      )}
      
      {status === 'pending' && isSent && (
        <div className="py-2 text-center">
          <div className="text-sm text-gray-500">等待对方确认</div>
        </div>
      )}
      
      {status === 'accepted' && (
        <div className="py-2 text-center">
          <div className="text-sm text-green-600">{isSent ? '对方已接受' : '已接受'}</div>
        </div>
      )}
      
      {status === 'rejected' && (
        <div className="py-2 text-center">
          <div className="text-sm text-gray-500">{isSent ? '对方已拒绝' : '已拒绝'}</div>
        </div>
      )}
    </div>
  )
}

export default IntimatePayInviteCard
