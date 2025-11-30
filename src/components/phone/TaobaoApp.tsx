import { AIPhoneContent } from '../../utils/aiPhoneGenerator'
import { ChevronLeftIcon } from '../Icons'

interface TaobaoAppProps {
  content: AIPhoneContent
}

const TaobaoApp = ({ content }: TaobaoAppProps) => {
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
            className="bg-white rounded-xl p-3"
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
                  <div className="bg-gray-100 inline-block px-1.5 py-0.5 rounded text-[10px] text-gray-500">
                    {order.reason || '七天无理由退换'}
                  </div>
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
            <div className="flex justify-end items-center gap-1 mb-3">
              <span className="text-[11px] text-gray-500">含运费险 服务费</span>
              <span className="text-[12px] text-[#333333]">实付款</span>
              <span className="text-[12px] text-[#333333] font-bold">
                <span className="text-[10px]">￥</span>{order.price.replace(/[^\d.]/g, '')}
              </span>
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-end gap-2">
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
