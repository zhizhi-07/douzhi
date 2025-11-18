import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface AlipayAppProps {
  content: AIPhoneContent
}

const AlipayApp = ({ content }: AlipayAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-gradient-to-r from-blue-400/20 to-blue-500/20">
        <h2 className="text-lg font-semibold text-gray-800">支付宝</h2>
        <p className="text-xs text-gray-500 mt-1">账单记录</p>
      </div>
      
      {/* 账单列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {content.alipayBills.map((bill, index) => (
          <div 
            key={index}
            className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-blue-200/50 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${
                  bill.type === 'income' 
                    ? 'bg-green-400/30' 
                    : 'bg-red-400/30'
                } flex items-center justify-center`}>
                  {bill.type === 'income' ? (
                    <span className="text-green-600 font-bold">+</span>
                  ) : (
                    <span className="text-red-600 font-bold">-</span>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{bill.title}</div>
                  {bill.reason && (
                    <div className="text-xs text-gray-600 mt-0.5">{bill.reason}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-0.5">{bill.time}</div>
                </div>
              </div>
              <div className={`text-lg font-bold ${
                bill.type === 'income' 
                  ? 'text-green-600' 
                  : 'text-gray-800'
              }`}>
                {bill.type === 'income' ? '+' : '-'}¥{bill.amount}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlipayApp
