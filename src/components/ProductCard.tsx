import type { Message } from '../types/chat'

interface ProductCardProps {
  message: Message
}

const ProductCard = ({ message }: ProductCardProps) => {
  if (!message.productCard) return null

  const { name, price, description, sales } = message.productCard

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm max-w-[180px]">
      {/* 商品描述区域 */}
      <div className="aspect-square p-2 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <p className="text-[10px] text-gray-700 text-center leading-relaxed">
          {description}
        </p>
      </div>

      {/* 商品信息 */}
      <div className="p-2">
        <h3 className="text-[11px] font-medium text-gray-900 mb-1 line-clamp-2">
          {name}
        </h3>
        <div className="flex items-baseline gap-0.5 mb-1">
          <span className="text-[10px] text-red-500">¥</span>
          <span className="text-sm font-bold text-red-500">{price}</span>
        </div>
        <div className="text-[10px] text-gray-500 mb-1.5">
          已售 {sales}
        </div>
        <button
          className="w-full py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-medium border border-orange-100"
          onClick={() => {
            // TODO: 实现购买功能
            alert(`购买商品：${name}`)
          }}
        >
          立即购买
        </button>
      </div>
    </div>
  )
}

export default ProductCard
