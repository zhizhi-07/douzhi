/**
 * 商品编辑器组件
 * 用于添加/编辑商品
 */

import { useState, useRef } from 'react'
import type { Product } from '../utils/shopManager'

interface ProductEditorProps {
    isOpen: boolean
    onClose: () => void
    onSave: (product: {
        name: string
        description: string
        price: number
        image: string
        stock: number
        category: string
    }) => void
    editingProduct?: Product | null
}

const ProductEditor = ({ isOpen, onClose, onSave, editingProduct }: ProductEditorProps) => {
    const [name, setName] = useState(editingProduct?.name || '')
    const [description, setDescription] = useState(editingProduct?.description || '')
    const [price, setPrice] = useState(editingProduct?.price.toString() || '')
    const [image, setImage] = useState(editingProduct?.image || '')
    const [stock, setStock] = useState(editingProduct?.stock.toString() || '999')
    const [category, setCategory] = useState(editingProduct?.category || '互动')
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            setImage(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSave = () => {
        if (!name.trim() || !price || parseFloat(price) <= 0) {
            alert('请输入商品名称和有效价格')
            return
        }

        onSave({
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
            image,
            stock: parseInt(stock) || 999,
            category: category || '互动'
        })

        // 重置表单
        setName('')
        setDescription('')
        setPrice('')
        setImage('')
        setStock('999')
        setCategory('互动')
    }

    return (
        <>
            {/* 遮罩层 */}
            <div
                className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[60]"
                onClick={onClose}
            />

            {/* 编辑器弹窗 */}
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-[#fffcf9] rounded-sm z-[70] max-w-md mx-auto shadow-2xl border border-[#f0ebe5]">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <span className="text-[10px] tracking-[0.2em] text-stone-400 block mb-2">商品管理</span>
                        <h3 className="text-xl font-serif text-stone-800">
                            {editingProduct ? '编辑商品' : '新建商品'}
                        </h3>
                        <div className="w-8 h-px bg-stone-300 mx-auto my-4"></div>
                    </div>

                    <div className="space-y-5">
                        {/* 图片上传 */}
                        <div className="flex justify-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 bg-stone-50 border border-dashed border-stone-300 rounded-sm flex items-center justify-center cursor-pointer hover:bg-stone-100 transition-colors overflow-hidden relative group"
                            >
                                {image ? (
                                    <>
                                        <img
                                            src={image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs">更换</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <span className="text-2xl text-stone-300 block mb-1">+</span>
                                        <span className="text-[10px] text-stone-400 tracking-wider">图片</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 商品名称 */}
                        <div>
                            <label className="block text-[10px] tracking-widest text-stone-400 mb-1.5">
                                商品名称
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例如：亲亲"
                                className="w-full px-0 py-2 bg-transparent border-b border-stone-200 text-stone-800 placeholder-stone-300 focus:outline-none focus:border-stone-500 transition-colors font-serif"
                            />
                        </div>

                        {/* 商品描述 */}
                        <div>
                            <label className="block text-[10px] tracking-widest text-stone-400 mb-1.5">
                                商品描述
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="介绍一下这个商品..."
                                rows={2}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-sm text-sm text-stone-600 placeholder-stone-300 focus:outline-none focus:border-stone-300 transition-colors resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* 价格 */}
                            <div>
                                <label className="block text-[10px] tracking-widest text-stone-400 mb-1.5">
                                    价格 (¥)
                                </label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-0 py-2 bg-transparent border-b border-stone-200 text-stone-800 placeholder-stone-300 focus:outline-none focus:border-stone-500 transition-colors font-serif"
                                />
                            </div>

                            {/* 库存 */}
                            <div>
                                <label className="block text-[10px] tracking-widest text-stone-400 mb-1.5">
                                    库存
                                </label>
                                <input
                                    type="number"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    placeholder="999"
                                    min="0"
                                    className="w-full px-0 py-2 bg-transparent border-b border-stone-200 text-stone-800 placeholder-stone-300 focus:outline-none focus:border-stone-500 transition-colors font-serif"
                                />
                            </div>
                        </div>

                        {/* 分类 */}
                        <div>
                            <label className="block text-[10px] tracking-widest text-stone-400 mb-1.5">
                                分类
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-sm text-sm text-stone-600 focus:outline-none focus:border-stone-300 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="互动">互动</option>
                                <option value="道具">道具</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>
                    </div>

                    {/* 按钮 */}
                    <div className="flex flex-col gap-3 mt-8">
                        <button
                            onClick={handleSave}
                            className="w-full py-3 bg-stone-800 text-white text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors shadow-lg shadow-stone-200"
                        >
                            保存商品
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-transparent text-stone-400 text-xs tracking-widest uppercase hover:text-stone-600 transition-colors"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProductEditor
