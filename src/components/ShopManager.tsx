/**
 * 商城管理主界面
 * 用于管理用户的店铺和商品
 */

import { useState, useEffect } from 'react'
import { getUserInfo } from '../utils/userUtils'
import {
    getShop,
    createShop,
    addProduct,
    deleteProduct,
    generateShareData,
    DEFAULT_INTERACTION_PRODUCTS,
    type Shop,
    type Product
} from '../utils/shopManager'
import ProductEditor from './ProductEditor'

interface ShopManagerProps {
    isOpen: boolean
    onClose: () => void
    onShare: (shareData: any) => void
}

const ShopManager = ({ isOpen, onClose, onShare }: ShopManagerProps) => {
    const [shop, setShop] = useState<Shop | null>(null)
    const [showProductEditor, setShowProductEditor] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isClosing, setIsClosing] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadShop()
        }
    }, [isOpen])

    const loadShop = () => {
        const userInfo = getUserInfo()
        let userShop = getShop('user')

        // 如果店铺不存在，创建新店铺
        if (!userShop) {
            const userName = userInfo.nickname || userInfo.realName || '用户'
            userShop = createShop(
                'user',
                `${userName}的小店`,
                '欢迎光临我的店铺💕'
            )
        }

        setShop(userShop)
    }

    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsClosing(false)
            onClose()
        }, 300)
    }

    const handleAddProduct = (productData: {
        name: string
        description: string
        price: number
        image: string
        stock: number
        category: string
    }) => {
        addProduct(
            'user',
            productData.name,
            productData.description,
            productData.price,
            productData.image,
            productData.stock,
            productData.category
        )
        loadShop()
        setShowProductEditor(false)
    }

    const handleDeleteProduct = (productId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('确定要删除这个商品吗？')) return

        deleteProduct('user', productId)
        loadShop()
    }

    const handleShare = () => {
        const shareData = generateShareData('user')

        if (!shareData) {
            alert('店铺数据为空，无法分享')
            return
        }

        if (shareData.productCount === 0) {
            alert('请先添加商品再分享')
            return
        }

        onShare(shareData)
        handleClose()
    }

    const handleQuickAddTemplate = () => {
        DEFAULT_INTERACTION_PRODUCTS.forEach(template => {
            addProduct(
                'user',
                template.name,
                template.description,
                template.price,
                template.image,
                999,
                template.category
            )
        })
        loadShop()
    }

    if (!isOpen) return null

    return (
        <>
            {/* 遮罩层 */}
            <div
                className={`fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            {/* 商城管理面板 */}
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
                            <span className="text-[10px] tracking-[0.2em] text-stone-400">店主</span>
                        </div>
                        <h2 className="text-2xl font-serif text-stone-800 tracking-wide mb-2">{shop?.name}</h2>
                        <p className="text-xs text-stone-500 font-light leading-relaxed max-w-[80%] mx-auto">{shop?.description || '管理你的商品'}</p>
                    </div>

                    {/* 操作按钮栏 */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setShowProductEditor(true)}
                            className="flex-1 py-2.5 bg-stone-800 text-white text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                            添加商品
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-xs tracking-widest uppercase hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            分享
                        </button>
                    </div>
                </div>

                {/* 商品列表 */}
                <div className="flex-1 overflow-y-auto p-6 relative z-10 bg-[#faf8f5]">
                    {!shop || shop.products.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400">
                            <div className="w-16 h-16 border border-dashed border-stone-300 rounded-full flex items-center justify-center mb-4">
                                <span className="font-serif italic text-2xl">空空如也</span>
                            </div>
                            <p className="text-sm font-serif italic text-stone-500 mb-6">开始添加商品吧</p>
                            <button
                                onClick={handleQuickAddTemplate}
                                className="px-6 py-2 border border-stone-300 text-stone-500 text-xs tracking-widest uppercase hover:bg-stone-50 transition-colors"
                            >
                                快速添加模板
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                            {shop.products.map((product) => (
                                <div
                                    key={product.id}
                                    className="group relative"
                                >
                                    {/* 删除按钮 */}
                                    <button
                                        onClick={(e) => handleDeleteProduct(product.id, e)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 hover:border-red-200 transition-colors z-20 shadow-sm opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

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
                                                    <span className="font-serif text-4xl opacity-30 italic">商品</span>
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
                                        <h3 className="font-serif text-stone-800 text-sm truncate">{product.name}</h3>
                                        <p className="text-[10px] text-stone-400 mt-1 truncate font-light">{product.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 商品编辑器 */}
            <ProductEditor
                isOpen={showProductEditor}
                onClose={() => {
                    setShowProductEditor(false)
                    setEditingProduct(null)
                }}
                onSave={handleAddProduct}
                editingProduct={editingProduct}
            />
        </>
    )
}

export default ShopManager
