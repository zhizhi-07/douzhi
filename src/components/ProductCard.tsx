

interface ProductCardProps {
  name: string
  price: number
  description: string
  sales: number
  onAction?: () => void
  actionText?: string
}

const ProductCard = ({
  name,
  price,
  description,
  sales,
  onAction,
  actionText = '立即抢购'
}: ProductCardProps) => {
  return (
    <div className="w-[260px] bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100/50 select-none cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group font-sans">
      {/* 商品图片区域 - 描述叠在图片上 */}
      <div className="relative aspect-square bg-[#F8F9FB] overflow-hidden group-hover:bg-[#F2F4F8] transition-colors duration-500">
        {/* 描述文字覆盖在图片上 */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-[12px] text-gray-500 leading-relaxed text-center line-clamp-6">
            {description}
          </p>
        </div>

        {/* 左上角标签 */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <div className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
            热卖
          </div>
        </div>
      </div>

      {/* 商品信息 */}
      <div className="p-4">
        <h3 className="text-[14px] font-bold text-gray-900 mb-2 line-clamp-2 leading-snug h-[40px]">
          {name}
        </h3>

        <div className="flex items-end justify-between mb-4">
          <div className="flex items-baseline gap-0.5 text-[#FF5000]">
            <span className="text-[11px] font-bold">¥</span>
            <span className="text-xl font-bold font-din leading-none">{price}</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded">
            已售 {sales > 10000 ? `${(sales / 10000).toFixed(1)}w` : sales}+
          </div>
        </div>

        {/* 底部按钮 */}
        <button
          className="w-full h-9 bg-black text-white rounded-xl text-[12px] font-bold shadow-lg shadow-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 hover:bg-gray-900"
          onClick={(e) => {
            e.stopPropagation()
            if (onAction) {
              onAction()
            } else {
              alert(`正在跳转商品详情：${name}`)
            }
          }}
        >
          <span>{actionText}</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ProductCard
