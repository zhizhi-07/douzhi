import type { Message } from '../types/chat'

interface ProductCardProps {
  message: Message
}

const ProductCard = ({ message }: ProductCardProps) => {
  if (!message.productCard) return null

  const { name, price, description, sales } = message.productCard

  return (
    <div className="w-[240px] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 select-none cursor-pointer hover:shadow-md transition-all duration-300 group">
      {/* 商品图片区域 */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {/* 模拟商品图 - 使用渐变代替 */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto bg-white/80 rounded-full shadow-sm flex items-center justify-center mb-2 backdrop-blur-sm">
              <span className="text-2xl">🛍️</span>
            </div>
            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed opacity-80">
              {description}
            </p>
          </div>
        </div>

        {/* 左上角标签 */}
        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
          热卖
        </div>
      </div>

      {/* 商品信息 */}
      <div className="p-3">
        <h3 className="text-[13px] font-medium text-gray-900 mb-2 line-clamp-2 leading-snug h-[38px]">
          {name}
        </h3>

        <div className="flex items-end justify-between mb-2.5">
          <div className="flex items-baseline gap-0.5 text-[#ff5000]">
            <span className="text-[10px] font-medium">¥</span>
            <span className="text-lg font-bold leading-none">{price}</span>
          </div>
          <div className="text-[10px] text-gray-400">
            已售{sales > 10000 ? `${(sales / 10000).toFixed(1)}万` : sales}+
          </div>
        </div>

        {/* 底部按钮 */}
        <button
          className="w-full h-8 bg-gradient-to-r from-[#ff9000] to-[#ff5000] text-white rounded-full text-[11px] font-bold shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1"
          onClick={() => {
            // TODO: 实现购买功能
            alert(`正在跳转商品详情：${name}`)
          }}
        >
          <span>立即抢购</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ProductCard
