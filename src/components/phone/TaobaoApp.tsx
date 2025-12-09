import { useState } from 'react'
import { AIPhoneContent } from '../../utils/aiPhoneGenerator'
import { ChevronLeftIcon } from '../Icons'

interface TaobaoAppProps {
  content: AIPhoneContent
}

const TaobaoApp = ({ content }: TaobaoAppProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const tabs = ['全部', '待付款', '待发货', '待收货', '待评价']

  return (
    <div className="w-full h-full bg-[#F2F2F2] flex flex-col font-sans absolute inset-0">
      {/* 顶部导航栏 */}
      <div className="bg-white pt-2 pb-2 px-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <ChevronLeftIcon size={24} className="text-[#333333]" />
        </div>
        <h1 className="text-[18px] font-medium text-[#333333]">我的订单</h1>
        <div className="flex items-center gap-4">
          <svg className="w-5 h-5 text-[#333333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <svg className="w-5 h-5 text-[#333333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </div>
      </div>

      {/* 顶部标签栏 */}
      <div className="bg-white px-2 pb-2 flex items-center justify-between sticky top-[44px] z-10 shadow-sm">
        {tabs.map((tab, index) => (
          <div key={index} className="relative px-3 py-2">
            <span className={`text-[14px] ${index === 0 ? 'font-bold text-[#FF5000]' : 'text-gray-600'}`}>
              {tab}
            </span>
            {index === 0 && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#FF5000] rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* 订单列表 */}
      <div className="flex-1 overflow-y-auto bg-[#F2F2F2] px-3 py-3 space-y-3">
        {content.taobaoOrders.map((order, index) => (
          <div
            key={index}
            className="bg-white rounded-xl overflow-hidden"
          >
            {/* 主区域 - 可点击展开 */}
            <div
              className="p-3 cursor-pointer active:bg-gray-50 transition-colors"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              {/* 店铺头部 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#FF5000] flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">天猫</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#333333]">淘宝店铺</span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span className="text-[13px] text-[#FF5000]">{order.status}</span>
              </div>

              {/* 商品卡片 */}
              <div className="flex gap-3 mb-3">
                <div className="w-[90px] h-[90px] rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {/* 模拟商品图 */}
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="text-[13px] text-[#333333] leading-snug line-clamp-2 mb-1">
                      {order.title}
                    </h3>
                    {/* 显示购买原因标签 */}
                    {order.reason && (
                      <div className="bg-[#FFF6F3] inline-block px-1.5 py-0.5 rounded text-[10px] text-[#FF5000]">
                        {order.reason.length > 15 ? order.reason.slice(0, 15) + '...' : order.reason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#FF5000] border border-[#FF5000] px-1 rounded-[2px]">包邮</span>
                    <span className="text-[14px] text-[#333333]">
                      <span className="text-[10px]">￥</span>{order.price.replace(/[^\d.]/g, '')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 价格汇总 */}
              <div className="flex justify-end items-center gap-1">
                <span className="text-[11px] text-gray-500">含运费险 服务费</span>
                <span className="text-[12px] text-[#333333]">实付款</span>
                <span className="text-[12px] text-[#333333] font-bold">
                  <span className="text-[10px]">￥</span>{order.price.replace(/[^\d.]/g, '')}
                </span>
              </div>

              {/* 点击提示 */}
              {(order.reason || order.thought) && (
                <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-400">
                  <span>点击查看购买心路历程</span>
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${expandedIndex === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>

            {/* 展开详情 - 购买心理描写 */}
            {expandedIndex === index && (order.reason || order.thought) && (
              <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
                <div className="bg-gradient-to-br from-[#FFF9F5] to-[#FFF0E8] rounded-xl p-4 border border-[#FFE0D0]">
                  {/* 标题 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#FF5000] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <span className="text-[14px] font-bold text-[#FF5000]">购买心路历程</span>
                  </div>

                  {/* 购买原因 */}
                  {order.reason && (
                    <div className="mb-3">
                      <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        为什么要买
                      </div>
                      <p className="text-[13px] text-[#333] leading-relaxed bg-white/60 rounded-lg p-2">
                        {order.reason}
                      </p>
                    </div>
                  )}

                  {/* 心理活动 */}
                  {order.thought && (
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        下单时的心情
                      </div>
                      <p className="text-[13px] text-[#333] leading-relaxed bg-white/60 rounded-lg p-2 italic">
                        「{order.thought}」
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 底部按钮 */}
            <div className="flex justify-end gap-2 px-3 pb-3">
              <button className="px-3 py-1.5 text-[12px] border border-gray-300 rounded-full text-[#666666] font-medium">
                查看物流
              </button>
              <button className="px-3 py-1.5 text-[12px] border border-gray-300 rounded-full text-[#666666] font-medium">
                卖了换钱
              </button>
              <button className="px-3 py-1.5 text-[12px] border border-[#FF5000] rounded-full text-[#FF5000] font-medium">
                再次购买
              </button>
            </div>
          </div>
        ))}

        {content.taobaoOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">您还没有相关的订单</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 py-4">
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="text-[10px] text-gray-400">为你推荐</div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 推荐商品网格 (Mock) */}
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden pb-2">
              <div className="w-full aspect-square bg-gray-100 mb-2"></div>
              <div className="px-2">
                <div className="h-8 bg-gray-100 rounded mb-2"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 w-12 bg-gray-100 rounded"></div>
                  <div className="h-3 w-8 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TaobaoApp
