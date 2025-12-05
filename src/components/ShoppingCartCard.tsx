import type { Message } from '../types/chat'

interface ShoppingCartCardProps {
  message: Message
}

const ShoppingCartCard = ({ message }: ShoppingCartCardProps) => {
  if (!message.shoppingCart) return null

  const { items, totalAmount, storeName } = message.shoppingCart

  return (
    <div className="w-[280px] bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div>
            <div className="text-white font-bold text-sm">购物车</div>
            <div className="text-white/80 text-xs">{storeName || '在线商城'}</div>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          {items.length}件商品
        </div>
      </div>

      {/* 商品列表 */}
      <div className="max-h-[300px] overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`px-4 py-3 flex gap-3 ${
              index !== items.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            {/* 商品图片 */}
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              {item.image || '📦'}
            </div>

            {/* 商品信息 */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
                {item.name}
              </h4>
              <p className="text-xs text-gray-400 line-clamp-1 mb-2">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-orange-600 font-bold">
                  <span className="text-xs">¥</span>
                  <span className="text-base">{item.price}</span>
                </div>
                <div className="text-xs text-gray-500">
                  x{item.quantity}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部总价 */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">商品总额</span>
          <span className="text-sm text-gray-900">
            ¥{items.reduce((sum, item) => sum + item.price * item.quantity, 0)}
          </span>
        </div>
        {message.shoppingCart.discount && message.shoppingCart.discount > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">优惠</span>
            <span className="text-sm text-orange-600">
              -¥{message.shoppingCart.discount}
            </span>
          </div>
        )}
        {message.shoppingCart.shipping !== undefined && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">运费</span>
            <span className="text-sm text-gray-900">
              {message.shoppingCart.shipping === 0 ? '免运费' : `¥${message.shoppingCart.shipping}`}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-900">合计</span>
          <div className="text-orange-600 font-bold">
            <span className="text-xs">¥</span>
            <span className="text-xl">{totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShoppingCartCard
