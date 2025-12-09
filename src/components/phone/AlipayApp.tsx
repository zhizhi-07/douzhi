import { useState } from 'react'
import { AIPhoneContent } from '../../utils/aiPhoneGenerator'
import { ChevronLeftIcon } from '../Icons'

interface AlipayAppProps {
  content: AIPhoneContent
}

const AlipayApp = ({ content }: AlipayAppProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  return (
    <div className="w-full h-full bg-[#F5F5F5] flex flex-col font-sans absolute inset-0">
      {/* 顶部导航栏 - 支付宝蓝 */}
      <div className="bg-[#1677FF] text-white pt-4 pb-3 px-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <ChevronLeftIcon size={22} className="text-white" />
          <h1 className="text-[19px] font-medium tracking-wide">账单</h1>
        </div>
        <div className="flex items-center gap-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </div>
      </div>

      {/* 月份筛选栏 */}
      <div className="bg-[#F5F5F5] px-4 py-3 flex items-center justify-between sticky top-0 z-0">
        <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
          <span className="text-sm font-medium text-gray-800">本月</span>
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">支出 ¥{content.alipayBills.filter(b => b.type === 'expense').reduce((acc, cur) => acc + parseFloat(cur.amount.replace(/[^\d.]/g, '')), 0).toFixed(2)}</div>
          <div className="text-xs text-gray-500">收入 ¥{content.alipayBills.filter(b => b.type === 'income').reduce((acc, cur) => acc + parseFloat(cur.amount.replace(/[^\d.]/g, '')), 0).toFixed(2)}</div>
        </div>
      </div>

      {/* 账单列表 */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {content.alipayBills.map((bill, index) => (
            <div
              key={index}
              className={`${index !== content.alipayBills.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              {/* 主行 - 可点击 */}
              <div
                className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-start gap-3 flex-1 overflow-hidden">
                  {/* 图标 */}
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-50">
                    {bill.type === 'income' ? (
                      <svg className="w-6 h-6 text-[#FAAD14]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-[#1677FF]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-normal text-gray-900 truncate pr-2">
                        {bill.title}
                      </h3>
                      <span className={`text-[16px] font-medium whitespace-nowrap ${bill.type === 'income' ? 'text-[#FAAD14]' : 'text-black'}`}>
                        {bill.type === 'income' ? '+' : '-'}{bill.amount.replace(/[^\d.]/g, '')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        {bill.time}
                      </p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-gray-400">
                          {bill.type === 'income' ? '交易成功' : '支付成功'}
                        </p>
                        {bill.reason && (
                          <svg
                            className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${expandedIndex === index ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 展开详情 - 账单原因/备注 */}
              {expandedIndex === index && bill.reason && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-[#F0F7FF] rounded-lg p-3 ml-[52px]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg className="w-3.5 h-3.5 text-[#1677FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[11px] text-[#1677FF] font-medium">账单备注</span>
                    </div>
                    <p className="text-[13px] text-gray-700 leading-relaxed">{bill.reason}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {content.alipayBills.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">本月暂无账单</p>
            </div>
          )}
        </div>

        <div className="text-center mt-6 mb-4">
          <p className="text-xs text-gray-300">本服务由支付宝提供</p>
        </div>
      </div>
    </div>
  )
}

export default AlipayApp
