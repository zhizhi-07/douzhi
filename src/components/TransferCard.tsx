/**
 * 转账卡片组件
 * 微信风格的转账卡片UI
 */

import type { Message } from '../types/chat'

interface TransferCardProps {
  message: Message
  onReceive?: (messageId: number) => void
  onReject?: (messageId: number) => void
}

const TransferCard = ({ message, onReceive, onReject }: TransferCardProps) => {
  if (!message.transfer) return null

  const { amount, message: transferMessage, status } = message.transfer
  const isSent = message.type === 'sent'
  const isPending = status === 'pending'
  const isReceived = status === 'received'
  const isExpired = status === 'expired'

  return (
    <div
      className="message-bubble overflow-hidden"
      style={{
        position: 'relative',
        width: '200px',
        borderRadius: '16px'
      }}
    >
      {/* 内容层 */}
      <div style={{ padding: '16px' }}>
        {/* 头部 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            ¥
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-900 font-medium">转账</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {(() => {
                // 如果有备注，显示备注
                if (transferMessage && transferMessage.trim()) {
                  return transferMessage
                }
                // 没有备注时，根据状态显示
                if (isPending) {
                  return isSent ? '你发起了一笔转账' : '对方发起了一笔转账'
                } else if (isReceived) {
                  return '已接收'
                } else if (isExpired) {
                  return '已退还'
                }
                return '转账'
              })()}
            </div>
          </div>
        </div>

        {/* 金额和按钮 */}
        <div className="border-t border-gray-200 pt-3">
          {/* AI发来的待处理转账 - 显示按钮 */}
          {!isSent && isPending ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-semibold text-gray-900">
                  ¥{amount.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onReject?.(message.id)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                >
                  退还
                </button>
                <button
                  onClick={() => onReceive?.(message.id)}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white text-sm rounded-full hover:bg-orange-600 transition-colors"
                >
                  领取
                </button>
              </div>
            </>
          ) : (
            /* 其他状态 - 只显示金额和状态 */
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-gray-900">
                ¥{amount.toFixed(2)}
              </span>
              {isReceived && (
                <span className="text-xs text-gray-400">
                  {isSent ? '已收款' : '你已收款'}
                </span>
              )}
              {isExpired && (
                <span className="text-xs text-gray-400">
                  {isSent ? '已退还' : '你已退还'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransferCard
