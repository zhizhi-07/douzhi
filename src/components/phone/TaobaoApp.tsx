import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface TaobaoAppProps {
  content: AIPhoneContent
}

const TaobaoApp = ({ content }: TaobaoAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-gradient-to-r from-orange-400/20 to-red-400/20">
        <h2 className="text-lg font-semibold text-gray-800">淘宝</h2>
        <p className="text-xs text-gray-500 mt-1">我的订单</p>
      </div>
      
      {/* 订单列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {content.taobaoOrders.map((order, index) => (
          <div 
            key={index}
            className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-orange-200/50 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-200/60 to-red-200/40 flex items-center justify-center flex-shrink-0">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 mb-1">{order.title}</h3>
                {order.reason && (
                  <p className="text-xs text-gray-600 mb-2">购买原因: {order.reason}</p>
                )}
                {order.thought && (
                  <p className="text-xs text-gray-500 italic mb-2">"{order.thought}"</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-orange-600">¥{order.price.replace(/[¥￥+\-\s]/g, '')}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaobaoApp
