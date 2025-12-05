import type { Message } from '../types/chat'

interface CartPaymentRequestCardProps {
  message: Message
  onAccept?: () => void
  onReject?: () => void
}

const CartPaymentRequestCard = ({ message, onAccept, onReject }: CartPaymentRequestCardProps) => {
  if (!message.cartPaymentRequest) return null

  const { items, totalAmount, requesterName, status, payerName, isGift } = message.cartPaymentRequest

  // 生成随机的条形码线条
  const barcodeLines = Array.from({ length: 24 }).map(() => ({
    width: Math.random() > 0.5 ? 'w-1' : 'w-0.5',
    color: Math.random() > 0.7 ? 'bg-stone-800' : 'bg-stone-900'
  }))

  return (
    <div className="relative w-[240px] filter drop-shadow-md">
      {/* 票据主体 */}
      <div className="bg-[#fffcf9] text-stone-800 rounded-t-xl overflow-hidden relative">

        {/* 顶部装饰 */}
        <div className="pt-4 pb-3 px-4 text-center border-b-2 border-dashed border-stone-300">
          <div className="w-10 h-10 mx-auto bg-stone-900 rounded-full flex items-center justify-center mb-2 text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="font-serif font-bold text-base tracking-[0.2em] text-stone-400">DOUZHI STORE</h3>
          <div className="text-xs text-stone-700 mt-1">{isGift ? '送你礼物' : '代付请求'}</div>
        </div>

        {/* 详细内容 */}
        <div className="px-4 py-3 font-mono text-[11px] leading-relaxed">
          <div className="flex justify-between text-stone-400 mb-4 text-[10px]">
            <span>{new Date().toLocaleDateString()}</span>
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start group">
                <div className="flex-1 pr-2">
                  <div className="text-stone-800 font-bold uppercase">{item.name}</div>
                  <div className="text-stone-400 text-[10px]">数量: {item.quantity}</div>
                </div>
                <div className="text-stone-800 font-bold">¥{item.price}</div>
              </div>
            ))}
          </div>

          {/* 分隔符 */}
          <div className="my-4 text-center text-stone-300 tracking-[0.5em]">
            ********************
          </div>

          {/* 总计 */}
          <div className="flex justify-between items-end mb-2">
            <div className="text-left">
              <span className="font-bold text-stone-800">合计</span>
              <span className="text-[8px] text-stone-400 ml-1 font-mono">TOTAL</span>
            </div>
            <span className="text-xl font-bold text-stone-900">¥{totalAmount}</span>
          </div>
          <div className="text-right text-[10px] text-stone-400">
            {isGift ? `赠送人: ${requesterName}` : `请求人: ${requesterName}`}
          </div>
        </div>

        {/* 底部锯齿效果 - 使用 CSS Mask 或 SVG 背景 */}
        <div
          className="h-4 w-full bg-[#fffcf9] absolute -bottom-4 left-0 z-10"
          style={{
            backgroundImage: 'radial-gradient(circle, transparent 50%, #fffcf9 50%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 -8px',
            backgroundRepeat: 'repeat-x',
            transform: 'rotate(180deg)'
          }}
        ></div>

        {/* 操作区域 */}
        <div className="px-4 pb-4 pt-2 bg-[#fffcf9]">
          {status === 'pending' && message.type === 'received' && (
            <div className="flex gap-3 mt-2">
              <button
                onClick={onReject}
                className="flex-1 py-2 border-2 border-stone-200 text-stone-500 rounded-lg text-xs font-bold hover:bg-stone-50 active:scale-95 transition-all"
              >
                拒绝
              </button>
              <button
                onClick={onAccept}
                className="flex-1 py-2 bg-stone-900 text-[#fffcf9] rounded-lg text-xs font-bold hover:bg-stone-800 active:scale-95 transition-all shadow-lg shadow-stone-200"
              >
                立即支付
              </button>
            </div>
          )}

          {status === 'paid' && (
            <div className="mt-2 border-2 border-stone-900 rounded-lg p-2 flex flex-col items-center justify-center gap-1 transform -rotate-2 opacity-80 mix-blend-multiply">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-stone-900"></div>
                <span className="font-bold text-stone-900 text-sm">{isGift ? '已赠送' : '已付款'}</span>
                <div className="w-2 h-2 rounded-full bg-stone-900"></div>
              </div>
              <span className="text-[8px] font-mono text-stone-400 tracking-widest">{isGift ? 'GIFT SENT' : 'PAID IN FULL'}</span>
              <span className="text-[10px] text-stone-600">{isGift ? `赠送人: ${payerName}` : `付款人: ${payerName}`}</span>
            </div>
          )}

          {status === 'rejected' && (
            <div className="mt-2 border-2 border-red-800 rounded-lg p-2 flex items-center justify-center gap-2 transform rotate-2 opacity-60 mix-blend-multiply">
              <span className="font-bold text-red-900 text-sm">已拒绝</span>
              <span className="text-[8px] font-mono text-red-400 tracking-widest ml-2">DECLINED</span>
            </div>
          )}

          {status === 'pending' && message.type === 'sent' && (
            <div className="mt-2 text-center">
              <span className="inline-block px-3 py-1.5 bg-stone-100 text-stone-500 text-xs rounded-full animate-pulse">
                等待付款中...
              </span>
              <div className="text-[8px] font-mono text-stone-300 mt-1 tracking-widest">WAITING FOR PAYMENT</div>
            </div>
          )}

          {/* 条形码装饰 */}
          <div className="mt-4 flex justify-center items-end h-6 gap-[2px] opacity-40">
            {barcodeLines.map((line, i) => (
              <div key={i} className={`${line.width} ${line.color} h-full rounded-sm`}></div>
            ))}
          </div>
          <div className="text-center text-[8px] font-mono text-stone-300 mt-1 tracking-[0.2em]">
            {Math.random().toString().slice(2, 14)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPaymentRequestCard
