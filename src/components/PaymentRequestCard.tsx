import { Message } from '../types/chat'

interface PaymentRequestCardProps {
  message: Message
  isSent: boolean
  onAccept?: (messageId: number) => void
  onReject?: (messageId: number) => void
}

/**
 * 代付卡片组件 - 参考美团外卖代付样式
 */
const PaymentRequestCard = ({ message, isSent, onAccept, onReject }: PaymentRequestCardProps) => {
  const payment = message.paymentRequest
  if (!payment) return null

  const isAIPayment = payment.paymentMethod === 'ai'
  const isPending = payment.status === 'pending'
  const isPaid = payment.status === 'paid'
  const isRejected = payment.status === 'rejected'

  // 状态文本和颜色
  const getStatusDisplay = () => {
    if (isPaid) return { text: '已支付', color: 'text-green-600', bg: 'bg-green-50' }
    if (isRejected) return { text: '已拒绝', color: 'text-gray-500', bg: 'bg-gray-50' }
    if (isPending) return { text: '待确认', color: 'text-orange-600', bg: 'bg-orange-50' }
    return { text: '', color: '', bg: '' }
  }

  const status = getStatusDisplay()

  return (
    <div className="max-w-[280px] bg-white rounded-2xl shadow-md overflow-hidden">
      {/* 顶部橙色条 - 美团风格 */}
      <div className="h-1 bg-gradient-to-r from-orange-400 to-yellow-400"></div>
      
      {/* 主体内容 */}
      <div className="p-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800">代付订单</span>
          </div>
          {status.text && (
            <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.color} font-medium`}>
              {status.text}
            </span>
          )}
        </div>

        {/* 商品信息 */}
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="text-base font-medium text-gray-900 mb-1">
            {payment.itemName}
          </div>
          {payment.note && (
            <div className="text-xs text-gray-500 mt-1">
              {payment.note}
            </div>
          )}
        </div>

        {/* 金额 */}
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm text-gray-600">订单金额</span>
          <div className="flex items-baseline">
            <span className="text-xs text-orange-600 font-medium">¥</span>
            <span className="text-2xl font-bold text-orange-600">{payment.amount.toFixed(2)}</span>
          </div>
        </div>

        {/* 支付方式说明 */}
        <div className="text-xs text-gray-500 mb-3">
          {payment.paymentMethod === 'ai' && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>请求 {payment.payerName || 'AI'} 代付</span>
            </div>
          )}
          {payment.paymentMethod === 'self' && (
            <span>使用自己的钱包支付</span>
          )}
          {payment.paymentMethod === 'intimate' && (
            <span>使用 {payment.payerName} 的亲密付</span>
          )}
        </div>

        {/* 操作按钮 - 仅AI代付且待确认时显示 */}
        {isAIPayment && isPending && !isSent && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => onReject?.(message.id)}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all"
            >
              拒绝
            </button>
            <button
              onClick={() => onAccept?.(message.id)}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-orange-400 to-yellow-500 text-white rounded-lg text-sm font-medium hover:from-orange-500 hover:to-yellow-600 active:scale-95 transition-all shadow-sm"
            >
              同意代付
            </button>
          </div>
        )}

        {/* 已支付提示 */}
        {isPaid && (
          <div className="flex items-center gap-1 text-xs text-green-600 pt-2 border-t border-gray-100">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>
              {payment.paymentMethod === 'ai' && `${payment.payerName} 已代付`}
              {payment.paymentMethod === 'self' && '已完成支付'}
              {payment.paymentMethod === 'intimate' && '已使用亲密付完成'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentRequestCard
