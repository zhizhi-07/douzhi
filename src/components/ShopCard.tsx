/**
 * 店铺分享卡片组件
 * 在聊天消息中显示
 */

interface ShopCardProps {
    shopName: string
    productCount: number
    previewProducts: Array<{
        id: string
        name: string
        price: number
        image: string
    }>
    onClick: () => void
}

const ShopCard = ({ shopName, productCount, previewProducts, onClick }: ShopCardProps) => {
    return (
        <div
            onClick={onClick}
            className="group relative bg-[#fffcf9] rounded-xl overflow-hidden cursor-pointer max-w-[300px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-500 border border-[#f0ebe5]"
        >
            {/* 顶部装饰条 - 模拟遮阳棚或招牌纹理 */}
            <div className="h-1.5 w-full bg-stone-800/5 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05)_100%)] bg-[length:8px_8px]"></div>

            <div className="p-5">
                {/* 店铺头部 */}
                <div className="flex items-baseline justify-between mb-4 border-b border-stone-100 pb-3">
                    <div className="flex-1">
                        <h3 className="font-serif text-xl text-stone-800 tracking-wide group-hover:text-stone-600 transition-colors">{shopName}</h3>
                        <p className="text-[10px] text-stone-400 tracking-wide mt-1">精品小店</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-serif text-stone-800 leading-none">{productCount}</span>
                        <span className="text-[9px] text-stone-400">件商品</span>
                    </div>
                </div>

                {/* 橱窗展示 */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {previewProducts.slice(0, 3).map((product, index) => (
                        <div key={product.id} className="group/item relative">
                            <div className="aspect-[3/4] rounded-sm overflow-hidden bg-stone-100 relative">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover filter sepia-[0.1] contrast-[0.95] group-hover/item:sepia-0 group-hover/item:contrast-100 transition-all duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#f5f2ed] text-stone-300">
                                        <span className="font-serif text-2xl opacity-50">
                                            {index === 0 ? 'Ⅰ' : index === 1 ? 'Ⅱ' : 'Ⅲ'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-1.5 text-center">
                                <p className="text-[10px] text-stone-600 truncate font-serif">{product.name}</p>
                                <p className="text-[10px] text-stone-400 scale-90 origin-top">¥{product.price}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 底部链接 */}
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-stone-200">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <span className="text-[10px] text-stone-400">营业中</span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-800 group-hover:gap-2 transition-all duration-300">
                        <span className="text-[10px] font-medium tracking-wider">进店逛逛</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* 纸质纹理效果 */}
            <div className="absolute inset-0 bg-stone-50 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}></div>
        </div>
    )
}

export default ShopCard
