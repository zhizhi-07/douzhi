import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface AlipayAppProps {
  content: AIPhoneContent
}

const AlipayApp = ({ content }: AlipayAppProps) => {
  return (
    <div className="w-full h-full bg-white overflow-hidden flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">账单</h1>
        </div>
        {/* 搜索框 */}
        <div className="px-4 pb-3">
          <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="text-sm text-gray-400">搜索账单</span>
          </div>
        </div>
      </div>
      
      {/* 账单列表 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white">
          {content.alipayBills.map((bill, index) => (
            <div 
              key={index}
              className="px-4 py-3 border-b border-gray-200 active:bg-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {bill.type === 'income' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{bill.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{bill.time}</div>
                    {bill.reason && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">💭 {bill.reason}</div>
                    )}
                  </div>
                </div>
                <div className="text-base font-semibold text-gray-900 ml-3">
                  {bill.type === 'income' ? '+' : '-'}¥{bill.amount.replace(/[¥￥+\-\s]/g, '')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AlipayApp
