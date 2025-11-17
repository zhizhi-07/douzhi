import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { addMessage } from '../utils/simpleMessageManager'
import type { Message } from '../types/chat'

interface Product {
  id: string
  name: string
  price: number
  description: string
  sales: number
}

// 模拟商品数据
const PRODUCTS: Product[] = [
  { id: '1', name: '无线蓝牙耳机', price: 199, description: '音质巨好，降噪效果一流，续航持久，佩戴舒适不夹耳，支持快充，通话清晰，适合运动和日常使用', sales: 1234 },
  { id: '2', name: '保温杯', price: 89, description: '保温24小时，304不锈钢材质，密封性好不漏水，大容量设计，外观时尚简约，适合办公室和户外', sales: 856 },
  { id: '3', name: '口红套装', price: 299, description: '5支装，多色可选，滋润不掉色，持久显色，质地细腻，适合各种场合，送礼自用都很棒', sales: 2341 },
  { id: '4', name: '运动鞋', price: 399, description: '透气舒适，减震效果好，时尚百搭，耐磨防滑，轻便设计，适合跑步健身，多种颜色可选', sales: 567 },
  { id: '5', name: '手机壳', price: 29, description: '防摔耐磨，手感好，多款式可选，精准开孔，超薄设计，支持无线充电，保护性强', sales: 3456 },
  { id: '6', name: '零食大礼包', price: 99, description: '10种零食，满足你的味蕾，包含薯片、饼干、糖果等，分量足，适合追剧聚会，性价比超高', sales: 1890 },
  { id: '7', name: '香水', price: 599, description: '持久留香，淡雅清新，适合日常，前调花香中调果香，后调木质香，适合春夏季节使用', sales: 432 },
  { id: '8', name: '背包', price: 159, description: '大容量，多隔层，防水耐用，可放15.6寸笔记本，USB充电口设计，适合上班上学旅行', sales: 789 },
  { id: '9', name: '充电宝', price: 129, description: '20000mAh大容量，快充支持，双USB输出，LED电量显示，轻薄便携，适合出差旅行', sales: 2123 },
  { id: '10', name: '毛绒玩具', price: 79, description: '柔软舒适，可爱造型，送礼佳品，环保材质，可机洗，多种尺寸可选，适合儿童和女生', sales: 1567 },
]

const OnlineShopping = () => {
  const navigate = useNavigate()
  const { id: chatId } = useParams<{ id: string }>()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [cart, setCart] = useState<Product[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customProduct, setCustomProduct] = useState({ name: '', price: '', description: '' })

  // 显示的商品列表
  const displayProducts = searchResults.length > 0 ? searchResults : PRODUCTS

  // 加入购物车
  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product])
    alert(`已加入购物车：${product.name}`)
  }

  // 转发商品
  const forwardProduct = (product: Product) => {
    if (!chatId) return
    
    // 创建商品卡片消息
    const productMessage: Message = {
      id: Date.now(),
      type: 'sent',
      content: `[商品] ${product.name}`,
      aiReadableContent: `用户分享了一个商品：
商品名称：${product.name}
价格：¥${product.price}
商品描述：${product.description}
销量：已售${product.sales}件

这是一个商品卡片，用户可能想让你了解这个商品，或者想要你的意见和建议。`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      messageType: 'productCard',
      productCard: {
        name: product.name,
        price: product.price,
        description: product.description,
        sales: product.sales
      }
    }
    
    // 发送到聊天
    addMessage(chatId, productMessage)
    
    // 返回聊天页面
    navigate(`/chat/${chatId}`)
  }

  // AI搜索商品
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-biaugiqxfopyfosfxpggeqcitfwkwnsgkduvjavygdtpoicm'
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V3',
          messages: [{
            role: 'user',
            content: `你是一个电商平台的商品推荐AI。用户搜索了"${searchQuery}"，请生成10个相关商品。

要求：
1. 商品名称必须包含"${searchQuery}"关键词
2. 提供详细的商品描述（40-60字，包含特点、用途、优势等）
3. 价格范围：1元到10000元
4. 销量随机生成

返回格式（纯JSON数组）：
[{"name":"商品名","price":价格,"description":"描述","sales":销量}]

现在请为"${searchQuery}"生成10个商品：`
          }],
          temperature: 0.8,
          max_tokens: 1500
        })
      })

      if (!response.ok) throw new Error('搜索失败')

      const data = await response.json()
      const content = data.choices[0].message.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      
      if (jsonMatch) {
        const products = JSON.parse(jsonMatch[0])
        setSearchResults(products.slice(0, 10).map((p: any, i: number) => ({
          id: `search-${Date.now()}-${i}`,
          name: p.name,
          price: p.price,
          description: p.description,
          sales: p.sales || 0
        })))
      }
    } catch (error) {
      console.error('搜索失败:', error)
      alert('搜索失败，请重试')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <StatusBar />
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索商品"
              className="w-full px-4 py-2 bg-gray-100 rounded-full text-sm outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setShowCustomModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium whitespace-nowrap active:scale-95 transition-transform"
          >
            自定义
          </button>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {isSearching ? (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>搜索中...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {displayProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm"
                >
                  {/* 商品描述区域 - 正方形 */}
                  <div className="aspect-square p-4 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                    <p className="text-sm text-gray-700 text-center leading-relaxed">
                      {product.description}
                    </p>
                    <button
                      onClick={() => forwardProduct(product)}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm active:scale-95 transition-transform"
                    >
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>

                  {/* 商品信息 */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xs text-red-500">¥</span>
                      <span className="text-lg font-bold text-red-500">{product.price}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      已售 {product.sales}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-medium active:scale-95 transition-transform border border-orange-100"
                    >
                      加入购物车
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {displayProducts.length === 0 && !isSearching && (
              <div className="text-center py-20 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>没有找到相关商品</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 自定义商品弹窗 */}
      {showCustomModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowCustomModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-safe">
            <h3 className="text-lg font-bold mb-4">自定义商品</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">商品名称</label>
                <input
                  type="text"
                  value={customProduct.name}
                  onChange={(e) => setCustomProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入商品名称"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">价格（元）</label>
                <input
                  type="number"
                  value={customProduct.price}
                  onChange={(e) => setCustomProduct(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="请输入价格"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">商品描述</label>
                <textarea
                  value={customProduct.description}
                  onChange={(e) => setCustomProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入商品描述（40-60字）"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-full font-medium active:scale-95 transition-transform"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (!customProduct.name || !customProduct.price || !customProduct.description) {
                      alert('请填写完整信息')
                      return
                    }
                    const newProduct: Product = {
                      id: `custom-${Date.now()}`,
                      name: customProduct.name,
                      price: parseFloat(customProduct.price),
                      description: customProduct.description,
                      sales: 0
                    }
                    forwardProduct(newProduct)
                    setCustomProduct({ name: '', price: '', description: '' })
                    setShowCustomModal(false)
                  }}
                  className="flex-1 py-3 bg-green-500 text-white rounded-full font-medium active:scale-95 transition-transform"
                >
                  转发
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OnlineShopping
