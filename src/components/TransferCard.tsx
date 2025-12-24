/**
 * 转账卡片组件
 * 微信风格的转账卡片UI
 */

import type { Message } from '../types/chat'

interface TransferCardProps {
  message: Message
  onClick?: () => void
}

const TransferCard = ({ message, onClick }: TransferCardProps) => {
  if (!message.transfer) return null

  const { amount, message: transferMessage, status } = message.transfer
  const isSent = message.type === 'sent'
  const isPending = status === 'pending'
  const isReceived = status === 'received'
  const isExpired = status === 'expired'
  
  // 是否可点击查看详情（AI发来的待处理转账，或者任何转账都可以点进去看详情）
  // 微信逻辑：发送方和接收方都可以点进去看详情
  const canShowDetail = true

  return (
    <div
      className={`transfer-card overflow-hidden bg-white shadow-sm ${canShowDetail ? 'cursor-pointer active:opacity-80' : ''}`}
      style={{
        position: 'relative',
        width: '200px',
        borderRadius: '16px'
      }}
      onClick={onClick}
    >
      <div className="transfer-card-content" style={{ padding: '16px' }}>
        <div className="transfer-card-header flex items-center gap-3 mb-3">
          <div className="transfer-card-icon w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {isReceived ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              '¥'
            )}
          </div>
          <div className="transfer-card-info flex-1">
            <div className="transfer-card-title text-sm text-gray-900 font-medium">转账</div>
            <div className="transfer-card-message text-xs text-gray-500 mt-0.5">
              {(() => {
                if (transferMessage && transferMessage.trim()) return transferMessage
                if (isPending) return isSent ? '你发起了一笔转账' : '请点击收款'
                if (isReceived) return '已接收'
                if (isExpired) return '已退还'
                return '转账'
              })()}
            </div>
          </div>
        </div>
        <div className="transfer-card-body border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="transfer-card-amount text-2xl font-semibold text-gray-900">
              ¥{amount.toFixed(2)}
            </span>
            {isReceived && (
              <span className="transfer-card-status text-xs text-gray-400">
                {isSent ? '已收款' : '你已收款'}
              </span>
            )}
            {isExpired && (
              <span className="transfer-card-status text-xs text-gray-400">
                {isSent ? '已退还' : '你已退还'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransferCard
