/**
 * 店铺查看器组件
 * 全屏弹窗展示完整店铺
 */

import { useState, useEffect } from 'react'
import { getShop, type Shop, type Product } from '../utils/shopManager'

interface ShopViewerProps {
    isOpen: boolean
    onClose: () => void
    shopId: string
    onPurchase: (product: Product) => void
}

const ShopViewer = ({ isOpen, onClose, shopId, onPurchase }: ShopViewerProps) => {
    const [shop, setShop] = useState<Shop | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isClosing, setIsClosing] = useState(false)

    useEffect(() => {
        if (isOpen && shopId) {
            // 从shopId中提取userId
            const userId = shopId.split('_')[1]
            const shopData = getShop(userId)
            setShop(shopData)
        }
    }, [isOpen, shopId])

    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsClosing(false)
            onClose()
        }, 300)
    }

    if (!isOpen) return null

    const handlePurchase = () => {
        if (selectedProduct) {
            onPurchase(selectedProduct)
            setSelectedProduct(null)
        }
    }

    return (
        <>
            {/* 遮罩层 */}
            <div
                className={`fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            {/* 店铺查看器 */}
            <div className={`fixed inset-x-0 bottom-0 md:inset-x-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:h-[80vh] md:rounded-sm bg-[#fffcf9] z-50 flex flex-col transition-all duration-500 ease-out ${isClosing ? 'translate-y-full md:translate-y-[100vh] opacity-0' : 'translate-y-0 md:-translate-y-1/2 opacity-100'} rounded-t-xl h-[90vh] shadow-2xl overflow-hidden border border-[#f0ebe5]`}>

                {/* 纸质纹理背景 */}
                <div className="absolute inset-0 bg-stone-50 opacity-[0.03] pointer-events-none mix-blend-multiply z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}></div>

                {/* 头部 */}
                <div className="relative z-10 pt-8 pb-6 px-8 bg-[#fffcf9] border-b border-stone-100">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="text-center">
                        <div className="inline-block mb-3 px-3 py-1 border border-stone-200 rounded-full">
                            <span className="text-[10px] tracking-[0.2em] text-stone-400 uppercase">Est. 2024</span>
                        </div>
                        <h2 className="text-2xl font-serif text-stone-800 tracking-wide mb-2">{shop?.name}</h2>
                        <p className="text-xs text-stone-500 font-light leading-relaxed max-w-[80%] mx-auto">{shop?.description || 'A curated collection of moments.'}</p>
                    </div>

                    {/* 统计数据 */}
                    <div className="flex justify-center gap-8 mt-6">
                        <div className="text-center">
                            <div className="text-lg font-serif text-stone-800">{shop?.products.length || 0}</div>
                            <div className="text-[9px] tracking-widest text-stone-400 uppercase mt-1">Products</div>
                        </div>
                        <div className="w-px h-8 bg-stone-100"></div>
                        <div className="text-center">
                            <div className="text-lg font-serif text-stone-800">99%</div>
                            <div className="text-[9px] tracking-widest text-stone-400 uppercase mt-1">Rating</div>
                        </div>
                    </div>
                </div>

                {/* 商品列表 */}
                <div className="flex-1 overflow-y-auto p-6 relative z-10 bg-[#faf8f5]">
                    {!shop || shop.products.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400">
                            <div className="w-16 h-16 border border-dashed border-stone-300 rounded-full flex items-center justify-center mb-4">
                                <span className="font-serif italic text-2xl">Empty</span>
                            </div>
                            <p className="text-sm font-serif italic text-stone-500">Coming soon...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                            {shop.products.map((product) => (
                                <div
                                    key={product.id}
                                    className="group cursor-pointer"
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    {/* 商品图片 */}
                                    <div className="aspect-[3/4] bg-white shadow-sm mb-3 p-2 transition-transform duration-500 group-hover:-translate-y-1">
                                        <div className="w-full h-full bg-stone-50 overflow-hidden relative">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover filter sepia-[0.1] contrast-[0.95] group-hover:sepia-0 group-hover:contrast-100 transition-all duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[#f5f2ed] text-stone-300">
                                                    <span className="font-serif text-4xl opacity-30 italic">Item</span>
                                                </div>
                                            )}

                                            {/* 价格标签 */}
                                            <div className="absolute bottom-0 right-0 bg-white/90 backdrop-blur px-2 py-1">
                                                <span className="font-serif text-xs text-stone-800">¥{product.price}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 商品信息 */}
                                    <div className="text-center px-2">
                                        <h3 className="font-serif text-stone-800 text-sm truncate group-hover:text-stone-600 transition-colors">{product.name}</h3>
                                        <p className="text-[10px] text-stone-400 mt-1 truncate font-light">{product.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 购买确认弹窗 */}
            {selectedProduct && (
                <>
                    <div
                        className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-[60] animate-fadeIn"
                        onClick={() => setSelectedProduct(null)}
                    />
                    <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-[#fffcf9] rounded-sm z-[70] max-w-sm mx-auto p-8 shadow-2xl animate-scaleIn border border-[#f0ebe5]">
                        <div className="text-center mb-8">
                            <span className="text-[10px] tracking-[0.2em] text-stone-400 uppercase block mb-2">Purchase Request</span>
                            <h3 className="text-xl font-serif text-stone-800">{selectedProduct.name}</h3>
                            <div className="w-8 h-px bg-stone-300 mx-auto my-4"></div>
                            <p className="text-sm text-stone-500 font-light leading-relaxed">{selectedProduct.description}</p>
                        </div>

                        <div className="flex justify-center mb-8">
                            <div className="text-3xl font-serif text-stone-800">
                                <span className="text-sm align-top mr-1">¥</span>
                                {selectedProduct.price}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handlePurchase}
                                className="w-full py-3 bg-stone-800 text-white text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors"
                            >
                                Confirm Purchase
                            </button>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="w-full py-3 bg-transparent text-stone-400 text-xs tracking-widest uppercase hover:text-stone-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default ShopViewer
