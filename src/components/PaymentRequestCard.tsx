import { Message } from '../types/chat'
import { useState, useEffect } from 'react'

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

  // 倒计时逻辑（15分钟有效期）
  const [timeLeft, setTimeLeft] = useState('')
  const expiryTime = message.timestamp + 15 * 60 * 1000 // 15分钟后过期
  
  // 查看详情展开状态
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!isPending || !isAIPayment) return

    const updateTimer = () => {
      const now = Date.now()
      const diff = expiryTime - now

      if (diff <= 0) {
        setTimeLeft('已过期')
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [isPending, isAIPayment, expiryTime])


  // 🔥 待确认状态：使用黄色卡片样式（类似外卖代付）
  if (isAIPayment && isPending && isSent) {
    return (
      <div className="w-[220px] bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg overflow-hidden p-4">
        {/* 顶部文字 */}
        <div className="text-center mb-3">
          <div className="text-sm text-yellow-900 font-medium mb-1">我给你代付了商品吧~</div>
        </div>

        {/* 白色内容卡片 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          {/* 截止时间 */}
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500 mb-1">截止支付时间</div>
            <div className="text-3xl font-bold text-gray-900">{timeLeft}</div>
          </div>

          {/* 查看详情按钮 */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-lg text-sm font-bold hover:from-yellow-500 hover:to-yellow-600 active:scale-95 transition-all shadow-sm"
          >
            {showDetails ? '收起详情' : '查看详情'}
          </button>
          
          {/* 详情内容 */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fade-in">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">商品名称</span>
                <span className="text-sm text-gray-900 font-medium text-right flex-1 ml-2">{payment.itemName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">订单金额</span>
                <span className="text-sm text-orange-600 font-bold">¥{payment.amount.toFixed(2)}</span>
              </div>
              {payment.note && (
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">备注</span>
                  <span className="text-xs text-gray-600 text-right flex-1 ml-2">{payment.note}</span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">支付方式</span>
                <span className="text-xs text-gray-600">请求 {payment.payerName || 'AI'} 代付</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 🔥 检查是否已过期
  const isExpired = Date.now() > expiryTime

  // 🔥 AI收到的待确认请求：使用黄色卡片样式
  if (isAIPayment && isPending && !isSent) {
    return (
      <div className="w-[220px] bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg overflow-hidden p-4">
          {/* 顶部文字 */}
          <div className="text-center mb-3">
            <div className="text-sm text-yellow-900 font-medium mb-1">来帮我代付吧~</div>
          </div>

          {/* 白色内容卡片 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            {/* 截止时间 */}
            <div className="text-center mb-3">
              <div className="text-xs text-gray-500 mb-1">截止支付时间</div>
              <div className="text-3xl font-bold text-gray-900">{timeLeft}</div>
            </div>

            {/* 查看详情按钮 */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-lg text-sm font-bold hover:from-yellow-500 hover:to-yellow-600 active:scale-95 transition-all shadow-sm"
            >
              {showDetails ? '收起详情' : '查看详情'}
            </button>
            
            {/* 详情内容 */}
            {showDetails && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fade-in">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">商品名称</span>
                  <span className="text-sm text-gray-900 font-medium text-right flex-1 ml-2">{payment.itemName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">订单金额</span>
                  <span className="text-sm text-orange-600 font-bold">¥{payment.amount.toFixed(2)}</span>
                </div>
                {payment.note && (
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500">备注</span>
                    <span className="text-xs text-gray-600 text-right flex-1 ml-2">{payment.note}</span>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 - 只在未过期时显示 */}
            {!isExpired && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onReject?.(message.id)}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all"
                >
                  拒绝
                </button>
                <button
                  onClick={() => onAccept?.(message.id)}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-lg text-sm font-bold hover:from-yellow-500 hover:to-yellow-600 active:scale-95 transition-all shadow-sm"
                >
                  同意
                </button>
              </div>
            )}
          </div>
      </div>
    )
  }

  // 🔥 已支付状态：黄色卡片（与待确认相同布局）
  if (isPaid) {
    return (
      <div className="w-[220px] bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg overflow-hidden p-4">
        {/* 顶部文字 */}
        <div className="text-center mb-3">
          <div className="text-sm text-yellow-900 font-medium mb-1">我给你代付了商品吧~</div>
        </div>

        {/* 白色内容卡片 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          {/* 状态文字（替代倒计时） */}
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500 mb-1">截止支付时间</div>
            <div className="text-3xl font-bold text-green-600">已支付</div>
          </div>

          {/* 查看详情按钮 */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-lg text-sm font-bold hover:from-yellow-500 hover:to-yellow-600 active:scale-95 transition-all shadow-sm"
          >
            {showDetails ? '收起详情' : '查看详情'}
          </button>
            
            {/* 详情内容 */}
            {showDetails && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fade-in">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">商品名称</span>
                  <span className="text-sm text-gray-900 font-medium text-right flex-1 ml-2">{payment.itemName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">订单金额</span>
                  <span className="text-sm text-orange-600 font-bold">¥{payment.amount.toFixed(2)}</span>
                </div>
                {payment.note && (
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500">备注</span>
                    <span className="text-xs text-gray-600 text-right flex-1 ml-2">{payment.note}</span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">支付状态</span>
                  <span className="text-xs text-green-600 font-medium">
                    {payment.paymentMethod === 'ai' && `${payment.payerName} 已代付`}
                    {payment.paymentMethod === 'self' && '已完成支付'}
                    {payment.paymentMethod === 'intimate' && '已使用亲密付'}
                  </span>
                </div>
              </div>
            )}
        </div>
      </div>
    )
  }

  // 🔥 已拒绝状态：黄色卡片（与待确认相同布局）
  if (isRejected) {
    return (
      <div className="w-[220px] bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg overflow-hidden p-4">
        {/* 顶部文字 */}
        <div className="text-center mb-3">
          <div className="text-sm text-yellow-900 font-medium mb-1">来帮我代付吧~</div>
        </div>

        {/* 白色内容卡片 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          {/* 状态文字（替代倒计时） */}
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500 mb-1">截止支付时间</div>
            <div className="text-3xl font-bold text-gray-500">已拒绝</div>
          </div>

          {/* 查看详情按钮 */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-lg text-sm font-bold hover:from-yellow-500 hover:to-yellow-600 active:scale-95 transition-all shadow-sm"
          >
            {showDetails ? '收起详情' : '查看详情'}
          </button>
          
          {/* 详情内容 */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fade-in">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">商品名称</span>
                <span className="text-sm text-gray-900 font-medium text-right flex-1 ml-2">{payment.itemName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">订单金额</span>
                <span className="text-sm text-gray-400 font-bold">¥{payment.amount.toFixed(2)}</span>
              </div>
              {payment.note && (
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">备注</span>
                  <span className="text-xs text-gray-600 text-right flex-1 ml-2">{payment.note}</span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">支付状态</span>
                <span className="text-xs text-gray-600 font-medium">
                  {payment.paymentMethod === 'ai' && `${payment.payerName} 拒绝了代付`}
                  {payment.paymentMethod === 'self' && '支付已取消'}
                  {payment.paymentMethod === 'intimate' && '亲密付已拒绝'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 🔥 其他支付方式（自己支付/亲密付）：黄色卡片
  return (
    <div className="w-[220px] bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg overflow-hidden p-4">
      {/* 顶部文字 */}
      <div className="text-center mb-3">
        <div className="text-sm text-yellow-900 font-medium mb-1">来帮我代付吧~</div>
      </div>

      {/* 白色内容卡片 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* 状态文字（替代倒计时） */}
        <div className="text-center mb-3">
          <div className="text-xs text-gray-500 mb-1">截止支付时间</div>
          <div className="text-3xl font-bold text-green-600">已支付</div>
        </div>

        {/* 查看详情按钮 */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-lg text-sm font-bold hover:from-yellow-500 hover:to-yellow-600 active:scale-95 transition-all shadow-sm"
        >
          {showDetails ? '收起详情' : '查看详情'}
        </button>
        
        {/* 详情内容 */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fade-in">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500">商品名称</span>
              <span className="text-sm text-gray-900 font-medium text-right flex-1 ml-2">{payment.itemName}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500">订单金额</span>
              <span className="text-sm text-orange-600 font-bold">¥{payment.amount.toFixed(2)}</span>
            </div>
            {payment.note && (
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">备注</span>
                <span className="text-xs text-gray-600 text-right flex-1 ml-2">{payment.note}</span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500">支付状态</span>
              <span className="text-xs text-green-600 font-medium">
                {payment.paymentMethod === 'self' && '已完成支付'}
                {payment.paymentMethod === 'intimate' && '已使用亲密付'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentRequestCard
